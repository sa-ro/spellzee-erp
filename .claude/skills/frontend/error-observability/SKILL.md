---
name: error-observability
description: Use this skill whenever the user is handling errors, setting up error boundaries, wiring up Sentry (or another monitoring tool), configuring source maps/release tracking, or deciding what to log versus surface to the user. Trigger for phrases like "add an error boundary", "set up Sentry", "how do I log this error", "the app shows a blank white screen on crash", "track releases", "source maps aren't uploading", or any request involving error monitoring, crash reporting, or production error visibility. Also trigger for Definition of Done review on error handling for a release.
---

# Error Handling & Observability Skill

Defines how errors are caught, surfaced to users, and reported to a monitoring backend (Sentry as the default), so production failures are visible and debuggable instead of silent white screens or unhandled console noise.

## Step 0: Detect Project Context Before Applying Any Rule

**Existing project?**
- Check `package.json` for `@sentry/nextjs`/`@sentry/react`, `bugsnag`, `rollbar`, or LogRocket. Follow whatever is already established.

**New project / no precedent?**
- Default to **Sentry** (`@sentry/nextjs` for Next.js) — industry-standard, native Next.js integration (source maps, release tracking, Server Component error capture).

## When to use this
- Adding error boundaries around any route or risky UI region
- Setting up or reviewing Sentry/monitoring configuration
- Deciding what gets logged vs. shown to the user vs. silently retried
- Reviewing a PR or running Definition of Done for error handling before a release

## Core principles (see `references/rules.md` for full detail with rationale)

1. **Project-detected monitoring tool, Sentry as the default**
2. **Route-level error boundaries, not just one root boundary** — a crash in one section shouldn't blank the whole app
3. **Error boundaries never silently swallow** — always report, then decide what to render
4. **User-facing error UI is never the raw error/stack** — a designed fallback with a recovery action
5. **Source maps uploaded per release, never shipped publicly**
6. **Release tracking tied to deploy** — every error attributable to a specific version/commit
7. **PII scrubbing before errors leave the client** — never send student data unredacted to a third party
8. **Distinguish expected failures (handled) from unexpected ones (reported)** — a 401 isn't the same as a null-pointer crash
9. **Breadcrumbs capture user actions leading to a crash**, not just the stack trace
10. **Server Component and Server Action errors are captured**, not only client-side ones
11. **Async/promise rejections are captured globally**, not only errors inside React's render tree
12. **Alerting thresholds are set deliberately** — noisy/no-op alerts get ignored
13. **Errors are deduplicated/grouped meaningfully** — one root cause shouldn't fan out into hundreds of tickets
14. **EdTech-critical flows (submission, payment, grading) get elevated severity/alerting**
15. **Errors during a timed assessment never silently lose student work** — cross-references `form-handling-validation`

## Workflow

1. **Step 0 first, always**: detect existing monitoring tool, or set up Sentry as the standard.
2. Wrap route segments and risky UI regions in error boundaries with a designed fallback, not just one root-level boundary.
3. Configure source map upload and release tagging in the build pipeline.
4. Scrub PII from error payloads before they leave the client.
5. Before sign-off: run through `references/definition-of-done.md`.

## Notes
- This skill governs error capture, boundaries, and monitoring configuration. For form-submission failure UX specifically, see `form-handling-validation`. For API-layer retry/idempotency on failed requests, see `api-integration`.
- Grounded in official Sentry, React error boundary, and OWASP data-minimization documentation — see `references/sources.md`.
