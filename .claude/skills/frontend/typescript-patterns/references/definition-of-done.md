# Definition of Done — TypeScript Patterns

## 1. Configuration
- [ ] `strict` mode confirmed as the project baseline (or matches existing project convention)

## 2. No `any`
- [ ] No `any` in new/changed code — `unknown` + narrowing or a proper generic used instead
- [ ] Any unavoidable third-party untyped boundary is wrapped in a typed adapter, not left leaking `any`

## 3. State Modeling
- [ ] Mutually exclusive state modeled as a discriminated union, not multiple independent optional fields
- [ ] `switch`/`if` chains over a union include an exhaustiveness (`never`) check

## 4. Generics & Polymorphism
- [ ] Generic components use a real type parameter used in more than one place — not added speculatively
- [ ] Polymorphic (`as` prop) components follow the established `ElementType` inference pattern, not manual per-element overloads

## 5. Hooks & API Types
- [ ] Custom hook return types are inferred, not redundantly hand-annotated in a way that can drift
- [ ] API response types derive from the Zod schema (or generated types), not a separately hand-written interface

## 6. Reuse & Imports
- [ ] Related types derived via `Pick`/`Omit`/`Partial` rather than duplicated
- [ ] Type-only imports marked `import type`
- [ ] Component prop types are exported, named interfaces — not inlined anonymously

## Sign-off
Only mark "typescript-patterns: done" once all sections are checked.
