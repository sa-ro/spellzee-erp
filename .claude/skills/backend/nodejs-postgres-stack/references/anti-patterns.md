# Anti-Patterns — Node.js/TypeScript + PostgreSQL Stack

Each of these is a correctness trap specific to this stack — not a style
preference. Each has a corresponding good/bad pair in `examples/`.

## 1. Unhandled promise rejection in a route handler

**Problem**: an `async` route handler throws/rejects and nothing catches
it.

**Why it fails**: pre-Express-5, Express does not forward a rejected
promise from an async handler to error middleware. An unhandled
rejection can crash the whole Node process — one bad request takes down
every in-flight request on that instance, not just the failing one.

**Fix**: wrap every async handler (`asyncHandler` utility or
`express-async-errors`), or confirm Express 5 is actually installed
before relying on native handling. See `examples/async-route-handlers.md`.

## 2. Leaked `pg` pool connection

**Problem**: `pool.connect()` is called and the client is never
released, or is released only on the success path.

**Why it fails**: the pool has a hard `max`. Each leaked client
permanently reduces available capacity until the process restarts —
under sustained load this silently exhausts the pool and every
subsequent query hangs waiting for a connection.

**Fix**: `client.release()` always in a `finally` block, or prefer
`pool.query()` (which manages the client lifecycle internally) unless an
explicit transaction is needed. See `examples/pool-connection-lifecycle.md`.

## 3. Transaction without a correct rollback/release path

**Problem**: `BEGIN`/`COMMIT` without a `catch` that issues `ROLLBACK`,
or `ROLLBACK` without `client.release()` in `finally`.

**Why it fails**: a failed statement mid-transaction leaves the
connection in an aborted-transaction state; the next query on that same
client fails too, and if the client is never released the pool leaks on
top of it — compounding failure #2.

**Fix**: `BEGIN` → try → `COMMIT`; `catch` → `ROLLBACK` → rethrow;
`finally` → `client.release()`. All four parts required together. See
`examples/transactions.md`.

## 4. `async` callback inside `Array.prototype.forEach`

**Problem**: `items.forEach(async (item) => { await doWork(item); })`.

**Why it fails**: `forEach` does not await its callback's returned
promise — it fires all callbacks and returns immediately. Errors are
silently swallowed (no unhandled-rejection warning in some Node
versions), and code after the `forEach` call runs before any of the
async work finishes, producing intermittent, hard-to-reproduce bugs.

**Fix**: `for...of` with `await` for sequential work, or
`Promise.all(items.map(...))` for safe-to-parallelize work. See
`examples/async-in-array-methods.md`.

## 5. `process.env` used without validation

**Problem**: reading `process.env.SOME_VAR` directly in application code,
scattered across files, with no startup-time check.

**Why it fails**: a missing or malformed env var surfaces as
`undefined` deep inside a request handler — often in production, often
as a confusing downstream error (e.g. a DB connection string that's
`undefined` fails with a cryptic driver error, not a clear "missing
config" error) — instead of failing fast at boot.

**Fix**: one zod schema, parsed once at startup, exported as a typed
`env` object; the process refuses to boot on a missing/malformed var.
See `examples/env-validation.md`.

## 6. No graceful shutdown handling

**Problem**: the process exits immediately on `SIGTERM`/`SIGINT` (or has
no handler and relies on the default), instead of draining in-flight
work first.

**Why it fails**: a rolling deploy or autoscaler scale-down sends
`SIGTERM` to instances being retired. Without a handler, in-flight
requests are dropped mid-response and pool connections are torn down
uncleanly — visible to users as intermittent errors during every deploy,
not just during incidents.

**Fix**: on `SIGTERM`/`SIGINT`, stop accepting new connections, let
in-flight requests finish, then close the DB pool, then exit. See
`examples/graceful-shutdown.md`.

## 7. CPU-heavy synchronous work on a hot request path

**Problem**: large JSON parse/stringify, synchronous crypto, or image/
file processing done inline inside a request handler.

**Why it fails**: Node is single-threaded for JS execution — a
long-running synchronous block stalls the event loop, delaying every
other concurrent request on that instance, not just the one doing the
heavy work.

**Fix**: measure first (don't assume it's a problem); if it's real,
offload to a worker thread or a separate service rather than accepting
event-loop stalls as normal.
