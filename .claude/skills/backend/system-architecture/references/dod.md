# Definition of Done — System Architecture

Work is not done until every applicable item below is true. If an item
doesn't apply, say so explicitly rather than silently skipping it.

- [ ] The chosen pattern (monolith/microservice/CQRS/event sourcing/etc.)
      has a stated, concrete reason tied to an actual requirement — not
      "it's standard practice."
- [ ] Simpler alternatives were considered and explicitly rejected with a
      reason, not just skipped.
- [ ] Component boundaries and responsibilities are stated, not implied.
- [ ] Data flow between components is traceable end to end (no unstated
      "and then it just works" step).
- [ ] Consistency/availability trade-off for this component is named
      (which one it favors, and where).
- [ ] Failure modes for each external dependency are stated (what
      happens when it's down/slow).
- [ ] Capacity/scale assumptions are stated with numbers, not vibes, when
      the design is scale-sensitive.
- [ ] If this touches a legacy system: migration/rollback strategy is
      explicit (strangler, dual-write, expand-contract, etc.).
- [ ] The design was checked against `CLAUDE.md`'s anti-patterns list
      (no premature microservices/distributed complexity introduced
      without genuine need).
