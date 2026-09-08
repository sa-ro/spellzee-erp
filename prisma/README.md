# `prisma` — schema, migrations, seed

## Migrations are hand-written

```bash
npx prisma migrate dev --create-only --name <descriptive_name>
# open the generated SQL and write the constraint yourself
npx prisma migrate dev
```

`--create-only` is not optional, and the guard hook blocks the plain form. Prisma's schema language
cannot express exclusion constraints, partial unique indexes with predicates, or triggers — exactly
the mechanisms this project's invariants depend on. Prisma owns the table diff; it does not own the
constraints.

Every invariant migration owes a **constraint test**: attempt the violation, assert the database
rejects it, assert on the constraint *name*. See `.claude/skills/backend/spellzee-invariants`.

## Seed — placeholders must look like placeholders

The seed's main job is the **policy rows**, and most of their values are not decided. Fifteen of
them are placeholders awaiting a business decision (`docs/open-decisions.md`).

Every seeded placeholder row carries a `reason` that says so, in words a person will recognise:

```
reason: 'PLACEHOLDER — awaiting business decision, see docs/open-decisions.md §30.2'
```

A placeholder that looks like a decision *becomes* one. Six months on, nobody remembers that 24
hours was a number someone typed to make the schema work, and the UI shows it to staff as policy.
The `policy-placeholder-badge` component in `docs/design/` exists for the same reason.

The seed is **idempotent** — safe to re-run, because it will be, on every fresh database. Upsert by
`policy_key` and effective date; never blind-insert.

## What the seed is not for

Not for test fixtures. Tests build the rows they need and clean up after themselves — a shared seed
that tests depend on becomes a file nobody can change without breaking twenty suites.

Not for demo data. If demo data is wanted later it goes in a separate, clearly-named script.
