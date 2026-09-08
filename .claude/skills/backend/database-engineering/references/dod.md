# Definition of Done — Database Engineering

Work is not done until every applicable item below is true.

- [ ] Every new query was checked against `EXPLAIN` (or reasoned about
      explicitly) — no query shipped on the assumption that it's fast.
- [ ] Any new index has a stated reason (query pattern it serves) — not
      added speculatively.
- [ ] No N+1 query pattern introduced (verified by counting actual
      queries per request, not assumed).
- [ ] Every write that must be atomic with another write is inside a
      transaction with correct isolation for the operation.
- [ ] Concurrent-access question answered explicitly: what happens if
      two requests run this simultaneously, and if the same request runs
      twice?
- [ ] Foreign keys, unique constraints, and NOT NULL are used to enforce
      invariants at the DB level, not left to application code alone.
- [ ] If a migration is involved: it passed the migration-safety
      checklist (table size, lock duration, backward compatibility,
      rollback plan) — see `workflow-db-migration`.
- [ ] No unbounded query (missing `LIMIT`, missing pagination) against a
      table that can grow.
- [ ] Sensitive columns (PII, secrets) are identified and handled
      per the security-engineering DoD, not left as plain unencrypted
      text without a decision.
- [ ] A new table/database has a stated backup strategy (automated
      backup schedule, point-in-time recovery on/off) — not left at
      whatever the provider's default happens to be, unassessed.
- [ ] Backup restore has actually been tested at some point for this
      database (or it's flagged as untested) — an unverified backup is
      not a backup, it's a hope.
