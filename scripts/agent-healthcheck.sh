#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Checking required files..."
for file in package.json server.js public/index.html src/analyzeBusinessUrl.js README.md ARCHITECTURE.md; do
  if [[ ! -f "$file" ]]; then
    echo "Missing required file: $file" >&2
    exit 1
  fi
done

echo "Checking package metadata..."
node -e "const p=require('./package.json'); if (p.type !== 'module') throw new Error('Expected package.json type=module'); if (!p.scripts?.dev) throw new Error('Missing dev script');"

echo "Checking JavaScript syntax..."
node scripts/lint-js.js

echo "Checking example output shape..."
node --test test/examples.test.js

echo "Agent healthcheck passed."
