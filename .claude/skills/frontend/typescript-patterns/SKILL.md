---
name: typescript-patterns
description: Use this skill whenever the user is typing a reusable component, hook, or utility beyond basic prop types — generic/polymorphic components, discriminated unions for state modeling, typing a custom hook's return, utility types, or resolving a gnarly TypeScript error. Trigger for phrases like "make this component generic", "type this polymorphic component", "as prop typing", "discriminated union", "why is TypeScript complaining here", "type this hook", "avoid any here", or any request involving generics, conditional types, or type-safe API contracts in a React/Next.js codebase. Also trigger for Definition of Done review when "no any" or type-safety is in question.
---

# TypeScript Patterns Skill

Defines how components, hooks, and utilities are typed beyond basic props — generics, polymorphic (`as` prop) components, discriminated unions for state modeling, and type-safe API contracts — so "no `any`" (assumed everywhere across the other skills) is actually achievable in practice.

## Step 0: Detect Project Context Before Applying Any Rule

**Existing project?**
- Check `tsconfig.json` for `strict` mode status and check existing components for established generic/polymorphic patterns. Match the project's current strictness level and conventions — don't introduce a stricter or more complex pattern than the codebase already uses without discussing it.

**New project / no precedent?**
- Default to `strict: true` (and `noUncheckedIndexedAccess: true`) from day one — retrofitting strict mode onto a large codebase later is expensive.

## When to use this
- Building a generic/reusable component (`<List<T>>`, `<Select<T>>`)
- Building a polymorphic component (`as` prop pattern — a `<Text as="h1">` or `<Button as="a">`)
- Modeling state as a discriminated union instead of multiple optional booleans
- Typing a custom hook's return value, especially with generics
- Resolving a type error that requires more than a quick `any` escape hatch
- Reviewing a PR or Definition of Done item for type safety ("no `any`")

## Core principles (see `references/rules.md` for full detail with rationale)

1. **`strict` mode is the baseline**, not an aspirational setting
2. **`any` is never the fix — `unknown` + narrowing, or a proper generic, replaces it**
3. **State with mutually exclusive shapes is a discriminated union**, not several optional fields
4. **Generic components are typed with a type parameter, not `any`/`unknown` prop bags**
5. **Polymorphic (`as` prop) components use the established `ElementType` + prop-inference pattern**, not manual overloads per element
6. **Custom hooks return a typed tuple or object, inferred, not hand-annotated redundantly**
7. **API response types are derived from a schema (Zod) or generated (OpenAPI), never hand-written and left to drift**
8. **Utility types (`Pick`, `Omit`, `Partial`, template literal types) are preferred over duplicating a shape**
9. **Type-only imports are marked `import type`**, keeping runtime bundles free of type-only code
10. **Branded/nominal types for primitives that shouldn't be interchangeable** (a `UserId` isn't a bare `string`)
11. **Exhaustiveness is enforced** on discriminated union `switch`/`if` chains via a `never` check
12. **Component prop types are exported and documented**, not inlined and unreusable
13. **Avoid over-engineering generics** — a type parameter used in only one place is unnecessary complexity

## Workflow

1. **Step 0 first, always**: confirm the project's strictness level and existing generic/polymorphic conventions.
2. Model any state with mutually exclusive variants as a discriminated union before reaching for optional booleans.
3. For a genuinely reusable component, add a type parameter — verify it's used in at least two places before doing so.
4. Replace any `any` with `unknown` + narrowing, or the correct generic.
5. Before sign-off: run through `references/definition-of-done.md`.

## Notes
- This skill governs typing patterns for components/hooks/utilities. For where prop types intersect with polymorphic/composition decisions structurally, see `component-architecture`. For API response contract typing specifically, see `api-integration`.
- Grounded in official TypeScript Handbook, React TypeScript Cheatsheet, and Zod documentation — see `references/sources.md`.
