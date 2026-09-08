# Spellzee ERP

Operations and delivery platform for Spellzee (online tutoring), architected as the
foundation of a broader ERP.

**Status: pre-code.** This repository currently holds the business baseline, the
architecture decisions, and the tooling that will build against them. No application
code exists yet.

## What is here

| Path | What it is |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | The working summary — stack, the five load-bearing rules, domain model, roadmap |
| [`tradeoff-library.md`](tradeoff-library.md) | Architecture decisions, each with a **reversal trigger** |
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

## Getting set up

Not yet possible end to end — these are the known blockers:

- ~~PostgreSQL for tests.~~ **Done** — PostgreSQL 17 installed natively on port 5433
  (16 already held 5432), with `spellzee_dev` / `spellzee_test` databases, a non-superuser
  `spellzee` role, and `btree_gist` enabled. No Docker, so no Testcontainers: tests share a
  persistent database and must clean up after themselves.
- **Cloud provider** undecided, which also decides the managed Postgres and Redis.
- **Auth provider** undecided, which blocks RBAC.
- **Frontend component library, data grid and query layer** — a deliberate day-one
  decision, not yet made. Retrofitting a table abstraction across forty screens is a real
  cost.

## Roadmap

Phase 0 discovery · **Phase 1 (current)** identity, handover, ownership, allocation,
scheduling, session ledger, compensation, Merithub, tickets, SLA, audit · Phase 2 academic
and parent portal · Phase 3 teacher and HR · Phase 4 finance controls · Phase 5 analytics
and AI.

Roughly twenty business decisions remain open in the baseline (§30) — cancellation cutoff,
SLA durations, capacity unit, duplicate-match confidence, incentive formula. The
`scope-interrogator` agent exists to audit which of those actually block Phase 1 and which
can take a flagged placeholder. It has not been run yet; that is the next step.
