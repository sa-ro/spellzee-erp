# References & Sources

## Official Documentation
- **React Hook Form official docs** — `register`, `Controller`, validation modes, `watch`/`useWatch`, form state management: https://react-hook-form.com/docs/useform
- **@hookform/resolvers (official React Hook Form resolvers package)** — `zodResolver` integration pattern connecting Zod schemas to React Hook Form, automatic output-type inference via `z.infer`: https://github.com/react-hook-form/resolvers
- **Zod official docs** — schema definition, `.refine()`/`.superRefine()` for conditional/cross-field validation, `z.infer<>` type derivation: https://zod.dev
- **W3C WAI-ARIA Authoring Practices — Forms** — `aria-invalid`, `aria-describedby`, and focus management for accessible error handling: https://www.w3.org/WAI/ARIA/apg/patterns/
- **Testing Library — Guiding Principles** (Kent C. Dodds) — testing forms via user-facing queries rather than internal implementation state: https://testing-library.com/docs/guiding-principles

## Widely-Recognized Community Standards
- **shadcn/ui — React Hook Form integration guide** — reference implementation of the React Hook Form + Zod + accessible `<Field>` pattern: https://ui.shadcn.com/docs/forms/react-hook-form
- **OWASP — Cross-Site Scripting (XSS) Prevention Cheat Sheet** — sanitization guidance for user-generated content rendered as HTML, informing the sanitization rule: https://owasp.org/www-community/xss-filter-evasion-cheatsheet
- **WHATWG HTML Living Standard — Autofill** — the specification defining valid `autocomplete` attribute values (`email`, `new-password`, `current-password`, etc.), the basis for the autofill-compatibility rule: https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill

## Note on usage
Cite the relevant source above if the user asks "why" behind a rule. Paraphrase principles — don't reproduce documentation text verbatim in generated code or docs.
