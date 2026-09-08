# Definition of Done — PWA & Offline

## 1. Justification
- [ ] There's a real product requirement for installability/offline use — this layer wasn't added speculatively

## 2. Manifest & Install
- [ ] `manifest.webmanifest` complete: name, icons (including maskable), `start_url`, `display`, theme/background colors
- [ ] Install prompt triggers at a sensible moment, is dismissible, and respects a cooldown after dismissal

## 3. Service Worker & Caching
- [ ] Workbox (or `next-pwa`/`serwist`) generates the service worker — no hand-rolled cache logic
- [ ] Caching strategy matches content type (shell: cache-first/SWR; API data: network-first; large media not blanket-precached)
- [ ] Update-available flow surfaces to the user — no silent stranding on stale cached code
- [ ] Cache names are versioned; old caches cleared on `activate`

## 4. Offline UX
- [ ] A designed offline fallback page is served on failed navigation with nothing cached — not the browser default error
- [ ] Background sync (or fallback) retries queued offline actions on reconnect, consistent with `api-integration`

## 5. Data Boundaries
- [ ] No duplication of `api-integration`'s data-layer offline queueing inside the service worker
- [ ] Cached sensitive/student data has an explicit expiry policy; logout clears user-scoped caches

## Sign-off
Only mark "pwa-offline: done" once all sections are checked.
