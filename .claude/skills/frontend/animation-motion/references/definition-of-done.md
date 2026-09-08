# Definition of Done — Animation & Motion

## 1. Setup & Library Choice
- [ ] Existing animation library convention detected and followed
- [ ] CSS used for simple transitions; Framer Motion used only where orchestration/gesture/layout/exit animation is actually needed

## 2. Accessibility
- [ ] `prefers-reduced-motion` respected by this animation, via the shared mechanism (not a one-off check)
- [ ] Gesture-driven interaction has a non-gesture (keyboard/button) equivalent

## 3. Performance
- [ ] Only `transform`/`opacity` animated for movement — no `top`/`left`/`width`/`height` animation
- [ ] Animation-heavy route checked against the performance budget; motion library code-split to routes that use it

## 4. Design Consistency
- [ ] Duration/easing pulled from the shared motion scale, not invented per-component
- [ ] Animation's purpose (feedback/continuity/attention) can be stated in one sentence

## 5. Correctness
- [ ] Exit animations complete before unmount — no abrupt mid-animation removal
- [ ] Layout animations scoped to the elements that need them, not causing unrelated reflow
- [ ] Entrance animation doesn't block the element's own interactivity without deliberate reason
- [ ] List reordering animates individual items, not a full repaint

## 6. Loading & Scroll
- [ ] Loading state uses a skeleton/purposeful indicator matching content shape, not a default spinner
- [ ] Scroll-triggered reveal doesn't gate content visibility if JS/observer hasn't fired

## 7. EdTech & i18n
- [ ] Interactive-lesson animation is driven by explicit state, testable independent of animation internals
- [ ] Directional animation uses logical start/end, mirrors correctly for RTL locales

## Sign-off
Only mark "animation-motion: done" once all sections are checked.
