# Notifications Rules

## Rule 1: Three Distinct Notification Surfaces, Not Conflated
- **Push notifications** are OS/browser-level, require explicit permission, and reach the user even when the app isn't open. **In-app notification center** entries are persistent, tracked as read/unread, and reviewable later (a bell icon with a list). **Toasts/snackbars** are transient, session-only feedback for an immediate action (e.g. "Saved") that disappear and are gone. These three have different lifecycles and different implementations — don't build one mechanism and try to stretch it to cover all three use cases (e.g. don't use a toast for something the user needs to find again later; that belongs in the notification center).

## Rule 2: Push Permission Requested Contextually
- The browser's push-permission prompt is triggered by a specific, contextual user action (e.g. after the user opts into "notify me about live class reminders" in settings, or after completing a relevant flow) — never fired automatically on page load or first visit. A cold, out-of-context permission prompt has a very low grant rate and often gets permanently denied, closing off the channel for good since most browsers won't re-prompt after a denial.

## Rule 3: Notification Content Never Includes Sensitive Data in the Push Payload
- A push notification's payload (title/body, visible in the OS notification tray, potentially on a lock screen) never includes sensitive content (a grade value, private message content, personal details) — the payload contains only a generic prompt ("You have a new grade posted") and the actual sensitive content is fetched securely once the user opens the app and is authenticated, consistent with `security-practices`'s data-exposure principles. A lock-screen-visible grade is a real privacy leak on a shared/family device.

## Rule 4: Unread State Is a Single Source of Truth from the Backend
- The unread/read status of in-app notifications is tracked server-side (a `readAt` field per notification per user) and the client reflects that state — not independently computed or cached client-side in a way that can desync across devices/tabs. Marking a notification read on one device must be reflected when the user checks the notification center on another device.

## Rule 5: Toasts Are Non-Blocking and Accessible
- Toasts render in an `aria-live="polite"` (or `assertive` for urgent/error toasts) region so screen reader users are informed without an intrusive interruption, auto-dismiss after a reasonable duration but pause the dismiss timer on hover/keyboard-focus (so a user reading it doesn't have it disappear mid-read), and never trap keyboard focus or block interaction with the rest of the page.

## Rule 6: Real-Time In-App Delivery Uses the Project's Existing Realtime Layer
- New in-app notifications appearing live (without a page refresh) are delivered via whatever realtime transport the project already uses (Firebase listeners per `state-management`, or the realtime layer from `realtime-collaboration`) — not a separately introduced polling loop or a second WebSocket connection duplicating existing infrastructure.

## Rule 7: Notification Preferences Are Respected and Granular
- Users can control notification preferences per category (assignment reminders, grade updates, live class alerts, marketing) and per channel (push vs. email vs. in-app only) — not a single all-or-nothing toggle. Preference changes take effect for future notifications promptly, and the backend's send logic actually checks and respects the stored preference before sending (a UI toggle that doesn't actually gate delivery server-side is a broken feature, not a real preference).

## Rule 8: EdTech-Critical Notifications Have Delivery Confirmation/Fallback
- Time-sensitive, high-stakes notifications (an assignment deadline approaching, a live class starting soon) are not fire-and-forget — the system tracks whether delivery/read confirmation occurred and, where the product requires reliability (e.g. an imminent live class), falls back to a secondary channel (email/SMS) if the primary push channel shows no engagement within a relevant window. A missed live-class notification has real consequences distinct from a missed "someone liked your post" notification.

## Rule 9: Deep-Linking Takes the User to the Actual Relevant Content
- Tapping/clicking a notification (push or in-app) navigates the user directly to the specific relevant screen (the specific assignment, the specific live class, the specific graded submission) — never just to the app's generic home/dashboard, which forces the user to re-navigate and re-find what the notification was about.

## Rule 10: Notification Content Is Localized
- Notification title/body text is generated in the recipient's preferred locale (per `i18n-l10n`'s mechanism) at send time — a notification service sending only English strings regardless of the user's locale setting is a routine but avoidable localization gap.

## Rule 11: Badge/Unread Counts Update Optimistically but Reconcile with the Server
- The notification bell's unread badge count updates immediately on local actions (marking one read) for responsive UX, but periodically reconciles with the server's authoritative count (on notification-center open, on reconnect, or via the realtime channel per Rule 6) — an optimistic-only count that never reconciles will drift out of sync over time (e.g. after a notification is read on another device) and erode trust in the badge.
