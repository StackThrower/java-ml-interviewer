import pg from "pg";

const globalForPg = globalThis as unknown as { __pgPool?: pg.Pool };

export function getPool(): pg.Pool {
  if (!globalForPg.__pgPool) {
    const connectionString =
      process.env.DATABASE_URL ?? "postgres://interviewer:interviewer@localhost:5432/interviewer";
    globalForPg.__pgPool = new pg.Pool({ connectionString, max: 5 });
  }
  return globalForPg.__pgPool;
}

export const EMBEDDING_DIM = 384;

export async function ensureSchema(pool: pg.Pool = getPool()): Promise<void> {
  await pool.query(`CREATE EXTENSION IF NOT EXISTS vector`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS kb_chunks (
      id           SERIAL PRIMARY KEY,
      track        TEXT NOT NULL,
      topic        TEXT NOT NULL,
      section      TEXT NOT NULL,
      source       TEXT NOT NULL,
      content      TEXT NOT NULL,
      content_hash TEXT NOT NULL UNIQUE,
      embedding    vector(${EMBEDDING_DIM}) NOT NULL
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS kb_chunks_embedding_idx ON kb_chunks USING hnsw (embedding vector_cosine_ops)`,
  );
  await pool.query(`CREATE INDEX IF NOT EXISTS kb_chunks_track_idx ON kb_chunks (track, topic)`);
}

/** pgvector literal: '[0.1,0.2,...]' */
export function toVectorLiteral(v: number[]): string {
  return `[${v.join(",")}]`;
}
