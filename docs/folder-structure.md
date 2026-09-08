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

### Shared

```
common/
├── errors/                     domain error → HTTP mapping
├── pagination/                 cursor-based
└── etag/                       conditional requests — makes polling cheap
```

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
├── components/                 presentational — props in, events out
└── lib/
    ├── api/                    TanStack Query + axios; imports contracts
    └── polling/                ETag-aware; no WebSockets
```

---

## `packages/contracts` — the seam

```
contracts/
├── identity/
├── operations/
└── finance/
```

Response types and shared enums. The backend owns them; the frontend imports them. Nothing with a
runtime dependency on NestJS or Prisma goes here — it must stay importable from the browser.

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

## What is deliberately absent

- **No `services/` layer as a catch-all.** Logic belongs in a command, a query, or `platform/`.
- **No `utils/`.** It becomes a landfill. Name the concern.
- **No read store, no CQRS split, no reconciliation-job directory.** Consistency is strong inside
  the database by design; a reconciliation job appearing is a signal the boundary moved.
- **No `cache/`.** The database is truth. Redis holds queue state, rate limits, sessions and the
  external token cache — nothing whose loss corrupts truth.
