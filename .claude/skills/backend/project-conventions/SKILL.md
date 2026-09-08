---
name: project-conventions
description: The actual, observed conventions of THIS project — naming, folder structure, error-handling pattern, auth pattern, lint/format rules, libraries already in use. Distinct from the generic domain skills (which hold universal principles); this one holds what this specific codebase actually does. Check this before writing any code, and update it the first time a convention is established or changed. Currently a template — populate it once real code exists.
---

# Project Conventions (living document)

The other skills teach universal principles. This skill records what THIS
project actually does, so "follow existing project conventions" (the
project-first rule in CLAUDE.md) has something concrete to check against
instead of being re-derived from scratch every session.

**Status: template, not yet populated.** No project code exists yet as of
this skill's creation. The first time real implementation work happens in
this repo, fill in the sections below from what's actually observed in
the codebase — don't invent conventions here speculatively.

## Sections to populate (see `references/conventions.md` for the template)

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
