---
name: nodejs-postgres-stack
description: Use for any implementation work on this project's actual stack — Node.js/TypeScript backend code and PostgreSQL-specific database work (connection pooling, query builder/ORM choice, migrations, async error handling, env/config validation). This is the concrete tooling layer beneath the generic system-architecture/backend-api-design/database-engineering skills. Triggers on any real code change in this repo — routes, services, queries, migrations, package.json, tsconfig, pg client setup.
---

# Node.js / TypeScript + PostgreSQL Stack

This project's stack is Node.js + TypeScript on the backend, PostgreSQL as
the primary database. This skill holds stack-specific defaults; the
`backend-api-design`, `database-engineering`, `reliability-observability`,
etc. skills hold the framework-agnostic reasoning — apply both together.

**Superseded 2026-09-08 by the Spellzee ERP architecture decisions.** The
framework and ORM below are no longer open defaults — they are locked
choices recorded in `/CLAUDE.md` and `/tradeoff-library.md`. The earlier
pin (2026-08-31: Express + a typed query builder) predated those
decisions and does not apply to this project. Everything else in this
skill — validation, async traps, pool lifecycle, graceful shutdown — is
unchanged and still correct.

Still check `package.json`/`project-conventions` before applying any
specific version-level detail; but a diff that swaps NestJS for Express
or Prisma for Drizzle is an architecture reversal, not a convention
mismatch, and needs the reversal trigger in `/tradeoff-library.md` to
have actually fired.

## Defaults for this stack

- **Web framework**: **NestJS** (locked). Chosen over bare Express/Fastify
  because this architecture depends on a *uniform write path* — every
  command validating authorization, writing the change, writing audit and
  enqueuing the outbox in one transaction. NestJS modules, providers,
  guards and interceptors make that path enforceable by convention rather
  than by memory, which matters with one developer and agent-written code.
  NestJS handles async handler rejections through its own exception layer,
  so the Express `asyncHandler` concern below does not apply — but its
  filters must still be wired, not assumed.
- **DB access**: **Prisma** (locked), with one architectural caveat that
  outranks normal ORM preference. Prisma's schema language cannot express
  exclusion constraints, range types, partial indexes with complex
  predicates, or trigger-based rules — and this project enforces its
  invariants *in the database*. Therefore:
  **every invariant is a hand-written SQL migration** — generate with
  `prisma migrate dev --create-only`, then write the constraint yourself.
  Prisma generates the schema diff; it does not get to decide what the
  constraints are. Raw SQL alongside Prisma (invariant migrations, the
  reporting layer) is expected and correct, not a workaround.
  See `backend/spellzee-invariants`.
- **Validation**: `zod` at every boundary — request body/query/params,
  env vars, and external API responses. Validate `process.env` once at
  startup with a zod schema, fail fast on a missing/malformed var instead
  of getting `undefined` deep in a handler later.
- **Testing**: Vitest for unit/integration; a **real PostgreSQL instance**
  for integration tests — on this machine that is the local `spellzee_test`
  database on port 5433, since there is no Docker (see `project-conventions`) —
  never mock the database for anything that exercises a real query. On
  this project that is not a preference but a consequence of where the
  invariants live: a mocked-repository test proves nothing about the
  component most likely to fail. **Constraint tests** — attempt the
  violation, assert the database rejects it — are the highest-value tests
  here, and every invariant migration owes one. See
  `backend/spellzee-invariants`.
- **Logging**: `pino` (structured JSON, low overhead) with a
  `request_id`/`trace_id` bound per request via async local storage or
  the framework's request context.

## How to apply this skill

1. Confirm reality before applying defaults — check `package.json` and
   `project-conventions` (see the pinned-defaults note above).
2. Work through `references/checklist.md` while implementing — it's
   organized by concern (route handlers, DB access, async correctness,
   config, process lifecycle, type safety, migrations).
3. For any of the 7 correctness traps below, use the matching file in
   `references/examples/` as the concrete good/bad pattern.
4. Before calling the work done, run it against `references/dod.md`.

## Node/TypeScript-specific correctness traps

Full detail (why each one fails, the fix) is in
`references/anti-patterns.md`; matching before/after code is in
`references/examples/`:

1. Unhandled promise rejection in an async route handler. (NestJS covers
   this via its exception layer — on this project the equivalent trap is
   an exception filter that is never registered, or a `.catch()` that
   swallows an error the filter should have seen.)
2. Leaked `pg` pool connection (missing `client.release()`).
3. Transaction missing a correct rollback/release path.
4. `async` callback passed to `Array.prototype.forEach`.
5. `process.env` read without validation.
6. No graceful shutdown handling (`SIGTERM`/`SIGINT`).
7. CPU-heavy synchronous work blocking the event loop on a hot path.

TypeScript `strict: true` should stay on — it catches null/undefined bugs
at compile time that would otherwise surface as prod 500s; this one has
no example file since it's a `tsconfig` setting, not a code pattern.

## Reference

- `references/references.md` — pool sizing formula, migration tooling
  comparison table.
- `references/checklist.md` — execution checklist for implementation work.
- `references/anti-patterns.md` — the 7 correctness traps in full, each
  with why it fails and the fix.
- `references/examples/` — good vs bad code for each trap (async route
  handlers, pool lifecycle, transactions, async-in-array-methods, env
  validation, graceful shutdown).

## Definition of Done

Before calling any implementation work using this skill complete, run it
against `references/dod.md`. Every applicable item must pass.
