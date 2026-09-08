# Security Engineering — Reference

## OWASP-style checklist for backend changes

- **Injection** (SQL/NoSQL/command): parameterized queries / ORM
  bindings only — never string-concatenate user input into a query or
  shell command.
- **Broken auth**: passwords hashed with a slow KDF (bcrypt/argon2), not
  reversible encryption; sessions/tokens have expiry and can be revoked.
- **Broken access control**: authorize on the server for every request —
  never trust a client-supplied role/ID; check object-level ownership
  (IDOR: can user A fetch user B's resource by guessing an ID?).
- **Sensitive data exposure**: encrypt at rest and in transit (TLS);
  never log secrets, tokens, full card numbers, or passwords.
- **SSRF**: if the server fetches a user-supplied URL, block internal/
  private IP ranges and cloud metadata endpoints (`169.254.169.254`)
  explicitly.
- **CSRF**: state-changing requests need a CSRF token or
  `SameSite=Strict/Lax` cookies + origin checks, unless auth is via
  bearer token in a header (not a cookie).
- **XSS**: escape/encode output by context (HTML, attribute, JS, URL);
  rely on the framework's auto-escaping rather than hand-rolled escaping.
- **CORS**: don't reflect `Access-Control-Allow-Origin: *` on
  credentialed endpoints; allowlist specific origins.
- **Rate limiting / abuse**: throttle auth endpoints (login, password
  reset, OTP) separately and more aggressively than general API traffic.

## JWT / token best practices

- Short-lived access tokens (minutes–hours) + longer-lived refresh token,
  refresh token rotated and revocable server-side.
- Validate `alg`, `iss`, `aud`, `exp` on every verification — never
  accept `alg: none`.
- Don't put sensitive data in the JWT payload — it's base64, not
  encrypted, and often logged/cached by intermediaries.
- Store refresh tokens server-side (or as `httpOnly`, `Secure`,
  `SameSite` cookies) — never in `localStorage` if avoidable (XSS
  exfiltration risk).

## Secrets management

- Secrets live in a secrets manager / vault / environment injected at
  deploy time — never in source control, never in a Docker image layer.
- Rotate on a schedule and immediately on suspected exposure.
- Principle of least privilege: a service's credentials should only
  reach the specific resources it needs, not a shared admin credential.

## Authorization model choice

- **RBAC** (role-based): simple, coarse-grained, easy to reason about —
  default choice unless permissions genuinely vary per-attribute.
- **ABAC** (attribute-based): permissions computed from
  user/resource/context attributes — use when RBAC roles would multiply
  combinatorially (e.g. "owner can edit their own, but not others'").

## Audit logging

Log who did what to which resource and when, for anything
security-sensitive (auth events, permission changes, data exports) — as a
separate, tamper-resistant stream from general application logs, without
including the sensitive payload itself.
