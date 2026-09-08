---
description: End-to-end feature workflow — conditional Figma-to-component build, full feature implementation, and pre-release checklist, chained in one command.
argument-hint: [feature description, and/or a Figma link if starting from a design]
---

# Ship Feature — Combined Workflow

You are running the combined 3-phase **frontend** feature-delivery workflow, driven by this project's frontend skill library (`.claude/skills/frontend/`). The user's request: $ARGUMENTS

**Scope: UI only.** Backend work — schema, API, workers, integrations — goes through `/build-feature`, which runs the agent chain with its schema approval gate. If this request needs an endpoint that does not exist yet, stop and say so: run `/build-feature` first, or `/build-fullstack` to do both in order. Do not build a backend here, and do not mock an endpoint into existence to get the UI working.

Work through the phases below **in order**. Do not skip a phase silently — if a phase doesn't apply, say so explicitly and move on. Announce which phase you're entering before starting it, so the user can follow along.

## Phase 1 — UI Build (conditional: only if this feature needs new/changed UI from a design)

**Trigger condition**: the request includes a Figma link/screenshot, or clearly requires building new visual components (not a backend-logic-only or pure data-wiring change).

If triggered:
1. Invoke the `figma-pixel-perfect` skill to extract tokens and build the component(s) atomic-first, per its workflow.
2. If this touches the ongoing token/theming system (not a one-off match), invoke the `design-tokens` skill per `figma-pixel-perfect`'s own cross-reference to it.
3. Invoke the `accessibility` skill on the new component(s) as they're built, not as an afterthought.
4. Run `figma-pixel-perfect`'s `references/definition-of-done.md` checklist before moving to Phase 2. Do not proceed with an unchecked item unresolved — either fix it or explicitly flag it to the user as a known gap.

If not triggered: state that this feature has no new-UI-from-design component, and go straight to Phase 2.

## Phase 2 — Feature Build (always runs)

Build the feature end-to-end. Determine which of the 28 skills in `.claude/skills/frontend/` actually apply to this specific feature — don't invoke all 28, only the ones the feature's surface actually touches. Typical candidates to check against the request:

- `component-architecture` — structure/composition for any new component (almost always applies if there's UI)
- `state-management` / `api-integration` — if the feature reads/writes data
- `form-handling-validation` — if the feature includes any input collection
- `typescript-patterns` — for any generic/polymorphic/discriminated-union typing need
- `auth-session-flows` — if the feature is behind login or role-gated
- `i18n-l10n` — if user-facing strings are added
- `animation-motion` — if transitions/motion are part of the feature
- Any of the product-surface skills (`video-player-architecture`, `realtime-collaboration`, `payments-checkout`, `search-discovery`, `data-viz-dashboards`, `rich-text-editing`, `notifications`, `feature-flags`, `seo-metadata`, `pwa-offline`) if the feature falls in that domain
- `error-observability` — for any new error-prone flow (submissions, payments, live sessions)
- `testing-frontend` — always, once the feature's logic/UI is in place
- `documentation-storybook` — always, for any new/changed component

Invoke each applicable skill as you build the relevant part — don't front-load every skill's rules into one pass; pull each one in when you reach the part of the build it governs. Build in this rough internal order where applicable: structure → state/data → forms → accessibility → motion → tests → docs.

When the build is functionally complete, invoke the `code-review-checklist` skill and self-review the diff against it before calling Phase 2 done.

## Phase 3 — Pre-Release Checklist (always runs, always last)

This phase does not build anything — it verifies. For every skill actually invoked in Phase 1 and Phase 2, pull up that skill's `references/definition-of-done.md` and walk through it against the actual code produced. Do not re-verify skills that were never relevant to this feature (e.g. don't run the `payments-checkout` DoD on a feature with no payment surface).

Additionally, always check these regardless of what else applied, since they're cross-cutting release concerns:
- `security-practices` DoD (relevant sections only — e.g. skip payment-specific items if this feature has no payment surface)
- `performance-optimization` DoD (relevant sections)
- `error-observability` DoD, if any new error-prone flow was introduced

Report the result as a single consolidated checklist: which skills' DoDs were checked, which items passed, which items are unresolved (and why — genuinely not applicable vs. actually incomplete). A feature is not "ready to ship" until every applicable item is either checked or explicitly and deliberately deferred with the user's sign-off — never silently skipped.

## Notes
- This command exists to sequence the skill library, not replace it — the actual rules/rationale live in each skill's own files. This command's job is ordering and gating, not restating content.
- If the user only wants one phase (e.g. "just run the pre-release check on what I already built"), it's fine to run that phase alone rather than the full chain — use judgment based on what's actually being asked.
