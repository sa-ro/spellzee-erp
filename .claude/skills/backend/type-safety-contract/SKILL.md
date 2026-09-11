---
name: type-safety-contract
description: Use when a type has to survive the trip from the database to the browser — adding or changing anything in packages/contracts, deciding what shape an endpoint returns, keeping a TEXT+CHECK vocabulary in sync with its TypeScript union, or when the same concept is about to be declared twice on two sides of the wire. Triggers on "contracts package", "shared type", "response type", "DTO", "the UI needs this shape", "duplicate type", "enum", "status values", "keep these in sync", "any". Distinct from backend-api-design (which owns the endpoint's behaviour — validation, errors, pagination) and from frontend/api-integration (which owns the client's fetching); this skill owns only the type that passes between them.
---

# The contract is the seam

`packages/contracts` is the only place the backend and the frontend agree. `CLAUDE.md` puts it
plainly: the backend run owns the endpoint and its response types, and the UI *imports* those
types rather than re-declaring them. When that holds, a schema change becomes a compile error
in the console. When it does not, it becomes a bug someone finds in production.

There is no tRPC here and no OpenAPI codegen step. The mechanism is plain shared TypeScript,
compiled as a project reference — which means the compiler is the enforcement, and it only
works if nothing re-declares what the contract already declares.

## Goals

- **One declaration per concept.** A student status, a session outcome, a paginated envelope:
  declared once in `packages/contracts`, imported everywhere else.
- **A change to the database surfaces as a type error**, not as a runtime surprise. That is the
  entire return on this arrangement.
- **The contract describes the wire, not the tables.** It is not a mirror of the Prisma models.
  Internal columns, soft-delete flags and audit bookkeeping do not belong in it.
- **`packages/contracts` stays importable from the browser.** Its tsconfig deliberately has no
  DOM libs and no node types.

## Constraints

- **Never import `@prisma/client` from `packages/contracts`.** The contracts package is
  browser-importable; a Prisma import drags node types and the generated client into the web
  bundle. ESLint already forbids commands importing it directly — the same reasoning applies
  harder here.
- **Never re-declare a contract type in `apps/web`.** If the shape is inconvenient, fix the
  contract; a local copy is the thing this skill exists to prevent.
- **A `TEXT` + `CHECK` column and its TypeScript union are two halves of one decision.** The
  database is the enforcement (`project-conventions/references/conventions.md` — enumerated
  values are `TEXT` + a named `CHECK`, never a Postgres `ENUM`, and "the vocabulary itself
  belongs in `packages/contracts/shared`"). Changing one without the other is how the two
  silently diverge.
- **`any` at the boundary defeats the arrangement.** Biome has `noExplicitAny` off, so the
  compiler will not stop you — this is the one place to be strict by hand. `unknown` plus a
  narrowing function is the alternative.
- **Derived values are not contract fields with stored counterparts.** `remaining` is computed
  from the ledger; it may appear in a *response* type, but there is no column behind it and
  nothing may write it back.

## Gotchas — the ways this actually breaks

- **The CHECK constraint and the union drift.** Someone widens a `CHECK` in a migration to add
  a new session outcome, ships it, and the union in `contracts` still lists the old set. Nothing
  fails: the database accepts the new value and the frontend's exhaustive `switch` silently
  falls through to a default. **Both change in the same commit, or neither does.** A
  constraint test that asserts the accepted set and a type-level exhaustiveness check are the
  two ends of the same rope.
- **`exactOptionalPropertyTypes` is on.** `{ a?: string }` and `{ a: string | undefined }` are
  different types here. A response builder that sets `a: undefined` will not satisfy `a?:`.
  This bites most when mapping a nullable database column to an optional field — decide
  deliberately between `| null` (the row has no value) and `?` (the endpoint omits the key).
- **`noUncheckedIndexedAccess` is on.** `arr[0]` is `T | undefined`. Contract types that model
  a non-empty list as `T[]` push that check onto every consumer.
- **Prisma's generated types are not contract types.** They carry every column, use
  `Decimal` and `Date` objects that do not survive JSON, and change shape with every `select`.
  Map explicitly at the boundary; do not export a Prisma type through `contracts`.
- **`Date` does not survive the wire.** It serialises to a string and arrives as a string. A
  contract field typed `Date` is a lie the compiler believes on the server and the client
  disbelieves at runtime. Use an ISO-8601 `string`, and name the field so the timezone question
  is answerable.
- **Adding a required field to a response type is a breaking change to every consumer**, and
  in a monorepo with project references it breaks the build immediately — which is correct, and
  is the point. Adding an optional one does not. Know which you are doing.
- **A project reference that is not listed does not type-check.** `apps/api` and `apps/web`
  both reference `packages/contracts` in their tsconfig. A new package that consumers forget to
  reference compiles locally against stale `.d.ts` output until someone runs a clean build.

## What to do when the database vocabulary changes

1. Change the `CHECK` constraint in a hand-written migration (`spellzee-invariants` owns this).
2. Change the union in `packages/contracts` in the same commit.
3. Let `npm run typecheck` find every consumer that no longer handles the full set. If nothing
   breaks, the union was probably not being used exhaustively — that is a finding, not a relief.
4. Add or extend the constraint test that asserts which values the database accepts.

## Definition of Done

Run `references/dod.md` before calling any contract change complete.

## Related

- `spellzee-invariants` — owns the `CHECK` constraint itself and its migration.
- `backend-api-design` — owns what the endpoint *does*; this skill owns only the type it returns.
- `frontend/api-integration` — owns the client's fetching and caching of that type.
- `project-conventions` — the observed rules this skill depends on.
