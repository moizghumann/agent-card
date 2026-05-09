#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Running healthcheck..."
bash scripts/agent-healthcheck.sh

echo "Running lint..."
bash scripts/lint.sh

echo "Running typecheck..."
bash scripts/typecheck.sh

echo "Running tests..."
npm test

echo "Running build..."
bash scripts/build.sh

echo "Validation completed."
