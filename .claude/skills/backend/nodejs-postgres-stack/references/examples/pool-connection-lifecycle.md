# Example: `pg` Pool Connection Lifecycle

## Bad — client leaked on the error path

```ts
async function getUserWithLock(pool: Pool, id: string) {
  const client = await pool.connect();
  const result = await client.query( // if this throws, release() never runs
    "SELECT * FROM users WHERE id = $1 FOR UPDATE",
    [id]
  );
  client.release();
  return result.rows[0];
}
```

Every call that throws before reaching `client.release()` permanently
removes one connection from the pool's available capacity. Under
sustained error load, the pool exhausts and every subsequent query hangs
waiting for a connection that will never free up.

## Good — release guaranteed via `finally`

```ts
async function getUserWithLock(pool: Pool, id: string) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM users WHERE id = $1 FOR UPDATE",
      [id]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
}
```

## Better — skip manual checkout entirely when no transaction is needed

```ts
async function getUser(pool: Pool, id: string) {
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  return result.rows[0];
}
```

`pool.query()` acquires and releases the client internally — use it by
default; only check out a client manually (`pool.connect()`) when you
need multiple statements on the same connection, i.e. a transaction.
