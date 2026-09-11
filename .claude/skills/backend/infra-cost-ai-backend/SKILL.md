---
name: infra-cost-ai-backend
description: Use for cloud/infrastructure decisions (AWS, Docker, Kubernetes, Terraform, CI/CD, networking, IAM, multi-AZ/region), cost trade-off analysis, or building AI/LLM backend infrastructure (RAG, vector DBs, embedding pipelines, agents, MCP servers, model routing, AI gateways, LLM caching). Triggers on "deploy", "infrastructure", "terraform", "kubernetes", "docker", "cost", "budget", "RAG", "vector database", "embeddings", "LLM", "agent", "MCP server", "prompt injection". **Read the Spellzee scope note in the body first** — this project has no Docker, no Kubernetes and no CI yet, and its cloud provider is a deliberately deferred decision, so much of the generic guidance here is not yet applicable.
---

# Cloud Infrastructure, Cost & AI-Era Backend

## Scope note for Spellzee — read before applying anything below

This skill is generic. On this project, most of it is **not yet applicable**, and reaching for
it as written will produce advice that contradicts settled decisions:

- **No Docker on this machine at all** (`project-conventions/references/conventions.md`).
  PostgreSQL runs natively on port 5433. Testcontainers is unavailable and Docker-based advice
  does not apply.
- **Kubernetes and multi-region are explicitly rejected** in `CLAUDE.md`'s locked stack, and are
  not up for casual revisit. Runtime is auto-scaling containers, single region.
- **The cloud provider is a deliberately deferred decision.** `CLAUDE.md` says not to invent an
  answer and not to treat the deferral as permission to guess. Object storage and the
  observability vendor follow that decision.
- **There is no CI.** No `.github/workflows`, no pipeline. `scripts/verify.sh` is the check that
  exists today; it runs locally and from the `Stop` hook.
- **One deployment rule is already settled and is not generic advice:** workers must not scale
  to zero, or the outbox silently stops draining. See `spellzee-outbox-merithub`.

What *is* useful here now: cost trade-off reasoning, and the AI/LLM sections if that work ever
starts. Treat the cloud sections as a checklist for when the provider decision is made.

## Cloud & infrastructure

Understand production systems across AWS, Docker, Kubernetes, Terraform,
CI/CD. Consider networking, VPC, IAM, load balancing, autoscaling,
multi-AZ/multi-region, secrets management, monitoring, disaster recovery,
and cost. Choose infrastructure based on actual requirements — don't reach
for Kubernetes or multi-region because it's standard practice elsewhere.

## Cost engineering

Consider compute, database, storage, network, cache, logging, monitoring,
third-party services, and operational complexity (an on-call burden is a
cost too). Always ask: can we hit the required reliability and performance
with a simpler, cheaper architecture?

## AI-era backend

For LLM applications, RAG, vector databases, embedding pipelines, AI
agents, MCP servers, model routing, AI gateways, LLM caching, and token
optimization, also weigh: latency, token cost, model failures, rate
limits, fallback models, prompt injection, tool security, and data
privacy. Treat model output as untrusted input where it crosses a trust
boundary (e.g. feeds into a tool call or a query).

## Reference

See `references/references.md` for infra decision defaults, a cost
checklist for new components, and AI/LLM backend specifics (latency,
token cost, RAG, prompt injection, fallback models).

## Definition of Done

Before calling any infra/cost/AI-backend work using this skill complete,
run it against `references/dod.md`. Every applicable item must pass.
