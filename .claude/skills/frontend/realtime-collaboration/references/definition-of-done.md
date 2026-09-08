# Definition of Done — Real-Time Collaboration

## 1. Transport Choice
- [ ] Existing realtime transport reused where possible; a new transport (SFU, Socket.io, CRDT) introduced only when the concern genuinely requires it
- [ ] Live video/audio with >2 participants uses a managed SFU, not mesh WebRTC

## 2. Reconnection
- [ ] Explicit `connecting`/`connected`/`reconnecting`/`failed` UI states exist
- [ ] Reconnection uses backoff; `failed` state offers a manual retry, not infinite silent retry

## 3. State Integrity
- [ ] Shared session state is server-authoritative; clients send intents and reconcile to server broadcasts
- [ ] Mid-session join receives a full state snapshot, not only future deltas
- [ ] Participant leaving doesn't leave shared state (votes, whiteboard) in an inconsistent condition

## 4. Presence & Timing
- [ ] Presence uses heartbeat/timeout, not raw connect/disconnect events alone
- [ ] Live poll/quiz timing enforced server-side, consistent with `form-handling-validation`'s assessment rules

## 5. Media Quality
- [ ] Live media adapts to bandwidth per participant (simulcast/adaptive layers), degrading gracefully on poor connections

## 6. Safety & Accessibility
- [ ] Chat/whiteboard content sanitized before render
- [ ] Session controls are keyboard-operable and labeled; live captions offered where feasible
- [ ] Recording (if supported) shows an unambiguous in-progress indicator to all participants — never silent

## 7. Observability
- [ ] Connection-quality metrics and session errors captured, tagged distinctly, with elevated alerting for live-class failures

## Sign-off
Only mark "realtime-collaboration: done" once all sections are checked.
