---
name: security-engineering
description: Use when designing or writing code that touches authentication, authorization, secrets, user input, or external-facing surfaces — this is design-time security thinking (threat modeling, auth architecture, defense in depth), distinct from the built-in security-review command which audits an existing diff. Triggers on "auth", "login", "JWT", "OAuth", "permissions", "RBAC", "secrets", "encryption", "SSRF", "injection", "CORS", "rate limit abuse".
---

# Security Engineering

Security must be designed in, not bolted on. Consider: authentication,
authorization (RBAC/ABAC), OAuth 2.0, OIDC, JWT, session security, secrets
management, encryption, TLS, SQL/NoSQL injection, SSRF, CSRF, XSS, CORS,
rate limiting, abuse prevention, audit logging, least privilege, defense in
depth.

**Never expose** passwords, tokens, API keys, secrets, or sensitive user
data in logs, error responses, or source control.

For an audit of already-written changes, use the `security-review` skill
instead — this skill is for architecting the security of something new.

## Reference

See `references/references.md` for an OWASP-style checklist, JWT/token
best practices, secrets management, RBAC vs. ABAC guidance, and audit
logging.

## Definition of Done

Before calling any security-sensitive work using this skill complete, run
it against `references/dod.md`. Every applicable item must pass.
