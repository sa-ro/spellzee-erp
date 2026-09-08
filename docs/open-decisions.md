# Open decisions — audited for Phase 1

Produced by `scope-interrogator` on 2026-09-09 against
[`baseline/requirements-draft-3.txt`](baseline/requirements-draft-3.txt) (§30 lists 21 items).
Two findings independently spot-checked against the baseline text before recording.

The distinction that matters:

- **SHAPE-blocking** — the answer changes the schema, the data model or the domain vocabulary.
  These genuinely block; `schema-architect` cannot proceed past them on a guess.
- **VALUE-blocking** — only a number is unknown; the schema and code path are identical either way.
  These become versioned policy rows with flagged placeholders, per `spellzee-policy-versioning`.

Most decisions that *feel* blocking are value-blocking. Fifteen of twenty-one are.

---

## Blockers — answer before schema work

### 1. Capacity calculation unit — hours, minutes, sessions or weighted slots (§30.10)

**Blocks:** every capacity and availability table.

Four different grains, not four values of one column. Weighted slots make weight a first-class
dimension table; sessions make it an integer count; hours need duration arithmetic.

The baseline contradicts itself. §13.3's worked example is entirely in sessions — *"32 free
sessions + 8 expected releases versus 45 expected demand = projected gap of 5"* — while §30 leaves
the unit open. Either §13.3 pre-empts §30 or the example is illustrative.

Compounded by §13.1, which requires capacity dimensioned by day/slot, subject, level, language
(*"Tamil-English or Hindi-English"*), 1-to-1 vs group, leave, and temporary capacity from breaks;
and §13.2, which requires forecast capacity modelled separately with an expected release period.

Cannot hide behind a policy row — the row would have to describe its own column type.

**Ask alongside:** the session-length model (below). Any hours-based answer depends on it.

### 2. Fields requiring approval to edit (§30.8)

**Blocks:** the approval / maker–checker tables — which every Phase 1 write path traverses.

§30 lists this *separately* from the approval hierarchy (§30.7), implying field-level granularity
beyond §22.4's action-level matrix. §22.5 points the same way: *"Authorized overrides must record
who performed the override, what changed, why, **old value, new value** and approval."*

A per-field approval registry needs field identity, an old/new value pair, and a representation for
a pending change that has not landed yet. That is materially different from an action-level enum,
and retrofitting it later rewrites the uniform write path.

### 3. Duplicate **merge rules** (§30.9) — the merge half only

**Blocks:** duplicate-control and merge tables. The confidence *threshold* is value-blocking and
takes a placeholder; the merge model does not.

§6.4 is ambiguous twice over:

- *"**Block or require approval** for high-confidence duplicates"* — two different outcomes. The
  second needs a maker–checker request row and an approver.
- *"Support controlled merge while **preserving original audit references**"* — does not say which
  ID survives, nor whether the losing ID stays resolvable.

§6.1 insists the Spellzee ID *"never changes"*, so a merge cannot simply repoint.

### 4. Teacher versus student technical failure rules (§30.3)

**Blocks:** the ledger `entry_type` vocabulary and the compensation trigger.

§15.1 lists teacher-side and student-side technical issue as **distinct session outcomes**. §15.4
gives them asymmetric consequences: *"Teacher absence or verified teacher/Spellzee-side failure
should **generally** protect the student's entitlement and trigger compensation. Student-side
technical failure **may follow a separate policy**."*

Three ambiguities in one sentence: *generally* admits exceptions; *may follow a separate policy*
does not say whether that policy protects, consumes or something else; and **verified** implies a
verification step with an actor and an outcome that the baseline never defines.

### 5. Approval hierarchy — the role set (§30.7)

**Blocks:** the RBAC role tables. The *financial thresholds* half is Phase 4 and value-blocking —
split the item when asking.

§22.4 is labelled *"an illustrative starting point, not the final permission matrix"*, yet it is the
only enumeration of actors: Staff/Coordinator, Team Lead/Manager, Finance, Restricted Admin. Whether
those four are the real roles, and whether approval is single-level or hierarchical, is shape.

Note: §22.4's table is garbled in extraction (lines ~613–628) — the actor columns are legible, the
cells are not. Read it in the PDF.

### 6. Teacher / HR minimum for Phase 1 (§30.20)

**Blocks:** the teacher table's certification fields.

§29 scopes Phase 1 to *"teacher availability/capacity basics"* and puts certification in Phase 3.
But §11 requires an *"Eligibility rule preventing unapproved teachers from being allocated"*, and
allocation **is** Phase 1. Our own invariants registry already encodes this as
`allocation_requires_certified_teacher`, a trigger reading `teachers.certification_status`.

So a certification status field must exist in Phase 1 even though the certification *workflow* is
Phase 3. Open: the minimum teacher attributes Phase 1 needs.

---

## Not in §30 — found by inference, worth asking anyway

### A. Do group classes exist in Phase 1? — highest-value omission

§13.1 lists *"1-to-1 versus group capacity"* and §14.1 lists *"Session Type Change: 1-to-1/group"*,
so group sessions are unambiguously in the domain. §29 never scopes them in or out for Phase 1.

**Why it matters:** group sessions make `sessions`-to-students many-to-many, and make the ledger
consume **per student per session** rather than per session. That is the ledger's core grain.

### B. ~~Coordinator ownership — concurrent owners?~~ — **ANSWERED 2026-09-09**

§9 lists seven responsibility types — *"onboarding, student success, retention, operations,
academic, ticket or escalation"* — and closes with *"Exact rules remain configurable."* That left it
open whether those types can be held concurrently, which would have made
`one_active_owner_per_student` wrong.

**Answer: sequential, not concurrent.** One active owner per student at a time. The registered
invariant stands as written.

```sql
CREATE UNIQUE INDEX one_active_owner_per_student
  ON student_ownership (student_id)
  WHERE ended_at IS NULL;
```

The `WHERE ended_at IS NULL` is what makes history free: closed rows leave the index, so a student
accumulates unlimited ownership history while exactly one row stays current. A transfer closes the
old row and inserts the new one **in one transaction** — a botched transfer fails loudly instead of
silently producing two owners.

**History is required and permanent.** Per §9: owner, responsibility type, start and end dates,
transfer reason, who it came from, and whether the row is parent-facing. Rows are never deleted and
never edited; setting `ended_at` is the only update.

#### Ticket assignment transfers ownership — and it is permanent

Assigning a ticket to a staff member **makes them the student's owner**, and they stay the owner
after the ticket is resolved. Ownership does not revert.

```
Feb 1   Ravi    student_success   Feb 1 → Mar 15    (closed)
Mar 15  ticket assigned to Divya
        Divya   ticket            Mar 15 → NULL     (active — Ravi closed)
Mar 20  ticket resolved                              (Divya stays owner)
Jun 3   new ticket assigned to Kumar
        Divya   ticket            Mar 15 → Jun 3    (closed)
        Kumar   ticket            Jun 3  → NULL     (active)
```

The consequence, confirmed as intended: over time a student's owner becomes **whoever handled their
most recent ticket**. The original onboarding or retention coordinator does not come back
automatically. Ownership therefore answers *"who is responsible now"*, not *"who owns the
relationship"* — and the ownership history is where the relationship story lives.

Only **staff** take ticket assignments — never teachers. Admins may assign any staff member to any
student; that path is an **override** and records who, what, why, old value, new value per §22.5.

#### New invariant this creates

Confirmed: **one open ticket per student at a time.** That is a cross-row rule, so it is a database
constraint, not a service check:

```sql
CREATE UNIQUE INDEX one_open_ticket_per_student
  ON tickets (student_id)
  WHERE status NOT IN ('resolved', 'closed');
```

Same shape as the ownership index. Added to the registry in
`.claude/skills/backend/spellzee-invariants/references/patterns.md`.

**Still open:** the exact `status` values that count as closed. The constraint's predicate depends
on the ticket status vocabulary, which §20 does not fully enumerate — settle it with the ticket
table, not before.

### C. Break / resume entitlement semantics

§14.1 lists Break and Resume as allocation types; §13.2 says a break *"temporarily release[s]
teacher capacity"*; §21 lists validity/expiry as a subscription field. Nothing says whether a break
pauses the validity clock (likely value) or creates a ledger entry (shape).

### D. Session-length model

§16 speaks of *"12-, 20- or other session plan"* — counts, not durations. Nothing states whether
sessions have a fixed length, a per-course length, or a per-schedule length. Prerequisite for any
hours-based answer to blocker 1.

### E. Rolling-horizon length for session materialisation

A consequence of our fan-out-on-write choice, not a business requirement, so the baseline is silent.
Value-blocking (`scheduling.horizon_days`), but must exceed `compensation.validity_days`.

### F. Timezone / civil-time policy

India is implied throughout, never stated. `TIMESTAMPTZ` is correct regardless, but cutoff
arithmetic (*"N hours before start"*) and parent-facing display need a declared civil zone.

---

## Value-blocking — seed as flagged placeholder policy rows

Each becomes a `policy_versions` row whose `reason` says it is a placeholder awaiting a business
decision. **None of these values is a recommendation.** They exist so the schema can be exercised;
every one must be surfaced on this list rather than buried in a seed file.

| Policy key | §30 item | Placeholder | Source of the number |
|---|---|---|---|
| `sla.allocation_target_hours` | 1 | `24` | invented |
| `sla.ticket_resolution_hours` | 1 | `48` | §20.3's *"current discussed target… subject to final policy"* |
| `cancellation.cutoff_hours` | 2 | `24` | invented |
| `cancellation.late_consumes_credit` | 2 | `true` | invented |
| `reschedule.max_per_subscription` | 4 | `2` | invented |
| `reschedule.min_notice_hours` | §15.6 | `12` | invented |
| `compensation.validity_days` | 4 | `30` | invented |
| `completion.max_extension_days` | 5 | `30` | invented |
| `absence.escalation_threshold` | §15.6 | `3` | invented |
| `coordinator.intervention_threshold` | §15.6 | `2` | invented |
| `duplicate.match_confidence_threshold` | 9 | `0.85` | invented — threshold only, not merge rules |
| `capacity.target_utilization_range` | 11 | `{"min":0.70,"max":0.85}` | invented; §13.5 only says not 100% |
| `reminder.offsets_hours` | §15.2 | `[24, 1]` | invented |
| `retention.session_interval_trigger` | §20.4 | `3` | §20.4's own example |
| `parent.sees_projected_completion` | 6 | `false` | Phase 2 |

`incentive.bands` (§30.13) is **Phase 3 and finance-owned** — do not seed it in Phase 1.

---

## Already settled elsewhere

Several §30 entries are answered in the same document, suggesting §30 was not fully reconciled
against §23 when Draft 3 was assembled.

| Item | Settled by |
|---|---|
| 16 — FreeJump API capabilities | §23.3 is already conditional: *"Where API support permits"*. The adapter is designed for absence. Technical discovery, not a business decision. |
| 17 — WhatsApp provider | §23.4 defers it; CLAUDE.md's deferred table signed off 2026-09-09. Behind a channel adapter. |
| SLA engine *shape* | §20.3: an engine supporting start event, owner, target time, warning, escalation *"rather than hard-coding one duration"*. Only durations remain open. |
| Retention/deletion posture | §3.2 and §22.6. Only the legal-erasure edge of §30.18 stays open, and that is routed to legal. |
| Configurability approach | `tradeoff-library.md` decision 5 — versioned rows, not a rule engine, with its reversal trigger recorded. |
| Cloud, auth, storage, observability | CLAUDE.md's deferred table. Authorization is Phase 1; authentication sits behind an adapter. |

---

## Corrections to `spellzee-policy-versioning`

Two classification problems, both from that table lacking a shape-vs-value column and a phase column.

1. **`capacity.unit` should not be a policy key at all.** A policy row holds a value whose *shape*
   is fixed; this one determines the shape of other tables. Listing it beside
   `cancellation.cutoff_hours` implies it is equally placeholder-safe and invites stubbing it —
   precisely the error this audit exists to prevent.
2. **`sla.ticket_resolution_hours` is un-dimensioned, and §20.2 shows that is wrong.** §20.2
   enumerates six ticket categories and §20.1 lists both Category and Priority as ticket fields.
   §30 itself says *"ticket SLA definition**s**"*, plural. A single global key cannot express a
   per-category target — a shape question hiding inside an entry classified as pure value.
3. Minor: `incentive.bands` is Phase 3 and finance-owned; the table gives no phase, so it reads as
   equally urgent as Phase 1 items.
