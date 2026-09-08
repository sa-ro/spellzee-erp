# Project Conventions — Template (fill in once real code exists)

_Last updated: 2026-09-09 — local environment section populated; the rest still awaits real code._

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

- File naming: _TBD_
- Variable/function casing: _TBD_
- DB table naming (singular/plural, snake_case): _TBD_
- DB column naming: _TBD_

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
| Testing | _TBD_ (Vitest expected) | Real Postgres, no Testcontainers — see Local environment |

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
