---
name: notifications
description: Use this skill whenever the user is building push notifications, an in-app notification center, toast/snackbar alerts, or notification preferences. Trigger for phrases like "add push notifications", "notification center", "notification bell", "toast message", "notification preferences", "unread count", "the notification badge is wrong", "web push", "FCM", or any request involving notifying users of events (assignment due, grade posted, live class starting). Also trigger for Definition of Done review on a notifications feature.
---

# Notifications Skill

Defines how users are notified of events — web push (browser/OS-level), an in-app notification center with unread state, and transient toast/snackbar alerts — with a clear boundary between the three, consistent read-state handling, and deliverability discipline for EdTech-critical notices (assignment due, grade posted, live class starting).

## Step 0: Detect Project Context Before Applying Any Rule

**Existing project?**
- Check `package.json` for `firebase` (FCM), `web-push`, `onesignal-*`, or a custom notification service, plus any existing toast library (`sonner`, `react-hot-toast`). Follow whatever is established.

**New project / no precedent?**
- Default to **Firebase Cloud Messaging (FCM)** for web push if Firebase is already used elsewhere in the stack (per `state-management`/`api-integration` conventions); otherwise the **Web Push API** directly via a service worker (cross-references `pwa-offline`). Default to **`sonner`** for toast/snackbar UI — lightweight, accessible-by-default — but this is a swappable preference, not a hard requirement: `react-hot-toast` is an equally reasonable choice if the team already leans that way; confirm rather than assume when starting fresh.

## When to use this
- Adding web push notifications (permission request, subscription, delivery)
- Building an in-app notification center (bell icon, list, unread count)
- Showing transient toast/snackbar feedback for an action
- Building notification preference controls (what to be notified about, and how)
- Reviewing a PR or Definition of Done for a notifications feature

## Core principles (see `references/rules.md` for full detail with rationale)

1. **Three distinct notification surfaces, not conflated** — push (OS-level, needs permission), in-app center (persistent, unread-tracked), toast (transient, in-session only)
2. **Push permission is requested contextually**, never on page load
3. **Notification content never includes sensitive data** in the push payload itself — cross-references `security-practices`
4. **Unread state is a single source of truth from the backend**, not recomputed inconsistently client-side
5. **Toasts are non-blocking and accessible** — `aria-live`, auto-dismiss with a pause-on-hover/focus, never trapping focus
6. **Real-time delivery for in-app notifications uses the project's existing realtime layer**, not a new one — cross-references `realtime-collaboration`/`state-management`
7. **Notification preferences are respected and granular** — a user can opt out of categories, not just all-or-nothing
8. **EdTech-critical notifications (assignment due, grade posted, live class starting) have delivery confirmation/fallback**, not fire-and-forget
9. **Deep-linking from a notification takes the user to the actual relevant content**, not just the app's home screen
10. **Notification content is localized**, cross-references `i18n-l10n`
11. **Badge/unread counts update optimistically but reconcile with the server**, never drifting permanently out of sync

## Workflow

1. **Step 0 first, always**: detect existing notification/toast tooling, or set FCM/Web Push + `sonner` as the standard.
2. Build the in-app notification center's data model (unread state, categories) before wiring push delivery.
3. Request push permission contextually, tied to a specific user action, not on load.
4. Add preference controls before shipping any notification category broadly.
5. Before sign-off: run through `references/definition-of-done.md`.

## Notes
- This skill governs notification delivery and UI across push/in-app/toast surfaces. For the realtime transport delivering in-app notifications live, see `realtime-collaboration` and `state-management`. For the service worker handling push events, see `pwa-offline`. For not leaking sensitive content in a push payload, see `security-practices`.
- Grounded in official Web Push API, FCM, and W3C ARIA live-region documentation — see `references/sources.md`.
