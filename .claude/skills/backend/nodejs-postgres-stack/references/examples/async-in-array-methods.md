# Example: Async Work Over a Collection

## Bad — `async` inside `forEach` does nothing useful

```ts
function notifyUsers(userIds: string[]) {
  userIds.forEach(async (id) => {
    await sendNotification(id); // fires, but forEach doesn't wait for it
  });
  console.log("all notifications sent"); // logs immediately — false claim
}
```

`forEach` invokes the callback and ignores its return value entirely. All
the promises fire in parallel with no way to know when (or whether) they
finish, and any rejection is unhandled — it won't even reliably surface
as a crash, it can just vanish.

## Good — sequential, order-matters work

```ts
async function notifyUsers(userIds: string[]) {
  for (const id of userIds) {
    await sendNotification(id); // one at a time, errors propagate normally
  }
}
```

## Good — safe-to-parallelize work

```ts
async function notifyUsers(userIds: string[]) {
  await Promise.all(userIds.map((id) => sendNotification(id)));
  // all complete (or the first rejection propagates) before this returns
}
```

Use `for...of` when operations must happen in order or must not overwhelm
a downstream dependency; use `Promise.all` when they're independent and
safe to run concurrently. Never `forEach` with an `async` callback.
