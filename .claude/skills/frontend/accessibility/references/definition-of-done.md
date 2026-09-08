# Definition of Done — Accessibility

A feature cannot be marked "done" until every item below is checked.

## 1. Foundational Standards
- [ ] Targets WCAG 2.2 Level AA explicitly
- [ ] Semantic HTML used before any ARIA; ARIA only where semantics can't express the pattern
- [ ] Heading hierarchy correct (one `h1`, no skipped levels)
- [ ] Color contrast meets 4.5:1 (normal text) / 3:1 (large text/UI components)
- [ ] No information conveyed by color alone

## 2. Keyboard & Focus
- [ ] Fully keyboard-operable — no mouse/touch-only functionality without a keyboard equivalent
- [ ] Visible focus indicator present on every focusable element; never removed without replacement
- [ ] Tab order matches visual/reading order; no positive `tabindex`
- [ ] Focus managed correctly on modals (trap + restore) and route changes (moved to new content)
- [ ] Skip-to-main-content link present

## 3. Names, Announcements & Media
- [ ] Every interactive element has an accessible name (icon buttons have `aria-label`)
- [ ] Meaningful images have descriptive `alt`; decorative images use `alt=""`
- [ ] Dynamic content updates use `aria-live` appropriately
- [ ] Video content has accurate captions and a transcript; audio description provided where visual content is essential
- [ ] Downloadable content (PDFs) is tagged/structured for accessibility

## 4. Motion & Sensory
- [ ] Non-essential animation respects `prefers-reduced-motion`
- [ ] No content flashes more than 3 times per second
- [ ] No hover-only information or functionality (focus and tap equivalents exist)

## 5. Zoom, Language & Cognitive
- [ ] Usable at 200% zoom / text resize without content loss or clipping
- [ ] `lang` attribute set on the page and on any differently-languaged inline content
- [ ] UI copy uses clear, plain language; navigation patterns consistent across the product
- [ ] Touch targets meet minimum size (24x24px WCAG floor; 44x44 on mobile per `figma-pixel-perfect`)

## 6. WCAG 2.2-Specific Additions
- [ ] Non-essential time limits are adjustable/extendable, or turned off
- [ ] Authentication doesn't require a cognitive test without an accessible alternative; paste and autofill are not blocked
- [ ] Multi-step flows don't ask for the same information twice
- [ ] Layout tolerates user-overridden text spacing without breaking
- [ ] Help mechanism (if present) stays in a consistent location across pages

## 7. Testing
- [ ] Automated a11y testing (axe-core / `jest-axe` / `eslint-plugin-jsx-a11y`) wired into CI — treated as a floor, not proof of conformance
- [ ] Manual keyboard-only pass completed
- [ ] Critical flows spot-checked with a real screen reader (NVDA/VoiceOver)

## Sign-off
Only mark "accessibility: done" once all sections are checked.
