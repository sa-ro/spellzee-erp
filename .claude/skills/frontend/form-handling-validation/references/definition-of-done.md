# Definition of Done — Form Handling & Validation

A form cannot be marked "done" until every item below is checked.

## 1. Setup & Types
- [ ] Existing project's form library convention detected and followed (or React Hook Form + Zod used for a new precedent)
- [ ] Form types derived via `z.infer<typeof schema>` — no hand-written, separately-maintained type
- [ ] One Zod schema is the single source of truth for validation rules

## 2. Validation Behavior
- [ ] Client validation exists for UX; server independently re-validates (never trust client-only, especially for gradeable content)
- [ ] Validation `mode` chosen deliberately (e.g. `onTouched` initially, `onChange` after first submit) — not left at an unconsidered default
- [ ] Conditional field requirements modeled via `.refine()`/`.superRefine()`, kept in sync with conditional UI rendering
- [ ] Async validation (uniqueness checks) debounced and cancels stale in-flight checks

## 3. Accessibility
- [ ] Invalid fields have `aria-invalid` and `aria-describedby` linked to the error message
- [ ] Focus moves to the first invalid field or an error summary on failed submit

## 4. Submission Safety
- [ ] Submit button disabled/loading during in-flight submission — no double-submit possible
- [ ] Critical EdTech submissions (quiz/assignment) paired with an idempotency key at the API layer
- [ ] Form reset-after-submit behavior explicitly decided (reset vs retain values)

## 5. Multi-Step & Long-Form Content
- [ ] Wizard/multi-step forms preserve all steps' data in one state; back-navigation doesn't discard entered data
- [ ] Long-form content (essays, course authoring) autosaves periodically to prevent data loss

## 6. Security & Sanitization
- [ ] Free-text fields destined for HTML rendering are sanitized before render (XSS prevention), independent of schema validation
- [ ] No sensitive/unvalidated data reaches the backend without server-side re-validation

## 7. Internationalization & Locale
- [ ] Validation error messages routed through the i18n mechanism, not hardcoded strings
- [ ] Dates transmitted as UTC/ISO 8601; numeric inputs use `valueAsNumber`, not manual string parsing

## 8. Performance
- [ ] `watch()`/`useWatch()` scoped to specific fields on large forms, not the entire form object

## 9. EdTech-Specific: Timed Assessments
- [ ] Timer expiry auto-submits current answers; server independently enforces the time limit
- [ ] Escalating warning shown before auto-submit, not a silent cutoff
- [ ] Navigation-away confirmation is NOT used as a way to pause/cheat an active timed assessment

## 10. Testing
- [ ] Tests interact via Testing Library user-behavior queries, not internal form state manipulation
- [ ] Validation UX (error appears/clears at the right time) is tested, not just the schema logic in isolation

## 11. File Uploads & Password Fields
- [ ] File type/size validated on selection, with immediate feedback — not only after a failed upload
- [ ] Confirm-password validated via schema-level `.refine()`; show/hide toggle has `aria-pressed` and an accessible label

## 12. Long-Text & Large-Form UX
- [ ] Length-limited textareas show a live character/word counter with an approaching-limit warning
- [ ] Large forms (many fields) show an error summary at top in addition to field-level errors; small forms use field-level only — decided deliberately

## 13. Schema Reuse & Autofill
- [ ] Create/edit forms for the same resource derive from one base schema via `.partial()`/`.extend()`, not two independently maintained schemas
- [ ] Relevant fields have correct `autoComplete` attributes for password-manager/browser-autofill compatibility

## Sign-off
Only mark "form-handling-validation: done" once all sections are checked.
