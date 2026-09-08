# Definition of Done — API Integration

A feature involving API integration cannot be marked "done" until every item below is checked.

## 1. Project Context & Setup
- [ ] Existing project's axios instance/interceptor convention detected and followed (or, for a new project, one shared axios instance set up from the start)
- [ ] No second HTTP client introduced alongside axios; no raw `fetch` calls

## 2. Data Fetching Layer
- [ ] All calls go through RTK Query using the shared `axiosBaseQuery` wrapper — no scattered raw `axios.get/post` in components
- [ ] Request/response types explicit (OpenAPI-generated or shared `types/api.ts`) — no `any`

## 3. Error Handling
- [ ] Axios errors normalized to one consistent shape via interceptor / `axiosBaseQuery` error transform
- [ ] Network-level failures distinguished from 4xx/5xx server responses
- [ ] Retries use exponential backoff with a max-attempt cap; retryable vs non-retryable failures distinguished

## 4. Auth & Access
- [ ] Token attachment/refresh centralized in axios request/response interceptors
- [ ] Concurrent 401s during token refresh queue and retry, not fire parallel refresh calls
- [ ] 403/insufficient-permission responses explicitly handled, not just assumed away by UI gating

## 5. Pagination & Caching
- [ ] Growing lists use cursor-based pagination, not offset/limit
- [ ] Cache invalidation explicit via RTK Query tags

## 6. Real-Time Features
- [ ] Firebase listeners torn down on unmount or session-ID change
- [ ] Reconnect/backoff strategy in place with user-visible stale-state indication if disconnected

## 7. EdTech-Specific Resilience
- [ ] Critical write actions (quiz/assignment submission, attendance) queue locally and retry on reconnect rather than fail silently offline
- [ ] In-progress quiz/assignment answers persisted locally before submit, not only after success
- [ ] Large file/video uploads use chunked/resumable pattern with visible progress

## 8. Contract & Security
- [ ] API versioning strategy followed (version path/header, additive changes preferred)
- [ ] No secrets/service credentials in client-side bundle
- [ ] API responses validated/sanitized at the boundary (e.g. Zod) before being trusted by components
- [ ] Role-based response shape correctly handled (student/teacher/admin see different shapes from the same endpoint)

## 9. Testing
- [ ] Axios/REST requests mocked via MSW at the network boundary in tests

## 10. Performance
- [ ] High-frequency analytics/tracking events batched, not fired per micro-event
- [ ] In-flight requests cancelled on unmount/navigation (AbortController)
- [ ] Search-as-you-type inputs debounced; stale in-flight requests cancelled on new input

## 11. Reliability & Correctness
- [ ] Every axios request has an explicit timeout configured
- [ ] Critical mutations (quiz/assignment submission) include an idempotency key
- [ ] RTK Query cache freshness (`keepUnusedDataFor`, `refetchOnFocus`, `refetchOnReconnect`) configured deliberately per endpoint
- [ ] `isLoading` vs `isFetching` used correctly (initial skeleton vs background-refresh indicator)
- [ ] All dates cross the API boundary as UTC ISO 8601; local conversion only at render layer

## 12. Operations
- [ ] Base URL sourced from environment variables; app fails fast if missing
- [ ] 429 responses handled distinctly from generic 5xx (respect `Retry-After`)
- [ ] API errors logged to a monitoring tool with request context in production
- [ ] Multi-tenant/org ID included consistently via shared interceptor (if applicable)
- [ ] File downloads use `responseType: 'blob'` with `Content-Disposition` filename parsing, and show progress for large exports

## Sign-off
Only mark "api-integration: done" once all sections are checked.
