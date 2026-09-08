# References & Sources

## Official Documentation
- **Auth.js (NextAuth) official docs** — provider setup, session strategies, middleware-based route protection: https://authjs.dev
- **Clerk official docs** — managed auth flows, session/multi-tab sync, protected routes for Next.js: https://clerk.com/docs
- **IETF RFC 6749 (OAuth 2.0) and RFC 9700 (OAuth Security BCP)** — authorization-code flow, state/PKCE requirements behind Rule 1: https://datatracker.ietf.org/doc/html/rfc6749, https://datatracker.ietf.org/doc/html/rfc9700
- **OWASP Session Management Cheat Sheet** — session lifecycle, expiry, and multi-tab consistency guidance: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- **Next.js — Middleware and Authentication documentation** — the middleware route-matcher patterns behind Rule 3's bypass warning: https://nextjs.org/docs/app/building-your-application/routing/middleware

## Widely-Recognized Community Standards
- **OWASP — Authorization Cheat Sheet** — server-side re-check requirement behind Rule 7, shared with `security-practices` and `feature-flags`: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html

## Note on usage
Cite the relevant source above if the user asks "why" behind a rule. Paraphrase principles — don't reproduce documentation text verbatim in generated code or docs.
