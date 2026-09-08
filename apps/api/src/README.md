# `apps/api/src` — orientation

Empty scaffolding. The full reasoning is in
[`docs/folder-structure.md`](../../../docs/folder-structure.md); this is the short version for
someone standing in the directory.

## The four top-level directories are not peers

```
modules/        domain          — the business boundary
platform/       write path      — the correctness boundary
integrations/   external edge   — the only eventually-consistent place
workers/        separate deploy — its own entrypoint

config/         validated env   — the ONLY place process.env is read
health/         liveness, readiness, outbox age
common/         helpers, named by concern
```

Dependencies point one way: **`modules/` → `platform/` → `common/`**. `platform/` never imports a
module (the write path is domain-agnostic); `common/` never imports either (a helper needing domain
knowledge is not a common helper).

**`modules/` must never import from `integrations/`** — a command writes an outbox row and a worker
makes the call. A direct import means a third party landed in the request path.

All of this is enforced by ESLint, not convention.

## Every state-changing command does four things in one transaction

```
authorize → write → audit → enqueue outbox
```

The machinery lives in `platform/` **once**. Scattered across ten modules, the tenth forgets the
audit row — and `/CLAUDE.md`'s north star, *nothing important happens invisibly*, is broken quietly.

**The command bus opens the transaction. Nothing else does.** Every command receives the transaction
client as a parameter; a nested command joins the caller's transaction rather than starting its own.
That is why commands may not import `@prisma/client` — reaching for the global client silently
starts a second transaction, and the invariant the two commands share stops being atomic. See
`docs/folder-structure.md`, "The transaction boundary".

## Module shape

```
<module>/
├── index.ts      the PUBLIC API — the only file other modules may import
├── commands/     one file per state change          private
├── queries/      read side — no writes, no audit row private
└── api/          controller + dto/                   private
```

**`index.ts` is the module boundary.** Another module importing
`finance/finance.repository` fails the build; importing `finance` (its index) is fine. That one
rule is what makes this a modular monolith rather than a monolith with folders — without it, the
entitlement rule ends up written in two places and the boundary that justified a single deployable
is gone.

**Modules call each other directly through that API. There is no event bus** — entitlement and
ownership are invariants that must hold inside one transaction, and an event bus removes the
caller's knowledge of whether the work happened. Something genuinely fire-and-forget goes through
the **outbox**, which is already durable.

**One command per file**, so "does this follow the write path?" is answerable by reading one
screen. `commands/` and `queries/` are separate directories but **this is not CQRS** — same
database, same transaction, no read store. The split marks which side traverses the write path.

## Phase

Phase 1 is `identity`, `operations`, `finance`, `governance`. The other four exist as empty
directories so the boundary is visible from the start — `academic` is Phase 2, `teacher-hr` is
Phase 3, `analytics` is Phase 5, and `communication` carries notification templates and channel
routing.

**Each module has a `README.md`** stating what it owns, what it explicitly does *not* own, its
invariants, and which open decisions block it. Read the module's README before writing in it — the
"does not own" section is the one that prevents work landing in the wrong place.

| Module | Phase | Centre of gravity |
|---|---|---|
| [`identity`](modules/identity/README.md) | 1 | Permanent IDs, duplicate control, merge |
| [`operations`](modules/operations/README.md) | 1 | Ownership, allocation, sessions, tickets |
| [`finance`](modules/finance/README.md) | 1 | Subscriptions and the append-only ledger |
| [`governance`](modules/governance/README.md) | 1 | RBAC, maker–checker, audit |
| [`academic`](modules/academic/README.md) | 2 | Curriculum, lessons, assessment |
| [`teacher-hr`](modules/teacher-hr/README.md) | 3 | Training, certification, capacity |
| [`communication`](modules/communication/README.md) | 1–2 | Notifications, channels |
| [`analytics`](modules/analytics/README.md) | 5 | Reporting, later AI |

## Path names are load-bearing

`.claude/hooks/guard-invariants.js` reads them to decide what to check:

| Path contains | Effect |
|---|---|
| `worker`, `adapter`, `client`, `integrations` | Exempt from the third-party-call check — this is where those calls belong |
| `command`, `query`, `controller`, `service`, `handler`, `route` | Checked — an `await` on Merithub here is flagged |

**Renaming a directory changes what the hook enforces.** Treat a rename as a change to the guard,
not a tidy-up.

## Helpers go in `common/`, named by concern

```
common/errors · pagination · etag · time · ids
```

Shared helpers are welcome — a `utils/` folder is not. Same code, different name: `time/` and
`ids/` say what they hold, so a new helper either has an obvious home or forces you to name a new
concern. `utils/` accumulates forty unrelated functions and nobody can tell what is inside.

## Not here, on purpose

- No `services/` catch-all — logic is a command, a query, or `platform/`.
- No `utils/` — see above. Name the concern instead.
- **No `constants/`** — that is where `CANCELLATION_CUTOFF_HOURS = 24` gets written, quietly
  reversing decision 5. Domain *vocabulary* (status names, entry types, provisioning states) lives
  in `packages/contracts/shared` because the frontend needs the same strings; a *threshold* is a
  versioned policy row.
- No `cache/` — the database is truth.
- No reconciliation-job directory — one appearing means the consistency boundary moved.
