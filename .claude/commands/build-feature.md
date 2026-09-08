---
description: Backend feature chain for Spellzee ERP — scope check, schema and invariants, approval gate, then build, test and erosion audit, handed off automatically between agents.
argument-hint: [what to build, e.g. "student duplicate detection and merge"]
---

# Build Feature — Spellzee agent chain

You are orchestrating the backend build chain for: **$ARGUMENTS**

You are the orchestrator. Subagents cannot call each other, so **you** run
each phase in order and carry each phase's output into the next as explicit
context — never assume the next agent can see the previous one's work.

Announce each phase before starting it. Between phases, state in one or two
lines what came back and what you are handing forward, so the chain is
followable.

## Phase 0 — Route the request (you, not an agent)

Read the request and decide what it actually touches. Do not spawn anything
yet.

- **Data model / new entity / a rule that must always hold** → the full
  chain below.
- **Only an external boundary** (a Merithub call, a webhook, a worker) →
  skip to Phase 3b, then Phase 4–5.
- **Read-side only** (the API behind a dashboard, a list endpoint, a query)
  → skip to Phase 4a, then Phase 5–6. No schema phase, no gate.
- **UI only** (a screen, a component, a Figma build) → **this is the wrong
  command.** Say so and point at `/ship-feature`, which drives the 28
  frontend skills. Do not build UI here.
- **Trivial** (a typo, a comment, a rename with no behaviour change) → say
  so and do it directly. Do not run a six-phase chain on a one-line change.

This command is **backend only** — schema, API, workers, integrations. When a
feature needs both, run this for the endpoint, then `/ship-feature` for the
screen that consumes it. Say so in the Phase 7 report.

State which route you took and why.

## Phase 1 — Scope check (`scope-interrogator`)

Skip only if the request touches no unresolved business value at all — and
say so explicitly if you skip.

Spawn `scope-interrogator` with the feature description. Ask it specifically
which open decisions this feature depends on, and for each: shape-blocking or
value-blocking.

**Gate:** if it reports a genuine **shape-blocking** decision — one where the
answer changes the schema or the data model — **stop the chain.** Report the
blocker to the user and ask for a decision. Do not proceed on a guess; that
is precisely what `/CLAUDE.md` forbids.

If everything is value-blocking, carry the suggested placeholder policy keys
forward into Phase 2 and continue.

## Phase 2 — Schema and invariants (`schema-architect`)

Skip for read-side-only work.

Spawn `schema-architect` with: the feature description, Phase 1's findings,
and the placeholder policy keys.

Require back: the entities and relationships, each invariant stated in one
sentence, the hand-written migration SQL, the constraint tests, and what
existing data would violate each constraint.

## Phase 3 — APPROVAL GATE (stop here)

**Stop. Present the schema work to the user and wait.**

This is the one mandatory human gate in the chain. Schema, migrations,
constraints and ledger tables are a high-risk change class per `/CLAUDE.md` —
they land only with human approval, and everything downstream is built on
them. A wrong schema means three agents build on a wrong foundation.

Present, compactly:

- Each invariant in one sentence, and the mechanism chosen for it.
- The migration SQL itself.
- Anything Phase 1 flagged as an unresolved placeholder.
- Anything `schema-architect` was unsure about.

Then ask plainly whether to proceed. **Do not spawn Phase 4 until the user
answers.** If they want changes, loop back to `schema-architect` with their
feedback and gate again.

**On approval, commit** (see "Commits" below):

```
schema(<scope>): <what was modelled>

Invariants: <one line each, with mechanism>.
Constraint tests added.
```

The user's approval at this gate is the commit approval — do not ask twice.
A rejected gate commits nothing.

## Phase 4 — Build

Run whichever applies. Both can run in parallel when the feature needs both —
they touch different layers.

### 4a — `write-path-builder`
For NestJS modules, commands, endpoints, read queries and the response types
the frontend will import. Hand it the approved schema, the policy keys and
the feature description. Every state-changing command follows the uniform
write path: authorize → write → audit → enqueue outbox, in one transaction.

Backend only. If the feature also needs a screen, that is `/ship-feature`
afterwards — note it in Phase 7 rather than building it here.

### 4b — `integration-builder`
For anything crossing to Merithub, FreeJump or WhatsApp: outbox rows, inbox
handlers, workers, the provisioning state machine, the stall queue.

If a builder reports it needs a schema change that Phase 2 did not cover,
**stop** — that goes back through `schema-architect` and the Phase 3 gate,
not around it.

## Phase 5 — Tests

Spawn `write-path-builder` again, scoped to hardening tests only. Required:

- **Constraint tests** for every invariant — attempt the violation, assert
  the database rejects it, assert on the constraint name.
- **Concurrency tests** wherever a rule is enforced by a trigger that reads
  other rows, or wherever entitlement is written. Two genuinely concurrent
  transactions; a single-threaded test will never catch this class.
- **Integration tests** if Phase 4b ran: the outbox row and domain change
  share a transaction, duplicate inbound delivery is a no-op, a failed
  upstream call leaves the row retryable.

All against real PostgreSQL. Never a mocked repository.

## Phase 6 — Erosion audit (`erosion-auditor`)

Spawn `erosion-auditor` over everything the chain produced.

**Gate:** if it reports a **silent reversal** — a decision reversed whose
trigger has not fired — **stop the chain and report to the user.** Do not
send it back to a builder to auto-fix, and do not accept it yourself: whether
to erode an architecture decision is the user's call, not an agent's.

If it reports a **legitimate reversal** (the trigger genuinely fired), that
is not a failure — surface it and note that it needs an ADR entry in
`tradeoff-library.md` with its reversal trigger.

If it is clean, say so plainly and move on.

## Phase 7 — Report

One consolidated summary:

- What was built, by which agent.
- The invariants added and how each is enforced.
- Policy keys introduced, and which carry **placeholder** values awaiting a
  business decision.
- Test coverage: constraint, concurrency, integration.
- The erosion audit result.
- **Whether a UI still needs building** for this feature, and the endpoints
  and response types `/ship-feature` should consume.
- **What is unresolved or was deferred**, explicitly. Never report
  completion over a failing gate or an unanswered open decision.

## Commits

Two checkpoints in a backend run. The repository is `main` with no remote —
these are local rollback points, not pushes. Never push unless asked.

| After | Contains |
|---|---|
| **Phase 3** — schema gate approved | schema, migration, constraint tests |
| **Phase 6** — audit clean, tests pass | endpoints, workers, tests |

The Phase 6 commit happens only if the erosion audit is clean and the tests
pass. If the audit found a silent reversal, the chain stopped — nothing is
committed, because the user has not decided what to do about it yet.

```
feat(<scope>): <what was built>

<endpoints or workers added>
Erosion audit: clean.
```

Rules:

- **Commit only after a gate is approved, never before.** Committing the
  thing the user is being asked to approve defeats the gate.
- Stage deliberately — `git add` the paths the phase produced, not
  `git add -A`.
- If the working tree is dirty with unrelated changes, say so rather than
  sweeping them in.
- End every commit message with:

  ```
  Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
  ```

## Rules for you as orchestrator

- **Carry context forward explicitly.** Each agent starts cold. Paste the
  prior phase's relevant output into the next agent's prompt.
- **Never skip the Phase 3 gate**, even if the schema change looks trivial
  and even if the user seems in a hurry. That gate is the whole reason this
  chain is safe to run automatically.
- **Stop on a blocker.** A shape-blocking open decision (Phase 1) and a
  silent reversal (Phase 6) both end the chain and go to the user.
- **Do not let an agent auto-fix an architecture finding.** Report it.
- **Do not re-run passing phases.** Once tests pass and the audit is clean,
  finish.
- If the user interrupts mid-chain, stop cleanly and say which phase
  completed and which did not.
