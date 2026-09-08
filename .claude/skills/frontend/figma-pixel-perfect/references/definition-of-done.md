# Definition of Done — Pixel Perfect Component

A component/page cannot be marked "done" until every item below is checked.

## 1. Token Compliance
- [ ] No hardcoded px values — all spacing/color/font-size traced to a Figma token
- [ ] No arbitrary Tailwind values (`w-[437px]` style) present in the code

## 2. Structural Accuracy
- [ ] Built and verified as an atomic component before being composed into a page
- [ ] Auto-layout behavior (space-between, hug contents, gap, wrapping) manually verified against Figma — not just MCP output

## 3. Visual Diff
- [ ] Rendered component screenshotted and diffed against Figma `get_screenshot` output
- [ ] No visible deviation in spacing, alignment, or color

## 4. Typography
- [ ] Exact font-family loaded via `@font-face` (no fallback font in use)
- [ ] Line-height and letter-spacing match Figma values exactly

## 5. Effects
- [ ] Box-shadow, blur, and gradient values copied exactly (not approximated)

## 6. Assets
- [ ] Icons exported and used as SVG (not rasterized)
- [ ] Images exported as WebP or PNG @2x minimum

## 7. Responsive Coverage
- [ ] Desktop, tablet, and mobile Figma frames each pulled and documented separately
- [ ] Fluid typography/spacing (`clamp()`, responsive prefixes) used instead of fixed breakpoint pixel-matching
- [ ] Tested at real device widths: 375, 390, 428, 768, 1024, 1440
- [ ] Minimum 44x44 touch targets enforced on mobile

## 8. Interaction States
- [ ] Hover, focus, active, and disabled states explicitly implemented (not guessed)

## 9. Device QA
- [ ] Verified on a real device or BrowserStack pass (iOS Safari + Chrome Android at minimum)

## Sign-off
Only mark "pixel-perfect: done" once all 9 sections are checked. Any unchecked item = not done.
