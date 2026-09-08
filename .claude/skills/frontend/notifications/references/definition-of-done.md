# Definition of Done — Notifications

## 1. Surface Boundaries
- [ ] The right surface (push/in-app center/toast) is used for the notification's actual lifecycle need — not conflated

## 2. Push Specifics
- [ ] Permission requested contextually, tied to a specific user action — never on page load
- [ ] Push payload contains no sensitive data — actual content fetched post-authentication

## 3. In-App Center
- [ ] Unread/read state sourced from the backend, consistent across devices/tabs
- [ ] New notifications delivered via the project's existing realtime layer, not a duplicate transport

## 4. Toasts
- [ ] Rendered in an appropriate `aria-live` region; auto-dismiss pauses on hover/focus; never traps focus

## 5. Preferences
- [ ] Granular per-category/per-channel preferences exist and are actually enforced server-side at send time

## 6. Critical Notifications
- [ ] High-stakes EdTech notifications (deadlines, live class start) have delivery tracking and a fallback channel where required

## 7. UX Details
- [ ] Notification click/tap deep-links to the specific relevant content, not the generic home screen
- [ ] Notification content localized to the recipient's locale
- [ ] Unread badge count updates optimistically and reconciles with the server

## Sign-off
Only mark "notifications: done" once all sections are checked.
