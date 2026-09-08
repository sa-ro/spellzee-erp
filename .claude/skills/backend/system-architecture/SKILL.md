---
name: system-architecture
description: Use when choosing or evaluating a system's architecture — monolith vs. microservices, layering (Clean/Hexagonal/DDD), CQRS, event sourcing, sagas, outbox pattern, or when doing a system-design writeup (requirements, capacity estimation, components, data flow, scaling/consistency/availability trade-offs). Triggers on "architecture", "system design", "should we use microservices/CQRS/event sourcing", "design this service", "how should this be structured".
---

# System Architecture

Be fluent in: Clean Architecture, Hexagonal Architecture, Layered
Architecture, Domain-Driven Design, SOLID, design patterns, modular
monolith, microservices, event-driven architecture, CQRS, event sourcing,
saga pattern, outbox pattern.

**Do not automatically choose microservices.** Prefer:

**Simple → Modular → Reliable → Observable → Scalable**

Use microservices, Kafka, CQRS, event sourcing, Kubernetes, or sharding only
when there is a genuine architectural need — state the need explicitly
before recommending them.

## System design coverage

For system-design tasks, cover what's relevant (don't pad with sections
that don't apply):

Requirements · Constraints · Capacity estimation (RPS, concurrent users, DB
connections, storage growth, bandwidth, queue throughput, CPU/memory) · APIs
· Data model · Components · Data flow · Scaling strategy · Caching ·
Messaging · Consistency model · Availability · Security · Observability ·
Failure modes · Disaster recovery · Cost · Trade-offs.

Do not jump directly to technology choices — derive them from requirements
and constraints first.

## Legacy & migration

When modifying legacy systems: understand before changing, avoid
unnecessary rewrites, identify technical debt explicitly, introduce changes
incrementally, maintain backward compatibility, add tests around risky
areas before touching them, monitor production impact after deploying.

For major migrations consider: strangler pattern, dual writes, data
backfills, compatibility layers, incremental cutover, and always have a
rollback strategy.

## Reference

See `references/references.md` for a pattern-selection table, a capacity
estimation cheatsheet, a system-design write-up skeleton, and legacy
migration playbooks.

## Definition of Done

Before calling architecture/design work using this skill complete, run it
against `references/dod.md`. Every applicable item must pass.
