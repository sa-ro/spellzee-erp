---
name: performance-optimization
description: Use this skill whenever the user is optimizing load time, responsiveness, or visual stability — Core Web Vitals (LCP/INP/CLS), bundle size, code splitting, image/font optimization, rendering strategy (Server Components/streaming), long-list virtualization, or low-bandwidth/low-end-device performance for an EdTech product. Trigger for phrases like "this page is slow", "improve Core Web Vitals", "reduce bundle size", "the app lags on low-end phones", "images are slow to load", "optimize this list", or any request involving performance profiling or optimization. Also trigger for Definition of Done review before a release.
---

# Performance Optimization Skill

Defines how the frontend is measured and optimized against Core Web Vitals (LCP, INP, CLS), with EdTech-specific attention to low-bandwidth delivery, multi-script fonts, and long-running session stability.

## When to use this
- Diagnosing or fixing a slow page/interaction
- Reducing bundle size or setting up code splitting
- Optimizing images, fonts, or third-party script loading
- Choosing a rendering strategy (Server Components, streaming, SSG/ISR)
- Virtualizing long lists or fixing janky scrolling/interactions
- Setting up Real User Monitoring or performance budgets in CI
- Reviewing a PR or running Definition of Done before a release

## Core principles (see `references/rules.md` for full detail with rationale)

1. **Core Web Vitals are the measured target** — LCP ≤2.5s, INP ≤200ms, CLS ≤0.1, at p75 of real-user field data
2. **Bundle size is budgeted in CI**, not discovered later
3. **Code splitting by route and heavy component** — applied deliberately, not reflexively
4. **Images are a first-class LCP concern** — `next/image`, LCP element never lazy-loaded
5. **Fonts don't block render or shift layout** — `next/font`, metric overrides
6. **Third-party scripts loaded deliberately** — `next/script` with justified strategy
7. **Reserve layout space** to prevent CLS
8. **Server Components + streaming** reduce client JS and unblock initial paint
9. **Long tasks broken up** to protect INP
10. **Virtualize long lists**
11. **Deliberate memoization only** — cross-references `component-architecture`/`state-management`
12. **API/cache layer feeds performance** — cross-references `api-integration` cache-freshness
13. **Adaptive video delivery (EdTech)** — bitrate streaming, lazy-loaded players
14. **Measure before optimizing** — profiling data drives changes, re-measured after
15. **Real User Monitoring in production**
16. **Performance budgets enforced in CI**
17. **Debounce/throttle expensive UI reactions**
18. **SSG/ISR for static/rarely-changing content**
19. **Fix worst-band metric first**, then INP, then LCP, then CLS
20. **Low-end device and throttled-network testing (EdTech)**
21. **Minimize hydration cost**
22. **Preconnect/preload critical resources**
23. **Service worker caching for repeat visits** — cross-references `api-integration` offline rule
24. **Never trade accessibility for performance** — cross-references `accessibility` skill
25. **Tree-shakeable imports** — no whole-library imports, sparse barrels
26. **Avoid render-blocking CSS**
27. **Font subsetting for multi-script content (India EdTech)** — Tamil/Indic + English
28. **Prevent memory leaks in long-running sessions (EdTech)** — live classes, timed quizzes
29. **Immutable asset caching with cache-busting**

## Workflow

1. Measure first (Rule 14) — identify which Core Web Vital is failing and why, using field data plus lab tools to debug.
2. Fix in priority order (Rule 19): worst-band metric, then INP, then LCP, then CLS.
3. Apply the relevant structural fix (code splitting, image/font optimization, Server Components, virtualization) rather than a superficial tweak.
4. Re-measure to confirm the fix worked.
5. For EdTech-specific paths: verify under throttled network/low-end device conditions, not just a dev machine.
6. Before sign-off: run through `references/definition-of-done.md`.

## Notes
- This skill governs frontend performance. For component-level memoization/re-render discipline, see `component-architecture` and `state-management`. For network-layer caching/prefetching, see `api-integration`. For ensuring optimizations don't break screen-reader/keyboard experience, see `accessibility`.
- Grounded in official web.dev Core Web Vitals documentation, Next.js official optimization docs, the `web-vitals` library, and HTTP Archive Web Almanac data — see `references/sources.md`.
