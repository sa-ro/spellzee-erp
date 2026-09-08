# Component Architecture Rules

## Rule 1: Folder Structure — Feature-based, not type-based
- Organize by feature/domain, not by file type (avoid one giant `components/`, `hooks/`, `utils/` split at root for large apps).
- Example:
```
/features
  /auth
    /components
    /hooks
    /api
    index.ts
  /dashboard
    /components
    /hooks
```
- Shared/reusable UI (buttons, inputs, modals) lives in `/components/ui` — nothing feature-specific goes here.

## Rule 2: Component Types — Separate Presentational from Container
- **Presentational components**: only receive props, render UI, no data-fetching or business logic.
- **Container components**: handle data-fetching (GraphQL/REST/Firebase), state, and pass data down as props.
- Never mix a GraphQL query and complex JSX styling logic in the same component — split them.

## Rule 3: Props — Strict TypeScript Typing
- Every component has an explicit `Props` interface/type — no `any`, no untyped destructuring.
- Optional props get explicit defaults, not `props.x || fallback` scattered in JSX.
- Prefer discriminated unions over multiple optional booleans when a component has mutually exclusive states (e.g. `variant: 'primary' | 'secondary'` instead of `isPrimary?: boolean; isSecondary?: boolean`).

## Rule 4: Composition Over Configuration
- Prefer composition (`children`, slots, compound components) over giant prop lists with many booleans/flags.
- If a component has more than ~7-8 props, it's a signal to split it or use composition instead.
- Example: `<Card><Card.Header /><Card.Body /></Card>` over `<Card showHeader headerText bodyPadding ... />`.

## Rule 5: File Naming & Export Conventions
- Component files: `PascalCase.tsx` matching the component name.
- One component per file (exceptions: tightly-coupled sub-components in compound patterns).
- Named exports preferred over default exports for components (easier refactors, better autocomplete) — pick one convention and apply it consistently across the codebase.
- Co-locate: component + its styles + its test file + its stories file in the same folder.

## Rule 6: Custom Hooks for Logic Extraction
- Any non-trivial logic (data transformation, subscriptions, complex state) inside a component body gets extracted into a custom hook (`useXyz`).
- Hooks go in the feature's `/hooks` folder, or `/hooks` at root if shared across features.
- A component's render body should read like a description of UI, not business logic.

## Rule 7: No Prop Drilling Beyond 2 Levels
- If a prop needs to pass through more than 2 levels of components untouched, use context, composition, or state management (Redux Toolkit) instead.
- Don't reach for global state management as the first solution — try composition/context first for localized state.

## Rule 8: Barrel Exports — Use Sparingly
- `index.ts` barrel exports are fine at the feature level (`/features/auth/index.ts`) but avoid deep barrel chains that hurt tree-shaking and slow down builds in large Next.js apps.

## Rule 9: Server vs Client Components (Next.js App Router)
- Default to Server Components. Add `'use client'` only when a component needs interactivity, hooks, or browser APIs.
- Keep client components as small/leaf as possible — push `'use client'` boundary down the tree, not up.

## Rule 10: Error Boundaries
- Place error boundaries at feature/route level minimum — a single component crash should never take down the whole app.
- For critical widgets on a page (e.g. a payment form, a video player), wrap them in their own boundary so the rest of the page stays usable.
- Every error boundary must render a meaningful fallback UI, not a blank screen.

## Rule 11: Loading/Empty/Error States Are Part of the Contract
- Any component that renders async data must explicitly design for 3 states: loading (skeleton, not a blank flash), empty (no data — distinct from error), and error (with retry affordance where relevant).
- Don't treat "happy path with data" as the only state considered during design.

## Rule 12: Styling Approach Convention
- Pick one styling approach per project (Tailwind, CSS Modules, or styled-components) and apply it consistently — don't mix approaches within the same codebase.
- Document the chosen approach at the project/CLAUDE.md level so every new component follows it without re-deciding each time.

## Rule 13: Component Size Limit
- If a component file exceeds ~150-200 lines, treat that as a signal to split it (extract sub-components or hooks) — the prop-count rule (Rule 4) alone doesn't catch components that are large due to complex JSX or logic rather than many props.

## Rule 14: Hooks Over HOCs
- Prefer custom hooks over Higher-Order Components (HOCs) for sharing logic across components — hooks compose more predictably and avoid wrapper hell.
- Only reach for HOCs when integrating with a library that requires that pattern.

## Rule 15: Memoization — Use Deliberately, Not by Default
- Don't wrap every component in `React.memo` or every function in `useCallback`/`useMemo` by default — this is premature optimization and adds complexity without measured benefit.
- Apply memoization only when a specific re-render performance problem is identified (e.g. via React DevTools Profiler), not preemptively.

## Rule 16: Ref Forwarding for Reusable UI Components
- Any component meant to be reusable (Button, Input, Modal, Card) must support `forwardRef` so it composes correctly with form libraries (react-hook-form), animation libraries, and portals.
- A component library that can't forward refs isn't truly reusable — this breaks silently only when a consumer needs it.

## Rule 17: Controlled vs Uncontrolled — Decide Explicitly
- For any input-like component (Input, Select, Checkbox), explicitly decide and document whether it's controlled (parent owns state via value/onChange) or uncontrolled (component owns state internally, parent reads via ref).
- Don't let this vary inconsistently component-to-component within the same codebase — pick a default policy and only deviate with a documented reason.

## Rule 18: Accessible-by-Default Component APIs
- Design component APIs so accessibility is the default, not an opt-in. Example: an `as` prop for semantic element choice (`<Text as="h2">`), ARIA props passed through and not swallowed by the component.
- This is distinct from WCAG content rules (see the `accessibility` skill) — this is about the component's API shape making the accessible path the easy path.

## Rule 19: Design Components to Be Testable
- Avoid deeply nested conditional rendering that makes a component hard to query in tests.
- Use a consistent `data-testid` naming convention for elements that need direct test targeting.
- This is about component structure enabling testing, not test-writing itself (see the `testing-frontend` skill for that).

## Rule 20: No Hardcoded UI Strings (i18n Readiness)
- User-facing strings should not be hardcoded directly inside JSX, even if the project isn't multi-language yet.
- Route them through a constants file or i18n key structure from the start — retrofitting this later is expensive, especially for EdTech/MedTech products likely to need localization.
- See the `i18n-l10n` skill for the actual mechanism (library choice, key structure, pluralization) — this rule only states the discipline of never hardcoding.

## Rule 21: Cross-Feature Import Boundary
- A component in Feature A must never directly import an internal component from Feature B.
- Cross-feature sharing goes through the shared/design-system layer only — this prevents circular dependencies and tight coupling that make refactors impossible later.

## Rule 22: Dependency Direction — Design System Never Imports App Code
- The shared design-system layer (`/components/ui`) must never import from feature/app-specific code — dependency direction is one-way: `feature → design-system`, never the reverse.
- Violating this silently turns a "reusable" UI library into something app-specific that can't be extracted or reused elsewhere.

## Rule 23: Props Are a Public Contract
- A shared component's public props are a stable contract; internal implementation can change freely as long as the contract holds.
- Breaking prop changes require a deprecation path (support old + new prop together for a transition period) rather than a hard cutover that breaks every consumer at once.

## Rule 24: Theming Values Are Never Hardcoded Per-Component
- Design tokens (colors, spacing, typography) are referenced from the shared token system, never hardcoded per-component — this is what makes dark mode, brand theming, or white-labeling possible later without a rewrite.
- The actual runtime propagation mechanism is owned by the `design-tokens` skill: prefer its CSS-custom-property/`data-theme` approach (Rule 3-4 there) over a React Context `ThemeProvider` for token values specifically — Context re-renders the subscribed tree on every theme change, while CSS custom properties recalculate without a React re-render. Reserve React Context for genuinely component-scoped theming needs (e.g. a compound component sharing non-token state), not for propagating the app's color/spacing tokens.
