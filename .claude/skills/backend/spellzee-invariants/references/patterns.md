# Invariant patterns — concrete SQL

All examples are hand-written migration SQL, produced via
`prisma migrate dev --create-only` and then edited.

---

## 1. No overlapping bookings for a teacher (exclusion constraint)

The canonical case. A `UNIQUE` constraint cannot express "these time ranges
must not overlap" — only `EXCLUDE` can.

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE sessions
  ADD CONSTRAINT teacher_no_overlap
  EXCLUDE USING gist (
    teacher_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  )
  WHERE (status <> 'cancelled');
```

Notes:

- `btree_gist` is required to mix `=` (on a scalar) with `&&` (on a range).
- `'[)'` — half-open. A session ending at 16:00 and one starting at 16:00 do
  not overlap. Getting this wrong makes back-to-back classes impossible.
- The `WHERE` clause matters: a cancelled session must not block the slot.
- The same shape applies to a student (a student cannot be in two classes at
  once) and to teacher leave vs. sessions.

---

## 2. One active row per parent (partial unique index)

Ownership, active enrollment, current schedule — anything with history where
exactly one row is current.

```sql
CREATE UNIQUE INDEX one_active_owner_per_student
  ON student_ownership (student_id)
  WHERE ended_at IS NULL;
```

This preserves full history (many rows per student) while guaranteeing one
current row. Prisma's `@@unique` cannot express the `WHERE`.

A transfer is then: close the old row (`ended_at = now()`) and insert the new
one **in one transaction**. The index makes a botched transfer fail loudly
instead of silently producing two owners.

Confirmed 2026-09-09: ownership is **sequential, not concurrent** — the seven
responsibility types in §9 are held one at a time, so this index is scoped by
student alone, not by `(student_id, responsibility_type)`. See
`docs/open-decisions.md` §B.

The same shape covers "one open ticket per student", where the predicate is a
status set rather than a null check:

```sql
CREATE UNIQUE INDEX one_open_ticket_per_student
  ON tickets (student_id)
  WHERE status NOT IN ('resolved', 'closed');
```

Note the coupling: this predicate hard-codes which statuses count as closed, so
**changing the ticket status vocabulary means changing this index**. Keep the
status list short and settled before writing it.

---

## 3. Value constraints (check)

```sql
ALTER TABLE subscriptions
  ADD CONSTRAINT sessions_purchased_positive
  CHECK (sessions_purchased > 0);

ALTER TABLE session_ledger
  ADD CONSTRAINT ledger_delta_nonzero
  CHECK (delta <> 0);
```

Cheap, always worth adding. A `CHECK` that has never fired still documents
the domain.

---

## 4. Cross-table rule (trigger)

Use when the rule cannot be expressed against a single table — e.g. an
unapproved teacher must never be allocated.

```sql
CREATE OR REPLACE FUNCTION assert_teacher_certified()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM teachers
    WHERE id = NEW.teacher_id
      AND certification_status = 'approved'
  ) THEN
    RAISE EXCEPTION 'teacher_not_certified: teacher % is not approved for allocation',
      NEW.teacher_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER allocation_requires_certified_teacher
  BEFORE INSERT OR UPDATE OF teacher_id ON class_schedules
  FOR EACH ROW EXECUTE FUNCTION assert_teacher_certified();
```

Notes:

- Put a stable token (`teacher_not_certified`) in the message so tests and
  error mapping can match on it.
- `BEFORE` so the write never lands. `AFTER` triggers that raise still roll
  back, but do useless work first.
- Triggers are invisible in `schema.prisma`. Record every one in
  `project-conventions` so they survive a schema reset.

---

## 5. Entitlement balance (trigger asserting a derived total)

There is no `sessions_remaining` column — see `spellzee-entitlement-ledger`.
What is constrained is that the ledger never overdraws:

```sql
CREATE OR REPLACE FUNCTION assert_entitlement_not_overdrawn()
RETURNS TRIGGER AS $$
DECLARE
  consumed INT;
  purchased INT;
BEGIN
  SELECT COALESCE(SUM(delta), 0) INTO consumed
    FROM session_ledger WHERE subscription_id = NEW.subscription_id;

  SELECT sessions_purchased INTO purchased
    FROM subscriptions WHERE id = NEW.subscription_id;

  IF consumed > purchased THEN
    RAISE EXCEPTION 'entitlement_overdrawn: subscription % would consume %/%',
      NEW.subscription_id, consumed, purchased
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ledger_cannot_overdraw
  AFTER INSERT ON session_ledger
  FOR EACH ROW EXECUTE FUNCTION assert_entitlement_not_overdrawn();
```

`AFTER` here, deliberately: the new row must be visible to the `SUM`.

Concurrency: two simultaneous inserts can each see a pre-insert total. Take
a `SELECT ... FOR UPDATE` lock on the `subscriptions` row inside the writing
transaction, or use `SERIALIZABLE` for ledger writes. **Test this with two
concurrent transactions** — a trigger alone does not make it safe.

---

## 6. Naming and testability

Always name constraints explicitly:

```sql
ALTER TABLE x ADD CONSTRAINT some_readable_name CHECK (...);
```

An auto-generated name (`x_check1`) is unreadable in a production log, can
change between environments, and cannot be asserted on in a test.

---

## 7. Blocking a duplicate when there is no parent row to lock

The entitlement overdraw case locks the subscription row. Duplicate control
cannot: the row it must not race against **does not exist yet**. Two
transactions each creating "Aarav Kumar / 9876543210" have nothing in common
to `SELECT ... FOR UPDATE`.

A transaction-scoped advisory lock keyed on the match bucket is the answer —
it serializes exactly the contended set and nothing else:

```sql
PERFORM pg_advisory_xact_lock(
  hashtext('spellzee.person_match:' || p_person_type || '|' || p_normalized_name));
```

Then the lookup, then the `RAISE`. Held to end of transaction, released by
commit or rollback with no cleanup path to forget.

**Test it with two connections.** `prisma/tests/concurrency.spec.ts` asserts
that the second transaction *blocks* while the first is open, and *then*
fails — a test that only checks the eventual error would pass even with the
lock removed.

---

## 8. Deriving rather than storing, without a stored column

Where a value is derived (a normalized phone number, a normalized name), do
not add a column that can drift. Put the derivation in an **IMMUTABLE
function** and build an **expression index** on it:

```sql
CREATE UNIQUE INDEX no_duplicate_active_contact_value
  ON contact_points (person_id, contact_type,
                     normalize_contact_value(contact_type, raw_value))
  WHERE valid_to IS NULL;
```

Two further reasons this beats a generated column here: Prisma cannot express
a generated column at all, so one would show up as drift on every future
`migrate diff`; and there is nothing to backfill or keep in sync.

Two rules that come with it:

- **Schema-qualify every call inside a function body and an index expression**
  (`public.normalize_phone(...)`). `CREATE INDEX` runs with a restricted
  `search_path`, and an unqualified call fails at migration time with
  `function normalize_phone(text) does not exist` — verified, not assumed.
- **Changing the body of an IMMUTABLE function silently corrupts every index
  built on it.** Such a change must `REINDEX` the dependents in the same
  migration.

---

## Registry

Keep this list current as invariants are added.

| Constraint | Table | Mechanism | Rule |
|---|---|---|---|
| `teacher_no_overlap` | `sessions` | EXCLUDE gist | A teacher is never double-booked |
| `one_active_owner_per_student` | `student_ownership` | partial unique | Exactly one current owner (sequential, not per-type — confirmed) |
| `one_open_ticket_per_student` | `tickets` | partial unique | At most one open ticket per student |
| `ledger_cannot_overdraw` | `session_ledger` | trigger | Entitlement never goes negative |
| `allocation_requires_certified_teacher` | `class_schedules` | trigger | Uncertified teachers cannot be allocated |

### Built — slice 1, identity & duplicate control (2026-09-09)

Migration `20260909073749_identity_master_data_and_duplicate_control`.
Tests: `prisma/tests/*.spec.ts` (58 assertions, all against `spellzee_test`).

| Constraint | Table | Mechanism | Rule |
|---|---|---|---|
| `persons_spellzee_id_key` | `persons` | unique | A Spellzee ID is never reused |
| `persons_spellzee_id_format` | `persons` | check | It is `STU-YYYY-NNNNNN` / `PAR-YYYY-NNNNNN` |
| `persons_spellzee_id_prefix_matches_type` | `persons` | check | The prefix agrees with the person type |
| `persons_assign_spellzee_id` | `persons` | trigger (BEFORE INSERT) | The database assigns the ID; application code may not supply one |
| `persons_identity_immutable` | `persons` | trigger (BEFORE UPDATE) | ID, type, key and created_at never change; a merge is never reversed by an edit |
| `persons_merge_fields_all_or_none` | `persons` | check | A merge sets all five tombstone fields or none |
| `persons_merge_not_self` | `persons` | check | An identity is not merged into itself (backstop; the trigger raises `merge_not_self` first) |
| `persons_merge_valid` | `persons` | trigger (BEFORE INSERT/UPDATE) | The older ID survives; types match; the survivor is live; an approved `person_merge` request names exactly this pair. Locks the survivor `FOR UPDATE` |
| `persons_merge_redirects_live` | `persons` | **deferred** constraint trigger | A redirect always points at a live identity — resolving a retired ID is always one hop |
| `students_person_type_fixed` / `parents_person_type_fixed` + composite FK | `students`, `parents` | check + FK | A student row can only point at a student identity |
| `one_primary_guardian_per_student` | `student_guardians` | partial unique | At most one current primary guardian |
| `one_active_link_per_student_guardian_pair` | `student_guardians` | partial unique | No duplicate live guardian link |
| `student_guardians_persons_live` | `student_guardians` | trigger | No new link against a retired identity |
| `one_primary_contact_per_person_per_type` | `contact_points` | partial unique | At most one current primary phone and one current primary email |
| `no_duplicate_active_contact_value` | `contact_points` | partial unique on an expression | The same live number is not recorded twice, however it is typed |
| `contact_points_value_normalizes` | `contact_points` | check | A phone normalizes to 8–15 digits; an email looks like one |
| `contact_points_period_valid` | `contact_points` | check | A validity window does not end before it starts |
| `contact_points_person_live` | `contact_points` | trigger | No new contact detail against a retired identity |
| `contact_points_block_duplicate` | `contact_points` | trigger + **advisory lock** | Same type + same normalized name + same live contact value ⇒ blocked outright |
| `persons_rename_not_duplicate` | `persons` | trigger | A rename cannot create that duplicate either |
| `audit_log_append_only` | `audit_log` | trigger (STATEMENT) | No UPDATE, no DELETE — not even a zero-row one |
| `approval_requests_append_only` | `approval_requests` | trigger (STATEMENT) | Same |
| `approval_decisions_append_only` | `approval_decisions` | trigger (STATEMENT) | Same |
| `approval_decisions_approval_request_id_key` | `approval_decisions` | unique | Approval is single-level: one decision per request is final |
| `approval_decisions_maker_checker` | `approval_decisions` | trigger | The requester never approves their own request |
| `person_merge_request_needs_target` | `approval_requests` | check | A merge request names a survivor |
| `policy_no_overlap` | `policy_versions` | EXCLUDE gist | Exactly one version of a policy in force at any instant |
| `policy_versions_supersede_only` | `policy_versions` | trigger | The only permitted UPDATE is closing an open version; DELETE never |
| `staff_users_role_known` | `staff_users` | check | One of the four roles settled 2026-09-09 |

*(This table is the audit surface for whether the strategy is still intact.)*
