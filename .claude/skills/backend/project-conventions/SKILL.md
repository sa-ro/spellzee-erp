---
name: project-conventions
description: The actual, observed conventions of THIS project — naming, folder structure, error-handling pattern, auth pattern, lint/format rules, libraries already in use. Distinct from the generic domain skills (which hold universal principles); this one holds what this specific codebase actually does. Check this BEFORE writing any code and before applying any other skill's default — CLAUDE.md gives it precedence over generic skill guidance. Update it in the same change whenever a convention is established or changes. Triggers on any real code change in this repo, and on "how does this project do X", "what's the convention for", "which library do we use".
---

# Project Conventions (living document)

The other skills teach universal principles. This skill records what THIS
project actually does, so "follow existing project conventions" (the
project-first rule in CLAUDE.md) has something concrete to check against
instead of being re-derived from scratch every session.

**Status: partly populated — read `references/conventions.md`, which is the
substance of this skill.** As of the identity schema slice, the local
environment, the database conventions, the trigger inventory, the test
pattern and the lint/format split are all **observed fact**, not templates.

Because `CLAUDE.md` gives this skill precedence over other skills' stated
defaults, treat what `references/conventions.md` records as settled as
authoritative — and do not conclude from this file's brevity that there are
no conventions to follow.

### Settled (in `references/conventions.md`)

- **Environment** — PostgreSQL 17.11 on port **5433**, roles and databases,
  `btree_gist` + `pg_trgm` installed. **No Docker on this machine**, so
  Testcontainers is unavailable and tests clean up after themselves.
- **Database conventions** — `TIMESTAMPTZ(6)`, UUID keys, `ON DELETE
  RESTRICT` never `CASCADE`, `TEXT` + named `CHECK` rather than a Postgres
  `ENUM`, IMMUTABLE functions plus expression indexes rather than stored
  derived columns, explicit readable constraint names, greppable trigger
  error tokens.
- **Trigger inventory** — the PL/pgSQL objects that are invisible in
  `schema.prisma` and therefore invisible to anyone reading only the Prisma
  schema.
- **Tests** — `prisma/tests/*.spec.ts`, Vitest, `withRollback` /
  `expectRejectionAt`, `fileParallelism: false`.
- **Lint/format split** — Biome formats; ESLint exists for
  `import/no-restricted-paths` boundaries and type-aware rules only.

### Still `_TBD_` — do not invent these

Folder-level file/variable naming, the **error-handling pattern**, and the
**auth pattern** (session vs JWT, where the check happens, the role model).
Several other skills assume an auth pattern that nothing here defines. When
one of these is decided, record it here in the same change.

## Remaining sections to populate (see `references/conventions.md`)

- **Folder structure** — where routes/controllers, services, repositories/
  data access, migrations, tests actually live.
- **Naming conventions** — file naming, variable/function casing, DB
  table/column naming (snake_case vs camelCase, singular vs plural table
  names).
- **Error handling pattern** — how errors propagate and get formatted in
  this project specifically (which may differ from `backend-api-design`'s
  generic standard error shape — if it does, this file wins for this
  project).
- **Auth pattern** — how authentication/authorization actually works here
  (session vs JWT, middleware location, role model).
- **Lint/format rules** — ESLint/Prettier config in use, and any rules
  this project enforces beyond defaults.
- **Libraries already in use** — actual ORM/query builder, validation
  library, logger, test framework chosen (should match
  `nodejs-postgres-stack`'s defaults unless the project deviated for a
  stated reason — record the reason if so).
- **Migration tool in use** — which one, and where migrations live.

## Keeping this current

Any time a new convention is established (first migration tool choice,
first auth middleware, first error-handling pattern) or an existing one
changes, update this file in the same change — don't let it drift from
reality. If this file conflicts with what's actually in the codebase,
the codebase is the source of truth — fix this file, not the other way
around.
