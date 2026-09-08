# Spellzee ERP

Operations & delivery platform for Spellzee (online tutoring), architected as the foundation of a
broader ERP. Currently **pre-code**: this repo holds the business baseline
([Spellzee_ERP_Master_Product_Business_Requirements_Draft_3.pdf](Spellzee_ERP_Master_Product_Business_Requirements_Draft_3.pdf))
and the architecture decisions ([tradeoff-library.md](tradeoff-library.md)). Those two documents are
the source of truth; this file is the working summary for building against them.

**North star:** nothing important happens invisibly. This is a system of record *and* control —
correctness-dominated, not scale-dominated. Roughly dozens of staff, thousands of students. Every
architectural choice below trades scale for provable correctness, deliberately.

## Locked stack

| Layer | Choice |
|---|---|
| Language | TypeScript, end to end |
| Backend | NestJS (modular monolith, single deployable) |
| Database | PostgreSQL 16+ (managed), single primary |
| ORM | Prisma — **but see the invariant rule below** |
| Queue | BullMQ on Redis (managed), fed by a Postgres outbox |
| Front end | Next.js + TypeScript |
| Runtime | Auto-scaling containers (Cloud Run / ECS Fargate) |
| Topology | Single region, PITR backups, rehearsed restore |

Rejected and not up for casual revisit: microservices, Kafka, any document store as primary,
Kubernetes, multi-region, a separate SPA, Redis as a read-through cache for domain reads.

### Deferred infrastructure decisions — deliberately, not by oversight

Deferred 2026-09-09. The user will confirm these later; **do not invent an answer, and do not
treat the deferral as permission to guess.** None of them blocks Phase 1, which is why deferring
costs nothing today and buys real evidence later.

| Decision | Status | What unblocks it | Blocks Phase 1? |
|---|---|---|---|
| **Cloud provider** | Deferred | Whether Spellzee already has AWS/GCP/Azure accounts. Choose on where the company's accounts and secrets already live, not on features — the difference is not material at this scale. | **No** — Postgres runs locally; application code stays cloud-agnostic. Needed at deploy. |
| **Auth provider** | Deferred | Staff count, parent-portal timing, budget, and what staff already sign in with (Google Workspace / Microsoft 365). | **Partly** — see below. |
| Object storage | Deferred | Follows the cloud decision. | No — worksheets and recordings are Phase 2. |
| Observability vendor | Deferred | Follows the cloud decision. | No — can be added at any point. |
| WhatsApp provider | Deferred by the baseline itself | A business decision, not a technical one. | No — keep it behind a channel adapter. |

**How auth is unblocked for Phase 1.** Authentication and authorization are different things, and
only the first is bought:

- **Authentication** — "who is this?" — is the provider's job, and is what is deferred.
- **Authorization** — "what may they do?" — is **ours**, and is built now: RBAC tables,
  maker–checker, and permission by *relationship to the student* (coordinator-of, teacher-of,
  parent-of), all in our database.

So build the RBAC schema in Phase 1 as normal, and put authentication behind an adapter — the same
treatment WhatsApp gets. Swapping the provider later must not touch a single authorization rule. If
it would, the boundary was drawn wrong.

Until a provider is chosen, a simple session-based staff login is the placeholder. It is a
placeholder, and should be labelled one wherever it appears — never described as the auth solution.

## The five rules that hold the design up

These are where the design erodes silently. Treat a change to any of them as an architecture
decision, not an implementation detail.

1. **Invariants live in the database, not in service code.** One active owner, no overlapping
   teacher schedule, entitlement that balances — these are enforced by constraints, exclusion
   constraints, partial indexes and triggers. Prisma's schema language cannot express them, so
   **every invariant is a hand-written SQL migration**: `prisma migrate dev --create-only`, then
   write the constraint yourself. If a rule that spans rows is enforced only in a `.service.ts`,
   it is not enforced.
2. **The outbox row is the commitment; the queue job is only a trigger.** Redis is allowed to lose
   everything at any moment. Any external call goes: write domain change + audit + outbox row in
   one transaction, then a worker drains it. Never call a third party inside a request handler.
3. **Entitlement is an append-only ledger.** There is no `sessions_remaining` column. Purchased,
   scheduled, completed, consumed, protected, compensated and remaining are derived from ledger
   rows, each with a reason and an actor. Retroactive corrections must be reconstructible.
4. **Strong consistency inside the database; eventual only at the integration boundary.** No CQRS,
   no separate read store, no reconciliation jobs. Where the seam exists, name it in the domain —
   states like `class_creation_pending` are the eventual-consistency boundary made visible, not
   workflow noise.
5. **Policy is versioned rows, not a rule engine.** Cancellation cutoffs, reschedule limits, SLA
   targets, incentive thresholds and reminder timings are configurable *data with effective dates* —
   an old session is judged by the policy version in force when it happened. A "just make this
   configurable" request that implies a rule builder is the thing to push back on; one tenant does
   not need a private programming language with no debugger.

## Skills, and what overrides what

`.claude/skills/` holds a general engineering skill library — `backend/` (17 skills: architecture,
API design, database, distributed systems, security, reliability, performance, testing, plus
`workflow-*` step-by-step procedures) and `frontend/` (28 skills for the Next.js console and, later,
the parent portal). Use them: they carry real depth this file does not repeat, and their
`references/dod.md` gates are worth running.

**Precedence, when they disagree:**

1. **The five rules above win over any skill.** They are project invariants, not preferences. A skill
   offering a generically-reasonable alternative (cache this read, use a query builder, mock the
   repository) does not license reversing one.
2. **`skills/backend/project-conventions` wins over a skill's stated defaults** once it is populated —
   observed reality beats a pinned assumption.
3. **Skills win everywhere else.** For anything the five rules and this file do not speak to,
   follow the skill rather than improvising.

Two vocabulary notes, because the backend skills were written against a generic backend persona
before this project existed and still reference it:

- Where a skill says **"the project-first rule in CLAUDE.md"** — that means: read the existing code
  and follow what is actually there before applying any default. It is a good rule; this file adopts
  it by name here so the reference resolves.
- Where a skill says **"the decision process from CLAUDE.md"** — that means
  `skills/backend/workflow-feature-design`: Problem → Constraints → Non-functional requirements →
  Options → Trade-offs → Decision → Risks. For this project, every such decision also needs a
  **reversal trigger** (see Working conventions) before it counts as decided.

Known divergences already reconciled in the skill files themselves: `nodejs-postgres-stack` (this
project is NestJS + Prisma, not Express + a query builder), `distributed-systems-caching` (our Redis
posture is stricter than its generic cache guidance), `frontend/api-integration` (no Firebase, no
realtime), and `edtech-domain` (single-tenant, India, parent-paid — not US multi-tenant K-12).

The Spellzee-specific rules have their own skills under `backend/spellzee-*`. Those are the ones
that encode the five rules operationally; reach for them before the generic equivalents.

## Enforced mechanically

`.claude/hooks/guard-invariants.js` runs on every Bash, Write and Edit. It does not read the
skills — it just checks, so the guard holds whether or not the relevant skill was loaded:

| Trigger | Result |
|---|---|
| `prisma migrate dev` without `--create-only` | **blocked** — the SQL must stay hand-editable |
| A Merithub `delete` / `destroy` / `remove` call | **blocked** — decision 7; irreversible upstream |
| `prisma db push` / `migrate reset` | asks — both skip or destroy hand-written constraints |
| `sessions_remaining` and similar balance columns | asks — decision 3, reversal trigger "never" |
| `DROP CONSTRAINT` / `DROP INDEX` / `DROP TRIGGER` in a migration | asks — invariants live in the database |
| `UPDATE` / `DELETE` on a ledger table | asks — corrections are new rows |
| `await` on Merithub/FreeJump/WhatsApp in a controller, resolver or service | asks — belongs in a worker |

Exemptions that keep it quiet: Markdown and `.claude/` files (so the skills can quote these
patterns), test files (so a test may assert we never call upstream delete), and worker, adapter,
client, job and infrastructure paths (where third-party calls belong). The hook fails open — if it
errors it allows the call rather than blocking work.

An "ask" is a prompt, not a refusal. A legitimate case — narrowing a constraint, a throwaway local
database, a file whose path the check misread — is approved and proceeds.

What it does **not** catch: an invariant written into service logic, a reconciliation job, a
hard-coded threshold in application code, a missing audit write. Those are semantic, not textual —
`erosion-auditor` and `workflow-pre-merge-review` cover them. Three layers, not one: the hook always
runs, the skills guide, the auditor reasons.

## Agents and risk classes

`.claude/agents/` holds the build team, split by **erosion point** rather than by lifecycle stage or
domain module — see `.claude/agents/README.md` for why, and for the Tier 2/3 agents that are
designed but deliberately not yet built. Today: `scope-interrogator` (open decisions, read-only),
`schema-architect` (schema and invariants), `write-path-builder` (NestJS commands and endpoints),
`integration-builder` (outbox, workers, Merithub), and `erosion-auditor` (diff audit, read-only).

Changes fall into two risk classes, mirroring the maker–checker split the product itself enforces:

| Needs human approval before landing | Lands autonomously once gates pass |
|---|---|
| Schema, migrations, constraints | Read-side queries and endpoints |
| Session ledger, subscriptions, payments, refunds | DTOs and shared response types |
| RBAC, permissions, policy rows | Tests |
| Audit structure | Documentation, notification templates |
| Merithub contract, worker topology | Adapter internals behind a settled contract |

Ambiguous changes need approval, and the reason for that judgement should be stated.

Three commands drive this:

- **`/api-feature`** — the agent chain for backend work (schema, API, workers, integrations), with
  the schema approval gate.
- **`/ui-feature`** — the Next.js UI from the frontend skills, in the main session, no agents.
- **`/build-fullstack`** — both in order: backend chain → Figma conversion → wiring the UI to the
  real endpoints. Use it whenever a feature needs an API *and* a screen.

The seam between backend and frontend is the **API contract**: the backend run owns the endpoint,
its authorization, its pagination and the response types; the UI imports those types rather than
re-declaring them. Backend runs first in the full-stack chain because that contract is what the UI
wires to — and if the schema gate stops, the chain stops rather than building UI against a shape
that may still change.

Pixel-perfect UI work needs the **Figma MCP** connected (`get_design_context`, `get_screenshot`,
`get_variable_defs`). Without it, design conversion is a structural approximation and must be
labelled as one.

Every agent that writes runs `workflow-pre-merge-review` (including its Spellzee erosion check) plus
the DoD of each skill it touched, before reporting done. Reporting completion over a failing gate is
worse than reporting the failure.

## Domain modules

The monolith's module boundaries map one-to-one onto these. Invariants span them, which is exactly
why they are not services.

The concrete layout is in **[`docs/folder-structure.md`](docs/folder-structure.md)** — a monorepo
(`apps/api`, `apps/web`, `packages/contracts`), with the backend split four ways: `modules/` for
domain, `platform/` for the uniform write path, `integrations/` for the eventual-consistency edge,
and `workers/` as a separate always-on deployable. One command per file. **Path names are
load-bearing**: `guard-invariants.js` reads them to decide what to check, so a directory rename is
a change to the guard.

- **Identity & Master Data** — parent, student, employee, teacher, course, subject.
- **Sales & Admissions** — leads, demos, admission context (external systems remain during transition).
- **Student & Customer** — Student 360, enrollments, lifecycle, history.
- **Operations / Delivery** — handover, verification, coordinator ownership, allocation, scheduling,
  sessions, compensation, tickets, SLA. *Phase 1 lives mostly here.*
- **Academic** — curriculum, lessons, attendance, assessments, materials, progress, recordings.
- **Teacher & HR** — recruitment, availability, training, certification, observation, performance,
  leave, payroll.
- **Finance** — subscriptions, payments, credits, refunds, incentives.
- **Communication** — WhatsApp, in-app, calls, email, notifications (behind a channel adapter).
- **Governance** — roles, permissions, approvals, segregation of duties, audit, duplicate control.
- **Analytics**, then **AI & Automation** — a layer above reliable data, never a substitute for it.

## Identity model

A student gets a permanent Spellzee ID (`STU-2026-000184`) that **never changes**. A new phone,
email, spelling variant, course, teacher, schedule, break or return does not create a new identity.

```
Parent/Guardian → Student → Enrollment → Subscription → Payment
Enrollment → Class Schedule → Session (individual occurrence)
Session → Attendance + Lesson + Recording + outcome
```

Keep these distinct and never conflate them:

- **Enrollment** — academic participation in a course/program.
- **Subscription** — the commercial entitlement purchased (N sessions, validity, credits).
- **Payment** — one financial transaction.
- **Class Schedule** — the recurring delivery arrangement (the series).
- **Session** — one occurrence, with stable identity.

Sessions are **materialised on a rolling horizon** (fan-out on write), because attendance,
entitlement consumption and Merithub IDs need something durable to attach to. This is the one place
the codebase deliberately keeps two descriptions of "when" — series and occurrences — plus a horizon
job to maintain them.

Duplicate prevention is a first-class flow: search before create, match across student and parent
names, phones, alternate numbers and emails, surface probable matches, block or require approval on
high confidence, and support a controlled merge that preserves the original audit references. Store
historical contact details rather than minting an identity per new phone number.

Also distinct, and easy to blur: **Attendance** (did they attend) vs **Lesson** (what was taught) vs
**Assessment** (how they did) vs **Progress** (are they improving). Four concepts, four records.

## The Merithub integration (the hard edge)

Merithub is the live classroom/LMS. The upstream has **no idempotency keys, no webhook signatures
and no retry guarantee**, which dictates the whole pattern:

- **Outbox** on our side for every outbound call; **inbox** with deduplication for every inbound event.
- **Allocate locally, provision asynchronously.** A coordinator's allocation completes against our
  database immediately and enters `class_creation_pending`; the upstream class is created by a
  worker. Coordinator workflow must never block on third-party availability. This buys a four-state
  machine and a stall queue — **the stall queue is a product surface, not just monitoring.**
- **Webhook as the fast path, low-frequency reconciliation poll as the safety net.** The poll's job
  is not freshness; it is detecting the events that were silently dropped.
- **Never call upstream DELETE.** Their delete is irreversible and destroys attendance and
  recordings. Local cancellation does not mirror as a delete. Orphaned upstream objects accumulating
  is the accepted cost.
- External IDs map to Spellzee IDs. External systems never silently overwrite Spellzee records.

The same shape applies to FreeJump (call activity) and the future WhatsApp provider.

## Governance, always on

Every command on the uniform write path does four things **in one transaction**: check
authorization, write the change, write the audit record, enqueue any outbox row. NestJS guards and
interceptors are the home for RBAC and audit precisely so this path is enforceable by convention
rather than by memory.

- **RBAC** over view / create / edit / approve / cancel / merge / archive / export / administer.
- **Maker–checker** for sensitive actions — refunds, duplicate merges, historical corrections,
  high-impact subscription changes, restricted deletion. The requester never approves their own request.
- **Overrides** record who, what, why, old value, new value, approver.
- **No silent history changes.** Completed payments, classes, allocations, tickets and academic
  records are never overwritten or hard-deleted. Corrections are new rows with reasons.

The authority matrix in the baseline (§22.4) is explicitly illustrative, not final.

## Session & compensation policy (all parameters configurable, all versioned)

- Session outcomes cover the full grid: scheduled, reminded, live, completed, attended,
  partial/late/absent, parent advance cancellation, late cancellation, teacher absent, teacher-side
  technical, student-side technical, Spellzee cancellation, rescheduled, compensation required,
  compensation completed, cancelled/no-show.
- Advance cancellation past the cutoff protects the credit; late cancellation may consume it.
- Teacher or Spellzee-side failure protects entitlement and triggers compensation. Student-side
  technical failure follows its own policy.
- **A compensation class is a separate session and never mutates the recurring schedule.** A missed
  Monday produces a Saturday compensation; Monday stays Monday.
- Reschedule limits, compensation validity, completion extension and repeated-absence escalation are
  all policy parameters, not constants in code.
- Planned vs projected completion dates derive from the ledger and actual attendance, and feed
  renewal forecasting.

## Capacity

Availability answers "is this person free at 3 PM." Capacity answers "how much can Spellzee deliver,
and how much more can it absorb." Model both, and model **forecast** capacity separately from
current — a student's two-month break releases capacity *temporarily* and must not be recorded as
permanent. Dimensions that matter: day/slot, subject, level, language (including bilingual pairs
like Tamil-English), 1-to-1 vs group, leave, and capacity released by expected completion. Gaps feed
recruitment planning. Do not optimise toward 100% utilization; management defines a healthy band.

## Reads and delivery

- **Fan-out on read** for staff dashboards and task queues — dozens of readers, constantly-changing
  data, writers outnumbering readers. No materialised per-user views.
- **Polling** for internal dashboards; no WebSockets. ETags and conditional requests keep it cheap.
- The parent portal (phase 2) inverts the reader/writer ratio overnight and is the known trigger to
  revisit both of the above, plus notification fan-out. Plan the seam now; build it then.
- The Next.js internal console is mostly dense tables, filters and forms. Choose the headless
  component library, data grid and query layer **deliberately on day one** — retrofitting a table
  abstraction across forty screens is a real cost.

## Testing & operations

- **Tests run against real PostgreSQL**, never mocked repositories. Locally that is the
  `spellzee_test` database on port 5433 — there is no Docker on this machine, so tests must
  clean up after themselves (transaction rollback or truncate) rather than relying on a fresh
  container. See `skills/backend/project-conventions`.
  When invariants live in the database, a mocked-repository test proves nothing about the component
  most likely to fail.
- **Constraint tests are the highest-value tests here**: attempt the violation, assert the database
  rejects it. Write one for every invariant migration.
- **Workers must not scale to zero.** A queue consumer inside a scale-to-zero service stops draining
  silently. Run workers as a separate always-on service, min instances ≥ 1, and alert on outbox rows
  older than a threshold. This is the most common way an outbox pattern quietly dies.
- Error tracking and structured logs from commit one. Separate dev/test/staging/prod. Files go to
  object storage — never the database, never container disk. Backups are only backups once a restore
  has been rehearsed.

## Roadmap

- **Phase 0** — discovery: finalise processes, entities, identifiers, permissions, policy parameters, MVP boundary.
- **Phase 1 (current target)** — student identity + duplicate control, admission handover,
  coordinator ownership, availability/capacity basics, allocation, scheduling, session ledger,
  compensation, Merithub integration, notifications, tickets, SLA, audit.
- **Phase 2** — academic records and parent portal, communication, retention workflows.
- **Phase 3** — teacher & HR: training, certification, observation, performance, incentives, payroll.
- **Phase 4** — finance & enterprise controls: refunds, credits, full approval matrix, maker–checker.
- **Phase 5** — analytics & AI: forecasting, intelligent matching, retention prediction, summaries.

AI governance, when that arrives: verified records only, permission-aware, never silently changes a
critical record, source context inspectable, outputs are recommendations unless a business rule
explicitly approves them.

## Working conventions

- **Decisions get a reversal trigger.** ADRs live in `docs/adr/` and each carries a required
  **Reversal trigger** section — the observable condition under which the choice stops being right.
  Without it you have recorded a preference, not a decision. Add new entries to
  [tradeoff-library.md](tradeoff-library.md) and keep its reverse index (symptom → decision) current.
- **Open decisions stay open.** The baseline (§30) lists 21 unresolved questions. They have been
  audited and sorted in **[`docs/open-decisions.md`](docs/open-decisions.md)** — read that before
  any schema work. Six are **shape-blocking** and must be answered, not guessed: capacity unit,
  fields requiring approval to edit, duplicate merge rules, teacher-vs-student technical failure,
  the approval role set, and the Phase 1 teacher/HR minimum. Fifteen are value-blocking and become
  flagged placeholder policy rows.
  Two further blockers the baseline never lists: **do group classes exist in Phase 1** (it changes
  the ledger's consumption grain), and **can a student have concurrent owners of different
  responsibility types** (§9 lists seven; our `one_active_owner_per_student` index allows one —
  a direct conflict).
  Never hard-code a guess as though it were decided.
- Raw SQL alongside Prisma is expected and correct for invariant migrations and the reporting layer.
  It is not a workaround.
- `jsonb` is for genuinely open-ended payloads — webhook bodies, integration snapshots — not for
  domain fields you are merely unsure about.
