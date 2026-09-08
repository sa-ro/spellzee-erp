# Definition of Done — Performance Optimization

A feature/release cannot be marked "done" until every item below is checked.

## 1. Core Web Vitals
- [ ] LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 at p75 of real-user (field) data — not just lab/local
- [ ] LCP element identified and not lazy-loaded/deprioritized
- [ ] Async-loading elements have reserved layout space (no visible content jump)

## 2. Bundle & Build
- [ ] New dependencies checked for bundle-size cost before adding
- [ ] Bundle size budget enforced in CI
- [ ] Imports are tree-shakeable (named imports from large libraries, no unnecessary barrel files)
- [ ] Route-based and heavy-component code splitting applied (`next/dynamic` for conditional heavy components)

## 3. Assets
- [ ] Images use `next/image` with correct sizing/format/lazy-loading (except the LCP image)
- [ ] Fonts use `next/font` with `font-display` set and metric overrides to prevent CLS
- [ ] Fonts subsetted for the scripts actually used (India multi-script content)
- [ ] Static assets served with immutable caching + content-hash cache-busting

## 4. Third-Party & Scripts
- [ ] Third-party scripts loaded via `next/script` with an explicit, justified strategy
- [ ] Each third-party script's necessity and cost was actually questioned, not just added

## 5. Rendering & Runtime
- [ ] Server Components used by default; hydration cost minimized
- [ ] Streaming/Suspense boundaries used for slow data-dependent sections
- [ ] Long JS tasks broken up or moved to a Web Worker; long lists virtualized
- [ ] Memoization applied deliberately (measured problem), not blanket
- [ ] Scroll/resize/frequent-event handlers debounced or throttled
- [ ] Render-blocking CSS avoided; critical CSS prioritized

## 6. Data & Caching
- [ ] RTK Query cache freshness configured to avoid redundant fetches
- [ ] Static/rarely-changing content uses SSG/ISR, not always-fresh fetching
- [ ] Predictable next-screen data prefetched where applicable

## 7. EdTech-Specific
- [ ] Video/media delivered via adaptive bitrate streaming, not one fixed-quality file
- [ ] Long-running sessions (live class, timed quiz) verified free of listener/interval/subscription leaks
- [ ] Tested under throttled network (Slow 4G/Fast 3G) and mid/low-tier CPU throttling, not just a high-end dev machine

## 8. Measurement & Process
- [ ] Change was driven by actual profiling/RUM data, not intuition
- [ ] Metric re-measured after the fix to confirm improvement
- [ ] Real User Monitoring (web-vitals reporting) in place for production tracking
- [ ] When multiple vitals fail, worst-band metric addressed first, then INP, then LCP, then CLS

## 9. Cross-Cutting
- [ ] Performance changes verified not to have broken accessibility (ARIA on virtualized/lazy content, announcements still fire)

## Sign-off
Only mark "performance-optimization: done" once all sections are checked.
