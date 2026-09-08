# References & Sources

The rules in this skill are grounded in established, widely-recognized frontend architecture guidance — not personal opinion. Use these as the authoritative backing when a rule is questioned or needs deeper reading.

## Official Documentation
- **React docs (react.dev)** — Thinking in React, composition vs inheritance, `forwardRef`, `memo`, Server Components: https://react.dev/learn/thinking-in-react
- **Next.js docs (App Router)** — Server vs Client Components, project structure conventions: https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns
- **TypeScript Handbook** — discriminated unions, strict typing patterns: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions

## Widely-Adopted Community Standards
- **Bulletproof React** (Aleksey Kulikov et al.) — feature-based folder structure, project architecture patterns for scalable React apps: https://github.com/alan2207/bulletproof-react
- **Patterns.dev** (created by Lydia Hallie, independent software engineering consultant/educator, and Addy Osmani, engineering manager on Google Chrome's developer tooling team) — compound components, HOC vs hooks, rendering patterns: https://www.patterns.dev
- **Kent C. Dodds — Epic React / blog** — composition over configuration, controlled vs uncontrolled components, custom hooks extraction: https://kentcdodds.com/blog/application-state-management-with-react
- **Josh W. Comeau — CSS/React architecture writing** — component API design, styling approach consistency: https://www.joshwcomeau.com

## Design Systems & Component API Design
- **Radix UI / shadcn-ui documentation** — reference implementation of accessible-by-default, ref-forwarding, composable component APIs: https://www.radix-ui.com/primitives/docs/introduction
- **Shopify Polaris** — public prop contracts and component API design for a large-scale design system: https://polaris.shopify.com/components
- **Atlassian Design System** — deprecation strategy and component API guidelines for shared component libraries: https://atlassian.design/components

## Testing & Accessibility
- **Testing Library guiding principles** (Kent C. Dodds) — "the more your tests resemble the way your software is used, the more confidence they give you" — informs the testability-by-design rule: https://testing-library.com/docs/guiding-principles
- **W3C WAI-ARIA Authoring Practices** — informs accessible-by-default component API design: https://www.w3.org/WAI/ARIA/apg/

## Note on usage
When applying a rule from this skill, you can cite the relevant source above if the user asks "why" or wants to verify a rule isn't arbitrary. Don't quote these sources verbatim in generated code or docs — paraphrase the principle.
