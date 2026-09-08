# Real-Time Collaboration Rules

## Rule 1: Managed SFU for Live Video/Audio, Never Raw Mesh WebRTC
- Live class sessions with more than 2 participants use a managed Selective Forwarding Unit service (LiveKit, Agora, Daily) rather than peer-to-peer mesh WebRTC connections — mesh topology's bandwidth/CPU cost grows quadratically with participant count and falls over well before a typical classroom size. A managed SFU also solves TURN/STUN fallback, recording, and simulcast quality adaptation that would otherwise be rebuilt from scratch.

## Rule 2: Transport Is Project-Detected, One Realtime Layer Per Concern
- Check for an existing realtime transport (Firebase, Socket.io, a managed service) and reuse it for new data-only realtime features rather than introducing a second transport for a new feature — two parallel realtime systems (e.g. Firebase for one feature, a new Socket.io server for another) doubles operational surface for no benefit unless there's a real reason (e.g. media needs an SFU that data-sync doesn't).

## Rule 3: Reconnection Is Designed Explicitly
- Every realtime feature has an explicit reconnection state machine with distinct UI for `connecting` / `connected` / `reconnecting` / `failed` — a dropped WebSocket/RTC connection must never silently leave the UI showing stale "connected" state while nothing is actually syncing. Reconnection uses exponential backoff, and a `failed` state (after repeated retry exhaustion) gives the user a clear manual-retry action rather than retrying forever silently.

## Rule 4: Server-Authoritative Shared State
- Shared session state (a live poll's vote counts, a whiteboard's current content, whose turn it is to speak) has a single source of truth on the server/session backend — clients send intents (a vote, a stroke) and reconcile to the server's broadcast state, never treating their own local state as authoritative for anything other participants see. This prevents two participants' conflicting local edits from silently diverging.

## Rule 5: Presence Uses Heartbeat/Timeout, Not Raw Connect/Disconnect Events
- "Who's online" presence is derived from a heartbeat/last-seen timestamp with a timeout window (e.g. no heartbeat for 30s → shown offline), not solely from the transport's connect/disconnect events — a browser tab that's backgrounded, a laptop that sleeps, or a network drop that doesn't cleanly fire a disconnect event would otherwise leave a participant shown as permanently online.

## Rule 6: Live Polls/Quizzes Follow the Same Server-Enforced Timing Discipline
- A live in-session poll or quiz question's timer and answer window are enforced server-side, and results are computed from server-received answers, not client-reported ones — consistent with `form-handling-validation`'s timed-assessment rule (Rule 18), applied to the live-session context: a participant's manipulated client clock must not let them answer after the window server-side.

## Rule 7: Bandwidth-Adaptive Media Quality
- Live video/audio quality adapts to each participant's measured bandwidth (most SFU services provide this via simulcast/adaptive layers) — consistent with `video-player-architecture`'s ABR principle applied to live media instead of on-demand playback. A participant on a poor connection degrades to audio-only or lower resolution rather than the session stalling entirely for them.

## Rule 8: Chat/Whiteboard Content Sanitized Before Render
- Chat messages and any user-generated content rendered from a realtime channel follow `security-practices`'s Rule 3 XSS-prevention baseline exactly (sanitize or render as plain text/markdown through a safe renderer) — a realtime channel is not exempt from the same injection risk as a form field just because the content arrives over a WebSocket instead of an HTTP POST. For structured collaborative-document content specifically, see `rich-text-editing`'s Rule 3.

## Rule 9: Mid-Session Join/Leave Doesn't Corrupt Shared State
- A participant joining mid-session receives the current authoritative state snapshot (not just future deltas) so they see the whiteboard/poll/chat history correctly from the moment they join. A participant leaving doesn't leave shared state in an inconsistent condition (e.g. a vote count that never decrements if their vote should no longer count, or a whiteboard operation left half-applied).

## Rule 10: Accessibility for Live Features Is Deliberate
- Live audio/video sessions offer live captions where feasible (via the SFU/service's transcription capability or a third-party captioning integration) — cross-references `accessibility`. All session controls (mute, raise hand, leave) are keyboard-operable and properly labeled, not solely mouse/touch-driven icon buttons.

## Rule 11: Session Errors and Connection Quality Are Observable
- Connection-quality metrics (packet loss, jitter, reconnection frequency) and session errors (failed to join, media permission denied, SFU connection failure) are captured via the monitoring tool per `error-observability`, tagged distinctly from generic app errors — a live class failure is high-severity (a scheduled session with real people waiting) and needs to be immediately visible, not buried in general error noise.

## Rule 12: Recording/Consent Is Explicit
- If a live session can be recorded, all participants see a clear, unambiguous recording-in-progress indicator the moment recording starts, and recording is never silent — this is both a legal/compliance requirement in most jurisdictions and a product-trust issue, especially with minors in an EdTech context.
