---
tracker:
  kind: linear
  project_slug: "symphony-agent-queue-c7cc9de0cbf2"
  active_states:
    - Todo
    - In Progress
    - Rework
    - Merging
    - Needs Review
  terminal_states:
    - Done
    - Canceled
    - Duplicate
polling:
  interval_ms: 5000
workspace:
  root: "/Users/mac/Documents/playing with symphony/agent-card-workspaces"
hooks:
  after_create: |
    git clone git@github-personal:moizghumann/agent-card.git .
    npm run setup
agent:
  max_concurrent_agents: 1
  max_turns: 4
codex:
  command: codex app-server
  approval_policy: never
  thread_sandbox: workspace-write
  turn_sandbox_policy:
    type: workspaceWrite
---

# Symphony Agent Workflow

You are working on a Linear issue in a fresh clone of `moizghumann/agent-card`.
The Linear ticket is the scope boundary. Use the smallest lane that satisfies it.

## Start

1. Read `AGENTS.md`.
2. Read the Linear issue title, description, comments, and acceptance criteria.
3. Choose the docs-only lane when the ticket only changes documentation.
4. Choose the code lane when app behavior, tests, scripts, schemas, or runtime code change.
5. Inspect only files allowed by the chosen lane.

Do not read large generated files unless required. Avoid `examples/*.json` except for
validation or output-schema work.

## States

- `Todo`: Symphony may move this to `In Progress`; begin work.
- `In Progress`: continue scoped work.
- `Rework`: address review feedback, validate again if relevant.
- `Needs Review`: handoff is ready for human review.
- `Merging`: work is approved or ready for landing.
- Terminal: `Done`, `Canceled`, `Duplicate`.

This Linear team does not expose `Blocked`; leave blockers in the current active
state and document the exact blocker in Linear.

## Required Handoff

For documentation-only tickets:

1. Read only `AGENTS.md`, the Linear ticket, `README.md`, and `package.json` if
   command names need confirmation.
2. Edit only the requested documentation files.
3. Do not inspect `src/`, `examples/`, `schemas/`, `test/`, or `docs/` unless the
   ticket explicitly asks.
4. Do not commit, push, or open a PR unless the ticket explicitly asks.
5. Run `npm run validate` once only if the ticket asks for validation.
6. Update Linear with changed files, what changed, and validation result or
   `not run`.
7. Move the ticket to `Needs Review`.

For code tickets:

1. Read `AGENTS.md`, the Linear ticket, and only relevant files.
2. Make the smallest safe change.
3. Run `npm run validate`.
4. Commit, push, and open a draft PR.
5. Put the PR URL and validation result in Linear.

## Repo Rules

- Do not broaden scope beyond the ticket.
- Do not change product behavior unless the ticket asks for it.
- Prefer deterministic tests and `npm run validate` over live network checks.
- If GitHub auth, `gh`, push access, or `.git` write access fails, document the
  exact command/error and stop as blocked.
