# Technical Debt

## Known Debt

- No formal golden fixture suite for crawler and business-map heuristics.
- JSON Schemas are lightweight shape contracts, not complete semantic validators.
- No browser-driven e2e test for the UI.
- No structured logging, metrics, or traces for local debugging.
- No robots.txt handling or crawl politeness policy.
- No CI configuration.

## Candidate Follow-Ups

- Add saved HTML fixtures for deterministic scanner tests.
- Add browser e2e coverage for the analyze flow.
- Add schema validation in the API response path.
- Add docs/check tooling for documentation freshness.
- Decide whether `examples/*.json` are samples or golden outputs.

