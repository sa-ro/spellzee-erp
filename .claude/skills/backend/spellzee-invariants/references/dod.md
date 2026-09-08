# Definition of Done — invariants & schema work

Every applicable item must pass before the work is called complete.

## The rule itself

- [ ] The business rule was stated in one sentence before any SQL was written.
- [ ] It was classified: does it span rows/tables? If yes, it is a database
      constraint, not a service check. If genuinely single-row and
      single-field, a service-level validation is acceptable — say which and
      why.
- [ ] If the rule was pushed into application code, there is an explicit
      stated reason, and it is recorded — not left implicit.

## The migration

- [ ] Generated with `prisma migrate dev --create-only`, then hand-edited.
- [ ] The constraint is **named explicitly** and the name is readable.
- [ ] The mechanism is the simplest one that holds (check < partial unique <
      exclusion < trigger).
- [ ] For an exclusion constraint: `btree_gist` is installed, the range
      bound style (`'[)'`) is deliberate, and cancelled/inactive rows are
      excluded via `WHERE`.
- [ ] For a trigger: it raises a stable, greppable token in its message; it
      is `BEFORE` unless it genuinely needs the new row visible; and it is
      recorded in `project-conventions` (triggers are invisible in
      `schema.prisma`).
- [ ] Existing data was checked against the new constraint — the migration
      does not fail on production rows that already violate it. If it would,
      there is a documented cleanup/backfill step first.
- [ ] Migration safety was considered per `database-engineering` — lock
      duration, table size, `CREATE INDEX CONCURRENTLY` where the table has
      real traffic.
- [ ] Rollback is possible, or its absence is stated deliberately.

## The tests

- [ ] A constraint test exists that **attempts the violation and asserts the
      database rejects it**.
- [ ] The test asserts on the **constraint name / error token**, not on a
      generic error type.
- [ ] The test runs against **real PostgreSQL** (Testcontainers or
      docker-compose), not a mock and not an in-memory substitute.
- [ ] The happy path is also covered — the constraint permits what it should.
- [ ] If the invariant is vulnerable to a race (any trigger that reads other
      rows to decide), there is a **concurrent** test with two simultaneous
      transactions, and the locking or isolation level that makes it safe is
      explicit.

## Registry & documentation

- [ ] `references/patterns.md`'s registry table has a row for this constraint.
- [ ] If this constraint encodes a policy value that is actually configurable
      (a cutoff, a limit, a threshold), stop — that belongs in
      `spellzee-policy-versioning` as a versioned row, not hard-coded in a
      constraint.

## Erosion check

- [ ] No existing constraint was dropped or weakened to make this work pass.
      If one was, that is an architecture reversal: it needs the reversal
      trigger in `/tradeoff-library.md` (decision 2) to have actually fired,
      stated explicitly and recorded — not done silently.
