# Security

## Current Controls

- `src/url.js` accepts only `http:` and `https:` URLs.
- `src/url.js` blocks localhost and common private IPv4 ranges.
- `.env` is gitignored.
- `.env.example` documents optional OpenRouter variables without real secrets.
- OpenRouter requests use `OPENROUTER_API_KEY` from the local environment.

## Agent Rules

- Never commit `.env` or real API keys.
- Do not loosen private-host blocking without an explicit security review.
- Do not add form submission, purchasing, account creation, or message sending automation without human approval controls.

## Unknowns

- No production deployment or secret-management model is documented.
- No rate limiting, abuse protection, or robots.txt policy is implemented.

