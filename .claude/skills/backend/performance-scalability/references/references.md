# Performance & Scalability — Reference

## Measure before optimizing

Don't guess the bottleneck — profile it:

- **App-level**: language/runtime profiler (flame graphs), APM traces
  (span durations per hop).
- **DB-level**: `EXPLAIN ANALYZE`, slow query log, `pg_stat_statements` or
  equivalent.
- **System-level**: CPU/memory/disk I/O/network via existing metrics
  (don't add new infra just to check this once).

State what you measured and the number, not an assumption ("this query
takes 400ms per `pg_stat_statements`" not "this query is probably slow").

## Little's Law (capacity math)

`concurrent requests in system = throughput (req/s) × average latency (s)`

Use it to sanity-check pool sizes: if you expect 200 req/s at 50ms average
latency, you need roughly 10 concurrent connections/workers in steady
state — undersizing the pool creates queueing that inflates latency
further (a feedback loop), oversizing wastes resources/connections on the
downstream (e.g. DB max_connections).

## Percentiles, not averages

Averages hide tail latency. A service with 50ms average but 2s P99 means
1% of users have a broken experience — that's often the number that
matters for user-facing SLAs. Always ask which percentile a "latency"
number refers to.

## Scaling checklist

- [ ] Is the service stateless (session/state externalized to
      DB/cache/queue) so it can scale horizontally without sticky
      sessions?
- [ ] What's the actual bottleneck at 10x traffic — app CPU, DB
      connections, a single downstream dependency, a lock?
- [ ] Does the DB need read replicas, or is the write path also the
      bottleneck (replicas don't help writes)?
- [ ] Is there a queue absorbing bursty load (queue-based load leveling)
      instead of every request hitting a synchronous critical path?
- [ ] Are rate limits in place to protect the system from its own
      clients, not just abuse?

## Common bottleneck patterns

- Connection pool exhaustion under load → requests queue → latency spikes
  → look like "the DB is slow" when it's actually pool sizing.
- N+1 queries that are invisible at low traffic become the dominant cost
  at scale — always check query count per request, not just query speed.
- A single synchronous downstream call without a timeout turns one slow
  dependency into a full outage (thread/connection exhaustion cascades
  upstream) — see `reliability-observability` for circuit breakers.
