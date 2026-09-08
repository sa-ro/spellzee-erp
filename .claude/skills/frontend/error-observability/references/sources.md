# References & Sources

## Official Documentation
- **Sentry — Next.js SDK documentation** — Server Component/Server Action capture, source map upload, release tracking: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Sentry — Data scrubbing/PII documentation** — `beforeSend`, server-side scrubbing configuration: https://docs.sentry.io/platforms/javascript/data-management/sensitive-data/
- **React official docs — Error Boundaries** — boundary semantics, what they do and don't catch (event handlers, async code): https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
- **MDN — `window.onunhandledrejection`** — global promise-rejection capture referenced by Rule 11: https://developer.mozilla.org/en-US/docs/Web/API/Window/unhandledrejection_event

## Widely-Recognized Community Standards
- **OWASP — Logging Cheat Sheet** — data-minimization guidance behind the PII-scrubbing rule: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
- **Google SRE Book — Monitoring Distributed Systems (alerting philosophy)** — basis for deliberate alert-threshold guidance: https://sre.google/sre-book/monitoring-distributed-systems/

## Note on usage
Cite the relevant source above if the user asks "why" behind a rule. Paraphrase principles — don't reproduce documentation text verbatim in generated code or docs.
