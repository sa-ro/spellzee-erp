---
name: auth-session-flows
description: Use this skill whenever the user is building or reviewing frontend authentication/session flows — login/signup UX, OAuth/SSO redirect handling, protected routes, session/token refresh, "logged out mid-action" handling, or role-based UI gating. Trigger for phrases like "add login", "OAuth flow", "SSO", "protected route", "redirect after login", "session expired", "refresh token", "logged out while submitting", "role-based access in the UI", or any request involving NextAuth/Auth.js, Clerk, or a custom auth flow. Also trigger for Definition of Done review on an authentication/session feature. Distinct from `security-practices`, which covers the underlying token-storage/XSS/CSRF threat model this skill's flows must satisfy.
---

# Auth & Session Flows Skill

Defines the frontend architecture for authentication and session lifecycle — login/signup UX, OAuth/SSO redirects, protected routes, silent token refresh, and graceful handling of a session expiring mid-action — built on top of `security-practices`'s token-storage/threat-model rules.

## Step 0: Detect Project Context Before Applying Any Rule

**Existing project?**
- Check `package.json` for `next-auth`/`@auth/*`, `@clerk/nextjs`, `@auth0/nextjs-auth0`, `@supabase/auth-helpers`, or a custom auth context. Follow whatever is already established.

**New project / no precedent?**
- Default to **Auth.js (NextAuth)** for a Next.js app needing flexible provider support (OAuth + credentials), or **Clerk** when the team wants a fully managed auth UI/backend and is willing to take the vendor dependency. Don't hand-roll OAuth redirect/PKCE flows from scratch — this is a well-solved, security-sensitive problem.

## When to use this
- Building login/signup UX, including OAuth/SSO provider buttons
- Implementing protected routes / role-based UI gating
- Handling token/session refresh, including silent refresh
- Handling a session expiring while a user is mid-action (e.g. mid-quiz)
- Diagnosing an auth redirect loop or "logged in but treated as logged out" bug
- Reviewing a PR or Definition of Done for an authentication/session feature

## Core principles (see `references/rules.md` for full detail with rationale)

1. **Project-detected auth library; Auth.js/Clerk as the default** — never hand-rolled OAuth/PKCE
2. **Token storage follows `security-practices`'s threat model** — this skill owns the flow, not the storage mechanism
3. **Protected routes check auth server-side (middleware/Server Component), not only client-side redirect**
4. **Post-login redirect returns the user to where they were**, not always to a generic dashboard
5. **Silent token refresh happens ahead of expiry**, not reactively after a request already failed
6. **A session expiring mid-action never silently discards work** — cross-references `form-handling-validation`'s autosave and this skill's own recovery flow
7. **Role/permission checks are duplicated server-side** — UI-level role gating is UX only, never the real authorization boundary
8. **Auth state is a single source of truth**, not duplicated/desynced across multiple contexts or stores
9. **Logout clears all client-held state**, not just the auth token — cross-references `pwa-offline`'s cache-clearing rule
10. **OAuth/SSO errors are surfaced with actionable messaging**, not a bare redirect to an error page
11. **Multi-tab session state stays consistent** — logging out in one tab reflects in others
12. **Loading/auth-checking states are explicit** — no flash of logged-out (or wrong-role) content before the real auth state resolves

## Workflow

1. **Step 0 first, always**: detect existing auth library, or set Auth.js/Clerk as the standard.
2. Implement protected routes with server-side auth checks first; client-side is a UX layer on top, not the boundary.
3. Wire silent token refresh and post-login redirect-back before building out further UI.
4. Handle session-expiry-mid-action recovery for any long-running flow (forms, assessments).
5. Before sign-off: run through `references/definition-of-done.md`.

## Notes
- This skill governs the frontend flow/UX of authentication and session lifecycle. For token storage mechanism and the underlying XSS/CSRF threat model, see `security-practices`. For preserving in-progress form/assessment state across a session interruption, see `form-handling-validation` and `error-observability`.
- Grounded in official Auth.js, Clerk, OAuth 2.0/OIDC (IETF), and OWASP Session Management documentation — see `references/sources.md`.
