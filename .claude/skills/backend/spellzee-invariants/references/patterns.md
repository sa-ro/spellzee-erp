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

## Registry

Keep this list current as invariants are added.

| Constraint | Table | Mechanism | Rule |
|---|---|---|---|
| `teacher_no_overlap` | `sessions` | EXCLUDE gist | A teacher is never double-booked |
| `one_active_owner_per_student` | `student_ownership` | partial unique | Exactly one current owner (sequential, not per-type — confirmed) |
| `one_open_ticket_per_student` | `tickets` | partial unique | At most one open ticket per student |
| `ledger_cannot_overdraw` | `session_ledger` | trigger | Entitlement never goes negative |
| `allocation_requires_certified_teacher` | `class_schedules` | trigger | Uncertified teachers cannot be allocated |

*(Populate as built — this table is the audit surface for whether the
strategy is still intact.)*
