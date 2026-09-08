# Definition of Done — integration edge

Every applicable item must pass before the work is called complete.

## Outbound

- [ ] No third-party call happens inside a request handler.
- [ ] The domain change, the audit record and the outbox row are written in
      **one transaction**.
- [ ] The queue enqueue happens **after** commit, and losing it is harmless
      because the sweeper will pick the row up.
- [ ] A periodic sweeper exists that re-enqueues `pending` rows past their
      `next_attempt_at` — the system recovers from a full Redis loss.
- [ ] Retries use exponential backoff with jitter and a capped attempt count,
      ending in `stalled` rather than retrying forever.
- [ ] Retryable and non-retryable failures are distinguished (a 400 is not
      retried).
- [ ] Because upstream has no idempotency keys, retry checks whether the
      object already exists before creating it again.
- [ ] Workers claim rows with `FOR UPDATE SKIP LOCKED` (safe with multiple
      workers).

## Inbound

- [ ] Inbound events land in the `inbox` with a dedupe key under a unique
      constraint; duplicate delivery is a no-op.
- [ ] The webhook handler returns 200 fast and processes asynchronously.
- [ ] The payload is **verified against our own record**, not trusted — there
      are no signatures on this provider.
- [ ] The handler is idempotent: replaying the same event changes nothing.
- [ ] No inbound event overwrites a Spellzee-owned field. External IDs map to
      Spellzee IDs, not the reverse.

## The seam

- [ ] The provisioning state is explicit in the domain model
      (`pending`/`provisioning`/`provisioned`/`stalled`), not inferred from a
      null external id.
- [ ] The user-facing workflow does not block on the third party.
- [ ] `stalled` items have a screen, an owner, and a retry action — not just
      a log line.
- [ ] There is an alert on outbox rows older than a threshold, **and** on
      rows stuck in `provisioning` (a dead worker produces no errors).

## Deployment

- [ ] Workers run as a **separate always-on service** with minimum instances
      ≥ 1 — never inside a scale-to-zero service.
- [ ] Timeouts are set explicitly on every outbound call.

## Hard rules

- [ ] **No upstream DELETE call.** If the change introduces one, stop: that
      is an architecture reversal requiring the trigger in
      `/tradeoff-library.md` (decision 7) to have actually fired.
- [ ] No saga, distributed lock, or distributed transaction was introduced
      where one Postgres transaction plus the outbox covers the requirement.

## Tests

- [ ] A test proves the outbox row is written in the same transaction as the
      domain change — i.e. a failure after the domain write rolls both back.
- [ ] A test proves duplicate inbound delivery is a no-op.
- [ ] A test proves a failed upstream call leaves the row retryable rather
      than losing it.
- [ ] Tests run against real PostgreSQL, per `spellzee-invariants`.
