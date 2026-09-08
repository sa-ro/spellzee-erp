# References & Sources

## Official Documentation
- **Redux Toolkit — Customizing Queries (official docs)** — documents the `axiosBaseQuery` pattern as the officially-supported way to swap RTK Query's default `fetchBaseQuery` for axios: https://redux-toolkit.js.org/rtk-query/usage/customizing-queries
- **Axios official docs** — interceptors (request/response), instance creation (`axios.create`), error handling: https://axios-http.com/docs/interceptors
- **Axios official docs — Cancellation** — native `AbortController` support (`signal` option) for cancelling in-flight requests, the mechanism behind the request-cancellation rule: https://axios-http.com/docs/cancellation
- **RTK Query official docs** — tag-based cache invalidation, endpoint structure, and cache behavior options (`keepUnusedDataFor`, `refetchOnFocus`, `refetchOnReconnect`, `isLoading` vs `isFetching`): https://redux-toolkit.js.org/rtk-query/overview
- **MDN — AbortController** — the underlying web-platform API for request cancellation: https://developer.mozilla.org/en-US/docs/Web/API/AbortController
- **Stripe API docs — Idempotent Requests** — the widely-referenced industry pattern for idempotency keys preventing duplicate mutation processing on retry: https://docs.stripe.com/api/idempotent_requests
- **MDN — HTTP 429 Too Many Requests / Retry-After header** — the standard for rate-limit backoff behavior: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/429
- **RFC 3339 / ISO 8601** — the standard for date-time interchange format underlying the UTC date-handling rule
- **Firebase official docs** — offline persistence, listener lifecycle, security rules for client-safe config keys: https://firebase.google.com/docs/firestore/manage-data/enable-offline
- **Mock Service Worker (MSW) official docs** — network-level interception, works transparently with axios, reusable across unit/integration/E2E tests: https://mswjs.io/docs/
- **Zod official docs** — runtime schema validation for API response boundaries: https://zod.dev

## Widely-Recognized Community Standards
- **Kent C. Dodds — "Stop Mocking Fetch"** — the rationale behind network-boundary mocking (MSW) over stubbing axios/fetch directly: https://kentcdodds.com/blog/stop-mocking-fetch
- **General REST API versioning practice** — URL-path or header-based versioning conventions, widely adopted (Stripe, GitHub, Google Cloud API design guides)

## Note on usage
Cite the relevant source above if the user asks "why" behind a rule. Paraphrase principles — don't reproduce documentation text verbatim in generated code or docs.
