# Figma-to-Code Workflow (Pixel Perfect UI)

## Rule 1: Design Tokens First
- Never hardcode px values by guessing from screenshots.
- Pull Figma variables (`get_variable_defs`) and map them into the project's actual token pipeline — for a one-off match, direct mapping to Tailwind config/CSS custom properties is fine; for an ongoing token system (primitive/semantic layering, theming, dark mode), route this through the `design-tokens` skill instead of hand-mapping per Figma pull, so the two don't drift into separate parallel token sources.
- Colors, spacing scale, font sizes, radii — all must trace back to a Figma token, not a visual estimate.

## Rule 2: Component-by-Component, Not Page-by-Page
- Never convert a whole page in one shot.
- Extract atomic components first (Button, Input, Card, Badge) from Figma using `get_design_context`.
- Compose pages only after each atomic component is verified pixel-accurate.

## Rule 3: Screenshot Diffing After Every Component
- After building a component, render it in the browser and pull `get_screenshot` from Figma for the same component.
- Visually diff both before moving to the next component.
- Do not proceed if spacing/alignment/color deviates.

## Rule 4: Explicit Breakpoint Mapping
- If Figma has separate Desktop / Tablet / Mobile frames, extract `get_design_context` for each frame separately.
- Document the spacing/typography differences between frames explicitly — never assume linear scaling.
- Mobile frame is the source of truth for mobile layout, not a scaled-down guess from desktop.

## Rule 5: No Arbitrary Tailwind Values
- Avoid `w-[437px]`, `mt-[13px]` style arbitrary values.
- Map every value to the design system's token scale (from Rule 1).
- If a value doesn't fit the scale, that's a signal the token extraction was incomplete — go back to Figma, don't force-fit.

## Rule 6: Mobile-Specific Enforcement
- Use fluid typography/spacing (`clamp()`, responsive Tailwind prefixes) instead of fixed per-breakpoint pixel matching.
- Enforce minimum 44x44 touch targets even if Figma mobile frame doesn't show it explicitly.
- Test at actual device widths (375, 390, 428, 768, 1024, 1440), not just browser resize.

## Rule 7: Exact Font Rendering
- Load the exact font-family specified in Figma via `@font-face` — no fallback fonts, no "close enough" system fonts.
- Match line-height and letter-spacing values exactly from Figma variables, not browser defaults.

## Rule 8: Manual Auto-Layout Verification
- Don't trust MCP-extracted layout data blindly for Figma auto-layout → CSS flexbox/grid conversion.
- Manually verify "space-between", "hug contents", and gap behavior — especially wrapping edge cases.

## Rule 9: Exact Effect Values
- Copy box-shadow, blur, and gradient values exactly as specified in Figma.
- No "approximately similar" — rounding errors in effects are visually noticeable and fail pixel-diff checks.

## Rule 10: Correct Asset Export Formats
- Icons → SVG (never rasterized).
- Images → WebP or PNG @2x minimum.
- `get_code_connect_map` doesn't handle SVG exports — this is a manual step every time.

## Rule 11: Real Device Testing
- Browser dev-tools resize is not sufficient — it won't catch iOS Safari vs Chrome Android rendering differences.
- Run a real-device or BrowserStack pass before marking any component "pixel-perfect."

## Rule 12: Explicit Interaction States
- Figma designs usually only show the default state.
- Hover, focus, active, and disabled states must be explicitly spec'd (colors, transitions) — don't let the developer guess these.

## Required Tools/Skills
- **Figma MCP** — `get_design_context`, `get_screenshot`, `get_variable_defs`, `get_code_connect_map`, `create_design_system_rules`
- **`component-architecture` skill** — for structural/composition decisions when Figma data doesn't map cleanly to a component boundary
- **`accessibility` skill** — for contrast/focus-state decisions when Figma doesn't spec them explicitly
- **BrowserStack (or real device lab)** — for Rule 11 verification
