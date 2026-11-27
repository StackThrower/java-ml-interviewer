export type Track = "java" | "ml";
export type Level = "junior" | "middle" | "senior";

export const TRACKS: Record<Track, string> = {
  java: "Java Developer",
  ml: "Machine Learning Engineer",
};

export const LEVELS: Level[] = ["junior", "middle", "senior"];

export interface TranscriptEntry {
  role: "interviewer" | "candidate";
  text: string;
  /** Topic the interviewer was asking about (interviewer entries only). */
  topic?: string;
  /** Kind of interviewer turn (interviewer entries only). */
  kind?: TurnKind;
  /** How good the answer was, judged by the interviewer on its next turn (candidate entries only). */
  grade?: AnswerGrade;
}

export type TurnKind = "question" | "follow_up" | "closing";

export const ANSWER_GRADES = ["strong", "good", "partial", "weak", "no_answer"] as const;
export type AnswerGrade = (typeof ANSWER_GRADES)[number];

export function isGrade(v: unknown): v is AnswerGrade {
  return typeof v === "string" && (ANSWER_GRADES as readonly string[]).includes(v);
}

export interface TurnRequest {
  track: Track;
  level: Level;
  transcript: TranscriptEntry[];
  elapsedSec: number;
  /** Set when the 10-minute clock ran out while the candidate was answering. */
  timeUp?: boolean;
}

export interface TurnResponse {
  say: string;
  kind: TurnKind;
  topic: string;
  /** Grade of the candidate's last answer (absent on the first turn). */
  answer_grade?: AnswerGrade;
}

export interface FeedbackRequest {
  track: Track;
  level: Level;
  transcript: TranscriptEntry[];
  elapsedSec: number;
}

export type Recommendation = "strong_hire" | "hire" | "lean_hire" | "lean_no_hire" | "no_hire";

export interface Feedback {
  overall_score: number;
  recommendation: Recommendation;
  estimated_level: string;
  summary: string;
  strengths: string[];
  improvements: string[];
  topics: { topic: string; score: number; comment: string }[];
  study_plan: string[];
}

export function isTrack(v: unknown): v is Track {
  return v === "java" || v === "ml";
}

export function isLevel(v: unknown): v is Level {
  return v === "junior" || v === "middle" || v === "senior";
}
