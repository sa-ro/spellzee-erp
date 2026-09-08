# Definition of Done — Frontend Testing

A feature cannot be marked "done" until every item below is checked.

## 1. Setup & Approach
- [ ] Existing project's test runner convention detected and followed (or Vitest + React Testing Library used for a new precedent)
- [ ] Tests query by role/label/text (Testing Library priority order), `data-testid` only as a last resort
- [ ] Tests verify behavior, not implementation — would survive an internals-only refactor

## 2. Test Shape & Investment
- [ ] Testing Trophy shape followed — unit for pure logic, integration as the bulk, E2E reserved for genuinely critical cross-cutting flows
- [ ] Critical paths (auth, enrollment, quiz submission) held to a higher testing bar
- [ ] Coverage number treated as a signal, not gamed for its own sake

## 3. Mocking & Data
- [ ] API calls mocked via MSW at the network boundary, not by mocking axios/RTK Query directly
- [ ] Test data uses shared factories, kept in sync with real API response shape
- [ ] Mock fixtures periodically checked against real API shape for drift

## 4. Accessibility & Interaction
- [ ] `jest-axe` (or equivalent) runs as part of component/integration tests for significant UI
- [ ] Keyboard interaction explicitly tested with `userEvent` for critical flows

## 5. Reliability
- [ ] No flaky tests present — intermittent failures fixed or the test removed, never skipped/ignored
- [ ] Tests isolated — MSW handlers reset, mocks cleared, no cross-test ordering dependence
- [ ] Timed/assessment logic tested with mocked timers, not real wall-clock waits

## 6. Coverage of States
- [ ] Offline/error/empty states tested, not only the happy path
- [ ] Role-based views (student/teacher/admin) each have their own test coverage

## 7. Structure & Maintainability
- [ ] Test names describe behavior in plain language; Arrange-Act-Assert structure followed
- [ ] Custom hooks tested directly via `renderHook` where non-trivial
- [ ] Tests don't re-test third-party library internals

## 8. Visual & Type Safety
- [ ] Visual regression tooling in place for design-critical components (design system, marketing pages)
- [ ] `tsc --noEmit` runs as its own CI gate alongside tests

## 9. CI Integration
- [ ] Full unit + integration suite runs automatically on every PR
- [ ] E2E suite runs in CI on an appropriate cadence (every PR or scheduled)

## Sign-off
Only mark "testing-frontend: done" once all sections are checked.
