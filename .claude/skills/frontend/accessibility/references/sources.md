# References & Sources

## Official Standards & Documentation
- **W3C WCAG 2.2 (official W3C Recommendation, October 2023; ISO/IEC 40500:2025)** — the current standard this skill targets, including all 9 new success criteria over WCAG 2.1: https://www.w3.org/TR/WCAG22/
- **W3C WAI-ARIA Authoring Practices Guide (APG)** — keyboard interaction patterns for custom widgets (tabs, menus, comboboxes), the source for "no ARIA is better than bad ARIA": https://www.w3.org/WAI/ARIA/apg/
- **axe-core (Deque) official docs/blog** — automated testing coverage figures (approximately 30-57% of real-world issues by volume, depending on measurement method; a minority of WCAG success criteria are fully automatable) — the basis for treating automated testing as a floor, not a ceiling: https://www.deque.com/axe/
- **MDN — `prefers-reduced-motion`** — the media query and its accessibility rationale: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- **eslint-plugin-jsx-a11y** — lint-time accessibility rule enforcement for JSX: https://github.com/jsx-eslint/eslint-plugin-jsx-a11y
- **jest-axe** — automated accessibility assertions in Jest/Testing Library test suites: https://github.com/nickcolley/jest-axe

## Widely-Recognized Community Standards
- **Deque University / Deque blog** — practical guidance on WCAG 2.2 new criteria (Focus Not Obscured, Target Size, Accessible Authentication, Redundant Entry, Consistent Help)
- **WebAIM** — plain-language WCAG explanations and contrast-checking tools widely used as an industry reference: https://webaim.org/resources/contrastchecker/

## Note on usage
Cite the relevant source above if the user asks "why" behind a rule. Paraphrase principles — don't reproduce documentation text verbatim in generated code or docs.
