# Product Notes

## Product Summary

Business Agent Card Scanner accepts a public business URL, scans readable same-site HTML pages, builds an evidence-backed business map, and generates a machine-readable agent card from that map.

The product emphasizes source evidence and unknown handling. If the scanned website does not prove a capability or fact, the output should leave it unknown or list it under missing/unclear information.

## Target Users

The likely users are builders or evaluators of AI agents who need structured intelligence about how an agent should understand and interact with a business website.

## Core Workflows

- Enter a public business URL in the web UI.
- Click Analyze.
- Review scan metadata and generation mode.
- Review the business map, including pages found, business identity, offerings, customer actions, tools/forms/links, visible contact/payment/auth signals, and missing or unclear facts.
- Review or copy the generated agent card JSON.
- Run CLI analysis for a URL with `npm run analyze -- https://example.com`.
- Regenerate example outputs with `npm run generate:examples`.

## Main Screens And Routes

- `/`: static browser UI served from `public/index.html`.
- `POST /api/analyze`: analyzes a submitted URL and returns scan metadata, business map, and agent card.
- `GET /api/health`: returns `{ "ok": true }`.

## Important Product Concepts

- **Business map:** intermediate structured evidence layer created before the agent card.
- **Evidence index:** source URL and quote records referenced by map findings.
- **Agent card:** machine-readable JSON generated from the business map.
- **Unknowns:** explicit gaps where the site did not prove a fact or capability.
- **Customer capabilities:** actions supported by site evidence, such as contact, order, sign in, support, or scheduling.
- **Optional LLM refinement:** OpenRouter can refine the map/card only after deterministic evidence extraction, with sanitizers guarding evidence IDs and capabilities.

## Unknowns For Human Clarification

- Whether generated examples should be treated as golden fixtures or illustrative samples.
- Whether network crawling should obey robots.txt in this prototype.
- Which exact JSON schema should become the long-term business-map and agent-card contract.
- Which model should be preferred for OpenRouter in production-like runs.
- Whether JavaScript-rendered sites should be supported through browser automation.

