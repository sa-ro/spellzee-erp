# `identity` — Identity & Master Data

**Phase 1.** Baseline §6.

Parents, students, employees, teachers, courses, subjects. The permanent identifiers everything
else hangs off.

## Owns

- **Permanent Spellzee IDs** — `STU-2026-000184`. The ID **never changes**: not for a new phone,
  email, spelling variant, course, teacher, schedule, break or return.
- Parent/guardian ↔ student relationships, and historical contact details.
- **Duplicate control** — search before create, fuzzy match across names, phones, alternate
  numbers and emails, surface probable matches, block or require approval on high confidence.
- **Merge**, preserving the original audit references. §6.1 says the ID never changes, so a merge
  cannot simply repoint.

## Does not own

- Enrollment, subscription, payment — those are `operations` and `finance`. Identity is *who a
  person is*, not what they bought or what was scheduled.
- Ownership of a student by a coordinator — that is `operations`.

## Invariants

- One permanent ID per person; never reused, never renumbered.
- A merge preserves audit references to the losing ID.

## Blocked

**Duplicate merge rules** are shape-blocking (`docs/open-decisions.md` §30.9). §6.4 says "block
**or** require approval" — two different outcomes needing different tables — and never says which
ID survives. The confidence *threshold* is a placeholder policy row; the merge model is not.
