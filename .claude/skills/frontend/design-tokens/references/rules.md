# Design Tokens & Theming Rules

## Rule 1: Tokens Are the Single Source of Truth
- Design values (colors, spacing, typography, radii, shadows) are defined once in a token source (a `tokens.json`/Style Dictionary config, ideally synced from Figma Variables via `figma-pixel-perfect`'s `get_variable_defs`) and transformed at build time into every consuming format (CSS custom properties, Tailwind theme config, TypeScript constants) — never hand-maintained separately in each format, which drifts the moment one is updated and the others aren't.

## Rule 2: Semantic Tokens Wrap Primitive Tokens
- Two layers exist: primitive tokens (`blue-600`, `space-4`, raw values) and semantic tokens that reference them for a specific purpose (`color-text-primary`, `color-surface-danger`, `spacing-card-padding`). Components and application code reference only semantic tokens — never a raw primitive or hex value directly — so that changing what "primary text color" means (a rebrand, a theme) is a one-line change to the semantic token's mapping, not a find-and-replace across every component.

## Rule 3: Theming Is a Token-Value Swap, Not Conditional Styling Logic
- Light/dark (and multi-brand, if applicable) theming works by swapping which primitive value a semantic token resolves to — never by scattering `theme === 'dark' ? '#fff' : '#000'` conditionals through component code. A component's styling references `var(--color-text-primary)` unconditionally; the theme layer decides what that variable currently equals.

## Rule 4: CSS Custom Properties Carry the Runtime Theme
- The active theme's token values are set as CSS custom properties at a root scope (`:root` or a theme-root wrapper element), toggled via a `data-theme` attribute or class — this means switching themes costs a CSS recalculation, not a React re-render of the entire component tree, and works correctly with SSR (the server can set the initial `data-theme` from a cookie/header before any JS runs).

## Rule 5: Dark Mode Isn't Just Color Inversion
- Dark mode is deliberately re-specified, not auto-inverted: contrast ratios are re-verified against `accessibility`'s WCAG contrast requirements for the dark palette specifically (a color pair that passes contrast in light mode doesn't automatically pass in dark mode), elevation/shadow is often re-expressed as a lighter surface color rather than a visible shadow (shadows read poorly on dark backgrounds), and images/icons/illustrations get an explicit dark-mode treatment (a light-background logo needs a dark-mode variant, not to render on a mismatched background).

## Rule 6: Token Changes Are Reviewed for Downstream Impact
- Because semantic tokens are built on primitives (Rule 2), changing a primitive token's value can silently ripple into every semantic token that references it, and every component using those semantic tokens — a PR changing a primitive token includes (or the reviewer checks) a visual diff of the components most affected, consistent with `figma-pixel-perfect`'s screenshot-diffing discipline and `code-review-checklist`'s review standards.

## Rule 7: No Hardcoded Design Values in Component Code
- Component styles reference tokens for color, spacing, border-radius, shadow, and typography scale — a hardcoded `padding: 13px` or `color: #3B82F6` inside a component is a token-system violation (either an existing token should be used, or a genuinely missing token should be added to the system, not worked around locally).

## Rule 8: Token Naming Follows a Consistent, Documented Scale
- Token names follow one documented naming convention (e.g. `{category}-{property}-{variant}-{state}`: `color-button-primary-hover`) applied consistently — not accumulated ad hoc as different designers/PRs introduce their own naming style, which makes the token set hard to search and invites near-duplicate tokens for the same actual value.

## Rule 9: Theme Flash on Load Is Prevented
- The initial theme (light/dark, respecting a saved user preference or `prefers-color-scheme`) is determined before first paint — via a server-read cookie/header setting the initial `data-theme` for SSR, or a synchronous inline script for a client-only app — so there is no visible flash of the wrong theme immediately followed by a flip to the correct one. A theme flash is a specific, well-known, and avoidable bug class.

## Rule 10: Multi-Brand Tokens Are Scoped and Swappable
- If the product supports multiple brands/white-labeling, each brand's token values are defined as a complete, scoped override set (a brand-specific theme file mapping the same semantic token names to that brand's primitives) — not an accumulating pile of `if (brand === 'x')` conditionals through component and styling code. Only build this layer when multi-brand support is an actual, current requirement — not speculatively.

## Rule 11: Token Documentation Is Generated and Kept Current
- The token set (available semantic tokens, their purpose, current light/dark values) is documented in a way that stays in sync with the actual token source — ideally auto-generated from the token pipeline (a Storybook addon or a generated reference page) rather than a hand-written doc that drifts, cross-referencing `documentation-storybook`'s living-documentation principle.
