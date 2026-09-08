# Form Handling & Validation Rules

## Rule 1: React Hook Form + Zod, Chosen as the Standard (Project Detection Still Applies)
- **Existing project**: check `package.json` for `react-hook-form`, `formik`, `zod`, `yup` and follow whatever is already established — don't introduce a second form library into a project that already has one.
- **New project / no precedent**: default to **React Hook Form + Zod** via `zodResolver` (`@hookform/resolvers/zod`) — uncontrolled-by-default for performance, schema-first for type safety. This is the standard unless the project already uses something else.
- TypeScript is non-negotiable: form types are inferred from the Zod schema via `z.infer<typeof schema>` — never a hand-written, separately-maintained `FormInputs` interface that can drift from the actual validation rules.

## Rule 2: Schema Is the Single Source of Truth for Validation
- One Zod schema per form defines both the validation rules and the TypeScript type. Business rules (min length, required fields, format) live in the schema, not scattered as ad hoc checks inside `onSubmit` handlers or JSX conditionals.
- The same schema (or a derived subset) should validate on the client for UX, but the backend must independently re-validate — never trust client-side validation as the actual security/data-integrity boundary (see Rule 15).

## Rule 3: Client Validation Is UX, Server Validation Is the Source of Truth
- Client-side Zod validation exists to give immediate feedback — it is never the only validation layer, especially for anything gradeable or submitted for assessment (EdTech-critical).
- A quiz/assignment answer must be re-validated and scored server-side; a client bypass (disabled JS, direct API call) must not be able to submit invalid or unvalidated data.

## Rule 4: Explicit Validation Timing, Not Left at Defaults
- Choose validation `mode` deliberately: typically `onBlur` or `onTouched` for initial feedback (don't show errors while the user is still typing their first attempt), then `onChange` after the first submit attempt so corrections are reflected immediately.
- Never validate `onChange` from the very first keystroke on a fresh form — this creates an unpleasant "red before I've finished typing" experience.

## Rule 5: Errors Are Accessible, Not Just Visually Present
- Every invalid input has `aria-invalid="true"` and `aria-describedby` pointing to its error message element — a colored border alone is not sufficient for screen reader users.
- On failed submit, focus moves to the first invalid field (or an error summary region for forms with many errors) — don't leave focus wherever it was and let the error go unnoticed.

## Rule 6: Controlled vs Uncontrolled — Follow the Project's Component-Architecture Policy
- React Hook Form's `register` gives uncontrolled inputs by default (preferred for performance); use `Controller` only for controlled third-party components (date pickers, rich selects) that require it.
- This must stay consistent with whatever controlled/uncontrolled policy was already set in the `component-architecture` skill for the project — don't make a separate, conflicting decision at the form layer.

## Rule 7: Async Validation Is Debounced and Cancellable
- Any validation requiring a server round-trip (username/email uniqueness, coupon code check) is debounced (300-500ms) and cancels the previous in-flight check when a new value is typed — same discipline as the `api-integration` skill's debounce/cancellation rules, applied at the field level.
- Show a distinct "checking..." state during async validation, separate from the error and valid states.

## Rule 8: Prevent Double-Submit
- The submit button is disabled (or shows a loading state) immediately on submit and re-enabled only after the request resolves (success or failure) — never allow a second submit to fire while the first is in flight.
- For critical EdTech submissions (quiz/assignment), this pairs with the `api-integration` skill's idempotency-key rule as defense in depth, not a replacement for it.

## Rule 9: Multi-Step/Wizard Forms Preserve State Across Steps
- Wizard-style forms (course creation, multi-page enrollment) keep all steps' data in one form state (single `useForm` instance spanning steps, or a parent-level store) — never let navigating back to a previous step silently discard what was entered on other steps.
- Validation for a step gates moving to the next step, but the overall submission validates the complete schema again before the final submit.

## Rule 10: Autosave/Draft Persistence for Long-Form Content (EdTech-Specific)
- Long-form inputs where losing data is costly (essay/assignment answers, course content authoring, long quiz responses) autosave to local storage or the backend periodically — a network blip or accidental tab close must not lose a student's or teacher's work.
- This is the form-layer application of the `api-integration` skill's offline-resilience rule — draft persistence happens client-side even before a successful API round-trip confirms the save.

## Rule 11: Conditional/Dynamic Fields Are Modeled in the Schema
- When a field's requirement depends on another field's value (e.g. "if quiz type is 'timed', duration is required"), this is expressed via Zod's `.refine()`/`.superRefine()` on the schema — not as an untyped side-effect check bolted onto the submit handler.
- The UI's conditional rendering and the schema's conditional validation must be kept in sync — a field hidden in the UI must also not be required by the schema at that time.

## Rule 12: No Hardcoded Validation Error Strings (i18n-Ready)
- Validation messages are not hardcoded English strings directly in the Zod schema — route them through the same i18n mechanism established in the `component-architecture` skill's no-hardcoded-strings rule and owned in full by the `i18n-l10n` skill, even if the project isn't multi-language yet.

## Rule 13: Form Testing at the Behavior Level
- Tests interact with forms via Testing Library (`getByRole`, `getByLabelText`, `userEvent.type`) simulating real user behavior — not by reaching into React Hook Form's internal state or calling `setValue` directly to bypass the actual input interaction.
- Test the validation behavior a user would experience (error appears after blur/submit, error clears on correction) rather than testing that a specific internal Zod error object was produced.

## Rule 14: Numeric, Date, and Locale-Aware Input Handling
- Numeric fields use `valueAsNumber` (React Hook Form) rather than manually parsing strings; date fields transmit in ISO 8601/UTC per the `api-integration` skill's date rule, while displaying in the user's locale format.
- Never assume a single decimal separator or date format is universal — this matters even within India for the numeric grouping conventions some regional users expect, though the stored/transmitted format stays standardized regardless of display locale.

## Rule 15: Never Trust Client Input — Sanitize Before Use and Before Submission
- Any form input that will later be rendered as HTML (rich text course content, forum-style comments) is sanitized before rendering (to prevent stored XSS) — never inserted via `dangerouslySetInnerHTML` without sanitization.
- This is independent of Zod validation (which checks shape/format) — sanitization addresses a different concern (injection), and both are required together for any free-text field destined for HTML rendering.
- For structured rich text/WYSIWYG editor content specifically (not a plain textarea), see the `rich-text-editing` skill, which owns the storage format and the write-time/read-time sanitization implementation in full.

## Rule 16: Large Forms Avoid Unnecessary Re-Renders
- For forms with many fields (course creation with dozens of settings, detailed profile forms), use React Hook Form's `watch()` and `useWatch()` scoped to only the specific fields that need reactive access — don't `watch()` the entire form and re-render every field's component on every keystroke elsewhere in the form.

## Rule 17: Form Reset Behavior Is Explicit
- After a successful submit, explicitly decide and implement whether the form resets to empty/default values or retains the submitted values (e.g. an "edit" form usually retains values; a "create another" flow usually resets) — don't leave this as accidental default behavior.

## Rule 18: Timed/Assessment Forms Handle Expiry Explicitly (EdTech-Specific)
- Timed quiz/assessment forms auto-submit whatever has been answered when the timer expires — a client-side timer alone is not authoritative; the server must independently enforce the time limit (reject or flag submissions arriving after the deadline) since a client clock/JS execution can be manipulated or delayed.
- The UI gives clear, escalating warning before auto-submit (not just a silent cutoff) so a student isn't confused by a form that submitted itself.

## Rule 19: Preventing Data Loss on Navigation Away
- Forms with unsaved changes warn the user before navigating away (browser `beforeunload` prompt or an in-app route-change guard) — except during a timed assessment, where navigating away should NOT be blocked by a confirmation dialog that could be used to pause/cheat a timer; instead handle it via Rule 18's auto-submit-on-expiry and any product-level rules about leaving an active assessment.

## Rule 20: File Upload Field Validation at the Form Layer
- File input fields validate type and size in the Zod schema (or an immediate client-side check on file selection) before the user hits submit — not deferred to a failed upload after the fact.
- The user sees the rejection reason (wrong file type, too large) immediately on selecting the file, not only after attempting to submit.
- This is the form-layer complement to the `api-integration` skill's chunked-upload rule — validation happens here, transport/progress happens there.

## Rule 21: Password Field Conventions
- Confirm-password fields validate equality via Zod's `.refine()` on the whole schema (cross-field), not a separate manual check.
- A show/hide password toggle button has `aria-pressed` reflecting its state and an accessible label (e.g. "Show password" / "Hide password"), not just a bare icon.
- Password strength feedback (if shown) is a live, non-blocking indicator — it informs, it doesn't itself gate submission beyond the schema's actual minimum requirements.

## Rule 22: Live Character/Word Count for Long-Text Fields
- Textarea/rich-text fields with a length limit (essay answers, assignment responses, bios) show a live character/word counter, with a clear visual warning as the limit approaches — not just a hard cutoff or a validation error only discovered at submit.

## Rule 23: Explicit Field-Level vs Error-Summary Strategy
- Small forms (a handful of fields) rely on field-level errors alone.
- Large forms (many fields, e.g. detailed course/settings forms) additionally show an error summary at the top on failed submit, listing each error with a link/focus-jump to its field — decide which tier a form falls into deliberately, don't leave large forms with only field-level errors that are easy to miss when scrolled out of view.

## Rule 24: Shared Schema Between Create and Edit via `.partial()`/`.extend()`
- Create and edit forms for the same resource (course, assignment) derive from one base Zod schema, using `.partial()` for fields optional in one mode (e.g. `id` absent on create) or `.extend()` for mode-specific additions — never maintain two independently-written schemas for the same resource that can silently drift apart.

## Rule 25: Correct `autoComplete` Attributes
- Every relevant field sets the correct `autoComplete` value (`email`, `new-password`, `current-password`, `name`, `tel`, etc.) per the HTML autofill spec — missing or wrong values break password-manager and browser-autofill behavior, which is a real usability cost on login/signup forms.
