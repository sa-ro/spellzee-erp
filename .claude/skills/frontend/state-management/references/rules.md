# State Management Rules

> ## Spellzee: read this before applying any rule below
>
> These rules were written against **RTK Query + Firebase**, with the global-state library
> left open. Both are settled here.
>
> | Rule | As written | Here |
> |---|---|---|
> | **1** | Server state → RTK Query owns it | **TanStack Query** owns it. The prohibition is the point and still holds: never copy fetched data into a client store |
> | **1a** | Choose Zustand or Redux Toolkit by project scope | **Answered: Zustand.** Do not re-open it, do not add Redux Toolkit alongside |
> | **4** | Normalize via `createEntityAdapter` | TanStack Query's cache is already keyed by query key. Normalize by hand only where a client store genuinely holds a collection — which here it does not |
> | **9** | RTK Query for fetching, thunks for other side effects | TanStack Query for fetching. There are no thunks; a side effect that is not a fetch is a plain function |
> | Firebase rules | listeners, realtime sync | **Do not apply** — no Firebase, no realtime. Dashboards poll |
>
> **The client-global surface here is deliberately tiny** — theme, density, sidebar
> collapsed. That is what Zustand holds, and it is the whole of it.
>
> **Rule 1's URL-state category carries more weight on this project than usual.** Table
> filters, sort and page belong in the URL, not in Zustand. A coordinator saying *"send me
> that filtered list"* must be able to paste a link, and refresh and back must both work —
> a filter in a client store breaks all three silently, and nothing fails loudly when it does.
>
> See `tradeoff-library.md` decision 10.

## Rule 1: Categorize State Before Choosing a Tool
Every piece of state falls into one of 5 categories — identify which one BEFORE deciding where it lives:
- **Server state** — data fetched from an API/GraphQL/Firebase (RTK Query owns this, never Redux/Zustand slices)
- **Client/global state** — app-wide state not tied to a server (auth session, theme, feature flags) → **Zustand or Redux Toolkit, chosen by project scope** (see Rule 1a), or Context for low-frequency reads
- **UI state** — local, ephemeral (modal open/closed, tab selected, hover) → `useState`/`useReducer`, never global
- **URL state** — anything that should be shareable/bookmarkable/back-button-able (filters, pagination, selected tab) → URL search params, not a global store
- **Form state** — input values, validation, dirty/touched flags → form library (react-hook-form), not a global store
- Mixing these categories into one bucket (usually: dumping everything into one global store) is the single most common state-management mistake.

## Rule 1a: Global-State Library — Chosen by Project Scope, Applied Consistently
- Decide between **Zustand** and **Redux Toolkit** per-project based on scope, not by default or personal preference:
  - **Zustand** — smaller/medium scope, few global slices, simple UI-level global state (sidebar, theme, feature flags), minimal boilerplate desired, team comfortable without enforced middleware structure.
  - **Redux Toolkit (+ RTK Query)** — larger scope, complex normalized domain state, multiple developers needing enforced patterns, DevTools time-travel debugging valued, heavy async orchestration.
- Once chosen for a project, apply it consistently for all client-global state in that project — don't mix both for the same category of state within one codebase.
- **TypeScript is non-negotiable regardless of which is chosen.** Zustand stores use the curried `create<T>()(...)` pattern for full type inference (per official Zustand TypeScript guide) with an explicit state+actions interface — never an untyped store. Redux Toolkit slices use `createSlice` generics — no `any` in either.

## Rule 2: Server State Belongs to RTK Query, Not Redux Slices
- Never manually copy fetched data into a `createSlice` reducer with your own loading/error/data fields — RTK Query already solves caching, loading, error, and refetching.
- Don't duplicate server data into a separate slice "for easier access" — this creates two sources of truth that drift out of sync.

## Rule 3: Normalize Entity State — No Deeply Nested Trees
- Collections of entities (users, courses, patients, etc.) are stored normalized: `{ ids: [], entities: { id: {...} } }`, not as deeply nested arrays-of-objects-of-arrays.
- In Redux Toolkit, use `createEntityAdapter` for any collection needing CRUD — don't hand-roll normalization.
- In Zustand, apply the same `{ ids, entities }` shape manually within the store slice — Zustand has no built-in entity adapter, so this must be a deliberate convention, not skipped because the tool doesn't enforce it.

## Rule 4: Derived Data Is Computed, Never Stored
- If a value can be computed from existing state (totals, filtered lists, formatted strings), it is computed via a memoized selector (`createSelector`/reselect) — it is never stored as its own state field.
- Storing derived state creates a sync bug waiting to happen: the source updates, the derived copy doesn't.

## Rule 5: Selectors Must Be Memoized and Narrow
- Every selector reading from a slice is memoized (`createSelector`), not an inline function recreated on every render.
- Components select the narrowest possible slice of state (`selectUserName`, not `selectEntireUserObject`) to avoid re-rendering on unrelated state changes.

## Rule 6: Not Everything Needs a Global Store
- Local component state that isn't shared beyond a small subtree stays in `useState`/`useReducer` at that level — don't lift it to Zustand/Redux "just in case."
- Global state (whichever library was chosen per Rule 1a) is justified only when 2+ unrelated components need the same state, or state must survive component unmount.

## Rule 7: Context API vs Redux — Explicit Boundary
- Use React Context for low-frequency-update, broadly-read values (theme, locale, auth user object) where prop drilling is the actual problem.
- Use Redux Toolkit when state updates frequently, is written from multiple places, or benefits from DevTools time-travel debugging.
- Don't use Context as a substitute for Redux for genuinely complex, frequently-updated app state — it re-renders every consumer on every change with no selective subscription.

## Rule 8: Consistent Async Handling Pattern
- Pick one pattern for async logic (RTK Query for data-fetching; `createAsyncThunk` only for non-fetch async side effects) and apply it consistently — don't mix thunks, sagas, and raw `useEffect` fetches across the same codebase.
- Every async action has a consistent error shape (`{ message, code }` at minimum) so error-handling UI can be generic.

## Rule 9: Firebase Realtime Listener Lifecycle
- Every Firebase `onSnapshot`/realtime listener is unsubscribed on component unmount or when the query params change — listener leaks are a top cause of memory leaks and duplicate-data bugs in Firebase apps.
- Realtime listener data goes through the same server-state boundary as RTK Query where possible (or is clearly documented as an exception) — don't let two different "server state" systems coexist silently.

## Rule 10: Cache Invalidation Is Explicit, Not Guessed
- RTK Query cache invalidation uses explicit `tagTypes`/`providesTags`/`invalidatesTags` — never rely on manual `refetch()` calls scattered through components as the primary invalidation strategy.
- A mutation that affects a list must invalidate that list's tag; guessing which components to manually refetch doesn't scale past a handful of components.

## Rule 11: Optimistic Updates — Explicit Rollback Path
- Any optimistic update (RTK Query `onQueryStarted` pattern) must have an explicit rollback (`patchResult.undo()`) wired for the failure case — an optimistic update without a rollback path silently corrupts UI state on network failure.
- Reserve optimistic updates for actions where the failure rate is low and the UX benefit is high (likes, toggles) — not for actions with complex server-side validation that commonly reject.

## Rule 12: Granular Loading States, Not One Global Spinner
- Loading state is tracked per-request/per-query (RTK Query gives this for free), not as a single global `isLoading` boolean in a root slice.
- A single global loading flag causes unrelated UI to freeze/spin when only one unrelated request is in flight.

## Rule 13: Consistent Error Shape Across the App
- All async state (RTK Query errors, thunk rejections) normalizes to the same error shape before reaching UI components, so error-display components can be generic rather than special-cased per feature.

## Rule 14: Never Store Sensitive Data in Serializable Global State
- Auth tokens, PII, or medical/sensitive data (relevant for EdTech/MedTech) are not stored in Redux state that gets serialized to Redux DevTools or persisted to `localStorage` via `redux-persist` without explicit encryption/exclusion.
- Redux DevTools is visible in the browser and easily inspected — treat anything in the store as "visible," and exclude what shouldn't be.

## Rule 15: Persistence Allowlist, Not Denylist
- When using `redux-persist` (or similar), explicitly allowlist which slices persist (e.g. theme, non-sensitive preferences) rather than persisting everything by default and trying to remember to exclude sensitive slices later.

## Rule 16: State Colocation Principle
- State lives as close as possible to where it's consumed. Promote to a higher level (Context, then Redux) only when an actual sharing need across distant components is identified — not preemptively "for scalability."

## Rule 17: Reducers and Selectors Are Pure and Testable
- Reducers contain no side effects, no API calls, no `Date.now()`/`Math.random()` — pure functions only, so they're trivially unit-testable.
- Side effects (API calls, logging, navigation) live in RTK Query endpoints, thunks, or middleware — never inside a reducer.

## Rule 18: Redux DevTools Disabled in Production Builds
- Redux DevTools integration (and any state logging middleware) is disabled in production builds — leaving it enabled exposes full app state (including any inadvertently-sensitive data) to anyone with browser devtools access.
