# Definition of Done — Video Player Architecture

## 1. Setup
- [ ] Existing player library convention detected and followed, or Vidstack/Video.js + hls.js used for a new precedent
- [ ] Player bundle is lazy-loaded/code-split, not in the shared/root chunk

## 2. Playback Behavior
- [ ] Adaptive bitrate playback is the default; manual quality override is secondary
- [ ] Resume position syncs to the backend, not local-storage-only
- [ ] Autoplay respects browser policy with a play-promise check and visible fallback if blocked

## 3. DRM (if applicable)
- [ ] DRM added only for content tiers that actually require it, as a distinct code path from non-DRM playback

## 4. Captions & Accessibility
- [ ] WebVTT captions accurately time-synced, multi-language where content is localized
- [ ] All controls keyboard-operable with correct ARIA roles/labels
- [ ] Player UI chrome animation respects `prefers-reduced-motion`

## 5. Resilience & Low-Bandwidth
- [ ] Buffering/stall shows an explicit indicator, never a silent frozen frame
- [ ] Quality proactively drops under sustained poor connectivity rather than repeated stalling

## 6. Observability
- [ ] QoE analytics instrumented (start time, rebuffer count/duration, quality switches, completion)
- [ ] Playback errors captured and categorized (decode/DRM/network/format), distinguishable from transient network errors

## 7. Product Decisions
- [ ] Picture-in-Picture and background-playback behavior is a deliberate decision, not an unexamined default

## Sign-off
Only mark "video-player-architecture: done" once all sections are checked.
