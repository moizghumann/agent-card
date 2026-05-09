---
tracker:
  kind: linear
  project_slug: "symphony-agent-queue"
  active_states:
    - Todo
    - In Progress
    - Rework
    - Merging
    - Blocked
  terminal_states:
    - Done
    - Cancelled
    - Duplicate
    - "Won't Do"

polling:
  interval_ms: 5000

workspace:
  root: "/Users/mac/Documents/agent-card"

hooks:
  after_create: |
    cd /Users/mac/Documents/agent-card
    npm run setup

agent:
  max_concurrent_agents: 2
  max_turns: 20

codex:
  command: codex app-server
  thread_sandbox: workspace-write
---

# Symphony Agent Workflow

You are working inside the repository at:

`/Users/mac/Documents/agent-card`

This repository is the source of truth. Work from the repository root. Before doing anything, read:

1. `AGENTS.md`
2. `README.md`
3. relevant docs under `docs/`
4. the Linear ticket description and comments

Follow the repo's local rules before making changes.

## Core Behavior

Complete the Linear ticket with the smallest safe change that satisfies the acceptance criteria. Treat the Linear ticket as the scope boundary.

Before editing code:

1. read the ticket carefully
2. inspect the relevant files
3. identify likely affected domains
4. create or update a Linear workpad/comment with your plan
5. only then make changes

Prefer small, reviewable changes over broad refactors.

## Linear State Model

The Linear project uses these statuses:

```text
Backlog
Todo
In Progress
Needs Review
Rework
Merging
Blocked
Done
Cancelled
Duplicate
Won't Do
```

Active agent states are:

- `Todo`: ticket is ready to pick up.
- `In Progress`: agent is actively reading, planning, editing, or validating.
- `Rework`: changes need another pass after review or failed validation.
- `Merging`: work is approved or ready for final merge handling.
- `Blocked`: work cannot proceed without human input or unavailable resources.

Terminal states are:

- `Done`: work is complete and validation has been reported.
- `Cancelled`: work should stop because the ticket is no longer needed.
- `Duplicate`: work is covered by another ticket.
- `Won't Do`: work is intentionally not being implemented, with rationale.

`Backlog` and `Needs Review` may exist in Linear, but they are not active execution states for this workflow unless the tracker configuration is updated.

## Completion Behavior

Before moving to a review, merging, or terminal state, the agent must:

1. run `npm run validate`
2. report changed files
3. report validation commands and results
4. note missing environment variables or blocked checks
5. note any product behavior changes and matching docs/tests updates

## Blocking Rules

Move to `Blocked` only when:

- the ticket requires network access and live scans cannot run
- the ticket explicitly requires OpenRouter and `OPENROUTER_API_KEY` is unavailable
- validation cannot run because the local environment is broken
- acceptance criteria conflict with `AGENTS.md` safe-change rules
- human product/security judgment is required before proceeding

When blocked, leave a Linear comment with the command run, observed failure, likely cause, and smallest next human action.

## Ticket Sufficiency

A Linear ticket should provide enough context for an agent to start:

- desired outcome and acceptance criteria
- likely affected product area, if known
- whether product behavior may change
- expected validation scope
- required environment variables or live-network needs

If the ticket lacks critical context, ask for clarification before broad implementation.
