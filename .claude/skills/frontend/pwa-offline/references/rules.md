# PWA & Offline Rules

## Rule 1: Added Only When There's a Real Product Need
- A service worker/PWA layer is real, ongoing complexity (cache invalidation, update flows, debugging stale content) — it's added because the product has an actual requirement (installability for low-connectivity learners, offline lesson access), never speculatively "because PWAs are good practice."
- If the requirement is only "handle a flaky network gracefully," that's `api-integration`'s offline-resilience/retry rules, not a service worker.

## Rule 2: Workbox Generates the Service Worker
- Use Workbox (directly, or via `next-pwa`/`serwist` for Next.js) to generate and manage the service worker — its caching strategies (cache-first, network-first, stale-while-revalidate) are battle-tested; hand-writing raw `fetch`/`caches` API logic reinvents a solved problem and is where subtle stale-cache bugs come from.

## Rule 3: Web App Manifest Is Complete and Correct
- `manifest.webmanifest` includes: `name`/`short_name`, icons at all required sizes (including maskable variants for Android adaptive icons), `start_url`, `display` (`standalone` for an app-like experience), `theme_color`, and `background_color` — a manifest missing required fields fails install-prompt eligibility silently on some platforms.

## Rule 4: Install Prompts Are Deliberate and Dismissible
- The custom install prompt (intercepting `beforeinstallprompt`) is triggered at a sensible moment (after some engagement, not on first page load) and is easily dismissible without blocking the underlying content — an aggressive, undismissable install interrupt is a common PWA anti-pattern that damages trust.
- A dismissed prompt is not re-shown immediately on every subsequent visit — respect a cooldown.

## Rule 5: Caching Strategy Matches Content Type
- App shell (HTML/CSS/JS core) uses cache-first or stale-while-revalidate for fast repeat loads. API/dynamic data uses network-first with a cache fallback (fresh data preferred, cache only as a fallback when offline). Large media (video) is generally NOT precached wholesale — playback/adaptive-quality handling is `video-player-architecture`'s domain, and upload transport is `api-integration`'s; the service worker doesn't duplicate either.
- Never a single blanket "cache everything" strategy — different content types have different freshness requirements, and over-caching risks serving stale course content indefinitely.

## Rule 6: Service Worker Updates Don't Strand Users on Stale Code
- The app detects when a new service worker version has installed and is waiting to activate, and surfaces a clear "update available — reload" affordance to the user (or activates automatically on next natural navigation) — a user must never be silently stuck running weeks-old cached JS because the service worker never told them an update was ready.

## Rule 7: This Skill Owns App-Shell/Asset Caching; `api-integration` Owns Data-Layer Offline Queueing
- The service worker's job is caching static assets and the app shell for fast/offline loading. Queueing a failed API mutation for retry when connectivity returns, and offline-first data sync, is `api-integration`'s domain (and `form-handling-validation`'s autosave for draft persistence) — don't duplicate mutation-queueing logic inside the service worker when the application layer already owns it.

## Rule 8: Offline Fallback UX Is Explicit
- When a navigation fails due to no connectivity and nothing is cached for that route, the service worker serves a designed offline fallback page (explaining the situation, listing what's available offline) — not the browser's default disconnected-network error page.

## Rule 9: Background Sync Retries Queued Actions on Reconnect
- Where the Background Sync API (or a periodic-check fallback for browsers without it) is available, queued offline actions (a submitted answer, a saved draft) automatically retry when connectivity returns, consistent with `api-integration`'s retry/idempotency rules — the user isn't required to manually notice they're back online and retry themselves.

## Rule 10: Cache Storage Is Bounded and Versioned
- Each deploy's service worker uses a versioned cache name, and the `activate` event clears out old-version caches — cache storage must not grow unbounded across deploys, which both wastes device storage (a real constraint on the budget Android devices this audience uses) and risks serving assets from an inconsistent mix of app versions.

## Rule 11: Sensitive/Student Data Is Never Cached Indefinitely
- Any student-specific or sensitive data that ends up in a service worker cache (a cached API response) has an explicit expiry/invalidation policy (Workbox's `expiration` plugin with a max age) — it is never cached with an implicit "forever" lifetime, and logout/account-switch clears any user-scoped caches.
