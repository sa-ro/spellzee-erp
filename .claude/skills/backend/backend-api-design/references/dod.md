# Definition of Done — Backend & API Design

Work is not done until every applicable item below is true.

- [ ] Every input (body/query/params/headers) is validated at the
      boundary before touching business logic.
- [ ] HTTP method and status codes match the semantics table (no 200 on
      a validation failure, no 500 for a client error).
- [ ] Standard error response shape is used consistently — no ad-hoc
      error format for this endpoint alone.
- [ ] List endpoints are paginated (cursor-based unless the project
      already uses offset).
- [ ] State-changing operations that can be retried are idempotent, or
      explicitly documented as not safe to retry.
- [ ] Every outbound call has an explicit timeout.
- [ ] Auth requirement (who can call this) is enforced server-side, not
      assumed from the client.
- [ ] Happy path, validation failure, auth failure, and not-found are
      all handled distinctly — none of them fall through to a generic
      500 or a misleading status code.
- [ ] No breaking change to an existing contract without a versioning
      strategy.
- [ ] Rate limiting is in place for any sensitive or expensive endpoint.
