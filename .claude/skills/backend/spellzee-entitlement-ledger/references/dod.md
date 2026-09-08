# Definition of Done — entitlement & ledger work

Every applicable item must pass before the work is called complete.

## Shape

- [ ] No stored balance column was added. No `sessions_remaining`, no
      `credits_left`, no "just a cache" denormalization.
- [ ] Every balance shown or acted on is **derived** from ledger rows.
- [ ] Every movement is a new row. No `UPDATE` and no `DELETE` on
      `session_ledger` anywhere in the change, including seeds, fixtures and
      cleanup scripts.
- [ ] A correction is a **compensating row** with `reverses_id` set — not an
      edit of the original.

## Required fields

- [ ] `reason` is populated with something a coordinator could actually read.
      Not `'adjustment'` alone.
- [ ] `actor_id` is set — a system actor for automated entries, never null.
- [ ] `policy_version_id` is set wherever a policy decided the outcome
      (cancellation, compensation, expiry).
- [ ] `entry_type` is from the agreed set; the sign convention matches the
      rest of the table.

## Correctness

- [ ] The write happens inside the same transaction as the domain change
      (session status, cancellation, etc.) — never in a follow-up call.
- [ ] The parent subscription row is locked (`FOR UPDATE`) before computing
      and inserting, or an equivalent isolation level is used.
- [ ] The `ledger_cannot_overdraw` trigger covers this path, and it was not
      dropped or bypassed.
- [ ] Compensation grant and compensation consumption are **two distinct
      entries**, and the compensation session did not modify the recurring
      schedule.

## Tests

- [ ] Balance derivation is tested against a ledger with a mixed history —
      purchase, consume, protect, compensation, reversal — not just a fresh
      subscription.
- [ ] A **concurrency test** with two simultaneous transactions proves the
      entitlement cannot be overdrawn.
- [ ] A reversal test proves the original row is untouched and the balance
      reflects the correction.
- [ ] Tests run against real PostgreSQL.

## Policy

- [ ] No cutoff, limit, validity window or threshold is hard-coded in this
      change. Each is read from a versioned policy row
      (`spellzee-policy-versioning`).
- [ ] A historical entry is judged by the policy version in force **when it
      happened**, not by the current one.

## Erosion check

- [ ] If this change was hard because the ledger made a read expensive: the
      cost was actually measured, and the response is a rebuildable
      materialized view or snapshot — never a mutable balance column.
      Anything else is reversing decision 3 in `/tradeoff-library.md`, whose
      stated reversal trigger is "never, realistically."
