# Performance Optimization Rules

## Rule 1: Core Web Vitals Are the Measured Target, Not a Vague "Make It Fast"
- Three specific field metrics, measured at the 75th percentile of real users (not lab data, not your dev machine): **LCP ≤ 2.5s** (loading), **INP ≤ 200ms** (responsiveness — replaced FID as the official metric in March 2024), **CLS ≤ 0.1** (visual stability).
- Lab tools (Lighthouse, local DevTools) are for debugging *why* a metric fails — the actual pass/fail judgment uses field data (Chrome UX Report / real-user monitoring), because a fast dev laptop on fiber says nothing about a student on a mid-range Android phone on mobile data.

## Rule 2: Bundle Size Is Budgeted, Not Discovered After the Fact
- Set an explicit JS bundle size budget per route/page at project setup, enforced in CI (bundle analyzer + a size-limit check that fails the build) — don't let bundle size grow silently until a Lighthouse audit surprises the team months later.
- New dependencies are checked against bundle-size cost (bundlephobia-style check) before adding, not after.

## Rule 3: Code Splitting by Route and by Heavy Component
- Next.js route-based code splitting is the default (automatic per-page) — additionally, `next/dynamic` (React `lazy`/`Suspense` under the hood) splits out heavy, conditionally-rendered components (rich text editors, chart libraries, video players) so their code doesn't load until actually needed.
- Don't dynamically import everything reflexively — code-splitting has its own overhead (extra network round trip); apply it to genuinely heavy or conditional pieces, not trivial components.

## Rule 4: Images Are the Most Common LCP Culprit — Treat Them as a First-Class Concern
- Use `next/image` for automatic responsive sizing, modern format serving (WebP/AVIF), and lazy-loading below the fold — never a raw `<img>` with a full-resolution source for responsive layouts.
- The LCP element (usually a hero image or heading) is NOT lazy-loaded and is prioritized (`priority` prop in `next/image`) — lazy-loading the very element LCP measures directly hurts the LCP score.

## Rule 5: Fonts Don't Block Rendering or Cause Layout Shift
- Use `next/font` (or equivalent self-hosted font loading) with `font-display: swap` or `optional` — never a render-blocking synchronous font load from a third-party CDN with no fallback strategy.
- Reserve layout space for web fonts matching the fallback font's metrics (font metric overrides) so text doesn't visibly reflow when the custom font loads — a direct CLS cause.

## Rule 6: Third-Party Scripts Are Loaded Deliberately, Never by Default-Synchronous
- Analytics, chat widgets, and other third-party scripts load via `next/script` with an explicit strategy (`afterInteractive`, `lazyOnload`) chosen per script's actual urgency — never a blocking synchronous `<script>` tag in `<head>`.
- Each third-party script is questioned for necessity and bundle/execution cost before adding — third-party scripts are a leading real-world cause of poor INP because they consume main-thread time during user interactions.

## Rule 7: Reserve Layout Space to Prevent CLS
- Any element that loads asynchronously and changes size (images without dimensions, ads, embeds, dynamically-inserted banners) has its space reserved up front (explicit `width`/`height`, `aspect-ratio`, or a skeleton matching the final size) — content must never visibly jump when it finishes loading.

## Rule 8: Server Components and Streaming Reduce Client JS (Next.js App Router)
- Default to Server Components (this echoes `component-architecture` Rule 9, applied here for its performance payoff) — every component that doesn't need client interactivity ships zero JS to the browser for that component.
- Use streaming SSR (`loading.tsx`, `<Suspense>` boundaries) so slow data-dependent sections don't block the whole page's initial paint — the fast parts of the page render immediately while slower parts stream in.

## Rule 9: Long Tasks Are Broken Up to Protect INP
- JavaScript work longer than ~50ms on the main thread blocks input responsiveness — heavy synchronous computation (large list processing, complex client-side filtering/sorting) is broken into smaller chunks (`requestIdleCallback`/`scheduler.yield`/deferred execution) or moved off the main thread (Web Worker) rather than run as one long blocking task.

## Rule 10: Virtualize Long Lists
- Lists rendering many items (course catalogs, student rosters, long assignment/submission lists) use virtualization (render only visible rows) rather than mounting every item's DOM node at once — this protects both initial render time and scroll responsiveness (INP) as data grows.

## Rule 11: Memoization Is Deliberate, Not Blanket (Cross-References `component-architecture` Rule 15)
- Same discipline as the state-management/component-architecture skills: `React.memo`/`useMemo`/`useCallback` applied where a measured re-render cost exists, not wrapped around everything reflexively — over-memoization adds its own overhead and complexity without guaranteed benefit.

## Rule 12: RTK Query / API Layer Feeds Performance, Not Fights It
- Cross-references the `api-integration` skill's cache-freshness rule (`keepUnusedDataFor`, `refetchOnFocus`) — correct cache configuration avoids redundant network requests that would otherwise slow perceived performance, especially on the mobile/low-bandwidth connections common in the EdTech audience.
- Prefetch data for the likely next screen (e.g. prefetch the next lesson while the student is on the current one) where the access pattern is predictable, using RTK Query's `prefetch` or Next.js route prefetching.

## Rule 13: Video and Media Are Optimized for Low-Bandwidth Delivery (EdTech-Critical)
- Course videos are served via adaptive bitrate streaming (HLS/DASH) where possible, not a single large fixed-quality file — a student on a slow connection gets a lower bitrate automatically rather than buffering or failing to load. The full ABR/DRM/resume-sync playback architecture is owned by the `video-player-architecture` skill; this rule states only the load-performance angle.
- Video players lazy-load (don't initialize/preload player bundles/instances for content not yet visible/selected) — cross-references `video-player-architecture`'s Rule 9 (player is lazy-loaded and code-split).

## Rule 14: Measure Before Optimizing — No Speculative Performance Work
- Performance changes are driven by actual profiling data (React DevTools Profiler, Chrome Performance panel, field RUM data) identifying a real bottleneck — not intuition about what "seems slow."
- A performance fix is validated by re-measuring the same metric afterward, confirming the change actually helped, not assumed to have helped because the code "looks more efficient."

## Rule 15: Real User Monitoring (RUM) in Production
- Core Web Vitals are tracked from real production traffic (web-vitals library reporting to an analytics/RUM endpoint), not only checked occasionally via manual Lighthouse runs — regressions need to be caught continuously, especially after each deploy, not discovered weeks later.

## Rule 16: Performance Budgets Enforced in CI, Not Just Reviewed in Retrospect
- Bundle size (Rule 2) and, where feasible, Lighthouse CI score thresholds are enforced as CI checks that can fail a build/PR — performance regressions are caught before merge, not after users report a slow app.

## Rule 17: Debounce/Throttle Expensive UI Reactions (Cross-References `api-integration` Rule 20)
- Beyond API calls, expensive client-side reactions to frequent events (scroll handlers, resize handlers, real-time search-as-you-type filtering of already-loaded data) are debounced or throttled — an unthrottled scroll/resize handler is a common, easily-avoided INP/jank source.

## Rule 18: Avoid Unnecessary Client-Side Re-Fetching of Static/Rarely-Changing Content
- Content that rarely changes (course catalog structure, static marketing pages, published course metadata) uses Next.js static generation (SSG) or Incremental Static Regeneration (ISR) rather than fetching fresh on every request — this both improves performance and reduces unnecessary backend load.

## Rule 19: Prioritize Fixing the Worst Metric First, Then by Business Impact
- When multiple Core Web Vitals fail, prioritize order: fix whichever is in the "poor" band first (largest user-experience harm), then INP (hardest to fix but high impact), then LCP (highest commercial/perceived-speed impact), then CLS (usually the most mechanically straightforward to fix) — don't spend effort polishing an already-green metric while a poor one goes unaddressed.

## Rule 20: Low-End Device and Network Testing (EdTech-Specific)
- Performance testing explicitly includes throttled network conditions (Chrome DevTools "Slow 4G"/"Fast 3G" simulation) and mid/low-tier device CPU throttling — the EdTech user base skews toward budget Android devices and inconsistent mobile connections in a way a typical developer's high-end laptop and office wifi won't surface.

## Rule 21: Hydration Cost Is Minimized (Next.js/React)
- Client-side hydration cost is kept low by maximizing Server Component usage (Rule 8) and avoiding hydrating large, mostly-static sections of a page that don't need interactivity — hydration is a real, measurable INP/TTI cost on mid-tier mobile devices even after content has visually painted.

## Rule 22: Preconnect and Preload Critical Resources
- Critical third-origin resources (font CDN, API base URL, image CDN) use `<link rel="preconnect">`/`dns-prefetch` where a connection will definitely be needed early; the LCP image/font itself uses `<link rel="preload">` where framework defaults don't already handle it — this shaves connection-setup time off the critical rendering path.

## Rule 23: Service Worker / Caching Strategy for Repeat Visits (Cross-References `api-integration` Offline Rule)
- Where the product supports offline/low-bandwidth resilience (per the `api-integration` skill), the same service worker/caching layer serves a performance purpose too: cached static assets and previously-viewed course content load instantly on repeat visits rather than re-fetching over the network every time.

## Rule 24: Don't Trade Accessibility for Performance
- Performance optimizations (removing "unused" DOM, aggressive code-splitting, virtualization) must not break accessibility — a virtualized list still needs correct ARIA roles for screen readers, and lazy-loaded content must still announce its arrival (cross-references the `accessibility` skill's live-region rule) — the two skills' rules apply together, not as a tradeoff where one wins.

## Rule 25: Tree-Shakeable Imports, Not Whole-Library Imports
- Import specific functions from large libraries (`import debounce from 'lodash/debounce'`, not `import _ from 'lodash'`) so bundlers can eliminate unused code.
- Avoid barrel files (`index.ts` re-exporting everything) for large shared modules where they'd prevent effective tree-shaking — this connects to the `component-architecture` skill's sparse-barrel-exports rule, viewed here through its bundle-size consequence specifically.

## Rule 26: Avoid Render-Blocking CSS
- Critical above-the-fold CSS is inlined or prioritized so the browser can paint initial content without waiting for a full stylesheet round-trip; non-critical CSS (below-the-fold sections, rarely-used component styles) loads without blocking first paint.
- With Tailwind/CSS Modules (per the `component-architecture` skill's styling-approach rule), verify the build's CSS extraction doesn't produce one enormous blocking stylesheet for a large app — split per-route where the framework supports it.

## Rule 27: Font Subsetting for Multi-Script Content (India EdTech-Specific)
- Where the product supports regional-language content (Tamil or other Indic scripts alongside English), fonts are subset to only the character sets/weights actually used rather than loading a full multi-script font family unconditionally — an unsubset font covering many scripts can be significantly larger than needed for a page that only renders one or two scripts.
- Load the appropriate script's font only when that content is actually rendered, not both scripts' full weights on every page load.

## Rule 28: Prevent Memory Leaks in Long-Running Sessions (EdTech-Specific)
- Live class sessions, timed quizzes, and long content-authoring sessions can stay open in a browser tab for extended periods — event listeners, intervals/timeouts, and subscriptions (cross-references the `state-management` and `api-integration` skills' listener-lifecycle rules) must be reliably cleaned up, since a leak that's negligible in a 2-minute page visit becomes a real problem (memory growth, slowdown) over a 60-90 minute live class.

## Rule 29: Immutable Asset Caching with Cache-Busting
- Static build assets (JS/CSS bundles, images) are served with long-lived, immutable `Cache-Control` headers and content-hashed filenames (Next.js does this by default for its build output) — so repeat visits load instantly from cache, and a new deploy is guaranteed to bust the cache via the changed hash rather than requiring a manual cache-clear.
