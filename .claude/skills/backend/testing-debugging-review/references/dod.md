# Definition of Done — Testing, Debugging & Review

Work is not done until every applicable item below is true.

- [ ] Happy path is covered by a test.
- [ ] At least one edge case (empty/boundary/max-size input) is covered.
- [ ] At least one failure scenario (dependency timeout/error) is
      covered where the code has external dependencies.
- [ ] Auth/permission boundaries are tested (unauthorized access returns
      the correct 401/403, not a leak or a crash).
- [ ] Any concurrency-sensitive operation has a test that actually races
      concurrent calls, not just sequential assertions.
- [ ] Tests hit a real dependency (DB via testcontainers, etc.) for
      anything that exercises a real query — not mocked into
      meaninglessness.
- [ ] If this was a production debugging task: mitigation was applied
      before root cause was pursued, and a postmortem (symptom → root
      cause → contributing factors → mitigation → fix → prevention) was
      written for anything user-impacting.
- [ ] If this was a review: findings were stated concretely (file, line,
      failure scenario) — not vague ("consider improving error
      handling").
- [ ] Nothing was approved or reported done on happy-path testing alone.
