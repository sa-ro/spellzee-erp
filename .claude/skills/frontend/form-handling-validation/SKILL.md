---
name: form-handling-validation
description: Use this skill whenever the user is building, validating, or reviewing a form — sign-up/login forms, course/content authoring forms, quiz/assessment forms, multi-step wizards, or any input collection with validation rules. Trigger for phrases like "build this form", "validate this input", "how do I handle form errors", "prevent double submit", "autosave this form", "the form loses data on refresh", or any request involving React Hook Form, Zod schemas, or form accessibility. Also trigger for Definition of Done review on a form feature.
---

# Form Handling & Validation Skill

Defines how forms are built, validated, and made resilient using React Hook Form + Zod as the standard (project-detected like `state-management` and `api-integration`), with EdTech-specific rules for timed assessments, autosave, and submission integrity.

## Step 0: Detect Project Context Before Applying Any Rule

**Always do this first.**

**Existing project?**
- Check `package.json` for `react-hook-form`, `formik`, `zod`, `yup`. Follow whatever is already established — don't introduce a second form library.

**New project / no precedent?**
- Default to **React Hook Form + Zod** via `zodResolver` — this is the standard unless the project already uses something else.

**TypeScript is non-negotiable** — form types come from `z.infer<typeof schema>`, never a separately hand-written interface.

## When to use this
- Building any new form (auth, course authoring, enrollment, profile, quiz/assessment)
- Adding or reviewing validation rules
- Handling form errors, accessibility, or double-submit prevention
- Building multi-step wizards or long-form content with autosave needs
- Building timed quiz/assessment forms
- Reviewing a PR or running Definition of Done for a form feature

## Core principles (see `references/rules.md` for full detail with rationale)

1. **React Hook Form + Zod, project-detected like other skills** — follow existing convention, or set this as the new standard
2. **Schema is the single source of truth** — validation rules and TypeScript types both derive from one Zod schema
3. **Client validation is UX; server validation is the real boundary** — critical for gradeable/assessment content
4. **Deliberate validation timing** — not "onChange from the first keystroke" by default
5. **Accessible errors** — `aria-invalid`, `aria-describedby`, focus management on failed submit
6. **Controlled vs uncontrolled follows the project's component-architecture policy**
7. **Async validation debounced and cancellable**
8. **Prevent double-submit** — disable/loading state during in-flight submission, paired with API-layer idempotency for critical actions
9. **Multi-step forms preserve state** — no silent data loss on back-navigation
10. **Autosave for long-form content (EdTech)** — essays, course authoring, long responses
11. **Conditional fields modeled in the schema** — `.refine()`/`.superRefine()`, kept in sync with UI
12. **No hardcoded validation strings** — i18n-ready
13. **Test at the behavior level** — Testing Library user queries, not internal form state
14. **Locale-aware numeric/date handling** — UTC/ISO 8601 in transit, locale display only
15. **Sanitize before rendering as HTML** — independent of schema validation, addresses XSS
16. **Scoped `watch()`/`useWatch()`** on large forms — avoid unnecessary re-renders
17. **Explicit reset-after-submit behavior**
18. **Timed assessment forms (EdTech)** — server-enforced expiry, escalating warning, no silent cutoff
19. **Navigation-away protection that doesn't enable timer-cheating** — careful handling for active assessments
20. **File upload validation at the form layer** — type/size checked on selection, immediate feedback
21. **Password field conventions** — cross-field confirm-password via `.refine()`, accessible show/hide toggle
22. **Live character/word count** for length-limited long-text fields
23. **Explicit field-level vs error-summary strategy** — deliberate choice by form size
24. **Shared schema between create/edit** — `.partial()`/`.extend()`, never two drifting schemas
25. **Correct `autoComplete` attributes** — password-manager and browser-autofill compatibility

## Workflow

1. **Step 0 first, always**: detect existing form-library convention, or set React Hook Form + Zod as the standard.
2. Define the Zod schema first — types and validation both flow from it.
3. Wire up React Hook Form with `zodResolver`, deliberate validation mode, and accessible error markup.
4. For long-form/EdTech-critical forms: add autosave, and for timed assessments, server-enforced expiry.
5. Before sign-off: run through `references/definition-of-done.md`.

## Notes
- This skill governs form-specific state (validation, dirty/touched, submission). For where broader app state lives, see `state-management`. For how form submissions reach the backend (retries, idempotency), see `api-integration`. For structured rich text/WYSIWYG fields, see `rich-text-editing`. For the actual i18n mechanism behind validation-message translation, see `i18n-l10n`.
- Grounded in official React Hook Form, Zod, `@hookform/resolvers`, W3C ARIA, and Testing Library docs, plus OWASP XSS guidance — see `references/sources.md`.
