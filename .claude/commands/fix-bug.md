---
description: Bug-fix workflow — diagnose, fix, regression test, and error-observability check, chained in one command.
argument-hint: [bug description, error message, or repro steps]
---

# Fix Bug — Combined Workflow

You are running the bug-fix workflow for this project. The reported issue: $ARGUMENTS

This workflow starts from a symptom, not a design or a feature spec — the order and emphasis are different from `/ship-feature`. Work through the phases below **in order**. Announce which phase you're entering before starting it.

## Phase 0 — Which half of the stack?

Decide before diagnosing, because the skills and the risks are different.

- **Frontend** (rendering, state, forms, a screen behaving wrong) → `.claude/skills/frontend/`, and follow the phases below as written.
- **Backend** (a wrong number, a failed integration, a stuck record, a constraint violation, a slow query) → `.claude/skills/backend/`, and read the **Backend bugs** section below before Phase 2.
- **Unclear** → diagnose first. A wrong total on a screen is usually a backend bug surfacing in the UI. Fixing it in the frontend is how a display patch hides a data-integrity fault.

If it is production and users are affected right now, use `workflow-incident-response` instead — mitigate first, root-cause after.

## Backend bugs — read this before fixing

The bugs that matter most in this system cluster in four places. Each has an owning skill, and in each the tempting quick fix **is** the architecture erosion:

| Symptom | Skill | The tempting wrong fix |
|---|---|---|
| A balance is wrong; entitlement doesn't reconcile | `spellzee-entitlement-ledger` | `UPDATE` the ledger row, or add a corrected total column |
| Class never created upstream; row stuck `pending`/`provisioning` | `spellzee-outbox-merithub` | Call Merithub directly to "just fix this one" |
| Duplicate/overlapping rows that should be impossible | `spellzee-invariants` | Add a check in the service instead of a constraint |
| A rule applied the wrong threshold | `spellzee-policy-versioning` | Hard-code the right number |

Two rules specific to fixing bugs here:

1. **A correction is a new row, not an edit.** Ledger entries, audit records and policy versions are append-only. Fixing bad data means a compensating entry with a `reason`, never an `UPDATE` or `DELETE`.
2. **If the invariant had been in the database, this bug could not exist.** When a bug is a violated invariant, the fix is the missing constraint plus a data cleanup — not only the cleanup. Route it through `schema-architect`, which carries the schema approval gate.

Before any data-repair script touches production rows, show it to the user first. It is unreviewed, unversioned, and irreversible.

## Phase 1 — Diagnose (always runs, always first)

Before touching any code, establish the actual root cause — not just the symptom.

1. Reproduce the bug if possible (read the relevant code path, check logs/error reports if available, or ask the user for exact repro steps if the description is too vague to act on).
2. Identify which skill(s) govern the area the bug lives in. **Frontend** (`.claude/skills/frontend/`): a stale-state bug points at `state-management`, a form silently losing data at `form-handling-validation`, a video stall at `video-player-architecture`. **Backend** (`.claude/skills/backend/`): use the symptom table above, plus `database-engineering` for a slow query, lock or deadlock, and `distributed-systems-caching` for a delivery or duplicate-message issue. Read that skill's rules for what the current code may be violating — a bug is very often an existing rule not being followed, not a novel problem needing a novel fix.
3. If the bug was originally caught via a monitoring tool, apply `error-observability`'s Rule 9 (breadcrumbs) — reconstruct what the user was doing when it happened, don't fix blind from a bare stack trace.
4. State the root cause explicitly before proceeding to Phase 2 — if you can't state it in one or two sentences, keep diagnosing rather than guessing at a fix.

## Phase 2 — Fix (always runs)

1. Apply the minimal fix that addresses the actual root cause identified in Phase 1 — not a broader refactor, not a defensive rewrite of surrounding code that wasn't implicated.
2. If the root cause was a violated rule from a specific skill, bring that specific area back into compliance with that skill's rule — don't invent a bespoke fix that solves this one symptom while leaving the underlying pattern (and its risk of recurring elsewhere) unaddressed.
3. If the fix touches a genuinely different area than where the bug was reported (e.g. the real cause was a missing server-side check, not the UI symptom where it was noticed), say so explicitly rather than silently patching in an unrelated place.

## Phase 3 — Regression Test (always runs)

1. Invoke the `testing-frontend` skill. Write a test that fails on the pre-fix code and passes after the fix — this is what actually proves the bug is fixed and prevents it silently coming back.
2. Prefer a test at the level the bug actually manifested (a behavior-level RTL test for a UI bug, an integration/E2E test for a cross-component or flow-level bug) — per `testing-frontend`'s Testing Trophy priorities, not reflexively a unit test if the bug was about how pieces interact.
3. If the bug was in a shared/reusable piece (a hook, a utility, a component used in multiple places), check whether other call sites have the same latent issue — a rule violation in one place is often present in siblings that happened not to be reported yet.

**Backend:** use `testing-debugging-review` and `nodejs-postgres-stack` instead of `testing-frontend`. The regression test runs against **real PostgreSQL**, never a mocked repository. If the bug was a violated invariant, the test is a **constraint test** — attempt the violation, assert the database rejects it. If it was a race, the test needs two genuinely concurrent transactions; a single-threaded test will never reproduce it.

## Phase 3b — Erosion check (backend fixes only)

Bug fixes are where architecture quietly erodes. The pressure is real: something is broken, a constraint or an outbox is in the way, and the fastest path around it looks harmless.

Run `erosion-auditor` over the fix, or check its list yourself for a small one. Specifically:

- Did the fix move an invariant out of the database into service code?
- Did it call a third party directly to work around a stalled outbox row?
- Did it `UPDATE` or `DELETE` a ledger row instead of appending a correction?
- Did it hard-code a threshold that should be a policy version?
- Did it drop or weaken a constraint to make the failing case pass?

Any of those is an architecture reversal. **Stop and report it** — do not decide on the user's behalf that the bug justified it.

## Phase 4 — Error-Observability Check (always runs, always last)

This phase does not fix anything further — it verifies the bug class is actually visible next time, and closes the loop with monitoring.

1. Confirm (or add, if missing) error capture per `error-observability`'s rules for the code path involved — if this bug reached production before anyone noticed, that's itself a gap worth flagging, not just the bug.
2. If the bug was already visible in the monitoring tool, note in the fix's description/commit which alert/issue this resolves, so it can be marked resolved and grouping stays accurate (per `error-observability` Rule 13).
3. Report a short summary: root cause, what changed, what test now guards it, and whether observability for this class of failure was already adequate or was improved as part of this fix.

## Notes
- This command exists to sequence the skill library for the bug-fix scenario specifically — the actual rules/rationale live in each skill's own files. This command's job is ordering and gating, not restating content.
- If the fix is trivial and the root cause is obvious (a typo, an off-by-one), it's fine to move through Phases 1-2 quickly — but Phase 3 (regression test) and Phase 4 (observability check) are not optional just because the fix was small; small bugs recur just as easily as big ones without a test.
