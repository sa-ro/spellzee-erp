# Spellzee ERP — agent team

Five agents exist today. The rest of the chain is designed here but
deliberately **not built** — see "Why the rest is not built yet."

## The split, and why it is not by lifecycle stage

The obvious shape is planner → builder → reviewer → deployer → monitor. It
was rejected. This project's five load-bearing rules are **cross-cutting**:
invariants live in the schema, the write path spans every endpoint, the
ledger spans finance and operations, the outbox spans every integration. A
lifecycle split lets a generic builder push an invariant into service code
and hopes a reviewer catches it afterwards — which is exactly the model
`/CLAUDE.md` rejects when it says there is *"no code review to rely on."*

A domain split (identity, operations, finance…) was also rejected: invariants
span modules, which is why this is a modular monolith and not microservices.
Splitting agents by module re-introduces in the org the boundary the
architecture deliberately avoids.

So agents are split by **erosion point** — the places the design fails
silently. Feature work flows *through* those owners rather than around them.

## Built (Tier 1)

| Agent | Owns | Autonomy |
|---|---|---|
| `scope-interrogator` | Open business decisions: which block Phase 1, which take a flagged placeholder | Read-only |
| `schema-architect` | Prisma schema, hand-written invariant migrations, constraint tests | Approval always |
| `write-path-builder` | NestJS modules, the uniform write path, endpoints | Mixed by risk class |
| `integration-builder` | Outbox/inbox, workers, Merithub adapter, stall queue | Mixed by risk class |
| `erosion-auditor` | Auditing diffs against the trade-off library | Read-only |

### Order of use

1. **`scope-interrogator`** first, before any schema work. Building on an
   unaudited open decision is how a guess becomes a hard-coded fact.
2. **`schema-architect`** next. Everything else sits on the data model, and
   the invariants are what hold the design up.
3. **`write-path-builder`** and **`integration-builder`** in parallel, once
   the schema for their slice exists.
4. **`erosion-auditor`** before anything non-trivial lands.

### Running the chain: `/api-feature`

`.claude/commands/api-feature.md` runs that order automatically:

```
Phase 0  route the request           (orchestrator, no agent)
Phase 1  scope-interrogator          → STOPS on a shape-blocking decision
Phase 2  schema-architect
Phase 3  ── APPROVAL GATE ──         → always stops; human approves the schema
Phase 4  write-path-builder / integration-builder
Phase 5  tests (constraint, concurrency, integration)
Phase 6  erosion-auditor             → STOPS on a silent reversal
Phase 7  consolidated report
```

**Subagents cannot spawn other subagents.** The handoff is done by the main
session acting as orchestrator, carrying each phase's output forward into the
next agent's prompt — every agent starts cold and sees only what it is given.

Three points stop the chain, and all three hand back to the human:

- **Phase 1** — an open decision that changes the schema. Proceeding would
  mean guessing, which `/CLAUDE.md` forbids.
- **Phase 3** — the schema approval gate. Always. Everything downstream is
  built on it, so a wrong schema wastes three agents' work.
- **Phase 6** — a silent architecture reversal. Whether to erode a decision
  is the user's call, never an agent's; findings are never auto-fixed.

Read-side-only work skips Phases 1–3 entirely. Trivial changes skip the
chain altogether — a six-phase pipeline on a one-line change is waste.

### The three commands

| | `/api-feature` | `/ui-feature` | `/build-fullstack` |
|---|---|---|---|
| Builds | Backend | Frontend | Both, in order |
| Mechanism | The 5 agents | Main session | Agents, then main session |
| Skills | `backend/` | `frontend/` (28) | Both |
| Human gate | Yes — schema | Yes — visual | Yes — both |
| Figma | — | Yes | Yes, as Stage B |

`/build-fullstack` is the one to reach for when a feature needs an API *and*
a screen. It runs `/api-feature` whole, then converts the Figma design,
then wires the UI to the real endpoints. Its stages are ordered deliberately:

```
Stage 0   preflight    Figma MCP connected? frontend scaffolded?
Stage A   backend      the full /api-feature chain
          ── SCHEMA GATE ──        human approves the migration
Stage B   Figma → UI   presentational components only, no data
          ── VISUAL GATE ──        human approves the UI before data
Stage C   wiring       components ↔ real API, states, tests, re-check
Stage D   report
```

**Two gates, both mandatory, both for the same reason:** downstream work is
entangled with the thing being approved, so approving late means discarding
everything built on top.

- **Schema gate** — a landed migration is expensive to reverse against
  production data, and Stages B and C are built on the API shape it defines.
- **Visual gate** — wiring data into components whose visual accuracy nobody
  confirmed means that when the design turns out wrong, the wiring is thrown
  away with it. Reworking a component after integration costs far more than
  before, and it is silent, because the screen still "works."

**Backend goes first because the API contract is what the UI wires to.**
Converting a design against a schema the user has not yet approved is work at
risk — if Stage A stops at its gate, the whole chain stops rather than
building UI on a shape that may still change.

Stage C also **re-checks the design after integration.** Real data changes
layout — long names wrap, empty lists collapse, error banners push content
down — so a component that was pixel-perfect in isolation can break once data
flows through it. That regression is fixed in Stage C, not reported in
Stage D.

### Commits are the rollback points

Each gate commits **after** it is approved, never before — committing the
thing being approved would defeat the gate. A full-stack run leaves four
checkpoints on `main`:

```
schema(...)   schema gate approved      ← reset here to redo the data model
feat(...)     backend chain complete    ← reset here to redo the API
ui(...)       visual gate approved      ← reset here to redo the design
feat(...)     wiring verified           ← feature complete
```

This is what makes a wrong design cheap instead of expensive: if integration
reveals the UI was wrong, `git reset --hard` to the `ui(...)` commit and redo
Stage B with the backend untouched. Without these checkpoints, "remove
everything and start over" means the whole feature.

A rejected gate commits nothing. A failed erosion audit commits nothing — the
chain stopped, and the user has not yet decided what to do.

No remote is configured. These are local checkpoints; nothing is pushed
unless the user asks.

**Stage B builds dumb components** — props in, events out, no fetching. A
component that fetches its own data cannot be diffed against its Figma frame,
and it blurs the line between Stages B and C.

The seam everywhere is the **API contract**: `write-path-builder` owns the
endpoint, its authorization, its pagination and the response types; the
frontend imports those types rather than re-declaring them.

Both commands gate, for the same underlying reason: **downstream work is
entangled with the thing being approved.** A landed migration is expensive to
reverse against production data and Stages B–C are built on the API shape it
defines; a design approved only after wiring means the wiring is discarded
along with it. `/ui-feature` carries its own visual gate for exactly this
reason, so a standalone UI run is protected the same way a full-stack run is.

**Figma MCP is required for pixel-perfect work.** If `get_design_context`,
`get_screenshot` and `get_variable_defs` are not connected, Stage 0 says so
and offers the honest choice — connect it, or accept a structural
approximation that is labelled as such. Never claim pixel accuracy from a
screenshot alone.

### Why two agents are read-only

`scope-interrogator` produces evidence, not decisions — a business question
is not an agent's to answer.

`erosion-auditor` is read-only for a structural reason: the agent that wrote
the code will justify what it wrote. Spellzee's own product separates maker
from checker for sensitive actions; the same applies to the agents building
it. Giving the auditor write access would collapse that separation.

## Designed, not built (Tier 2 — once real code exists)

- **`frontend-builder`** — Next.js console screens against the 28 frontend
  skills. Blocked on: the headless component library, data grid and query
  layer being chosen (a day-one decision per `/CLAUDE.md` — retrofitting a
  table abstraction across forty screens is a real cost).
- **`test-hardener`** — concurrency tests, constraint coverage, failure
  injection. Blocked on: enough real code to harden.
- **`migration-safety`** — lock duration, backfill batching, expand-contract
  rollout. Blocked on: production data volume existing. Until there are real
  rows, `schema-architect` covers migrations.

## Designed, not built (Tier 3 — once deployed)

- **`release-runner`** — deploy, verify, roll back. Blocked on: a chosen
  cloud provider and a real pipeline.
- **`incident-responder`** — drives `workflow-incident-response`. Blocked on:
  production, and an observability vendor.
- **`outbox-watchdog`** — watches stalled outbox rows, stuck `provisioning`
  rows and worker liveness. The most likely Tier 3 agent to earn its place,
  because `/CLAUDE.md` names silent outbox death as the pattern's most common
  failure. Blocked on: workers running.

## Why the rest is not built yet

Writing a `release-runner` today means writing it against a repo with no
`package.json`, no cloud provider, no pipeline and no production. It would
sit unused for months while the stack, the skills and the conventions all
move underneath it — and then be rewritten anyway. An agent written before
its subject exists encodes guesses, and stale guesses are worse than an
absent agent because they read as authoritative.

Each Tier 2/3 entry above names its unblocking condition. Build it when the
condition is met, not before.

## Risk classes

Applies to every agent that can write.

**Needs human approval before landing:** schema and migrations, invariants
and constraints, the session ledger, subscriptions/payments/refunds, RBAC and
permissions, policy rows, audit structure, the Merithub contract, worker
deployment topology.

**Lands autonomously once its gates pass:** read-side queries and endpoints,
DTOs and shared types, tests, documentation, notification templates, adapter
internals behind a settled contract.

When a change is ambiguous, it needs approval — and the agent should say why
it judged it that way.

## Gates, not just roles

Roles alone do not prevent erosion; the gates do. Every agent that writes must
run, before reporting done:

- `workflow-pre-merge-review` — including its Spellzee erosion check.
- The `references/dod.md` of every skill it actually touched.
- `erosion-auditor` for anything non-trivial.

An agent reporting completion with a failing gate is a worse outcome than one
reporting the failure. Report honestly.

## Adding an agent

Only when there is an erosion point or a genuinely distinct failure model
that no current agent owns. Give it: the skills it must read, the hard rules
it must not break, its risk class, and its completion gates. An agent that
restates skill content instead of invoking it will drift out of sync with the
skills — reference, never duplicate.
