# Definition of Done — Distributed Systems, Messaging & Caching

Work is not done until every applicable item below is true.

- [ ] Delivery semantics for any queue/event involved are stated
      explicitly (at-least-once assumed unless proven otherwise).
- [ ] Every message consumer is idempotent — safe to process the same
      message twice.
- [ ] Dead-letter handling exists for messages that repeatedly fail
      (no silent infinite retry, no silent drop).
- [ ] If caching was added: the reason is stated (what's slow/expensive
      without it), staleness tolerance is stated, and invalidation
      strategy is explicit.
- [ ] Cache-failure behavior is defined — does the system degrade
      gracefully or fail hard if the cache is unavailable?
- [ ] Cache stampede risk is addressed for any high-traffic key (lock,
      jittered TTL, or stale-while-revalidate).
- [ ] Every cross-service call has a timeout and a defined behavior on
      dependency failure (fail fast, fallback, or degrade — stated, not
      implicit).
- [ ] No new distributed transaction introduced where a local
      transaction or the outbox pattern would do.
- [ ] "What happens if this operation happens twice?" is answered for
      every retried operation.
