# Architecture Note

## App Overview

Business Agent Card Scanner is a Node/Express app with a static frontend. It accepts a public business URL, crawls a limited set of same-site HTML pages, extracts evidence, builds a business map, and generates an AI-readable agent card. OpenRouter is optional and only runs after deterministic evidence extraction.

There is no visible database, account system, or server-rendered UI framework in the current repo.

## Main Folders

- `public/`: static client UI (`index.html`, `styles.css`, `app.js`).
- `src/`: application logic for URL normalization, crawling, text cleanup, business-map creation, optional LLM refinement, and agent-card generation.
- `scripts/`: CLI utilities and agent harness wrappers.
- `examples/`: generated JSON outputs for real public business websites.
- `docs/`: lightweight product and quality documentation.

## Scan Flow

The app runs an Express server with a static frontend. `POST /api/analyze` accepts a public URL and calls `analyzeBusinessUrl()`.

The scanner normalizes the URL, blocks private hosts, fetches HTML pages with a timeout, and crawls same-site links up to a page limit. It prioritizes likely business pages such as contact, pricing, services, products, about, menu, shop, booking, support, and FAQ. For each page it extracts titles, meta descriptions, headings, visible text, links, buttons, forms, and basic JSON-LD fields.

## Important Modules

- `server.js`: Express server, static assets, JSON body parsing, `/api/analyze`, `/api/health`.
- `src/analyzeBusinessUrl.js`: orchestrates normalize -> crawl -> deterministic map -> optional LLM map refinement -> optional LLM card generation.
- `src/url.js`: public URL validation, private-host blocking, same-site checks.
- `src/crawler.js`: HTML fetching, crawl queue, Cheerio parsing, link/form/JSON-LD extraction.
- `src/businessMap.js`: deterministic evidence collector and map heuristics.
- `src/agentCard.js`: deterministic agent-card generation from a business map.
- `src/openRouter.js`: OpenRouter JSON call helper.
- `src/llmBusinessMap.js`: optional LLM map refinement plus sanitizer.
- `src/llmAgentCard.js`: optional LLM card generation plus sanitizer.
- `src/env.js`: minimal `.env` loader.
- `public/app.js`: browser-side form submission and result rendering.

## Business Map Creation

`createBusinessMap()` turns crawl output into structured observations:

- pages found and whether each was scanned
- business name, description, and likely type
- products or services inferred from headings and relevant snippets
- customer actions inferred from links, buttons, and forms
- tools/forms/links such as contact forms, auth links, booking links, carts, checkout, social links
- visible contact, payment, auth, location, and hours signals
- missing or unclear facts

Each important finding stores evidence IDs. The evidence index contains a source URL and short quote. If the scanner cannot prove something, it leaves the field unknown or adds a missing/unclear note.

When `OPENROUTER_API_KEY` is configured, `enhanceBusinessMapWithLlm()` sends the deterministic map and evidence index to OpenRouter for refinement. The LLM is constrained to keep the same business-map shape, cite existing evidence IDs, and mark unsupported facts as unknown. A sanitizer rejects evidence IDs that do not exist and falls back to deterministic values when the model output is malformed.

## Agent Card Generation

`generateAgentCard()` only reads the business map. It does not rescan pages and does not invent capabilities. Customer actions become agent capabilities only when the business map found supporting evidence. The card also includes source evidence, unknowns, recommended follow-up questions, and a safe automation policy requiring human approval for form submission, purchase, account creation, payment, or message sending.

When OpenRouter is configured, `generateAgentCardWithOptionalLlm()` asks the model to create the final card from the refined business map and a deterministic baseline schema. A sanitizer keeps the evidence index from the map, blocks capabilities that were not present in the map, and preserves the human-approval safety policy.

## Data Flow

1. Browser submits `{ url, options }` to `POST /api/analyze`.
2. Server validates and normalizes the URL.
3. Crawler fetches readable public HTML pages on the same site, up to the configured page limit.
4. Deterministic code extracts page facts, forms, links, visible text, and structured data.
5. `createBusinessMap()` creates findings and an evidence index.
6. If `OPENROUTER_API_KEY` is configured and `options.useLlm !== false`, OpenRouter may refine the map. Sanitizers preserve schema and evidence constraints.
7. Agent card is generated from the final business map.
8. Browser renders the business map and formatted agent-card JSON.

## API, Client, And Server Boundaries

The server exposes only JSON API endpoints and static files. The frontend does not crawl websites directly; it calls the server. The scanner runs server-side because it uses Node fetch, Cheerio, and environment variables.

The API response shape is not enforced by a JSON Schema yet. Current examples in `examples/` serve as reference outputs, not formal golden tests.

## Auth And Session Model

No app-level authentication, authorization, cookies, or session storage are visible in the repo.

The generated agent card contains safety instructions for downstream agents, but those are output data, not server auth controls.

## Database And Storage Model

No database or persistent storage layer is visible. Analyses are computed per request and returned to the caller. Example outputs are static JSON files committed/generated under `examples/`.

## External Integrations

- Public business websites are fetched over HTTP(S).
- OpenRouter is optional via `OPENROUTER_API_KEY`.
- No MCP tools are directly integrated in the runtime app.

## Dependency Rules Inferred From Current Structure

- `server.js` may import from `src/`, but `public/` should remain browser-only static assets.
- `src/crawler.js` owns network fetching and HTML parsing.
- `src/businessMap.js` owns deterministic heuristics and evidence IDs.
- `src/agentCard.js` should depend on the business map, not raw crawled pages.
- LLM modules should consume already-extracted map/evidence data and sanitize outputs before returning them.
- Documentation and harness scripts should not import or mutate product modules.

## Deterministic Code vs LLMs

The implementation is deterministic-first:

- crawling, page selection, parsing, evidence extraction, map construction, and card generation are all code-based
- no LLM is required to run the app
- OpenRouter is optional and receives only already-extracted map/evidence data
- model output is sanitized against the evidence index before it reaches the UI

The intended contract is: deterministic code gathers evidence, the LLM may improve organization and phrasing, and validation prevents unevidenced claims from becoming agent capabilities.

## Where MCP / Tools Fit Later

MCP tools would fit as capability adapters around the agent card:

- browser automation for deeper interactive flows, screenshots, and client-rendered pages
- search tools for discovering official profiles or docs when the site is sparse
- payment, CRM, calendar, email, or support tools for verified downstream actions
- structured extraction tools for PDFs, menus, product catalogs, and schema validation

The card should remain the contract: tools may enrich evidence, but downstream capabilities stay unavailable until the map proves them.

## Next 7 Days

1. Add a JSON Schema for the business map and agent card, with validation in API responses.
2. Support JavaScript-rendered sites with a headless browser fallback.
3. Add robots.txt awareness, crawl politeness, and clearer scan diagnostics.
4. Improve offering extraction with page-section context instead of headings alone.
5. Add optional LLM summarization constrained to evidence IDs.
6. Build regression tests using saved HTML fixtures from varied business types.
7. Add export buttons for map JSON, card JSON, and a human-readable evidence report.

## Known Ambiguity

- There is no formal schema for business-map or agent-card output yet.
- It is unclear whether `examples/*.json` are intended as snapshots, fixtures, or illustrative samples.
- There is no configured test runner, linter, typechecker, or build pipeline.
- Live website scans can fail for network, bot-protection, content-type, or transient remote-site reasons.
- The repo does not define a production deployment target.
