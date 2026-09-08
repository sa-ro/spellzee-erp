---
name: workflow-pre-merge-review
description: Final review pass before calling a change done or ready to merge — runs the full principal-engineer checklist across correctness, database, security, performance, reliability, and observability. Use when asked "is this ready", "review before merge", "double check this change", or as a self-check before reporting any non-trivial change complete.
---

# Workflow: Pre-Merge Review

Run this as a single pass over the actual diff/change, not a generic
essay. For each item, give a concrete yes/no/concern — not a restatement
of the checklist item itself.

## Checklist

Pull the detailed version from `testing-debugging-review`'s reference if
needed, but at minimum answer:

1. **Correctness** — does it handle the stated requirement, including the
   edge cases (empty input, boundary values, concurrent identical
   requests)?
2. **Architecture** — is the logic in the right layer? Does it follow
   existing project patterns rather than inventing new ones?
3. **Database** — are queries indexed appropriately? Is there an N+1?
   Is the transaction boundary correct? (`database-engineering`)
4. **Security** — any injection, missing authZ/IDOR, secret/PII
   exposure in logs or responses? (`security-engineering`)
5. **Performance** — any unbounded query/loop, anything that degrades
   badly with 10x the data or traffic? (`performance-scalability`)
6. **Reliability** — what happens when each external call this touches
   fails or times out? Are retries idempotent-safe?
   (`reliability-observability`)
7. **Observability** — can a production issue in this change be
   diagnosed from logs/metrics/traces alone?
8. **Testing** — do tests cover the happy path, failure scenarios, and
   (if relevant) concurrency — not just the happy path?
9. **Operational** — can this be deployed and rolled back safely? Any
   migration ordering concern? (`workflow-db-migration` if a migration is
   involved)
10. **Cost/complexity** — is any added abstraction, dependency, or
    infrastructure actually justified by this change's requirements?

## Spellzee erosion check (run this first — it is the cheapest and catches the worst)

These five reversals look reasonable in a diff and are only expensive later.
Any "yes" is an architecture decision, not an implementation detail — stop
and raise it explicitly against `/tradeoff-library.md`.

1. Does this enforce a cross-row rule in **service code** instead of a
   database constraint? (`spellzee-invariants`)
2. Does this call a third party **inside a request handler**, or treat a
   queue job rather than an outbox row as the commitment?
   (`spellzee-outbox-merithub`)
3. Does this add a **stored balance column** or `UPDATE`/`DELETE` a ledger
   row? (`spellzee-entitlement-ledger`)
4. Does this **hard-code a business threshold**, or start building a rule
   engine? (`spellzee-policy-versioning`)
5. Does this introduce a **cache in front of a domain read**, a
   reconciliation job, or a second source of truth?
   (`distributed-systems-caching`, Spellzee posture)

Also check: does it call **Merithub DELETE**? Do **workers still run
always-on**, not scale-to-zero?

## Definition of Done gate

A change is not done until it passes the DoD of every domain skill it
actually touched — check the applicable ones directly:

- `spellzee-invariants/references/dod.md` (any schema/constraint change)
- `spellzee-outbox-merithub/references/dod.md` (any external boundary)
- `spellzee-entitlement-ledger/references/dod.md` (any entitlement/credit)
- `spellzee-policy-versioning/references/dod.md` (any tunable threshold)

- `system-architecture/references/dod.md`
- `backend-api-design/references/dod.md`
- `database-engineering/references/dod.md`
- `distributed-systems-caching/references/dod.md`
- `performance-scalability/references/dod.md`
- `security-engineering/references/dod.md`
- `reliability-observability/references/dod.md`
- `testing-debugging-review/references/dod.md`
- `infra-cost-ai-backend/references/dod.md`
- `nodejs-postgres-stack/references/dod.md`
- `edtech-domain/references/dod.md` — check this one whenever student
  data, courses, assessments, grading, or guardian/institution access is
  touched; it's easy to forget since it's product-specific, not generic.

Skip a DoD only if the skill it belongs to genuinely never fired for this
change (e.g. no caching touched → skip the distributed-systems-caching
DoD) — don't skip one that applies just because it's inconvenient.

## Output

State findings as a short list: what's solid, what's a real concern
(with the concrete failure scenario, not just "consider handling this
better"), and what's optional/nice-to-have. List which DoD items failed,
by skill. Don't approve a change that only handles the happy path, and
don't report something done while a relevant DoD item is unchecked.

Per CLAUDE.md's DoD discipline: every passed item needs its evidence
stated alongside it (what was run/checked, not just "passed"). An item
with no evidence is unverified, not passed — report it as unverified.
