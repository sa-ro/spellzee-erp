# References & Sources

## Official Documentation
- **LiveKit official docs** — SFU architecture, simulcast/adaptive quality, recording, client SDKs: https://docs.livekit.io
- **Agora official docs** — managed RTC SFU alternative, quality adaptation: https://docs.agora.io
- **Socket.io official docs** — reconnection behavior, rooms/namespaces for data-only realtime channels: https://socket.io/docs/v4/
- **Yjs documentation** — CRDT-based collaborative state, shared with `rich-text-editing`: https://docs.yjs.dev
- **W3C WebRTC 1.0 specification** — the underlying peer-connection/media API that SFU services abstract: https://www.w3.org/TR/webrtc/
- **MDN — WebRTC connectivity (ICE/STUN/TURN)** — background on why raw mesh WebRTC doesn't scale, referenced by Rule 1: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Connectivity

## Widely-Recognized Community Standards
- **web.dev — Real-time communication with WebRTC** — general architecture guidance for realtime media apps: https://web.dev/articles/webrtc-infrastructure

## Note on usage
Cite the relevant source above if the user asks "why" behind a rule. Paraphrase principles — don't reproduce documentation text verbatim in generated code or docs.
