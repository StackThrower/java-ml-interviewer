#!/bin/sh
set -e
# Sync knowledge/ into pgvector (idempotent: only new/changed chunks are embedded).
npx tsx scripts/ingest.ts
exec npx next start -H "${HOSTNAME:-0.0.0.0}" -p "${PORT:-3000}"
