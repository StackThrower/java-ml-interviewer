import path from "node:path";
import { env, pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";

// Local, free sentence embeddings (384-dim) — no extra API key needed.
// The model (~23 MB) is downloaded once into HF_CACHE_DIR (pre-fetched in the Docker image).
export const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL ?? "Xenova/all-MiniLM-L6-v2";

env.cacheDir = process.env.HF_CACHE_DIR ?? path.join(process.cwd(), ".cache", "hf");

const globalForEmb = globalThis as unknown as { __embedder?: Promise<FeatureExtractionPipeline> };

function getEmbedder(): Promise<FeatureExtractionPipeline> {
  if (!globalForEmb.__embedder) {
    globalForEmb.__embedder = pipeline("feature-extraction", EMBEDDING_MODEL, {
      dtype: "fp32",
    }) as Promise<FeatureExtractionPipeline>;
    globalForEmb.__embedder.catch(() => {
      globalForEmb.__embedder = undefined;
    });
  }
  return globalForEmb.__embedder;
}

export async function embed(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const extractor = await getEmbedder();
  const output = await extractor(texts, { pooling: "mean", normalize: true });
  return output.tolist() as number[][];
}

export async function embedOne(text: string): Promise<number[]> {
  const [v] = await embed([text]);
  return v;
}
