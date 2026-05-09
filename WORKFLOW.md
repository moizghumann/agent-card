---
tracker:
  kind: linear
  project_slug: "symphony-agent-queue-c7cc9de0cbf2"
  active_states:
    - Todo
    - In Progress
    - Rework
    - Merging
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
  max_concurrent_agents: 2
  max_turns: 1
codex:
  command: codex app-server
  approval_policy: never
  thread_sandbox: danger-full-access
  turn_sandbox_policy:
    type: dangerFullAccess
---

# Symphony Agent Workflow

You are working on a Linear issue in a fresh clone of `moizghumann/agent-card`.

Keep runs small. The Linear ticket is the scope boundary.

## Start

1. Read `AGENTS.md`.
2. Read the Linear issue title, description, comments, and acceptance criteria.
3. Inspect only files relevant to the ticket. Use progressive disclosure: open deeper docs only when the ticket needs them.
4. Make the smallest safe change.
5. Comment with the plan only when the ticket needs clarification or the change is larger than one file.

Do not read large generated files unless required. Avoid `examples/*.json` except for validation or output-schema work.

## States

- `Todo`: Symphony moves this to `In Progress` before Codex starts; begin work.
- `In Progress`: continue work.
- `Rework`: address review feedback, validate again.
- `Merging`: final merge/landing state.
- Terminal: `Done`, `Canceled`, `Duplicate`.

This Linear team does not expose `Blocked`; leave the issue in its current active state and document the blocker in the workpad.

## Required Handoff

Before review or terminal state:

1. Run `npm run validate`.
2. Commit only ticket-related changes.
3. Push a ticket branch to `origin`.
4. Open a draft PR against `main`.
5. Put the PR URL and validation result in the Linear workpad/comment.

Branch format:

```text
agent/<linear-id>-short-description
```

PR body must include:

- Linear issue identifier or URL
- changed files summary
- validation command and result
- remaining gaps or blockers

If no files changed, do not open a PR; update Linear with the validation/result instead.

## Repo Rules

- Follow `AGENTS.md` and relevant docs under `docs/`.
- Do not broaden scope beyond the ticket.
- Do not change product behavior unless the ticket asks for it.
- Prefer deterministic tests and `npm run validate` over live network checks.
- If GitHub auth, `gh`, push access, or `.git` write access fails, document the exact command/error and stop as blocked.
