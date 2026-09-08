# Database Engineering — Reference

## Isolation levels (know the anomaly each one stops)

| Level | Prevents | Still allows |
|---|---|---|
| Read Uncommitted | nothing | dirty reads |
| Read Committed (Postgres default) | dirty reads | non-repeatable reads, phantoms |
| Repeatable Read | dirty + non-repeatable reads | phantoms (mostly, engine-dependent) |
| Serializable | all of the above | nothing — but can abort under contention (must retry) |

Higher isolation = more correctness guarantees, less concurrency. Pick the
lowest level that's actually safe for the operation, and use
`SELECT ... FOR UPDATE` / optimistic locking (version column) for the
specific rows that need stronger guarantees rather than raising the whole
transaction's isolation level.

## Index types

- **B-tree** — default, good for equality and range queries, sorted
  output for `ORDER BY`.
- **Partial index** — `WHERE` clause on the index itself (e.g.
  `WHERE deleted_at IS NULL`) — smaller, faster, when queries always
  filter on that condition.
- **Covering index** — includes all columns a query needs so the engine
  never touches the table (index-only scan).
- **GIN/GiST** (Postgres) — full-text search, JSONB containment, array
  containment, geometric types.
- **Composite index column order** — put the column used in equality
  filters first, range/sort columns after; a composite index on (a, b)
  does not efficiently serve a query filtering only on b.

## Query optimization checklist

1. Run `EXPLAIN ANALYZE` (not just `EXPLAIN` — get actual row counts vs.
   estimates).
2. Look for sequential scans on large tables where an index scan is
   expected.
3. Check if planner row estimates are wildly off from actual (stale
   stats → `ANALYZE`).
4. Check join order and join strategy (nested loop vs. hash vs. merge)
   against table sizes.
5. Watch for N+1: one query per row instead of a single batched query —
   fix with a join, `IN (...)`, or a dataloader/batching layer.
6. Select only needed columns, especially before adding covering indexes.

## Migration safety checklist

- [ ] What's the table's current row count and growth rate?
- [ ] Does this migration take a lock that blocks reads/writes, and for
      how long at current table size?
- [ ] Can it run online (e.g. `CREATE INDEX CONCURRENTLY` in Postgres)
      instead of a blocking variant?
- [ ] Is the change backward compatible with the *currently deployed*
      application code (not just the new code)?
- [ ] What's the deployment order — migration before or after code
      deploy, and does that matter here?
- [ ] Is there a rollback path that doesn't lose data?
- [ ] Does a backfill need to run separately (batched, throttled) rather
      than inline in the migration?
- [ ] What's monitored during/after rollout to catch a problem early?

## Expand-contract pattern

1. **Expand**: add new column/table alongside the old one (nullable, no
   constraint yet).
2. **Backfill**: populate the new column in batches, throttled, outside
   the migration transaction.
3. **Dual-write**: app writes both old and new during transition.
4. **Cutover**: switch reads to the new column/table.
5. **Contract**: stop writing old, then drop it in a later migration once
   confidence is high and nothing depends on it.
