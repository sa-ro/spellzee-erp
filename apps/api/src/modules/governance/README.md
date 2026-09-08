# `governance` — RBAC, Approvals, Audit

**Phase 1.** Baseline §22.

The controls that make `/CLAUDE.md`'s north star true: *nothing important happens invisibly.*

## Owns

- **RBAC** over view / create / edit / approve / cancel / merge / archive / export / administer.
- **Permission by relationship** — coordinator-of, teacher-of, parent-of. Not a flat role string:
  a parent sees their own child, a teacher sees their own students.
- **Maker–checker** for sensitive actions — refunds, duplicate merges, historical corrections,
  high-impact subscription changes, restricted deletion. The requester never approves their own
  request.
- **Audit** — who, what, why, old value, new value, approver.
- **Overrides** — an authorised override records all of the above.

## Note on the split with `platform/`

This module owns the **data**: role tables, permission rows, approval requests, audit records.
`platform/authz` and `platform/audit` own the **mechanism** — the guard that runs on every command,
the interceptor that writes the record.

The split matters because `platform/` must stay domain-agnostic. It may not import this module;
it reads through its own abstractions.

## Authentication is not here

Authentication is deferred and sits behind `platform/auth/session.adapter.ts`. **Authorization is
ours and is built now.** Swapping the auth provider later must not touch a single rule in this
module — if it would, the boundary was drawn wrong.

## Blocked

- **Fields requiring approval to edit** (§30.8) — per-field registry or per-action enum? §22.5
  requires overrides record "old value, new value", which points at field-level. This shapes the
  approval tables every write path traverses.
- **Approval role set** (§30.7) — §22.4 is "illustrative, not final" but is the only enumeration of
  actors. The financial *thresholds* half is Phase 4 and takes placeholders; the role structure does
  not.
