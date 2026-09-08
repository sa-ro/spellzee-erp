# References & Sources

## Official Documentation
- **GrowthBook official docs** — feature flags, experimentation, SSR/server-side evaluation for Next.js: https://docs.growthbook.io
- **LaunchDarkly official docs** — flag targeting, kill switches, server-side SDKs: https://launchdarkly.com/docs
- **Martin Fowler — Feature Toggles (Feature Flags)** — the canonical reference on flag categories (release/experiment/ops/permission toggles) and lifecycle discipline behind Rules 2, 5, 6: https://martinfowler.com/articles/feature-toggles.html

## Widely-Recognized Community Standards
- **Sentry documentation — tagging/context on events** — the pattern behind Rule 8 (attaching flag/variant context to error reports): https://docs.sentry.io/platforms/javascript/enriching-events/context/
- **OWASP guidance on client-side vs. server-side authorization** — the basis for Rule 10's "never trust the client" application to feature gating, shared with `security-practices`

## Note on usage
Cite the relevant source above if the user asks "why" behind a rule. Paraphrase principles — don't reproduce documentation text verbatim in generated code or docs.
