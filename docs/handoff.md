# Handoff — state as of 2026-09-09

For picking this up on another machine, or in a fresh session. Read this first, then
`CLAUDE.md`.

**Where things stand:** the environment is recreated and verified (PostgreSQL 17.11 on 5433, both
databases, `btree_gist`, `.env`), all six Phase-1 shape-blocking decisions are resolved, and the
**first schema has landed** — commit `cb34f4e`, "identity & master data, with duplicate control".
12 tables in `spellzee_dev`/`spellzee_test`: `persons`/`students`/`parents`, contact history,
duplicate-block invariants, merge with maker-checker approval and redirect chains, and the
governance tables (`audit_log`, `approval_requests`, `approval_decisions`, `policy_versions`,
`staff_users`). 58/58 constraint and concurrency tests pass against real Postgres; no schema drift.

There is still **no NestJS app and no Next.js app** — only the Prisma schema, migrations, tests and
seed exist under `prisma/`. The next step is `write-path-builder` (NestJS commands/endpoints on top
of this schema) or `/api-feature` for whatever module the team prioritizes next — see "What's next"
below.

A one-page PDF of the 14 remaining value-blocking policy numbers and 4 process questions
(`phase0-decisions.pdf`, not checked in) was generated and sent to the business/ops team for
answers; nothing is blocked while waiting.

---

## Start here

```bash
git clone https://github.com/sa-ro/spellzee-erp.git
cd spellzee-erp
```

Then read, in this order:

1. **`CLAUDE.md`** — the working summary. Stack, the five load-bearing rules, precedence, agents.
2. **`tradeoff-library.md`** — ten decisions, each with a reversal trigger.
3. **`docs/open-decisions.md`** — the 21 baseline questions, sorted shape vs value.
4. **`docs/folder-structure.md`** — the layout to build into.
5. This file — what the last session decided that is not yet in a schema.

The PDF is the source of truth for requirements; `docs/baseline/requirements-draft-3.txt` is its
extracted text, there because read-only agents cannot run `pdftotext`.

---

## Environment — must be recreated on a new machine

**PostgreSQL 17.11**, installed natively via winget. No Docker on the old machine, so **no
Testcontainers** — tests share a persistent database and must clean up after themselves
(transaction rollback or truncate).

| | |
|---|---|
| Port | **5433** — a PostgreSQL 16 instance already held 5432 |
| Role | `spellzee` / `spellzee_dev` — LOGIN, CREATEDB, **not superuser** |
| Superuser | `postgres` / `spellzee_admin_2026` |
| Databases | `spellzee_dev`, `spellzee_test` |
| Extension | `btree_gist` in both — **required** by the EXCLUDE constraints |

```
DATABASE_URL="postgresql://spellzee:spellzee_dev@localhost:5433/spellzee_dev?schema=public"
```

Copy `.env.example` to `.env`. If the new machine has Docker, Testcontainers becomes an option again
— that would be a genuine improvement, and `project-conventions` plus the four places that mention
the persistent test database would need updating.

**Verified against the running database, not assumed:**

- `EXCLUDE USING gist` rejects overlapping teacher sessions.
- The `'[)'` half-open bound **allows** back-to-back sessions (one ending 16:00, next starting
  16:00). Getting this wrong makes consecutive classes impossible.
- `one_open_ticket_per_student` rejects a second open ticket while allowing a resolved one
  alongside, and a new one after the previous closed.

---

## Decisions made — and where each is recorded

| Decision | Answer | Recorded in |
|---|---|---|
| Cloud, auth, storage, observability, WhatsApp | **Deferred**, user confirms later | `CLAUDE.md` |
| Folder structure | Monorepo; backend split modules / platform / integrations / workers | `docs/folder-structure.md` |
| 21 baseline open decisions | 6 shape-blocking, 15 value-blocking | `docs/open-decisions.md` |
| Coordinator ownership | Sequential, one active owner, history preserved | `docs/open-decisions.md` §B |
| Ticket assignment | Transfers ownership **permanently** | same |
| One open ticket per student | New invariant, verified | invariants registry |
| MCP servers | Few, and none that reach the codebase | `tradeoff-library.md` decision 9 |
| Frontend stack | **shadcn/ui + TanStack Table + TanStack Query**, Zustand, Tailwind | `tradeoff-library.md` decision 10 |
| Client vs server state | Server → TanStack Query; **filters → the URL**; theme/density → Zustand | `skills/frontend/state-management` |
| Dates | **Day.js** + `utc`/`timezone` plugins, **one import site** | `project-conventions` |
| Lint / format | **ESLint** for boundaries + type-aware rules, **Biome** for format | `docs/folder-structure.md` |
| Repo scaffold | Directory tree exists, `.gitkeep`-held, no code | `docs/folder-structure.md` |
| Design tokens | Template only — every value `TBD`, format settled as CSS custom properties | `docs/design/` |

### Auth, specifically

Authentication is deferred; **authorization is not**. RBAC, maker–checker and permission-by-
relationship get built in Phase 1 as normal. Authentication sits behind an adapter with a
clearly-labelled session placeholder. Swapping providers later must not touch an authorization rule.

---

## What is on disk now

```
apps/api/src/     modules · platform · integrations · workers · common   (empty, .gitkeep)
apps/web/src/     app · features · components/ui · lib                   (empty)
packages/contracts/  identity · operations · finance · governance · shared
prisma/migrations/
package.json      lint tooling ONLY — no NestJS, no Prisma, no Next.js yet
eslint.config.js · biome.json · tsconfig.json
```

84 directories, 52 `.gitkeep`. All ten domain modules exist, not just Phase 1's four, so the
boundary is visible before anything is written into the wrong one.

`npm install && npm run check` passes on a clean clone. Biome's postinstall may need
`npm approve-scripts @biomejs/biome` — both binaries work regardless.

### Linting is real, not aspirational

Four of the six rules in `docs/folder-structure.md` now fail a build. The reason ESLint exists
alongside the hook is structural, and worth not re-deriving:

```
hook     sees paths and text   →  `await this.merithub.x()` in a command
eslint   sees the module graph →  the `import` that made that call possible
auditor  sees the diff         →  intent
```

The hook returns SILENT on a boundary-violating import — verified, not assumed. ESLint carries the
four `import/no-restricted-paths` zones, the `dayjs` and `@prisma/client` restrictions, and the
type-aware rules Biome cannot express (`no-floating-promises` most of all: a dropped promise inside
a transaction commits half the work and reports success).

Each rule was checked against a fixture that violates it; the fixtures were then deleted.

### The transaction boundary — settle this before the first command

"One transaction" is said everywhere in this project; the nesting case is where it gets decided in
practice, and it is unavoidable: `operations` consuming entitlement *is* a call into `finance`.

**The command bus opens the transaction. Nothing else does.** Commands receive the transaction
client as a parameter; a nested command joins the caller's, never starting, committing or rolling
back its own. A command reaching for the global Prisma client has silently started a second
transaction — which is why commands may not import `@prisma/client`, enforced by ESLint.

Isolation is `READ COMMITTED` plus explicit `SELECT ... FOR UPDATE` where a rule reads other rows to
decide (the entitlement check is the live example). Nothing slow inside the transaction — no HTTP
call, that is the outbox's job. The outbox row is inserted inside; the queue job is enqueued after
commit.

Full reasoning in `docs/folder-structure.md`, "The transaction boundary".

### Config, health and shutdown

- **Nothing outside `apps/api/src/config` reads `process.env`.** Validated once at boot with zod;
  the process exits on failure. A missing `APP_TIMEZONE` would otherwise make `dayjs.tz()` fall back
  to the host zone and put a cancellation cutoff silently out by hours.
- **Health checks are not the outbox alert.** Liveness means *restart me*, readiness means *stop
  routing to me*, and neither notices a worker that is running but not draining. The check that
  matters is the **age of the oldest pending outbox row**.
- **Worker shutdown is the one that matters.** On `SIGTERM` it stops claiming rows, finishes the one
  in flight, exits. Killed mid-claim it leaves a row `in_progress` with no process behind it, which
  shows up in the stall queue as a false alarm — and a real stall hides among the false ones.

### Seed and tests

- **Seeded placeholder policy rows carry a `reason` saying they are placeholders.** A placeholder
  that looks like a decision becomes one. Fifteen of them are awaiting business decisions.
- **Tests roll back a transaction rather than truncating.** There is no Testcontainers here, so the
  test database persists; isolation is the suite's job. Concurrency tests are the exception — they
  need two real connections and truncate their own tables.

### Module encapsulation — the rule most likely to be broken first

Every module has an `index.ts`, and **it is the only file another module may import**. ESLint
generates a restricted zone per module, with `index.ts` the sole exception.

```
modules/finance/index.ts               importable
modules/finance/finance.repository.ts  private — build fails
```

Without this a modular monolith is a monolith with folders: the entitlement rule ends up written in
two places and the boundary that justified a single deployable is gone. Retrofitting it after forty
files import each other's internals is expensive, which is why it is in place before any code.

**Modules call each other directly through that API — there is no event bus.** Entitlement and
ownership are invariants that must hold inside one transaction; an event bus removes the caller's
knowledge of whether the work happened. Something genuinely fire-and-forget goes through the
**outbox**, which already exists and is already durable.

Dependencies point one way: `modules/` → `platform/` → `common/`. Both reverse directions fail the
build.

### The Day.js rule

`dayjs` may be imported **only** by `apps/api/src/common/time` and `apps/web/src/lib/format` —
ESLint enforces it. A bare `dayjs()` resolves in the host's timezone: right on a laptop in India,
wrong in a UTC container, and silent either way. `APP_TIMEZONE` in `.env.example` is a flagged
placeholder — the baseline implies India but never declares a timezone policy.

---

## Decided in the last session, NOT yet written into any schema

**This section is the reason this file exists.** These were settled in conversation and are recorded
nowhere else. They are shape decisions and they define the first migration.

### Sessions: 1-to-1 and group, one structure

Both are in scope. A join table, not a `student_id` column on `sessions`:

```
sessions  ←──  session_participants  ──→  students
                 session_id
                 student_id
                 enrollment_id
                 subscription_id          ← each participant's own
                 attendance_status
                 ledger_entry_id
```

**1-to-1 is one participant; group is several.** Same structure, no special case — two code paths
would drift.

`session_type` lives on **`class_schedules`** (the series), not on the session. §14.1's "Session Type
Change: 1-to-1/group" is an allocation change to the schedule, not a per-session flip.

### The ledger's grain changes

**Entitlement is consumed per `session_participant`, not per session.** In a group class each student
has their own subscription and their own outcome:

```
Session #4521 (group, 3 students)
├── Aarav   attended   → consume 1
├── Diya    absent     → per policy: consume or protect
└── Kavin   attended   → consume 1
```

One session, three ledger entries, three different subscriptions. So a ledger row references
`session_participant_id`, **not** `session_id`. 1-to-1 is the same shape with one participant.

### Status splits across two levels

| Level | Statuses |
|---|---|
| **Session** | scheduled, live, completed, Spellzee cancellation, rescheduled |
| **Participant** | attended, absent, partial, late cancellation, student-side technical |

Teacher absent is session-level and affects everyone. One student absent is participant-level and
must not touch the others. This mirrors the Spellzee-side vs student-side fault distinction that
already drives entitlement — in a group class it becomes structural.

### Compensation is always 1-to-1

Even when the missed class was a group session. It stays a **separate session** that never mutates
the recurring schedule, so this does not disturb that rule.

*(Deliberately not decided: whether a group compensation could ever mean joining an existing group
session. That would break "compensation is a separate session", so it was left alone.)*

### Constraints this implies — not yet written

- **Student overlap** — a student cannot be in two sessions at once. `EXCLUDE USING gist` on
  `session_participants`, same shape as `teacher_no_overlap` but keyed by student.
- **Group max size** — a policy row (`capacity.group_max_size`, placeholder), enforced by a trigger
  because it is a cross-row count.

---

## What blocked the first schema — all six now answered

Six **shape-blocking** business decisions from `docs/open-decisions.md`, all resolved 2026-09-09.
None were guessed — each changes tables, so each got a real decision, recorded with reasoning in
`docs/open-decisions.md`:

1. **Capacity unit → sessions.** Matches §13.3's worked example directly — an integer count, no
   duration arithmetic. Recorded as a shape decision, not a `capacity.unit` policy row.
2. **Fields requiring approval → per-action command, not a per-field registry.** A sensitive field
   gets its own dedicated, always-gated command (e.g. `UpdateStudentDateOfBirth`); an ordinary field
   uses a separate ungated command. Matches "one command per file"; avoids a generic field-approval
   rule engine.
3. **Duplicate merge rules → block outright on high confidence; older ID always survives a merge.**
   No pending/approval state for high-confidence duplicates. The newer ID is retired but stays
   resolvable, redirecting to the survivor.
4. **Teacher vs student technical failure → student-side consumes entitlement**, same as a plain
   absence — no verification workflow, no separate protected path. Teacher/Spellzee-side failure
   still protects entitlement and triggers compensation, unchanged.
5. **Approval role set → §22.4's four roles as-is** (Staff/Coordinator, Team Lead/Manager, Finance,
   Restricted Admin), **single-level approval** — one qualified approver's decision is final, no
   escalation chain. Matches "dozens of staff" scale.
6. **Teacher/HR Phase 1 minimum → identity + certification_status + subjects/languages.** No
   availability, leave or performance fields yet — those wait for their own Phase 3 work.

Also previously answered: coordinator ownership (sequential, one active owner) and group classes
(both 1-to-1 and group in scope for Phase 1) — see the "Decided in the last session" section above.

**Nothing shape-blocking remains open for the first schema slice.** The 15 value-blocking items in
`docs/open-decisions.md` still take flagged placeholder policy rows, per usual — that is expected
and does not block starting `/api-feature`.

---

## The tooling, in one screen

```
.claude/
├── agents/      5 agents, split by erosion point; 2 are read-only by design
├── commands/    /api-feature  /ui-feature  /build-fullstack  /fix-bug
├── hooks/       guard-invariants.js — 7 checks, blocks or asks
└── skills/      backend/ 21 · frontend/ 28
```

- **`/api-feature`** — the backend chain. Stops at a shape-blocking decision, **always** at the
  schema gate, and on a silent architecture reversal.
- **`/ui-feature`** — frontend. Stops at the visual gate before any data is wired in.
- **`/build-fullstack`** — both in order, with a Figma stage between.

Each approved gate commits, so every gate is a rollback point.

**The hook does not see MCP tool calls.** No MCP servers are configured, deliberately — see
`tradeoff-library.md` decision 9. Figma and GitHub would be the safe additions; Postgres, Prisma and
filesystem MCPs are unwatched paths around every guard.

**Agents load at startup.** A fresh clone needs Claude Code restarted once before
`scope-interrogator` and the others appear.

---

## Suggested next steps

1. ~~**Recreate the environment**~~ — **DONE 2026-09-09.** PostgreSQL 17.11 on 5433, both databases,
   `btree_gist`, `.env` copied. `npm install` and `npm run check` both pass.
2. ~~**Get answers to all six shape-blockers**~~ — **DONE 2026-09-09.** Capacity unit (sessions),
   approval-field modeling (per-action command), duplicate merge rules (block outright / older ID
   survives), student-side technical failure (consumes), approval role set (§22.4's four, single
   level), teacher/HR Phase 1 minimum (identity + status + subjects/languages). See above.
3. ~~**Run schema-architect for the first slice**~~ — **DONE 2026-09-09.** Identity & master data
   with duplicate control landed as commit `cb34f4e`. See above.
4. **Deliberately paused: do not pick the next module to build without the team's input.** The
   business/ops team has `phase0-decisions.pdf` (14 policy numbers, 4 process questions). Once real
   answers come back — and once whoever owns product priority says what to build next (admission
   handover? allocation? scheduling? tickets?) — run `/api-feature <that thing>` for the write-path
   (NestJS commands/endpoints) on top of the identity schema, or for whichever module's schema comes
   next. Do not guess the priority from the roadmap order in `CLAUDE.md` — that lists Phase 1 scope,
   not build sequence.
5. **Fill `docs/design/`** once the Figma MCP is connected. The token format is settled (CSS custom
   properties), so the Figma values drop straight in.

Prisma, `@prisma/client`, `vitest` and `pg` are now installed (see `package.json`) — added by the
identity schema work. NestJS and Next.js remain uninstalled until the first write-path module and
the first screen land respectively.

---

## Things a fresh session will get wrong without reading this

- **Testcontainers.** Several skills used to say it; they were corrected. There is no Docker, so
  tests share `spellzee_test` and must clean up after themselves.
- **Port 5433**, not 5432. PostgreSQL 16 already holds 5432 on the old machine.
- **`prisma migrate dev` without `--create-only` is blocked by the hook.** That is deliberate —
  invariants are hand-written SQL, and the generator would apply the migration before anyone could
  edit it.
- **Path names are load-bearing.** The hook reads them to decide what to check: `worker`, `adapter`,
  `client`, `integrations` are exempt from the third-party-call check; `command`, `query`,
  `controller`, `service`, `handler`, `route` are checked. A rename changes what is enforced.
- **The 15 policy placeholder values in `docs/open-decisions.md` are placeholders**, not decisions.
  None was chosen by anyone with authority to choose it.
- **The frontend query layer is TanStack Query, not RTK Query.** The frontend skills were written
  against RTK Query and carry scoping notes mapping each rule across. Do not build an
  `axiosBaseQuery` — that is an RTK Query abstraction with no TanStack equivalent.
- **Table filters go in the URL, not Zustand.** A coordinator must be able to paste a link; refresh
  and back must both work. A filter in a store breaks all three, silently.
- **There is no `utils/` and no `constants/`, both on purpose.** Helpers live in named folders
  (`common/time`, `common/ids`, `lib/format`). Domain vocabulary lives in `packages/contracts/shared`
  because the frontend renders the same strings; a *threshold* is a versioned policy row, and a
  `constants/` folder is exactly where `CANCELLATION_CUTOFF_HOURS = 24` would get written.
  `lib/utils.ts` is the single exception — shadcn imports `cn` from that literal path.
- **`dayjs` has two sanctioned import sites** and ESLint enforces it. A bare `dayjs()` uses the
  host's timezone and fails silently.
- **Log identifiers, never values.** Most of this product is Sensitive data about children. A name
  or phone number in a log has escaped every permission check and reached a third-party service.
  See `docs/data-classification.md`. The audit table is the deliberate exception — §22.5 requires it
  hold old and new values — which is why reading it is permissioned and audit rows never reach
  application logs.
- **The audit table, policy versions and approval requests are append-only**, like the ledger. The
  hook asks on `UPDATE`/`DELETE` against any of them.
