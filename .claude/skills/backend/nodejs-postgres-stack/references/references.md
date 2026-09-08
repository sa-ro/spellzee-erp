# Node.js / TypeScript + PostgreSQL — Background Reference

Actionable checks live in `checklist.md`; failure modes live in
`anti-patterns.md`; code lives in `examples/`. This file holds the
decision tables and formulas that don't fit those buckets.

## Connection pool sizing

`pg.Pool` default `max` is 10 — too low for most production traffic, too
high if you have many app instances hitting a DB with a limited
`max_connections`.

Rule of thumb: `pool_max_per_instance × number_of_app_instances <
postgres_max_connections − headroom_for_admin/replicas`. If you need more
concurrency than Postgres connections allow, put a connection pooler
(PgBouncer, in transaction mode) between the app and the DB rather than
raising `max_connections` past what the DB host handles well.

```ts
import { Pool } from "pg";

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,                        // per app instance — size deliberately, see formula above
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000, // fail fast, don't hang forever
});
```

## Migration tooling comparison

| Tool | Fit |
|---|---|
| Prisma Migrate | Paired with Prisma ORM; good DX, generates migrations from schema diff; less control over exact SQL for tricky online-migration cases. |
| node-pg-migrate | Plain SQL/JS migrations, full control — good when you need `CREATE INDEX CONCURRENTLY` or other manual-tuning migrations the generator won't produce. |
| Kysely + manual SQL migrations | Matches a Kysely query-builder setup; migrations are hand-written SQL, same control benefit as node-pg-migrate. |

Whichever tool: still apply `database-engineering`'s migration-safety
checklist (table size, lock duration, backward compatibility, rollback)
— the tool doesn't make an unsafe migration safe on its own.
