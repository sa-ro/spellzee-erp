---
name: component-architecture
description: Use this skill whenever the user is building, structuring, or reviewing React/Next.js components — creating new components, deciding folder structure, splitting large components, choosing between props/composition/context, naming files, or organizing a feature module. Trigger for phrases like "how should I structure this component", "this component is getting too big", "where should this file go", "props vs children", or any request to scaffold a new feature/component. Also trigger when reviewing code for component design quality or applying a Definition of Done for component sign-off.
---

# Component Architecture Skill

Defines how components should be structured, typed, and organized in React/Next.js/TypeScript projects — feature-based folders, presentational/container separation, composition patterns, and Server/Client Component boundaries.

## When to use this
- Scaffolding a new component or feature module
- A component has grown too large or prop-heavy and needs restructuring
- Deciding where a file/folder should live
- Reviewing a PR for component design quality
- Running a Definition of Done pass before marking a component complete

## Core principles (see `references/rules.md` for full detail with rationale)

1. **Feature-based folder structure** — organize by domain, not file type
2. **Separate presentational from container components** — UI rendering vs data-fetching/business logic
3. **Strict TypeScript props** — no `any`, use discriminated unions for mutually exclusive states
4. **Composition over configuration** — prefer `children`/slots over long boolean prop lists (>7-8 props is a split signal)
5. **Consistent naming/exports** — PascalCase files, one component per file, co-located tests/styles/stories
6. **Extract logic into custom hooks** — component bodies should read like UI descriptions, not business logic
7. **No prop drilling beyond 2 levels** — use context or state management instead
8. **Sparse barrel exports** — avoid deep barrel chains that hurt tree-shaking
9. **Server Components by default (Next.js App Router)** — `'use client'` only when needed, pushed to leaf components
10. **Error boundaries** — at feature/route level minimum, component-level for critical widgets, always with a meaningful fallback
11. **Loading/empty/error states are part of the contract** — design all 3, not just the happy path
12. **One styling approach per project** — Tailwind, CSS Modules, or styled-components, never mixed
13. **Component size limit (~150-200 lines)** — split when exceeded, even if prop count is low
14. **Hooks over HOCs** — for sharing logic across components
15. **Deliberate memoization only** — `React.memo`/`useMemo`/`useCallback` applied to a measured problem, not by default
16. **Ref forwarding** — reusable components support `forwardRef` for composition with forms/animation/portals
17. **Controlled vs uncontrolled — decide explicitly** — consistent policy across the codebase
18. **Accessible-by-default component APIs** — `as` prop for semantic elements, ARIA passthrough, not swallowed
19. **Design for testability** — avoid deep conditional nesting, consistent `data-testid` convention
20. **No hardcoded UI strings** — i18n-ready from the start
21. **Cross-feature import boundary** — Feature A never imports Feature B's internals directly
22. **Dependency direction** — design-system layer never imports app/feature code
23. **Props are a public contract** — breaking changes go through deprecation, not a hard cutover
24. **Tokens never hardcoded per component** — actual theming propagation mechanism (CSS custom properties, not React Context) owned by `design-tokens`

## Workflow

1. When scaffolding: decide feature folder first, then component type (presentational vs container), then props shape, then whether Server or Client Component.
2. When reviewing/refactoring: check prop count, check for mixed concerns (data-fetching in a presentational component), check for prop drilling.
3. Before sign-off: run through `references/definition-of-done.md` — every item must be checked before calling a component "done."

## Notes
- This skill governs structure/organization. For state management patterns (Redux Toolkit/RTK Query), see the `state-management` skill. For accessibility rules on components, see the `accessibility` skill. For the actual token/theming runtime mechanism, see `design-tokens`.
- These rules are grounded in established sources (React/Next.js official docs, Bulletproof React, Patterns.dev, Kent C. Dodds, Radix UI, W3C ARIA practices) — see `references/sources.md` for the full list and links, useful when a rule's rationale needs to be cited.
