# References & Sources

## Official Standards & Documentation
- **OWASP Top 10 (2025 edition — current released version)** — the baseline framework for this skill's risk categories (Broken Access Control, Cryptographic Failures, Injection, Security Misconfiguration, Vulnerable Components, Identification/Authentication Failures, Software/Data Integrity Failures, Logging/Monitoring Failures): https://owasp.org/www-project-top-ten/
- **Next.js official docs — Data Security (environment variables, `server-only` package)** — the mechanism behind the `NEXT_PUBLIC_` prefix rule and preventing server code leaking to Client Components: https://nextjs.org/docs/app/guides/data-security
- **Firebase official docs — Security Rules** — least-privilege/deny-by-default rule design: https://firebase.google.com/docs/rules
- **MDN — `crypto.randomUUID()` / `crypto.getRandomValues()`** — cryptographically secure randomness, the basis for the randomness rule: https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID
- **MDN — Content-Security-Policy** — CSP directive reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy
- **MDN — Subresource Integrity (SRI)**: https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity
- **OWASP Cheat Sheet Series — CSRF Prevention, Session Management, Authentication** — practical mitigation guidance underlying Rules 4, 6, 14, 26: https://cheatsheetseries.owasp.org

## Widely-Recognized Community Standards
- **npm/Node.js security advisories and `npm audit`** — the standard tool for dependency vulnerability scanning
- **Industry supply-chain-attack incident reporting (e.g. compromised npm packages via postinstall scripts)** — the basis for Rule 27's install-script scrutiny

## Note on usage
Cite the relevant source above if the user asks "why" behind a rule. Paraphrase principles — don't reproduce documentation text verbatim in generated code or docs.
