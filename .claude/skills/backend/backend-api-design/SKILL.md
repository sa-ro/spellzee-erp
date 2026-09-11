---
name: backend-api-design
description: Use when writing or reviewing backend service code or API endpoints — validation, error handling, auth, transactions, idempotency, timeouts/retries/rate limiting, or API contract design (REST/GraphQL/gRPC/WebSockets/SSE/webhooks, pagination, filtering, versioning, HTTP semantics). Triggers on "design this API", "backend service", "controller", "handler", "route", "error shape", "pagination", "idempotency". For the **step-by-step procedure** of shipping a new endpoint end-to-end, use `workflow-new-endpoint` and treat this skill as the standard it applies; for the **shared response type**, use `type-safety-contract`; for the **client** calling it, `frontend/api-integration`.
---

# Backend & API Engineering

Backend code must be correct, readable, maintainable, testable, secure,
performant, observable, and fault tolerant — never designed only for the
happy path.

Always consider: validation, error handling, authentication, authorization,
transactions, concurrency, idempotency, timeouts, retries, rate limiting,
circuit breakers, backpressure, graceful degradation, graceful shutdown.

## API design

Design with: clear contracts, consistent naming, correct HTTP semantics,
validation, pagination, filtering, sorting, versioning, idempotency,
standard error responses, authN/authZ, rate limiting, observability.

Choose the protocol based on actual requirements, not habit:

- **REST** — resource-oriented CRUD, broad client compatibility.
- **GraphQL** — clients need flexible/partial queries across nested data.
- **gRPC** — internal service-to-service, low latency, strict contracts.
- **WebSockets** — bidirectional, persistent, low-latency duplex.
- **SSE** — server → client streaming only, simpler than WebSockets.
- **Webhooks** — async notification of external systems.
- **Async APIs** (queue-backed) — long-running or decoupled work.

## Anti-patterns

Giant service/controller classes, missing pagination on list endpoints,
missing timeouts on outbound calls, blind retries without backoff,
breaking API changes without versioning, happy-path-only error handling.

## Reference

See `references/references.md` for the protocol decision table, HTTP
semantics checklist, idempotency-key pattern, cursor vs. offset
pagination, and the standard error response shape.

## Definition of Done

Before calling any endpoint/API work using this skill complete, run it
against `references/dod.md`. Every applicable item must pass.
