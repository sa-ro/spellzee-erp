# `test` — integration and constraint tests

## There is no Docker on the development machine

So there is **no Testcontainers**. Tests run against the persistent `spellzee_test` database on port
5433, which means **isolation is the suite's own responsibility** — there is no fresh container per
run.

Never assume a clean database at the start of a test.

## Cleanup: transaction rollback, not truncate

Each test runs inside a transaction that is **rolled back** at the end.

- It is fast — no table rewrites between tests.
- It composes — parallel tests do not see each other's rows.
- It cannot leave debris behind if a test fails midway.

Truncate is the fallback for the cases rollback cannot cover: a test that needs to observe committed
state from a second connection, which is exactly what a **concurrency test** does. Those truncate
their own tables afterwards, explicitly.

## Constraint tests are the highest-value tests here

The pattern, and the reason it is not a service-level test:

```ts
it('rejects a second active owner for the same student', async () => {
  await insertOwnership({ studentId, endedAt: null });
  await expect(insertOwnership({ studentId, endedAt: null }))
    .rejects.toThrow(/one_active_owner_per_student/);
});
```

Assert on the **constraint name**, so the test cannot pass on an unrelated error. The point is to
prove the constraint exists and works independently of any code path that might be added later — a
mocked repository proves nothing about the component most likely to fail.

## Concurrency tests

Any invariant enforced by a trigger that reads other rows to decide is racy on its own. The
entitlement overdraw check is the live example: two simultaneous transactions can each see a
pre-write total.

Those need **two real connections**, not two promises on one. A single-threaded test will never
reproduce the race, and will pass while the bug ships.
