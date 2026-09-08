---
name: video-player-architecture
description: Use this skill whenever the user is building or reviewing video playback — a course lesson player, DRM-protected paid content, resume-position sync, captions/subtitles, seek/scrubbing UX, or adaptive playback quality. Trigger for phrases like "build a video player", "resume where I left off", "DRM protect this video", "captions aren't showing", "the player buffers too much", "adaptive bitrate playback", "Video.js", "hls.js", "Shaka Player", or any request involving lesson/course video playback. Also trigger for Definition of Done review on a video playback feature. Distinct from `api-integration`'s upload/transport rules — this skill owns playback, not ingestion.
---

# Video Player Architecture Skill

Defines how course/lesson video is actually played back — player library choice, adaptive streaming playback, DRM for paid content, resume-position sync, captions, and low-bandwidth/low-end-device playback UX — as the counterpart to `api-integration`'s upload/transport rules, which stop once a video is stored.

## Step 0: Detect Project Context Before Applying Any Rule

**Existing project?**
- Check `package.json` for `video.js`, `hls.js`, `shaka-player`, `@vidstack/react`, or a native `<video>`-based custom player. Follow whatever is already established.

**New project / no precedent?**
- Default to **Vidstack (`@vidstack/react`)** or **Video.js** for a general accessible, themeable player shell, built on **hls.js**/native HLS for adaptive streaming. Add **Shaka Player** or a DRM-capable alternative only when actual DRM (Widevine/FairPlay/PlayReady) is required for paid content — don't add DRM tooling speculatively.

## When to use this
- Building any lesson/course video player, or a preview/trailer player
- Adding resume-from-last-position, chapters, or playback-speed controls
- Handling captions/subtitles (including multi-language)
- Protecting paid course content with DRM
- Diagnosing buffering, stalls, or quality-switching issues
- Reviewing a PR or Definition of Done for a video playback feature

## Core principles (see `references/rules.md` for full detail with rationale)

1. **Player library is project-detected; Vidstack/Video.js + hls.js is the default shell**
2. **Adaptive bitrate playback is the default**, manual quality override is a secondary control, not the primary path
3. **Resume position syncs to the backend, not just local storage** — a student switching devices resumes where they left off
4. **DRM is added only when content actually requires protection**, and treated as a distinct capability tier, not bolted onto every video
5. **Captions/subtitles are first-class**, not an afterthought — WebVTT, multi-language, accurate sync
6. **The player is keyboard-operable and screen-reader-labeled** — cross-references `accessibility`
7. **Player controls respect `prefers-reduced-motion`** for any animated UI chrome — cross-references `animation-motion`
8. **Poor-connectivity playback degrades gracefully**, never a silent infinite spinner
9. **The player is lazy-loaded and code-split**, never in the shared/root bundle
10. **Analytics/QoE events are instrumented** (start time, rebuffer count, completion) — playback quality is measured, not assumed
11. **Playback errors are captured and distinguishable from network errors** — cross-references `error-observability`
12. **Autoplay is never assumed** — respects browser autoplay policy and user intent explicitly
13. **Picture-in-picture and background-audio behavior is deliberate**, not left to browser defaults for an educational context

## Workflow

1. **Step 0 first, always**: detect existing player library, or set the default shell + hls.js as the standard.
2. Wire adaptive playback, resume-position sync, and captions before any custom UI chrome.
3. Add DRM only if the content tier actually requires it.
4. Instrument QoE analytics and error capture.
5. Before sign-off: run through `references/definition-of-done.md`.

## Notes
- This skill governs playback. For chunked upload, transcoding pipeline, and adaptive-bitrate file preparation, see `api-integration`. For player bundle-splitting and load performance, see `performance-optimization`. For player accessibility, see `accessibility`.
- Grounded in official HLS.js, Shaka Player, Video.js/Vidstack, WebVTT, and Media and Entertainment Accessibility (W3C) documentation — see `references/sources.md`.
