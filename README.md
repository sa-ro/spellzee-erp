# Spellzee ERP

Operations and delivery platform for Spellzee (online tutoring), architected as the
foundation of a broader ERP.

**Status: pre-code.** This repository currently holds the business baseline, the
architecture decisions, and the tooling that will build against them. No application
code exists yet.

## What is here

> **Picking this up on a new machine or in a fresh session? Start with
> [`docs/handoff.md`](docs/handoff.md).** It carries the environment setup, what has been decided,
> and — importantly — the schema decisions from the last session that are not yet written into any
> code.

| Path | What it is |
|---|---|
| [`docs/handoff.md`](docs/handoff.md) | **Read first on a new machine** — state, environment, what is decided, what blocks the first schema |
| [`CLAUDE.md`](CLAUDE.md) | The working summary — stack, the five load-bearing rules, domain model, roadmap |
| [`tradeoff-library.md`](tradeoff-library.md) | Architecture decisions, each with a **reversal trigger** |
| [`docs/open-decisions.md`](docs/open-decisions.md) | The baseline's 21 open questions, sorted shape vs value |
| [`docs/folder-structure.md`](docs/folder-structure.md) | The modular-monolith layout to build into |
| [`docs/design/`](docs/design/) | Design system template — every value `TBD` pending Figma |
| `Spellzee_ERP_Master_Product_Business_Requirements_Draft_3.pdf` | The business baseline (Draft 3) |
| [`.claude/`](.claude/) | Skills, agents, commands and hooks — the build tooling |

The two documents are the source of truth. `CLAUDE.md` summarises them for working
against; where it and they disagree, they win.

## The idea in one paragraph

This is a system of record *and* control — correctness-dominated, not scale-dominated.
Dozens of staff, thousands of students. Every architectural choice trades scale for
provable correctness, deliberately. The north star is that **nothing important happens
invisibly**: entitlement is an append-only ledger, invariants are database constraints
rather than service checks, every external call goes through an outbox, and policy is
versioned data rather than constants in code.

## Stack

TypeScript end to end. NestJS (modular monolith) · PostgreSQL 16+ · Prisma · BullMQ on
Redis · Next.js · managed containers · single region.

Still undecided: cloud provider, auth provider, object storage, observability vendor,
WhatsApp provider. See `CLAUDE.md` for the full list and the reasoning.

## The five rules

Changing any of these is an architecture decision, not an implementation detail:

1. **Invariants live in the database** — hand-written SQL migrations, never service checks.
2. **The outbox row is the commitment**; the queue job is only a trigger.
3. **Entitlement is an append-only ledger** — no `sessions_remaining` column.
4. **Strong consistency inside the database**; eventual only at the integration boundary.
5. **Policy is versioned rows**, not constants and not a rule engine.

## Working on this

Four commands drive the work:

| Command | Does |
|---|---|
| `/api-feature` | Backend chain — schema → **approval gate** → API → tests → erosion audit |
| `/ui-feature` | Frontend — Figma preflight → components → **visual gate** → wiring → checks |
| `/build-fullstack` | Both in order, with a Figma stage and a **visual gate** between them |
| `/fix-bug` | Diagnose → fix → regression test → erosion check |

`/api-feature` spawns five agents (`.claude/agents/`), split by **erosion point** rather
than by lifecycle stage — see [`.claude/agents/README.md`](.claude/agents/README.md) for
why, and for the agents that are designed but deliberately not yet built.

Two gates always stop for a human: the **schema gate** (a landed migration is expensive to
reverse) and the **visual gate** (wiring data into an unapproved design throws the wiring
away with it). Each approved gate commits, so every gate is a rollback point.

`.claude/hooks/guard-invariants.js` runs on every Bash, Write and Edit and blocks or
questions the textual signatures of architecture erosion — `prisma migrate dev` without
`--create-only`, a Merithub delete, a stored balance column. It does not read the skills,
so it holds whether or not the relevant skill was loaded.

**No MCP servers are configured, deliberately.** The hook does not see MCP tool calls, so an MCP
server that can reach the database or the filesystem is a path around every guard here. Figma (for
the design tokens) and GitHub (issues, PRs) are the safe additions — neither touches the codebase.
Postgres, Prisma and filesystem MCPs are not: see `CLAUDE.md` and decision 9 in
`tradeoff-library.md`.

## Getting set up

**Local database — ready.** PostgreSQL 17 installed natively on port 5433 (a PostgreSQL 16
instance already held 5432), with `spellzee_dev` and `spellzee_test` databases, a non-superuser
`spellzee` role, and `btree_gist` enabled. Copy `.env.example` to `.env`.

No Docker on this machine, so **no Testcontainers**: tests share a persistent database and must
clean up after themselves — transaction rollback or truncate, never assume a clean slate.

Verified against the running database rather than assumed: an `EXCLUDE USING gist` constraint
rejects overlapping teacher sessions, and the `'[)'` half-open bound correctly allows back-to-back
sessions.

### Deferred, to be confirmed later

Not blockers for Phase 1 — deferred deliberately so the decisions are made with evidence rather
than guessed now. See `CLAUDE.md` for the full table and what unblocks each.

- **Cloud provider** — application code stays cloud-agnostic; needed at deploy, not before.
- **Auth provider** — authentication is deferred; **authorization is not**. RBAC, maker–checker
  and permission-by-relationship are ours and get built in Phase 1. Authentication sits behind an
  adapter, with a clearly-labelled session placeholder until a provider is chosen.
- **Object storage**, **observability vendor** — both follow the cloud decision.
- **WhatsApp provider** — deferred by the baseline itself; kept behind a channel adapter.

### Still genuinely open

- **Frontend component library, data grid and query layer** — a deliberate day-one decision for
  the UI, not yet made. Retrofitting a table abstraction across forty screens is a real cost, so
  this one is worth settling before `/ui-feature` runs in anger.
- **~20 business decisions** in the baseline (§30). `scope-interrogator` exists to sort which
  actually block Phase 1 from which can take a flagged placeholder.

## Roadmap

Phase 0 discovery · **Phase 1 (current)** identity, handover, ownership, allocation,
scheduling, session ledger, compensation, Merithub, tickets, SLA, audit · Phase 2 academic
and parent portal · Phase 3 teacher and HR · Phase 4 finance controls · Phase 5 analytics
and AI.

Roughly twenty business decisions remain open in the baseline (§30) — cancellation cutoff,
SLA durations, capacity unit, duplicate-match confidence, incentive formula. The
`scope-interrogator` agent exists to audit which of those actually block Phase 1 and which
can take a flagged placeholder. It has not been run yet; that is the next step.
