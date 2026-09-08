---
name: workflow-scope-intake
description: The front-door workflow for a raw, unrefined ask — a founder/stakeholder describing a customer pain point or a rough scope, not yet a well-specified ticket. Use whenever the request is a business problem statement rather than a specific technical spec ("customers are complaining about X", "we need something for Y", "can we support Z"). Gathers requirements first, then hands off to planning, implementation, and self-review — never jump straight to code from a raw scope.
---

# Workflow: Scope Intake (raw pain point → shipped, reviewed change)

This is the outer loop. It doesn't replace the other workflows — it
sequences them correctly so nothing gets built on assumptions.

## Step 1 — Gather, don't assume

Before any planning, get enough detail to actually design against. Pull
from `system-architecture`'s core engineering mindset categories, asked
as real questions back to the requester (use `AskUserQuestion` where the
answer genuinely changes the design, don't ask questions you can answer
yourself by reading the code):

- **The pain point itself**: what's actually happening to the customer,
  how often, how are they working around it today. A vague pain point
  ("reports are slow") needs a concrete instance before it's designable.
- **Success criteria**: how do we know this is solved — a number, a
  behavior, a support-ticket category going to zero?
- **Scope boundary**: what's explicitly in and out for a first version.
  Founders often describe the end-state; separate that from the MVP.
- **Who/how many**: which users are affected, roughly how many, is this
  urgent-now or planned work.
- **Data involved**: what data does this touch, any of it sensitive
  (PII, payment, auth) — this determines how much `security-engineering`
  weighs in later.
- **Constraints**: timeline, must integrate with an existing system,
  anything explicitly off the table (budget, a vendor they won't use).
- **Existing system reality**: check the actual codebase yourself
  (project-first rule) rather than asking the founder questions you can
  answer by reading — they usually can't answer implementation-level
  questions anyway.

Do not proceed to planning on a guess for anything that would change the
design. If the requester genuinely doesn't know an answer (e.g. exact
scale), say what assumption you're proceeding with and flag it as an
assumption, not a confirmed fact.

## Step 2 — Plan

Once there's enough to design against, route to the right planning depth:

- Small, well-understood, single-endpoint/single-table scope → skip
  straight to `workflow-new-endpoint` or `workflow-db-migration`.
- Anything ambiguous, multi-component, or with real architectural
  trade-offs → `workflow-feature-design` (Problem → Constraints →
  Options → Trade-offs → Decision → Risks → Mitigation).

State the plan back before implementing anything non-trivial — this is a
decision-cost moment, confirm direction before spending implementation
effort on the wrong shape.

## Step 3 — Implement (production-level)

Build it following whichever domain skills the plan touches
(`database-engineering`, `backend-api-design`, `security-engineering`,
`nodejs-postgres-stack`, etc.), under CLAUDE.md's standing rule: every
line held to security, performance, scalability, and readability as it's
written — not deferred to review.

## Step 4 — Test

Use `testing-debugging-review`: happy path, edge cases, failure scenarios
(dependency timeout/error), auth/permission boundaries, and — if the
change is concurrency-sensitive — an actual concurrent test, not just
sequential assertions. Tests hit a real DB/dependency where they exercise
one; don't mock a dependency into meaninglessness. Actually run the tests
— never report a test as passing without having executed it.

## Step 5 — Review (self, before reporting done)

Run `workflow-pre-merge-review` — the full checklist plus every touched
skill's `references/dod.md`, including `testing-debugging-review`'s DoD
for what was just written in Step 4. Do not skip this because the
implementation "felt" solid; state concretely what passed and what
didn't.

## Step 6 — Report back

Tell the requester, concisely:

- What was built and where (file/endpoint references).
- Key decisions made and why (especially anything decided under an
  assumption from Step 1).
- What was tested, and what wasn't (be honest — don't imply test
  coverage that doesn't exist).
- Known risks, trade-offs, or follow-up work left open.
- What you need from them next, if anything.

Don't over-report on a small change and don't under-report on a
significant one — match the write-up to what CLAUDE.md's response
framework calls for.

## Reference

- `references/checklist.md` — this workflow's 6 steps as a checkbox
  execution list.
- `references/anti-patterns.md` — 7 process failure modes (jumping to
  code, hiding assumptions, quizzing the requester on implementation
  details, skipping plan confirmation, unrun tests, unchecked DoD,
  mismatched report size).
- `references/examples/good-vs-bad-intake.md` — a worked comparison of
  handling the same raw ask badly vs. correctly.
- `references/dod.md` — binary completion criteria for this workflow.

## Definition of Done

Before reporting any scope-intake-driven change complete, run it against
`references/dod.md`. Every applicable item must pass.
