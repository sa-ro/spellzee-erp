---
name: reliability-observability
description: Use when designing for failure handling (timeouts, retries, circuit breakers, bulkheads, health checks, graceful shutdown, failover, DR, SLA/SLO/SLI, RTO/RPO) or when adding/reviewing logging, metrics, or tracing. Triggers on "reliability", "fault tolerant", "circuit breaker", "SLA", "SLO", "logging", "metrics", "tracing", "observability", "alert", "ops dashboard", "monitoring dashboard". Note "dashboard" here means an **operational** one; a product dashboard of charts and tables for staff or parents is `frontend/data-viz-dashboards`.
---

# Reliability & Observability

## Reliability

Design assuming components will fail. Use where appropriate: timeouts,
retries with exponential backoff + jitter, circuit breakers, bulkheads,
health checks, graceful shutdown, failover, disaster recovery, backups.

Know and apply: SLA, SLO, SLI, error budgets, RTO, RPO — pick numbers
appropriate to the system rather than assuming "always available."

## Observability

Production systems must be observable via structured logging, metrics,
distributed tracing, correlation IDs, and (where the stack supports it)
OpenTelemetry, dashboards, and alerts.

After any change, an engineer should be able to answer: What happened? Why?
Which request/service/dependency caused it? How long did it take? How
often is it happening? If a change makes any of these harder to answer,
call that out.

## Reference

See `references/references.md` for retry/backoff formulas, circuit
breaker states, timeout guidance, SLA/SLO/SLI/error-budget definitions,
RTO/RPO, and baseline structured-log fields.

## Definition of Done

Before calling any reliability/observability work using this skill
complete, run it against `references/dod.md`. Every applicable item must
pass.
