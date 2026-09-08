# Accessibility (a11y) Rules

## Rule 1: WCAG 2.2 Level AA Is the Target, Explicitly
- The project targets WCAG 2.2 Level AA conformance (the current W3C Recommendation, backward-compatible with 2.1 AA) — this is stated explicitly at project setup, not left ambiguous.
- AA is the practical, legally-referenced bar (used in ADA litigation and EAA enforcement) — AAA is not required project-wide, but specific AAA criteria can be adopted deliberately where they matter for the EdTech audience (e.g. contrast, plain language).

## Rule 2: Semantic HTML Before ARIA
- Use native HTML elements for their built-in accessibility semantics first: `<button>` not `<div onClick>`, `<nav>`/`<main>`/`<header>`/`<footer>` landmarks, `<label>` associated with inputs.
- ARIA is added only when semantic HTML genuinely cannot express the pattern (custom widgets like comboboxes, tabs, accordions) — "no ARIA is better than bad ARIA" (incorrect ARIA roles/states are worse than none, per WAI-ARIA authoring guidance).

## Rule 3: Heading Hierarchy Is Structural, Not Visual
- Exactly one `<h1>` per page; headings nest in order (`h2` inside a section under `h1`, never skipping from `h2` to `h4`) — heading level is chosen for document structure, not for what font-size looks right (that's a styling concern, solved with CSS, not by picking the "wrong" heading level).

## Rule 4: Color Contrast Meets WCAG AA Minimums
- Normal text: minimum 4.5:1 contrast ratio against its background. Large text (18pt+/14pt+ bold) and UI component boundaries: minimum 3:1.
- Checked at design-token level (ties to the `figma-pixel-perfect` skill's token extraction) — don't discover a contrast failure only after implementation.

## Rule 5: Never Convey Information by Color Alone
- Error states, required-field indicators, status (pass/fail, correct/incorrect in a quiz), and chart/graph data series must be distinguishable without color (icon, text label, pattern) — color-blind users (~1 in 12 men) cannot rely on color-only cues.

## Rule 6: Full Keyboard Operability
- Every interactive element (buttons, links, custom widgets, drag targets) is reachable and operable via keyboard alone — `Tab` to focus, `Enter`/`Space` to activate, arrow keys for composite widgets (tabs, menus) per WAI-ARIA APG patterns.
- No functionality requires a mouse/touch-only gesture (hover-only reveal, drag-only reordering) without a keyboard-accessible equivalent (ties to WCAG 2.5.7 Dragging Movements).

## Rule 7: Visible Focus Indicators, Never Silently Removed
- Never `outline: none` without an equally visible replacement focus style — removing focus indication for aesthetic reasons breaks keyboard navigation for sighted keyboard users entirely.
- Focused elements must not be completely hidden by sticky headers, chat widgets, or overlays (WCAG 2.4.11 Focus Not Obscured).

## Rule 8: Logical Tab Order
- Tab order follows visual/reading order — achieved through correct DOM order, not `tabindex` values greater than 0 (positive tabindex creates a separate, confusing tab sequence and should never be used).
- `tabindex="-1"` is fine for programmatic focus targets (e.g. focusing an error summary); `tabindex="0"` only for custom interactive elements that need to join the natural tab order.

## Rule 9: Focus Management on Dynamic UI
- Modals/dialogs trap focus within themselves while open and restore focus to the triggering element on close.
- Route changes (Next.js navigation) move focus to the new page's main heading/content region — a silent route change with no focus movement disorients screen reader users.
- This coordinates with the `form-handling-validation` skill's focus-on-error rule — same underlying discipline, applied wherever focus needs to move programmatically.

## Rule 10: Skip Link for Repeated Navigation
- A "skip to main content" link is the first focusable element on the page (visually hidden until focused) — lets keyboard/screen-reader users bypass repeated navigation menus on every page.

## Rule 11: Accessible Names for Every Interactive Element
- Icon-only buttons have `aria-label` (or visually-hidden text) describing their action ("Close", "Delete course", not just an X icon with no name).
- All meaningful images have descriptive `alt` text; purely decorative images use `alt=""` (empty, not missing) so screen readers skip them rather than reading a filename.

## Rule 12: Live Regions for Dynamic Content Announcements
- Content that updates without a page reload and needs to be noticed by screen reader users (toast notifications, async save-status, quiz score reveal, live class attendee count) uses `aria-live` (`polite` for non-urgent updates, `assertive` sparingly for critical/urgent ones) so the change is announced.
- Loading states that resolve into new content announce the resolution, not just the spinner appearing — a screen reader user needs to know when the wait is over.

## Rule 13: Respect `prefers-reduced-motion`
- Non-essential animations and transitions (parallax, auto-playing carousels, decorative motion) are reduced or disabled when the user's OS/browser has `prefers-reduced-motion: reduce` set — this isn't optional polish, it prevents real physical discomfort (vestibular disorders) for affected users.

## Rule 14: No Content Flashing More Than 3 Times Per Second
- Any animation, loading indicator, or transition avoids flashing more than 3 times per second (WCAG 2.3.1) — this is a seizure-risk criterion, not a style preference, and has zero tolerance for exceptions.

## Rule 15: Don't Rely Solely on Hover
- Any information or functionality exposed on hover (tooltips, hover-reveal menus) is also available via focus (keyboard) and via an explicit tap/click path (touch devices don't have hover) — hover-only patterns exclude keyboard and touch users entirely.

## Rule 16: Video Captions and Transcripts (EdTech-Critical)
- All course video content ships with accurate closed captions and a text transcript — this serves deaf/hard-of-hearing students, non-native speakers following along, students in sound-sensitive environments, and is frequently a legal requirement for educational content.
- Auto-generated captions are a starting point, not a final deliverable — accuracy matters for comprehension of subject-matter terminology.

## Rule 17: Audio Description for Visually-Essential Video Content
- Where a video conveys essential information visually with no spoken equivalent (a diagram being drawn, an on-screen demonstration), provide an audio description track or ensure the narration itself describes what's shown — don't assume captions alone cover visually-conveyed content.

## Rule 18: Accessible Downloadable Content
- PDFs and other downloadable course materials are tagged/structured for accessibility (proper heading tags, alt text, reading order) — accessibility work on the web UI doesn't cover content that leaves the page as a download.

## Rule 19: Zoom and Text Resize Support
- Content remains usable and doesn't lose functionality or clip content at 200% browser zoom or text-only resize (WCAG 1.4.4/1.4.10) — layouts use relative units (`rem`/`em`) and reflow rather than fixed pixel containers that break at zoom.

## Rule 20: Page and Content Language Attributes
- The page declares its primary language (`<html lang="en">`); any inline content in a different language is wrapped with its own `lang` attribute — this drives correct screen reader pronunciation.

## Rule 21: Cognitive Accessibility — Clear Language and Consistent Patterns
- Instructions and UI copy use plain, direct language appropriate to the audience (student-facing content especially — avoid unnecessary jargon).
- Navigation patterns and component behavior stay consistent across the product — the same icon/action means the same thing everywhere (WCAG 3.2.3/3.2.4 Consistent Navigation/Identification).

## Rule 22: Touch Target Minimum Size
- Interactive elements meet a minimum target size of 24x24px (WCAG 2.2's 2.5.8 Target Size Minimum) — this coordinates with the `figma-pixel-perfect` skill's 44x44 mobile touch-target rule, which is the stricter mobile-specific bar; follow whichever is stricter for a given context.

## Rule 23: Automated Testing Is a Floor, Not a Ceiling
- Automated tools (axe-core via `jest-axe` or Playwright's axe integration, `eslint-plugin-jsx-a11y` at lint-time) are wired into CI — but automated tools only catch roughly 30-57% of real-world accessibility issues by volume, and cover a minority of WCAG success criteria that can be fully automated.
- A green automated scan is never treated as "accessibility done" — it's the floor that catches regressions, not proof of conformance.

## Rule 24: Manual Keyboard and Screen Reader Testing Required
- Every significant feature gets a manual keyboard-only pass (unplug the mouse, navigate the whole flow) before shipping.
- Critical user flows (enrollment, quiz-taking, course navigation) get at least a spot-check with a real screen reader (NVDA on Windows, VoiceOver on Mac/iOS) — automated tools cannot verify that the experience actually makes sense when heard rather than seen.

## Rule 25: Adjustable or Extendable Time Limits (WCAG 2.2.1)
- Any time limit in the product (session timeout, timed content) can be turned off, adjusted, or extended by the user before it expires — unless the time limit is essential to what's being measured (e.g. a genuinely timed assessment where the time limit is the point).
- This is distinct from the `form-handling-validation` skill's timed-assessment-integrity rule: that rule is about the assessment being fair/tamper-resistant once a time limit is chosen; this rule is about giving users a way to get more time for non-essential timeouts (session expiry warnings, auto-logout) in the first place.

## Rule 26: Accessible Authentication (WCAG 2.2's 3.3.8)
- Login/signup does not require a cognitive function test (solving a puzzle, transcribing a code from memory) as the only way to authenticate, unless an accessible alternative is also provided.
- Password fields allow paste and don't block browser/password-manager autofill — this connects to the `form-handling-validation` skill's `autoComplete` rule; blocking paste "for security" is a usability regression that WCAG explicitly flags.

## Rule 27: Avoid Redundant Entry (WCAG 3.3.7)
- In a multi-step flow (enrollment, multi-step course creation), information already provided earlier in the same process is not asked for again — either auto-populate it or let the user select "same as above," rather than requiring re-entry of the same data.

## Rule 28: Adjustable Text Spacing (WCAG 1.4.12)
- Layouts don't break or clip content when a user overrides line-height, paragraph spacing, letter-spacing, or word-spacing via browser/OS accessibility settings or a browser extension — this matters in particular for users with dyslexia who rely on increased spacing for readability.

## Rule 29: Consistent Help Mechanism Placement (WCAG 3.2.6)
- If the product offers a help/contact/support mechanism (chat widget, help link, FAQ), it appears in the same relative location across pages where it's present — not moved or renamed inconsistently page-to-page.
