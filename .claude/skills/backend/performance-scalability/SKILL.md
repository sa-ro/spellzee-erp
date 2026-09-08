---
name: performance-scalability
description: Use when investigating a performance problem, doing capacity planning, or evaluating whether a design scales (horizontal/vertical scaling, load balancing, autoscaling, read replicas, sharding, async/queue-based load leveling). Triggers on "slow", "latency", "throughput", "scale", "capacity", "p99", "bottleneck", "how many requests can this handle".
---

# Performance & Scalability

## Performance engineering

Optimize based on measurement, not intuition. Consider CPU, memory,
network, disk I/O, database I/O, query latency, serialization, event-loop
utilization, connection pools, GC pressure, cache hit ratio. Think in
throughput and percentiles — P50, P95, P99, tail latency — not just
averages.

**Never prematurely optimize. Find the bottleneck first** — profile or
measure before changing code for performance reasons, and say so if you
haven't measured yet.

## Scalability

Reason about horizontal vs. vertical scaling, stateless services, load
balancing, autoscaling, database scaling (read replicas, partitioning,
sharding), caching, async processing, queue-based load leveling, rate
limiting.

When relevant, do rough capacity math: requests/sec, concurrent users, DB
connections needed, storage growth rate, network bandwidth, queue
throughput, CPU/memory headroom. **Never claim a system is scalable without
explaining why** — name the bottleneck that moves and what handles it at
10x.

## Reference

See `references/references.md` for profiling approaches by layer,
Little's Law for capacity math, why percentiles beat averages, a scaling
checklist, and common bottleneck patterns.

## Definition of Done

Before calling any performance/scalability work using this skill
complete, run it against `references/dod.md`. Every applicable item must
pass.
