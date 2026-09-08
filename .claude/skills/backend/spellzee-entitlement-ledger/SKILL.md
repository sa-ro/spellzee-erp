---
name: spellzee-entitlement-ledger
description: Use for anything touching session entitlement, credits, or balances — consuming a session, protecting a credit on advance cancellation, compensation sessions, refunds, adjustments, or displaying "sessions remaining". Enforces the append-only ledger with derived counts and no stored balance column. Triggers on "sessions remaining", "balance", "credit", "consume", "entitlement", "compensation", "refund", "adjustment", "ledger", "subscription balance".
---

# Spellzee Entitlement Ledger — entitlement is currency

**The rule:** there is **no `sessions_remaining` column**. Every count —
purchased, scheduled, completed, consumed, protected, compensated,
remaining — is **derived from append-only ledger rows**.

This is decision 3 in `/tradeoff-library.md`, and the one to defend hardest.
Its reversal trigger reads: *"Never, realistically. This one is close to
unconditional."*

## Why

Entitlement is currency. A parent paid for 20 sessions; what they have left
is a financial fact, not a cached number. Retroactive corrections must be
**reconstructible** — when a coordinator asks "why does this student have 7
left and not 8," the answer must be a list of events with reasons and
actors, not a column someone overwrote.

A stored balance has exactly one advantage (a cheaper read) and several fatal
failure modes: a lost update under concurrency, a drift nobody notices for
weeks, and no way to answer *why*. What was sacrificed: query complexity and
more code. That trade was made deliberately.

## The shape

Every movement is a row. Rows are **never updated and never deleted**.

```sql
CREATE TABLE session_ledger (
  id              BIGSERIAL PRIMARY KEY,
  subscription_id UUID        NOT NULL REFERENCES subscriptions(id),
  session_id      UUID        REFERENCES sessions(id),
  entry_type      TEXT        NOT NULL,
  delta           INT         NOT NULL,
  reason          TEXT        NOT NULL,
  policy_version_id UUID      REFERENCES policy_versions(id),
  actor_id        UUID        NOT NULL,
  reverses_id     BIGINT      REFERENCES session_ledger(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ledger_delta_nonzero CHECK (delta <> 0)
);
```

Entry types map directly to the requirements baseline's session outcomes:
`purchase`, `consume`, `protect`, `compensation_grant`,
`compensation_consume`, `refund`, `adjustment`, `expiry`, `reversal`.

Four fields carry the weight:

- **`reason`** — never optional. "Why does this student have 7 left" is
  answered from this column.
- **`actor_id`** — who caused it. System actions get a system actor, not null.
- **`policy_version_id`** — which policy version judged this movement. A late
  cancellation from March is judged by March's cutoff rule, not today's.
  See `spellzee-policy-versioning`.
- **`reverses_id`** — corrections are **new compensating rows** pointing at
  what they reverse. Never an `UPDATE`, never a `DELETE`.

## Deriving the balance

```sql
SELECT
  s.sessions_purchased,
  COALESCE(SUM(l.delta) FILTER (WHERE l.entry_type = 'consume'), 0)  AS consumed,
  COALESCE(SUM(l.delta) FILTER (WHERE l.entry_type = 'protect'), 0)  AS protected,
  s.sessions_purchased + COALESCE(SUM(l.delta), 0)                   AS remaining
FROM subscriptions s
LEFT JOIN session_ledger l ON l.subscription_id = s.id
WHERE s.id = $1
GROUP BY s.id;
```

Sign convention: purchases positive, consumption negative. Pick one, encode
it in a `CHECK`, and never let both conventions coexist.

If this becomes genuinely slow — measure first — the sanctioned escalation
is a **materialized view or a periodic snapshot row that can always be
rebuilt from the ledger**. Never a mutable column that becomes a second
source of truth.

## Concurrency

Two concurrent writes can each read a pre-write balance and both succeed,
overdrawing the entitlement. The `ledger_cannot_overdraw` trigger (see
`spellzee-invariants`) is necessary but **not sufficient on its own**.

Inside the writing transaction, take a lock on the parent subscription:

```ts
await tx.$executeRaw`SELECT id FROM subscriptions WHERE id = ${id} FOR UPDATE`;
```

Then compute, then insert. Test it with two genuinely concurrent
transactions — this is the case a single-threaded test will never catch.

## Policy interactions

- **Advance cancellation past the cutoff** → a `protect` entry; the credit
  survives.
- **Late cancellation** → a `consume` entry, or an exception per policy.
- **Teacher/Spellzee-side failure** → entitlement is protected **and** a
  compensation session is granted.
- **Compensation is a separate session** and never mutates the recurring
  schedule. Its grant and its consumption are two distinct entries.

Every one of those cutoffs and limits is a **versioned policy row**, never a
constant in code.

## Anti-patterns

- A `sessions_remaining` column. This is the erosion, in its most tempting
  form — it will be proposed as "just a cache" or "just for the dashboard."
- `UPDATE session_ledger SET ...` — corrections are new rows.
- `DELETE FROM session_ledger` — never, including in cleanup scripts.
- Computing a balance in TypeScript by fetching all rows, then writing it
  back somewhere.
- A ledger entry without a `reason` or an `actor_id`.
- Hard-coding a cancellation cutoff instead of reading the policy version.
- Storing the balance in Redis. Redis is allowed to lose everything; the
  balance is truth.

## Definition of Done

Run `references/dod.md` before calling any entitlement work complete.
