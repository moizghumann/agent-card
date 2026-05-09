#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f package.json ]]; then
  echo "Missing package.json; cannot run npm setup." >&2
  exit 1
fi

if [[ -f package-lock.json ]]; then
  npm install
else
  echo "No package-lock.json found; running npm install." >&2
  npm install
fi

