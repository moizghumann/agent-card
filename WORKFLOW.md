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
    - Human Review
    - Blocked
    - Done
    - Canceled
    - Cancelled
    - Duplicate

polling:
  interval_ms: 5000

workspace:
  root: "/Users/mac/Documents/playing with symphony/agent-card-workspaces"

hooks:
  after_create: |
    git clone --depth 1 git@github-personal:moizghumann/agent-card.git .

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

You are working on Linear ticket `{{ issue.identifier }}` in a fresh clone of:

`moizghumann/agent-card`

Work only inside the current repository workspace.

Do not edit project files outside this workspace. Normal temporary files created by tools are allowed.

The Linear ticket is the scope boundary. Complete the smallest safe version of the requested work.

Every Linear ticket that changes repository files must result in a GitHub pull request unless the task is blocked, impossible, duplicated, or intentionally canceled.

## Issue Context

Identifier: {{ issue.identifier }}
Title: {{ issue.title }}
Current status: {{ issue.state }}
Labels: {{ issue.labels }}
URL: {{ issue.url }}

Description:

{% if issue.description %}
{{ issue.description }}
{% else %}
No description provided.
{% endif %}

Treat the issue context above as authoritative.

Do not query Linear to rediscover the issue title, description, status, labels, URL, project, or identifier.

Use Linear tools only for:

1. moving the issue state
2. posting one concise progress or handoff update
3. reporting a real blocker

Avoid generic Linear GraphQL exploration.

## Start

1. Read `AGENTS.md`.
2. Read the issue context above.
3. Classify the ticket type.
4. Inspect only files directly relevant to the ticket.
5. Make the smallest safe change.
6. Commit the change.
7. Push a ticket branch.
8. Open a draft GitHub PR.
9. Report the PR and result in Linear.
10. Move the issue to `Human Review` when ready.

If no repository file changes are needed because the task is blocked, impossible, duplicated, canceled, or purely research/reporting, skip the commit, branch, and PR steps and explain why in Linear.

Do not scan the whole repo.

Do not read generated files unless the ticket explicitly requires it.

Do not inspect unrelated directories.

Do not broaden scope beyond the ticket.

## Ticket Types

Classify each ticket as one of:

```text
docs
feature
bug
refactor
test
chore
research
```

Use the classification only to decide how much repo context is needed.

Default behavior by type:

```text
docs      read the target docs and only nearby supporting files
feature   inspect the affected product surface, tests, and relevant docs
bug       reproduce or locate the failure signal before changing code
refactor  preserve behavior and validate carefully
test      inspect the tested unit/flow and add focused coverage
chore     make the smallest maintenance change
research  prefer read-only investigation and report findings in a doc or issue comment
```

The agent is expected to use judgment. A small docs ticket should not trigger a full engineering investigation. A real code ticket should get validation.

## Linear State Rules

### Todo

When starting a `Todo` ticket:

1. move it to `In Progress`
2. do not perform additional Linear lookup
3. begin work from the issue context above

### In Progress

Continue scoped work.

Do not repeat investigation already completed unless the current workspace state requires it.

### Rework

Address reviewer feedback only.

Preserve valid existing work.

Do not restart from scratch unless the current work is clearly unusable.

After rework, update the same PR or open a replacement PR if the previous PR is unusable.

### Merging

Only perform merge or final landing work if the ticket or reviewer explicitly asks for it.

If GitHub auth, CI, branch protection, or permissions block merging, document the exact blocker in Linear, move the issue to `Blocked`, and stop.

### Human Review

This is the normal handoff state.

Move the issue to `Human Review` only after a draft PR has been opened or a blocker makes a PR impossible.

After moving to `Human Review`, stop working.

### Blocked

This is a terminal state for work that cannot produce the required handoff because of missing auth, missing secrets, missing permissions, broken local environment, contradictory acceptance criteria, or another real external blocker.

When blocked, post the concise Linear handoff with the exact command or condition that blocked completion and the human action needed to unblock.

### Done, Canceled, Cancelled, Duplicate

Terminal states.

Do not work on tickets in terminal states.

## Repo Rules

Follow `AGENTS.md`.

If `AGENTS.md` conflicts with the ticket, follow `AGENTS.md` and document the conflict.

This workflow's PR requirement overrides any older docs-only guidance in `AGENTS.md`: documentation changes still require a commit, branch, and draft PR when files changed.

Unless explicitly requested, avoid:

- changing authentication behavior
- changing billing or payment behavior
- changing production environment configuration
- introducing new dependencies
- broad refactors
- deleting files
- destructive migrations
- changing public APIs
- changing user-facing behavior without documenting it

## Context Control

Read only what is needed.

Preferred first files:

```text
AGENTS.md
the target file or directly affected files
package.json only when command names need confirmation
```

Avoid these unless the ticket directly requires them:

```text
src/
test/
tests/
schemas/
examples/
docs/
build outputs
dependency folders
large generated files
```

Do not use broad searches unless you cannot identify the relevant files from the ticket.

Do not run setup before it is needed.

If a validation, test, build, or typecheck command fails because dependencies are missing, run:

```bash
npm run setup
```

Then retry the original command once.

## Validation

Use validation appropriate to the ticket.

For documentation-only or text-only changes, full validation is not required unless the ticket asks for it.

For code, test, schema, script, runtime, or behavior changes, run:

```bash
npm run validate
```

If validation fails, report:

- command run
- failure summary
- whether it appears related to the change
- whether the task is still reviewable

Do not hide failed validation.

## Git and PR Rules

Every ticket should produce a GitHub PR when repository files are changed.

For documentation-only changes:

1. edit only the requested documentation file
2. do not run full validation unless requested
3. commit the documentation change
4. push a ticket branch
5. open a draft PR
6. move the Linear issue to `Human Review`

For code-bearing changes:

1. run appropriate validation
2. commit the change
3. push a ticket branch
4. open a draft PR
5. move the Linear issue to `Human Review`

Branch format:

```text
agent/{{ issue.identifier }}-short-description
```

PR title format:

```text
{{ issue.identifier }}: short description
```

PR body must include:

```md
## Linear issue

{{ issue.url }}

## Summary

What changed.

## Changed files

- `path/to/file`

## Validation

- command: `npm run validate` / not run
- result: passed / failed / not run
- reason if not run

## Notes

Risks, blockers, or follow-ups if any.
```

If GitHub auth, `gh`, push access, or `.git` write access fails, document the exact command/error in Linear, move the issue to `Blocked`, and stop.

If no files changed because the task was impossible, duplicated, canceled, blocked, or purely research/reporting, do not open an empty PR. Document the result in Linear, move the issue to `Human Review` for completed no-change work or `Blocked` for blocked work, and stop.

## Linear Handoff

Use one concise Linear update.

Use this format:

```md
## Result

What changed.

## Pull request

PR URL, or reason no PR could be opened.

## Changed files

- `path/to/file`

## Validation

- command: `npm run validate` / not run
- result: passed / failed / not run
- reason if not run

## Notes

- blockers, risks, or follow-ups if any

## Status

Ready for human review, or blocked with exact unblock action.
```

Before moving to `Human Review`, confirm:

- the task stayed inside scope
- only relevant files were changed
- validation was handled appropriately
- a draft PR was opened when files changed
- the Linear handoff is clear

Do not move directly to `Done`.

The normal final state is:

```text
Human Review
```

## Operating Principle

Optimize for small, bounded, reviewable work.

Do not maximize ceremony beyond the required PR handoff.

Do not do plumbing work the ticket did not ask for.

Do not spend tokens proving obvious things.

The goal is the smallest trustworthy PR and handoff.
