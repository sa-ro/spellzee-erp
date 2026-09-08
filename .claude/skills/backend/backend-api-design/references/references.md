# Backend & API Design — Reference

## Protocol decision table

| Need | Choose |
|---|---|
| Public CRUD resource API, broad client compat | REST |
| Clients need flexible/partial/nested queries | GraphQL |
| Internal service-to-service, low latency, strict typed contract | gRPC |
| Bidirectional persistent low-latency channel | WebSockets |
| Server → client streaming only | SSE |
| Notify external systems async | Webhooks (+ signature verification) |
| Long-running/decoupled work | Async API backed by a queue |

## HTTP semantics checklist

- `GET` safe + idempotent, no side effects, cacheable.
- `POST` creates; not idempotent unless you add an `Idempotency-Key`.
- `PUT` full replace, idempotent. `PATCH` partial update, not inherently
  idempotent — document what it guarantees.
- `DELETE` idempotent (deleting twice = still deleted, don't 500 on the
  second call).
- Status codes: 200/201/204 success; 400 validation; 401 unauthenticated;
  403 unauthorized; 404 not found; 409 conflict (e.g. optimistic lock
  failure); 422 semantically invalid; 429 rate limited; 5xx server fault.

## Idempotency pattern (for POST / payments / side-effecting calls)

1. Client sends `Idempotency-Key` header (UUID) with the request.
2. Server checks a keyed store (DB table or Redis) before executing.
3. If key seen and completed → return the stored response, don't re-run.
4. If key seen and in-flight → 409 or block until it resolves.
5. Store key → response mapping with a TTL matching the client retry
   window (not forever).

## Pagination

- **Offset/limit**: simple, but drifts under concurrent writes and gets
  slow at high offsets (the DB still scans/skips the offset rows).
- **Cursor-based** (keyset pagination on an indexed, unique, monotonic
  column): stable under concurrent writes, consistent performance at any
  depth. Prefer this for anything beyond a small, rarely-growing list.

## Standard error response shape

Keep one consistent shape across the API:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "email is required",
    "details": [{ "field": "email", "issue": "required" }],
    "request_id": "..."
  }
}
```

Never leak stack traces, internal exception messages, or DB errors
verbatim into the response — log them server-side with the `request_id`,
return a generic message to the client.

## Validation & error handling

Validate at the boundary (request body/query/headers) before touching
business logic. Fail closed on ambiguous input. Distinguish client errors
(4xx, don't retry) from server errors (5xx, safe to retry with backoff) in
both the status code and how the client is told to react.
