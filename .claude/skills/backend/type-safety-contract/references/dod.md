# Definition of Done — contract & type-safety work

Every applicable item must pass before the work is called complete.

## The declaration

- [ ] The concept is declared **once**, in `packages/contracts`, and imported everywhere else.
- [ ] Nothing in `apps/web` re-declares a shape that `packages/contracts` already exports.
- [ ] `packages/contracts` does not import `@prisma/client`, node types, or anything DOM-only.
- [ ] No `any` at the boundary. `unknown` plus a narrowing function where the shape is genuinely
      not known ahead of time.

## The wire

- [ ] Dates are ISO-8601 `string`, not `Date`. The field name makes the timezone answerable.
- [ ] Numbers that came from a Postgres `NUMERIC` are not silently typed `number` without a
      stated rounding decision.
- [ ] Nullable-vs-optional was decided deliberately: `| null` means the row has no value, `?`
      means the endpoint omits the key. Not used interchangeably.
- [ ] The type describes the wire, not the table. No internal columns, soft-delete flags or
      audit bookkeeping leaked into a response type.

## Vocabulary sync

- [ ] If a `TEXT` + `CHECK` vocabulary changed, the migration and the TypeScript union changed
      **in the same commit**.
- [ ] A constraint test asserts the set of values the database accepts.
- [ ] Consumers switch exhaustively over the union — a new member produces a compile error, not
      a silent fallthrough to a default branch.

## Propagation

- [ ] `npm run typecheck` (`tsc -b`) passes across every project, not just the one edited.
- [ ] Every consuming package lists the contracts package in its tsconfig `references`.
- [ ] If a required field was added to a response type, the break to consumers was intended and
      all of them were updated.

## Derived values

- [ ] No derived value (`remaining`, any balance) has a stored column behind it. It appears in a
      response type only, computed from the ledger at read time.
