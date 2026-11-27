import { getPool, toVectorLiteral } from "./db";
import { embedOne } from "./embeddings";
import type { Level, Track, TranscriptEntry } from "./types";

export interface Chunk {
  topic: string;
  section: string;
  content: string;
  score?: number;
}

export async function listTopics(track: Track): Promise<string[]> {
  const { rows } = await getPool().query<{ topic: string }>(
    `SELECT DISTINCT topic FROM kb_chunks WHERE track = $1 ORDER BY topic`,
    [track],
  );
  return rows.map((r) => r.topic);
}

export async function retrieve(
  track: Track,
  query: string,
  k: number,
  opts: { topic?: string; excludeSections?: string[] } = {},
): Promise<Chunk[]> {
  const vec = toVectorLiteral(await embedOne(query));
  const params: unknown[] = [vec, track, k];
  let filters = "";
  if (opts.topic) {
    params.push(opts.topic);
    filters += ` AND topic = $${params.length}`;
  }
  if (opts.excludeSections?.length) {
    params.push(opts.excludeSections);
    filters += ` AND section <> ALL($${params.length}::text[])`;
  }
  const { rows } = await getPool().query<Chunk>(
    `SELECT topic, section, content, 1 - (embedding <=> $1::vector) AS score
       FROM kb_chunks
      WHERE track = $2 ${filters}
      ORDER BY embedding <=> $1::vector
      LIMIT $3`,
    params,
  );
  return rows;
}

/** Fetches a named section of a topic directly (no vector search). */
async function section(track: Track, topic: string, name: string): Promise<Chunk | undefined> {
  const { rows } = await getPool().query<Chunk>(
    `SELECT topic, section, content FROM kb_chunks WHERE track = $1 AND topic = $2 AND section = $3 LIMIT 1`,
    [track, topic, name],
  );
  return rows[0];
}

/** Keeps only the line for the candidate's level from a "Core questions" section. */
function forLevel(chunk: Chunk | undefined, level: Level): Chunk | undefined {
  if (!chunk) return undefined;
  const prefix = `${level[0].toUpperCase()}${level.slice(1)}:`;
  const line = chunk.content.split("\n").find((l) => l.startsWith(prefix));
  return line ? { ...chunk, content: line } : chunk;
}

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
  followUpChunks: Chunk[];
  nextTopic?: string;
  nextTopicChunks: Chunk[];
}

/**
 * Retrieves two kinds of grounding for the next interviewer turn:
 *  1. material close to the candidate's last answer (for a follow-up question),
 *  2. material for a not-yet-covered topic (in case the interviewer moves on).
 */
export async function buildTurnContext(
  track: Track,
  level: Level,
  transcript: TranscriptEntry[],
): Promise<TurnContext> {
  const topics = await listTopics(track);
  const covered = coveredTopics(transcript);

  const lastInterviewer = [...transcript].reverse().find((e) => e.role === "interviewer");
  const lastAnswer = transcript.at(-1)?.role === "candidate" ? transcript.at(-1)!.text : undefined;
  const currentTopic = lastInterviewer?.topic;

  // Follow-up material: the topic's curated "Follow-up probes" + the chunk closest to the answer.
  const followUpChunks: Chunk[] = [];
  if (lastAnswer && lastInterviewer && currentTopic && topics.includes(currentTopic)) {
    const probes = await section(track, currentTopic, "Follow-up probes");
    if (probes) followUpChunks.push(probes);
    const near = await retrieve(track, `${lastInterviewer.text}\n${lastAnswer}`, 1, {
      topic: currentTopic,
      excludeSections: ["Follow-up probes", "Core questions"],
    });
    followUpChunks.push(...near);
  }

  // Next-topic material: that topic's core questions for the declared level.
  const uncovered = topics.filter((t) => !covered.includes(t));
  const nextTopic = uncovered.length
    ? uncovered[Math.floor(Math.random() * uncovered.length)]
    : undefined;
  const core = nextTopic ? forLevel(await section(track, nextTopic, "Core questions"), level) : undefined;
  const nextTopicChunks = core ? [core] : [];

  return { topics, covered, currentTopic, followUpChunks, nextTopic, nextTopicChunks };
}

/** "Key concepts" of the given topics — reference material for the study plan. */
export async function studyNotes(track: Track, topics: string[]): Promise<Chunk[]> {
  if (topics.length === 0) return [];
  const { rows } = await getPool().query<Chunk>(
    `SELECT DISTINCT ON (topic) topic, section, content FROM kb_chunks
      WHERE track = $1 AND topic = ANY($2::text[]) AND section = 'Key concepts'
      ORDER BY topic, id`,
    [track, topics],
  );
  return rows;
}

export function formatChunks(chunks: Chunk[], maxChars = Infinity): string {
  return chunks
    .map((c) => {
      const text = c.content.trim();
      const body = text.length > maxChars ? `${text.slice(0, maxChars).replace(/\s+\S*$/, "")}…` : text;
      return `<doc topic="${c.topic}" section="${c.section}">\n${body}\n</doc>`;
    })
    .join("\n");
}
