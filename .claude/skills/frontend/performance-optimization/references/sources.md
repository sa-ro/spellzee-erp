# References & Sources

## Official Documentation
- **web.dev (Google) — Core Web Vitals** — official thresholds: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1, measured at the 75th percentile of real-user field data (Chrome UX Report); INP officially replaced FID as of March 12, 2024: https://web.dev/articles/vitals
- **web.dev — INP (Interaction to Next Paint)**: https://web.dev/articles/inp
- **Next.js official docs — Image Optimization (`next/image`)**: https://nextjs.org/docs/app/building-your-application/optimizing/images
- **Next.js official docs — Font Optimization (`next/font`)**: https://nextjs.org/docs/app/building-your-application/optimizing/fonts
- **Next.js official docs — Script Optimization (`next/script`)**: https://nextjs.org/docs/app/building-your-application/optimizing/scripts
- **Next.js official docs — Rendering: Server Components, Streaming, Suspense**: https://nextjs.org/docs/app/building-your-application/rendering
- **web-vitals (Google's official library)** — for measuring and reporting Core Web Vitals from real production traffic: https://github.com/GoogleChrome/web-vitals
- **MDN — `requestIdleCallback`** — deferring non-urgent work off the critical interaction path: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback

## Widely-Recognized Community Standards
- **HTTP Archive — Web Almanac (Performance chapter)** — industry-wide Core Web Vitals pass-rate data, used to calibrate realistic expectations (roughly 43% of mobile origins and 54% of desktop origins pass all three vitals as of the 2024 Almanac)
- **Addy Osmani / web.dev performance guidance** — bundle budgeting, code-splitting, and tree-shaking practices widely referenced across the React/Next.js ecosystem

## Note on usage
Cite the relevant source above if the user asks "why" behind a rule. Paraphrase principles — don't reproduce documentation text verbatim in generated code or docs.
