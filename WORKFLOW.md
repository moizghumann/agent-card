---
tracker:
  kind: linear
  project_slug: "symphony-agent-queue-c7cc9de0cbf2"
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
  root: "/Users/mac/Documents/playing with symphony/agent-card-workspaces"

hooks:
  after_create: |
    git clone git@github-personal:moizghumann/agent-card.git .
    npm run setup

agent:
  max_concurrent_agents: 2
  max_turns: 20

codex:
  command: codex app-server
  approval_policy: never
  thread_sandbox: workspace-write
  turn_sandbox_policy:
    type: workspaceWrite
---

# Symphony Agent Workflow

You are working inside a fresh issue workspace cloned from `moizghumann/agent-card`.

The cloned repository is the source of truth. Work from the issue workspace root. Before doing anything, read:

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
6. open a GitHub draft pull request when files changed

## GitHub Pull Request Behavior

This repository is expected to use:

- default branch: `main`
- remote: `origin`
- GitHub repo: `moizghumann/agent-card`

When a ticket changes files, the agent must:

1. create a ticket-scoped branch from latest `main`
2. commit only the ticket-related changes
3. push the branch to `origin`
4. open a draft GitHub pull request against `main`
5. include the Linear ticket identifier or URL in the PR body when available
6. include validation results in the PR body
7. comment in Linear with the PR URL and validation result
8. move the ticket to the appropriate review/merging state according to the tracker

Suggested branch naming:

```text
agent/<linear-id>-short-description
```

If GitHub credentials, `gh`, or push access are unavailable, do not mark the ticket `Done`. Move or leave it `Blocked` and comment with the exact missing capability.

## Blocking Rules

Move to `Blocked` only when:

- the ticket requires network access and live scans cannot run
- the ticket explicitly requires OpenRouter and `OPENROUTER_API_KEY` is unavailable
- validation cannot run because the local environment is broken
- acceptance criteria conflict with `AGENTS.md` safe-change rules
- human product/security judgment is required before proceeding

When blocked, leave a Linear comment with the command run, observed failure, likely cause, and smallest next human action. If the Linear team does not expose a `Blocked` state, leave the issue in its current active state and make the blocker explicit in the workpad/comment.

## Ticket Sufficiency

A Linear ticket should provide enough context for an agent to start:

- desired outcome and acceptance criteria
- likely affected product area, if known
- whether product behavior may change
- expected validation scope
- required environment variables or live-network needs

If the ticket lacks critical context, ask for clarification before broad implementation.
