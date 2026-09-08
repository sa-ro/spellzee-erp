# Handoff — state as of 2026-09-09

For picking this up on another machine, or in a fresh session. Read this first, then
`CLAUDE.md`.

**Where things stand:** the tooling is built, the environment works, and the repository is
scaffolded and linted. There is **no application code yet** — the directory tree exists as empty
`.gitkeep` folders, `package.json` carries lint tooling only, and there is no Prisma schema, no
NestJS app and no Next.js app. The next step is the first schema, and it is now unblocked.

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

## What blocks the first schema — one thing, and it is not technical

Six **shape-blocking** business decisions from `docs/open-decisions.md`. None can be guessed; each
changes tables:

1. **Capacity unit** — hours / minutes / sessions / weighted slots. Four grains, not four values.
   The baseline contradicts itself: §13.3's example is in sessions, §30 leaves it open.
2. **Fields requiring approval to edit** — per-field registry or per-action enum? Decides the shape
   of the approval tables every write path traverses.
3. **Duplicate merge rules** — "block **or** require approval" are two outcomes; which ID survives is
   unstated. The confidence *threshold* is fine as a placeholder; the merge model is not.
4. **Teacher vs student technical failure** — §15.4's "generally", "may follow a separate policy" and
   "**verified**" are three ambiguities in one sentence. Decides the ledger's entry types.
5. **Approval role set** — §22.4 is "illustrative, not final" but is the only list of actors.
6. **Teacher/HR minimum for Phase 1** — certification workflow is Phase 3, but allocation is Phase 1
   and `allocation_requires_certified_teacher` reads `teachers.certification_status`.

Items 1 and 4 are the ones to ask first: capacity unit blocks the capacity tables entirely, and the
failure-rules answer defines the ledger vocabulary.

**Both previously-unlisted blockers are now answered** — ownership (sequential) and group classes
(both in scope). That is what unblocked schema work.

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

1. **Recreate the environment** — PostgreSQL 17 on 5433, both databases, `btree_gist`, `.env`.
2. **`npm install`**, then `npm run check` to confirm the lint layer works on the new machine.
3. **Get answers to shape blockers 1 and 4** at minimum. They are business questions; nobody can
   derive them from the code.
4. **Run `/api-feature`** for the first slice — identity and duplicate control is the natural start,
   since it has the fewest blocked dependencies. Phase 1 of that chain will re-check the open
   decisions; Phase 3 is the schema gate and will stop for approval.
5. **Fill `docs/design/`** once the Figma MCP is connected. The token format is settled (CSS custom
   properties), so the Figma values drop straight in.

Runtime dependencies are deliberately absent from `package.json`. NestJS, Prisma and Next.js get
installed when the first schema and the first module land — not before, because their versions and
adjacent choices interact with decisions still open.

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
