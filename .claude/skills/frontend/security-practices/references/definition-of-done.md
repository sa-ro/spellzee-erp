# Definition of Done — Security Practices

A feature/release cannot be marked "done" until every item below is checked.

## 1. Access Control
- [ ] Every authorization check enforced server-side, independent of any UI-level hiding
- [ ] Role-based UI (teacher/admin tools) backed by server-side rejection of the same actions for other roles
- [ ] Firebase Security Rules follow least-privilege/deny-by-default (if Firebase used for direct client access)

## 2. Injection & Output Safety
- [ ] No unsanitized content passed to `dangerouslySetInnerHTML` or equivalent
- [ ] Untrusted JSON merges guarded against prototype pollution
- [ ] Generic error messages shown to users; stack traces/internal details never exposed in the UI

## 3. Auth & Session
- [ ] CSRF protection in place if cookie-based auth is used (`SameSite`, CSRF token)
- [ ] Auth tokens not stored in `localStorage`/`sessionStorage` without deliberate justification; cookies use `Secure`/`HttpOnly`/`SameSite`
- [ ] Logout clears all client-side session state (tokens, cached user data, local drafts)
- [ ] Session timeout enforced, with an accessible adjustable-time-limit UX
- [ ] Login rate-limited/lockout-protected; password reset uses single-use time-limited tokens with no user-enumeration leak

## 4. Secrets & Configuration
- [ ] No secrets use the `NEXT_PUBLIC_` prefix; `server-only` package guards server code from client bundles
- [ ] CSP configured per route; HSTS, `X-Content-Type-Options`, `Referrer-Policy`, and clickjacking protection (`X-Frame-Options`/`frame-ancestors`) set

## 5. Dependencies & Supply Chain
- [ ] `npm audit`/Snyk/Dependabot running in CI on a recurring basis
- [ ] Lockfile committed and used consistently
- [ ] New dependencies checked for maintenance/vulnerability history before adding
- [ ] Packages with install-time scripts received extra scrutiny
- [ ] Third-party CDN scripts use SRI (`integrity`/`crossorigin`)

## 6. Data Handling
- [ ] Sensitive data (tokens, PII) redacted before reaching logs or analytics
- [ ] Student data requests/views minimized to only what that specific view needs
- [ ] File uploads validated server-side by content, not just extension/client MIME type

## 7. Cryptography & Randomness
- [ ] Security-relevant client-generated values use `crypto.randomUUID()`/`crypto.getRandomValues()`, never `Math.random()`

## 8. Abuse Prevention
- [ ] Public-facing anonymous forms have bot/abuse mitigation (CAPTCHA, honeypot, or rate limiting)
- [ ] Redirect targets from URL parameters validated against an allowlist (no open redirect)
- [ ] `postMessage` handlers validate sender origin

## 9. Testing & Process
- [ ] SAST/dependency scanning integrated as CI gates, not manual/occasional

## Sign-off
Only mark "security-practices: done" once all sections are checked.
