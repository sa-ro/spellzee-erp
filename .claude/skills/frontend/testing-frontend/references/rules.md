# Frontend Testing Rules

## Rule 1: Vitest + React Testing Library, Chosen as the Standard (Project Detection Applies)
- **Existing project**: check `package.json` for `vitest`, `jest`, `@testing-library/react` and follow whatever is already established — don't introduce a second test runner into a project that already has one working.
- **New project / no precedent**: default to **Vitest + React Testing Library** — Vitest is Vite-native (or configurable for Next.js with `jsdom`), Jest-compatible in API, and materially faster on large suites; Jest remains acceptable for legacy/enterprise codebases already built on it.
- MSW (Mock Service Worker) is the standard for mocking axios/REST calls in tests (cross-references the `api-integration` skill's network-boundary-mocking rule).

## Rule 2: Test Behavior, Not Implementation
- Tests interact with components the way a user would: query by accessible role, label, or visible text (`getByRole`, `getByLabelText`) — never by CSS class, internal state, or component instance internals.
- The test for this: "if I refactor this component's internals tomorrow without changing its behavior, does the test still pass?" If a refactor breaks the test despite no behavior change, the test was coupled to implementation, not behavior.
- This directly extends the `form-handling-validation` skill's behavior-level testing rule to the whole codebase, not just forms.

## Rule 3: Follow the Testing Trophy, Not Just the Pyramid
- Investment shape: a foundation of unit tests for pure logic (utils, reducers, selectors — cheap and fast), the largest layer of integration tests (component + its immediate dependencies, rendered together, testing real user flows), and a small number of E2E tests for the handful of truly critical paths (login, quiz submission, enrollment).
- Integration tests give the best confidence-to-cost ratio for typical UI work — don't over-invest in isolated unit tests for components that only make sense rendered with their real children, and don't rely on E2E tests to cover what an integration test would catch faster and more reliably.

## Rule 4: Mock at the Network Boundary, Not the Module Boundary
- API calls are mocked via MSW intercepting actual network requests — never by mocking the axios module itself (`jest.mock('axios')`) or stubbing RTK Query hooks directly. Network-boundary mocking exercises the real request-making code path (headers, interceptors, error transforms) instead of bypassing it.
- The same MSW handlers are reused across component tests, integration tests, and local development — not redefined ad hoc per test file.

## Rule 5: Test IDs Are a Last Resort, Not a Default Query
- Query priority (per Testing Library's own guidance): accessible role/label first, then text content, then `data-testid` only when no accessible query reasonably applies (e.g. a purely decorative container with no semantic role).
- Reaching for `data-testid` as the first instinct is a signal that the component itself may lack proper accessible semantics — a gap that should be fixed (per the `accessibility` skill) rather than worked around in the test.

## Rule 6: Coverage Percentage Is a Signal, Not a Target
- Code coverage numbers are useful for spotting genuinely untested areas, not a goal to hit for its own sake — 100% coverage achieved by shallow tests that don't assert meaningful behavior is worse than 70% coverage of tests that actually catch regressions.
- Critical paths (auth, payment/enrollment, quiz submission, grading) are held to a higher testing bar regardless of the overall coverage number.

## Rule 7: Accessibility Assertions Are Part of Component Tests, Not a Separate Effort
- `jest-axe` (or Vitest equivalent) runs as part of component/integration tests for significant UI, catching accessibility regressions automatically — this is the automated-testing-as-a-floor layer from the `accessibility` skill, wired directly into the same test suite rather than a separate audit process.
- Testing Library's role/label-based querying (Rule 2) already indirectly enforces some accessibility (you can't query by role if the role isn't there) — `jest-axe` catches what query-based testing doesn't (contrast, missing ARIA attributes on elements you didn't query).

## Rule 8: E2E Tests Cover Only Genuinely Critical, Cross-Cutting Flows
- Playwright (or Cypress) E2E tests are reserved for the handful of flows where a real browser, real navigation, and the full stack together matter: login, enrollment/payment, quiz start-to-submit, and any flow spanning multiple pages/roles.
- E2E tests are the slowest and most brittle layer — a large E2E suite trying to cover everything integration tests could cover is a maintenance burden that yields diminishing returns; keep this layer deliberately small (typically 3-10 flows for most products, not dozens).

## Rule 9: Snapshot Tests Are Used Narrowly and Reviewed Deliberately
- Snapshot testing is reserved for genuinely stable output (a design-system component's rendered markup, a serialization format) — not used as a default "test everything" mechanism for components whose markup changes frequently as normal development.
- A snapshot diff in a PR is actually read and understood before approving the update — reflexively running `--updateSnapshot` without reviewing what changed defeats the purpose of the test entirely.

## Rule 10: Flaky Tests Are Fixed or Removed, Never Ignored
- A test that fails intermittently is treated as a bug in the test (or the code it tests) to be fixed immediately — not re-run until it passes, not skipped with a comment "flaky, ignore," and not left in CI as accepted noise.
- Common flaky-test causes are addressed directly: unawaited async state updates (use Testing Library's `findBy`/`waitFor`, never arbitrary `setTimeout` waits), shared mutable state between tests, and real-time-dependent assertions (mock timers/dates explicitly rather than racing real time).

## Rule 11: Test Data Is Deliberately Managed, Not Ad Hoc Per Test
- Shared test fixtures/factories (e.g. a `buildStudent()`/`buildCourse()` factory function) generate consistent, realistic test data — not each test hand-writing a slightly different inline object shape that drifts from what the real API actually returns.
- Test data factories are kept in sync with the actual API response shape (per the `api-integration` skill's type-safety rules) so tests don't pass against a fictional data shape the real backend never sends.

## Rule 12: Tests Run in CI on Every PR, Not Just Locally
- The full test suite (unit + integration, at minimum) runs automatically on every PR before merge is allowed — this is the same CI-gate discipline as the `performance-optimization` and `security-practices` skills' enforcement rules, applied to correctness.
- E2E tests run in CI too, though potentially on a different cadence (every PR for critical-path changes, or a scheduled run) if their runtime makes every-PR execution impractical.

## Rule 13: Test Timed/Assessment Logic With Controlled Time (EdTech-Specific)
- Timed quiz/assessment components are tested using mocked timers (`vi.useFakeTimers()`/Jest fake timers) to deterministically advance time and verify auto-submit-on-expiry behavior (per the `form-handling-validation` skill's timed-assessment rule) — never a test that waits on real wall-clock time to verify a timeout.

## Rule 14: Test Role-Based Views Explicitly (EdTech-Specific)
- Components/pages that render differently by role (student/teacher/admin, per the `api-integration` and `security-practices` skills' role-based rules) have tests covering each role's rendered output and available actions — not just the student view with an assumption that teacher/admin views "probably work the same way."

## Rule 15: Test Offline/Error States, Not Only the Happy Path
- Given the `api-integration` skill's offline-resilience rules, tests explicitly cover the offline/network-failure UI state (via MSW's ability to simulate network errors) and the loading/error/empty states from the `component-architecture` skill's Rule 11 — not only the successful-response case, which is the easiest but least revealing path to test.

## Rule 16: Visual Regression Testing for Design-Critical Components (Cross-References `figma-pixel-perfect`)
- Where pixel-accuracy matters most (design-system components, marketing pages), visual regression tooling (Storybook + Chromatic-style screenshot diffing, or Playwright's screenshot comparison) catches unintended visual changes that behavior-focused tests wouldn't — this complements, not replaces, the `figma-pixel-perfect` skill's manual screenshot-diffing rule by automating the ongoing regression check.

## Rule 17: Don't Test Third-Party Library Internals
- Tests verify the application's own logic and integration points, not that a well-tested third-party library (React Hook Form, RTK Query, Zustand) behaves as its own documentation says it does — testing "does `useForm` update state on change" duplicates the library's own test suite and adds maintenance cost without catching application bugs.

## Rule 18: Type-Check as Part of the Test/CI Gate
- `tsc --noEmit` (or equivalent) runs as its own CI check alongside the test suite — TypeScript's compile-time guarantees (enforced throughout every other skill's "no `any`" rules) are only real protection if a type error actually fails CI, not just flagged in a developer's editor that might be ignored.

## Rule 19: Guard Against Mock/Reality Drift with Contract Awareness
- MSW mock handlers/fixtures are periodically validated against the real API's actual response shape (via the OpenAPI-generated types from the `api-integration` skill, or a lightweight contract check) — a test suite that passes entirely against mocks that have quietly drifted from what the backend actually returns gives false confidence.

## Rule 20: Descriptive Test Names Following Arrange-Act-Assert
- Test names describe the behavior being verified in plain language ("shows a validation error when the email field is empty," not "test1" or "email test") — a failing test's name alone should tell you what broke without opening the file.
- Test bodies follow Arrange-Act-Assert structure (set up state, perform the action, assert the outcome) consistently, making tests easy to scan and modify.

## Rule 21: Test Isolation — Reset State Between Tests
- MSW handlers reset between tests (`server.resetHandlers()`), mocks are cleared (`vi.clearAllMocks()`/`jest.clearAllMocks()`), and components are properly unmounted — a test must never depend on side effects left behind by a previous test, since that ordering-dependence causes tests to pass/fail unpredictably based on run order.

## Rule 22: Test Custom Hooks in Isolation via `renderHook`
- Non-trivial custom hooks (extracted per the `component-architecture` skill's logic-extraction rule) are tested directly with Testing Library's `renderHook` rather than only indirectly through whichever component happens to use them first — this gives a hook its own focused test surface and catches hook bugs independent of any particular consuming component's rendering quirks.

## Rule 23: Explicit Keyboard-Interaction Testing with `userEvent`
- Critical interactive flows are tested with `userEvent`'s keyboard simulation (`userEvent.tab()`, `userEvent.keyboard()`) to verify the actual tab order and keyboard operability the `accessibility` skill requires — `jest-axe` (Rule 7) catches static accessibility issues but does not verify that keyboard navigation actually flows correctly through a real interaction sequence.
