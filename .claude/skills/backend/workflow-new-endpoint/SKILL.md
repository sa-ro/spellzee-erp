---
name: workflow-new-endpoint
description: Step-by-step workflow for adding a new API endpoint/route end-to-end — from contract design through implementation, validation, security, tests, and review. Use when asked to "add an endpoint", "create a new route", "expose an API for X", or similar net-new API surface work. Not for pure bug fixes to an existing endpoint. This is the **procedure**; `backend-api-design` holds the **standards** it applies — reach for that one when the question is what a good endpoint looks like rather than what to do next.
---

# Workflow: New API Endpoint

Follow these steps in order. Don't skip straight to code — steps 1–2 are
what separate a world-class result from a fast-but-wrong one.

## 1. Understand before designing

Pull in `system-architecture`'s core mindset: what's the actual business
requirement, expected traffic, latency/availability need, and where does
this endpoint's logic belong in the existing layering? Check the existing
project structure first (project-first rule in CLAUDE.md) — reuse the
existing router/service/repository pattern rather than inventing a new one.

## 2. Design the contract

Use `backend-api-design`:

- HTTP method + status codes per the semantics table.
- Request/response shape, including the standard error shape if this
  project has one already (check existing endpoints).
- Pagination strategy if it returns a list (cursor-based unless the
  project already uses offset).
- Does this need an `Idempotency-Key` (any state-changing, retryable
  operation)?
- Auth requirement: which role/permission gates this endpoint?

## 3. Data access

Use `database-engineering` + `nodejs-postgres-stack`:

- What query/queries does this need? Do they hit an existing index, or
  does a new one need justifying (query pattern, selectivity)?
- Does this write need a transaction? Multi-row consistency requirement?
- Any N+1 risk if this returns a list with related data?

## 4. Implement

Use `nodejs-postgres-stack` for the concrete idioms:

- Validate input with zod at the boundary before touching business logic.
- On NestJS, ensure the exception filter is actually registered — a
  swallowed rejection is this project's version of the Express
  `asyncHandler` trap.
- Acquire/release DB clients correctly if a transaction is involved.
- Authorization check happens server-side, not just "the UI won't show
  this button."

### The uniform write path (mandatory for any command that changes state)

Every state-changing endpoint does these four things **in one transaction**:

```
BEGIN
  1. authorize          (guard / interceptor — not an ad-hoc if-statement)
  2. write the change
  3. write the audit record
  4. INSERT the outbox row, if anything external must happen
COMMIT
```

This is what NestJS was chosen for: guards and interceptors make the path
enforceable by convention rather than by memory. A command that skips step 3
is not auditable, and `/CLAUDE.md`'s north star — *nothing important happens
invisibly* — has been broken.

Then check, before writing code:

- Does this touch **entitlement or credits**? → `spellzee-entitlement-ledger`
  (append-only rows; no balance column).
- Does it call **Merithub or any third party**? → `spellzee-outbox-merithub`
  (never inside the handler).
- Does it enforce a **cross-row rule**? → `spellzee-invariants` (constraint,
  not service check).
- Does it read a **threshold or cutoff**? → `spellzee-policy-versioning`
  (versioned row, read as-of the event's time).
- Is it a **sensitive action** (refund, merge, historical correction,
  high-impact subscription change)? → it needs maker–checker: the requester
  must not be able to approve their own request.

## 5. Security pass

Use `security-engineering`: injection safety (parameterized queries —
should already be true from step 3), authZ on the actual resource (IDOR
check — can a caller substitute another user's ID?), rate limiting if
this is a sensitive/expensive endpoint, no secrets/PII in logs or error
responses.

## 6. Observability

Use `reliability-observability`: does this endpoint's handler log with a
`request_id`, and are timing/error metrics emitted consistently with the
rest of the project? Add a timeout on any outbound call this endpoint
makes.

## 7. Tests

Use `testing-debugging-review`: happy path, validation failure, auth
failure (401/403), not-found (404), and — if this endpoint has a
concurrency-sensitive write — a test that actually races two requests
against it rather than asserting sequential behavior only.

## 8. Pre-merge check

Run through CLAUDE.md's "Before finalizing any significant change"
checklist before calling this done.
