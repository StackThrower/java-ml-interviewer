import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import { parseJSON } from "./claude";
import { FEEDBACK_SYSTEM_PROMPT, INTERVIEWER_SYSTEM_PROMPT } from "./prompts";
import { answeredPairs, type TurnContext } from "./topics";
import {
  ANSWER_GRADES,
  TRACKS,
  type AnswerGrade,
  type Feedback,
  type Level,
  type Recommendation,
  type Track,
  type TranscriptEntry,
  type TurnKind,
  type TurnResponse,
} from "./types";

const MAX_FOLLOW_UPS = 2;

function fmtTime(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function enumOf(values: readonly string[]) {
  return z.enum(values as [string, ...string[]]);
}

// ---------------------------------------------------------------- turn ----

export interface TurnInput {
  track: Track;
  level: Level;
  transcript: TranscriptEntry[];
  elapsedSec: number;
  durationSec: number;
  timeUp: boolean;
  ctx: TurnContext;
}

function followUpsOnCurrentTopic(transcript: TranscriptEntry[], topic?: string): number {
  if (!topic) return 0;
  let n = 0;
  for (let i = transcript.length - 1; i >= 0; i--) {
    const e = transcript[i];
    if (e.role !== "interviewer") continue;
    if (e.topic !== topic) break;
    n++;
  }
  return Math.max(0, n - 1);
}

type Mode = "open" | "must_move_on" | "last_question" | "close";

function decideMode(input: TurnInput): Mode {
  const remaining = input.durationSec - input.elapsedSec;
  if (input.timeUp || remaining <= 20) return "close";
  if (remaining <= 90) return "last_question";
  const f = followUpsOnCurrentTopic(input.transcript, input.ctx.currentTopic);
  return f >= MAX_FOLLOW_UPS ? "must_move_on" : "open";
}

function buildTurnMessages(input: TurnInput, mode: Mode): Anthropic.MessageParam[] {
  const { track, level, transcript, elapsedSec, durationSec, ctx } = input;

  const instruction = {
    open:
      transcript.length === 0
        ? "Greet the candidate in one short sentence (introduce yourself as Whiskers), then ask your first question."
        : "Grade the last answer, then either follow up on it or move to a new topic.",
    must_move_on: `Grade the last answer. You already asked enough follow-ups on "${ctx.currentTopic}": move to a NEW topic now${ctx.nextTopic ? ` (suggested: ${ctx.nextTopic})` : ""}.`,
    last_question: "Grade the last answer. Less than 90 seconds left: ask one final short question.",
    close:
      "Grade the last answer. TIME IS UP: thank the candidate warmly in one or two sentences and say feedback is being prepared. Do NOT ask a question and do NOT comment on their answers.",
  }[mode];

  const state = [
    `Role: ${TRACKS[track]}, declared level: ${level}`,
    `Time: ${fmtTime(elapsedSec)} of ${fmtTime(durationSec)} used`,
    `Topics covered: ${ctx.covered.join(", ") || "none yet"}`,
    ctx.currentTopic ? `Current topic: ${ctx.currentTopic}` : "",
    ctx.nextTopic ? `Suggested next topic: ${ctx.nextTopic}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: "[The candidate has joined the voice call.]" },
  ];
  for (const e of transcript) {
    if (e.role === "interviewer") {
      // History uses the same JSON shape the model produces (append-only, so the prompt cache holds).
      messages.push({
        role: "assistant",
        content: JSON.stringify({ say: e.text, kind: e.kind ?? "question", topic: e.topic ?? "" }),
      });
    } else {
      messages.push({ role: "user", content: `Candidate answer: ${e.text}` });
    }
  }

  const tail = `<interview_state>\n${state}\n</interview_state>\n${instruction}`;
  const last = messages[messages.length - 1];
  if (last.role === "user" && typeof last.content === "string") last.content = `${last.content}\n\n${tail}`;
  else messages.push({ role: "user", content: tail });
  return messages;
}

export async function nextInterviewerTurn(input: TurnInput): Promise<TurnResponse> {
  const mode = decideMode(input);
  const { topics, currentTopic } = input.ctx;
  const hasAnswer = input.transcript.at(-1)?.role === "candidate";

  // The schema enforces the interview rules, so a small model cannot break them.
  const kinds: TurnKind[] =
    mode === "close"
      ? ["closing"]
      : mode === "must_move_on" || input.transcript.length === 0
        ? ["question"]
        : ["question", "follow_up"];
  let allowedTopics = topics;
  if (mode === "must_move_on" && currentTopic) {
    const others = topics.filter((t) => t !== currentTopic);
    if (others.length) allowedTopics = others;
  }
  const topic = allowedTopics.length ? enumOf(allowedTopics) : z.string();

  // Property order = generation order: judge the answer first, then respond.
  const base = { say: z.string().min(1), kind: enumOf(kinds), topic };
  const schema = hasAnswer
    ? z.object({ answer_grade: enumOf(ANSWER_GRADES), ...base })
    : z.object(base);

  const out = (await parseJSON({
    system: INTERVIEWER_SYSTEM_PROMPT,
    messages: buildTurnMessages(input, mode),
    schema,
    effort: "low", // voice turns must be quick
    maxTokens: 4000,
  })) as { answer_grade?: AnswerGrade; say: string; kind: TurnKind; topic: string };

  return { say: out.say.trim(), kind: out.kind, topic: out.topic, answer_grade: out.answer_grade };
}

// ------------------------------------------------------------ feedback ----

const GRADE_POINTS: Record<AnswerGrade, number> = { strong: 9, good: 7, partial: 5, weak: 3, no_answer: 1 };

function recommendationFor(score: number, answered: number): Recommendation {
  let rec: Recommendation =
    score >= 8.5 ? "strong_hire" : score >= 7 ? "hire" : score >= 6 ? "lean_hire" : score >= 4.5 ? "lean_no_hire" : "no_hire";
  // Too little evidence for a confident call either way.
  if (answered < 3) rec = score >= 6 ? "lean_hire" : "lean_no_hire";
  return rec;
}

function levelFor(score: number, level: Level): string {
  const L = level[0].toUpperCase() + level.slice(1);
  if (score >= 8.5) return `Above ${L} expectations`;
  if (score >= 7) return `Solid ${L}`;
  if (score >= 5.5) return `Approaching ${L}`;
  return `Below ${L} expectations`;
}

export async function generateFeedback(input: {
  track: Track;
  level: Level;
  transcript: TranscriptEntry[];
  elapsedSec: number;
}): Promise<Feedback> {
  const pairs = answeredPairs(input.transcript);
  const graded = pairs.map((p) => ({ ...p, grade: p.grade ?? "partial" }));

  // ---- scores: computed deterministically from per-answer grades ----
  const byTopic = new Map<string, number[]>();
  for (const p of graded) byTopic.set(p.topic, [...(byTopic.get(p.topic) ?? []), GRADE_POINTS[p.grade]]);
  const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const all = graded.map((p) => GRADE_POINTS[p.grade]);
  const overall = all.length ? mean(all) : 1;
  const topicNames = [...byTopic.keys()];

  if (pairs.length === 0) {
    return {
      overall_score: 1,
      recommendation: "no_hire",
      estimated_level: "Not enough evidence",
      summary: "The interview ended before any questions were answered, so there is nothing to evaluate yet.",
      strengths: ["You showed up and started the interview."],
      improvements: ["Answer at least a few questions so your skills can be assessed."],
      topics: [],
      study_plan: ["Start a new interview and try to answer every question, even partially."],
    };
  }

  // ---- narrative: written by the LLM from graded evidence ----
  const evidence = graded
    .map(
      (p, i) =>
        `${i + 1}. [${p.topic}] grade=${p.grade}\n   Q: ${p.question}\n   A: ${p.answer}`,
    )
    .join("\n");

  // Lists are trimmed in code rather than with maxItems.
  const schema = z.object({
    summary: z.string(),
    strengths: z.array(z.string()).min(1),
    improvements: z.array(z.string()).min(1),
    topics: z.array(z.object({ topic: enumOf(topicNames), comment: z.string() })),
    study_plan: z.array(z.string()).min(1),
  });

  const user = `Role: ${TRACKS[input.track]}, declared level: ${input.level}, duration ${fmtTime(input.elapsedSec)}.
Overall result (already decided): ${overall.toFixed(1)}/10, ${levelFor(overall, input.level)}.

Graded answers (grades: strong > good > partial > weak > no_answer):
${evidence}

Write the feedback JSON:
- strengths: only from answers graded good or strong. If there are none, mention honest communication or partial knowledge you actually saw.
- improvements: from answers graded partial, weak or no_answer — name the concept that was missing.
- topics: one short comment for each of these topics: ${topicNames.join(", ")}.
- study_plan: concrete concepts to study, most important first.`;

  const out = await parseJSON({
    system: FEEDBACK_SYSTEM_PROMPT,
    messages: [{ role: "user", content: user }],
    schema,
    effort: "high",
    maxTokens: 16000,
  });

  const comments = new Map(out.topics.map((t) => [t.topic, t.comment]));
  return {
    overall_score: Math.max(1, Math.min(10, Math.round(overall))),
    recommendation: recommendationFor(overall, pairs.length),
    estimated_level: levelFor(overall, input.level),
    summary: out.summary,
    strengths: out.strengths.slice(0, 4),
    improvements: out.improvements.slice(0, 4),
    topics: topicNames.map((t) => ({
      topic: t,
      score: Math.round(mean(byTopic.get(t)!)),
      comment: comments.get(t) ?? "",
    })),
    study_plan: out.study_plan.slice(0, 5),
  };
}
