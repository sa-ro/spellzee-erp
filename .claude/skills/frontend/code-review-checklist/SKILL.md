---
name: code-review-checklist
description: Use this skill whenever the user is reviewing a pull request, preparing a PR for review, giving or receiving code review feedback, or setting up a PR template/checklist. Trigger for phrases like "review this PR", "review this code", "what should I check before merging", "give feedback on this diff", "set up a PR template", or any request involving code review standards. **Frontend code only** — backend review belongs to `backend/testing-debugging-review`, the final pre-merge gate to `backend/workflow-pre-merge-review`, and architecture-erosion review to the `erosion-auditor` agent. Also trigger for Definition of Done review before merging.
---

# Code Review Checklist Skill

Defines how code review is conducted — using Google's Engineering Practices review-dimension framework as the baseline, with explicit cross-references pulling in the security, accessibility, performance, and testing checklists from the other skills in this set, plus EdTech-specific risk review.

## When to use this
- Reviewing a teammate's (or Claude's own generated) PR
- Preparing a PR description and self-review before requesting review
- Setting up or updating a PR template
- Giving or receiving code review feedback
- Reviewing AI-assisted/generated code
- Running Definition of Done before merging

## Core principles (see `references/rules.md` for full detail with rationale)

1. **Google's eng-practices review dimensions** — design, functionality, complexity, tests, naming, comments, style, docs, in that priority
2. **"Better code," not "perfect code"** — continuous improvement, must-fix vs suggestion distinguished
3. **Small, focused PRs** — one coherent change
4. **Tests ship with the code**, same PR
5. **Self-review before requesting review**
6. **Constructive, specific, fact-based feedback**
7. **Consistency over personal preference** when multiple approaches are valid
8. **Watch for over-engineering** — solve today's problem, not a speculative one
9. **Bounded review turnaround** — same/next business day
10. **Security checklist explicit in review** — cross-references `security-practices`
11. **Accessibility checklist explicit in review** — cross-references `accessibility`
12. **Performance checklist explicit for risk-prone changes** — cross-references `performance-optimization`
13. **PR templates encode the checklist**
14. **Draft PRs for early direction feedback**
15. **UI changes include visual evidence**
16. **AI-assisted code reviewed with the same rigor** — author must be able to explain every line
17. **Comments explain why, not what**
18. **Naming review extends established conventions** — cross-references `component-architecture`
19. **Explicit conflict-resolution path** — consensus, then escalation
20. **Approval is not a rubber stamp**
21. **Breaking changes to shared components called out explicitly** with a migration path
22. **i18n regression check** — no hardcoded strings that bypassed the mechanism
23. **New dependency license compatibility** — distinct from security vetting
24. **Documentation/Storybook updated in the same PR** as behavior changes
25. **Explicit blast-radius check for high-stakes EdTech paths** — live class, assessment, grading

## Workflow

1. Author self-reviews and writes a why-focused description before requesting review (Rule 5).
2. Reviewer works top-down through the priority order (Rule 1): design and functionality first, style/naming last.
3. Cross-cutting checklist items (security, a11y, performance, i18n, licensing) are checked explicitly, not assumed to be someone else's job.
4. Feedback is labeled must-fix vs suggestion (Rule 2), delivered constructively (Rule 6).
5. Before merge: run through `references/definition-of-done.md`.

## Notes
- This skill is where the other nine skills converge at review time — it doesn't duplicate their detailed rules, it makes sure review actually checks them. For the underlying rules being checked, see `security-practices`, `accessibility`, `performance-optimization`, `component-architecture`, and `testing-frontend`.
- Grounded in Google's publicly-published Engineering Practices documentation — see `references/sources.md`.
