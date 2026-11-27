import type { Track, TranscriptEntry } from "./types";

/** Interview topics per track. The interviewer's `topic` field must be one of these. */
export const TOPICS: Record<Track, string[]> = {
  java: [
    "Core Java and OOP",
    "Java Collections",
    "Java Concurrency",
    "JVM Internals and Performance",
    "Modern Java and Streams",
    "Spring and Spring Boot",
  ],
  ml: [
    "ML Fundamentals",
    "Model Evaluation Metrics",
    "Classical ML Algorithms",
    "Deep Learning",
    "Transformers and LLMs",
    "MLOps and Production ML",
  ],
};

export function coveredTopics(transcript: TranscriptEntry[]): string[] {
  const seen = new Set<string>();
  for (const e of transcript) if (e.role === "interviewer" && e.topic) seen.add(e.topic);
  return [...seen];
}

/** Question/answer pairs: each candidate answer with the interviewer turn it responded to. */
export function answeredPairs(transcript: TranscriptEntry[]) {
  const pairs: { topic: string; question: string; answer: string; grade?: TranscriptEntry["grade"] }[] = [];
  let lastQ: TranscriptEntry | undefined;
  for (const e of transcript) {
    if (e.role === "interviewer") lastQ = e;
    else if (lastQ) pairs.push({ topic: lastQ.topic ?? "General", question: lastQ.text, answer: e.text, grade: e.grade });
  }
  return pairs;
}

export interface TurnContext {
  topics: string[];
  covered: string[];
  currentTopic?: string;
  nextTopic?: string;
}

/** Interview state for the next turn: covered topics, the current one, and a suggested next one. */
export function buildTurnContext(track: Track, transcript: TranscriptEntry[]): TurnContext {
  const topics = TOPICS[track];
  const covered = coveredTopics(transcript);
  const currentTopic = [...transcript].reverse().find((e) => e.role === "interviewer")?.topic;
  const uncovered = topics.filter((t) => !covered.includes(t));
  const nextTopic = uncovered.length ? uncovered[Math.floor(Math.random() * uncovered.length)] : undefined;
  return { topics, covered, currentTopic, nextTopic };
}
