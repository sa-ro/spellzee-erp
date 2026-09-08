# Folder structure — modular monolith

Decided 2026-09-09, before any code exists. This is the layout `schema-architect`,
`write-path-builder` and `integration-builder` build into; `project-conventions` records it as
observed fact once real files land.

**It is not arbitrary.** Two pressures shape it, and both have to be satisfied at once:

- **Domain modules** — CLAUDE.md names ten. They are the *business* boundary.
- **Erosion points** — the agents and the hook reason in *layers*: the uniform write path,
  invariants, the integration edge. They are the *correctness* boundary.

A layout that serves only the first scatters the write path across ten modules and lets it drift.
One that serves only the second loses the domain. This layout keeps both.

---

## Repository

```
spellzee-erp/
├── apps/
│   ├── api/                    NestJS — the modular monolith
│   └── web/                    Next.js — internal console (parent portal later)
├── packages/
│   └── contracts/              shared types: the API seam
├── prisma/
│   ├── schema.prisma
│   └── migrations/             hand-written invariant SQL
└── docs/
```

**Why a monorepo.** CLAUDE.md gives shared types as a main reason Next.js was chosen. The frontend
**imports** response types from `packages/contracts`; it never re-declares them. A duplicated type
drifts from the API silently, and nothing fails until a user sees the wrong number.

`prisma/` stays at the root rather than under `apps/api`. The schema is the project's spine — the
web app never touches it, but migrations are reviewed as a first-class artefact, not as an
implementation detail of one app.

---

## `apps/api/src` — the backend

```
src/
├── modules/          domain modules — the business boundary
├── platform/         the uniform write path — the correctness boundary
├── integrations/     the eventual-consistency edge
└── workers/          a separate always-on deployable
```

Those four are not peers by accident. `modules/` depends on `platform/`; `integrations/` and
`workers/` sit at the boundary. Nothing in `modules/` may import from `integrations/` directly — it
writes an outbox row and a worker does the rest.

### `modules/` — domain

One directory per domain module from CLAUDE.md. Phase 1 needs four of the ten:

```
modules/
├── identity/           parents, students, duplicate control, merge
├── operations/         handover, ownership, allocation, scheduling,
│                       sessions, compensation, tickets, SLA
├── finance/            subscriptions, payments, the session ledger
├── governance/         RBAC, approvals, maker-checker, audit
│
├── academic/           Phase 2
├── teacher-hr/         Phase 3
├── communication/      notification templates, channel routing
└── analytics/          Phase 5
```

Each module has the same internal shape:

```
identity/
├── identity.module.ts          NestJS module wiring
├── commands/                   one file per command — state changes
│   ├── create-student.command.ts
│   ├── merge-duplicate.command.ts
│   └── update-contact.command.ts
├── queries/                    read side — no writes, no audit row
│   ├── find-student.query.ts
│   └── search-duplicates.query.ts
├── api/
│   ├── identity.controller.ts
│   └── dto/                    request shapes; responses come from contracts
├── identity.repository.ts      Prisma access for this module
└── identity.types.ts           domain types internal to the module
```

**One command per file.** Every state change is its own file, so "does this follow the uniform
write path?" is answerable by reading one screen. A fat `identity.service.ts` with eight methods
hides a command that quietly skipped its audit write — and `backend-api-design` names giant service
classes an anti-pattern for exactly this reason.

**Commands and queries are separate directories, and this is not CQRS.** Same database, same
transaction, no read store — CQRS was rejected. The split is that commands traverse the uniform
write path and queries do not, so the folder makes the distinction visible.

**Invariants that span modules live in the database, not in a shared service.** Entitlement spans
`finance` and `operations`; capacity spans `teacher-hr` and `operations`. Those are constraints, and
that is *why* this is one deployable rather than services.

### `platform/` — the uniform write path

The single most important directory. Every state-changing command does four things in one
transaction, and the machinery for all four lives here, once:

```
platform/
├── write-path/
│   ├── command-bus.ts          the transaction boundary
│   └── command.base.ts         authorize → write → audit → outbox
├── authz/
│   ├── authz.guard.ts          RBAC over view/create/edit/approve/…
│   ├── relationship.ts         coordinator-of, teacher-of, parent-of
│   └── maker-checker.ts        requester ≠ approver
├── audit/
│   └── audit.interceptor.ts    who, what, why, old value, new value
├── policy/
│   └── policy.service.ts       policyAsOf(key, at) — never "current"
├── outbox/
│   └── outbox.writer.ts        writes the row; never calls anything
└── auth/
    └── session.adapter.ts      PLACEHOLDER — provider deferred
```

This exists because CLAUDE.md chose NestJS specifically so the write path is *enforceable by
convention rather than by memory*. Scatter it across ten modules and each one re-implements it
slightly differently; the tenth forgets the audit row.

`auth/session.adapter.ts` is the deferred authentication boundary. Authorization is ours and is
fully built; authentication sits behind this one file so swapping providers later touches nothing
else. **Label it a placeholder wherever it appears.**

### `integrations/` — the eventual-consistency edge

```
integrations/
├── merithub/
│   ├── merithub.client.ts      HTTP only; no domain logic
│   ├── merithub.adapter.ts     maps Spellzee IDs ↔ external IDs
│   ├── merithub.types.ts
│   └── inbox/
│       ├── inbox.handler.ts    dedupe key, idempotent
│       └── webhook.controller.ts   returns 200 fast, processes async
├── freejump/
└── channels/
    └── whatsapp/               provider deferred; adapter shape only
```

The only place in the system where consistency is eventual. Nothing here is called from a request
handler — commands write outbox rows, workers call these.

Path naming matters: `guard-invariants.js` exempts `client`, `adapter` and `infrastructure` paths
from its "third-party call on the request path" check. Rename these and the hook starts flagging
legitimate calls.

### `workers/` — a separate deployable

```
workers/
├── worker.main.ts              its own entrypoint, NOT apps/api's
├── outbox.worker.ts            drains the outbox
├── outbox-sweeper.worker.ts    re-enqueues stale rows (Redis-loss recovery)
├── reconciliation.worker.ts    low-frequency poll; catches dropped webhooks
└── horizon.worker.ts           materialises session occurrences
```

Top-level and with its own entrypoint because it is a **different deployment unit**. CLAUDE.md:
workers must not scale to zero — a consumer inside a scale-to-zero service stops draining silently,
and that is the most common way an outbox pattern dies. If workers lived under `modules/`, someone
would eventually bundle them into the API and the failure would be invisible.

### `common/` — shared helpers, named by concern

```
common/
├── errors/                     domain error → HTTP mapping
├── pagination/                 cursor-based
├── etag/                       conditional requests — makes polling cheap
├── time/                       civil-time arithmetic, tstzrange helpers
└── ids/                        STU-2026-000184 generation and validation
```

**Helpers belong here — but the folder is named for its concern, never `utils/`.** A `utils/`
directory accumulates forty unrelated functions inside a month and nobody can tell what is in it.
`time/` and `ids/` are the same *kind* of code; the difference is that their names say what they
hold, so a new helper has an obvious home or forces you to name a new one.

`time/` earns its place early: sessions are `TIMESTAMPTZ`, cancellation policy is expressed as
"N hours before start", and the civil timezone is still an open decision. That arithmetic wants one
home, not a copy in every module.

**Date library: Day.js**, with the `utc` and `timezone` plugins — both required, not optional:

```ts
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);
```

Chosen for size (~2KB core), immutability, and one library across backend and frontend.

**Only `common/time` imports Day.js.** Modules, commands and workers use its exports. This is not
tidiness: a bare `dayjs()` resolves in the *server's* local timezone, which is right on a developer
machine in India and wrong on a container in `UTC` — and it fails silently, producing a cutoff that
is off by hours with no error anywhere. One import site means one place where the zone is applied,
and one place to change when the civil-time decision lands.

**Day.js does not touch `tstzrange`.** The overlap constraints are Postgres-side; Prisma passes
`Date` objects and the database builds the ranges. Day.js is for application arithmetic — session
length, cutoff comparison, display — never for constructing a range literal.

**Constants do not live here, and there is no `constants/` directory.** The distinction matters:

| Domain vocabulary → `packages/contracts/shared` | Business policy → a versioned policy row |
|---|---|
| `'late_cancellation'` — the status *name* | 24 hours — the *cutoff* |
| `'compensation_grant'` — the entry type | 30 days — the *validity* |
| `'stalled'` — the provisioning state | 3 attempts — the *retry cap* |

The left column is vocabulary the frontend needs too, so it lives in `contracts/`. The right column
is policy, and a `constants/` folder is exactly where someone would write
`CANCELLATION_CUTOFF_HOURS = 24` — quietly reversing decision 5. Not having the folder removes the
temptation.

---

## `apps/web/src` — the console

Stack settled 2026-09-09: **shadcn/ui** (Radix + Tailwind) for components, **TanStack Table** for
the grid, **TanStack Query + axios** for server state, **Zustand** for the little client state left. Both key choices are headless with the code in the
repo, which is what lets the still-pending Figma tokens apply directly instead of through a
library's theme API. See `tradeoff-library.md` decision 10.

shadcn components land in `components/ui/` as editable source — they are ours to modify, not a
dependency to override. That matters for the parts no library ships: sixteen colourblind-safe
session statuses, maker–checker approval cards, the audit trail, the stall queue.

```
src/
├── app/                        Next.js routes
├── features/                   mirrors the API's modules
├── components/
│   └── ui/                     shadcn components — editable source, not a dependency
└── lib/
    ├── api/                    TanStack Query + axios; imports contracts
    ├── polling/                ETag-aware; no WebSockets
    ├── format/                 display formatting — dates, counts, names
    └── utils.ts                shadcn's `cn()` lives here, by its convention
```

`lib/utils.ts` is the one sanctioned exception to "no `utils`": shadcn generates components that
import `cn` from exactly that path. Fighting the convention costs more than it saves — but it holds
`cn` and nothing else. Anything a second helper would go in belongs in a named folder beside it.

`format/` is display-only. Business rules never live here: a formatter decides how a date *looks*,
never what a cutoff *means*.

---

## `packages/contracts` — the seam

```
contracts/
├── identity/
├── operations/
├── finance/
├── governance/                 RBAC verbs, approval states
└── shared/                     domain vocabulary both sides need
```

Response types and shared enums. The backend owns them; the frontend imports them. Nothing with a
runtime dependency on NestJS or Prisma goes here — it must stay importable from the browser.

`shared/` holds the **domain vocabulary**: the sixteen session outcomes, ledger entry types, the
four provisioning states, ticket statuses, RBAC verbs. Both sides need the same strings — the
backend to store them, the frontend to render a status badge — and a second copy on the frontend
drifts silently the first time a value is added.

Vocabulary only. A threshold is not vocabulary; it is a versioned policy row.

---

## Rules this layout encodes

1. **`modules/` never imports from `integrations/`.** A command writes an outbox row; a worker makes
   the call. Direct import means a third party landed in the request path.
2. **Every command file goes through `platform/write-path`.** A command that touches Prisma
   directly has skipped authorization, audit, or both.
3. **`workers/` has its own entrypoint** and deploys separately, minimum instances ≥ 1.
4. **Invariants are in `prisma/migrations/`**, hand-written, never in a module.
5. **The frontend imports from `packages/contracts`** and never re-declares an API type.
6. **Path names are load-bearing** — `guard-invariants.js` reads them. `worker`, `adapter`,
   `client`, `infrastructure` are exempt from the request-path check; `controller`, `service`,
   `handler`, `resolver`, `route` are checked. Renaming a directory changes what the hook enforces,
   so treat a rename as a change to the guard.

## Who enforces these rules

Three layers, and they catch different things. None is a substitute for another.

| Layer | Sees | Catches |
|---|---|---|
| **Hook** (`guard-invariants.js`) | file paths + text, on every Bash/Write/Edit | `await this.merithub.x()` in a command; `prisma migrate dev` without `--create-only`; a stored balance column |
| **ESLint** | the module graph, with type information | the **import** — the step before the call; boundary violations; a floating promise |
| **erosion-auditor** | the diff, with reasoning | intent — a command that imports the write path and then skips its audit step |

The hook cannot see an `import` statement. That is not a gap to fix in the hook; it is why ESLint
is here:

```
hook    →  await this.merithub.createClass()          the call
eslint  →  import { MerithubClient } from '../../integrations/...'   the import that enabled it
```

### The split between ESLint and Biome

**Biome formats and does fast style linting.** No Prettier. It ran the whole repo in ~110ms.

**ESLint does two things Biome structurally cannot**, and nothing else:

1. **`import/no-restricted-paths`** — the four boundary zones above. Biome's `noRestrictedImports`
   matches module names, not directory-to-directory relationships.
2. **Type-aware rules** — `no-floating-promises`, `await-thenable`, `no-misused-promises`. These
   need the type checker, which Biome does not have. A dropped promise inside a transaction commits
   half the work and reports success; that is the highest-value rule in the config.

Keeping ESLint's config small is deliberate. A slow lint gets skipped, and a skipped lint enforces
nothing.

### Verified, not assumed

Each rule was checked against a fixture that violates it, then the fixtures were deleted:

| Fixture | Result |
|---|---|
| `modules/identity/commands/` importing `integrations/merithub` | caught |
| A command importing `@prisma/client` | caught |
| A command importing `dayjs` directly | caught |
| `apps/web` importing from `apps/api` | caught |
| `packages/contracts` importing app code | caught |
| An un-awaited promise | caught |
| `any` | caught |
| A command importing `common/time` | clean |

### Sanctioned exemptions

- `common/time` and `lib/format` may import `dayjs` — they are the two intended sites.
- Tests may import Prisma and `dayjs` directly: a constraint test asserts *the database* rejects a
  violation, which means talking to it.
- `docs/` is outside Biome's formatter — `tokens.json` is hand-aligned for reading.

## What is deliberately absent

- **No `services/` layer as a catch-all.** Logic belongs in a command, a query, or `platform/`.
- **No `utils/`.** Helpers are welcome; the landfill is not. `common/time`, `common/ids`,
  `web/lib/format` are the same code with a name that says what it holds. (`web/lib/utils.ts` is the
  single exception — shadcn generates imports against that exact path, and it holds `cn` only.)
- **No `constants/`.** Domain vocabulary goes in `packages/contracts/shared` because both sides need
  the same strings; a threshold is a versioned policy row. A `constants/` folder is precisely where
  `CANCELLATION_CUTOFF_HOURS = 24` gets written, and decision 5 is reversed without anyone deciding
  to reverse it.
- **No read store, no CQRS split, no reconciliation-job directory.** Consistency is strong inside
  the database by design; a reconciliation job appearing is a signal the boundary moved.
- **No `cache/`.** The database is truth. Redis holds queue state, rate limits, sessions and the
  external token cache — nothing whose loss corrupts truth.
