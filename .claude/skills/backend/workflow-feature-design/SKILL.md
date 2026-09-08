---
name: workflow-feature-design
description: Workflow for designing a significant new feature or system before writing code — bigger than a single endpoint (a new subsystem, a new service, a major schema change, an architecture decision with real trade-offs). Use when asked to design/plan/architect something, or when a request is ambiguous/large enough that jumping to code would be premature. Not for small, well-understood changes — those should go straight to the relevant domain skill.
---

# Workflow: Significant Feature / System Design

Run the decision process from CLAUDE.md before proposing an
implementation:

## 1. Problem

What are we actually solving? State the business/functional requirement
in one or two sentences — if it's ambiguous, that's worth surfacing before
designing around a guess.

## 2. Constraints

Existing architecture, existing data model, team size/ops maturity,
timeline, budget, backward-compatibility requirements.

## 3. Non-functional requirements

Expected traffic, concurrency, latency target, availability target,
consistency requirement, security sensitivity, cost ceiling. Pull in
`performance-scalability`'s capacity-estimation approach if traffic
numbers matter to the decision.

## 4. Options

At least two real options, not a strawman vs. the preferred answer. Use
`system-architecture`'s pattern-selection table to check whether this
genuinely needs microservices/CQRS/event sourcing/etc., or whether a
simpler modular-monolith approach covers the actual requirement.

## 5. Trade-offs

For each option: what it improves, what it costs (complexity, latency,
consistency, ops burden, cost). Be concrete, not hand-wavy.

## 6. Decision

State the recommended option and why, in terms of the constraints and
non-functional requirements from steps 2–3 — not "because it's popular."

## 7. Risks and mitigation

What could fail with this decision, and what reduces that risk? Pull in
the relevant domain skill for specifics — `distributed-systems-caching`
for consistency/delivery risk, `security-engineering` for attack surface,
`reliability-observability` for failure-mode risk.

## 8. Write the design

Use `system-architecture`'s system-design write-up skeleton (Requirements
→ Constraints → Capacity estimate → API sketch → Data model → Components/
data flow → Scaling strategy → Consistency/availability trade-off →
Failure modes/DR → Cost estimate) — include only the sections that matter
for this feature's actual size; don't pad a small feature with the full
skeleton.

## 9. Confirm before building

If this is a genuinely significant/costly direction (new service, major
schema change, new infra dependency), surface the recommendation and
trade-offs to the user before implementing — this is a decision-cost
situation, not a routine one.
