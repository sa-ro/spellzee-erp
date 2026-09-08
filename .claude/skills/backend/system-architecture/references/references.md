# System Architecture — Reference

## Pattern selection

| Pattern | Use when | Avoid when |
|---|---|---|
| Modular monolith | Single team/small org, unclear domain boundaries, early-stage | Truly independent scaling/deploy needs across domains |
| Microservices | Independent teams, independent scaling, independent deploy cadence, proven domain boundaries | Team is small, boundaries are still shifting, no ops maturity for distributed debugging |
| Layered / Clean / Hexagonal | Need to isolate domain logic from framework/IO for testability | Trivial CRUD service where the ceremony outweighs the benefit |
| CQRS | Read and write models genuinely diverge (different scale, different shape) | Reads and writes are symmetric — adds complexity for no gain |
| Event sourcing | Full audit/replay of state changes is a real requirement | You just want an audit log — a change-log table is cheaper |
| Saga pattern | Multi-service transaction with no distributed transaction coordinator | A single-service transaction would do |
| Outbox pattern | Need atomic "write to DB + publish event" without 2PC | No downstream consumers actually need the event |

Default to modular monolith + layered architecture unless a concrete,
named requirement pushes you further right on this table.

## Capacity estimation cheatsheet

- Requests/sec = daily active users × actions/user/day ÷ 86,400, times a
  peak multiplier (commonly 2–5x average).
- Concurrent connections ≈ RPS × average request duration (Little's Law).
- DB connections needed ≈ concurrent requests hitting DB ÷ (1 − cache hit
  ratio), bounded by the pool size the DB can actually support.
- Storage growth = rows/day × avg row size × retention period; plan index
  overhead as roughly 1–2x table size for a few B-tree indexes.

Always state assumptions behind these numbers explicitly — they're
estimates, not measurements.

## System design write-up skeleton

1. Requirements (functional + non-functional, explicitly separated)
2. Constraints (team size, timeline, existing systems, budget)
3. Capacity estimate (traffic, storage, bandwidth)
4. API sketch (just enough to pin the contract)
5. Data model (entities, relationships, key access patterns)
6. Components + data flow diagram
7. Scaling strategy (what breaks first, what's the mitigation)
8. Consistency/availability trade-off (name it — CP or AP for which parts)
9. Failure modes + disaster recovery
10. Cost estimate at current and 10x scale

## Legacy migration playbooks

- **Strangler fig**: route new/changed functionality to the new
  implementation via a facade/proxy; migrate call-by-call; retire the old
  path once traffic is zero.
- **Dual writes**: write to old and new store simultaneously during
  transition; requires reconciliation for the window before cutover, and a
  plan for what happens when one write succeeds and the other fails.
- **Expand-contract**: add new schema/field alongside old (expand),
  backfill, switch reads to new, stop writing old (contract) — see
  `database-engineering` for migration mechanics.
