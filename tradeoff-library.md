# Trade-off Library

A decision is only worth recording with its **reversal trigger** — the observable condition under which the choice stops being right. Without it you've written a preference, not a decision.

Six fields per entry:

**Chose** · **Rejected** · **Because** (the binding constraint) · **Gained** · **Sacrificed** · **Reversal trigger**

The reversal trigger is the field that does the work. Everything else is documentation; that one is an alarm.

---

## Part 1 — The eight canonical pairs

### 1. Kafka vs. SQS / BullMQ

The real distinction isn't throughput. It's **a replayable ordered log with independent consumers** versus **a work queue with per-message acknowledgement and no history**.

- **Chose:** BullMQ + Redis, backed by a Postgres outbox table.
- **Rejected:** Kafka.
- **Because:** the messages are *tasks* ("create this class upstream"), not *facts* other systems need to observe. There is one logical consumer. Operational budget is one person.
- **Gained:** per-message retry and dead-lettering, visibility timeouts, no partition or consumer-group management, poison messages isolated rather than blocking a partition head.
- **Sacrificed:** replay. You cannot rebuild a read model from history, cannot add a consumer that reads the past, and cannot adopt event sourcing later without introducing a log anyway.
- **Reversal trigger:** three or more independent consumers of the same event; or the sentence *"I wish I could reprocess last week"* recurring; or needing per-key ordering across a partitioned stream.

**Important subtlety:** the durability here lives in the **outbox table, not the queue**. Redis is allowed to lose everything — the outbox row is the commitment, the queue job is only a trigger. That inversion is what makes a Redis-backed queue safe for money-adjacent work, and it's the reason this choice doesn't reverse under a durability requirement, only under a *replay* requirement.

---

### 2. SQL vs. NoSQL

- **Chose:** PostgreSQL as the single primary store.
- **Rejected:** Firestore / document store as primary.
- **Because:** the entire value of the system is **invariants that span entities** — one active owner, no overlapping teacher schedule, entitlement that balances. Those are cross-aggregate constraints, and a document store's unit of atomicity is one document. Secondly, an ERP's query patterns are permanently unknown; someone will always want a report you didn't anticipate.
- **Gained:** transactions across aggregates, constraints as *enforcement* rather than convention, ad-hoc querying without redesign, one engine serving both transactional and reporting workloads at this size.
- **Sacrificed:** horizontal write scaling, schema fluidity during rapid iteration, per-document write throughput.
- **Reversal trigger:** single-node write saturation; or a genuinely single-aggregate, append-heavy workload (chat messages, telemetry, session event logs) where no cross-entity invariant exists; or key-only access to a working set larger than one node.

**The trap:** "NoSQL for flexibility" usually means *deferring schema decisions into application code, where they become unenforceable*. Postgres `jsonb` buys most of the flexibility while keeping constraints available for the fields that matter. Use it for genuinely open-ended payloads — webhook bodies, integration snapshots — not for domain fields you're merely unsure about.

---

### 3. Redis vs. Database

- **Chose:** database as truth; Redis only for derived, ephemeral or externally-owned state.
- **Rejected:** Redis as a read-through cache in front of domain reads.
- **Because:** at this scale, Postgres is fast enough that a cache buys latency you don't need in exchange for the hardest bug class in the field — stale reads nobody notices for weeks.
- **Gained:** no invalidation logic, no dual sources of truth, no "which one is right" incidents.
- **Sacrificed:** some read latency, some database load.
- **Reversal trigger:** a computed value expensive enough that recomputation cost exceeds the value of freshness — the teacher availability grid across a term is the realistic first candidate. When that happens, cache it with an explicit invalidation event *and* a TTL backstop, never a TTL alone.

**The governing rule:** Redis must be allowed to lose everything at any moment. If losing it corrupts truth, it belongs in Postgres. The legitimate Redis uses in this system all pass that test: the external API token cache (external, expiring, reconstructible — and shared across workers because of a strict token-issuance rate limit), rate-limit counters, queue state, and sessions.

---

### 4. Polling vs. WebSockets

- **Chose:** polling for internal dashboards; webhook-plus-polling for the external integration.
- **Rejected:** persistent connections.
- **Because:** a coordinator's queue does not need sub-second latency, and connection state is an operational cost paid continuously for a benefit consumed occasionally.
- **Gained:** stateless servers, trivial horizontal scaling, immunity to proxies and flaky mobile networks, no reconnection or backpressure logic.
- **Sacrificed:** a latency floor equal to the poll interval, and wasted requests from idle screens.
- **Reversal trigger:** the cost inversion — **polling cost scales with the number of clients, independent of the change rate.** The moment idle clients × frequency exceeds what the database absorbs comfortably, push becomes cheaper. Also reverses the day the product promises live behaviour (in-app chat, live class monitoring).

**Underrated middle ground:** Server-Sent Events for one-way push (far simpler than WebSockets, works over plain HTTP), and conditional requests with ETags to make polling nearly free.

**The integration pattern worth naming:** when an upstream provider offers webhooks with **no retry guarantee**, webhook-only is not an option and polling-only is wasteful. Webhook as the fast path, a low-frequency reconciliation poll as the safety net. The poll's job isn't freshness — it's detecting the events that were silently dropped.

---

### 5. Fan-out on write vs. fan-out on read

- **Chose:** fan-out on read for operational dashboards and task queues; fan-out on write for scheduled session occurrences.
- **Rejected:** materialising per-user views for staff.
- **Because:** the audience is dozens of staff and the underlying data changes constantly. Writers vastly outnumber readers, which inverts the usual social-feed calculus.
- **Gained:** no materialised views to invalidate, no divergence between a feed and its source, changes visible immediately.
- **Sacrificed:** query complexity, and read cost that grows with historical data volume.
- **Reversal trigger:** the reader/writer ratio flipping. **This one has a known date:** the parent portal turns 50 staff readers into thousands of parent readers overnight, and notification delivery becomes the classic fan-out-on-write case. Plan the seam now; build it then.

Note that the rolling-horizon materialisation of recurring sessions *is* fan-out on write, chosen for the opposite reason: occurrences need stable identity so that attendance, entitlement consumption and external IDs have something durable to attach to. Same pair, opposite answer, different constraint — which is the whole point of keeping a library rather than a rulebook.

---

### 6. Strong vs. eventual consistency

- **Chose:** strong inside the database transaction; eventual at the external integration boundary.
- **Rejected:** eventual consistency within the domain (no CQRS, no separate read store).
- **Because:** entitlement and ownership are invariants, not preferences, and a single Postgres transaction gives you serialisable correctness for free at this scale. Eventual consistency is a price you pay when scale forces it — paying it voluntarily is pure loss.
- **Gained:** no reconciliation jobs, no compensating transactions, no "the UI showed the old value" class of bug.
- **Sacrificed:** nothing internally. Externally, any state spanning your database and a third party is eventually consistent whether you acknowledge it or not.
- **Reversal trigger:** multi-region; write volume exceeding a single primary; or a read workload that must be served from a replica whose lag becomes user-visible.

**The reframe that matters:** you never choose consistency globally. You choose a **boundary inside which it is strong**, and the architectural work is making that boundary explicit in the domain model. States like `class_creation_pending` are not workflow noise — they are the eventual-consistency seam made visible. A system that hides the seam has the same inconsistency plus no vocabulary for it.

---

### 7. Synchronous vs. asynchronous

- **Chose:** synchronous for anything the user's next decision depends on; asynchronous for third-party calls and bulk work.
- **Rejected:** calling external APIs inside request handlers.
- **Because:** your availability is the product of everything in your critical path. A third party in the request path donates its outage to you.
- **Gained:** predictable latency, failure isolation, retries that don't require the user to be present.
- **Sacrificed:** the user no longer knows whether it worked. **Async is not free — it converts a latency problem into a state-management problem.** Every async operation you add owes you a status, a retry policy, a dead-letter path, and a UI answer to "what is happening right now."
- **Reversal trigger:** two directions. Reverse *toward sync* when the async gap produces user-visible incorrectness (someone confirms an action, no notification ever goes out, and nobody notices for a day). Reverse *toward more automation* when the stalled-item queue grows past what a human can supervise daily — at that point you need auto-remediation, not more dashboards.

---

### 8. Active-active vs. active-passive

- **Chose:** effectively active-passive — single instance, automated backups, a *documented and rehearsed* restore.
- **Rejected:** multi-region active-active.
- **Because:** the availability requirement is real but not contractual, and recovery time measured in hours is survivable for an internal operations platform.
- **Gained:** no distributed writes, no conflict resolution, no split-brain, no replication topology, no data-residency partitioning.
- **Sacrificed:** RTO in hours, RPO in minutes. And an untested restore is not a backup — it's a hope with a cron job.
- **Reversal trigger:** uptime becoming contractual; or an outage during class hours translating directly into refunds; or institutional buyers asking for availability commitments in procurement.

**The general asymmetry:** active-active is straightforward for reads and genuinely hard for writes. Most systems described as active-active are **active-active reads with a single write region** — which is exactly the shape the results-publication design took: one producer region, many read regions, and a tiny consensus-backed control plane owning the release decision. If someone claims active-active writes, ask what happens to their uniqueness constraints.

---

## Part 2 — Extraction from the Spellzee design

The same six fields, applied to the decisions actually made rather than the canonical pairs.

| # | Chose | Rejected | Because | Sacrificed | Reversal trigger |
|---|---|---|---|---|---|
| 1 | Modular monolith | Microservices | Correctness-dominated, not scale-dominated; invariants span modules | Independent deploy and scaling per module | A module needing a fundamentally different scaling profile, or more than one team |
| 2 | Invariants as database constraints | Service-layer validation | Solo build with agent-written code — no code review to rely on | Flexibility; some legitimate edge cases now need migrations | A rule that genuinely varies per case, or constraint checks becoming a write bottleneck |
| 3 | Append-only session ledger | `sessions_remaining` column | Entitlement is currency; retroactive corrections must be reconstructible | Query complexity, more code | Never, realistically. This one is close to unconditional |
| 4 | Outbox + inbox at the integration boundary | Direct API calls in handlers | Upstream has no idempotency, no signatures, no retry guarantee | Latency, plus a queue to supervise | Only if the provider ships real idempotency and delivery guarantees |
| 5 | Versioned policy rows | Configuration/rule engine | One tenant. A rule builder here is a private programming language with no debugger | Non-developers can't change rules without a deploy | Multi-tenant white-labelling, or policy changes becoming weekly |
| 6 | Series + materialised occurrences | Series-only, computed on read | Attendance, entitlement and external IDs need stable per-occurrence identity | A horizon job to maintain; two places describing "when" | Horizon maintenance costing more than on-demand computation |
| 7 | Never call upstream DELETE | Mirror local cancellation upstream | Their delete is irreversible and destroys attendance and recordings | Orphaned upstream objects accumulate | The provider adding a soft-delete or archive operation |
| 8 | Allocate locally, provision asynchronously | Block allocation on the external call | Coordinator workflow must not depend on third-party availability | A four-state machine and a stall queue to watch | Stalls becoming frequent enough to need auto-remediation |
| 9 | Few MCP servers, and only ones that cannot reach the codebase | Postgres/Prisma/filesystem MCP for convenience | The guard hook sees Bash, Write and Edit — not MCP tool calls. An MCP server that reaches the database is a path around every check | Convenience: `psql` through Bash is clunkier than a tool call | The hook learns to inspect MCP tool calls |
| 10 | shadcn/ui + TanStack Table + TanStack Query, with Zustand for the little client state left | Mantine, MUI, Ant Design, AG Grid; RTK Query | The design is custom and the tokens are still `TBD` — a library that owns its theme would fight the Figma values on arrival. One TanStack ecosystem rather than two, and no Redux store this project has no other use for. Dense tables and the governance surfaces have no off-the-shelf equivalent | Ready-made components: every primitive is installed and customised rather than imported working | A second product surface with different needs, or the component work exceeding the feature work it supports |

Decisions 3 and 4 are the ones I'd defend hardest under pressure. Decision 5 is the one most likely to be argued against internally, and worth writing the ADR for first — the pressure to build a rule engine always arrives as a reasonable-sounding request.

---

## Part 3 — Confirmed stack

The architecture is a modular monolith in a single region: one deployable backend with internal module boundaries, one PostgreSQL database, workers on a queue for the asynchronous edge, and a separate front end. The stack below is the concrete expression of that shape. Nothing in the requirements baseline changes it.

### Locked

| Layer | Choice | Rejected |
|---|---|---|
| Language | TypeScript, end to end | A second language on the backend |
| Backend | NestJS (Node) | Bare Express/Fastify; Django/Rails/Spring; Next.js API routes as the backend |
| Database | PostgreSQL (managed, 16+) | Firestore or any document store as primary |
| ORM | Prisma | TypeORM, Drizzle, raw SQL as the default access path |
| Queue | BullMQ on Redis (managed) | Kafka; database-polling as the only worker trigger |
| Front end | Next.js + TypeScript | SPA with a separate build and its own type definitions |
| Runtime | Auto-scaling containers (Cloud Run or ECS Fargate) | Kubernetes; long-lived VMs |
| Topology | Single region, single primary, PITR backups | Multi-region; microservices |

### The four with real trade-offs

**NestJS over a bare HTTP framework**

- **Because:** the architecture depends on a uniform write path — every command validating authorization, writing the change, writing audit and enqueuing the outbox in one transaction. NestJS's module/provider/interceptor structure makes that path enforceable by convention rather than by memory. With one developer and agent-written code, an opinionated framework is a substitute for review.
- **Gained:** dependency injection that makes transaction scoping and testing tractable; guards and interceptors as the natural home for RBAC and audit; a module layout that maps one-to-one onto the domain modules.
- **Sacrificed:** boilerplate, a decorator-heavy style, and a framework opinion you inherit whether or not you agree with it.
- **Reversal trigger:** the framework's structure fighting the domain rather than supporting it — realistically, never at this size.

**Prisma, with one hard caveat**

- **Because:** type-safe queries generated from a single schema, and migrations that are reviewable diffs.
- **Sacrificed:** control over generated SQL, and weak expressiveness for advanced PostgreSQL DDL.
- **The caveat, which is architectural rather than cosmetic:** Prisma's schema language cannot express exclusion constraints, range types, partial indexes with complex predicates, or trigger-based rules. Those are exactly the mechanisms holding up decision 2 in Part 2. So **every invariant is a hand-written SQL migration** — generate with `--create-only`, then write the constraint yourself. If invariants are allowed to drift into application code because the ORM made that easier, the strategy has quietly been abandoned.
- **Reversal trigger:** query-shape control mattering more than type generation — a reporting layer is the likely first place, and the right answer there is raw SQL alongside Prisma, not replacing it.

**Next.js for an internal operations UI**

- **Because:** shared types with the backend, server-side rendering for data-dense screens, one repository and one deployment story.
- **Sacrificed:** some coupling between UI and framework release cycles; server components add a mental model that isn't free.
- **Note:** this application is mostly dense tables, filters and forms. A headless component library plus a serious data-grid and query layer is worth choosing deliberately on day one — retrofitting a table abstraction across forty screens is a genuine cost.
- **Reversal trigger:** the parent portal's requirements diverging enough from the internal console to justify a second front end. Possible in phase 2; not a phase 1 concern.

**Managed containers over Kubernetes**

- **Because:** the operational budget is one person's attention. Cloud Run and Fargate remove capacity planning, node upgrades and cluster ops entirely.
- **Sacrificed:** fine-grained control, and portability between clouds.
- **Reversal trigger:** needing more than a handful of distinct services, or scheduling requirements the managed runtime can't express.

### Three consequences that follow from the architecture, not from taste

1. **Invariant migrations are hand-written SQL.** Stated above; repeated here because it is the single easiest place for the design to erode silently.
2. **Tests run against a real PostgreSQL instance.** Testcontainers or an equivalent, not mocks. When the invariants live in the database, a test with a mocked repository proves nothing about the component most likely to fail. Constraint tests — attempt the violation, assert the database rejects it — are the highest-value tests in this system.
3. **Workers must not scale to zero.** A queue consumer inside a scale-to-zero service stops draining when traffic stops, and fails silently rather than loudly. Run workers as a separate always-on service with minimum instances at one or more, and alert on outbox rows older than a threshold. This is the most common way an outbox pattern quietly stops working.

### Still open

| Decision | Recommendation |
|---|---|
| Cloud provider | Pick one and use its managed Postgres and Redis. Choose on where the company's accounts and secrets already live, not on features — the difference is not material at this scale |
| Authentication | Buy, don't build. Staff SSO plus a separate credential path for parents later. Session and RBAC state stays yours; identity provider does not own authorization |
| Object storage | S3 or GCS for worksheets, materials and any stored recordings. Never files in the database; never the application container's disk |
| Observability | Error tracking plus structured logs from commit one. The stalled-outbox and stalled-provisioning queues are product surfaces, not just monitoring |
| WhatsApp provider | Deferred by the requirements baseline. Keep it behind a channel adapter so the choice stays cheap |

---

## Part 4 — Using the library

**Merge it with your ADRs.** You already have `docs/adr/`. A trade-off entry and an ADR are the same artifact; most ADR templates simply omit the most valuable field. Add **Reversal trigger** as a required section, and the ADR stops being an archaeology record and becomes an alarm you set for your future self.

**Maintain a reverse index.** The library is used backwards far more often than forwards. Sorted by symptom:

| When you observe… | Revisit decision |
|---|---|
| "I wish I could replay last week" | 1 — queue vs. log |
| A dashboard query timing out | 5 — fan-out direction |
| A stale value nobody noticed for days | 3 — cache placement |
| An audience jumping by an order of magnitude | 5, then 4 |
| Reconciliation jobs breeding | 6 — where the consistency boundary sits |
| A stalled-item queue nobody reads | 7 — sync/async, and its automation trigger |
| Procurement asking about uptime | 8 — replication posture |
| A third "just make this configurable" request | Spellzee 5 — policy rows vs. rule engine |
| A verification that lives in an ad-hoc query, not a test | Spellzee 9 — MCP surface |
| Fighting a component library to apply a design token | Spellzee 10 — headless vs. batteries-included |

**The habit, in one line:** after every design, write down not what you chose, but *what would have to become true for you to choose differently*. If you can't answer that, the decision was inherited rather than made.
