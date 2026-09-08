# Distributed Systems, Messaging & Caching — Reference

## CAP / consistency trade-off

Under a network partition you must choose: **consistency** (reject
requests that can't be guaranteed correct) or **availability** (keep
serving, possibly stale/conflicting data). Name which one a given
component chooses, and why — most systems are AP for reads (with eventual
consistency) and CP for the specific operations that can't tolerate it
(e.g. payment ledger writes).

## Delivery semantics

| Semantics | Mechanism | Consumer must |
|---|---|---|
| At-most-once | fire and forget, no retry | tolerate silent loss |
| At-least-once | ack after processing, retry on no-ack | be idempotent (may see duplicates) |
| Exactly-once | usually simulated: at-least-once + idempotent consumer + dedup store | dedupe on a message/idempotency ID |

Default assumption for any queue/broker: **at-least-once**. Design
consumers to be idempotent (dedupe key, upsert instead of insert, check
before acting) rather than chasing true exactly-once delivery.

## Outbox pattern (atomic DB write + event publish)

1. In the same DB transaction as the business write, insert a row into an
   `outbox` table describing the event.
2. A separate relay process (polling or CDC/log-based) reads unpublished
   outbox rows and publishes them to the broker.
3. Mark published after broker ack; relay retries on failure — the
   consumer side still needs idempotency since the relay can publish
   twice.

This avoids the dual-write problem (DB commit succeeds, broker publish
fails, or vice versa) without a distributed transaction.

## Cache patterns

- **Cache-aside**: app checks cache, on miss reads DB and populates cache.
  Simplest, most common; cache can go stale until TTL or explicit
  invalidation.
- **Read-through**: cache library/proxy handles the miss-then-populate
  transparently.
- **Write-through**: writes go to cache and DB synchronously — reads
  always fresh, writes slower.
- **Write-behind**: writes go to cache, flushed to DB async — fast writes,
  risk of data loss if the cache dies before flush.

## Cache stampede & hot keys

- **Stampede** (many requests miss the same expired key simultaneously,
  all hit the DB at once): mitigate with a short lock/mutex around the
  recompute, or serve stale-while-revalidate, or jitter TTLs so keys don't
  expire in lockstep.
- **Hot key**: one key gets disproportionate traffic and saturates a
  single cache shard. Mitigate with local (in-process) caching in front of
  the distributed cache, or key sharding/replication for that specific
  key.

## Idempotent consumer pattern

Store a processed-message-ID table/set keyed by the message's idempotency
key; before processing, check-and-insert (atomically) — if already present,
skip. Use `INSERT ... ON CONFLICT DO NOTHING` (or equivalent) rather than
a separate check-then-act to avoid a race between concurrent consumers.
