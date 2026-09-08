# Definition of Done — policy work

Every applicable item must pass before the work is called complete.

## Placement

- [ ] No tunable business value is hard-coded as a constant in this change.
- [ ] No business rule was put in an environment variable (env vars are
      deployment config — no history, no effective date, no reason, not
      auditable).
- [ ] The policy has a stable, namespaced `policy_key`
      (`cancellation.cutoff_hours`, not `cutoff`).

## Versioning

- [ ] Rows are superseded, never edited. A change closes the current version
      and inserts a new one **in one transaction**.
- [ ] `effective_from` is set deliberately; overlapping versions of the same
      key are impossible (the `policy_no_overlap` exclusion constraint is in
      place and was not dropped).
- [ ] `created_by` and `reason` are populated — a policy change is an audited
      business action.

## Reading

- [ ] Every read is **as of a time**, never "the current value," when judging
      an event that already happened.
- [ ] Where a policy decided an outcome, the resulting record stores the
      `policy_version_id` that decided it.
- [ ] A historical replay produces the same answer it produced originally,
      even after the policy has since changed. There is a test for this.

## Open decisions

- [ ] If the real value is not yet decided by the business, the row carries a
      clearly-marked placeholder and a `reason` saying so — it was not
      silently guessed.
- [ ] The open decision was surfaced to the user, not buried in a seed file.

## Rule-engine check

- [ ] This change did not introduce a condition/action builder, a DSL, a
      user-editable expression evaluator, or a generic "rules" table with
      operators in it.
- [ ] If a request genuinely needs that, it was **named as a reversal of
      decision 5** in `/tradeoff-library.md` and raised explicitly — with its
      trigger (multi-tenant white-labelling, or weekly policy churn) checked
      against reality — rather than being built incrementally under another
      name.

## Tests

- [ ] A test proves two overlapping versions of the same key are rejected by
      the database.
- [ ] A test proves an event is judged by the policy in force at its own
      timestamp, not the latest one.
- [ ] Tests run against real PostgreSQL.
