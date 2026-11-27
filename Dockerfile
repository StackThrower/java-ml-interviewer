# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    HF_CACHE_DIR=/app/.cache/hf \
    # onnxruntime-node ships CPU binaries in the npm package; skip optional CUDA downloads
    ONNXRUNTIME_NODE_INSTALL=skip

# ---- dependencies ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---- build ----
FROM deps AS build
COPY . .
RUN npm run build
# Bake the embedding model into the image so the container works offline.
RUN npx tsx scripts/prefetch-model.ts \
 # Drop onnxruntime binaries for other OSes and the unused web runtime (~400 MB).
 && rm -rf node_modules/onnxruntime-node/bin/napi-v6/darwin node_modules/onnxruntime-node/bin/napi-v6/win32 \
           node_modules/onnxruntime-web

# ---- runtime ----
FROM base AS runner
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/package.json /app/package-lock.json /app/next.config.ts /app/tsconfig.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build --chown=node:node /app/.cache ./.cache
COPY --from=build --chown=node:node /app/src ./src
COPY --from=build --chown=node:node /app/scripts ./scripts
COPY --from=build --chown=node:node /app/knowledge ./knowledge
COPY --from=build --chown=node:node /app/docker ./docker
USER node
EXPOSE 3000
CMD ["sh", "docker/entrypoint.sh"]
