---
name: figma-pixel-perfect
description: Use this skill whenever the user wants to convert a Figma design into pixel-perfect, mobile-responsive UI code. Trigger for phrases like "pixel perfect", "match the Figma design exactly", "convert this Figma to code", "build this design in React/Next.js/Tailwind", or any request to implement a UI from a Figma link/screenshot where visual accuracy matters. Also trigger when the user asks about a "Definition of Done" for UI work, component sign-off, or design QA. Covers design-token extraction, component-by-component build order, screenshot diffing, breakpoint mapping, exact typography/effects/asset handling, and a 9-part Definition of Done checklist for sign-off.
---

# Figma Pixel-Perfect UI Skill

This skill turns a Figma design into pixel-perfect, mobile-responsive front-end code, and defines when a component can be considered "done."

## When to use this
- User shares a Figma link/file and wants matching code (React, Next.js, HTML/CSS, Tailwind, etc.)
- User asks for "pixel perfect" UI or complains that a build doesn't match the design
- User wants a QA/sign-off checklist for UI components
- User is setting up a design-to-code workflow for a team or personal CLAUDE.md system

## Required tools
- **Figma MCP** (`get_design_context`, `get_screenshot`, `get_variable_defs`, `get_code_connect_map`, `create_design_system_rules`) — connect this before starting; without real design context, "pixel perfect" is not achievable, only "close approximation."
- Browser/screenshot capability for visual diffing (Rule 3)
- Real-device or BrowserStack-style testing for final QA (Rule 11)

## Workflow

1. **Extract tokens first.** Pull Figma variables and map them to Tailwind config / CSS vars before writing any component. Never guess pixel values from a screenshot.
2. **Build atomic components first**, not full pages. Verify each one before composing.
3. **Diff every component** against its Figma screenshot before moving on.
4. **Map every breakpoint explicitly** (desktop/tablet/mobile) — don't assume linear scaling between frames.
5. **Use exact values** for fonts (`@font-face`, no fallback fonts), effects (shadow/blur/gradient), and assets (SVG for icons, WebP/PNG @2x for images).
6. **Verify auto-layout → flexbox conversion manually** — don't trust MCP output blindly for wrapping/gap/space-between edge cases.
7. **Spec interaction states explicitly** (hover/focus/active/disabled) — Figma usually only shows the default state.
8. **Test on real devices**, not just browser resize, before sign-off.

See `references/rules.md` for the full 12-rule breakdown with rationale for each.

## Definition of Done

Before marking any component "pixel-perfect: done," run it through the 9-part checklist in `references/definition-of-done.md` (token compliance, structural accuracy, visual diff, typography, effects, assets, responsive coverage, interaction states, device QA). Do not mark a component done with any unchecked item.

## Notes on ceiling

Following this workflow reliably reaches ~95-99% visual accuracy. The remaining margin is closed by the human eye-check in the final device QA pass (step 9 of the Definition of Done) — no rule set fully replaces that.

## Notes
- This skill governs one-time/per-component design-to-code matching. For the ongoing token pipeline, theming, and dark mode system once tokens outgrow a single Figma pull, see `design-tokens`.
