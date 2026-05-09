# Agent Guide

This is a Node/Express app that scans public business websites, builds an evidence-backed business
map, and generates an AI-readable agent card.

## Read First

- `README.md`: setup and normal usage.
- `ARCHITECTURE.md`: system boundaries and data flow.
- `docs/index.md`: documentation map.
- `docs/QUALITY.md`: validation and handoff bar.
- `docs/HARNESS.md`: agent efficiency and context-budget rules.
- `WORKFLOW.md`: Symphony workflow states and completion rules.

## Structure

- `server.js`: Express app, static files, `/api/analyze`, `/api/health`.
- `public/`: browser UI.
- `src/`: crawler, business-map, OpenRouter, and agent-card logic.
- `examples/`: generated sample outputs.
- `schemas/`: JSON Schema contracts for output shape.
- `test/`: Node test runner coverage.
- `scripts/`: setup, dev, validation, and healthcheck wrappers.

## Commands

- Setup: `npm run setup`
- Dev: `npm run dev`
- Test: `npm test`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Build: `npm run build`
- Validate: `npm run validate`
- Healthcheck: `npm run healthcheck`

## Environment

The app runs without secrets. Optional OpenRouter refinement uses `OPENROUTER_API_KEY`,
`OPENROUTER_MODEL`, and `OPENROUTER_SITE_URL`. Never commit `.env` or real keys.

## Safe Change Rules

- Do not change scanner, business-map, agent-card, API, route, UI, or copy behavior during harness-only work.
- Treat `src/businessMap.js`, `src/crawler.js`, `src/agentCard.js`, `src/llm*.js`,
  `public/app.js`, and `examples/*.json` as high-caution areas.
- If output behavior changes, update schemas/tests/docs and explain whether `examples/*.json` were regenerated.
- Prefer deterministic tests and fixtures over live network validation.
- Keep `AGENTS.md` short; put deeper source-of-truth context in `docs/`.

