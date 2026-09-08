---
name: workflow-incident-response
description: Step-by-step workflow for responding to a live production issue or investigating a reported bug/outage. Use when told something is broken in production, users are affected right now, error rates/latency spiked, or asked to debug an incident. Do not immediately start editing code — this workflow front-loads diagnosis before any fix.
---

# Workflow: Incident Response / Production Debugging

Do not modify code as a first step. Follow `testing-debugging-review`'s
production debugging flow, expanded here into a concrete sequence:

## 1. Identify symptoms

What's actually broken, from whose perspective? All users, one region,
one endpoint, one customer? Get a concrete signal (error rate, latency
graph, specific error message) — not just "it's broken."

## 2. Determine blast radius

How many requests/users affected, is it growing or stable, since when
exactly?

## 3. Correlate with recent changes

Check recent deploys, config changes, migrations, and infra changes
against the onset time — before assuming the cause is in application
logic that hasn't changed recently.

## 4. Gather evidence, in this order

Logs (for the specific failing request) → metrics (for the aggregate
pattern) → traces (to find which hop in a multi-service call is slow or
failing) → database health (connections, locks, replication lag) →
dependency health (third-party APIs, downstream services) → resource
health (CPU/memory/disk/network saturation).

## 5. Form one hypothesis at a time

State it explicitly, then check it against the evidence gathered — don't
change five things simultaneously and hope one fixes it.

## 6. Mitigate before root-causing

Restore service first: rollback, feature flag off, scale up, restart,
circuit-break the failing dependency. Speed matters more than elegance
here. Use `reliability-observability`'s circuit breaker / timeout guidance
if the mitigation is "stop calling the failing thing."

## 7. Root cause, after mitigation

Now dig into why it actually happened — pull in whichever domain skill
the root cause lands in (`database-engineering` for a bad query/lock,
`distributed-systems-caching` for a stampede/delivery issue,
`performance-scalability` for a capacity bottleneck, etc.).

## 8. Fix and prevent recurrence

Separate the permanent fix from the immediate mitigation. State what
monitoring, test, or process change would have caught this earlier or
faster next time.

## 9. Write it up

Use `testing-debugging-review`'s postmortem template: Summary → Timeline
→ Symptom → Root cause → Contributing factors → Immediate mitigation →
Permanent fix → Prevention → Action items with owners.
