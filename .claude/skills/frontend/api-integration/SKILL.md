---
name: api-integration
description: Use this skill whenever the user is fetching data via REST/axios, structuring TanStack Query calls (`useQuery`/`useMutation`/`queryClient`), implementing pagination or polling, handling auth/token refresh, uploading files, or building offline-resilient features for an EdTech product. Trigger for phrases like "how do I call this API", "how do I paginate this list", "handle token refresh", "upload this video", "the app breaks when offline", "mock this API for tests", or any request involving fetching, mutating, or syncing data with a backend. Also trigger for Definition of Done review on an API-integration feature.
---

# API Integration Skill

Defines how the frontend fetches, mutates, caches, and stays resilient when talking to this project's REST API (via axios) — adaptable per project scope like the `state-management` skill, with EdTech-specific resilience (offline, low-bandwidth, video uploads, role-based data) built in.

## Step 0: Detect Project Context Before Applying Any Rule

**Always do this first.**

**Existing project?**
- Check `package.json` for `axios` and existing `/api`, `/services` folders, and how the shared axios instance/interceptors are currently structured.
- **Follow what's already there.** Match existing conventions (interceptor location, error transform shape, folder naming) even where they diverge slightly from the ideal patterns below.

**New project?**
- Set up one shared axios instance with interceptors from the start (see Rule 6 in `references/rules.md`) — don't let each feature create its own axios config.

**TypeScript is non-negotiable** in either case — no `any` from any API response, ever.

## When to use this
- Structuring TanStack Query hooks backed by axios
- Implementing pagination, caching, or cache invalidation
- Handling auth token refresh or role-based (student/teacher/admin) API responses
- ~~Building real-time features via Firebase~~ — not applicable on Spellzee (see scoping note below)
- Handling file/video uploads
- Making a feature resilient to offline/low-bandwidth conditions
- Writing tests that mock API calls
- Reviewing a PR or running Definition of Done for an API-integration feature

## Spellzee scoping (read before applying the rules below)

This project's backend is **NestJS + PostgreSQL**, consumed by a Next.js
console (and later a parent portal). Four adjustments to the rules below:

- **TanStack Query, not RTK Query.** This is the largest divergence: many of
  the rules below name RTK Query specifically. The concept in each still
  applies — read them as *"the query layer"* and use the TanStack equivalent:

  | Rule says | Here it means |
  |---|---|
  | RTK Query with a custom axios `baseQuery` (3) | `useQuery` / `useMutation` with a shared axios instance in `queryFn` |
  | Cache invalidation via tags (8) | `queryClient.invalidateQueries({ queryKey })` |
  | `keepUnusedDataFor` / `refetchOnFocus` (23) | `gcTime` / `staleTime` / `refetchOnWindowFocus` |
  | `isLoading` vs `isFetching` (24) | same distinction, same names |
  | Polling via `pollingInterval` | `refetchInterval` |

  Chosen because the grid is TanStack Table, so it is one ecosystem rather
  than two — and because RTK Query requires a Redux store this project has no
  other use for. See `tradeoff-library.md` decision 10.

- **No Firebase, no realtime listeners.** Firestore was explicitly rejected
  as a primary store, and persistent connections were rejected in favour of
  **polling** for internal dashboards: a coordinator's queue does not need
  sub-second latency, and connection state is an operational cost paid
  continuously for a benefit consumed occasionally. **Rule 9 does not apply.**
  Where a screen needs to feel current, poll on an interval and make it cheap
  with ETags / conditional requests. SSE is the sanctioned escalation if
  one-way push ever becomes necessary — WebSockets are not.
  Reversal trigger: idle clients × poll frequency exceeding what the database
  absorbs comfortably, or the product promising genuinely live behaviour.
- **Types come from the backend, not codegen guesswork.** Rule 4 holds, but
  the mechanism is shared TypeScript types across the monorepo boundary —
  that shared-type story is a main reason Next.js was chosen.
- **Rule 29 (multi-tenant scoping) does not apply.** Spellzee is
  single-tenant. There is no `org_id`/`school_id` to thread through an
  interceptor; authorization is by role and by relationship to the student.
  Do not build tenant scaffolding for a tenant that does not exist.

Rules 22 (idempotency keys) and 21 (explicit timeouts) matter more here than
in a typical app — the backend's write path is transactional and its external
edge is retry-driven, so a duplicate submission is a correctness problem, not
a UX annoyance.

## Core principles (see `references/rules.md` for full detail with rationale)

1. **REST only, axios as the single common HTTP client** — one shared instance, no fetch, no second HTTP library
2. **Project detection before implementation** — follow existing axios/interceptor convention, or set one up cleanly for new projects
3. **TanStack Query hooks calling a shared axios instance** — never scattered raw axios calls in components. (No `axiosBaseQuery` — that is RTK Query's abstraction; call axios inside `queryFn`)
4. **Type safety via shared types or OpenAPI codegen** — never `any`
5. **Consistent error shape via the axios interceptor** — network failures vs 4xx/5xx distinguished
6. **Centralized auth via axios interceptors** — token refresh in one place, concurrent 401s queued not parallel-retried
7. **Cursor-based pagination** for growing lists — never offset/limit for live-changing data
8. **Explicit cache invalidation via `queryClient.invalidateQueries`** — with a query-key factory per resource
9. ~~**Real-time lifecycle discipline (Firebase)**~~ — **not applicable on Spellzee**: polling + ETags instead, SSE if push is ever needed
10. **Retry with exponential backoff** — capped attempts, retryable vs non-retryable distinguished
11. **Offline & low-bandwidth resilience (EdTech)** — queue critical writes, persist in-progress answers locally, cache content where possible
12. **Chunked/resumable uploads (EdTech)** — for video/large files, with visible progress
13. **API contract versioning** — version path/header, additive changes preferred
14. **Test at the network boundary** — MSW mocking axios calls
15. **Never expose secrets client-side**
16. **Validate/sanitize responses at the boundary** — e.g. Zod, before trusting data in components
17. **Role-based data shaping (EdTech)** — student/teacher/admin get different shapes from the same endpoint, handled explicitly
18. **Batch high-frequency analytics events** — not one API call per micro-event
19. **Cancel in-flight requests on unmount/navigation** — `AbortController`, avoid memory leaks
20. **Debounce/throttle search-as-you-type** — cancel stale requests when a newer one fires
21. **Explicit timeout on every request** — never allow indefinite hangs on poor connections
22. **Idempotency keys for critical mutations** — prevent duplicate quiz/assignment submissions from retries or double-clicks
23. **Deliberate cache freshness policy** — `staleTime`/`gcTime`/`refetchOnWindowFocus`/`refetchOnReconnect` set per query, not left at defaults
24. **Distinguish `isLoading` from `isFetching`** — correct initial-load vs background-refresh UI
25. **Environment-based base URL with startup validation** — fail fast if missing, never hardcoded
26. **UTC/ISO 8601 dates across the API boundary** — local conversion only at render layer
27. **429 rate-limit handling** — respect `Retry-After`, distinct from generic 5xx backoff
28. **Error logging/observability with request context** — production errors reach a monitoring tool, not just swallowed
29. **Consistent multi-tenant/org scoping** — tenant ID via shared interceptor, not per-endpoint memory
30. **File download (blob) handling** — `responseType: 'blob'`, `Content-Disposition` filename parsing, visible progress for large exports

## Workflow

1. **Step 0 first, always**: detect existing axios/interceptor convention, or set one up for a new project.
2. Wire the feature through TanStack Query hooks calling the shared axios instance, with proper types (Rules 3-4).
3. Add error normalization, auth handling, pagination, and cache invalidation (Rules 5-8).
4. For EdTech-critical paths (submissions, uploads, offline resilience): apply Rules 10-12 explicitly — these are not optional edge cases for this domain. (Rule 9 is out of scope here — see the scoping note.)
5. Before sign-off: run through `references/definition-of-done.md`.

## Notes
- This skill governs how the frontend talks to the backend. For where fetched data lives once retrieved, see `state-management` (server state → TanStack Query is shared ground between both skills). For form submission UX, see `form-handling-validation`.
- Grounded in official Redux Toolkit, Axios, Firebase, MSW, and Zod docs, plus recognized community authorities (Kent C. Dodds) — see `references/sources.md`.
