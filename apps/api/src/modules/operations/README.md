# `operations` — Operations & Delivery

**Phase 1, and the largest module.** Baseline §8, §9, §14, §15, §20.

Handover, ownership, allocation, scheduling, sessions, compensation, tickets, SLA.

## Owns

- **Admission handover** and parent verification (§8).
- **Coordinator ownership** (§9) — sequential, one active owner, full history. Assigning a ticket
  transfers ownership permanently.
- **Allocation and scheduling** (§14) — matching, `class_schedules` as the recurring series.
- **Sessions** — occurrences materialised on a rolling horizon, so attendance, entitlement and
  Merithub IDs have stable identity to attach to.
- **`session_participants`** — the join to students. 1-to-1 is one participant, group is several;
  same structure, no special case.
- **Compensation** — always 1-to-1, always a separate session, never mutating the recurring
  schedule.
- **Tickets and SLA** (§20). At most one open ticket per student.

## Does not own

- **Entitlement.** Consuming a session writes a ledger entry, and the ledger belongs to `finance`.
  Call its public API — do not compute a balance here.
- **Merithub calls.** Allocation completes locally and writes an outbox row; a worker provisions.
- Teacher certification — that is `teacher-hr`. This module only *reads* whether a teacher is
  eligible, and the database enforces it.

## Invariants

- `one_active_owner_per_student` — partial unique on `ended_at IS NULL`.
- `one_open_ticket_per_student` — partial unique on non-closed status.
- `teacher_no_overlap` — EXCLUDE gist; verified against the running database.
- A student cannot be in two sessions at once — same shape, keyed by student, on
  `session_participants`.

## Blocked

- **Capacity unit** (§30.10) — hours/minutes/sessions/weighted slots are four grains, not four
  values. Blocks the capacity tables entirely.
- **Teacher vs student technical failure** (§30.3) — §15.4's "generally", "may follow a separate
  policy" and "**verified**" are three ambiguities in one sentence. Decides the ledger vocabulary,
  so it blocks `finance` too.
