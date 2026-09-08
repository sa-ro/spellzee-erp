---
name: state-management
description: Use this skill whenever the user is deciding where state should live, structuring a Zustand store, working with TanStack Query, deciding between a store and the URL, or debugging state-sync/re-render issues in a React/Next.js app. Trigger for phrases like "should this be in Zustand or Redux", "where should I store this state", "my component re-renders too much", "how do I structure this store/slice", "cache invalidation", "optimistic update", or any request involving global state, server state, or Firebase listeners. Also trigger for Definition of Done review on a state-management feature.
---

# State Management Skill

Defines how state is categorized, structured, and synchronized across a React/Next.js app using **Zustand** for client state and **TanStack Query** for server state — so state has one source of truth and no category-mixing bugs.

## Spellzee scoping (read before applying the rules below)

**Step 0's "ask the user which library" is already answered here.** Do not re-open it; do not introduce Redux Toolkit alongside.

| Category | Where it lives |
|---|---|
| Server state | **TanStack Query** — never duplicated into a client store |
| **Table filters, sort, page** | **The URL** (`nuqs` or `useSearchParams`) |
| Row selection, drawer/modal open | UI-local — TanStack Table's own state where it has one |
| Theme, density, sidebar collapsed | **Zustand** — one small store |
| Forms | `react-hook-form` + `zod`, per `form-handling-validation` |

Three consequences worth stating plainly:

- **Rule 3 holds, with a different tool.** "Server state → RTK Query only" reads here as "server state → TanStack Query only". The prohibition is the point: never copy fetched data into Zustand.
- **Rule 9 (Firebase realtime) does not apply.** Firestore was rejected and there are no listeners — internal dashboards poll. See `api-integration`'s scoping note.
- **Filters belong in the URL, not a store.** A coordinator saying *"send me that filtered list"* has to be able to paste a link, and refresh and back must both work. A filter in a Zustand store breaks all three silently.

The client-global surface here is genuinely small — a handful of preferences — which is why Zustand suits it and why Redux Toolkit would be weight without a use. `tradeoff-library.md` decision 10 carries the reasoning and the reversal trigger.

## Step 0: Detect Project Context Before Applying Any Rule

**Always do this first, before writing any state-management code.**

**Is this an existing project?**
- Check `package.json` for `@reduxjs/toolkit`, `redux`, or `zustand` as dependencies.
- Check for existing store/slice files (`store.ts`, `*Slice.ts`, `/store`, `/features/*/store`, `create(` usage patterns).
- **If a library is already in use: follow it. Do not suggest switching, do not introduce the other library alongside it, do not re-litigate the choice.** Match the existing project's conventions (folder structure, naming, whether slices are normalized, etc.) even if they differ slightly from the ideal patterns below — consistency with the existing codebase outranks textbook-perfect structure for a single new feature.
- If the existing project mixes both libraries already (technical debt from before this skill existed), don't silently pick one — flag it to the user and ask whether to consolidate or keep both scoped to their current areas.

**Is this a new project / first state-management decision in this codebase?**
- **On Spellzee this is already answered — Zustand, with TanStack Query for server state.** Do not ask again and do not weigh Redux Toolkit; see the scoping note above.
- *(On any other project: do not assume a default. Ask about scope, then apply Rule 1a's criteria.)*

**TypeScript is non-negotiable in either case.** No `any`, no untyped stores, ever.

## When to use this
- Deciding whether something belongs in a global store, Context, local state, URL, or a form library
- Structuring a Zustand store or a TanStack Query hook
- Debugging unnecessary re-renders or stale/duplicated data
- Reviewing a PR or running Definition of Done for a state-related feature

## Core principles (see `references/rules.md` for full detail with rationale)

1. **Categorize state first** — server / client-global / UI-local / URL / form — before picking a tool
2. **One global-state library, applied consistently** — here, Zustand. Never mix in a second for the same state category; TypeScript is non-negotiable
3. **Server state → TanStack Query only** — never duplicate fetched data into a client store
4. **Normalize entity collections** where a client store genuinely holds one — `{ ids, entities }`. TanStack Query's cache is already keyed, so this rarely applies here
5. **Derived data is computed, never stored** — memoized selectors, not extra state fields
6. **Selectors: memoized and narrow** — avoid over-selecting and causing unrelated re-renders
7. **Not everything needs a global store** — local state stays local until an actual sharing need exists
8. **Context vs global store — explicit boundary** — Context for low-frequency broad reads, Zustand/Redux for frequent/multi-writer state
9. **One consistent async pattern** — TanStack Query for fetching; a plain function for a side effect that is not a fetch (there are no thunks here)
10. ~~**Firebase listener lifecycle**~~ — **not applicable**: no Firebase, no realtime. Dashboards poll
11. **Explicit cache invalidation** — tags, not scattered manual refetches
12. **Optimistic updates need rollback paths** — never silent-fail on network error
13. **Granular loading states** — per-request, not one global spinner
14. **Consistent error shape** — generic error UI across features
15. **Never store sensitive data in serializable global state** — tokens/PII excluded from DevTools-visible/persisted state
16. **Persistence allowlist, not denylist**
17. **State colocation** — state lives where it's used until promotion is actually justified
18. **Pure, testable reducers/selectors** — no side effects inside store logic
19. **Store devtools disabled in production**

## Workflow

1. **Step 0 first, always**: detect existing project context (see above) — follow existing library, or ask+recommend for new projects.
2. When a new piece of state is introduced: categorize it first (Rule 1). If it is a table filter, sort or page, it goes in the **URL** — not a store.
3. When structuring a store/slice: normalize collections, keep derived values out, write narrow memoized selectors, ensure full TypeScript typing.
4. When wiring async: TanStack Query with a keyed query-key factory and explicit `invalidateQueries`; add rollback for any optimistic update.
6. Before sign-off: run through `references/definition-of-done.md`.

## Notes
- This skill governs where/how state lives. For component structure itself, see `component-architecture`. For form-specific state (validation, dirty/touched), see `form-handling-validation`.
- Grounded in official Zustand/TanStack Query/React docs (the Redux Toolkit and Firebase sources in `references/sources.md` are retained for the general principles, not as this project's tooling) and recognized community authorities (Mark Erikson, TkDodo, Kent C. Dodds) — see `references/sources.md`.
