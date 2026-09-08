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
```

`modules/` depends on `platform/`. **`modules/` must never import from `integrations/`** — a
command writes an outbox row and a worker makes the call. A direct import means a third party
landed in the request path.

## Every state-changing command does four things in one transaction

```
authorize → write → audit → enqueue outbox
```

The machinery lives in `platform/` **once**. Scattered across ten modules, the tenth forgets the
audit row — and `/CLAUDE.md`'s north star, *nothing important happens invisibly*, is broken quietly.

## Module shape

```
<module>/
├── commands/     one file per state change
├── queries/      read side — no writes, no audit row
└── api/          controller + dto/
```

**One command per file**, so "does this follow the write path?" is answerable by reading one
screen. `commands/` and `queries/` are separate directories but **this is not CQRS** — same
database, same transaction, no read store. The split marks which side traverses the write path.

## Phase

Phase 1 is `identity`, `operations`, `finance`, `governance`. The other four exist as empty
directories so the boundary is visible from the start — `academic` is Phase 2, `teacher-hr` is
Phase 3, `analytics` is Phase 5, and `communication` carries notification templates and channel
routing.

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
