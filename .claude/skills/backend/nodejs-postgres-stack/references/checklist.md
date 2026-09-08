# Execution Checklist — Node.js/TypeScript + PostgreSQL Stack

Match this against the actual diff before calling implementation work
done. Each item maps to a `dod.md` item and/or an `anti-patterns.md`
entry.

## Before writing code

- [ ] Confirmed the project's actual framework/DB-access library/test
      runner against `package.json` and `project-conventions` — not
      assumed from this skill's defaults.
- [ ] Confirmed Express major version if async-handler wrapping is in
      question (pre-5 needs a wrapper, 5 doesn't).

## Route handlers

- [ ] Every async handler is wrapped (`asyncHandler` / `express-async-errors`)
      or Express 5 is confirmed — see `anti-patterns.md#1`.
- [ ] Every input (body/query/params) is validated with zod before use.

## Database access

- [ ] Simple queries use `pool.query()`, not a manually checked-out
      client, unless a transaction is required.
- [ ] Every manually checked-out client (`pool.connect()`) has
      `client.release()` in a `finally` block — see `anti-patterns.md#2`.
- [ ] Every transaction has `BEGIN` → try → `COMMIT`, `catch` →
      `ROLLBACK` → rethrow, `finally` → `release()` — see
      `anti-patterns.md#3`.
- [ ] Pool `max` is sized deliberately (see `references.md`'s sizing
      formula), not left at the library default without checking it
      against expected concurrency and `postgres_max_connections`.

## Async correctness

- [ ] No `async` callback passed to `Array.prototype.forEach` — see
      `anti-patterns.md#4`.
- [ ] Concurrent-safe async work uses `Promise.all(map(...))`;
      order-dependent work uses `for...of` with `await`.

## Config / environment

- [ ] `process.env` is read only through the parsed, zod-validated `env`
      object — not accessed raw and scattered across files — see
      `anti-patterns.md#5`.
- [ ] New env vars are added to the zod schema in the same change that
      introduces them.

## Process lifecycle

- [ ] `SIGTERM`/`SIGINT` handlers exist: stop accepting new connections
      → drain in-flight requests → close the DB pool → exit — see
      `anti-patterns.md#6`.

## Type safety

- [ ] `tsconfig` `strict: true` remains on; no new `any`/type-suppression
      without a stated reason in the diff.

## Performance sanity

- [ ] No CPU-heavy synchronous block added to a hot request path without
      first measuring its event-loop-blocking cost — see
      `anti-patterns.md#7`.

## Migrations (if touched)

- [ ] Migration tool matches what the project already uses — see
      `references.md`'s tooling comparison; no new tool introduced
      without a stated reason.
- [ ] Migration also passes `database-engineering`'s migration-safety
      checklist — this skill's tooling notes don't replace that.
