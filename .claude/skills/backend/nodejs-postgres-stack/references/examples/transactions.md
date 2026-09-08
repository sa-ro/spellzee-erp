# Example: Transactions

## Bad — no rollback, no guaranteed release

```ts
async function transferFunds(pool: Pool, fromId: string, toId: string, amount: number) {
  const client = await pool.connect();
  await client.query("BEGIN");
  await client.query(
    "UPDATE accounts SET balance = balance - $1 WHERE id = $2",
    [amount, fromId]
  );
  await client.query(
    "UPDATE accounts SET balance = balance + $1 WHERE id = $2",
    [amount, toId]
  );
  await client.query("COMMIT");
  client.release();
}
```

If the second `UPDATE` throws (e.g. a constraint violation), `COMMIT` is
never called, `ROLLBACK` is never called either, and `client.release()`
never runs — the transaction is left open on a leaked connection until
the pool's connection is eventually killed by the server or times out.

## Good — full BEGIN/COMMIT/ROLLBACK/release lifecycle

```ts
async function transferFunds(pool: Pool, fromId: string, toId: string, amount: number) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "UPDATE accounts SET balance = balance - $1 WHERE id = $2",
      [amount, fromId]
    );
    await client.query(
      "UPDATE accounts SET balance = balance + $1 WHERE id = $2",
      [amount, toId]
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err; // let the caller know the operation failed
  } finally {
    client.release();
  }
}
```

All four parts are required together: `BEGIN` in the try, `COMMIT` at
the end of the try, `ROLLBACK` in the catch, `release()` in `finally`.
Dropping any one of them reintroduces either a stuck transaction or a
leaked connection.
