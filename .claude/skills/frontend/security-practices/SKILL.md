---
name: security-practices
description: Use this skill whenever the user is handling authentication, authorization, secrets/environment variables, third-party scripts, file uploads, sensitive data, or reviewing code for security issues in a React/Next.js/EdTech app. Trigger for phrases like "is this secure", "how do I store this token", "prevent XSS/CSRF", "environment variables leaking", "review this for security", "add a CSP", "student data exposure", or any request involving OWASP, security headers, or dependency vulnerabilities. Also trigger for Definition of Done review before a release.
---

# Security Practices Skill

Defines frontend security practices against the OWASP Top 10 (2025) — access control, XSS/CSRF, secrets management, secure sessions, dependency supply-chain hygiene, and EdTech-specific student-data-minimization and role-boundary enforcement.

## When to use this
- Implementing or reviewing authentication/authorization flows
- Handling secrets/environment variables in Next.js
- Adding CSP or other security headers
- Reviewing sanitization of user-generated or API-sourced content
- Adding a new dependency or third-party script
- Handling file uploads or sensitive student data
- Reviewing a PR or running Definition of Done before a release

## Core principles (see `references/rules.md` for full detail with rationale)

1. **OWASP Top 10 (2025) is the baseline framework** — Broken Access Control is the top real-world risk
2. **Never rely on the frontend as an access control boundary** — server enforces every check
3. **XSS: sanitize, never trust, never blindly inject HTML**
4. **CSRF protection for cookie-based auth**
5. **Secrets never reach the client bundle** — `NEXT_PUBLIC_` discipline, `server-only` package
6. **Secure cookie/token storage** — avoid `localStorage` for tokens where avoidable
7. **CSP per route**
8. **Security headers beyond CSP** — HSTS, nosniff, Referrer-Policy, clickjacking protection
9. **Continuous dependency vulnerability scanning**
10. **Vet new dependencies before adding**
11. **SRI for third-party CDN scripts**
12. **Sensitive data never reaches logs/analytics unmasked**
13. **Abuse prevention on public-facing anonymous forms**
14. **Secure session management and complete logout**
15. **Server-side file upload validation beyond client checks**
16. **Open redirect prevention** — allowlisted redirect targets
17. **`postMessage` origin validation**
18. **Student data minimization (EdTech)** — fetch/display only what's needed
19. **Role-based UI still requires server enforcement (EdTech)**
20. **Security testing integrated into CI**
21. **Least-privilege Firebase Security Rules**
22. **Third-party script vetting** — performance and security together
23. **Cryptographically secure randomness** — `crypto.randomUUID()`, never `Math.random()`
24. **Generic error messages to users**, detailed errors only to logs
25. **Guard against prototype pollution** in untrusted JSON merges
26. **Account security** — brute-force protection, safe password reset
27. **Vet packages with install-time scripts** — supply-chain awareness

## Workflow

1. For any new feature touching auth, data access, or user input: check it against Rule 2 (server-enforced access control) and Rule 3 (sanitization) first — these are the highest-frequency real-world risks.
2. For new dependencies/scripts: vet before adding (Rules 10, 22, 27), then wire SRI/CSP as needed (Rules 7, 11).
3. For anything touching secrets: verify the `NEXT_PUBLIC_` boundary explicitly (Rule 5).
4. For EdTech data views: apply data minimization and confirm server-side role enforcement (Rules 18-19).
5. Before sign-off: run through `references/definition-of-done.md`.

## Notes
- This skill governs security specifically. For general input validation as a UX/correctness concern, see `form-handling-validation`. For error-logging infrastructure, see `api-integration`. For performance-vs-security tradeoffs on third-party scripts, see `performance-optimization`.
- Grounded in the OWASP Top 10 (2025), OWASP Cheat Sheet Series, official Next.js and Firebase security documentation, and MDN — see `references/sources.md`.
