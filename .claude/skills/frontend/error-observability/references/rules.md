# Error Handling & Observability Rules

## Rule 1: Project-Detected Monitoring Tool, Sentry as the Default
- Check `package.json` for an existing monitoring SDK and follow it. Otherwise default to `@sentry/nextjs` (Next.js) or `@sentry/react` — mature Server/Client Component support, source map handling, and release tracking built in.

## Rule 2: Route-Level Error Boundaries, Not Just One Root Boundary
- Each major route segment (and any risky isolated widget — a video player, a third-party embed) has its own `error.tsx`/error boundary, so a crash in one section degrades gracefully instead of blanking the entire app.
- The root boundary is a last-resort catch-all, not the primary line of defense.

## Rule 3: Error Boundaries Never Silently Swallow
- Every caught error is reported to the monitoring tool before (or as part of) rendering the fallback UI — a `catch` block or boundary that only shows a fallback without reporting hides real production issues.

## Rule 4: User-Facing Error UI Is Never the Raw Error
- The fallback UI shown to a user is a designed component (apology copy, a retry/reload action, a link to support) — never a raw stack trace, error message string, or blank screen. Technical detail is for the monitoring dashboard, not the user.

## Rule 5: Source Maps Uploaded Per Release, Never Publicly Shipped
- Source maps are generated at build time and uploaded to the monitoring tool via its release pipeline step, then excluded from the public build output — shipping readable source maps publicly both defeats minification's purpose and can leak internal logic/comments.

## Rule 6: Release Tracking Tied to Deploy
- Every deploy tags a release identifier (commit SHA or version) in the monitoring tool, so every captured error is attributable to the exact code version that produced it — without this, "did the last deploy fix it" is unanswerable from the dashboard alone.

## Rule 7: PII Scrubbing Before Errors Leave the Client
- Error payloads (breadcrumbs, request data, user context) are scrubbed of PII (student names, emails, submitted answer content) before transmission — configure the monitoring SDK's `beforeSend`/scrubbing hooks rather than relying on manually remembering not to log sensitive fields.
- Never attach full form state or API response bodies to an error report without reviewing what fields they contain.

## Rule 8: Distinguish Expected Failures from Unexpected Ones
- An expected failure (401 requiring re-login, 404 for a deleted resource, validation rejection) is handled in-flow with appropriate UI — it is not reported as an error-level event to the monitoring tool, or it's reported at a lower severity/as an info event.
- An unexpected failure (null-pointer, unhandled exception, 500) is always reported at error severity. Conflating the two floods the dashboard and buries real regressions.

## Rule 9: Breadcrumbs Capture the Path to a Crash
- The monitoring SDK's breadcrumb/context capture (navigation, clicks, API calls) is enabled so a captured error includes what the user was doing leading up to it — a bare stack trace without context is often unreproducible.

## Rule 10: Server Component and Server Action Errors Are Captured
- Errors thrown in Server Components, Route Handlers, and Server Actions are captured by the monitoring tool's server-side integration (not just the client-side SDK) — a Next.js app has two separate error surfaces, and only instrumenting the client misses an entire class of failures.

## Rule 11: Global Async/Promise Rejection Capture
- Unhandled promise rejections and errors outside React's render tree (event handlers, timers, non-React async code) are captured via the SDK's global handlers — a React error boundary alone does not catch these.

## Rule 12: Alerting Thresholds Set Deliberately
- Alert rules are configured for meaningful thresholds (error rate spike, a specific critical-flow error appearing at all) rather than alerting on every single captured error — an alert channel that fires constantly gets muted and stops being useful.

## Rule 13: Errors Deduplicated/Grouped Meaningfully
- Fingerprinting/grouping rules are reviewed so one root cause (e.g. one bad deploy) groups into one issue, not hundreds of near-identical events treated as separate incidents — adjust the monitoring tool's default grouping when it over- or under-groups for a known noisy error shape.

## Rule 14: EdTech-Critical Flows Get Elevated Severity
- Errors in submission, payment, enrollment, or grading flows are tagged/routed for elevated alerting (dedicated Slack channel, paging) distinct from general UI errors — a failed quiz submission is not the same priority as a broken tooltip.

## Rule 15: Errors During a Timed Assessment Never Silently Lose Work
- Any error boundary wrapping an active timed-assessment flow must not simply unmount and discard in-progress answer state — it reports the error, then attempts recovery (retry, resume from last autosave) per `form-handling-validation`'s autosave rule, rather than presenting a dead-end fallback that loses the student's work.
