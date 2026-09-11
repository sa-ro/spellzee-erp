# Claude Code setup audit — Spellzee ERP

_Read-only audit, 2026-09-11. Every claim below cites a file path and line number. Where a
thing was searched for and not found, it is recorded as **not found** with the search that
was run — not as "missing"._

## Scope note: three commands could not be run

`/skill-doctor`, `/doctor` and `/context` are interactive CLI commands. They cannot be invoked
from a tool call, so their raw output is **not included**. Consequences:

- The **Unused?** column in the inventory below cannot be filled. Only `/skill-doctor` knows
  which skills never fire, and it was tried on 2026-09-11: it reported **"Skill usage reports
  are not available on this connection."** So every row reads _run /skill-doctor_ and stays
  that way until it is run on a connection that supports usage reporting. This is the one
  column of the requested table that could not be populated — not an oversight.
- Startup context cost is reported as measured line/token counts instead of `/context` output.

Please run all three yourself; the inventory is built to receive their results.

## Correction to a premise: this repo is not pre-code

`CLAUDE.md:4` describes the repo as "**pre-code**". That is now out of date:

- `prisma/migrations/20260909073749_identity_master_data_and_duplicate_control/migration.sql`
  is **969 lines**, of which lines 256–969 are hand-written invariants — 4 normalization
  functions, 13 triggers, an `EXCLUDE USING gist` constraint, a deferred constraint trigger,
  advisory locking, ~30 CHECK constraints.
- `prisma/tests/` holds **6 spec files, ~58 test cases** (`merge.spec.ts` 385 lines,
  `contact-points.spec.ts` 217, `concurrency.spec.ts` 207, `governance.spec.ts` 189,
  `duplicate-control.spec.ts` 164, `permanent-id.spec.ts` 113).
- `prisma/schema.prisma` declares **11 models** across 274 lines.

What *is* empty is the **application** layer: every `.ts` under `apps/api/src/` and
`apps/web/src/` is an `export {};` stub (e.g. `apps/api/src/modules/identity/index.ts:13`),
and `packages/contracts/index.ts:13` is likewise `export {};`.

## Blocking environment finding: dependencies are not installed

`npm ls --depth=0` reports **six UNMET dependencies**:

```
+-- UNMET DEPENDENCY @prisma/client@^6.19.3
+-- UNMET DEPENDENCY @types/pg@^8.23.1
+-- UNMET DEPENDENCY dotenv@^16.6.1
+-- UNMET DEPENDENCY pg@^8.23.0
+-- UNMET DEPENDENCY prisma@^6.19.3
+-- UNMET DEPENDENCY vitest@^2.1.9
npm error code ELSPROBLEMS
```

`node_modules/.bin/` contains only `tsc`, `eslint`, `biome` (+ their `.cmd`/`.ps1` wrappers).
There is **no `.env`** — only `.env.example`.

**So on this checkout today: `npm test` fails, and every `prisma` command fails.** This is the
single most important constraint on the verification design — a verify script that assumes
these work would report a false failure on a clean tree, and one that ignores them would
report a false pass. Hence the skip-aware design in PLAN.md.

---

## 1. Skill inventory — 50 skills

22 backend + 28 frontend. **~40,700 tokens** if every body were loaded; **~4,800 tokens** of
`description` text is what sits in context permanently for skill selection.

> `CLAUDE.md:87` states backend holds "**17 skills**". It holds **22**. Stale by five.

| # | Skill | Layer | Lines / words | ~Tokens | Unused? | Overlaps with |
|---|---|---|---|---|---|---|
| 1 | `backend-api-design`<br>[SKILL.md](.claude/skills/backend/backend-api-design/SKILL.md) | backend | 48 / 265 | ~358 | _run /skill-doctor_ | workflow-new-endpoint (literal "add an endpoint"), frontend/api-integration, distributed-systems-caching (retries/idempotency) |
| 2 | `database-engineering`<br>[SKILL.md](.claude/skills/backend/database-engineering/SKILL.md) | backend | 68 / 344 | ~464 | _run /skill-doctor_ | workflow-db-migration, spellzee-invariants, nodejs-postgres-stack (all claim "migration") |
| 3 | `distributed-systems-caching`<br>[SKILL.md](.claude/skills/backend/distributed-systems-caching/SKILL.md) | backend | 99 / 604 | ~815 | _run /skill-doctor_ | spellzee-outbox-merithub ("retry"), system-architecture, performance-scalability, frontend/state-management ("cache invalidation"), frontend/pwa-offline |
| 4 | `edtech-domain`<br>[SKILL.md](.claude/skills/backend/edtech-domain/SKILL.md) | backend | 132 / 929 | ~1254 | _run /skill-doctor_ | — |
| 5 | `infra-cost-ai-backend`<br>[SKILL.md](.claude/skills/backend/infra-cost-ai-backend/SKILL.md) | backend | 42 / 260 | ~351 | _run /skill-doctor_ | sole claimant of deploy/CI — but AWS/K8s/Terraform framing, no Docker here |
| 6 | `nodejs-postgres-stack`<br>[SKILL.md](.claude/skills/backend/nodejs-postgres-stack/SKILL.md) | backend | 114 / 855 | ~1154 | _run /skill-doctor_ | database-engineering (declares itself the layer beneath) |
| 7 | `performance-scalability`<br>[SKILL.md](.claude/skills/backend/performance-scalability/SKILL.md) | backend | 44 / 235 | ~317 | _run /skill-doctor_ | distributed-systems-caching (queues) |
| 8 | `project-conventions`<br>[SKILL.md](.claude/skills/backend/project-conventions/SKILL.md) | backend | 47 / 378 | ~510 | _run /skill-doctor_ | — |
| 9 | `reliability-observability`<br>[SKILL.md](.claude/skills/backend/reliability-observability/SKILL.md) | backend | 39 / 206 | ~278 | _run /skill-doctor_ | frontend/error-observability, frontend/data-viz-dashboards (bare word "dashboard") |
| 10 | `security-engineering`<br>[SKILL.md](.claude/skills/backend/security-engineering/SKILL.md) | backend | 30 / 185 | ~250 | _run /skill-doctor_ | frontend/security-practices, frontend/auth-session-flows |
| 11 | `spellzee-entitlement-ledger`<br>[SKILL.md](.claude/skills/backend/spellzee-entitlement-ledger/SKILL.md) | backend | 130 / 766 | ~1034 | _run /skill-doctor_ | — |
| 12 | `spellzee-invariants`<br>[SKILL.md](.claude/skills/backend/spellzee-invariants/SKILL.md) | backend | 126 / 968 | ~1307 | _run /skill-doctor_ | database-engineering, workflow-db-migration |
| 13 | `spellzee-outbox-merithub`<br>[SKILL.md](.claude/skills/backend/spellzee-outbox-merithub/SKILL.md) | backend | 144 / 966 | ~1304 | _run /skill-doctor_ | distributed-systems-caching ("retry") |
| 14 | `spellzee-policy-versioning`<br>[SKILL.md](.claude/skills/backend/spellzee-policy-versioning/SKILL.md) | backend | 146 / 980 | ~1323 | _run /skill-doctor_ | — |
| 15 | `system-architecture`<br>[SKILL.md](.claude/skills/backend/system-architecture/SKILL.md) | backend | 56 / 309 | ~417 | _run /skill-doctor_ | distributed-systems-caching (outbox/events) |
| 16 | `testing-debugging-review`<br>[SKILL.md](.claude/skills/backend/testing-debugging-review/SKILL.md) | backend | 51 / 302 | ~408 | _run /skill-doctor_ | frontend/code-review-checklist (literal "review this code"), workflow-pre-merge-review, workflow-incident-response |
| 17 | `workflow-db-migration`<br>[SKILL.md](.claude/skills/backend/workflow-db-migration/SKILL.md) | backend | 86 / 613 | ~828 | _run /skill-doctor_ | database-engineering, spellzee-invariants |
| 18 | `workflow-feature-design`<br>[SKILL.md](.claude/skills/backend/workflow-feature-design/SKILL.md) | backend | 68 / 384 | ~518 | _run /skill-doctor_ | workflow-scope-intake |
| 19 | `workflow-incident-response`<br>[SKILL.md](.claude/skills/backend/workflow-incident-response/SKILL.md) | backend | 66 / 389 | ~525 | _run /skill-doctor_ | testing-debugging-review ("incident", "production issue") |
| 20 | `workflow-new-endpoint`<br>[SKILL.md](.claude/skills/backend/workflow-new-endpoint/SKILL.md) | backend | 111 / 650 | ~878 | _run /skill-doctor_ | backend-api-design (literal "add an endpoint") |
| 21 | `workflow-pre-merge-review`<br>[SKILL.md](.claude/skills/backend/workflow-pre-merge-review/SKILL.md) | backend | 102 / 656 | ~886 | _run /skill-doctor_ | testing-debugging-review, frontend/code-review-checklist |
| 22 | `workflow-scope-intake`<br>[SKILL.md](.claude/skills/backend/workflow-scope-intake/SKILL.md) | backend | 114 / 779 | ~1052 | _run /skill-doctor_ | workflow-feature-design |
| 23 | `accessibility`<br>[SKILL.md](.claude/skills/frontend/accessibility/SKILL.md) | frontend | 61 / 608 | ~821 | _run /skill-doctor_ | — |
| 24 | `animation-motion`<br>[SKILL.md](.claude/skills/frontend/animation-motion/SKILL.md) | frontend | 54 / 531 | ~717 | _run /skill-doctor_ | — |
| 25 | `api-integration`<br>[SKILL.md](.claude/skills/frontend/api-integration/SKILL.md) | frontend | 121 / 1304 | ~1760 | _run /skill-doctor_ | backend/backend-api-design; internal contradiction rules.md:43-44 vs SKILL.md:64-66 |
| 26 | `auth-session-flows`<br>[SKILL.md](.claude/skills/frontend/auth-session-flows/SKILL.md) | frontend | 52 / 614 | ~829 | _run /skill-doctor_ | frontend/security-practices (disambiguated in-frontmatter) |
| 27 | `code-review-checklist`<br>[SKILL.md](.claude/skills/frontend/code-review-checklist/SKILL.md) | frontend | 57 / 539 | ~728 | _run /skill-doctor_ | backend/testing-debugging-review (literal "review this code") |
| 28 | `component-architecture`<br>[SKILL.md](.claude/skills/frontend/component-architecture/SKILL.md) | frontend | 53 / 648 | ~875 | _run /skill-doctor_ | — |
| 29 | `data-viz-dashboards`<br>[SKILL.md](.claude/skills/frontend/data-viz-dashboards/SKILL.md) | frontend | 52 / 585 | ~790 | _run /skill-doctor_ | backend/reliability-observability (bare word "dashboard") |
| 30 | `design-tokens`<br>[SKILL.md](.claude/skills/frontend/design-tokens/SKILL.md) | frontend | 50 / 693 | ~936 | _run /skill-doctor_ | frontend/figma-pixel-perfect (disambiguated in-frontmatter) |
| 31 | `documentation-storybook`<br>[SKILL.md](.claude/skills/frontend/documentation-storybook/SKILL.md) | frontend | 65 / 597 | ~806 | _run /skill-doctor_ | — |
| 32 | `error-observability`<br>[SKILL.md](.claude/skills/frontend/error-observability/SKILL.md) | frontend | 53 / 566 | ~764 | _run /skill-doctor_ | backend/reliability-observability |
| 33 | `feature-flags`<br>[SKILL.md](.claude/skills/frontend/feature-flags/SKILL.md) | frontend | 52 / 612 | ~826 | _run /skill-doctor_ | — |
| 34 | `figma-pixel-perfect`<br>[SKILL.md](.claude/skills/frontend/figma-pixel-perfect/SKILL.md) | frontend | 44 / 482 | ~651 | _run /skill-doctor_ | frontend/design-tokens (disambiguated in-frontmatter) |
| 35 | `form-handling-validation`<br>[SKILL.md](.claude/skills/frontend/form-handling-validation/SKILL.md) | frontend | 69 / 712 | ~961 | _run /skill-doctor_ | — |
| 36 | `i18n-l10n`<br>[SKILL.md](.claude/skills/frontend/i18n-l10n/SKILL.md) | frontend | 66 / 767 | ~1035 | _run /skill-doctor_ | — |
| 37 | `monorepo-tooling`<br>[SKILL.md](.claude/skills/frontend/monorepo-tooling/SKILL.md) | frontend | 51 / 598 | ~807 | _run /skill-doctor_ | packages/contracts mentioned only generically |
| 38 | `notifications`<br>[SKILL.md](.claude/skills/frontend/notifications/SKILL.md) | frontend | 50 / 602 | ~813 | _run /skill-doctor_ | — |
| 39 | `payments-checkout`<br>[SKILL.md](.claude/skills/frontend/payments-checkout/SKILL.md) | frontend | 51 / 519 | ~701 | _run /skill-doctor_ | — |
| 40 | `performance-optimization`<br>[SKILL.md](.claude/skills/frontend/performance-optimization/SKILL.md) | frontend | 63 / 602 | ~813 | _run /skill-doctor_ | sole ISR/revalidate claimant |
| 41 | `pwa-offline`<br>[SKILL.md](.claude/skills/frontend/pwa-offline/SKILL.md) | frontend | 51 / 572 | ~772 | _run /skill-doctor_ | backend/distributed-systems-caching (stale-while-revalidate vocabulary) |
| 42 | `realtime-collaboration`<br>[SKILL.md](.claude/skills/frontend/realtime-collaboration/SKILL.md) | frontend | 54 / 623 | ~841 | _run /skill-doctor_ | — |
| 43 | `rich-text-editing`<br>[SKILL.md](.claude/skills/frontend/rich-text-editing/SKILL.md) | frontend | 61 / 735 | ~992 | _run /skill-doctor_ | — |
| 44 | `search-discovery`<br>[SKILL.md](.claude/skills/frontend/search-discovery/SKILL.md) | frontend | 50 / 535 | ~722 | _run /skill-doctor_ | — |
| 45 | `security-practices`<br>[SKILL.md](.claude/skills/frontend/security-practices/SKILL.md) | frontend | 60 / 551 | ~744 | _run /skill-doctor_ | backend/security-engineering, frontend/auth-session-flows |
| 46 | `seo-metadata`<br>[SKILL.md](.claude/skills/frontend/seo-metadata/SKILL.md) | frontend | 52 / 572 | ~772 | _run /skill-doctor_ | — |
| 47 | `state-management`<br>[SKILL.md](.claude/skills/frontend/state-management/SKILL.md) | frontend | 85 / 1102 | ~1488 | _run /skill-doctor_ | backend/distributed-systems-caching ("cache invalidation") |
| 48 | `testing-frontend`<br>[SKILL.md](.claude/skills/frontend/testing-frontend/SKILL.md) | frontend | 66 / 630 | ~851 | _run /skill-doctor_ | backend/testing-debugging-review ("test coverage") |
| 49 | `typescript-patterns`<br>[SKILL.md](.claude/skills/frontend/typescript-patterns/SKILL.md) | frontend | 53 / 617 | ~833 | _run /skill-doctor_ | — |
| 50 | `video-player-architecture`<br>[SKILL.md](.claude/skills/frontend/video-player-architecture/SKILL.md) | frontend | 53 / 585 | ~790 | _run /skill-doctor_ | — |

### Verbatim `description` fields

Quoted exactly as they appear at `SKILL.md:3`, so overlapping trigger phrasing is
visible without paraphrase.

**1. `backend-api-design`** (backend) — siblings: references

> Use when writing or reviewing backend service code or API endpoints — validation, error handling, auth, transactions, idempotency, timeouts/retries/rate limiting, or API contract design (REST/GraphQL/gRPC/WebSockets/SSE/webhooks, pagination, filtering, versioning, HTTP semantics). Triggers on "add an endpoint", "design this API", "backend service", "controller", "handler", "route".

**2. `database-engineering`** (backend) — siblings: references

> Use for any database work — schema/data modeling, writing or optimizing SQL queries, adding indexes, reasoning about transactions/isolation levels/locking/deadlocks/race conditions, or writing/reviewing a database migration. Triggers on "schema", "migration", "index", "query", "SQL", "transaction", "table", "foreign key", "N+1", "slow query", "deadlock".

**3. `distributed-systems-caching`** (backend) — siblings: references

> Use when work involves multiple services/processes talking to each other, message queues/event streams (Kafka, RabbitMQ, SQS, SNS, Pub/Sub, Redis Streams), or caching (Redis, cache-aside/read-through/write-through, TTL, invalidation, stampede). Triggers on "cache", "queue", "kafka", "event", "consumer", "producer", "retry", "at-least-once", "idempotent consumer", "distributed lock".

**4. `edtech-domain`** (backend) — siblings: references

> Domain-specific concerns for education technology products — student/minor data privacy (COPPA/FERPA/GDPR-K), school/institution multi-tenancy, roles (student/teacher/parent/admin), course/assessment/progress data modeling, content delivery, LMS interoperability (LTI/SCORM/xAPI), and accessibility. Use for any feature touching student data, courses, assessments, grading, school accounts, or content delivery. Apply alongside the generic domain skills (security-engineering, database-engineering, etc.) — this skill adds what's specific to EdTech, not a replacement for them.

**5. `infra-cost-ai-backend`** (backend) — siblings: references

> Use for cloud/infrastructure decisions (AWS, Docker, Kubernetes, Terraform, CI/CD, networking, IAM, multi-AZ/region), cost trade-off analysis, or building AI/LLM backend infrastructure (RAG, vector DBs, embedding pipelines, agents, MCP servers, model routing, AI gateways, LLM caching). Triggers on "deploy", "infrastructure", "terraform", "kubernetes", "docker", "cost", "budget", "RAG", "vector database", "embeddings", "LLM", "agent", "MCP server", "prompt injection".

**6. `nodejs-postgres-stack`** (backend) — siblings: references

> Use for any implementation work on this project's actual stack — Node.js/TypeScript backend code and PostgreSQL-specific database work (connection pooling, query builder/ORM choice, migrations, async error handling, env/config validation). This is the concrete tooling layer beneath the generic system-architecture/backend-api-design/database-engineering skills. Triggers on any real code change in this repo — routes, services, queries, migrations, package.json, tsconfig, pg client setup.

**7. `performance-scalability`** (backend) — siblings: references

> Use when investigating a performance problem, doing capacity planning, or evaluating whether a design scales (horizontal/vertical scaling, load balancing, autoscaling, read replicas, sharding, async/queue-based load leveling). Triggers on "slow", "latency", "throughput", "scale", "capacity", "p99", "bottleneck", "how many requests can this handle".

**8. `project-conventions`** (backend) — siblings: references

> The actual, observed conventions of THIS project — naming, folder structure, error-handling pattern, auth pattern, lint/format rules, libraries already in use. Distinct from the generic domain skills (which hold universal principles); this one holds what this specific codebase actually does. Check this before writing any code, and update it the first time a convention is established or changed. Currently a template — populate it once real code exists.

**9. `reliability-observability`** (backend) — siblings: references

> Use when designing for failure handling (timeouts, retries, circuit breakers, bulkheads, health checks, graceful shutdown, failover, DR, SLA/SLO/SLI, RTO/RPO) or when adding/reviewing logging, metrics, or tracing. Triggers on "reliability", "fault tolerant", "circuit breaker", "SLA", "SLO", "logging", "metrics", "tracing", "observability", "alert", "dashboard".

**10. `security-engineering`** (backend) — siblings: references

> Use when designing or writing code that touches authentication, authorization, secrets, user input, or external-facing surfaces — this is design-time security thinking (threat modeling, auth architecture, defense in depth), distinct from the built-in security-review command which audits an existing diff. Triggers on "auth", "login", "JWT", "OAuth", "permissions", "RBAC", "secrets", "encryption", "SSRF", "injection", "CORS", "rate limit abuse".

**11. `spellzee-entitlement-ledger`** (backend) — siblings: references

> Use for anything touching session entitlement, credits, or balances — consuming a session, protecting a credit on advance cancellation, compensation sessions, refunds, adjustments, or displaying "sessions remaining". Enforces the append-only ledger with derived counts and no stored balance column. Triggers on "sessions remaining", "balance", "credit", "consume", "entitlement", "compensation", "refund", "adjustment", "ledger", "subscription balance".

**12. `spellzee-invariants`** (backend) — siblings: references

> Use whenever a business rule spans more than one row or table and must always hold — one active owner, no overlapping teacher schedule, entitlement that balances, no duplicate active enrollment. Covers writing invariants as hand-written SQL migrations (exclusion constraints, partial unique indexes, check constraints, triggers) with Prisma's --create-only flow, and the constraint tests that prove them. Triggers on "must always", "can never", "only one", "no overlapping", "unique per", "constraint", "invariant", "prisma migrate", or any schema change to a table that carries a rule.

**13. `spellzee-outbox-merithub`** (backend) — siblings: references

> Use for anything crossing the boundary to a third party — Merithub (LMS/classroom), FreeJump (calls), the future WhatsApp provider. Covers the transactional outbox, the deduplicating inbox, the four-state provisioning machine and its stall queue, webhook-plus-reconciliation-poll, and the never-call-upstream-DELETE rule. Triggers on "merithub", "webhook", "outbox", "external API", "third party", "integration", "sync", "provision", "class creation", "stalled", "retry", "reconcile".

**14. `spellzee-policy-versioning`** (backend) — siblings: references

> Use whenever a business rule has a tunable number or threshold — cancellation cutoffs, reschedule limits, SLA targets, reminder timings, compensation validity, incentive bands, retention triggers, utilization targets. Enforces effective-dated versioned policy rows over both hard-coded constants and a configurable rule engine. Triggers on "configurable", "cutoff", "threshold", "SLA", "limit", "policy", "make this adjustable", "business rule", "48 hours", "every three sessions", "rule engine".

**15. `system-architecture`** (backend) — siblings: references

> Use when choosing or evaluating a system's architecture — monolith vs. microservices, layering (Clean/Hexagonal/DDD), CQRS, event sourcing, sagas, outbox pattern, or when doing a system-design writeup (requirements, capacity estimation, components, data flow, scaling/consistency/availability trade-offs). Triggers on "architecture", "system design", "should we use microservices/CQRS/event sourcing", "design this service", "how should this be structured".

**16. `testing-debugging-review`** (backend) — siblings: references

> Use when writing tests, debugging a production issue, or doing a manual/principal-level code review (as distinct from running the code-review skill/command). Triggers on "write tests", "test coverage", "production issue", "incident", "debug this", "review this code", "will this scale at 10x".

**17. `workflow-db-migration`** (backend) — siblings: none

> Step-by-step workflow for writing and shipping a database migration safely — schema change, index addition, backfill, or data migration. Use when asked to "add a column/table", "create a migration", "add an index", "change the schema", or "backfill data". Not for one-off ad-hoc data fixes run manually outside of migration tooling (flag that distinction if asked to do one).

**18. `workflow-feature-design`** (backend) — siblings: none

> Workflow for designing a significant new feature or system before writing code — bigger than a single endpoint (a new subsystem, a new service, a major schema change, an architecture decision with real trade-offs). Use when asked to design/plan/architect something, or when a request is ambiguous/large enough that jumping to code would be premature. Not for small, well-understood changes — those should go straight to the relevant domain skill.

**19. `workflow-incident-response`** (backend) — siblings: none

> Step-by-step workflow for responding to a live production issue or investigating a reported bug/outage. Use when told something is broken in production, users are affected right now, error rates/latency spiked, or asked to debug an incident. Do not immediately start editing code — this workflow front-loads diagnosis before any fix.

**20. `workflow-new-endpoint`** (backend) — siblings: none

> Step-by-step workflow for adding a new API endpoint/route end-to-end — from contract design through implementation, validation, security, tests, and review. Use when asked to "add an endpoint", "create a new route", "expose an API for X", or similar net-new API surface work. Not for pure bug fixes to an existing endpoint.

**21. `workflow-pre-merge-review`** (backend) — siblings: none

> Final review pass before calling a change done or ready to merge — runs the full principal-engineer checklist across correctness, database, security, performance, reliability, and observability. Use when asked "is this ready", "review before merge", "double check this change", or as a self-check before reporting any non-trivial change complete.

**22. `workflow-scope-intake`** (backend) — siblings: references

> The front-door workflow for a raw, unrefined ask — a founder/stakeholder describing a customer pain point or a rough scope, not yet a well-specified ticket. Use whenever the request is a business problem statement rather than a specific technical spec ("customers are complaining about X", "we need something for Y", "can we support Z"). Gathers requirements first, then hands off to planning, implementation, and self-review — never jump straight to code from a raw scope.

**23. `accessibility`** (frontend) — siblings: references

> Use this skill whenever the user is building UI that needs to be accessible — semantic HTML, ARIA usage, keyboard navigation, focus management, color contrast, screen reader support, captions/transcripts for video, or WCAG compliance review. Trigger for phrases like "make this accessible", "WCAG compliant", "screen reader support", "keyboard navigation", "focus trap", "aria-label", "color contrast", "captions for this video", or any request involving a11y. Also trigger for Definition of Done review on an accessibility feature or before shipping any user-facing UI.

**24. `animation-motion`** (frontend) — siblings: references

> Use this skill whenever the user is adding motion — page/route transitions, micro-interactions, hover/press animation, list reordering animation, loading/skeleton animation, or scroll-triggered effects. Trigger for phrases like "animate this", "add a transition", "make this feel smoother", "Framer Motion", "View Transitions API", "the animation is janky", "reduce motion", or any request involving CSS transitions/keyframes, `motion`/Framer Motion, or interactive-lesson animation for an EdTech product. Also trigger for Definition of Done review on a feature involving motion.

**25. `api-integration`** (frontend) — siblings: references

> Use this skill whenever the user is fetching data via REST/axios, structuring TanStack Query calls (`useQuery`/`useMutation`/`queryClient`), implementing pagination or polling, handling auth/token refresh, uploading files, or building offline-resilient features for an EdTech product. Trigger for phrases like "how do I call this API", "how do I paginate this list", "handle token refresh", "upload this video", "the app breaks when offline", "mock this API for tests", or any request involving fetching, mutating, or syncing data with a backend. Also trigger for Definition of Done review on an API-integration feature.

**26. `auth-session-flows`** (frontend) — siblings: references

> Use this skill whenever the user is building or reviewing frontend authentication/session flows — login/signup UX, OAuth/SSO redirect handling, protected routes, session/token refresh, "logged out mid-action" handling, or role-based UI gating. Trigger for phrases like "add login", "OAuth flow", "SSO", "protected route", "redirect after login", "session expired", "refresh token", "logged out while submitting", "role-based access in the UI", or any request involving NextAuth/Auth.js, Clerk, or a custom auth flow. Also trigger for Definition of Done review on an authentication/session feature. Distinct from `security-practices`, which covers the underlying token-storage/XSS/CSRF threat model this skill's flows must satisfy.

**27. `code-review-checklist`** (frontend) — siblings: references

> Use this skill whenever the user is reviewing a pull request, preparing a PR for review, giving or receiving code review feedback, or setting up a PR template/checklist. Trigger for phrases like "review this PR", "review this code", "what should I check before merging", "give feedback on this diff", "set up a PR template", or any request involving code review standards. Also trigger for Definition of Done review before merging.

**28. `component-architecture`** (frontend) — siblings: references

> Use this skill whenever the user is building, structuring, or reviewing React/Next.js components — creating new components, deciding folder structure, splitting large components, choosing between props/composition/context, naming files, or organizing a feature module. Trigger for phrases like "how should I structure this component", "this component is getting too big", "where should this file go", "props vs children", or any request to scaffold a new feature/component. Also trigger when reviewing code for component design quality or applying a Definition of Done for component sign-off.

**29. `data-viz-dashboards`** (frontend) — siblings: references

> Use this skill whenever the user is building charts, analytics dashboards, or large data tables — teacher/admin progress dashboards, cohort performance charts, large sortable/filterable student lists, or KPI summary views. Trigger for phrases like "build a dashboard", "add a chart", "show student progress", "analytics view", "sortable table", "the table is slow with lots of rows", "Recharts", "TanStack Table", or any request involving charting libraries, large-dataset tables, or admin/teacher-facing analytics UI. Also trigger for Definition of Done review on a dashboard/data-viz feature.

**30. `design-tokens`** (frontend) — siblings: references

> Use this skill whenever the user is setting up or maintaining a design token pipeline, theming system, dark mode, or multi-brand styling — not matching one Figma file 1:1 (that's `figma-pixel-perfect`), but the ongoing system that keeps colors/spacing/typography consistent and themeable across the whole product as it grows. Trigger for phrases like "set up design tokens", "add dark mode", "Style Dictionary", "theming system", "multi-brand support", "the colors are inconsistent across the app", "token pipeline", "CSS custom properties for theming", or any request involving a systematic token/theme architecture. Also trigger for Definition of Done review when a change touches shared design tokens.

**31. `documentation-storybook`** (frontend) — siblings: references

> Use this skill whenever the user is documenting components, setting up or writing Storybook stories, writing a README, recording an architecture decision, or documenting hooks/utilities/API contracts. Trigger for phrases like "add a story for this", "document this component", "set up Storybook", "write the README", "record this decision", "document this hook", or any request involving component documentation, ADRs, or changelogs. Also trigger for Definition of Done review before a release.

**32. `error-observability`** (frontend) — siblings: references

> Use this skill whenever the user is handling errors, setting up error boundaries, wiring up Sentry (or another monitoring tool), configuring source maps/release tracking, or deciding what to log versus surface to the user. Trigger for phrases like "add an error boundary", "set up Sentry", "how do I log this error", "the app shows a blank white screen on crash", "track releases", "source maps aren't uploading", or any request involving error monitoring, crash reporting, or production error visibility. Also trigger for Definition of Done review on error handling for a release.

**33. `feature-flags`** (frontend) — siblings: references

> Use this skill whenever the user is gating a feature behind a flag, running an A/B test/experiment, doing a gradual/percentage rollout, or cleaning up stale flags. Trigger for phrases like "feature flag this", "put this behind a flag", "A/B test", "gradual rollout", "kill switch", "LaunchDarkly", "GrowthBook", "remove this old flag", or any request involving conditional feature gating, experimentation, or canary releases. Also trigger for Definition of Done review when a feature ships behind a flag.

**34. `figma-pixel-perfect`** (frontend) — siblings: references

> Use this skill whenever the user wants to convert a Figma design into pixel-perfect, mobile-responsive UI code. Trigger for phrases like "pixel perfect", "match the Figma design exactly", "convert this Figma to code", "build this design in React/Next.js/Tailwind", or any request to implement a UI from a Figma link/screenshot where visual accuracy matters. Also trigger when the user asks about a "Definition of Done" for UI work, component sign-off, or design QA. Covers design-token extraction, component-by-component build order, screenshot diffing, breakpoint mapping, exact typography/effects/asset handling, and a 9-part Definition of Done checklist for sign-off.

**35. `form-handling-validation`** (frontend) — siblings: references

> Use this skill whenever the user is building, validating, or reviewing a form — sign-up/login forms, course/content authoring forms, quiz/assessment forms, multi-step wizards, or any input collection with validation rules. Trigger for phrases like "build this form", "validate this input", "how do I handle form errors", "prevent double submit", "autosave this form", "the form loses data on refresh", or any request involving React Hook Form, Zod schemas, or form accessibility. Also trigger for Definition of Done review on a form feature.

**36. `i18n-l10n`** (frontend) — siblings: references

> Use this skill whenever the user is internationalizing or localizing a React/Next.js app — setting up a translation library, adding a new locale, handling pluralization/date/number/currency formatting, RTL layout, locale-based routing, or translating course/UI content for an EdTech product. Trigger for phrases like "add i18n", "support multiple languages", "translate this", "RTL support", "pluralization rules", "locale routing", "hreflang", "why is this string hardcoded", or any request involving next-intl, react-i18next, FormatJS, or Intl APIs. Also trigger for Definition of Done review on an i18n/l10n feature, and whenever another skill's "route through the i18n mechanism" rule needs to actually be implemented.

**37. `monorepo-tooling`** (frontend) — siblings: references

> Use this skill whenever the user is setting up or restructuring a monorepo — multiple apps/packages sharing code, Turborepo/Nx configuration, shared UI/config packages, build caching, or dependency boundaries between packages. Trigger for phrases like "set up a monorepo", "share this component across apps", "Turborepo", "Nx", "workspace package", "circular dependency between packages", "build caching", "why is CI rebuilding everything", or any request involving `pnpm workspace`, `turbo.json`, or splitting a codebase into packages. Also trigger for Definition of Done review when a change touches shared/workspace packages.

**38. `notifications`** (frontend) — siblings: references

> Use this skill whenever the user is building push notifications, an in-app notification center, toast/snackbar alerts, or notification preferences. Trigger for phrases like "add push notifications", "notification center", "notification bell", "toast message", "notification preferences", "unread count", "the notification badge is wrong", "web push", "FCM", or any request involving notifying users of events (assignment due, grade posted, live class starting). Also trigger for Definition of Done review on a notifications feature.

**39. `payments-checkout`** (frontend) — siblings: references

> Use this skill whenever the user is building a checkout flow, course/subscription purchase UI, payment form, or reviewing PCI-scope concerns. Trigger for phrases like "add checkout", "buy this course", "subscription billing UI", "Stripe Elements", "payment form", "PCI compliance", "the payment failed silently", "coupon/discount code", "refund flow UI", or any request involving Stripe, Razorpay, or in-app purchase UX. Also trigger for Definition of Done review on a payments/checkout feature.

**40. `performance-optimization`** (frontend) — siblings: references

> Use this skill whenever the user is optimizing load time, responsiveness, or visual stability — Core Web Vitals (LCP/INP/CLS), bundle size, code splitting, image/font optimization, rendering strategy (Server Components/streaming), long-list virtualization, or low-bandwidth/low-end-device performance for an EdTech product. Trigger for phrases like "this page is slow", "improve Core Web Vitals", "reduce bundle size", "the app lags on low-end phones", "images are slow to load", "optimize this list", or any request involving performance profiling or optimization. Also trigger for Definition of Done review before a release.

**41. `pwa-offline`** (frontend) — siblings: references

> Use this skill whenever the user is building offline app-shell support, a web app manifest, install prompts, a service worker caching strategy, or background sync — making the app installable or usable with poor/no connectivity. Trigger for phrases like "make this a PWA", "add offline support", "install prompt", "service worker", "web app manifest", "cache this for offline", "background sync", "the app breaks with no signal", or any request involving Workbox, `next-pwa`, or offline-first architecture. Also trigger for Definition of Done review on offline/installability for a release.

**42. `realtime-collaboration`** (frontend) — siblings: references

> Use this skill whenever the user is building live/real-time features beyond simple Firebase data sync — live class sessions, WebRTC video/audio, chat, presence indicators, live quiz/poll sync during a session, or collaborative whiteboarding. Trigger for phrases like "live class", "video call", "WebRTC", "chat feature", "who's online", "presence indicator", "live poll", "collaborative whiteboard", "reconnection handling", "the live session drops when network blips", or any request involving WebSocket architecture, Socket.io, LiveKit, or real-time multi-user sync. Also trigger for Definition of Done review on a live/realtime feature.

**43. `rich-text-editing`** (frontend) — siblings: references

> Use this skill whenever the user is building, integrating, or reviewing a rich text/WYSIWYG editor — course/lesson content authoring, comment or discussion editors, quiz question authoring with formatting, or anywhere free-text content needs formatting, embedded media, math, or code blocks. Trigger for phrases like "add a rich text editor", "WYSIWYG", "course content editor", "how do I sanitize this editor content", "embed an image/video in the editor", "the editor content isn't saving right", or any request involving Tiptap, Lexical, ProseMirror, Slate, or `dangerouslySetInnerHTML`. Also trigger for Definition of Done review on a rich-text/content-authoring feature.

**44. `search-discovery`** (frontend) — siblings: references

> Use this skill whenever the user is building search UI, filters, faceted browsing, or course/content discovery — instant search-as-you-type, catalog filtering, autocomplete, or "no results" handling. Trigger for phrases like "add search", "instant search", "filter these courses", "faceted search", "autocomplete", "search is slow", "no results found", "Algolia", "Meilisearch", "typo tolerance", or any request involving search UX or catalog discovery. Also trigger for Definition of Done review on a search/discovery feature.

**45. `security-practices`** (frontend) — siblings: references

> Use this skill whenever the user is handling authentication, authorization, secrets/environment variables, third-party scripts, file uploads, sensitive data, or reviewing code for security issues in a React/Next.js/EdTech app. Trigger for phrases like "is this secure", "how do I store this token", "prevent XSS/CSRF", "environment variables leaking", "review this for security", "add a CSP", "student data exposure", or any request involving OWASP, security headers, or dependency vulnerabilities. Also trigger for Definition of Done review before a release.

**46. `seo-metadata`** (frontend) — siblings: references

> Use this skill whenever the user is setting up metadata, Open Graph tags, structured data, sitemaps, or robots rules for a Next.js app — course/catalog pages needing discoverability, social share previews, or search-engine indexing. Trigger for phrases like "add SEO to this page", "generateMetadata", "Open Graph tags", "structured data", "sitemap.xml", "robots.txt", "why isn't this page indexed", "social share preview", or any request involving Next.js metadata API, JSON-LD, or search/social discoverability. Also trigger for Definition of Done review before a release of a publicly indexable page.

**47. `state-management`** (frontend) — siblings: references

> Use this skill whenever the user is deciding where state should live, structuring a Zustand store, working with TanStack Query, deciding between a store and the URL, or debugging state-sync/re-render issues in a React/Next.js app. Trigger for phrases like "should this be in Zustand or Redux", "where should I store this state", "my component re-renders too much", "how do I structure this store/slice", "cache invalidation", "optimistic update", or any request involving global state, server state, or Firebase listeners. Also trigger for Definition of Done review on a state-management feature.

**48. `testing-frontend`** (frontend) — siblings: references

> Use this skill whenever the user is writing, reviewing, or structuring tests for React/Next.js components, hooks, or flows — unit tests, integration tests, E2E tests, mocking API calls, accessibility testing, or CI test setup. Trigger for phrases like "write a test for this", "how do I test this component/hook", "mock this API call", "this test is flaky", "set up Vitest/Jest", "E2E test for this flow", or any request involving React Testing Library, MSW, Playwright, or test coverage. Also trigger for Definition of Done review before a release.

**49. `typescript-patterns`** (frontend) — siblings: references

> Use this skill whenever the user is typing a reusable component, hook, or utility beyond basic prop types — generic/polymorphic components, discriminated unions for state modeling, typing a custom hook's return, utility types, or resolving a gnarly TypeScript error. Trigger for phrases like "make this component generic", "type this polymorphic component", "as prop typing", "discriminated union", "why is TypeScript complaining here", "type this hook", "avoid any here", or any request involving generics, conditional types, or type-safe API contracts in a React/Next.js codebase. Also trigger for Definition of Done review when "no any" or type-safety is in question.

**50. `video-player-architecture`** (frontend) — siblings: references

> Use this skill whenever the user is building or reviewing video playback — a course lesson player, DRM-protected paid content, resume-position sync, captions/subtitles, seek/scrubbing UX, or adaptive playback quality. Trigger for phrases like "build a video player", "resume where I left off", "DRM protect this video", "captions aren't showing", "the player buffers too much", "adaptive bitrate playback", "Video.js", "hls.js", "Shaka Player", or any request involving lesson/course video playback. Also trigger for Definition of Done review on a video playback feature. Distinct from `api-integration`'s upload/transport rules — this skill owns playback, not ingestion.
---

## 2. CLAUDE.md verdict — all 439 lines

**Every line is always in context.** `grep -n '^@' CLAUDE.md` returns **no matches**, and so
does `grep -n '@docs/\|@\.claude/\|@skills/' CLAUDE.md` — there are no `@path` imports, so
nothing is lazily loaded. All cross-references (`CLAUDE.md:5,6,228,314,417,419`) are ordinary
Markdown links, which Claude Code does not auto-follow.

### Verdict summary

| Lines | Section | Verdict | Reason |
|---|---|---|---|
| 1–11 | Title, north star | **KEEP** | "Nothing important happens invisibly" is the framing every other rule inherits. Not derivable. |
| 13–27 | Locked stack | **KEEP** | Includes the rejected list (`:26-27`). A rejection is not derivable from code that was never written. |
| 29–56 | Deferred infra decisions | **KEEP** | Explicitly says "do not invent an answer" (`:31-32`). Deleting this invites the guess it forbids. |
| 58–83 | The five rules | **KEEP — highest value in the file** | These are project invariants. `:63` (invariants in DB), `:69` (outbox is the commitment), `:72` (append-only ledger), `:75` (strong consistency), `:79` (versioned policy rows). |
| 85–101 | Skills precedence | **KEEP, with `:87` corrected** | The precedence order is a real decision. But "17 skills" is wrong — there are 22. |
| 102–120 | Vocabulary notes, divergences | **KEEP** | Resolves dangling references inside skill files. Cheap, load-bearing. |
| 122–149 | `## Enforced mechanically` | **CUT → pointer** | Restates the hook's own 8 rules in prose. Two sources of truth for one rule set; the hook is authoritative and the table can silently drift from it. Replace with a pointer to `.claude/hooks/guard-invariants.js`. |
| 151–179 | MCP blind spot | **KEEP, compressed** | The *reasoning* (MCP bypasses the hook) is not derivable and is a live decision. The two-bucket table can shrink. |
| 181–221 | Agents and risk classes | **CUT in part → pointer** | The agent roster and the three commands duplicate `.claude/agents/README.md:26-32,77-83` and the four files in `.claude/commands/`. **Keep** the risk-class table (`:191-197`) — approval policy is a rule, not a description. |
| 224–246 | Domain modules | **CUT → pointer** | Duplicates `docs/folder-structure.md` (which `:228` already links) and the on-disk `apps/api/src/modules/*` tree. Derivable two ways. |
| 248–278 | Identity model | **KEEP** | Enrollment vs Subscription vs Payment vs Schedule vs Session (`:259-265`) is exactly the conflation that causes silent data-model errors. |
| 280–297 | Merithub | **KEEP** | "Never call upstream DELETE" (`:291`) and the no-idempotency-keys constraint are external facts, unknowable from the code. |
| 299–321 | Governance | **KEEP** | The four-things-in-one-transaction rule (`:301-302`) is the uniform write path. |
| 323–337 | Session & compensation policy | **KEEP** | Domain rules, none implemented yet. |
| 339–346 | Capacity | **KEEP** | Forecast-vs-current capacity distinction is subtle and unimplemented. |
| 348–378 | Reads and delivery + frontend stack | **KEEP** | Carries its own reversal trigger (`:376`). |
| 380–395 | Testing & operations | **KEEP** | Port 5433, no Docker, workers-never-scale-to-zero. Environment facts. |
| 397–410 | Roadmap | **KEEP, compressed** | Phase 1 boundary decides what is in scope. Phases 3–5 can be one line each. |
| 412–439 | Working conventions | **KEEP** | Reversal triggers and the open-decisions pointer. `:427-435` records an answered decision that exists in no other file. |

### CONVERT-TO-HOOK: nothing qualifies

This is a finding, not an omission. Every mechanically-checkable prose rule in CLAUDE.md is
**already** a guard rule in `guard-invariants.js:68-224` — the prose at `CLAUDE.md:127-136` is
a *description of* the hook, not an unenforced rule.

The rules that remain prose-only are the ones `CLAUDE.md:146-149` itself names: "an invariant
written into service logic, a reconciliation job, a hard-coded threshold in application code,
a missing audit write". Those are semantic judgements. A regex cannot decide whether a
threshold is hard-coded or whether an audit write is missing without understanding intent,
and a regex that tried would fire on every legitimate constant. `CLAUDE.md:148-149` already
routes them to `erosion-auditor` and `workflow-pre-merge-review`. **Converting them to hooks
would produce false positives that train you to ignore the hook** — the worst outcome for an
enforcement layer.

---

## 3. Enforcement inventory

### Hook events configured: `PreToolUse` only

`.claude/settings.json:3-16` contains exactly one hook, on one event:

| Event | Configured? | Evidence |
|---|---|---|
| `PreToolUse` | **yes** | `.claude/settings.json:4`, matcher `"Bash\|PowerShell\|Write\|Edit"` at `:6` |
| `PostToolUse` | **not found** | grep over `.claude/settings.json` returns no match |
| `Stop` | **not found** | — |
| `SubagentStop` | **not found** | — |
| `SessionStart` | **not found** | — |
| `UserPromptSubmit` | **not found** | — |
| `PreCompact` / `Notification` | **not found** | — |

`.claude/settings.local.json` — **not found**. `.claude/` holds only `agents/`, `commands/`,
`hooks/`, `skills/`, `settings.json`.

**`permissions` key — absent entirely.** No `allow`, no `deny`, no `ask`, no `defaultMode`. No
`env`, no `sandbox`. The file contains exactly `$schema` and `hooks`.

### The 8 guard rules — `.claude/hooks/guard-invariants.js` (239 lines)

| # | Rule | Line | Verdict |
|---|---|---|---|
| C1 | `prisma migrate dev` without `--create-only` | `:68-85` | **deny** |
| C2 | `prisma migrate reset` | `:87` | ask |
| C3 | `prisma db push` | `:94` | ask |
| F1 | Merithub `delete`/`destroy`/`remove` | `:123-127` | **deny** |
| F2 | `await` on Merithub/FreeJump/WhatsApp on a request path | `:148-150` | ask |
| F3 | Stored balance column (`sessions_remaining` etc.) | `:167-171` | ask |
| F4 | `DROP CONSTRAINT\|INDEX\|TRIGGER` | `:186-188` | ask |
| F5 | `UPDATE`/`DELETE` on a ledger table | `:200-204` | ask |
| F6 | `UPDATE`/`DELETE` on audit/policy/approval tables | `:219-224` | ask |

Two denies, six asks — matching `CLAUDE.md:127-136`. Fails open by design
(`guard-invariants.js:22-27`), timeout 10s (`.claude/settings.json:11`).

### What the guard structurally cannot see

Beyond the MCP blindness already documented at `CLAUDE.md:151-179`:

1. **`MultiEdit` is not in the matcher.** The `PreToolUse` matcher lists
   `Bash|PowerShell|Write|Edit`, and `guard-invariants.js:48-58` falls through to
   `process.exit(0)` for any other tool. A multi-file edit bypasses every file rule.
   (This audit was taken before the upgrade; the matcher's line number has since moved, as the
   `permissions` block was inserted above it.)
2. **`Edit.old_string` is never inspected.** `guard-invariants.js:55` builds the body from
   `ti.content` and `ti.new_string` only — so *deleting* a constraint by replacing it with
   nothing is invisible, because the dropped text only ever appears in `old_string`.
3. **Subagent `Task` calls are not matched** — an agent's own tool calls are checked, but the
   spawn is not.
4. **Rule-ordering short-circuit.** `deny()` exits at `:45`, so a command or file that trips
   two rules only ever reports the first.
5. **F3–F6 are gated on `isMigration`** (`:165,185`), so a stored balance added to a `.ts`
   entity, or a ledger `UPDATE` issued through the Prisma client in a `.service.ts`, passes
   untouched. `CLAUDE.md:146-149` acknowledges this and routes it to `erosion-auditor`.
6. **Blanket doc exemption at `:116`** — any `.md`, anything under `/.claude/` or `/docs/`,
   exits before every file rule.

---

## 4. Verification inventory

### Every script that exists

Only **two** `package.json` files exist outside `node_modules`. Note that
`apps/api/package.json` and `apps/web/package.json` **do not exist** — despite
`package.json:6` declaring `"workspaces": ["apps/*", "packages/*"]`, those two directories are
tsconfig projects only, not npm workspaces.

| Script | Command | Defined at |
|---|---|---|
| `lint` | `eslint .` | `package.json:8` |
| `lint:fix` | `eslint . --fix` | `package.json:9` |
| `format` | `biome format --write .` | `package.json:10` |
| `format:check` | `biome check .` | `package.json:11` |
| `check` | `npm run format:check && npm run lint` | `package.json:12` |
| `test` | `vitest run` | `package.json:13` |
| `test:watch` | `vitest` | `package.json:14` |
| `db:seed` | `node prisma/seed.mjs` | `package.json:15` |
| `db:migrate` | `prisma migrate deploy` | `package.json:16` |
| `build` | `tsc -b` | `packages/contracts/package.json:9` |

**Not found anywhere:** `typecheck`, `e2e`, and a **root** `build`.

### Two traps for anything that runs these

1. **`tsc --noEmit` at root checks zero files.** `tsconfig.json:7-12` is solution-style with
   `"files": []` and three `references`. Type-checking requires **`tsc -b`**. The config says
   so itself at `tsconfig.json:3`. Verified: `npx tsc -b --dry` reports it would build
   `packages/contracts`, `apps/api`, `apps/web`.
2. **`npm test` needs a live database.** `vitest.config.ts:5` collects only
   `prisma/tests/**/*.spec.ts`, and `prisma/tests/helpers.ts:23-25` **throws at import** if
   `TEST_DATABASE_URL` is unset. There is no `.env`, and `vitest` is not installed.

### What currently blocks a turn from ending

**Nothing.**

| Gate | Status |
|---|---|
| `Stop` hook | not found |
| CI (`.github/workflows/`) | **not found** — no `.github` directory at all |
| Git hooks (`.husky/`, `prepare` script) | not found |
| `lint-staged` | not found |
| `scripts/` directory | **not found** |

The only enforcement in the repo is `PreToolUse` — which runs *before* a change and checks
text patterns. After a change is written, nothing verifies that it compiles, lints, or passes
a test. That is the gap the rest of this work closes.

---

## 5. Skill-library findings that change what gets built

1. **`project-conventions` is stale in a way that inverts its own authority.**
   `project-conventions/SKILL.md:13-16` says "**Status: template, not yet populated.** No
   project code exists yet", and its description ends "Currently a template — populate it once
   real code exists." But `project-conventions/references/conventions.md` is **198 lines of
   observed fact** — PostgreSQL 17.11 on port 5433, no Docker (`:12,29`), a 13-row trigger
   inventory (`:90-104`), the Biome/ESLint split (`:132-149`). Since `CLAUDE.md:98` says this
   skill **wins over every other skill's defaults once populated**, an agent that reads the
   SKILL.md body and stops concludes there are no conventions to honour. Actively harmful.

2. **`frontend/api-integration` contradicts itself.** `SKILL.md:64-66` says types come from
   "shared TypeScript types across the monorepo boundary… not codegen guesswork", while its
   own `references/rules.md:43-44` prescribes OpenAPI codegen.

3. **Two literal trigger collisions** — identical quoted phrases in two descriptions each,
   with no disambiguating clause in either:
   - `"add an endpoint"` — `backend-api-design/SKILL.md:3` and `workflow-new-endpoint/SKILL.md:3`
   - `"review this code"` — `testing-debugging-review/SKILL.md:3` and
     `frontend/code-review-checklist/SKILL.md:3`

4. **One false-positive trigger**: `reliability-observability/SKILL.md:3` claims the bare word
   `"dashboard"` (an ops dashboard), which also matches `frontend/data-viz-dashboards/SKILL.md:3`
   (a product dashboard). Unrelated meanings.

5. **The backend set lacks the "Distinct from X" clauses the frontend set uses well**
   (`frontend/auth-session-flows/SKILL.md:3`, `design-tokens/SKILL.md:3`,
   `video-player-architecture/SKILL.md:3`). Backend arbitration lives in skill *bodies*, which
   are only read after selection has already happened.

6. **`packages/contracts` is owned by no skill.** Named in exactly 2 of 50
   (`project-conventions/references/conventions.md:75`,
   `frontend/api-integration/SKILL.md:64-66`). Nothing describes how a Prisma model becomes a
   contract type, or how the `CHECK`-constraint vocabularies stay in sync with TypeScript
   unions.

7. **`cron` appears once in the entire library**
   (`spellzee-outbox-merithub/references/patterns.md:91`). Scheduled work — reminders,
   retention triggers, the rolling-horizon session materialisation that `CLAUDE.md:267-270`
   requires — is owned by nobody.

8. **`infra-cost-ai-backend` is the sole claimant of deploy/CI** (41 lines, second-shortest
   backend skill) and frames everything as AWS/K8s/Terraform/Docker — on a machine with **no
   Docker at all** (`project-conventions/references/conventions.md:12,29`).

---

## 6. Gap analysis against the target state

**Stack translation.** The target list assumes tRPC, Redis read-through caching and ISR.
`CLAUDE.md:26-27` rejects "Redis as a read-through cache for domain reads" and the locked
stack (`CLAUDE.md:15-24`) is NestJS REST + `packages/contracts`. `grep -rni "trpc"
.claude/skills` returns **zero hits**. Those targets are therefore assessed by intent, with
the conflicting line named.

### Backend skills

| Target | Verdict | Evidence |
|---|---|---|
| api-design | **EXISTS** | `backend/backend-api-design/SKILL.md` — REST/pagination/error shapes. tRPC/zod portions **N/A**: stack is NestJS REST (`CLAUDE.md:17`). |
| database-schema | **EXISTS** | `database-engineering` + `spellzee-invariants` + `workflow-db-migration`; migration rules also at `conventions.md:68-83`. |
| auth-authorization | **PARTIAL** | Present: triggers + RBAC-vs-ABAC guidance, `security-engineering/SKILL.md:3,9,23`. Absent: the *project's* pattern — `conventions.md:125-128` is entirely `_TBD_` ("session or JWT? Where does the auth check happen?"). Ten skills assume a role model no skill defines. |
| backend-testing | **EXISTS** | `testing-debugging-review` + real conventions at `conventions.md:108-117` (`withRollback`, `fileParallelism: false`) + 58 live tests. |
| background-jobs | **PARTIAL** | Present: outbox/BullMQ/idempotency/webhooks in `spellzee-outbox-merithub` (143 lines). Absent: scheduled/recurring jobs — one `cron` mention library-wide. |
| caching-revalidation | **EXISTS-BY-REJECTION** | `distributed-systems-caching/SKILL.md:46-53` rejects domain-read caching, matching `CLAUDE.md:27`. Building the target as written would reverse rule 4. **No action.** |
| observability | **EXISTS** | `reliability-observability` + the log-identifiers-never-values rule at `CLAUDE.md:314-321` and `docs/data-classification.md`. |
| deployment-ops | **PARTIAL** | Only `infra-cost-ai-backend` claims it, with Docker/K8s framing that does not apply. No CI exists to describe. |
| backend-security | **EXISTS** | `security-engineering` + `frontend/security-practices`. |

### Cross-cutting

| Target | Verdict | Evidence |
|---|---|---|
| type-safety-contract | **MISSING** | The only true gap. See finding 6 above. |

### Enforcement and verification

| Target | Verdict | Evidence |
|---|---|---|
| `scripts/verify.sh` | **MISSING** | no `scripts/` directory |
| Stop hook | **MISSING** | `PreToolUse` is the only event (`.claude/settings.json:4`) |
| Reviewer subagent | **PARTIAL** | `erosion-auditor` reviews diffs in fresh context, but against the trade-off library only; `erosion-auditor.md:73-74` fixes its rubric and `:115` forbids reasoning about intent. Plan-conformance is unowned. |
| Permissions allowlist | **MISSING** | no `permissions` key at all |
| Worktree / `/batch` readiness | **NOT APPLICABLE** | single repo, clean tree; nothing blocks worktree use today |
