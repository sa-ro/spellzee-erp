# Example: Async Route Handlers (Express)

## Bad — unhandled rejection can crash the process

```ts
router.get("/users/:id", async (req, res) => {
  const user = await getUser(req.params.id); // if this rejects, Express
  res.json(user);                            // (pre-v5) never catches it
});
```

If `getUser` rejects (DB timeout, not found thrown as an error, etc.),
nothing forwards that rejection to Express's error middleware. Depending
on Node version/config this can crash the process or hang the request.

## Good — Option A: asyncHandler wrapper

```ts
const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get("/users/:id", asyncHandler(async (req, res) => {
  const user = await getUser(req.params.id);
  res.json(user);
}));
```

## Good — Option B: express-async-errors

```ts
import "express-async-errors"; // once, at app startup

router.get("/users/:id", async (req, res) => {
  const user = await getUser(req.params.id);
  res.json(user); // rejections now auto-forward to error middleware
});
```

Pick one option and apply it consistently across the codebase — don't mix
both. Express 5 (when adopted) makes this unnecessary; confirm the
installed major version before assuming either workaround still applies.
