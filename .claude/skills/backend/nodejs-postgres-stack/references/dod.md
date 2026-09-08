# Definition of Done — Node.js/TypeScript + PostgreSQL Stack

Work is not done until every applicable item below is true.

- [ ] Every async route handler's rejections are caught (asyncHandler
      wrapper, `express-async-errors`, or confirmed Express 5) — no path
      where an unhandled rejection can crash the process.
- [ ] Every checked-out `pg` client is released in a `finally` block —
      no path that can leak a pool connection.
- [ ] Transactions run `BEGIN`/`COMMIT`/`ROLLBACK` on the same client,
      with `ROLLBACK` on the catch path and `release()` in `finally`.
- [ ] No `async` callback passed to `Array.forEach` — `for...of` or
      `Promise.all(map(...))` used instead.
- [ ] All external input (body/query/params) and `process.env` are
      validated with zod before use.
- [ ] `tsconfig` has `strict: true` and the change introduces no new
      `any`/type-suppression without a stated reason.
- [ ] No CPU-heavy synchronous work added to a hot request path without
      measuring its event-loop-blocking cost first.
- [ ] Migration tooling matches what the project already uses — no new
      migration tool introduced without a reason.
