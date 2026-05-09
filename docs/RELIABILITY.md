# Reliability

## Current Behavior

- `src/crawler.js` uses a 12 second request timeout.
- Crawling is limited by `maxPages`, defaulting to 8 and clamped from 2 to 12.
- Failed individual pages become scan warnings unless every page fails.
- If no readable HTML page is scanned, the API returns a `NO_READABLE_PAGES` error.
- OpenRouter failures fall back to deterministic map/card generation and add warnings.

## Validation Signals

- `npm run healthcheck` checks required files, JavaScript syntax, and example output shape.
- `npm test` runs deterministic unit/schema tests.
- `npm run validate` runs healthcheck, lint, typecheck, tests, and build.

## Known Reliability Risks

- Live business websites may block fetches, redirect unexpectedly, or change markup.
- JavaScript-rendered content is not rendered by the current crawler.
- Example outputs are generated from live websites and may drift over time.

