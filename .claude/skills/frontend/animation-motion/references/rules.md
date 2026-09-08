# Animation & Motion Rules

## Rule 1: CSS-First, Framer Motion Only When Orchestration Is Needed
- Simple state-driven transitions (hover, focus, a fade/slide on mount) use CSS transitions or `@keyframes` — no JS animation library needed.
- Reach for Framer Motion (`motion`) only when the interaction requires orchestration (staggered children), gesture handling (drag), shared-layout transitions (`layoutId`), or exit animation (`AnimatePresence`) — capabilities CSS alone can't express well.
- Never add a JS animation library to a project as the default for every animation; it's justified per-interaction, not per-project.

## Rule 2: `prefers-reduced-motion` Respected Everywhere
- Every non-trivial animation (not just large/flashy ones) checks `prefers-reduced-motion` and substitutes a reduced or instant transition — implemented once as a shared CSS media query block or a Framer Motion hook/wrapper, not re-checked ad hoc per component.
- "Reduced" means removing large-scale movement/parallax/auto-play motion, not necessarily removing all visual feedback (a color/opacity change can remain).

## Rule 3: Animate Compositor-Friendly Properties Only
- Movement and scale animations use `transform` (`translate`, `scale`, `rotate`) and `opacity` — properties the browser compositor can animate off the main thread.
- Never animate `top`/`left`/`width`/`height`/`margin` for movement — these trigger layout recalculation on every frame and are a primary cause of janky animation, especially on the low-end Android devices this EdTech audience uses (cross-references `performance-optimization`).

## Rule 4: Every Animation Has a Purpose
- Motion exists to give feedback (a button press acknowledges the tap), maintain continuity (an element's origin/destination is clear across a transition), or direct attention (a new item appearing) — not as decoration for its own sake.
- If an animation's purpose can't be stated in one sentence, it's a candidate for removal.

## Rule 5: Shared Duration/Easing Scale
- Duration and easing values come from a small shared scale (e.g. `fast: 150ms`, `base: 250ms`, `slow: 400ms`, with 1-2 standard easing curves) defined once in the theme/motion tokens — not invented per-component with arbitrary values like `287ms` or a bespoke cubic-bezier per animation.
- Micro-interactions (hover, press) use the fast end of the scale; larger transitions (route change, modal) use the slower end.

## Rule 6: Purposeful Loading States, Not a Default Infinite Spinner
- Loading states use skeleton screens matching the eventual content's layout, or a purposeful progress indicator, as the default — a generic infinite spinner is the fallback only when content shape is genuinely unknown in advance.
- Skeleton animation itself stays subtle (a slow shimmer) and respects `prefers-reduced-motion`.

## Rule 7: Exit Animations Handled Deliberately
- Elements that need an exit animation (a dismissed toast, a removed list item, a closed modal) are wrapped so the exit transition completes before unmount (Framer Motion's `AnimatePresence`, or a CSS transition paired with a delayed removal) — an element that's abruptly removed mid-animation is a visible glitch, not a subtle failure.

## Rule 8: Layout Animations Are Scoped
- Framer Motion's `layout`/`layoutId` props (or CSS `view-transition-name`) are applied only to the specific elements that need shared-element continuity — not broadly across a component tree where they cause unrelated siblings to reflow/animate unexpectedly.

## Rule 9: Scroll-Triggered Animation Degrades Gracefully
- Scroll-linked reveal/parallax animation never blocks the content from being readable/interactive if JS fails to load or the observer hasn't fired yet (content is visible by default; the animation enhances, it doesn't gate visibility).
- Respects `prefers-reduced-motion` by skipping the animated reveal and rendering content in its final state immediately.

## Rule 10: Animation Never Blocks Interactivity
- An element's entrance animation must not disable its own interactive affordances (a button that can't be clicked until its fade-in finishes is a bug, not a feature) unless there's a specific, deliberate reason (e.g. preventing a mis-tap during a modal's open transition, which should be brief and intentional).

## Rule 11: List Reordering Animates Individual Items
- Reordering, inserting, or removing items in a list animates each affected item's position change (Framer Motion's `layout` prop on list items, or the FLIP technique) — not a full list re-render/repaint that makes items appear to jump or flicker.

## Rule 12: Gesture-Driven Interaction Includes a Non-Gesture Fallback
- Drag/swipe interactions (reordering, dismissing a card, a carousel) have an equivalent non-gesture control (buttons, keyboard interaction) — a feature reachable only via drag/swipe excludes keyboard and switch-device users, cross-referencing the `accessibility` skill.

## Rule 13: Animation-Heavy Routes Are Performance-Budgeted
- Routes with significant motion (an interactive lesson, a course player with transitions) are checked against the project's performance budget (INP, main-thread work) — cross-references `performance-optimization`. Framer Motion's bundle weight is code-split to routes that actually use it, not included in the shared/root bundle.

## Rule 14: EdTech Interactive-Lesson Animation Is State-Driven and Testable
- Animation state in interactive lessons (a quiz reveal, a drag-to-match exercise, a progress celebration) is driven by explicit application state (correct/incorrect/pending), not by imperative timeline calls scattered through event handlers — this keeps the animation testable (assert on state, not on animation internals) and makes the lesson's logic independently verifiable from its motion.

## Rule 15: Motion Respects RTL Layout Direction
- Directional animation (slide-in-from-the-side, a progress-bar fill direction) is expressed using logical direction (start/end) rather than hardcoded left/right, so it correctly mirrors for RTL locales — cross-references `i18n-l10n`'s logical-CSS-properties rule.
