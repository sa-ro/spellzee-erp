---
name: documentation-storybook
description: Use this skill whenever the user is documenting components, setting up or writing Storybook stories, writing a README, recording an architecture decision, or documenting hooks/utilities/API contracts. Trigger for phrases like "add a story for this", "document this component", "set up Storybook", "write the README", "record this decision", "document this hook", or any request involving component documentation, ADRs, or changelogs. Also trigger for Definition of Done review before a release.
---

# Documentation & Storybook Skill

Defines how components, hooks, and project-level decisions are documented — using Storybook + CSF3 + autodocs as the component-documentation standard (project-detected like other skills), with ADRs, READMEs, and changelogs covering what Storybook can't.

## Step 0: Detect Project Context Before Applying Any Rule

**Always do this first.**

**Existing project?**
- Check `package.json` for `storybook`/`@storybook/*`. Follow the existing story format/organization — don't introduce a competing documentation tool.

**New project?**
- Default to Storybook with CSF3 and `tags: ['autodocs']` — every component gets a `.stories.tsx` file as part of building it, not as an afterthought.

## When to use this
- Adding or updating a component's Storybook stories
- Writing JSDoc/TSDoc for props, hooks, or utility functions
- Writing or updating the project README
- Recording a significant architectural decision (ADR)
- Maintaining a changelog for a shared component library
- Reviewing a PR or running Definition of Done before a release

## Core principles (see `references/rules.md` for full detail with rationale)

1. **Storybook + CSF3, project-detected** — every component gets a story file as part of being built
2. **`autodocs` generates the baseline** — fed by strict TypeScript types and JSDoc
3. **One story per meaningful state/variant** — not just a single default story
4. **Figma embedded alongside stories** — cross-references `figma-pixel-perfect`
5. **Play functions document interaction** — reusable as tests, per `testing-frontend`
6. **Visual regression runs on the story set** — cross-references `testing-frontend`
7. **Accessibility addon surfaces issues at the docs layer** — cross-references `accessibility`
8. **Non-visual code gets its own documentation layer** — TSDoc/JSDoc for hooks/utilities
9. **README covers setup, conventions, and pointers** — short and pointer-heavy
10. **ADRs for significant, hard-to-reverse decisions**
11. **Comments explain why; docs explain what/how** — cross-references `code-review-checklist`
12. **Documentation ships with the code change**, same PR
13. **Document the i18n mechanism itself**, not just its use
14. **Onboarding documentation** for new developers
15. **Documentation has an owner and a staleness check**
16. **Storybook deployed and linkable**, not local-only
17. **Controls addon** for interactive prop exploration
18. **Known limitations documented explicitly**
19. **Changelog for shared component/library changes**
20. **Deprecation notices visible in the docs UI**, not just JSDoc
21. **Stories organized in a clear, discoverable hierarchy**
22. **Central pointer to the current API contract**
23. **Narrative usage examples** beyond auto-generated prop tables

## Workflow

1. **Step 0 first, always**: detect existing Storybook convention, or set CSF3 + autodocs as the standard.
2. As a component is built (per `component-architecture`): write its story file alongside it, covering its realistic states (Rule 3).
3. For non-visual code: JSDoc/TSDoc on exports, plus a narrative example for anything non-trivial.
4. For significant decisions: a short ADR, dated and reasoned.
5. Before sign-off: run through `references/definition-of-done.md`.

## Notes
- This skill is the documentation layer for everything the other nine skills produce — it doesn't redefine their rules, it ensures they're discoverable and stay current. Deprecation notices extend `component-architecture` Rule 23; changelog and ADR practice support the project-detection Step 0 pattern used across `state-management`, `api-integration`, `form-handling-validation`, and `testing-frontend`.
- Grounded in official Storybook documentation, TSDoc, Keep a Changelog conventions, and the ADR community practice — see `references/sources.md`.
