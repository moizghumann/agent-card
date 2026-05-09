#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f tsconfig.json ]] || find . -path ./node_modules -prune -o \( -name '*.ts' -o -name '*.tsx' \) -print -quit | grep -q .; then
  if command -v tsc >/dev/null 2>&1; then
    tsc --noEmit
  else
    echo "TypeScript files or tsconfig.json detected, but 'tsc' is not installed." >&2
    exit 1
  fi
else
  echo "No TypeScript sources or tsconfig.json found; typecheck not applicable."
fi
