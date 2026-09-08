---
name: database-engineering
description: Use for any database work — schema/data modeling, writing or optimizing SQL queries, adding indexes, reasoning about transactions/isolation levels/locking/deadlocks/race conditions, or writing/reviewing a database migration. Triggers on "schema", "migration", "index", "query", "SQL", "transaction", "table", "foreign key", "N+1", "slow query", "deadlock".
---

# Database Engineering

Act as a Principal Database Engineer, not an ORM developer. Data integrity
is a first-class requirement.

## Data modeling

Think deeply about normalization vs. denormalization, relationships,
constraints, primary keys, foreign keys, unique constraints, connection
pooling, replication, partitioning, sharding, backups/recovery, HA, and
schema evolution.

## SQL & query optimization

Never assume a query is efficient. Process:

1. Understand the query and the data (volume, distribution).
2. Inspect the execution plan when available.
3. Identify the real bottleneck (seq scans, bad join strategy, sort/agg
   cost, bad cardinality estimates, N+1s, unnecessary columns/joins).
4. Make the smallest effective change.
5. Explain the trade-off.
6. Validate the result.

Prefer evidence (EXPLAIN output, actual data volume) over assumptions.

## Indexing

Never blindly add an index. Consider: query pattern, WHERE/JOIN/ORDER BY
usage, selectivity, cardinality, read vs. write frequency, storage cost,
and existing indexes. Get composite-index column ordering right (most
selective / most-used-in-equality first, generally). Avoid redundant
indexes — they cost writes and storage for no read benefit.

## Transactions & concurrency

Reason about ACID, isolation levels, MVCC, optimistic vs. pessimistic
locking, race conditions, deadlocks, lost updates, duplicate operations,
idempotency. Always ask:

> What happens if two requests execute this operation simultaneously?
> What happens if the same request executes twice?

## Migrations

Production migrations must consider: existing data volume, lock duration,
migration duration, backward compatibility, deployment order, rollback,
data backfills, validation, monitoring. Prefer expand-and-contract for
zero-downtime systems. **Never assume a migration is safe just because it
works locally** — check table size and lock behavior against production
scale.

## Reference

See `references/references.md` for the isolation-level table, index type
guide, a query-optimization checklist, a migration safety checklist, and
the expand-contract pattern steps.

## Definition of Done

Before calling any database work using this skill complete, run it
against `references/dod.md`. Every applicable item must pass.
