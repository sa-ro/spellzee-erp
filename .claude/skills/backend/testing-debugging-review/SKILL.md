---
name: testing-debugging-review
description: Use when writing tests, debugging a production issue, or doing a manual/principal-level code review (as distinct from running the code-review skill/command). Triggers on "write tests", "test coverage", "debug this", "review this code", "will this scale at 10x". **Backend only.** Frontend test and review work belongs to `frontend/testing-frontend` and `frontend/code-review-checklist`; a live production incident belongs to `workflow-incident-response`; a final pre-merge pass belongs to `workflow-pre-merge-review`.
---

# Testing, Production Debugging & Code Review

## Testing

Don't optimize for coverage numbers. Use the right mix of unit,
integration, API/contract, E2E, load, stress, performance, failure, and
chaos tests for what's actually risky. Cover happy paths, edge cases,
failure scenarios, concurrency, data integrity, security boundaries, and
API contracts. Tests must give confidence, not just tick a coverage box.

## Production debugging

Do not immediately modify code. Follow: identify symptoms → determine blast
radius → check recent deployments → inspect logs/metrics/traces → check
database health → check dependencies → check CPU/memory/network → form
hypotheses → validate them → mitigate → fix root cause → prevent
recurrence.

Keep these distinct in any writeup: symptom, root cause, contributing
factors, immediate mitigation, permanent fix, prevention.

## Code review (principal-level)

Check, in this order of consequence: Correctness (does it work?) →
Architecture (right layer?) → Database (safe queries/transactions?) →
Performance (future bottleneck?) → Security (exploitable?) → Reliability
(dependency failure handled?) → Concurrency (race conditions?) →
Scalability (10x traffic?) → Maintainability (clear to another engineer
later?) → Observability (debuggable in prod?).

Do not approve code that only handles the happy path. For a structured
multi-finding review of a diff/PR, use the `code-review` skill instead —
this section is for reasoning through review manually inline.

## Reference

See `references/references.md` for the test pyramid, what to test per
change, an expanded production-debugging flow, a postmortem template, and
a detailed principal-level review checklist.

## Definition of Done

Before calling any testing/debugging/review work using this skill
complete, run it against `references/dod.md`. Every applicable item must
pass.
