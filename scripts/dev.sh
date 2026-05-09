#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if npm run | grep -qE '^[[:space:]]+dev$'; then
  npm run dev
else
  echo "No npm 'dev' script is configured in package.json." >&2
  exit 1
fi

