# References & Sources

## Official Documentation
- **TypeScript Handbook** — generics, discriminated unions, utility types, `strict` mode flags: https://www.typescriptlang.org/docs/handbook/
- **React TypeScript Cheatsheet** — the community-maintained reference for polymorphic (`as` prop) component typing, generic component patterns, and hook typing conventions: https://react-typescript-cheatsheet.netlify.app
- **Zod official docs** — `z.infer<>` as the source of derived API/response types, shared with `api-integration` and `form-handling-validation`: https://zod.dev
- **TypeScript Handbook — Narrowing** — `unknown` + type guard patterns as the replacement for `any`: https://www.typescriptlang.org/docs/handbook/2/narrowing.html

## Widely-Recognized Community Standards
- **Total TypeScript (Matt Pocock) — branded types / nominal typing guides** — the branded-type pattern referenced by Rule 10: https://www.totaltypescript.com
- **TypeScript Deep Dive (community book) — exhaustiveness checking** — the `never`-check pattern referenced by Rule 11: https://basarat.gitbook.io/typescript

## Note on usage
Cite the relevant source above if the user asks "why" behind a rule. Paraphrase principles — don't reproduce documentation text verbatim in generated code or docs.
