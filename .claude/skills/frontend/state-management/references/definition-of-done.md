# Definition of Done — State Management

A piece of state/feature cannot be marked "done" until every item below is checked.

## 1. Categorization
- [ ] Existing project state-management approach detected and followed (or, for new projects, scope discussed with user before choosing a library)
- [ ] State correctly categorized (server / client-global / UI-local / URL / form) before implementation
- [ ] Global-state library (Zustand or Redux Toolkit) chosen deliberately by project scope, not mixed within the same category
- [ ] Store/slice fully typed (Zustand: curried `create<T>()(...)` pattern; Redux Toolkit: `createSlice` generics) — no `any`
- [ ] No server data manually duplicated into a global store outside RTK Query

## 2. Shape & Derivation
- [ ] Entity collections normalized (`ids` + `entities`), using `createEntityAdapter` where applicable
- [ ] No derived/computed values stored as their own state field — computed via memoized selector instead

## 3. Selectors
- [ ] All selectors memoized (`createSelector`)
- [ ] Components select the narrowest state slice needed, not entire objects

## 4. Scope Justification
- [ ] State promoted to Redux/Context only after an actual cross-component sharing need, not preemptively
- [ ] Context used only for low-frequency, broadly-read values; Redux used for frequent/multi-writer state

## 5. Async & Caching
- [ ] One consistent async pattern used (RTK Query for fetching; thunks only for non-fetch side effects)
- [ ] Cache invalidation via explicit tags, not scattered manual refetches
- [ ] Optimistic updates (if used) have an explicit rollback path
- [ ] Loading state is per-request, not a single global flag
- [ ] Error shape normalized and consistent across features

## 6. Firebase-Specific
- [ ] All realtime listeners unsubscribed on unmount / query-param change
- [ ] Realtime data flows through the same server-state boundary as other async data (or exception documented)

## 7. Security & Persistence
- [ ] No tokens/PII/sensitive data in serializable global state without explicit exclusion
- [ ] Persistence (`redux-persist` etc.) uses an explicit allowlist, not a default-persist-everything approach
- [ ] Redux DevTools/state-logging disabled in production builds

## 8. Testability
- [ ] Reducers are pure — no side effects, no API calls, no non-deterministic values
- [ ] Side effects live in RTK Query endpoints/thunks/middleware only

## Sign-off
Only mark "state-management: done" once all sections are checked.
