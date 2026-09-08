# Testing, Debugging & Review — Reference

## Test pyramid (rough proportions, adapt to the system)

- **Unit** (most): pure logic, no I/O, fast, isolated — the bulk of
  coverage.
- **Integration**: real DB/cache/queue (via test containers or similar),
  verifies the boundary actually works, not just the mock's contract.
- **API/contract**: verifies the request/response shape against the
  documented contract — catches breaking changes before clients do.
- **E2E** (fewest): full user flow through the real stack — expensive,
  brittle, reserve for critical paths.
- **Load/stress/chaos**: not run on every commit — run before capacity-
  sensitive launches or on a schedule against a staging/perf environment.

## What to actually test per change

- Happy path (obviously).
- Edge cases: empty input, max-size input, boundary values, unicode/
  encoding, concurrent identical requests.
- Failure scenarios: dependency timeout, dependency 5xx, partial write
  failure, network partition if relevant.
- Concurrency: two requests racing on the same resource — does the
  intended lock/idempotency actually hold under a real concurrent test,
  not just sequential mocked calls?
- Security boundaries: does an unauthorized user get 403, not 404-with-
  info-leak or 500?

## Production debugging flow (expanded)

1. **Identify symptoms** — what's actually broken, from whose
   perspective (all users? one region? one endpoint?).
2. **Blast radius** — how many users/requests affected, is it growing.
3. **Recent deploys** — correlate the onset time with deploy/config/
   migration timestamps before assuming code is at fault.
4. **Logs → metrics → traces** — in that order of granularity: logs for
   the specific failing request, metrics for the aggregate pattern,
   traces to find which hop in a multi-service call is slow/failing.
5. **Dependency health** — DB, cache, downstream services, third-party
   APIs.
6. **Resource health** — CPU, memory, disk, network, connection pool
   saturation.
7. **Form and test hypotheses** — one at a time, don't change five things
   simultaneously.
8. **Mitigate first** (rollback, feature flag, scale up, restart) —
   restore service before pursuing the perfect root cause.
9. **Root-cause + prevent recurrence** — after mitigation, not instead of
   it.

## Postmortem template

Summary → Timeline → Symptom → Root cause → Contributing factors →
Immediate mitigation taken → Permanent fix → Prevention (monitoring/test/
process change to catch this class of issue earlier) → Action items with
owners.

## Principal-level review checklist

- [ ] Correctness: does it handle the stated requirement, including
      edge cases?
- [ ] Architecture: is this logic in the right layer (not business logic
      leaking into a controller, not I/O in a domain model)?
- [ ] Database: are queries indexed appropriately, is the transaction
      boundary correct, any N+1?
- [ ] Performance: any O(n²) on a growing collection, any unbounded
      query/loop?
- [ ] Security: any injection, auth bypass, or data exposure surface?
- [ ] Reliability: what happens when each external call fails or times
      out?
- [ ] Concurrency: any race condition on shared state?
- [ ] Scalability: does this degrade gracefully or fall over at 10x?
- [ ] Maintainability: would another engineer understand this in six
      months without the PR description?
- [ ] Observability: can a production issue in this code be diagnosed
      from logs/metrics/traces alone?
