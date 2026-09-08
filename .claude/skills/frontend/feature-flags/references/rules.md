# Feature Flags & Experimentation Rules

## Rule 1: Project-Detected Service, Managed Tooling Once Flags Proliferate
- Check for an existing flagging library/service and follow it. For a new precedent: a single simple on/off flag with no targeting can be an environment variable; once there's real targeting (percentage rollout, user cohort, A/B variants) or more than a couple of flags, use a managed service (GrowthBook or LaunchDarkly) rather than hand-rolling targeting logic.

## Rule 2: Every Flag Has an Owner and a Stated Purpose
- Before a flag is created, its type is decided explicitly: a **release flag** (temporary, gates an in-progress feature), an **experiment flag** (temporary, A/B test with a defined metric), an **ops/kill-switch flag** (permanent, an emergency off-switch), or a **permission/entitlement flag** (permanent, gates a paid tier). Each type has a different lifecycle expectation (see Rule 5) — conflating them is how flags become permanent by accident.

## Rule 3: Flag Checks at the Narrowest Useful Boundary
- The flag is checked once, at the point that decides which component/variant renders (e.g. a single conditional at the route or component-selection level) — not scattered as repeated `if (flag)` checks deep inside unrelated business logic across multiple files, which makes the flag's blast radius hard to reason about and hard to remove later.

## Rule 4: Server-Aware Evaluation for SSR/Server Components
- In a Next.js App Router app, the flag is evaluated server-side (during the Server Component render) so the initially-rendered HTML already reflects the correct variant — a client-only flag check causes a visible flash of the wrong variant on hydration, which is both a UX bug and can skew A/B test exposure data if users see the "control" flash before the "variant" applies.

## Rule 5: Every Non-Permanent Flag Has a Removal Plan from Day One
- Release and experiment flags are created with a stated removal condition (a target date, "when rollout reaches 100% for 2 weeks," "when the experiment reaches statistical significance") recorded at creation time — not left open-ended. Permanent flag types (kill switches, entitlements) are explicitly exempted from this and don't need a removal date.

## Rule 6: Stale Flags Are Actively Tracked and Removed
- Flags past their removal condition are treated as tech debt requiring cleanup, not left in the codebase indefinitely "just in case" — an accumulation of stale flags means dead code paths, increased QA surface (every flag combination is technically a distinct app state), and eventual confusion about which path is actually live. A periodic flag audit (who owns it, is it past its removal date) is part of the team's regular hygiene, cross-referencing `code-review-checklist`.

## Rule 7: A/B Test Flags Have a Defined Success Metric Before Launch
- An experiment's success metric (the specific number that determines whether the variant wins) is defined and recorded before the experiment launches — deciding "what counts as success" after looking at results is p-hacking and invalidates the experiment's statistical validity.

## Rule 8: Flag State Attached as Context on Analytics/Errors
- The active variant/flag state for a user is attached as context on analytics events and error reports (e.g. a Sentry tag, an analytics event property) — without this, a bug or metric shift that only affects one variant is invisible/unattributable in monitoring, and debugging "why did errors spike" can't be correlated to a specific rollout.

## Rule 9: Kill Switches Are Tested Before They're Needed
- A kill-switch flag's "off" path is actually exercised (in staging, or via a controlled toggle test) before the risky feature it protects ships to production — a kill switch that's never been flipped is unverified and may not actually work when it's needed under incident pressure.

## Rule 10: Sensitive/Paid Features Are Never Gated Client-Only
- A flag controlling access to a paid tier or restricted feature is enforced server-side (API/data layer) as the real authorization boundary — the client-side flag check only controls UI visibility/UX, per `security-practices`'s Rule 2. A user with a client-side flag manually flipped must not gain access to gated functionality the server doesn't actually authorize.

## Rule 11: Targeting Rules Respect Privacy
- Flag targeting rules (which cohort sees which variant) don't leak sensitive user attributes into client-visible configuration — targeting evaluation happens server-side or through the flagging SDK's privacy-respecting client evaluation (hashed/anonymized identifiers), not by shipping a raw list of user segments or attributes to the browser.
