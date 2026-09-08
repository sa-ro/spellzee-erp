---
name: spellzee-outbox-merithub
description: Use for anything crossing the boundary to a third party — Merithub (LMS/classroom), FreeJump (calls), the future WhatsApp provider. Covers the transactional outbox, the deduplicating inbox, the four-state provisioning machine and its stall queue, webhook-plus-reconciliation-poll, and the never-call-upstream-DELETE rule. Triggers on "merithub", "webhook", "outbox", "external API", "third party", "integration", "sync", "provision", "class creation", "stalled", "retry", "reconcile".
---

# Spellzee Integration Edge — outbox, inbox, and the stall queue

This is the **only** place in the system where consistency is eventual.
Everything inside the database is strongly consistent by design; everything
spanning our database and a third party is eventually consistent whether we
acknowledge it or not. The job of this skill is to make that boundary
explicit rather than accidental.

## What forces the pattern

Merithub — the live classroom/LMS — has **no idempotency keys, no webhook
signatures, and no retry guarantee**. That is not a detail; it is the reason
every rule below exists. A provider that shipped real idempotency and
delivery guarantees would be the reversal trigger for most of this
(decision 4 in `/tradeoff-library.md`).

## Rule 1 — never call a third party inside a request handler

Your availability is the product of everything in your critical path. A
third party in the request path donates its outage to you.

The write path is always:

```
BEGIN
  authorize
  write the domain change
  write the audit record
  INSERT INTO outbox (...)
COMMIT
-- a worker drains the outbox afterwards
```

**The outbox row is the commitment. The queue job is only a trigger.**
Redis is allowed to lose every job — the outbox row is still there to be
re-enqueued. That inversion is what makes a Redis-backed queue safe for
money-adjacent work.

Never enqueue from inside the transaction and treat the enqueue as the
record. Never write the outbox row in a second transaction.

## Rule 2 — allocate locally, provision asynchronously

A coordinator's allocation completes against our database **immediately**.
The upstream class is created later, by a worker.

The four states:

| State | Meaning |
|---|---|
| `pending` | Allocated locally; nothing sent upstream yet |
| `provisioning` | Worker is attempting creation upstream |
| `provisioned` | Upstream class exists; external ID stored |
| `stalled` | Repeated failure; needs human attention |

`class_creation_pending` is not workflow noise — it is the
eventual-consistency seam made visible. A system that hides the seam has the
same inconsistency and no vocabulary for it.

**The stall queue is a product surface, not just monitoring.** It needs a
screen, an owner, and an answer to "what is happening right now." That is
the price of async: it converts a latency problem into a state-management
problem, and every async operation owes a status, a retry policy, a
dead-letter path and a UI.

Reversal trigger: stalls becoming frequent enough that a human cannot
supervise them daily. The answer then is auto-remediation — not another
dashboard.

## Rule 3 — never call upstream DELETE

Merithub's delete is **irreversible and destroys attendance records and
recordings**. Local cancellation does not mirror upstream as a delete.

Orphaned upstream objects accumulating is the accepted, deliberate cost.
Reversal trigger: the provider adding a soft-delete or archive operation.

If a diff introduces a `DELETE` call to Merithub, that is an architecture
reversal, not an implementation choice.

## Rule 4 — webhook fast path, reconciliation poll as the safety net

The upstream has no retry guarantee, so webhook-only silently loses events.
Polling-only is wasteful. Do both:

- **Webhook** — the fast path. Because there are no signatures, validate
  what you can (shared secret in the path, IP allowlist, and above all
  **verify the payload against our own record** rather than trusting it).
- **Reconciliation poll** — low frequency. Its job is not freshness; it is
  **detecting the events that were silently dropped**.

## Rule 5 — the inbox deduplicates

Assume every inbound event can arrive more than once, out of order, or never.

Write inbound events to an `inbox` table with a unique key derived from the
event (provider event id where available; otherwise a deterministic hash of
type + external id + occurred-at). Process from the inbox, and make the
handler idempotent so replaying it is harmless.

Never let an inbound event silently overwrite a critical Spellzee record.
External IDs map to Spellzee IDs; Spellzee owns its own identifiers.

## Rule 6 — workers must not scale to zero

A queue consumer inside a scale-to-zero service **stops draining when
traffic stops, and fails silently rather than loudly**. This is the single
most common way an outbox pattern quietly stops working.

- Workers run as a **separate always-on service**, minimum instances ≥ 1.
- **Alert on outbox rows older than a threshold.** That alert is the actual
  proof the pattern is alive — not the absence of errors.

## Retries

Exponential backoff with jitter, capped attempts, then `stalled` — not
infinite retry. Distinguish retryable (5xx, timeout, connection reset) from
non-retryable (4xx validation, auth) — retrying a 400 forever just fills the
queue. Since upstream has no idempotency keys, **check whether the object
already exists before recreating it** on retry; that check is our substitute
for their missing guarantee.

## Anti-patterns

- `await merithub.createClass()` inside a controller.
- Enqueueing a BullMQ job and treating that as durable.
- Trusting a webhook payload as truth without checking it against our record.
- Mirroring a local cancellation as an upstream delete.
- Workers deployed in the same scale-to-zero service as the API.
- A stall queue with no screen and no owner.
- Adding a saga or distributed transaction — a single Postgres transaction
  plus the outbox covers this. See `distributed-systems-caching`.

## Definition of Done

Run `references/dod.md` before calling any integration work complete.
See `references/patterns.md` for the outbox/inbox table shapes and the
worker loop.
