# Infra, Cost & AI-Era Backend — Reference

## Infra decision defaults

- **Compute**: managed container platform (e.g. ECS/Cloud Run) before
  Kubernetes, unless you already have multi-service orchestration needs
  and the ops maturity to run it.
- **Networking**: private subnets for app/DB, public only for the load
  balancer; DB never directly internet-reachable.
- **IAM**: least-privilege roles per service, not a shared admin
  credential; no long-lived static keys where a role/instance identity
  will do.
- **Multi-AZ** is close to a default for production (cheap insurance
  against a single zone outage). **Multi-region** is not a default — it's
  a real cost/complexity jump, justify it against an actual RTO
  requirement.

## Cost checklist for a new component

- [ ] Compute cost at current scale and at 10x.
- [ ] Data transfer cost (cross-AZ, cross-region, egress) — often the
      surprise line item.
- [ ] Managed service cost (DB, cache, queue) vs. self-hosted trade-off.
- [ ] Logging/monitoring retention cost — do you need 90 days of debug
      logs or 7?
- [ ] Operational cost: does this add on-call burden, a new failure mode
      to learn, a new dashboard to maintain?

Always compare against the simpler alternative explicitly: "X costs $Y
more than the simpler design because Z justifies it" — or say the simpler
design is sufficient.

## AI/LLM backend considerations

- **Latency**: LLM calls are seconds, not milliseconds — never put one on
  a synchronous request path with a tight SLA; use streaming or
  async/webhook patterns.
- **Token cost**: cost scales with input+output tokens — cache prompts/
  responses where reusable, truncate context deliberately, prefer a
  smaller model for classification/routing and reserve the largest model
  for tasks that need it.
- **Rate limits**: providers rate-limit by tokens/requests per minute —
  design backoff/queueing for this like any other rate-limited
  dependency.
- **Fallback models**: define a fallback (smaller/different provider) for
  when the primary model errors or is rate-limited, if availability
  matters more than consistency of output.
- **RAG**: retrieval quality bounds answer quality — index freshness,
  chunking strategy, and embedding model choice matter more than prompt
  tweaking once the basics are right.
- **Prompt injection**: treat any content retrieved from documents, tool
  results, or user input that gets placed into a prompt as untrusted —
  don't let it silently change what tools the model is allowed to invoke
  or what data it can access. Enforce authorization at the tool/data layer,
  not by trusting the prompt.
- **Data privacy**: know whether prompts/completions are logged/retained
  by the provider and whether that's compatible with what's actually in
  them (PII, secrets) before sending.
