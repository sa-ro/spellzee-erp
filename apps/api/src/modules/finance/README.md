# `finance` — Subscriptions, Payments, the Ledger

**Phase 1 for the ledger; Phase 4 for the controls.** Baseline §16, §21.

The commercial side: what was bought, what it entitles, what has been consumed.

## Owns

- **Subscriptions** — the purchased entitlement (N sessions, validity, credits). Distinct from
  enrollment (academic participation) and payment (one transaction). Never conflate the three.
- **The session ledger** — append-only. This is the module's centre of gravity.
- Payments, credits, refunds, adjustments.
- **Completion forecasting** (§16) — planned vs projected dates, derived from the ledger and
  actual attendance.

## The ledger rule

**There is no `sessions_remaining` column.** Purchased, scheduled, completed, consumed, protected,
compensated and remaining are all derived from ledger rows, each with a `reason`, an `actor_id` and
the `policy_version_id` that decided it.

**Entitlement is consumed per `session_participant`, not per session.** A group class of three
students produces three entries against three different subscriptions, each with its own outcome.

**Corrections are new rows.** Never `UPDATE`, never `DELETE` — not in migrations, seeds, fixtures
or cleanup scripts. A correction is a compensating entry with `reverses_id` set.

This is decision 3 in `/tradeoff-library.md`, whose stated reversal trigger is *"never,
realistically."*

## Does not own

- Sessions and scheduling — `operations` owns those and calls in to consume entitlement.
- Teacher incentives and payroll — `teacher-hr`, Phase 3.

## Invariants

- `ledger_cannot_overdraw` — a trigger, plus `SELECT ... FOR UPDATE` on the subscription row in the
  writing transaction. The trigger alone is racy; it needs a concurrency test with two simultaneous
  transactions.
- `ledger_delta_nonzero`.

## Blocked

**Teacher vs student technical failure** (§30.3) decides the `entry_type` set — whether student-side
failure produces a different entry, and whether a compensation obligation is created automatically.
