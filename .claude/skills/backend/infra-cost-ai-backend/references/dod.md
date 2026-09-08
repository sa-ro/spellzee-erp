# Definition of Done — Infra, Cost & AI-Era Backend

Work is not done until every applicable item below is true.

- [ ] Infrastructure choice is justified by an actual requirement, not
      "standard practice" (e.g. Kubernetes/multi-region isn't added
      without a stated need).
- [ ] IAM/credentials follow least privilege — no shared admin
      credential where a scoped role would do.
- [ ] DB and internal services are not directly internet-reachable.
- [ ] Cost at current scale and at 10x is estimated, and compared
      against a simpler alternative explicitly.
- [ ] Secrets are never baked into an image layer or committed.
- [ ] If this involves an LLM/AI call: it's off the synchronous
      request-critical path (or explicitly justified if it must be on
      it), with a timeout and a defined fallback on failure/rate-limit.
- [ ] Any content from an LLM (or fed into one from untrusted sources —
      documents, tool results, user input) is treated as untrusted at
      the trust boundary — it cannot silently grant extra tool access or
      data access.
- [ ] Data sent to a third-party model/API is checked against what that
      provider logs/retains, given what's actually in the payload
      (PII/secrets).
