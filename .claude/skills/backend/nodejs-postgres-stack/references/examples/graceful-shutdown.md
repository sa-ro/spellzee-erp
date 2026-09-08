# Example: Graceful Shutdown (Express)

## Bad — no shutdown handling

```ts
const server = app.listen(env.PORT);
// no SIGTERM/SIGINT handler — a deploy or scale-down sends SIGTERM,
// Node's default behavior drops in-flight requests and connections
// are torn down uncleanly
```

## Good — drain in-flight work, then close cleanly

```ts
import type { Server } from "node:http";
import type { Pool } from "pg";

const server: Server = app.listen(env.PORT);

async function shutdown(server: Server, pool: Pool) {
  server.close(async () => {       // stop accepting new connections,
    await pool.end();              // wait for in-flight requests to finish,
    process.exit(0);               // then close the DB pool and exit
  });

  // safety net: force-exit if shutdown hangs (e.g. a request never resolves)
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown(server, pool));
process.on("SIGINT", () => shutdown(server, pool));
```

`server.close()`'s callback fires only once all in-flight connections
have finished — that's what makes this "graceful": no in-flight request
is dropped mid-response by a rolling deploy or autoscaler scale-down. The
forced-exit timeout exists so a stuck request can't block shutdown
forever.

> Note: this example is Express-specific (`node:http`'s `Server`). If
> the project's actual framework differs from what `nodejs-postgres-stack`
> assumes, adapt the shape (e.g. Fastify's `app.close()` returns a
> promise directly) but keep the same sequence: stop accepting → drain →
> close DB pool → exit.
