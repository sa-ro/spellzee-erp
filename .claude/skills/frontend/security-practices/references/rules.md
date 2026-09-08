# Security Practices Rules

## Rule 1: OWASP Top 10 (2025) Is the Baseline Framework
- The project's security posture is reviewed against the current OWASP Top 10 (2025 edition, the current released version) — Broken Access Control, Cryptographic Failures, Injection (including XSS), and related categories are treated as known, named risks with specific mitigations, not vague "be careful" advice.
- Broken Access Control is consistently the #1 real-world risk category — this drives Rule 2 below.

## Rule 2: Never Rely on the Frontend as an Access Control Boundary
- Hiding a UI element (button, route, admin panel) from a role that shouldn't see it is a UX convenience, never the actual security control — the backend must independently enforce every authorization check, because a client-side-only gate is trivially bypassed via direct API calls.
- This directly extends the `api-integration` skill's role-based-403-handling rule: the frontend handles the "insufficient permission" response gracefully, but never assumes reaching that response is the primary defense.

## Rule 3: XSS Prevention — Sanitize, Never Trust, Never Blindly Inject HTML
- `dangerouslySetInnerHTML` (or any raw HTML injection) is never used on unsanitized content — this directly extends the `form-handling-validation` skill's sanitization rule, applied project-wide to any free-text/rich-text content, not just form inputs.
- Content from any external source (API responses, user-generated content, even "trusted" CMS content) is treated as untrusted for rendering purposes.

## Rule 4: CSRF Protection When Using Cookie-Based Auth
- If authentication uses cookies (as opposed to a bearer token in a header), CSRF protection is explicit: `SameSite=Lax` or `Strict` cookies at minimum, plus a CSRF token for state-changing requests where cross-site cookie submission is still possible.
- Cookie-based auth is not inherently safer than token-based — it trades one risk (XSS token theft) for another (CSRF) and needs its own explicit mitigation, not an assumption that cookies are "handled automatically."

## Rule 5: Secrets Never Reach the Client Bundle (Next.js-Specific)
- Only variables prefixed `NEXT_PUBLIC_` are available client-side in Next.js, and this prefix is a build-time instruction to inline the value into the JavaScript bundle — anything with this prefix is exposed to anyone who opens DevTools, permanently, even if the value looks obscure.
- Server-only secrets (API keys, database URLs, service credentials) never use the `NEXT_PUBLIC_` prefix, and the official `server-only` package is used to make it a build error if server-only code is accidentally imported into a Client Component.
- This directly extends the `api-integration` skill's never-expose-secrets rule with the specific Next.js mechanism behind it.

## Rule 6: Secure Cookie and Token Storage
- Auth tokens are not stored in `localStorage`/`sessionStorage` where XSS can trivially read them — prefer `httpOnly` cookies (inaccessible to JavaScript) set by the server, or accept the XSS-exposure tradeoff only with a clear, deliberate justification (e.g. a short-lived access token where refresh tokens are httpOnly).
- Any cookie carrying auth/session data sets `Secure`, `HttpOnly`, and an explicit `SameSite` attribute — never left at browser defaults.

## Rule 7: Content Security Policy (CSP) Per Route
- A Content-Security-Policy header restricts script/style/image/connect sources to known-trusted origins, configured per route where different routes have different needs (e.g. a payment page needs a payment provider's script origin; most pages don't) rather than one loose blanket policy for the whole app.
- CSP is defense-in-depth against XSS — it doesn't replace Rule 3's sanitization discipline, it limits the blast radius if sanitization is ever missed somewhere.

## Rule 8: Security Headers Beyond CSP
- `Strict-Transport-Security` (HSTS) enforces HTTPS-only connections.
- `X-Content-Type-Options: nosniff` prevents MIME-type sniffing attacks.
- `Referrer-Policy` limits what's leaked to third-party origins via the Referer header.
- `X-Frame-Options` (or CSP's `frame-ancestors`) prevents clickjacking by controlling whether the app can be embedded in an iframe on another origin.

## Rule 9: Dependency Vulnerability Scanning Is Continuous, Not One-Time
- `npm audit` (or an equivalent, e.g. Snyk/Dependabot) runs in CI and on a recurring schedule — new vulnerabilities are disclosed in existing dependencies constantly, so a clean scan at project start doesn't stay clean.
- Lockfiles (`package-lock.json`) are committed and used consistently — floating version ranges for security-sensitive packages risk silently pulling in a compromised or vulnerable patch release.

## Rule 10: Verify New Dependencies Before Adding
- A new package is checked for maintenance activity, download counts, and known-vulnerability history before being added — this guards against both abandoned packages and dependency-confusion/typosquatting attacks (a maliciously-named package close to a popular one's name).

## Rule 11: Subresource Integrity (SRI) for Third-Party CDN Scripts
- Any script loaded from a third-party CDN (not npm-bundled) includes an `integrity` attribute (SRI hash) and `crossorigin` attribute — this ensures the browser refuses to execute the script if the CDN is compromised and serves altered content.

## Rule 12: Sensitive Data Never Reaches Logs or Analytics
- Error logging (per the `api-integration` skill's observability rule) and analytics event tracking never include unmasked sensitive data — auth tokens, passwords, and student PII are redacted/excluded before any log or analytics payload is sent, even to trusted internal tools (Sentry, analytics platforms) — internal tools are still a data-exposure surface if breached or misconfigured.

## Rule 13: Rate Limiting and Abuse Prevention on Public-Facing Forms
- Public-facing forms with no auth requirement (public contact forms, public enrollment inquiry forms) have bot/abuse mitigation (CAPTCHA, honeypot fields, or rate limiting) — this is distinct from the `api-integration` skill's 429-handling rule, which is about gracefully handling rate limits as a client; this rule is about the product proactively preventing abuse at points where anonymous submission is possible.

## Rule 14: Secure Session Management and Logout
- Logout clears all client-side session state completely — auth tokens, cached user-specific data in the `state-management` layer (RTK Query cache, Zustand/Redux store), and any locally-persisted drafts tied to that user's identity.
- Session timeout is enforced (with the `accessibility` skill's adjustable-time-limit rule applied for the warning/extension UX) — an indefinitely-alive session on a shared/school computer is a real access risk in an EdTech context.

## Rule 15: File Upload Security Beyond Client-Side Validation
- The `form-handling-validation` skill's file-type/size validation on the client is UX only — the server independently validates file type by content inspection (not just trusting the file extension or client-reported MIME type), scans for malware where the risk profile warrants it, and stores uploads in a way that prevents them from being executed (e.g. not served from a path where the server would execute uploaded scripts).

## Rule 16: Open Redirect Prevention
- Any redirect driven by a URL parameter (post-login redirect, "return to" links) validates the target against an allowlist of known internal paths — never redirects blindly to whatever URL a query parameter contains, which enables phishing via a trusted domain redirecting to an attacker's site.

## Rule 17: `postMessage` Origin Validation
- Any use of `window.postMessage` (embedded content, iframes, cross-origin communication) validates the `origin` of incoming messages explicitly — never processes a message without checking it came from an expected origin, which otherwise allows any page to send arbitrary messages into the app.

## Rule 18: Student Data Minimization at the API/UI Layer (EdTech-Specific)
- UI views and the API calls that feed them request and display only the student data actually needed for that specific view — a class roster view doesn't need to fetch every field of every student's full profile if it only displays names and attendance status.
- This connects to the `api-integration` skill's role-based data shaping rule: minimization is the security-motivated reason behind that rule, not just an API design nicety.

## Rule 19: Role-Based UI Rendering Still Requires Server Enforcement (EdTech-Specific)
- Teacher/admin-only UI (gradebook editing, class-wide analytics, content authoring tools) is rendered conditionally based on role, but every underlying mutation/query the student-role UI could theoretically call by direct API request is independently rejected server-side for that role — this is Rule 2 applied specifically to the teacher/student/admin boundary that recurs throughout an EdTech product.

## Rule 20: Security Testing Integrated into CI
- Static Application Security Testing (SAST) tooling and dependency scanning (Rule 9) run as CI gates, not as an occasional manual audit — a security regression is caught at PR time, before merge, same discipline as the `performance-optimization` skill's CI-enforced budgets.

## Rule 21: Least-Privilege for Firebase Security Rules
- Firebase Security Rules (governing direct client access to Firestore/Realtime Database) follow least-privilege by default — deny-by-default, with explicit narrow allow rules per collection/field, rather than a broad rule that happens to work for the current feature set and gets discovered as overly permissive later.
- This is the Firebase-specific instance of Rule 2: client-side Firebase SDK calls are not implicitly trusted just because they go through an SDK rather than a REST call.

## Rule 22: Third-Party Script Vetting (Cross-References `performance-optimization` Rule 6)
- Every third-party script (analytics, chat widgets, embeds) is vetted for both performance cost (per `performance-optimization`) and security posture — what data it can access on the page, whether it's a plausible supply-chain attack vector, and whether it needs CSP/SRI treatment (Rules 7 and 11) before being added.

## Rule 23: Cryptographically Secure Randomness for Security-Sensitive Values
- Any client-generated value used for a security-relevant purpose (idempotency keys per the `api-integration` skill, CSRF tokens, session identifiers) uses `crypto.randomUUID()`/`crypto.getRandomValues()` — never `Math.random()`, which is not cryptographically secure and is predictable.

## Rule 24: Generic Error Messages to End Users, Detailed Errors Only to Logs
- Error messages shown in the UI are generic and safe ("Something went wrong, please try again") — stack traces, internal error details, database error strings, or API implementation details are never surfaced to the end user, only sent to the logging/observability layer (per `api-integration` Rule 28) where they're useful for debugging without helping an attacker map the system.

## Rule 25: Guard Against Prototype Pollution When Parsing Untrusted JSON
- When deep-merging or recursively processing JSON from an untrusted source (API responses treated as attacker-influenceable, user-uploaded JSON/config), avoid patterns vulnerable to prototype pollution (unguarded recursive merge of arbitrary keys including `__proto__`/`constructor`/`prototype`) — use a vetted, patched merge utility rather than a naive hand-rolled deep-merge.

## Rule 26: Account Security — Brute-Force Protection and Safe Password Reset
- Login attempts are rate-limited/lockout-protected (server-enforced, but the frontend surfaces the resulting state clearly) to resist credential-stuffing and brute-force attempts.
- Password reset flows use single-use, time-limited tokens, and the UI response is identical regardless of whether the submitted email exists in the system (preventing user-enumeration via response-timing or message differences).

## Rule 27: Vet Packages with Install-Time Scripts (Supply-Chain Awareness)
- New dependencies with `postinstall`/`preinstall` scripts receive extra scrutiny before being added — install-time script execution is a real, recurring supply-chain attack vector (a compromised or typosquatted package can run arbitrary code at `npm install` time, before any application code even runs).
- Where feasible for the project's dependency profile, CI installs can run with script execution restricted for untrusted/new packages as an additional layer, alongside Rule 10's pre-add vetting.
