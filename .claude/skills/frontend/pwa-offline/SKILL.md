---
name: pwa-offline
description: Use this skill whenever the user is building offline app-shell support, a web app manifest, install prompts, a service worker caching strategy, or background sync — making the app installable or usable with poor/no connectivity. Trigger for phrases like "make this a PWA", "add offline support", "install prompt", "service worker", "web app manifest", "cache this for offline", "background sync", "the app breaks with no signal", or any request involving Workbox, `next-pwa`, or offline-first architecture. Also trigger for Definition of Done review on offline/installability for a release.
---

# PWA & Offline Skill

Defines the app-shell/service-worker layer that makes the app installable and usable under poor or no connectivity — the manifest, caching strategy, install prompts, and background sync — distinct from the data-layer offline resilience already owned by `api-integration`.

## Step 0: Detect Project Context Before Applying Any Rule

**Existing project?**
- Check for an existing `public/manifest.json`/`manifest.webmanifest`, a service worker registration, or `next-pwa`/Workbox config in `package.json`. Follow the established setup.

**New project / no precedent?**
- Use **Workbox** (directly, or via `next-pwa`/`serwist` for Next.js) for service worker generation — don't hand-write a service worker's caching logic from scratch when a maintained abstraction exists.
- Only add a service worker/PWA layer when there's an actual product requirement for installability or offline use — this is meaningful complexity, not a default for every app.

## When to use this
- Making the app installable (manifest, icons, install prompt UX)
- Defining a caching strategy for the app shell and static assets
- Adding background sync for actions attempted while offline
- Diagnosing stale content served from a service worker cache
- Reviewing a PR or running Definition of Done for offline/installability before a release

## Core principles (see `references/rules.md` for full detail with rationale)

1. **PWA/offline layer is added only when there's a real product need**, not speculatively
2. **Workbox (or `next-pwa`/`serwist`) generates the service worker** — never hand-rolled cache logic
3. **The web app manifest is complete and correct** — icons at required sizes, `display`, `start_url`, theme colors
4. **Install prompts are deliberate and dismissible**, never an aggressive interrupt
5. **Caching strategy matches content type** — app shell (cache-first/stale-while-revalidate), API data (network-first), never blanket cache-everything
6. **Service worker updates don't strand users on stale code** — a clear update-available/reload flow
7. **This skill owns the app-shell/asset cache; `api-integration` owns data-layer offline queueing** — they compose, not duplicate
8. **Offline fallback UX is explicit**, not a browser's default "no internet" page
9. **Background sync retries queued actions when connectivity returns**, consistent with `api-integration`'s retry rules
10. **Cache storage is bounded and versioned** — old caches are cleared on activate, never growing unbounded
11. **Sensitive/student data is never cached indefinitely client-side** without an explicit expiry/invalidation policy

## Workflow

1. **Step 0 first, always**: confirm there's a real offline/installability requirement before adding this layer at all.
2. Set up the manifest with correct icons and metadata.
3. Configure Workbox/`next-pwa` caching strategies per content type (shell vs. data vs. media).
4. Add an update-available flow so the service worker never silently strands users on old code.
5. Before sign-off: run through `references/definition-of-done.md`.

## Notes
- This skill governs the app-shell/service-worker layer and installability. For data-fetch retry, offline queueing of API mutations, and draft persistence, see `api-integration` and `form-handling-validation` — don't duplicate that logic in the service worker.
- Grounded in official Workbox, web.dev PWA, and W3C Web App Manifest documentation — see `references/sources.md`.
