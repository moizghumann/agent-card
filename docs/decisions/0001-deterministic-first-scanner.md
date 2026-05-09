# 0001: Deterministic-First Scanner

## Status

Accepted.

## Context

The product needs to turn messy public business websites into structured intelligence without hallucinating capabilities.

## Decision

The app first crawls and extracts evidence with deterministic code. The business map is built from that evidence. The agent card is generated from the business map. OpenRouter refinement is optional and sanitized against existing evidence.

## Consequences

- The app can run without LLM secrets.
- Unsupported facts can remain unknown.
- Heuristic changes in `src/businessMap.js` can materially change output and should be tested carefully.

