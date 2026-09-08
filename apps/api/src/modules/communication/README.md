# `communication` — Notifications & Channels

**Phase 1 for notification records; the channels themselves come later.** Baseline §19, §24.

## Will own

Notification templates, recipients, timing and delivery records (§24). In-app messages, and the
mapping from a conversation to a ticket (§19.3 — a conversation is a channel, a ticket is a tracked
issue with an owner and an SLA).

## Provider is deferred

The WhatsApp provider is an open business decision, deliberately deferred. Everything here sits
behind a **channel adapter** so the choice stays cheap — the adapter shape lives in
`integrations/channels/`, not in this module.

## Does not own

- Ticket lifecycle — `operations`. A conversation may *create or attach to* a ticket, but the ticket
  is theirs.
- The outbox. A notification that must reach a third party goes out the same way every external call
  does: an outbox row, drained by a worker.
