# Project Conventions — Template (fill in once real code exists)

_Last updated: 2026-09-09 — local environment, database conventions and the trigger inventory are
now observed fact (schema slice 1). Application-code sections still await real code._

`pg_trgm` is installed in both databases alongside `btree_gist`. Both are **trusted** extensions in
PostgreSQL 17, so the non-superuser `spellzee` role can `CREATE EXTENSION` them — verified, so a
migration may carry `CREATE EXTENSION IF NOT EXISTS` itself rather than needing a DBA step.

## Local environment (observed, verified)

**PostgreSQL 17.11**, installed natively via winget — no Docker on this machine.

| | |
|---|---|
| Port | **5433** — PostgreSQL 16 already occupies 5432 |
| Binaries | `C:\Program Files\PostgreSQL\17\bin` |
| Service | `postgresql-x64-17` (automatic) |
| Dev role | `spellzee` (LOGIN, CREATEDB — **not** superuser) |
| Databases | `spellzee_dev`, `spellzee_test` |
| Auth | `scram-sha-256` |

`btree_gist` is installed in both databases. It is **required** for the
`EXCLUDE USING gist` constraints the invariants depend on (teacher double-booking,
overlapping policy versions) — a migration using one fails without it.

Credentials are in `.env` (gitignored); `.env.example` carries the shape.

**Testing implication:** there is no Docker, so **Testcontainers is not available**.
Integration and constraint tests run against the persistent `spellzee_test`
database instead of a fresh container per run. That makes test isolation the
suite's own responsibility — wrap each test in a transaction and roll back, or
truncate between tests. Do not assume a clean database at the start of a test.

**Verified working** (probed 2026-09-09, not assumed):
- An `EXCLUDE USING gist` constraint with `tstzrange(...) WITH &&` rejects
  overlapping rows.
- The `'[)'` half-open bound correctly **allows** back-to-back sessions
  (one ending at 16:00, the next starting at 16:00).

## Folder structure

_Fill in once the first module/route/service is written — e.g.:_
```
src/
  routes/
  services/
  repositories/
  migrations/
  tests/
```

## Naming conventions

- File naming: _TBD (application code)_
- Variable/function casing: _TBD (application code)_
- **DB table naming: plural, `snake_case`** — `persons`, `contact_points`, `approval_requests`.
- **DB column naming: `snake_case`**, mapped from Prisma's camelCase with `@map` / `@@map`.
- **Constraints and indexes are named explicitly, and the name reads as the rule**:
  `one_primary_guardian_per_student`, `merge_older_id_must_survive`. An auto-generated
  `persons_check1` is unreadable in a production log and cannot be asserted on.
- **Trigger error messages start with a stable, greppable token** — `duplicate_person_blocked:`,
  `maker_checker_violation:`, `append_only_violation:` — because a trigger raises a message, not a
  constraint name, and the tests and the error mapper both match on it.

## Database conventions (observed, slice 1)

- **Timestamps are `TIMESTAMPTZ(6)`.** Dates with no time (`date_of_birth`) are `DATE`.
- **Primary keys are `UUID`** with `gen_random_uuid()` (built in since PG13 — no `pgcrypto`).
- **`ON DELETE RESTRICT` everywhere. Never `CASCADE`** — this project does not delete historical
  records. Prisma emits `ON UPDATE CASCADE`, which is inert here because primary keys are immutable.
- **Enumerated values are `TEXT` + a named `CHECK`, not a Postgres `ENUM` type.** A `CHECK` can be
  narrowed or widened by an ordinary migration and shows the whole allowed set in the error;
  `ALTER TYPE` cannot remove a value at all. The vocabulary itself belongs in
  `packages/contracts/shared`.
- **Derived values are IMMUTABLE functions plus expression indexes, never stored columns.** See the
  `normalize_*` family. Two rules follow: schema-qualify every call inside a function body or index
  expression (`public.normalize_phone(...)`) because `CREATE INDEX` runs with a restricted
  `search_path`; and changing such a function's body must `REINDEX` its dependants in the same
  migration.
- **Applying a hand-edited migration uses `prisma migrate deploy`, not `prisma migrate dev`** — the
  guard hook blocks the latter (correctly) even for the apply step. Generate with
  `prisma migrate dev --create-only`, hand-write the SQL, apply with `deploy`.

### Triggers — invisible in `schema.prisma`, so inventoried here

If a schema is ever rebuilt from `schema.prisma` alone, every one of these is lost. They live only
in `prisma/migrations/`.

| Trigger | Table | Fires | Purpose |
|---|---|---|---|
| `persons_assign_spellzee_id` | `persons` | BEFORE INSERT | Mints `STU-2026-000184`; refuses an ID supplied by application code |
| `persons_identity_immutable` | `persons` | BEFORE UPDATE | ID / type / key / created_at never change; a merge is never reversed by an edit |
| `persons_merge_valid` | `persons` | BEFORE INSERT/UPDATE | Older ID survives, types match, survivor live, approved request names this pair. Locks the survivor `FOR UPDATE` |
| `persons_merge_redirects_live` | `persons` | **DEFERRED** constraint trigger | A redirect always points at a live identity |
| `persons_rename_not_duplicate` | `persons` | BEFORE UPDATE OF full_name | A rename cannot create a blocked duplicate |
| `contact_points_person_live` | `contact_points` | BEFORE INSERT | No new contact detail on a retired identity |
| `contact_points_block_duplicate` | `contact_points` | BEFORE INSERT/UPDATE | The duplicate block; takes `pg_advisory_xact_lock` on the match bucket |
| `student_guardians_persons_live` | `student_guardians` | BEFORE INSERT | No new guardian link on a retired identity |
| `approval_decisions_maker_checker` | `approval_decisions` | BEFORE INSERT | The requester never approves their own request |
| `audit_log_append_only` | `audit_log` | BEFORE UPDATE/DELETE, STATEMENT | Append-only |
| `approval_requests_append_only` | `approval_requests` | BEFORE UPDATE/DELETE, STATEMENT | Append-only |
| `approval_decisions_append_only` | `approval_decisions` | BEFORE UPDATE/DELETE, STATEMENT | Append-only |
| `policy_versions_supersede_only` | `policy_versions` | BEFORE UPDATE/DELETE | Only closing an open version is allowed; never DELETE |

## Tests

Constraint tests live in **`prisma/tests/*.spec.ts`**, beside the migrations they prove, and run
with **Vitest** (`npm test`) against the real `spellzee_test` database using `pg` directly — the
assertion is about PostgreSQL's error, its SQLSTATE and its constraint name, which an ORM hides.

- `prisma/tests/helpers.ts` provides `withRollback` (a transaction that is always rolled back) and
  `expectRejectionAt` (a SAVEPOINT, so one test can assert more than one violation — a failed
  statement otherwise aborts the whole transaction).
- **Concurrency tests truncate instead**, because two connections cannot see each other's
  uncommitted rows. `vitest.config.ts` sets `fileParallelism: false` so a truncate never lands in
  the middle of another file's fixtures.

## Error handling pattern

_TBD — how does an error raised in a service reach the HTTP response?
What shape does the client see? Does it match `backend-api-design`'s
generic standard error shape, or differ intentionally?_

## Auth pattern

_TBD — session or JWT? Where does the auth check happen (middleware,
decorator, manual check per handler)? What's the role/permission model?_

## Lint / format

**Biome** formats and does fast style linting. No Prettier. **ESLint** does only what Biome
structurally cannot: the four `import/no-restricted-paths` boundary zones, and type-aware rules
(`no-floating-promises`, `await-thenable`, `no-misused-promises`).

```
npm run check        # format check + lint
npm run lint         # eslint
npm run format       # biome, writes
```

Config: `eslint.config.js` (flat, ESLint 9), `biome.json`, `tsconfig.json` at the root.

The boundaries ESLint enforces are the ones the guard hook cannot see — the hook reads paths and
text, so it catches `await this.merithub.x()` but not the `import` that made it possible. Both
layers are needed; see `docs/folder-structure.md`.

Sanctioned exemptions: `common/time` and `lib/format` may import `dayjs`; tests may import Prisma
and `dayjs`; `docs/` is outside Biome's formatter.

## Libraries in use

Decided before code exists. Marked **locked** where reversing is an architecture decision, not a
preference — see `/tradeoff-library.md`.

### Backend

| Concern | Library | Notes |
|---|---|---|
| Web framework | **NestJS** (locked) | Chosen so the uniform write path is enforceable by convention. *(The Express entry that was here came from the generic skill's pre-project pin — superseded.)* |
| DB access | **Prisma** (locked) | Every invariant is a hand-written SQL migration: `--create-only`, then write the constraint |
| Migration tool | **Prisma Migrate**, `--create-only` always | The hook blocks the plain form |
| Queue | **BullMQ on Redis** | Fed by a Postgres outbox; the row is the commitment |
| Dates | **Day.js** + `utc` and `timezone` plugins | **Only `common/time` imports it** — see below |
| Validation | _TBD_ (zod expected) | |
| Logging | _TBD_ (pino expected) | |
| Testing | **Vitest** + node-postgres (`pg`) | Real Postgres, no Testcontainers. Constraint tests in `prisma/tests/` |

### Frontend

| Concern | Library | Notes |
|---|---|---|
| Components | **shadcn/ui** (Radix + Tailwind) | Editable source in `components/ui/`, not a dependency |
| Data grid | **TanStack Table** | Headless — our markup, our tokens |
| Server state | **TanStack Query** + axios | No `axiosBaseQuery`; that is RTK Query's abstraction |
| Client state | **Zustand** | Theme, density, sidebar. **Table filters go in the URL** |
| Forms | react-hook-form + zod | |
| Dates | **Day.js** | Same library both sides |

### The Day.js rule

`dayjs`, `dayjs/plugin/utc` and `dayjs/plugin/timezone` — the plugins are required, not optional.

**Only `common/time` (backend) and `lib/format` (frontend) import Day.js.** Everything else uses
their exports.

A bare `dayjs()` resolves in the *host's* local timezone — correct on a developer machine in India,
wrong on a container running `UTC`. It produces a cutoff off by hours and raises no error. One
import site means one place the zone is applied, and one place to change when the civil-time
decision lands.

Day.js never constructs a `tstzrange`. The overlap constraints are Postgres-side; Prisma passes
`Date` objects and the database builds the ranges.

## Deviations from the generic stack skill

_List anything this project does differently from
`nodejs-postgres-stack`'s defaults, and why._
