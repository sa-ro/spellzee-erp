# Auth & Session Flows Rules

## Rule 1: Project-Detected Auth Library, Never Hand-Rolled OAuth
- Check for an existing auth library/context and follow it. For a new precedent, default to Auth.js (NextAuth) for flexible multi-provider (OAuth + credentials) needs, or Clerk for a fully managed option. Never hand-implement the OAuth authorization-code/PKCE flow, state/nonce validation, or JWT verification from scratch — these are security-critical and a single mistake (missing state validation, weak nonce) creates a real vulnerability.

## Rule 2: Token Storage Follows `security-practices`'s Threat Model
- Where and how tokens/session data are stored (httpOnly cookie vs. memory, refresh-token rotation) is governed by `security-practices`'s existing rules — this skill does not redefine storage mechanics, it defines the *flow* around whatever storage mechanism that skill specifies (when to redirect, when to refresh, how to recover from expiry).

## Rule 3: Protected Routes Check Auth Server-Side First
- Route protection is enforced in Next.js middleware or a Server Component's server-side session check — a client-side `useEffect` that redirects unauthenticated users is a UX nicety layered on top, never the actual boundary, since it briefly renders the protected UI (or its data-fetch triggers) before the redirect fires. This mirrors `feature-flags`'s and `security-practices`'s "never trust the client" principle applied to route access.
- Be aware of and explicitly test for the middleware-based-auth-bypass class of bug (a route matcher gap, a static asset path unintentionally treated as protected/unprotected) — this is one of the most common real-world Next.js auth foot-guns.

## Rule 4: Post-Login Redirect Returns the User to Where They Were
- The login flow captures the originally-requested URL (the page that triggered the auth redirect) and returns the user there after successful login — not unconditionally to a generic dashboard. A student who clicked a specific course link while logged out should land back on that course, not have to re-navigate.
- The captured return URL is validated against an allowlist of same-origin paths before being used as a redirect target, to prevent it being used as an open-redirect vector.

## Rule 5: Silent Token Refresh Happens Ahead of Expiry
- Access tokens are refreshed proactively (a timer/interceptor that refreshes shortly before expiry, or on the auth library's built-in refresh mechanism) as the **primary** refresh path — reactive-only refresh (refreshing only after a request has already failed with a 401) means the user's in-flight request visibly fails and has to be retried, which is a jarring UX for something that should be invisible.
- `api-integration`'s Rule 6 response-interceptor refresh-on-401 is not a competing approach — it's this rule's safety net for the cases proactive refresh doesn't catch (clock skew, a token revoked server-side mid-session). The two are layered, not alternatives.

## Rule 6: Session Expiry Mid-Action Never Silently Discards Work
- If a session expires while a user is mid-action (filling a form, mid-assessment), the app does not simply redirect to login and lose unsaved state — it either refreshes the session transparently if still possible, or preserves the in-progress state (via `form-handling-validation`'s autosave) so the user can resume immediately after re-authenticating. This is especially critical during a timed assessment, where losing state to an auth redirect is both a UX failure and a fairness/grading issue.

## Rule 7: Role/Permission Checks Are Duplicated Server-Side
- UI elements gated by role/permission (an "Edit Course" button shown only to instructors) reflect the real authorization decision but are never the actual enforcement — the corresponding action's API/Server Action independently re-checks the same permission, per `security-practices`'s Rule 2. A user who manipulates client state to reveal a hidden button must not thereby gain the ability to perform the action.

## Rule 8: Auth State Is a Single Source of Truth
- The current user/session is read from one place (the auth library's session hook/context, or a single derived store per `state-management`'s conventions) — not independently fetched or cached in multiple components/contexts that can desynchronize (one showing logged-in, another briefly showing logged-out after a token refresh).

## Rule 9: Logout Clears All Client-Held State
- Logging out clears not just the auth token but any user-scoped cached data, service-worker caches holding user-specific responses (per `pwa-offline`'s cache-clearing rule), and in-memory application state (per `state-management`) — a subsequent login by a different user on the same device must never see the previous user's leftover cached data.

## Rule 10: OAuth/SSO Errors Surfaced with Actionable Messaging
- A failed OAuth/SSO flow (provider denied access, network failure during the exchange, misconfigured redirect URI) shows the user a specific, actionable message ("Google sign-in was cancelled" vs. a generic "Something went wrong") and a clear retry path — a bare redirect to a generic error page with no context leaves the user unable to tell whether to retry, use a different method, or contact support.

## Rule 11: Multi-Tab Session State Stays Consistent
- Logging out (or a session expiring) in one browser tab is reflected in other open tabs of the same app (via a `storage` event listener on the auth token/flag, or the auth library's built-in cross-tab sync) — a stale tab that still appears logged in after logout elsewhere is both confusing and a security concern on a shared device.

## Rule 12: Loading/Auth-Checking States Are Explicit
- While the app is determining the current auth state (initial load, a refresh in progress), the UI shows an explicit loading state — never a flash of logged-out content, a flash of the wrong role's UI, or a flash of protected content before the real check resolves. This is the auth-specific application of avoiding hydration/state-resolution flashes, relevant to both UX polish and avoiding a moment where unauthorized content is briefly visible.
