# References & Sources

## Official Documentation
- **React Testing Library official docs — Guiding Principles**: "the more your tests resemble the way your software is used, the more confidence they can give you" — the foundational philosophy behind Rule 2: https://testing-library.com/docs/guiding-principles
- **Testing Library — Priority of queries**: the official role/label/text-before-`data-testid` query ordering behind Rule 5: https://testing-library.com/docs/queries/about/#priority
- **Vitest official docs** — configuration, fake timers (`vi.useFakeTimers()`), mocking utilities: https://vitest.dev
- **Mock Service Worker (MSW) official docs** — network-boundary mocking, works with both browser and Node test environments: https://mswjs.io/docs/
- **jest-axe** — automated accessibility assertions integrated into component tests: https://github.com/nickcolley/jest-axe
- **Testing Library — `renderHook`** — official utility for testing custom hooks in isolation: https://testing-library.com/docs/react-testing-library/api/#renderhook
- **Playwright official docs** — E2E testing and screenshot-based visual comparison: https://playwright.dev

## Widely-Recognized Community Standards
- **Kent C. Dodds — "The Testing Trophy" and "Write tests. Not too many. Mostly integration."** — the investment-shape philosophy behind Rule 3: https://kentcdodds.com/blog/write-tests
- **Kent C. Dodds — "Stop Mocking Fetch"** — network-boundary mocking rationale, shared with the `api-integration` skill: https://kentcdodds.com/blog/stop-mocking-fetch
- **Storybook + Chromatic** — visual regression testing via story-based screenshot diffing, the current (2026) standard pairing for design-system visual regression: https://storybook.js.org/docs/writing-tests/visual-testing

## Note on usage
Cite the relevant source above if the user asks "why" behind a rule. Paraphrase principles — don't reproduce documentation text verbatim in generated code or docs.
