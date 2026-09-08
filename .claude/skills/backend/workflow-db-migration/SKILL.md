---
name: workflow-db-migration
description: Step-by-step workflow for writing and shipping a database migration safely — schema change, index addition, backfill, or data migration. Use when asked to "add a column/table", "create a migration", "add an index", "change the schema", or "backfill data". Not for one-off ad-hoc data fixes run manually outside of migration tooling (flag that distinction if asked to do one).
---

# Workflow: Database Migration

## 1. Understand the current state

Check the actual table: current row count, growth rate, existing indexes,
existing constraints, and how it's queried today (project-first rule —
don't guess, look). This determines whether the migration is cheap or
dangerous.

## 2. Classify the change

- **Additive, no lock risk** (new nullable column, new table, new index
  taken concurrently) — low risk, can usually ship directly.
- **Additive with backfill** (new NOT NULL column, new column needs
  existing rows populated) — needs the expand-contract pattern.
- **Destructive or blocking** (drop column, rename column, add NOT NULL
  to existing column, change a column type, add an index the blocking
  way on a large table) — needs the full safety checklist and likely a
  multi-step rollout.

Use `database-engineering`'s migration safety checklist and, for
additive-with-backfill or destructive changes, its expand-contract
pattern.

## 2b. Does this migration carry an invariant?

If the change involves a rule that must **always** hold across rows — one
active owner, no overlap, a balance that reconciles, a uniqueness that spans
a condition — stop and use `spellzee-invariants`. On this project the
constraint belongs in the database, written by hand, and the migration is
generated with `prisma migrate dev --create-only` precisely so the SQL can be
edited before it runs. Prisma owns the table diff; it does not own the
constraints.

If the change adds a **tunable business value**, it is a policy row, not a
column default or a constant — see `spellzee-policy-versioning`.

## 3. Write the migration

Use `nodejs-postgres-stack`'s migration tooling guidance — on this project
that is **Prisma Migrate with `--create-only`**, then hand-written SQL for
anything Prisma's schema language cannot express. For Postgres specifically:

- Index creation on a table with real traffic: `CREATE INDEX
  CONCURRENTLY` (note: this cannot run inside a transaction block — most
  migration tools have a flag for this).
- Adding a NOT NULL column to an existing large table: add nullable →
  backfill in batches → add the NOT NULL constraint as a separate,
  later migration (`NOT VALID` + `VALIDATE CONSTRAINT` for check
  constraints avoids a long table-wide lock).
- Renaming: never rename in place if old code is still deployed reading
  the old name — add new, dual-write/dual-read during transition, drop
  old later.

## 4. Plan the backfill (if any)

Batched, throttled, run outside the migration's own transaction, with
resumability if it's interrupted partway. State the expected duration
given the row count from step 1 — don't run an unbounded single-statement
`UPDATE` on a large table without checking how long that lock is held.

## 5. Plan deployment order

Does the migration need to run before, after, or interleaved with the
application code deploy? State this explicitly — a common failure mode is
new code deployed before a migration has run (or the reverse) against a
mixed fleet during rolling deploy.

## 6. Rollback plan

What undoes this migration if it needs to be reverted, and does reverting
lose data written under the new schema in the meantime? State the answer,
don't leave it implicit.

## 7. Verify

After writing the migration, state what you'd check to confirm it worked
correctly and cheaply — table lock duration in practice, row counts
matching expectations post-backfill, no query regression (new index
actually used by the planner, checked via `EXPLAIN`).
