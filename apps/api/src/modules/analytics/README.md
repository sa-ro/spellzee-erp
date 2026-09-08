# `analytics` — Reporting & Intelligence

**Phase 5.** Baseline §25, §26, §27.

Empty on purpose, and the emptiness is the point: *foundation first; analytics and AI after data
quality is established* (§3.2).

## Will own

Operational, academic, teacher, financial, capacity and retention reporting (§26). Later, the AI
layer (§27) — allocation recommendations, duplicate detection assistance, retention risk, history
summaries.

## Two rules that hold from the start

**Read-only.** Analytics derives; it never writes a domain record. If a report needs a value that
does not exist, the fix is in the owning module.

**No separate read store.** CQRS was rejected — same database, strong consistency. Dashboards are
fan-out on read. A materialized view is the sanctioned escalation if a query genuinely becomes too
expensive, and it must be rebuildable from source.

## AI governance, when that arrives

Verified records only, permission-aware, never silently changes a critical record, source context
inspectable, outputs are recommendations unless a business rule explicitly approves them (§27.2).

## Blocked

Management reporting definitions (§30.21) — value-blocking, not shape. §26 gives example KPIs.
