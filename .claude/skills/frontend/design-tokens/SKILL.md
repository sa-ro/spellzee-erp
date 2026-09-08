---
name: design-tokens
description: Use this skill whenever the user is setting up or maintaining a design token pipeline, theming system, dark mode, or multi-brand styling — not matching one Figma file 1:1 (that's `figma-pixel-perfect`), but the ongoing system that keeps colors/spacing/typography consistent and themeable across the whole product as it grows. Trigger for phrases like "set up design tokens", "add dark mode", "Style Dictionary", "theming system", "multi-brand support", "the colors are inconsistent across the app", "token pipeline", "CSS custom properties for theming", or any request involving a systematic token/theme architecture. Also trigger for Definition of Done review when a change touches shared design tokens.
---

# Design Tokens & Theming Skill

Defines the ongoing token pipeline and theming architecture — how colors, spacing, typography, and other design primitives are defined once, transformed into usable formats, and support light/dark (and potentially multi-brand) theming — distinct from `figma-pixel-perfect`'s one-time design-to-code matching and `component-architecture`'s per-component styling decisions.

## Step 0: Detect Project Context Before Applying Any Rule

**Existing project?**
- Check for an existing token source (`tokens.json`, a Figma Variables export, `tailwind.config` theme extension, CSS custom properties in a global stylesheet) and a build step (Style Dictionary or similar) that transforms them. Follow the established pipeline.

**New project / no precedent?**
- Default to **CSS custom properties** as the runtime theming mechanism (native, no-JS-cost theme switching, works with SSR) — this part isn't a close call regardless of build-tooling choice. For the token *source*/build step specifically, **Style Dictionary** is the default recommendation (widest platform-output support, most established), but this is a build-tooling judgment call, not a settled fact — a lighter hand-written token file with a small custom transform script is a reasonable alternative for a small design system, and should be confirmed with the user rather than assumed. Consumed via **Tailwind's** theme configuration if Tailwind is already the project's styling approach (per `component-architecture`/`figma-pixel-perfect`'s conventions).

## When to use this
- Setting up a token pipeline from scratch, or extending it with a new token category
- Adding or maintaining dark mode
- Supporting multiple brands/white-label theming
- Diagnosing visual inconsistency (colors/spacing drifting across the app)
- Reviewing a PR or Definition of Done when a change touches shared tokens

## Core principles (see `references/rules.md` for full detail with rationale)

1. **Tokens are the single source of truth**, generated into platform-specific formats — never hand-maintained separately in CSS and Tailwind config and Figma
2. **Semantic tokens wrap primitive tokens** — components reference `color-text-primary`, never a raw hex or `gray-800` directly
3. **Theming (light/dark/brand) is a token-value swap**, not conditional styling logic scattered through components
4. **CSS custom properties carry the runtime theme**, set at the root, so theme switching costs no re-render of the component tree
5. **Dark mode isn't just color inversion** — contrast, elevation/shadow, and image/icon treatment are deliberately re-specified per `accessibility`'s contrast requirements
6. **Token changes are reviewed for downstream impact** — a primitive token change can silently affect every semantic token built on it
7. **No hardcoded design values in component code** — spacing, color, radius, shadow all reference tokens
8. **Token naming follows a consistent, documented scale**, not ad hoc per-designer/per-PR naming
9. **Theme flash on load is prevented** (no flash of light theme before dark mode applies) — a deliberate SSR/hydration strategy
10. **Multi-brand tokens (if needed) are scoped and swappable**, not a growing pile of brand-specific conditionals
11. **Token documentation is generated/kept current**, cross-references `documentation-storybook`

## Workflow

1. **Step 0 first, always**: detect the existing token pipeline, or set up Style Dictionary → CSS custom properties as the standard.
2. Define/extend primitive tokens, then semantic tokens that wrap them for actual usage.
3. For theming: implement as a token-value swap via a root-level attribute/class, not per-component conditionals.
4. Prevent theme-flash with the appropriate SSR-safe strategy.
5. Before sign-off: run through `references/definition-of-done.md`.

## Notes
- This skill governs the token/theming system itself. For matching a specific Figma design 1:1, see `figma-pixel-perfect`. For how individual components consume tokens in their styling, see `component-architecture`. For documenting the token set, see `documentation-storybook`.
- Grounded in official Style Dictionary, W3C Design Tokens Community Group, and MDN CSS Custom Properties documentation — see `references/sources.md`.
