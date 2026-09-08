---
description: Full-stack feature chain for Spellzee ERP — backend agent chain, then Figma-to-component conversion, then wiring the UI to the real API, in one command.
argument-hint: [what to build, plus a Figma link if the UI starts from a design]
---

# Build Full-Stack — Spellzee end-to-end chain

Building end to end: **$ARGUMENTS**

This chains three stages that are otherwise run by hand:

```
Stage A   /build-feature   backend: schema → gate → API → tests → audit
Stage B   Figma → UI       design conversion, presentational only
Stage C   wiring           UI ↔ real API, states, tests
```

You are the orchestrator throughout. Announce each stage. Between stages,
state in one or two lines what came back and what you are handing forward.

## Stage 0 — Preflight (do this first, before anything else)

Check three things and report all of them together. Do not start Stage A and
discover a blocker at Stage B.

1. **Is there a Figma source?** A link in `$ARGUMENTS`, or the user saying
   there is a design. If there is no design at all, this is a backend-only
   request — run `/build-feature` instead and say so.
2. **Is the Figma MCP connected?** The `figma-pixel-perfect` skill requires
   `get_design_context`, `get_screenshot` and `get_variable_defs`. If those
   tools are not available, say so now and offer the two honest options:
   - Connect the Figma MCP, then re-run.
   - Proceed **without** it — but then Stage B is a *structural
     approximation from a screenshot*, not pixel-perfect, and must be
     labelled as such. Never claim pixel accuracy without design context.
3. **Does the frontend exist yet?** If there is no Next.js app, no component
   library, no data grid and no query layer, stop and say so.
   `/CLAUDE.md` calls this a deliberate day-one decision — retrofitting a
   table abstraction across forty screens is a real cost, and it is not a
   decision to make silently mid-feature.

## Stage A — Backend

Run the full `/build-feature` chain for the backend half. Follow that command
exactly, including all of its stops:

- Phase 1 stops on a **shape-blocking** open decision.
- **Phase 3 is the schema approval gate — it always stops.**
- Phase 6 stops on a **silent architecture reversal**.

If Stage A stops at any of those, **the whole chain stops.** Do not start
Figma work on a schema the user has not approved: the design will be wired to
an API shape that may still change, and that work is thrown away.

`/build-feature` commits at its own two points — the schema gate and the end
of the backend chain. Follow it; do not add commits of your own during
Stage A.

Carry forward from Stage A: the endpoint paths, their request/response types,
their authorization requirements, pagination shape, and any policy
placeholders that affect what the UI displays.

## Stage B — Figma → components

Presentational only. No data, no API calls, no business logic.

1. Invoke `figma-pixel-perfect`. Extract **tokens first** — never guess pixel
   values from a screenshot.
2. If this touches the ongoing token/theming system rather than a one-off
   match, invoke `design-tokens` as that skill cross-references.
3. Build **atomic components first**, verify each, then compose. Diff each
   against its Figma frame before moving on.
4. Invoke `accessibility` as components are built, not afterwards.
5. Invoke `component-architecture` for structure and composition.
6. Invoke `testing-frontend` for **presentational tests only** — renders with
   the expected props, variants and interaction states behave, `jest-axe`
   passes. No network, no MSW: there is nothing to mock yet.
7. Run `figma-pixel-perfect`'s `references/definition-of-done.md` — all nine
   parts — plus the `accessibility` DoD.

Keep components **dumb**: props in, events out. A component that fetches its
own data cannot be diffed against a design or reused, and it makes Stage C's
job ambiguous.

## Stage B-gate — VISUAL APPROVAL (stop here)

**Stop. Show the user what was built and wait.**

This gate exists for the same reason the schema gate does: wiring data into
components whose visual accuracy nobody has confirmed means that when the
design turns out wrong, **the wiring is thrown away with it.** Stage C's work
is entangled with Stage B's markup — reworking a component after integration
is far more expensive than reworking it before, and the rework is silent
because the screen still "works."

Present, compactly:

- The **Figma DoD result**, item by item — what passed, what did not, and
  what could not be verified.
- **Visual diffs** where you have them; screenshots of what was built where
  you do not.
- **Known gaps** stated plainly: breakpoints not covered, interaction states
  guessed rather than specified, fonts substituted, assets missing.
- If the Figma MCP was unavailable, say clearly that this is a **structural
  approximation, not pixel-perfect**, and that the user is approving it as
  such.

Then ask plainly whether the UI is right before data goes in. **Do not start
Stage C until the user answers.** If they want changes, loop back within
Stage B and gate again — do not carry a visual fix forward into Stage C.

If the Figma DoD has unchecked items, say so at the gate rather than
proceeding and mentioning it in the final report. An unchecked item found at
Stage D has already cost the wiring work.

**On approval, commit** (see "Commits" below):

```
ui(<scope>): <components built>

Presentational components from Figma. No data wiring yet.
Figma DoD: <passed / gaps>.
```

This commit is the rollback point that makes the gate worth having: if the
design turns out wrong after integration, reset here and redo Stage B without
losing Stage A.

## Stage C — Wire it up

Now connect Stage B's components to Stage A's real API.

1. **`api-integration`** — wire to the actual endpoints from Stage A. Read
   its Spellzee scoping note first: REST + axios + RTK Query, **no Firebase,
   no realtime, no tenant scoping**. Screens that must feel current **poll**,
   with ETags and conditional requests.
2. **`state-management`** — where the fetched data lives.
3. **`form-handling-validation`** — if the feature collects input. Mirror the
   backend's validation rules; do not invent a second, looser set.
4. **`typescript-patterns`** — import the response types Stage A produced.
   Do not re-declare them by hand on the frontend: a duplicated type silently
   drifts from the API, and shared types are a main reason Next.js was chosen.
5. **`error-observability`** — every new error-prone flow.
6. **`auth-session-flows`** — if the screen is role-gated. Remember the
   backend is the authorization boundary; the UI hiding a button is not a
   permission check.
7. **`testing-frontend`** — behaviour-level tests, MSW at the network
   boundary.

Cover the four states every data-backed screen owes: loading, empty, error,
and populated. Also handle the states this backend actually produces —
something `class_creation_pending` or `stalled` needs a real UI answer, not a
spinner that never resolves. Ask Stage A's output what states exist.

### Stage C verification (before the report, not after)

1. **Behaviour tests** — `testing-frontend` with MSW at the network boundary.
   The Stage B presentational tests still pass; these add the data paths:
   loading, empty, error, populated, plus the backend's own states.
2. **Visual regression** — re-check the integrated screen against its Figma
   frame. Real data changes layout: long names wrap, empty lists collapse,
   error banners push content down. A component that was pixel-perfect in
   isolation can break once data flows through it, and that is exactly the
   failure this stage introduces.
3. **DoD pass** — the `definition-of-done.md` of every skill Stage C actually
   invoked (`api-integration`, `state-management`,
   `form-handling-validation`, `error-observability`, `auth-session-flows`,
   `testing-frontend`), plus `security-practices` and
   `performance-optimization` for the sections that apply.
4. **`code-review-checklist`** over the whole frontend diff.

If step 2 finds the design broke under real data, fix it here and re-check —
do not defer it to the report. A visual regression reported instead of fixed
is a gap the user has to reopen the whole feature to close.

**Once all four verification steps pass, commit:**

```
feat(<scope>): wire <screen> to <endpoints>

States handled: loading, empty, error, populated<, plus backend states>.
Post-integration visual re-check: <result>.
```

If a verification step fails, fix it before committing. Do not commit a
failing state and note it in the report.

## Commits

The repository is `main`, with no remote configured yet — these are local
checkpoints, not pushes. Never push unless the user asks.

**Commit only after a gate is approved, never before.** Committing the thing
the user is being asked to approve defeats the gate.

Four checkpoints across a full-stack run:

| After | Contains |
|---|---|
| Schema gate approved (Stage A) | schema, migration, constraint tests |
| Backend chain complete (Stage A) | endpoints, tests, clean erosion audit |
| Visual gate approved (Stage B) | components, presentational tests |
| Stage C verification passed | wiring, tests, visual re-check |

Each is a rollback point. That is the entire value: if the design turns out
wrong after integration, `git reset --hard` to the visual-gate commit and
redo Stage B without losing the backend.

Rules:

- **The user's "ok" at a gate is the commit approval.** Do not ask twice.
- **A rejected gate commits nothing.** Fix, re-gate, then commit.
- Stage each commit deliberately — `git add` the paths that stage produced,
  not `git add -A`, so an unrelated stray file does not ride along.
- If the working tree is dirty with unrelated changes when a stage starts,
  say so rather than sweeping them into a checkpoint.
- End every commit message with:

  ```
  Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
  ```

## Stage D — Report

One consolidated summary:

- **Backend**: endpoints built, invariants added and how enforced, policy
  placeholders outstanding, test coverage, erosion audit result.
- **UI**: components built, their Figma DoD status as approved at the visual
  gate, and — if the Figma MCP was unavailable — a clear statement that the
  result is an approximation, not pixel-perfect.
- **Wiring**: which endpoints each screen consumes, which states are handled,
  and the result of the post-integration visual re-check.
- **Unresolved**: open business decisions, unchecked DoD items, deferred
  work. Never report completion over a failing gate.

## Rules for you as orchestrator

- **Stage order is not negotiable.** Backend first — the API contract is what
  Stage C wires to. Figma work before an approved schema is work at risk.
- **Two gates always stop: the schema gate in Stage A, and the visual gate
  after Stage B.** Both exist for the same reason — downstream work is
  entangled with the thing being approved, so approving late means throwing
  away everything built on top. Never skip either because the other stage is
  waiting.
- **Never claim pixel-perfect without the Figma MCP.** Say approximation, and
  say it at the gate where the user can act on it.
- **Never let Stage B components fetch data.** That is Stage C's job, and
  mixing them makes both harder to verify.
- **Never re-declare backend types on the frontend.** Import them.
- If the user interrupts, stop cleanly and say which stage completed, which
  did not, and what is safe to resume from.
- If Stage A produces no UI-relevant surface (a worker, a migration, an
  internal integration), say so and stop after Stage A rather than inventing
  a screen for it.
