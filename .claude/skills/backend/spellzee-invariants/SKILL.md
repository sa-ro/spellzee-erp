---
name: spellzee-invariants
description: Use whenever a business rule spans more than one row or table and must always hold — one active owner, no overlapping teacher schedule, entitlement that balances, no duplicate active enrollment. Covers writing invariants as hand-written SQL migrations (exclusion constraints, partial unique indexes, check constraints, triggers) with Prisma's --create-only flow, and the constraint tests that prove them. Triggers on "must always", "can never", "only one", "no overlapping", "unique per", "constraint", "invariant", "prisma migrate", or any schema change to a table that carries a rule.
---

# Spellzee Invariants — rules live in the database

**The rule:** if a business rule spans rows, it is enforced by PostgreSQL,
not by TypeScript. A rule enforced only in a `.service.ts` is not enforced —
it is documentation with a race condition.

This is decision 2 in `/tradeoff-library.md`, chosen for a specific reason:
this is a solo build with agent-written code and **no code review to rely
on**. A constraint is the one check that cannot be forgotten, bypassed by a
second code path, or lost in a refactor. What was sacrificed: flexibility —
some legitimate edge cases now need a migration.

## Why this needs its own skill

Prisma's schema language **cannot express** exclusion constraints, range
types, partial indexes with complex predicates, or trigger-based rules —
exactly the mechanisms this strategy depends on. So the ORM makes the wrong
thing easier, every single time. That is the erosion path: someone needs a
rule, the schema file can't say it, the check quietly moves into a service,
and the strategy is abandoned without anyone deciding to abandon it.

## The flow, every time

```bash
npx prisma migrate dev --create-only --name add_teacher_schedule_exclusion
# then OPEN the generated SQL and write the constraint by hand
npx prisma migrate dev
```

`--create-only` is not optional. Generating and applying in one step means
the constraint never gets written.

Prisma still owns the table/column diff. It does not own the constraints.

## Choosing the mechanism

| Rule shape | Mechanism |
|---|---|
| No two rows overlap in time (teacher double-booking) | `EXCLUDE USING gist` with `tstzrange` + `&&` |
| Only one row active per parent (current owner, active enrollment) | partial unique index: `UNIQUE (student_id) WHERE ended_at IS NULL` |
| Value must be in a set / within a bound | `CHECK` constraint |
| Rule spans tables, or must fire on write | `TRIGGER` + a `PL/pgSQL` function |
| Referential integrity | real `FOREIGN KEY`, with a deliberate `ON DELETE` |
| Derived total must match its parts | see `spellzee-entitlement-ledger` — usually a trigger asserting the invariant, not a stored total |

Reach for the simplest one that actually holds. A trigger is the last
resort, not the first — it is invisible in the schema file and easy to
forget in a restore.

See `references/patterns.md` for the concrete SQL of each.

## The known invariants on this project

These come from `/CLAUDE.md` and the requirements baseline. Not exhaustive —
add to `references/patterns.md` as more are established.

- **One active coordinator/owner per student** at a time. Ownership history
  is preserved; only one row is current.
- **No overlapping sessions for a teacher** — the same teacher cannot be
  booked in two places at one time. This is the canonical `EXCLUDE` case.
- **Entitlement balances** — consumed + protected + remaining reconciles to
  purchased, per subscription.
- **A permanent student identity is never reused or renumbered**; merges
  preserve the original audit references rather than deleting a row.
- **An unapproved teacher cannot be allocated** — certification gates
  allocation eligibility.
- **A session belongs to exactly one schedule/series**, and a compensation
  session never joins the recurring series.

## Constraint tests — the highest-value tests here

Every invariant migration owes a test that **attempts the violation and
asserts the database rejects it**. Not a service-level test: the point is
to prove the constraint exists and works, independent of any code path
that might be added later.

```ts
it('rejects a second active owner for the same student', async () => {
  await insertOwnership({ studentId, endedAt: null });
  await expect(
    insertOwnership({ studentId, endedAt: null }),
  ).rejects.toThrow(/one_active_owner/);
});
```

Run against real PostgreSQL — the `spellzee_test` database on port 5433 on
this machine (no Docker; see `project-conventions`). Never a mock: a mocked
repository proves nothing about the component most likely to fail. Because
that database persists between runs, each test must clean up after itself —
wrap in a transaction and roll back, or truncate.

Assert on the **constraint name**, so a test can't accidentally pass on an
unrelated error.

Name constraints explicitly (`CONSTRAINT one_active_owner ...`). An
auto-generated name is unreadable in a production error and untestable.

## Anti-patterns — each one is the strategy quietly ending

- Validating a cross-row rule in a service and calling it done.
- `findFirst` then `create` as a uniqueness check. That is a race, not a
  constraint — two concurrent requests both see nothing and both insert.
- Running `prisma migrate dev` without `--create-only` on a table that
  carries a rule.
- Adding a stored/denormalized total instead of constraining the parts.
- Dropping a constraint to make a test or a seed script pass.
- `ON DELETE CASCADE` on anything historical — this project does not delete
  critical records at all (see `/CLAUDE.md`, governance).

## When a constraint genuinely blocks a legitimate case

That is the sacrifice this decision made knowingly. The answer is a
migration that narrows the constraint to the real rule — **not** dropping it
and moving the check into code. If the rule genuinely varies per case, that
is the reversal trigger firing (decision 2 in `/tradeoff-library.md`): say
so explicitly and record it, rather than eroding it silently.

## Definition of Done

Run `references/dod.md` before calling any schema or invariant work complete.
