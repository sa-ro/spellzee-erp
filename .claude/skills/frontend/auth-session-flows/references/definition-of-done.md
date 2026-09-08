# Definition of Done — Auth & Session Flows

## 1. Setup
- [ ] Existing auth library convention detected and followed, or Auth.js/Clerk used for a new precedent
- [ ] No hand-rolled OAuth/PKCE/JWT-verification logic

## 2. Route Protection
- [ ] Protected routes checked server-side (middleware/Server Component), not only client-side redirect
- [ ] Middleware route matcher explicitly reviewed for gaps (the auth-bypass foot-gun)

## 3. Login/Redirect Flow
- [ ] Post-login redirect returns to the originally-requested page, validated against a same-origin allowlist
- [ ] OAuth/SSO failures show specific, actionable error messaging with a retry path

## 4. Token/Session Lifecycle
- [ ] Token refresh happens proactively ahead of expiry, not only reactively after a failed request
- [ ] Session expiry mid-action preserves in-progress state (autosave) or transparently refreshes — never silently discards work

## 5. Authorization
- [ ] Every UI-level role/permission gate has a matching server-side check on the actual action

## 6. State Consistency
- [ ] Auth state read from one single source of truth across the app
- [ ] Logout clears user-scoped cached data, service-worker caches, and in-memory state
- [ ] Logout/session-expiry in one tab reflects in other open tabs

## 7. Loading UX
- [ ] No flash of logged-out, wrong-role, or protected content before the real auth state resolves

## Sign-off
Only mark "auth-session-flows: done" once all sections are checked.
