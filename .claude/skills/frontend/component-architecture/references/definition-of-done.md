# Definition of Done — Component Architecture

A component cannot be marked "done" until every item below is checked.

## 1. Structure
- [ ] Placed in correct feature folder (not dumped in root `/components`)
- [ ] Presentational and container concerns separated (no data-fetching mixed with pure rendering)

## 2. Typing
- [ ] Explicit `Props` type/interface — no `any`
- [ ] Mutually exclusive states use discriminated unions, not multiple optional booleans

## 3. Composition
- [ ] Component has 7 or fewer top-level props (else split or use composition)
- [ ] Uses `children`/slots where configuration would otherwise balloon

## 4. Naming & Exports
- [ ] File name matches component name (PascalCase)
- [ ] Export style matches project convention (named vs default, consistently)
- [ ] Component, styles, test, and story files co-located

## 5. Logic Extraction
- [ ] No non-trivial logic inline in component body — extracted to custom hook
- [ ] No prop drilled through more than 2 levels untouched

## 6. Next.js Specific
- [ ] Server Component by default; `'use client'` only where interactivity is required
- [ ] Client boundary pushed as far down the tree as possible

## 7. Resilience & States
- [ ] Wrapped in an error boundary (feature/route level minimum, or component-level for critical widgets)
- [ ] Loading, empty, and error states all explicitly designed (not just the happy path)

## 8. Styling & Size
- [ ] Uses the project's single agreed styling approach (no mixing Tailwind/CSS Modules/styled-components)
- [ ] File is under ~150-200 lines, or split if it exceeds that

## 9. Patterns
- [ ] Shared logic uses custom hooks, not HOCs (unless a library requires HOCs)
- [ ] No `React.memo`/`useMemo`/`useCallback` added without a measured re-render problem

## 10. Reusability & Composition Contracts
- [ ] Reusable components forward refs (`forwardRef`) where composition with forms/animation/portals is expected
- [ ] Controlled vs uncontrolled behavior explicitly decided and consistent with project policy
- [ ] Component API defaults to accessible (semantic element choice via `as` prop, ARIA passthrough)

## 11. Testability & Future-Proofing
- [ ] No deeply nested conditional rendering that blocks test querying; consistent `data-testid` usage
- [ ] No hardcoded user-facing strings in JSX

## 12. Boundaries & Contracts
- [ ] No direct cross-feature imports of internal components (shared layer only)
- [ ] Design-system layer does not import feature/app-specific code
- [ ] Public props treated as a stable contract; breaking changes go through deprecation, not a hard cutover
- [ ] Design tokens propagate via ThemeProvider/context, not hardcoded per component

## Sign-off
Only mark "component-architecture: done" once all sections are checked.
