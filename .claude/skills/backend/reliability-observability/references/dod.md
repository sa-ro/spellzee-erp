# Definition of Done — Reliability & Observability

Work is not done until every applicable item below is true.

- [ ] Every outbound call (DB, cache, HTTP, queue) has an explicit
      timeout shorter than the caller's own deadline.
- [ ] Retries use backoff with jitter, and are capped (attempts and/or
      total elapsed time) — no unbounded or immediate-retry loop.
- [ ] A failing dependency degrades the system gracefully (fallback,
      circuit breaker, cached value) rather than cascading into a full
      outage.
- [ ] Every request/operation log includes a correlation ID
      (`request_id`/`trace_id`) that can be traced across services.
- [ ] Structured logging is used (not string concatenation), with
      consistent baseline fields (timestamp, level, service, duration).
- [ ] Errors are logged with enough context to diagnose without
      reproducing locally, but without leaking secrets/PII.
- [ ] Graceful shutdown is implemented for any long-running process
      (stop accepting new work, finish in-flight, close connections
      cleanly).
- [ ] Given only logs/metrics/traces, someone could answer: what
      happened, why, which request/dependency, how long, how often.
- [ ] RPO (acceptable data loss) and RTO (acceptable downtime) are
      stated for this system, and the backup/replication frequency
      actually matches the stated RPO — not assumed to.
