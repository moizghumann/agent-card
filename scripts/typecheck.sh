#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

HAS_TYPESCRIPT=$(find . -path ./node_modules -prune -o \( -name '*.ts' -o -name '*.tsx' \) -print -quit)

if [[ -f tsconfig.json ]] || [[ -n "$HAS_TYPESCRIPT" ]]; then
  if ! command -v npx >/dev/null 2>&1; then
    echo "npx is required to run TypeScript checks." >&2
    exit 1
  fi

  npx tsc --noEmit
else
  echo "No TypeScript sources or tsconfig.json found; typecheck not applicable."
fi
