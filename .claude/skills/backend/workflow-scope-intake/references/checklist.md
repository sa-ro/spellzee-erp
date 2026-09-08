# Execution Checklist — Scope Intake

One pass per raw ask, in order. Don't skip a step because the ask "seems
simple" — that judgment itself belongs in Step 1, not before it.

## Step 1 — Gather

- [ ] Pain point itself is concrete (a real instance, not just a category).
- [ ] Success criteria stated (a number, behavior, or metric).
- [ ] Scope boundary (MVP vs. end-state) is separated explicitly.
- [ ] Who/how many affected, and urgency, are known.
- [ ] Data sensitivity (PII/payment/auth) is identified.
- [ ] Constraints (timeline, must-integrate-with, off-limits) are known.
- [ ] Existing codebase was actually checked (project-first rule) instead
      of asking the requester implementation questions they can't answer.
- [ ] Anything not answered is carried forward as an explicit, flagged
      assumption — not silently treated as fact.

## Step 2 — Plan

- [ ] Routed to the right depth: `workflow-new-endpoint` /
      `workflow-db-migration` for small well-understood scope,
      `workflow-feature-design` for anything ambiguous or multi-component.
- [ ] Plan stated back to the requester and confirmed before implementation,
      if the change is non-trivial or costly to redo.

## Step 3 — Implement

- [ ] Only the domain skills the plan actually named were touched (scope
      creep, if any, is flagged rather than silent).
- [ ] Every line held to security/performance/scalability/readability as
      it's written (CLAUDE.md standing rule) — not deferred.

## Step 4 — Test

- [ ] Tests cover happy path, edge cases, failure scenarios, and auth
      boundaries.
- [ ] Concurrency-sensitive changes have an actual concurrent test.
- [ ] Tests were actually executed — a run command and its output/result
      exist, not just test files written.

## Step 5 — Review

- [ ] `workflow-pre-merge-review` was run.
- [ ] Every DoD file for every touched skill was checked, with evidence
      per CLAUDE.md's DoD discipline (not just "passed").

## Step 6 — Report

- [ ] What was built and where.
- [ ] Key decisions and why (especially anything built under a flagged
      assumption from Step 1).
- [ ] What was tested and what wasn't — stated honestly.
- [ ] Known risks/trade-offs/follow-ups.
- [ ] What's needed from the requester next, if anything.
- [ ] Report length matches the change's actual size (CLAUDE.md's
      response framework) — not padded, not thin.
