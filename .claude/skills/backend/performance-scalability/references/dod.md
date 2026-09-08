# Definition of Done — Performance & Scalability

Work is not done until every applicable item below is true.

- [ ] Any performance claim is backed by an actual measurement
      (profiler output, `EXPLAIN ANALYZE`, load test number) — not
      assumed.
- [ ] No O(n²) or worse behavior on a collection that can grow with user
      data, unless justified and bounded.
- [ ] No query or blocking call inside a loop over a growing collection.
- [ ] The service remains stateless (or the state is explicitly justified
      and externalized) so it can scale horizontally.
- [ ] The bottleneck at 10x current traffic is named, and what handles
      it is stated (more instances, a read replica, a queue, caching —
      not "it'll probably be fine").
- [ ] Connection pool / worker sizing is sane relative to expected
      concurrency (Little's Law sanity check), not left at a framework
      default without checking.
- [ ] Latency claims reference a percentile (P95/P99), not just an
      average.
- [ ] No premature optimization — the change targets a measured or
      clearly reasoned bottleneck, not a guess.
