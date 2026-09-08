---
name: accessibility
description: Use this skill whenever the user is building UI that needs to be accessible — semantic HTML, ARIA usage, keyboard navigation, focus management, color contrast, screen reader support, captions/transcripts for video, or WCAG compliance review. Trigger for phrases like "make this accessible", "WCAG compliant", "screen reader support", "keyboard navigation", "focus trap", "aria-label", "color contrast", "captions for this video", or any request involving a11y. Also trigger for Definition of Done review on an accessibility feature or before shipping any user-facing UI.
---

# Accessibility (a11y) Skill

Defines how UI is built to meet WCAG 2.2 Level AA — semantic HTML, keyboard operability, focus management, screen reader support, motion/sensory considerations, and EdTech-specific media accessibility (captions, transcripts) for course content.

## When to use this
- Building any new user-facing UI component or page
- Adding ARIA attributes, keyboard handling, or focus management
- Reviewing color contrast or color-only information cues
- Adding video/audio course content (captions, transcripts, audio description)
- Setting up automated accessibility testing (axe-core, jsx-a11y)
- Reviewing a PR or running Definition of Done before shipping

## Core principles (see `references/rules.md` for full detail with rationale)

1. **WCAG 2.2 Level AA is the explicit target**
2. **Semantic HTML before ARIA** — native elements first, ARIA only where semantics can't express the pattern
3. **Structural heading hierarchy** — not chosen for visual size
4. **Color contrast meets AA minimums** — 4.5:1 normal text, 3:1 large text/UI
5. **Never color-alone for information** — icon/text/pattern alongside color
6. **Full keyboard operability** — every interaction has a keyboard path
7. **Visible focus indicators** — never removed without replacement
8. **Logical tab order** — DOM order, no positive `tabindex`
9. **Focus management on dynamic UI** — modals trap/restore, route changes move focus
10. **Skip link** for repeated navigation
11. **Accessible names** — icon buttons labeled, images have appropriate alt text
12. **Live regions** for dynamic content announcements
13. **Respect `prefers-reduced-motion`**
14. **No flashing >3 times/second** — zero tolerance, seizure risk
15. **No hover-only** information or functionality
16. **Video captions and transcripts (EdTech-critical)**
17. **Audio description** for visually-essential video content
18. **Accessible downloadable content** (tagged PDFs)
19. **Zoom/text-resize support** without content loss
20. **Language attributes** for correct screen reader pronunciation
21. **Cognitive accessibility** — plain language, consistent patterns
22. **Touch target minimum size** — 24x24px WCAG floor, 44x44 mobile per `figma-pixel-perfect`
23. **Automated testing is a floor, not proof of conformance**
24. **Manual keyboard and screen reader testing required**
25. **Adjustable/extendable time limits** (WCAG 2.2.1) — distinct from assessment-integrity timing
26. **Accessible authentication** (WCAG 3.3.8) — no forced cognitive test, paste/autofill allowed
27. **Avoid redundant entry** (WCAG 3.3.7) — don't re-ask for the same info in one flow
28. **Adjustable text spacing** (WCAG 1.4.12) — layout tolerates user overrides
29. **Consistent help mechanism placement** (WCAG 3.2.6)

## Workflow

1. Build with semantic HTML first; reach for ARIA only for genuinely custom widgets.
2. Verify keyboard operability and focus behavior as you build, not as an afterthought pass.
3. For any video/media content: captions and transcript are part of the deliverable, not optional polish.
4. Wire automated testing into CI, but always pair it with a manual keyboard + screen reader pass before shipping.
5. Before sign-off: run through `references/definition-of-done.md`.

## Notes
- This skill governs UI-wide accessibility. For form-specific accessible error handling, see `form-handling-validation` (which this skill cross-references for focus-on-error and `autoComplete`). For touch-target sizing and design-token contrast checks at the design stage, see `figma-pixel-perfect`. For accessible-by-default component API design (e.g. the `as` prop pattern, ARIA passthrough), see `component-architecture`.
- Grounded in the official WCAG 2.2 W3C Recommendation, WAI-ARIA Authoring Practices, axe-core's documented automation coverage, and MDN — see `references/sources.md`.
