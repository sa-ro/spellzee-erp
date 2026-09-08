---
name: testing-frontend
description: Use this skill whenever the user is writing, reviewing, or structuring tests for React/Next.js components, hooks, or flows — unit tests, integration tests, E2E tests, mocking API calls, accessibility testing, or CI test setup. Trigger for phrases like "write a test for this", "how do I test this component/hook", "mock this API call", "this test is flaky", "set up Vitest/Jest", "E2E test for this flow", or any request involving React Testing Library, MSW, Playwright, or test coverage. Also trigger for Definition of Done review before a release.
---

# Frontend Testing Skill

Defines how frontend code is tested using Vitest/Jest + React Testing Library + MSW (project-detected like other skills), following the Testing Trophy investment shape, with EdTech-specific coverage for timed assessments and role-based views.

## Step 0: Detect Project Context Before Applying Any Rule

**Always do this first.**

**Existing project?**
- Check `package.json` for `vitest`, `jest`, `@testing-library/react`. Follow whatever is already established — don't introduce a second test runner.

**New project / no precedent?**
- Default to **Vitest + React Testing Library** (Jest remains fine for legacy/enterprise codebases already on it).
- MSW is the standard for mocking axios/REST calls, matching the `api-integration` skill.

## When to use this
- Writing tests for a new component, hook, or user flow
- Mocking API calls in tests
- Deciding what deserves a unit vs integration vs E2E test
- Debugging a flaky test
- Setting up accessibility or visual regression testing
- Reviewing a PR or running Definition of Done before a release

## Core principles (see `references/rules.md` for full detail with rationale)

1. **Vitest + React Testing Library, project-detected** — MSW for network mocking
2. **Test behavior, not implementation** — survives internals-only refactors
3. **Follow the Testing Trophy** — unit foundation, integration bulk, small E2E layer
4. **Mock at the network boundary** — MSW, never mocking axios/RTK Query modules directly
5. **`data-testid` is a last resort** — role/label/text queries first
6. **Coverage is a signal, not a target** — critical paths held to a higher bar
7. **Accessibility assertions in component tests** — `jest-axe` wired into the suite
8. **E2E reserved for genuinely critical, cross-cutting flows** — kept deliberately small
9. **Snapshot tests used narrowly**, diffs actually reviewed
10. **Flaky tests fixed or removed**, never ignored
11. **Test data via shared factories**, kept in sync with real API shape
12. **Tests run in CI on every PR**
13. **Timed/assessment logic tested with mocked timers (EdTech)**
14. **Role-based views tested explicitly (EdTech)**
15. **Offline/error states tested**, not only the happy path
16. **Visual regression testing** for design-critical components
17. **Don't re-test third-party library internals**
18. **Type-checking as its own CI gate**
19. **Guard against mock/reality drift** — periodic contract validation
20. **Descriptive test names, Arrange-Act-Assert structure**
21. **Test isolation** — reset state between tests
22. **Custom hooks tested via `renderHook`**
23. **Explicit keyboard-interaction testing** with `userEvent`

## Workflow

1. **Step 0 first, always**: detect existing test-runner convention, or set Vitest + RTL + MSW as the standard.
2. Decide the right test layer (Rule 3) before writing — most new UI work warrants an integration test, not a unit test of an isolated component fragment.
3. Write behavior-focused tests (Rule 2) with role/label queries (Rule 5), mocking network calls via MSW (Rule 4).
4. For EdTech-critical logic (timed assessments, role-based views): apply Rules 13-14 explicitly.
5. Before sign-off: run through `references/definition-of-done.md`.

## Notes
- This skill governs how code is tested. For what to test in forms specifically, see `form-handling-validation`. For the automated-testing-is-a-floor accessibility discipline this skill wires into CI, see `accessibility`. For the network-mocking pattern shared with production error-handling design, see `api-integration`.
- Grounded in official React Testing Library, Vitest, MSW, Playwright, and Storybook docs, plus Kent C. Dodds' Testing Trophy philosophy — see `references/sources.md`.
