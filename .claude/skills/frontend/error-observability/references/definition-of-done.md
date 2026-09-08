# Definition of Done — Error Handling & Observability

## 1. Setup
- [ ] Existing monitoring tool convention detected and followed (or Sentry used for a new precedent)
- [ ] Source maps upload per release via the build pipeline and are excluded from public output
- [ ] Every deploy tags a release identifier (commit SHA/version)

## 2. Boundaries & Fallback UX
- [ ] Route-level (and risky-widget-level) error boundaries exist, not just one root boundary
- [ ] Every caught error is reported before/alongside rendering the fallback
- [ ] Fallback UI is a designed component with a recovery action — never a raw error/stack trace or blank screen

## 3. Coverage
- [ ] Server Components, Route Handlers, and Server Actions have server-side error capture, not just client-side
- [ ] Global unhandled-rejection/async error capture is enabled

## 4. Data Safety
- [ ] PII is scrubbed from error payloads (`beforeSend`/equivalent) before transmission
- [ ] No full form state or raw API response bodies attached to reports without review

## 5. Signal Quality
- [ ] Expected failures (401/404/validation) handled in-flow, not reported at error severity
- [ ] Alert thresholds are deliberate, not "alert on everything"
- [ ] Grouping/fingerprinting reviewed so one root cause doesn't fan out into many issues

## 6. EdTech-Specific
- [ ] Submission/payment/grading flow errors are tagged for elevated alerting
- [ ] Error boundaries around active timed assessments attempt recovery from autosave, never a silent work-losing dead end

## Sign-off
Only mark "error-observability: done" once all sections are checked.
