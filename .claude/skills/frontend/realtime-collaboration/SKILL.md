---
name: realtime-collaboration
description: Use this skill whenever the user is building live/real-time features beyond simple Firebase data sync — live class sessions, WebRTC video/audio, chat, presence indicators, live quiz/poll sync during a session, or collaborative whiteboarding. Trigger for phrases like "live class", "video call", "WebRTC", "chat feature", "who's online", "presence indicator", "live poll", "collaborative whiteboard", "reconnection handling", "the live session drops when network blips", or any request involving WebSocket architecture, Socket.io, LiveKit, or real-time multi-user sync. Also trigger for Definition of Done review on a live/realtime feature.
---

# Real-Time Collaboration Skill

Defines the architecture for genuinely real-time, multi-user features — live class sessions (video/audio), chat, presence, live in-session polls/quizzes, and collaborative surfaces — distinct from `state-management`'s Firebase-listener rules, which cover simpler one-directional realtime data sync, not multi-party session architecture.

## Step 0: Detect Project Context Before Applying Any Rule

**Existing project?**
- Check `package.json` for `livekit-client`, `socket.io-client`, `agora-rtc-sdk-ng`, `daily-co`, or `yjs`. Follow whatever is already established.

**New project / no precedent?**
- For live video/audio classes: use a managed SFU service (**LiveKit** or **Agora**) rather than building raw WebRTC peer connections — mesh WebRTC doesn't scale past a handful of participants, and a managed SFU solves connection quality, recording, and scaling.
- For chat/presence/live polls (data-only, no media): **Socket.io** or a managed realtime data service (Firebase Realtime Database/Firestore, Ably, Pusher) depending on what's already in the stack — don't introduce a second realtime transport if Firebase is already used elsewhere in the project.
- For collaborative documents/whiteboards: a CRDT library (**Yjs**), consistent with `rich-text-editing`'s collaboration rule.

## When to use this
- Building a live class session (video/audio, screen share)
- Adding chat, presence ("who's online"), or typing indicators
- Syncing a live poll/quiz across all participants in a session
- Building a collaborative whiteboard or shared cursor experience
- Handling reconnection when a participant's network drops mid-session
- Reviewing a PR or Definition of Done for a live/realtime feature

## Core principles (see `references/rules.md` for full detail with rationale)

1. **Managed SFU for live video/audio, never raw mesh WebRTC** — scaling and connection-quality problems are already solved
2. **Transport is project-detected**, consistent with whatever realtime layer already exists (don't add a second one)
3. **Reconnection is designed explicitly**, with clear UI state (reconnecting/reconnected/failed), not a silent hang
4. **Session state has a single source of truth on the server**, clients reconcile to it — never client-authoritative for shared state
5. **Presence uses heartbeat/timeout, not just connect/disconnect events** — a stale tab shouldn't show as "online" forever
6. **Live polls/quizzes use the same server-enforced timing discipline as `form-handling-validation`'s assessment rules**
7. **Bandwidth-adaptive media quality** for live video, consistent with `video-player-architecture`'s ABR principle
8. **Chat/whiteboard content is sanitized before render**, consistent with `rich-text-editing`/`form-handling-validation`'s XSS rules
9. **A participant leaving/joining mid-session doesn't corrupt shared state** (a whiteboard, a poll count)
10. **Accessibility for live features is deliberate** — captions for live audio, keyboard operability for session controls
11. **Session errors and connection-quality issues are observable**, cross-referencing `error-observability`
12. **Recording/consent is explicit** when a live session is recorded — never silent recording

## Workflow

1. **Step 0 first, always**: detect existing realtime transport, or choose an SFU for media / Socket.io-or-Firebase for data-only / Yjs for collaborative docs.
2. Design the reconnection flow and server-authoritative state model before building UI.
3. Wire presence with heartbeat/timeout, not raw connect/disconnect.
4. For live assessments: apply the same server-enforced timing rules as `form-handling-validation`.
5. Before sign-off: run through `references/definition-of-done.md`.

## Notes
- This skill governs multi-party live/realtime architecture. For simpler one-directional Firebase listener sync, see `state-management` and `api-integration`. For collaborative document editing specifically, see `rich-text-editing`. For live video playback quality principles, see `video-player-architecture`.
- Grounded in official LiveKit, Socket.io, Yjs, and WebRTC (W3C) documentation — see `references/sources.md`.
