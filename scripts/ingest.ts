/**
 * Loads knowledge/<track>/*.md into Postgres + pgvector.
 *
 * Each file:   "# Topic name" followed by "## Section" blocks.
 * Each "## Section" becomes one chunk (long sections are split by paragraphs).
 * Idempotent: unchanged chunks are skipped, removed ones are deleted.
 *
 *   npm run ingest
 */
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { ensureSchema, getPool, toVectorLiteral } from "../src/lib/db";
import { EMBEDDING_MODEL, embed } from "../src/lib/embeddings";

const KNOWLEDGE_DIR = path.join(process.cwd(), "knowledge");
const MAX_CHUNK_CHARS = 1400;

interface RawChunk {
  track: string;
  topic: string;
  section: string;
  source: string;
  content: string;
  hash: string;
}

function splitLong(text: string): string[] {
  if (text.length <= MAX_CHUNK_CHARS) return [text];
  const parts: string[] = [];
  let buf = "";
  for (const para of text.split(/\n\s*\n/)) {
    if (buf && buf.length + para.length > MAX_CHUNK_CHARS) {
      parts.push(buf.trim());
      buf = "";
    }
    buf += para + "\n\n";
  }
  if (buf.trim()) parts.push(buf.trim());
  return parts;
}

function parseMarkdown(track: string, source: string, md: string): RawChunk[] {
  const topicMatch = md.match(/^#\s+(.+)$/m);
  if (!topicMatch) throw new Error(`${source}: missing "# Topic" heading`);
  const topic = topicMatch[1].trim();

  const chunks: RawChunk[] = [];
  const sections = md.split(/^##\s+/m).slice(1);
  for (const sec of sections) {
    const [headingLine, ...rest] = sec.split("\n");
    const section = headingLine.trim();
    const body = rest.join("\n").trim();
    if (!body) continue;
    for (const piece of splitLong(body)) {
      const content = `${topic} — ${section}\n${piece}`;
      const hash = createHash("sha256")
        .update([EMBEDDING_MODEL, track, topic, section, content].join("\u0000"))
        .digest("hex");
      chunks.push({ track, topic, section, source, content, hash });
    }
  }
  return chunks;
}

async function waitForDb(retries = 30): Promise<void> {
  for (let i = 1; i <= retries; i++) {
    try {
      await getPool().query("SELECT 1");
      return;
    } catch (err) {
      if (i === retries) throw err;
      console.log(`[ingest] waiting for database (${i}/${retries})...`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

async function main() {
  await waitForDb();
  await ensureSchema();
  const pool = getPool();

  const all: RawChunk[] = [];
  for (const track of await readdir(KNOWLEDGE_DIR)) {
    const dir = path.join(KNOWLEDGE_DIR, track);
    let files: string[];
    try {
      files = (await readdir(dir)).filter((f) => f.endsWith(".md"));
    } catch {
      continue;
    }
    for (const f of files.sort()) {
      const md = await readFile(path.join(dir, f), "utf8");
      all.push(...parseMarkdown(track, `${track}/${f}`, md));
    }
  }

  const { rows } = await pool.query<{ content_hash: string }>(`SELECT content_hash FROM kb_chunks`);
  const existing = new Set(rows.map((r) => r.content_hash));
  const wanted = new Set(all.map((c) => c.hash));

  const toDelete = [...existing].filter((h) => !wanted.has(h));
  if (toDelete.length) {
    await pool.query(`DELETE FROM kb_chunks WHERE content_hash = ANY($1::text[])`, [toDelete]);
  }

  const toInsert = all.filter((c) => !existing.has(c.hash));
  console.log(
    `[ingest] ${all.length} chunks in knowledge/, ${toInsert.length} new, ${toDelete.length} removed (model ${EMBEDDING_MODEL})`,
  );

  const BATCH = 16;
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH);
    const vectors = await embed(batch.map((c) => c.content));
    for (let j = 0; j < batch.length; j++) {
      const c = batch[j];
      await pool.query(
        `INSERT INTO kb_chunks (track, topic, section, source, content, content_hash, embedding)
         VALUES ($1, $2, $3, $4, $5, $6, $7::vector)
         ON CONFLICT (content_hash) DO NOTHING`,
        [c.track, c.topic, c.section, c.source, c.content, c.hash, toVectorLiteral(vectors[j])],
      );
    }
    console.log(`[ingest] embedded ${Math.min(i + BATCH, toInsert.length)}/${toInsert.length}`);
  }

  const summary = await pool.query<{ track: string; topics: string; chunks: string }>(
    `SELECT track, COUNT(DISTINCT topic)::text AS topics, COUNT(*)::text AS chunks
       FROM kb_chunks GROUP BY track ORDER BY track`,
  );
  for (const r of summary.rows) console.log(`[ingest] ${r.track}: ${r.topics} topics, ${r.chunks} chunks`);
  await pool.end();
}

main().catch((err) => {
  console.error("[ingest] failed:", err);
  process.exit(1);
});
