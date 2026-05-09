# Harness

This repo follows the harness-engineering pattern: keep the active prompt small, keep durable
context in the repo, and make correctness executable.

## Efficiency Rules

- Start with `AGENTS.md`, the Linear ticket, and only the files needed for the acceptance criteria.
- Use `docs/index.md` for progressive disclosure instead of reading every doc up front.
- Avoid `examples/*.json`, generated outputs, and broad source sweeps unless the ticket
  specifically touches output shape or fixtures.
- Prefer `rg`, targeted file reads, and targeted tests while developing.
- Run `npm run validate` before handoff; it is the single full proof command.

## Mechanical Checks

PR handoff belongs to the code-ticket lane. Documentation-only tickets should not commit,
push, or open PRs unless the ticket explicitly asks. Keep Codex in `workspace-write` for
early testing and docs-only work.

`npm run healthcheck` runs `scripts/harness-check.js`, which verifies the agent entrypoints,
required docs, package scripts, and Symphony workflow guardrails.

The harness intentionally keeps `AGENTS.md` and `WORKFLOW.md` line-limited so context budget
goes to the ticket and relevant code, not startup ceremony.

## Update Rules

- If setup, validation, or workflow behavior changes, update `AGENTS.md`, `WORKFLOW.md`, and this file together.
- If product behavior changes, update `docs/PRODUCT.md`, `ARCHITECTURE.md`, relevant tests,
  and examples only when output contracts changed.
- Promote repeated review feedback into docs or scripts instead of relying on memory.
