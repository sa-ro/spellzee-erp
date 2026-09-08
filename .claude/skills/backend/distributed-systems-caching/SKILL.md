---
name: distributed-systems-caching
description: Use when work involves multiple services/processes talking to each other, message queues/event streams (Kafka, RabbitMQ, SQS, SNS, Pub/Sub, Redis Streams), or caching (Redis, cache-aside/read-through/write-through, TTL, invalidation, stampede). Triggers on "cache", "queue", "kafka", "event", "consumer", "producer", "retry", "at-least-once", "idempotent consumer", "distributed lock".
---

# Distributed Systems, Messaging & Caching

## Distributed systems

Always ask:
> What happens if this dependency goes down?
> What happens if the network becomes unreliable?
> What happens if this operation happens twice?

Reason about: partial failures, timeouts, retries, duplicate
requests/messages, ordering, eventual vs. strong consistency, distributed
transactions, distributed locks, leader election, replication, consensus,
split brain, cascading failures.

## Message queues & event systems

Reason about delivery semantics explicitly: at-most-once, at-least-once,
exactly-once (rare, usually simulated via idempotency). Consider consumer
groups, ordering guarantees, partitioning, replay, dead-letter queues,
poison messages, retry policy, backpressure, and **idempotent consumers**
(assume every message can be delivered more than once).

## Caching

Caching is an architectural decision, not a default optimization. Before
introducing it, answer:

- Why is caching needed (what's actually slow/expensive)?
- What data may become stale, and how stale is acceptable?
- How does invalidation work?
- What happens if the cache is unavailable — does the system degrade or
  break?
- What consistency guarantees are actually required?

Know the patterns and when each applies: cache-aside, read-through,
write-through, write-behind. Watch for cache stampede and hot keys in
distributed caches.

### Spellzee posture (stricter than the above — this is a locked decision)

**The database is truth. Redis holds only derived, ephemeral or
externally-owned state.** Read-through caching in front of domain reads is
rejected: at this scale Postgres is fast enough that a cache buys latency
we don't need in exchange for the hardest bug class in the field — stale
reads nobody notices for weeks.

The governing test: **Redis must be allowed to lose everything at any
moment.** If losing it corrupts truth, it belongs in Postgres. The
legitimate uses all pass that test — the external API token cache
(external, expiring, reconstructible, shared across workers because of a
strict token-issuance rate limit), rate-limit counters, queue state, and
sessions.

First realistic exception: the teacher availability grid across a term, if
recomputation cost ever exceeds the value of freshness. When that day
comes, cache it with an explicit invalidation event **and** a TTL
backstop — never a TTL alone.

### Spellzee posture on queues and the outbox

BullMQ on Redis was chosen over Kafka because these messages are *tasks*
("create this class upstream"), not *facts* other systems observe. The
durability inversion is the point: **the outbox row in Postgres is the
commitment; the queue job is only a trigger.** Redis losing a job is
survivable because the outbox row is still there to be re-enqueued. That
is what makes a Redis-backed queue safe for money-adjacent work.

Reversal trigger for the queue choice: three or more independent
consumers of the same event, or a recurring need to reprocess history.
Durability alone does not reverse it; replay does.

Do not introduce a distributed lock, a saga, or a distributed transaction
where a single Postgres transaction covers the invariant — inside the
database, consistency here is strong by design. See
`backend/spellzee-outbox-merithub`.

## Anti-patterns

Distributed transactions where a local transaction or eventual consistency
would do; unnecessary caching that trades correctness for speed nobody
asked for; retry storms from unbounded/no-backoff retries.

## Reference

See `references/references.md` for the CAP trade-off framing, a delivery-
semantics table, the outbox pattern steps, cache pattern comparisons, and
stampede/hot-key mitigation.

## Definition of Done

Before calling any distributed-systems/caching work using this skill
complete, run it against `references/dod.md`. Every applicable item must
pass.
