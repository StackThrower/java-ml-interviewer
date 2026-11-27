import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { ClaudeError } from "./claude";
import { isGrade, isLevel, isTrack, type TranscriptEntry, type Level, type Track } from "./types";

export const DURATION_SEC = Number(process.env.INTERVIEW_DURATION_SEC ?? 600);

const MAX_ENTRIES = 200;
const MAX_TEXT = 4000;

export function parseInterviewBody(body: unknown):
  | { ok: true; track: Track; level: Level; transcript: TranscriptEntry[]; elapsedSec: number; timeUp: boolean }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid JSON body" };
  const b = body as Record<string, unknown>;
  if (!isTrack(b.track)) return { ok: false, error: "track must be 'java' or 'ml'" };
  if (!isLevel(b.level)) return { ok: false, error: "level must be junior, middle or senior" };
  if (!Array.isArray(b.transcript) || b.transcript.length > MAX_ENTRIES)
    return { ok: false, error: "transcript must be an array" };

  const transcript: TranscriptEntry[] = [];
  for (const raw of b.transcript) {
    const e = raw as Record<string, unknown>;
    if ((e.role !== "interviewer" && e.role !== "candidate") || typeof e.text !== "string")
      return { ok: false, error: "invalid transcript entry" };
    transcript.push({
      role: e.role,
      text: e.text.slice(0, MAX_TEXT),
      topic: typeof e.topic === "string" ? e.topic.slice(0, 100) : undefined,
      kind: e.kind === "question" || e.kind === "follow_up" || e.kind === "closing" ? e.kind : undefined,
      grade: isGrade(e.grade) ? e.grade : undefined,
    });
  }
  const elapsedSec = Math.max(0, Math.min(Number(b.elapsedSec) || 0, DURATION_SEC * 2));
  return { ok: true, track: b.track, level: b.level, transcript, elapsedSec, timeUp: b.timeUp === true };
}

export function errorResponse(err: unknown): NextResponse {
  console.error(err);
  if (err instanceof ClaudeError) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
  if (err instanceof Anthropic.AuthenticationError) {
    return NextResponse.json({ error: "Invalid or missing ANTHROPIC_API_KEY." }, { status: 500 });
  }
  if (err instanceof Anthropic.RateLimitError) {
    return NextResponse.json({ error: "Claude API rate limit hit — please retry in a moment." }, { status: 429 });
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return NextResponse.json({ error: "Can't reach the Claude API — check your network." }, { status: 502 });
  }
  if (err instanceof Anthropic.APIError) {
    return NextResponse.json({ error: `Claude API error ${err.status ?? ""}: ${err.message}` }, { status: 502 });
  }
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
