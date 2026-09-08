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

_TBD — ESLint config, Prettier config, any project-specific rules._

## Libraries in use

| Concern | Library | Notes |
|---|---|---|
| Web framework | Express (pinned) | see `nodejs-postgres-stack` |
| DB access | _TBD_ | |
| Validation | _TBD_ (zod expected) | |
| Logging | _TBD_ (pino expected) | |
| Testing | _TBD_ (Vitest expected) | |
| Migration tool | _TBD_ | |

## Deviations from the generic stack skill

_List anything this project does differently from
`nodejs-postgres-stack`'s defaults, and why._
