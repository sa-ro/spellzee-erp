# Definition of Done — Feature Flags & Experimentation

## 1. Setup
- [ ] Existing flagging service convention detected and followed, or the right tool chosen for the flag's complexity (env var vs. managed service)
- [ ] Flag type declared explicitly (release / experiment / kill-switch / entitlement) with an owner

## 2. Implementation
- [ ] Flag checked at a narrow, single boundary — not scattered across unrelated code
- [ ] Evaluated server-side for SSR/Server Components — no flash-of-wrong-variant on hydration
- [ ] Sensitive/paid functionality enforced server-side, not gated by the client-side flag check alone

## 3. Lifecycle
- [ ] Non-permanent flags have a stated removal condition recorded at creation
- [ ] No known-stale flags left unaddressed past their removal condition

## 4. Experimentation
- [ ] Success metric defined and recorded before the experiment launched
- [ ] Active variant attached as context on analytics events and error reports

## 5. Safety & Privacy
- [ ] Kill-switch "off" path has actually been tested, not just assumed to work
- [ ] Targeting rules don't leak sensitive user attributes/segments to the client

## Sign-off
Only mark "feature-flags: done" once all sections are checked.
