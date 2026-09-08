# API Integration Rules

> ## Spellzee: read this before applying any rule below
>
> These rules were written against **RTK Query + Firebase**. This project uses
> **TanStack Query**, and has **no Firebase**. The reasoning in each rule holds; several
> API names do not.
>
> | Rule | As written | Here |
> |---|---|---|
> | **1** | Firebase sits alongside REST for realtime | **No Firebase, no realtime.** Internal dashboards poll |
> | **3** | RTK Query with a custom `axiosBaseQuery` wrapper | **There is no `axiosBaseQuery` in TanStack Query — do not build one.** Call the shared axios instance directly inside `queryFn`. The rule's actual point stands: no scattered `axios.get` in components or `useEffect` |
> | **8** | Invalidation via `tagTypes`/`providesTags`/`invalidatesTags` | `queryClient.invalidateQueries({ queryKey })`, with a keyed query-key factory per resource |
> | **9** | Firebase listener lifecycle | **Does not apply** |
> | **23** | `keepUnusedDataFor` / `refetchOnFocus` / `refetchOnReconnect` | `gcTime` / `staleTime` / `refetchOnWindowFocus` / `refetchOnReconnect` |
> | **24** | `isLoading` vs `isFetching` | Same distinction, same names |
> | **29** | Multi-tenant `org_id` scoping | **Does not apply** — single tenant |
> | polling | `pollingInterval` | `refetchInterval` |
>
> Rules **21** (explicit timeouts) and **22** (idempotency keys) matter *more* here than
> in a typical app: the backend write path is transactional and its external edge is
> retry-driven, so a duplicate submission is a correctness problem, not a UX annoyance.
>
> Why TanStack: the grid is TanStack Table, so it is one ecosystem rather than two, and
> RTK Query would require a Redux store this project has no other use for.
> See `tradeoff-library.md` decision 10.

## Rule 1: REST Only — Axios as the Single Common HTTP Client
- No GraphQL. All API communication is REST, and **axios** is the one HTTP client used project-wide — never raw `fetch`, never a second HTTP library introduced alongside axios.
- Firebase (realtime) sits alongside REST for live features (live class presence, chat, quiz leaderboards) — it is not a REST replacement, it's a separate category for realtime sync.
- One shared axios instance (`axios.create({ baseURL, ... })`) per API base — don't instantiate a new axios call config ad hoc in each file.

## Rule 2: Project Detection Before Implementation (mirrors the state-management skill)
- **Existing project**: check `package.json` for `axios` and existing `/api`, `/services` folders, plus how the shared axios instance and interceptors are currently structured. Follow what's already there — match existing conventions (interceptor location, error transform shape, folder naming) even where they diverge slightly from the ideal patterns below.
- **New project**: set up one shared axios instance with interceptors from the start (see Rule 6) — don't let each feature create its own axios config.
- TypeScript is non-negotiable: request/response types come from a shared `types/api.ts` per resource (or OpenAPI-generated types where available) — no `any` from any API response, ever.

## Rule 3: RTK Query with a Custom Axios `baseQuery` — Never Scattered Axios Calls
- All API calls go through RTK Query endpoints, using a custom `axiosBaseQuery` wrapper (the officially-documented pattern for swapping RTK Query's default `fetchBaseQuery` for axios) — never raw `axios.get/post` calls scattered inside components or `useEffect`.
- This gets you RTK Query's caching/invalidation/loading-state machinery while keeping axios's interceptor ergonomics (auth headers, error transforms) as the actual transport.
- One `axiosBaseQuery` implementation shared across all API slices — don't reimplement it per feature.

## Rule 4: Type Safety via Shared Types or OpenAPI Codegen
- Generate types from an OpenAPI spec where the backend provides one; where not available, maintain a single shared `types/api.ts` per resource so multiple endpoints returning the same shape don't each redefine their own slightly-different interface.
- Axios response types are explicitly typed on every call (`axios.get<ResponseType>(...)` or typed through the `axiosBaseQuery` wrapper) — never left as implicit `any`.

## Rule 5: Consistent Error Shape via the Axios Interceptor
- Normalize all axios errors (network errors, timeouts, HTTP status codes) into one consistent shape (`{ message, code, status }` at minimum) inside the axios response interceptor or the `axiosBaseQuery` error transform — components should never need to branch on raw `AxiosError` shape.
- Distinguish network-level failures (no response received) from server error responses (4xx/5xx) — they need different UI treatment (retry affordance vs validation message).

## Rule 6: Auth — Token Refresh via Axios Interceptors, Not Per-Call Logic
- Token attachment (request interceptor) lives in the one shared axios instance — never duplicated per API call or per feature.
- The primary refresh strategy is `auth-session-flows`'s Rule 5: proactive refresh ahead of expiry, so a request rarely if ever hits a live token as expired. The response interceptor's refresh-on-401 handling defined here is the **safety-net** path (clock skew, a missed proactive refresh, a token revoked server-side) — not the primary mechanism these two skills disagree on; it's the fallback beneath it.
- Concurrent 401s during an in-flight token refresh must queue and retry after refresh completes, not fire N parallel refresh requests.
- Role-based data access (student sees own data/progress; teacher/admin sees aggregate/class-level data) is enforced primarily server-side, but the frontend must not assume a role and skip handling a 403 — always handle the "insufficient permission" response explicitly rather than assuming UI gating alone is sufficient.

## Rule 7: Pagination — Cursor-Based for Growing Lists
- Course catalogs, student rosters, and activity/submission feeds use cursor-based pagination (REST cursor/`next_page_token` params), not raw offset/limit — offset pagination breaks (duplicate/skipped items) when the underlying list changes between page loads, which happens constantly with live enrollment/submission data.
- Infinite-scroll UIs must handle the empty-page and end-of-list states explicitly, not assume every page is full.

## Rule 8: Explicit Cache Invalidation via RTK Query Tags
- REST endpoints use RTK Query `tagTypes`/`providesTags`/`invalidatesTags` for cache invalidation — not relying on a hard page refresh or scattered manual `refetch()` calls to "fix" stale data.
- A mutation that affects a list must invalidate that list's tag explicitly.

## Rule 9: Real-Time Feature Lifecycle (Firebase)
- Any live feature (live class attendance, real-time quiz leaderboard, chat) has its Firebase listener explicitly torn down on unmount or when the relevant session/room ID changes — same discipline as the state-management skill's Firebase listener rule, applied here at the API layer.
- Real-time connections have an explicit reconnect/backoff strategy — a dropped connection during a live class must not silently leave the student's UI stale with no indication.

## Rule 10: Retry with Exponential Backoff, Not Infinite Silent Retry
- Transient network failures retry with exponential backoff and a capped max-attempt count — never an infinite retry loop, and never a single silent failure with no retry at all.
- Distinguish retryable failures (network timeout, 5xx) from non-retryable ones (4xx validation errors, 403) — retrying a validation error just wastes time and hides the real problem from the user.

## Rule 11: Offline & Low-Bandwidth Resilience (EdTech-Specific)
- EdTech users are frequently on unstable mobile connections (rural areas, shared data plans) — critical write actions (quiz/assignment submission, attendance marking) must queue locally and retry on reconnect rather than silently failing when offline.
- Course content (lesson text, already-downloaded video) should be cacheable for offline/low-bandwidth viewing where the product supports it (service worker / IndexedDB cache) — treat "assume always-online" as a design bug for this domain, not an edge case.
- Never let a student lose quiz/assignment progress to a network blip — persist in-progress answers locally before the submit API call, not only after a successful response.

## Rule 12: File/Media Upload Handling (EdTech-Specific)
- Video and large file uploads (course content, video assignments) use chunked/resumable upload patterns, not a single large POST that fails and restarts from zero on any interruption.
- Upload progress is surfaced to the user (progress bar/percentage), not a spinner with no feedback for a multi-minute upload.

## Rule 13: API Contract Versioning
- Version via URL path or header (`/v1/...` or `Accept-Version` header) — never break an existing endpoint's response shape without a version bump.
- Frontend code should tolerate additive backend changes gracefully (don't destructure-and-assume-exact-shape in a way that breaks if the backend adds a new field).

## Rule 14: Testing — Mock Axios Calls at the Network Boundary
- Use Mock Service Worker (MSW) to mock REST/axios requests in tests — it intercepts at the network layer (works with axios out of the box), so tests exercise the real request-making code path instead of stubbing axios methods directly.
- The same MSW handlers are reusable across unit tests, integration tests, and local development — don't maintain separate ad-hoc mocks per test file.

## Rule 15: Never Expose Secrets in Client-Side Code
- API keys, service credentials, and Firebase admin credentials never ship in client-side bundles — anything in frontend code is publicly visible/extractable regardless of build minification.
- Client-safe Firebase config keys are fine (they're designed to be public and secured via Firebase Security Rules) — but never confuse this with server-side secrets.

## Rule 16: Validate/Sanitize API Responses Before Rendering
- Don't trust API response shape blindly even from your own backend — validate at the boundary (e.g. with Zod) so a malformed or unexpected response fails predictably at the data layer instead of causing a confusing render crash deep in a component.

## Rule 17: Role-Based Data Shaping (EdTech-Specific)
- API integration layer must respect that the same conceptual "progress" or "submission" endpoint returns different shapes/scopes depending on caller role (student: own record only; teacher: full class roster; admin: cross-class aggregate) — don't build one generic hook and assume the response shape is identical across roles.

## Rule 18: Analytics/Activity Event Batching
- High-frequency tracking events (lesson view time, video watch progress, click-through analytics) are batched and sent periodically, not fired as an individual API call per micro-event — this avoids overwhelming the backend and draining mobile data/battery on student devices.

## Rule 19: Request Cancellation on Unmount/Navigation
- In-flight requests are cancelled (via `AbortController`, which axios supports natively) when the component that initiated them unmounts or the user navigates away before the response arrives.
- RTK Query handles this automatically for its own queries — this rule mainly guards against any manual axios calls left outside that layer, and against "setState on unmounted component" warnings/memory leaks.

## Rule 20: Debounce/Throttle for Search-as-You-Type
- Any input-driven API call against a plain backend endpoint (not a dedicated instant-search service) is debounced (typically 300-500ms) — never fired on every keystroke. For search against a dedicated instant-search service (Algolia/Meilisearch), use the faster 200-300ms debounce and cancellation rules owned by the `search-discovery` skill instead — that skill's tighter timing assumes the lower-latency backend a search-as-you-type UX is built around.
- The previous in-flight request for a stale query is cancelled when a new one fires, so a slow response to an old keystroke can't overwrite a newer result.

## Rule 21: Explicit Timeout on Every Request
- Every axios request has an explicit `timeout` configured on the shared instance (with per-request overrides where genuinely needed, e.g. large uploads) — never left at axios's default of no timeout, which allows a request to hang indefinitely on poor connections.

## Rule 22: Idempotency Keys for Critical Mutations
- Critical submission mutations (quiz submission, assignment submission, payment/enrollment actions) include an idempotency key (e.g. a client-generated UUID sent with the request) so a network-retry (Rule 10) or accidental double-click cannot create a duplicate submission server-side.
- This is especially important for EdTech: a student's retried "submit quiz" request must resolve to exactly one submission, not two.

## Rule 23: Explicit RTK Query Cache Freshness Policy
- `keepUnusedDataFor`, `refetchOnMountOrArgChange`, `refetchOnFocus`, and `refetchOnReconnect` are configured deliberately per endpoint, not left at defaults without consideration.
- Example: live class/quiz-leaderboard data likely wants `refetchOnFocus`/`refetchOnReconnect` enabled; a mostly-static course catalog likely wants a longer `keepUnusedDataFor` and no aggressive refetching.

## Rule 24: Distinguish `isLoading` from `isFetching`
- RTK Query's `isLoading` (true only on the very first fetch with no cached data) and `isFetching` (true on any fetch, including background refetches) are used for different UI: `isLoading` drives the initial skeleton/spinner, `isFetching` drives a subtle background-refresh indicator.
- Treating them the same causes a jarring full-page spinner flash on every background refetch of already-visible data.

## Rule 25: Environment-Based Base URL with Startup Validation
- The axios base URL comes from environment variables (dev/staging/prod), never hardcoded in source.
- The app fails fast at startup (clear error, not a silent wrong-environment API call) if a required API environment variable is missing.

## Rule 26: Consistent UTC/ISO 8601 Date Handling Across the API Boundary
- All dates/times cross the API boundary as UTC in ISO 8601 format — never a local-time string, never an ambiguous format.
- Conversion to the user's local timezone happens only at the render layer, not stored or passed around in local time.
- This directly prevents a common and costly EdTech bug: live class start times or assignment deadlines showing wrong for students/teachers in different timezones.

## Rule 27: 429 Rate-Limit Handling
- A 429 response is handled distinctly from generic 5xx retries: respect the `Retry-After` header if present, and back off accordingly rather than applying the same fixed exponential backoff used for server errors.

## Rule 28: Error Logging/Observability with Request Context
- API errors reaching a boundary (interceptor or error boundary) are logged to a monitoring tool (e.g. Sentry) in production, including request context (endpoint, status, a request ID if the backend provides one) — not just swallowed or `console.error`'d.

## Rule 29: Consistent Multi-Tenant/Org Scoping
- If the platform serves multiple schools/organizations, every API call includes the tenant/org identifier consistently via the shared axios interceptor (e.g. an `X-Org-Id` header) — this must not be something each developer remembers to add per-endpoint.

## Rule 30: File Download (Blob) Handling
- Certificate, report, and export (CSV/PDF) downloads use `responseType: 'blob'` in axios, with the filename parsed from the `Content-Disposition` header where the backend provides one, rather than a hardcoded filename.
- Large export downloads show explicit progress/loading state — the same discipline as Rule 12's upload progress, applied to downloads.
