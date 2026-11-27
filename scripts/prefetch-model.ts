// Downloads the embedding model into HF_CACHE_DIR so the container works offline at runtime.
import { EMBEDDING_MODEL, embed } from "../src/lib/embeddings";

embed(["warm up"])
  .then((v) => console.log(`[prefetch] ${EMBEDDING_MODEL} ready (dim=${v[0].length})`))
  .catch((err) => {
    console.error("[prefetch] failed:", err);
    process.exit(1);
  });
