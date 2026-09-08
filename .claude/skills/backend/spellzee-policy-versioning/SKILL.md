---
name: spellzee-policy-versioning
description: Use whenever a business rule has a tunable number or threshold — cancellation cutoffs, reschedule limits, SLA targets, reminder timings, compensation validity, incentive bands, retention triggers, utilization targets. Enforces effective-dated versioned policy rows over both hard-coded constants and a configurable rule engine. Triggers on "configurable", "cutoff", "threshold", "SLA", "limit", "policy", "make this adjustable", "business rule", "48 hours", "every three sessions", "rule engine".
---

# Spellzee Policy Versioning — configurable data, not a rule engine

**The rule:** a tunable business value is an **effective-dated row in the
database**. Not a constant in code, and not a rule engine.

This sits between two failure modes, and the skill exists because both are
tempting.

## Failure mode 1 — hard-coding

The requirements baseline says the cancellation cutoff, SLA target,
reschedule maximum, compensation validity and incentive thresholds are all
**configurable business policy**, and lists most of them as still-open
decisions (§30). A constant in code makes an unresolved business question
look like a settled engineering fact, and changing it later silently
rewrites history — every past session gets re-judged by today's rule.

## Failure mode 2 — the rule engine

This is decision 5 in `/tradeoff-library.md`, and the note there is blunt:
it is *"the one most likely to be argued against internally, and worth
writing the ADR for first — the pressure to build a rule engine always
arrives as a reasonable-sounding request."*

**One tenant does not need a rule builder.** A rule engine here is a private
programming language with no debugger, no type checker, no tests and no
version control. What was sacrificed by rejecting it: non-developers cannot
change rules without a deploy. That was accepted knowingly.

**Reversal trigger:** multi-tenant white-labelling, or policy changes
becoming a weekly occurrence. Until one of those is observably true, the
answer to "can we make this configurable?" is a versioned row — not a
builder UI.

When the third "just make this configurable" request arrives, that is the
signal to revisit the decision **explicitly**, not to quietly start building
an engine.

## The shape

```sql
CREATE TABLE policy_versions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_key     TEXT        NOT NULL,   -- 'cancellation.cutoff_hours'
  value          JSONB       NOT NULL,
  effective_from TIMESTAMPTZ NOT NULL,
  effective_to   TIMESTAMPTZ,
  created_by     UUID        NOT NULL,
  reason         TEXT        NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- exactly one version of a policy in force at any instant
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE policy_versions
  ADD CONSTRAINT policy_no_overlap
  EXCLUDE USING gist (
    policy_key WITH =,
    tstzrange(effective_from, effective_to, '[)') WITH &&
  );
```

That exclusion constraint is the whole point: two overlapping versions of the
same policy would make "which rule applied?" unanswerable. See
`spellzee-invariants`.

Rows are **never edited**. Changing a policy closes the current version
(`effective_to = now()`) and inserts a new one, in one transaction.

## Reading a policy — always as of a time

```ts
async function policyAsOf(key: string, at: Date, tx = prisma) {
  return tx.policyVersion.findFirst({
    where: {
      policyKey: key,
      effectiveFrom: { lte: at },
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: at } }],
    },
  });
}
```

**Never read "the current policy" when judging a past event.** A session
cancelled in March is judged by March's cutoff. Getting this wrong means a
policy change retroactively rewrites entitlement history — precisely what
the append-only ledger exists to prevent.

When a policy decides an outcome, **store the `policy_version_id` on the
resulting record** (see `spellzee-entitlement-ledger`). That makes the
decision reconstructible without re-running the lookup.

## The policies this project already knows about

From the requirements baseline. Most values are **open decisions** — model
the key with a flagged placeholder rather than inventing a number.

| Key | Baseline reference |
|---|---|
| `cancellation.cutoff_hours` | §15.3 — open |
| `cancellation.late_consumes_credit` | §15.3 — open |
| `reminder.offsets_hours` | §15.2 — configurable, e.g. several hours before + closer to start |
| `reschedule.max_per_subscription` | §15.6 — open |
| `compensation.validity_days` | §15.6 — open |
| `completion.max_extension_days` | §15.6 — open |
| `absence.escalation_threshold` | §15.6 — open |
| `sla.ticket_resolution_hours` | §20.3 — discussed as 48h, not final |
| `sla.allocation_target_hours` | §30 — open |
| `retention.session_interval_trigger` | §20.4 — e.g. every 3 sessions, configurable |
| `duplicate.match_confidence_threshold` | §30 — open |
| `capacity.unit` | §30 — open (hours/minutes/sessions/weighted slots) |
| `capacity.target_utilization_range` | §13.5 — open, deliberately not 100% |
| `incentive.bands` | §12.2 — open |

## Placeholders for open decisions

When a value is genuinely undecided, do **not** guess silently:

- Insert the policy row with a clearly-marked placeholder value.
- Set `reason` to say it is a placeholder awaiting a business decision.
- Surface it — it belongs on the open-decisions list, not buried in a seed.

This is what `/CLAUDE.md` means by "do not hard-code a guess as though it
were decided."

## Anti-patterns

- `const CANCELLATION_CUTOFF_HOURS = 24;`
- A `.env` variable for a business rule. Env vars are deployment config, not
  auditable business policy — no history, no effective date, no reason.
- `UPDATE policy_versions SET value = ...` — supersede, never edit.
- Reading the current policy to judge a historical event.
- A generic condition/action builder, a DSL, or user-editable expressions.
  That is the rule engine, arriving in disguise.
- A policy row whose value silently differs from what the UI displays to
  staff.

## Definition of Done

Run `references/dod.md` before calling any policy work complete.
