---
name: feature-flags
description: Use this skill whenever the user is gating a feature behind a flag, running an A/B test/experiment, doing a gradual/percentage rollout, or cleaning up stale flags. Trigger for phrases like "feature flag this", "put this behind a flag", "A/B test", "gradual rollout", "kill switch", "LaunchDarkly", "GrowthBook", "remove this old flag", or any request involving conditional feature gating, experimentation, or canary releases. Also trigger for Definition of Done review when a feature ships behind a flag.
---

# Feature Flags & Experimentation Skill

Defines how features are gated, rolled out gradually, A/B tested, and eventually cleaned up — using a project-detected flagging service, with explicit rules on flag lifecycle so flags don't become permanent, undocumented branches in the codebase.

## Step 0: Detect Project Context Before Applying Any Rule

**Existing project?**
- Check `package.json` for `launchdarkly-*`, `@growthbook/growthbook-react`, `unleash-client`, `posthog-js` (feature flags), or a custom flag service wrapper. Follow whatever is already established.

**New project / no precedent?**
- Recommend a managed service (**GrowthBook** or **LaunchDarkly**) over a hand-rolled flag system once there's more than a couple of flags — a custom system reinvents targeting, percentage rollout, and kill-switch behavior that's already solved.
- For a single simple on/off flag with no targeting need, an environment variable is acceptable and doesn't need a flagging service.

## When to use this
- Gating a new feature behind a flag before full release
- Running an A/B test/experiment and reading its results
- Doing a percentage-based gradual rollout or canary release
- Adding a kill switch for a risky feature
- Removing a stale flag after a feature has fully shipped or been rejected
- Reviewing a PR or running Definition of Done when a feature ships behind a flag

## Core principles (see `references/rules.md` for full detail with rationale)

1. **Project-detected flagging service, GrowthBook/LaunchDarkly once flags proliferate beyond simple env vars**
2. **Every flag has an owner and a stated purpose** — release gate, experiment, or permanent kill switch, decided upfront
3. **Flag checks happen at the narrowest useful boundary**, not scattered `if (flag)` checks throughout unrelated code
4. **Flag evaluation is server-aware for SSR/Server Components** — no flash of wrong variant on hydration
5. **Every non-permanent flag has a removal plan from day one** — a target date or completion condition, not "someday"
6. **Stale flags are actively tracked and removed**, not left accumulating as permanent dead branches
7. **A/B test flags have a defined success metric before launch**, not decided after looking at results
8. **Flag state doesn't fragment analytics/error tracking** — variant is attached as context on events/errors
9. **Kill switches are tested before they're needed** — verify the off-path actually works, not just the on-path
10. **Sensitive/paid features are never gated by a client-only flag check alone** — server-side enforcement is the real boundary
11. **Flags targeting a cohort respect privacy** — targeting rules don't leak sensitive user attributes into client-visible config

## Workflow

1. **Step 0 first, always**: detect existing flagging service, or use env vars for a single simple flag / a managed service once flags multiply.
2. Define the flag's purpose and owner, and its removal condition, before writing the gated code.
3. Place the flag check at the narrowest boundary (component-level, not scattered).
4. For experiments: define the success metric before launch, and tag analytics events with the variant.
5. Before sign-off: run through `references/definition-of-done.md`.

## Notes
- This skill governs flag lifecycle, evaluation, and experimentation discipline. For where flag-derived state lives in the app (client global state), see `state-management`. For enforcing paid/gated features server-side, see `api-integration` and `security-practices`.
- Grounded in official GrowthBook, LaunchDarkly, and Martin Fowler's feature-toggle documentation — see `references/sources.md`.
