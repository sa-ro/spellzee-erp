# TypeScript Patterns Rules

## Rule 1: `strict` Mode Is the Baseline
- `tsconfig.json` has `"strict": true`, and ideally `"noUncheckedIndexedAccess": true` for a new project — these catch null/undefined and array-index bugs at compile time that would otherwise surface as runtime errors.
- Match an existing project's current strictness rather than silently tightening it project-wide in an unrelated PR — raising strictness is a deliberate, separately-reviewed change.

## Rule 2: `any` Is Never the Fix
- `any` disables type checking entirely for that value and everything derived from it — it is never an acceptable resolution to a type error. Use `unknown` and narrow it (type guards, `instanceof`, a Zod `.parse()`), or fix the actual generic/type parameter that's missing.
- The one narrow exception is a well-isolated boundary with a third-party library that has no/broken types — even then, wrap it in a typed adapter function immediately rather than letting `any` leak into application code.

## Rule 3: Discriminated Unions for Mutually Exclusive State
- State with mutually exclusive shapes (`loading` / `error` / `success`, each with different associated data) is modeled as a discriminated union with a common tag field (`status: 'loading' | 'error' | 'success'`), not as several independent optional fields (`isLoading`, `error?`, `data?`) that can be in an invalid combination (`isLoading: true` and `data` both set).
- This makes invalid states unrepresentable — the type system, not a runtime check, prevents the impossible combination.

## Rule 4: Generic Components Use a Real Type Parameter
- A genuinely reusable component whose prop/data shape varies by usage (`<List<T> items={T[]} renderItem={(item: T) => ...} />`, `<Select<T> options={T[]} />`) takes an explicit type parameter — never `any`/`unknown` prop bags with internal casts to make the JSX compile.
- Verify the type parameter is actually used in more than one place in the component's props/return before adding it (see Rule 13) — a single-use generic is unneeded complexity.

## Rule 5: Polymorphic (`as` Prop) Components Follow the Established Pattern
- A component that can render as different elements/components via an `as` prop (`<Text as="h1">`, `<Button as="a" href="...">`) uses the standard `ElementType` generic pattern (e.g. `React Typescript Cheatsheet`'s `PolymorphicComponentProp` pattern) that correctly infers and forwards the target element's own props (an `as="a"` gets `href` typed; an `as="button"` doesn't).
- Never hand-write per-element prop overloads that must be manually kept in sync as new `as` targets are added.

## Rule 6: Custom Hooks Return Typed, Inferred Values
- A custom hook's return type is inferred from its implementation wherever possible (return a typed object/tuple literal, let TypeScript infer the hook's return type) rather than manually re-declaring a matching interface that can drift from the actual implementation.
- A hook returning a fixed-order tuple (like `useState`) types it `as const` or via an explicit tuple type so consumers get correct positional types, not a widened array type.

## Rule 7: API Response Types Are Derived, Never Hand-Duplicated
- Types for API response shapes come from the Zod schema already used to validate them (`z.infer<typeof responseSchema>`, per `api-integration` and `form-handling-validation`) or from generated types (OpenAPI codegen) — never a separately hand-written interface maintained in parallel with the actual validation schema, which drifts silently when the API changes.

## Rule 8: Prefer Utility Types Over Duplicating a Shape
- Derive related types from one base via `Pick`, `Omit`, `Partial`, `Required`, or template literal types, instead of writing a second interface that repeats most of the same fields — e.g. a `CreateCourseInput` derives from `Course` via `Omit<Course, 'id' | 'createdAt'>`, not as an independently maintained type.

## Rule 9: Type-Only Imports Are Marked
- Imports used only for types are written as `import type { Foo } from '...'` (or inline `import { type Foo, bar } from '...'`) — this keeps type-only references out of the emitted JS bundle and makes the import's purpose explicit, especially important with `isolatedModules` (required by most modern bundlers/SWC).

## Rule 10: Branded Types for Non-Interchangeable Primitives
- Identifiers and values that shouldn't be accidentally interchangeable despite sharing a primitive type (a `UserId` vs. a `CourseId`, both bare `string`s) use a branded/nominal type (`type UserId = string & { readonly __brand: 'UserId' }`) so passing one where the other is expected is a compile error — reserve this for genuinely error-prone cases, not applied reflexively to every string.

## Rule 11: Exhaustiveness Enforced on Discriminated Unions
- A `switch`/`if-else` chain over a discriminated union's tag includes a `default`/final branch that assigns the remaining value to a variable typed `never` — this makes TypeScript flag the switch as incomplete the moment a new variant is added to the union, rather than silently falling through at runtime.

## Rule 12: Component Prop Types Are Exported and Documented
- A component's prop type is declared as a named, exported interface/type (`export interface ButtonProps { ... }`), not inlined anonymously in the function signature — this lets consumers (and Storybook, per `documentation-storybook`) reference and extend it, and gives JSDoc comments on individual props a home.

## Rule 13: Avoid Over-Engineering Generics
- A type parameter is added only when it's actually used to relate two or more places in a signature (input type to output type, or across multiple props) — a generic used in exactly one place adds cognitive overhead without adding type safety, and should just be the concrete type it stands in for.
- Don't build a generic abstraction for a component with only one current usage "in case it's reused later" — this mirrors the project's broader no-speculative-abstraction principle.
