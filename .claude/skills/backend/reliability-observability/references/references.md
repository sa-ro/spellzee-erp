# Reliability & Observability — Reference

## Retry policy

- Retry only on errors that are actually transient (timeouts, 502/503/
  429, connection resets) — never retry a 4xx validation error.
- Use exponential backoff with jitter:
  `delay = min(cap, base * 2^attempt) * random(0.5, 1.0)` — jitter
  prevents synchronized retry storms from many clients.
- Cap total retry attempts and total elapsed time; give up and surface
  the failure rather than retrying forever.
- Retries must be idempotent-safe on the receiving end — see
  `distributed-systems-caching` for idempotent consumer/idempotency-key
  patterns.

## Circuit breaker states

- **Closed**: requests flow normally; failures counted in a rolling
  window.
- **Open**: failure threshold exceeded → reject immediately (fail fast)
  without calling the dependency, for a cooldown period.
- **Half-open**: after cooldown, allow a small number of trial requests;
  success → close the circuit, failure → reopen it.

Pair with a **bulkhead** (separate connection/thread pools per
dependency) so one failing dependency can't exhaust resources needed by
calls to a healthy one.

## Timeouts

Every outbound call (DB, cache, HTTP, queue) needs an explicit timeout
shorter than the caller's own deadline — an unbounded call turns one slow
dependency into a full outage. Set client timeout < server timeout for
that call, and propagate a deadline/budget down the call chain when
possible rather than each hop picking its own number independently.

## SLA / SLO / SLI / error budget

- **SLI**: a measured indicator (e.g. % of requests under 300ms).
- **SLO**: the target for that indicator (e.g. 99.5% of requests under
  300ms over 30 days) — internal engineering target.
- **SLA**: the SLO turned into an external, often contractual, promise
  (usually looser than the SLO to leave margin).
- **Error budget**: `1 − SLO` — the allowed failure rate. Spend it
  deliberately (risky deploys, experiments); when it's exhausted, prioritize
  reliability work over new features.

## RTO / RPO (disaster recovery)

- **RTO** (Recovery Time Objective): how long can the system be down
  before it's an unacceptable outage — drives failover automation
  investment.
- **RPO** (Recovery Point Objective): how much data loss is acceptable,
  measured in time — drives backup/replication frequency (e.g. RPO of 5
  minutes needs continuous replication, not nightly backups).

## Structured logging fields (baseline)

`timestamp`, `level`, `service`, `request_id`/`trace_id`, `user_id` (if
applicable, never with other PII), `message`, `duration_ms` (for
request/operation logs), `error.type` + `error.message` (never the raw
stack trace of a downstream secret-bearing exception without scrubbing).
Correlate `request_id` across every service a request touches so a single
ID reconstructs the full path in traces/logs.
