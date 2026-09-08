# Definition of Done — Design Tokens & Theming

## 1. Source of Truth
- [ ] Token changes made in the token source, not hand-edited separately in CSS/Tailwind config/elsewhere
- [ ] New values added as tokens (primitive + semantic where appropriate), not hardcoded in component code

## 2. Semantic Layering
- [ ] Components reference semantic tokens, not raw primitives or hex values directly
- [ ] Token naming follows the project's documented naming convention

## 3. Theming Mechanism
- [ ] Theme switching implemented as a token-value swap via root-level CSS custom properties, not per-component conditionals
- [ ] No theme-flash on load — initial theme resolved before first paint (SSR cookie/header or inline script)

## 4. Dark Mode Specifics (if applicable)
- [ ] Dark-mode contrast ratios independently verified against WCAG, not assumed from light-mode values
- [ ] Elevation/shadow and images/icons have deliberate dark-mode treatment, not auto-inversion

## 5. Impact Review
- [ ] Primitive token changes reviewed for downstream visual impact on dependent semantic tokens/components

## 6. Multi-Brand (if applicable)
- [ ] Brand variation implemented as a scoped token override set, not accumulating conditionals — and only built because there's a real current requirement

## 7. Documentation
- [ ] Token documentation reflects the current token set, generated or kept in sync with the source

## Sign-off
Only mark "design-tokens: done" once all sections are checked.
