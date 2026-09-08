# `teacher-hr` — Teacher & HR

**Mostly Phase 3, with a Phase 1 sliver.** Baseline §10–§13.

## Will own

Recruitment, screening, the teacher master profile, availability, training and certification (§11),
observation and quality (§12), performance and incentives, leave, payroll inputs, and capacity
planning (§13).

## The Phase 1 sliver

Certification *workflow* is Phase 3, but **allocation is Phase 1**, and §11 requires an "eligibility
rule preventing unapproved teachers from being allocated". The invariants registry already has
`allocation_requires_certified_teacher` — a trigger reading `teachers.certification_status` on
`class_schedules` insert.

So a teacher row with a certification status must exist in Phase 1, even though nothing here manages
how it gets set. That tension is baseline-internal and is recorded rather than resolved.

## Does not own

Allocation itself — `operations` decides who teaches whom. This module answers *is this teacher
eligible, and what is their capacity*.

## Blocked

- **Teacher/HR minimum for Phase 1** (§30.20) — exactly which teacher attributes Phase 1 needs.
- **Capacity unit** (§30.10) — shared with `operations`; four grains, not four values.
- Incentive formula (§30.13) is Phase 3 and finance-owned. Do not seed it in Phase 1.
