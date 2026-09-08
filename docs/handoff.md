# Handoff — state as of 2026-09-09

For picking this up on another machine, or in a fresh session. Read this first, then
`CLAUDE.md`.

**Where things stand:** the tooling is built and the environment works. There is **no application
code yet** — no `package.json`, no `apps/`, no Prisma schema. The next step is the first schema, and
it is now unblocked.

---

## Start here

```bash
git clone https://github.com/sa-ro/spellzee-erp.git
cd spellzee-erp
```

Then read, in this order:

1. **`CLAUDE.md`** — the working summary. Stack, the five load-bearing rules, precedence, agents.
2. **`tradeoff-library.md`** — nine decisions, each with a reversal trigger.
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
| Design tokens | Template only — every value `TBD` | `docs/design/` |

### Auth, specifically

Authentication is deferred; **authorization is not**. RBAC, maker–checker and permission-by-
relationship get built in Phase 1 as normal. Authentication sits behind an adapter with a
clearly-labelled session placeholder. Swapping providers later must not touch an authorization rule.

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
2. **Get answers to shape blockers 1 and 4** at minimum. They are business questions; nobody can
   derive them from the code.
3. **Run `/api-feature`** for the first slice — identity and duplicate control is the natural start,
   since it has the fewest blocked dependencies. Phase 1 of that chain will re-check the open
   decisions; Phase 3 is the schema gate and will stop for approval.
4. **Choose the frontend component library, data grid and query layer** before `/ui-feature` runs in
   anger. `CLAUDE.md` calls it a day-one decision — retrofitting a table abstraction across forty
   screens is a real cost.
5. **Fill `docs/design/`** once the Figma MCP is connected.

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
