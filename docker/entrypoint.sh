#!/bin/sh
set -e
exec npx next start -H "${HOSTNAME:-0.0.0.0}" -p "${PORT:-3000}"
