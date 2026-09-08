---
name: infra-cost-ai-backend
description: Use for cloud/infrastructure decisions (AWS, Docker, Kubernetes, Terraform, CI/CD, networking, IAM, multi-AZ/region), cost trade-off analysis, or building AI/LLM backend infrastructure (RAG, vector DBs, embedding pipelines, agents, MCP servers, model routing, AI gateways, LLM caching). Triggers on "deploy", "infrastructure", "terraform", "kubernetes", "docker", "cost", "budget", "RAG", "vector database", "embeddings", "LLM", "agent", "MCP server", "prompt injection".
---

# Cloud Infrastructure, Cost & AI-Era Backend

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
