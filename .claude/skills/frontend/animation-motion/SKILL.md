---
name: animation-motion
description: Use this skill whenever the user is adding motion — page/route transitions, micro-interactions, hover/press animation, list reordering animation, loading/skeleton animation, or scroll-triggered effects. Trigger for phrases like "animate this", "add a transition", "make this feel smoother", "Framer Motion", "View Transitions API", "the animation is janky", "reduce motion", or any request involving CSS transitions/keyframes, `motion`/Framer Motion, or interactive-lesson animation for an EdTech product. Also trigger for Definition of Done review on a feature involving motion.
---

# Animation & Motion Skill

Defines how motion is implemented — CSS-first for simple cases, Framer Motion (`motion`) for orchestrated/gesture-driven interaction, with `prefers-reduced-motion` respected everywhere and performance treated as a hard constraint, not an afterthought.

## Step 0: Detect Project Context Before Applying Any Rule

**Existing project?**
- Check `package.json` for `framer-motion`/`motion`, `react-spring`, `gsap`, `@formkit/auto-animate`. Follow whatever is already established.

**New project / no precedent?**
- Default to **CSS transitions/keyframes** for simple state changes (hover, focus, fade, simple enter/exit). Default to **Framer Motion (`motion`)** only when orchestration, gesture-drag, shared-layout, or exit animation is actually needed — don't pull in a JS animation library for what CSS can do alone.

## When to use this
- Adding any transition, micro-interaction, or page/route animation
- Animating list reordering, drag interactions, or shared-element/layout transitions
- Building loading/skeleton states
- Reviewing animation for jank, accessibility, or unnecessary library weight
- Reviewing a PR or running Definition of Done for a feature involving motion

## Core principles (see `references/rules.md` for full detail with rationale)

1. **CSS-first, Framer Motion only when orchestration/gestures are actually needed**
2. **`prefers-reduced-motion` is respected everywhere, not just on "big" animations**
3. **Animate compositor-friendly properties (`transform`, `opacity`) — never `top`/`left`/`width`/`height` for movement**
4. **Every animation has a purpose** — feedback, continuity, or attention direction, never decoration alone
5. **Duration and easing follow a shared scale**, not ad hoc per-component values
6. **Loading states use skeletons/purposeful motion, not an infinite spinner as the default**
7. **Exit animations are handled deliberately** (`AnimatePresence` or equivalent) — unmounting mid-animation is a visible glitch
8. **Layout animations (`layout`, `layoutId`) are scoped**, not applied broadly where they cause unrelated reflow
9. **Scroll-triggered animation degrades gracefully** and never blocks reading/interaction
10. **Animation never blocks interactivity** — a disabled button during its own entrance animation is a bug
11. **List reordering animates individual items, not a full re-render/repaint**
12. **Gesture-driven interaction (drag, swipe) includes a non-gesture fallback** for accessibility/input-method coverage
13. **Animation-heavy routes are performance-budgeted** — cross-references `performance-optimization`
14. **EdTech interactive-lesson animation is state-driven and testable**, not a black-box timeline
15. **Motion respects RTL layout direction** — cross-references `i18n-l10n`

## Workflow

1. **Step 0 first, always**: detect existing animation library, or default to CSS-first with Framer Motion for orchestration needs.
2. Choose the animatable properties (`transform`/`opacity`) before writing the animation.
3. Wire `prefers-reduced-motion` handling into the shared motion utility/theme, not per-component.
4. For gesture/orchestrated interaction: use Framer Motion, define shared duration/easing tokens.
5. Before sign-off: run through `references/definition-of-done.md`.

## Notes
- This skill governs how motion is implemented. For the accessibility requirement behind `prefers-reduced-motion` itself, see `accessibility`. For animation bundle-weight/performance budget, see `performance-optimization`.
- Grounded in official Framer Motion, MDN CSS Animations/Compositing, W3C `prefers-reduced-motion`, and Material Design Motion documentation — see `references/sources.md`.
