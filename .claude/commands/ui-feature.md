---
description: Frontend feature workflow — conditional Figma-to-component build, full UI implementation, and pre-release checklist, chained in one command. UI only; backend goes through /api-feature.
argument-hint: [feature description, and/or a Figma link if starting from a design]
---

# UI Feature — Frontend Workflow

You are running the combined 3-phase **frontend** feature-delivery workflow, driven by this project's frontend skill library (`.claude/skills/frontend/`). The user's request: $ARGUMENTS

**Scope: UI only.** Backend work — schema, API, workers, integrations — goes through `/api-feature`, which runs the agent chain with its schema approval gate. If this request needs an endpoint that does not exist yet, stop and say so: run `/api-feature` first, or `/build-fullstack` to do both in order. Do not build a backend here, and do not mock an endpoint into existence to get the UI working.

Work through the phases below **in order**. Do not skip a phase silently — if a phase doesn't apply, say so explicitly and move on. Announce which phase you're entering before starting it, so the user can follow along.

## Phase 0 — Preflight (always runs, before anything else)

Check these up front and report them together. Do not build for an hour and then discover a blocker.

1. **Does the endpoint this UI needs exist?** If the screen needs an API that has not been built, stop and say so — run `/api-feature` first, or `/build-fullstack` to do both in order. Never mock an endpoint into existence to get a screen working: the mock becomes the contract, and it drifts from the real one silently.
2. **Is there a Figma source?** A link in the request, or the user saying there is a design. If not, Phase 1 does not apply — say so and go to Phase 2.
3. **Is the Figma MCP connected?** `figma-pixel-perfect` requires `get_design_context`, `get_screenshot` and `get_variable_defs`. If those tools are not available, say so **now** and offer the two honest options:
   - Connect the Figma MCP, then re-run.
   - Proceed **without** it — but then Phase 1 produces a *structural approximation from a screenshot*, not pixel-perfect work, and must be labelled that way at the gate and in the final report. **Never claim pixel accuracy without design context.**
4. **Does the frontend scaffold exist?** If there is no Next.js app, no component library, no data grid and no query layer, stop. `/CLAUDE.md` calls that a deliberate day-one decision — retrofitting a table abstraction across forty screens is a real cost, and it is not a decision to make silently mid-feature.

## Phase 1 — UI Build (conditional: only if this feature needs new/changed UI from a design)

**Trigger condition**: the request includes a Figma link/screenshot, or clearly requires building new visual components (not a backend-logic-only or pure data-wiring change).

If triggered:
1. Invoke the `figma-pixel-perfect` skill. Extract **tokens first** — never guess pixel values from a screenshot.
2. If this touches the ongoing token/theming system (not a one-off match), invoke the `design-tokens` skill per `figma-pixel-perfect`'s own cross-reference to it.
3. Build **atomic components first**, verify each, then compose. Diff each against its Figma frame before moving on.
4. Invoke the `accessibility` skill on the new component(s) as they're built, not as an afterthought.
5. Invoke `component-architecture` for structure and composition.
6. Invoke `testing-frontend` for **presentational tests only** — renders with the expected props, variants and interaction states behave, `jest-axe` passes. No network, no MSW: there is nothing to mock yet.
7. Run `figma-pixel-perfect`'s `references/definition-of-done.md` — all nine parts — plus the `accessibility` DoD.

Keep components **dumb**: props in, events out. A component that fetches its own data cannot be diffed against a design or reused, and it blurs the line between Phase 1 and Phase 2.

If not triggered: state that this feature has no new-UI-from-design component, and go straight to Phase 2.

## Phase 1-gate — VISUAL APPROVAL (stop here; skip only if Phase 1 did not run)

**Stop. Show the user what was built and wait.**

Wiring data into components whose visual accuracy nobody has confirmed means that when the design turns out wrong, **the wiring is thrown away with it.** Phase 2's work is entangled with Phase 1's markup — reworking a component after integration costs far more than reworking it before, and the rework is silent, because the screen still "works."

Present, compactly:

- The **Figma DoD result**, item by item — what passed, what did not, and what could not be verified.
- **Visual diffs** where you have them; screenshots of what was built where you do not.
- **Known gaps** stated plainly: breakpoints not covered, interaction states guessed rather than specified, fonts substituted, assets missing.
- If the Figma MCP was unavailable, say clearly that this is a **structural approximation, not pixel-perfect**, and that the user is approving it as such.

Then ask plainly whether the UI is right before data goes in. **Do not start Phase 2 until the user answers.** If they want changes, loop back within Phase 1 and gate again — do not carry a visual fix forward into Phase 2.

An unchecked DoD item belongs at this gate, not in the final report. Found at Phase 3, it has already cost the wiring work.

**On approval, commit:**

```
ui(<scope>): <components built>

Presentational components from Figma. No data wiring yet.
Figma DoD: <passed / gaps>.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

This commit is the rollback point that makes the gate worth having: if the design turns out wrong after integration, reset here and redo Phase 1 without losing the wiring decisions or anything before it. Commit only **after** approval — committing the thing being approved defeats the gate, and a rejected gate commits nothing.

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

This phase does not build anything — it verifies.

**First, if Phase 1 ran: re-check the design against real data.** Real data changes layout — long names wrap, empty lists collapse, error banners push content down. A component that was pixel-perfect in isolation can break once data flows through it, and that regression is introduced by Phase 2, so it is caught here. **Fix it now**; do not report it as a known gap. A visual regression reported instead of fixed is something the user has to reopen the whole feature to close.

Then, for every skill actually invoked in Phase 1 and Phase 2, pull up that skill's `references/definition-of-done.md` and walk through it against the actual code produced. Do not re-verify skills that were never relevant to this feature (e.g. don't run the `payments-checkout` DoD on a feature with no payment surface).

Additionally, always check these regardless of what else applied, since they're cross-cutting release concerns:
- `security-practices` DoD (relevant sections only — e.g. skip payment-specific items if this feature has no payment surface)
- `performance-optimization` DoD (relevant sections)
- `error-observability` DoD, if any new error-prone flow was introduced

Report the result as a single consolidated checklist: which skills' DoDs were checked, which items passed, which items are unresolved (and why — genuinely not applicable vs. actually incomplete). A feature is not "ready to ship" until every applicable item is either checked or explicitly and deliberately deferred with the user's sign-off — never silently skipped.

Also state in the report:

- Which endpoints each screen consumes.
- Which states are handled — loading, empty, error, populated, plus any backend state this screen must answer for (`class_creation_pending`, `stalled`).
- **If the Figma MCP was unavailable**, that the UI is a structural approximation, not pixel-perfect.
- The result of the post-integration visual re-check.

**On a clean Phase 3, commit:**

```
feat(<scope>): <screen> wired to <endpoints>

States handled: loading, empty, error, populated<, plus backend states>.
Post-integration visual re-check: <result>.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

If a DoD item failed, fix it before committing. Do not commit a failing state and note it in the report. Stage the paths this run produced, not `git add -A`.

## Notes
- This command exists to sequence the skill library, not replace it — the actual rules/rationale live in each skill's own files. This command's job is ordering and gating, not restating content.
- **UI only.** Backend work goes through `/api-feature`; both together go through `/build-fullstack`.
- If the user only wants one phase (e.g. "just run the pre-release check on what I already built"), it's fine to run that phase alone rather than the full chain — use judgment based on what's actually being asked. The visual gate still applies to any run where Phase 1 built something.
