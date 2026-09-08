# Video Player Architecture Rules

## Rule 1: Player Library Is Project-Detected; Vidstack/Video.js + hls.js Is the Default
- Check for an existing player library and follow it. For a new precedent: use Vidstack or Video.js as the player shell (accessible controls, theming, plugin ecosystem) with hls.js (or native HLS on Safari/iOS) for adaptive streaming — don't hand-roll a `<video>` wrapper with custom quality-switching logic when maintained libraries solve this.

## Rule 2: Adaptive Bitrate Playback Is the Default Path
- The player defaults to automatic quality switching based on measured bandwidth (ABR) — a manual quality selector is offered as a secondary, opt-in control for users who want to force a specific quality (e.g. to save data), not the primary playback mode. This rule owns ABR on the playback side; `api-integration`'s Rule 12 owns the corresponding chunked/resumable upload of the source video — the two compose but are not the same rule.

## Rule 3: Resume Position Syncs to the Backend
- Playback position is periodically saved to the backend (debounced, not on every timeupdate event) keyed to the student and the specific video, so resuming plays from the correct position regardless of device — local-storage-only resume breaks the moment a student switches from phone to laptop, which is a common EdTech usage pattern.
- On load, the player seeks to the synced position (with a brief, dismissible "resume from X:XX?" affordance for a jarring jump, rather than silently seeking without indication).

## Rule 4: DRM Added Only When Actually Required, as a Distinct Tier
- DRM (Widevine/FairPlay/PlayReady via EME, typically through Shaka Player or a DRM-capable service) is added only for content tiers that genuinely require content protection (paid/licensed course material) — free/preview content plays without the added complexity and failure surface DRM introduces (license-server dependency, EME browser-support variance, harder debugging).
- DRM-protected and non-DRM playback paths are kept as explicitly distinct code paths, not a single player instance where DRM is silently no-op'd for some content.

## Rule 5: Captions/Subtitles Are First-Class
- Captions use WebVTT, are time-synced accurately to the source audio, and support multiple languages where course content is localized (cross-references `i18n-l10n`) — captions are treated as required content-authoring output for lesson video, not an optional afterthought bolted on later.
- The caption track selector is keyboard-accessible and the active track's language is announced correctly to assistive technology.

## Rule 6: Player Is Keyboard-Operable and Screen-Reader-Labeled
- All player controls (play/pause, seek, volume, captions, fullscreen, playback speed) are reachable and operable via keyboard, with correct ARIA labels/roles (`role="slider"` for the seek bar with `aria-valuenow`, etc.) — cross-references `accessibility`'s general control-labeling rules, applied specifically to a custom media player's non-native controls.

## Rule 7: Player Controls Respect `prefers-reduced-motion`
- Any animated UI chrome in the player (control-bar fade transitions, a loading-state animation) respects `prefers-reduced-motion` per `animation-motion`'s shared mechanism — a player's own control animations are not exempt from that rule just because they're "small."

## Rule 8: Poor-Connectivity Playback Degrades Gracefully
- On stall/rebuffer, the player shows an explicit loading/buffering indicator with elapsed-wait feedback — never a silent frozen frame with no indicator. On sustained poor connectivity, the player proactively drops to a lower quality tier rather than repeatedly stalling at a quality the connection can't sustain. This directly serves the low-bandwidth EdTech audience `performance-optimization` and `pwa-offline` are already built around.

## Rule 9: Player Is Lazy-Loaded and Code-Split
- The player library and its dependencies (hls.js, DRM tooling if present) are dynamically imported and load only on the route that actually plays video — never bundled into the shared/root chunk. This is a heavy dependency; a student browsing the course catalog should not download player code before opening a lesson.

## Rule 10: QoE Analytics Are Instrumented
- Playback quality-of-experience events (start time / time-to-first-frame, rebuffer count and duration, quality-switch events, completion rate) are sent to analytics — playback quality is measured in production, not assumed correct from a developer's fast connection during testing. This data is what actually reveals whether the low-bandwidth-adaptive rules above are working.

## Rule 11: Playback Errors Are Captured and Distinguishable
- Player errors (media decode failure, DRM license failure, network error, unsupported format) are captured via the monitoring tool (`error-observability`) tagged with the specific error category — a generic "video failed to play" report without the underlying cause is not actionable. Network-transient errors are distinguished from genuine playback/format errors so alerting isn't triggered by every flaky connection.

## Rule 12: Autoplay Is Never Assumed
- The player does not assume autoplay will succeed — it respects the browser's autoplay policy (most browsers block unmuted autoplay), checks the actual play-promise result, and falls back to a visible play button/prompt when autoplay is blocked rather than silently failing with a frozen player and no explanation.
- Autoplay is used deliberately (e.g. muted preview thumbnails) and never for a full lesson video without explicit user-initiated play.

## Rule 13: Picture-in-Picture and Background-Audio Behavior Is Deliberate
- Whether the player supports Picture-in-Picture and whether audio/video continues when the tab is backgrounded or the app is minimized (mobile) is a deliberate product decision for the educational context (e.g. supporting PiP so a student can take notes while watching), not left to whatever the browser/native player defaults to unexamined.
