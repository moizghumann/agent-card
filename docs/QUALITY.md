# Quality Bar

## Before Handoff

Run:

```bash
npm run validate
```

Also inspect any changed docs for accuracy. If product behavior changes, regenerate or explicitly review affected `examples/*.json`.

## Testing Expectations

Current lightweight checks are:

- shell wrapper healthcheck
- JavaScript syntax checks with `node --check`
- example JSON parse and required-shape checks
- Node built-in tests with `node --test`

## Lint, Typecheck, And Build Expectations

- `npm run lint` performs JavaScript syntax checks.
- `npm run typecheck` exits successfully when no TypeScript sources or `tsconfig.json` exist; if TypeScript appears later, it requires `tsc --noEmit`.
- `npm run build` documents that this static Express app has no compile step.
- `npm test` runs the Node test suite.

## Screenshot And Manual QA

For UI-affecting changes:

- start the app with `bash scripts/dev.sh`
- open `http://localhost:3000`
- run a known URL such as `https://www.sweetgreen.com`
- verify both Business Map and Generated Agent Card render
- check mobile/desktop layout if CSS or markup changed

For scanner or output behavior changes:

- run at least one deterministic CLI scan with `OPENROUTER_API_KEY` unset or `options.useLlm === false`
- run an OpenRouter-backed scan only when a local key is intentionally configured
- compare updated output against the expected evidence and unknowns

## What Counts As Blocked

Call the work blocked when:

- required network access is unavailable and the task depends on live website scans
- required environment variables are missing for an explicit OpenRouter test
- the target website blocks all readable HTML pages
- behavior cannot be validated without changing product code outside the requested scope
- a missing test/lint/typecheck/build command is required by the task but not configured in the repo

When blocked, report the command, failure, likely cause, and the smallest next step.

## Agent Efficiency

- Avoid rerunning proofs that `npm run validate` already covers unless a failure needs focused debugging.
- Use targeted tests during implementation, then one full validation before handoff.
- Treat large generated outputs as validation artifacts, not startup reading material.
