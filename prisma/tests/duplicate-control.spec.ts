/**
 * Invariant: a high-confidence duplicate is blocked outright at creation time.
 *
 * Decided 2026-09-09 (docs/open-decisions.md #3) — no pending state, no
 * approval request, no record created.
 *
 * The database enforces the case that is a duplicate at ANY threshold: two live
 * persons of the SAME TYPE with the SAME normalized name sharing the SAME
 * normalized live phone or email. Scored, fuzzy confidence stays in the service
 * and reads `duplicate.match_confidence_threshold`.
 */
import { describe, expect, it } from 'vitest';
import { expectRejectionAt, makeContact, makePerson, makeStaff, withRollback } from './helpers.js';

describe('duplicate control — the database backstop', () => {
  it('blocks a second student with the same name and the same phone', async () => {
    await withRollback(async (c) => {
      const staff = await makeStaff(c);
      const first = await makePerson(c, { createdBy: staff, name: 'Aarav Kumar' });
      await makeContact(c, {
        personId: first.id,
        value: '9876543210',
        isPrimary: true,
        recordedBy: staff,
      });

      const second = await makePerson(c, { createdBy: staff, name: 'aarav  kumar' });
      const err = await expectRejectionAt(c, 'duplicate_person_blocked', (cl) =>
        makeContact(cl, { personId: second.id, value: '+91 98765 43210', recordedBy: staff }),
      );
      // The error names the surviving identity, so the UI can offer a merge.
      expect(err.message).toContain(first.spellzee_id);
    });
  });

  it('blocks on a matching email as well as a matching phone', async () => {
    await withRollback(async (c) => {
      const staff = await makeStaff(c);
      const first = await makePerson(c, { createdBy: staff, name: 'Diya Raman' });
      await makeContact(c, {
        personId: first.id,
        type: 'email',
        value: 'Diya.Raman@example.com',
        recordedBy: staff,
      });

      const second = await makePerson(c, { createdBy: staff, name: 'DIYA RAMAN' });
      await expectRejectionAt(c, 'duplicate_person_blocked', (cl) =>
        makeContact(cl, {
          personId: second.id,
          type: 'email',
          value: 'diya.raman@example.com',
          recordedBy: staff,
        }),
      );
    });
  });

  it('leaves no record behind — the whole creation rolls back', async () => {
    await withRollback(async (c) => {
      const staff = await makeStaff(c);
      const first = await makePerson(c, { createdBy: staff, name: 'Kavin Selvam' });
      await makeContact(c, { personId: first.id, value: '9812345678', recordedBy: staff });

      // How a command actually creates a student: person + contact in ONE
      // transaction. The savepoint stands in for that transaction.
      await c.query('SAVEPOINT create_student');
      let blocked = false;
      try {
        const dup = await makePerson(c, { createdBy: staff, name: 'Kavin Selvam' });
        await makeContact(c, { personId: dup.id, value: '9812345678', recordedBy: staff });
      } catch {
        blocked = true;
        await c.query('ROLLBACK TO SAVEPOINT create_student');
      }
      expect(blocked).toBe(true);

      const { rows } = await c.query(
        `SELECT count(*)::int AS n FROM persons WHERE full_name = 'Kavin Selvam'`,
      );
      expect(rows[0].n).toBe(1);
    });
  });

  // --- what it must NOT block ----------------------------------------------

  it('allows two siblings on the same parent phone — different names', async () => {
    await withRollback(async (c) => {
      const staff = await makeStaff(c);
      const a = await makePerson(c, { createdBy: staff, name: 'Aarav Kumar' });
      const b = await makePerson(c, { createdBy: staff, name: 'Anika Kumar' });
      await makeContact(c, { personId: a.id, value: '9876543210', recordedBy: staff });
      await makeContact(c, { personId: b.id, value: '9876543210', recordedBy: staff });

      const { rows } = await c.query(
        `SELECT count(*)::int AS n FROM contact_points
          WHERE normalize_contact_value(contact_type, raw_value) = '9876543210'`,
      );
      expect(rows[0].n).toBe(2);
    });
  });

  it('allows a parent and a child sharing a phone and a name — different person types', async () => {
    await withRollback(async (c) => {
      const staff = await makeStaff(c);
      const child = await makePerson(c, { type: 'student', createdBy: staff, name: 'Ravi Menon' });
      const father = await makePerson(c, { type: 'parent', createdBy: staff, name: 'Ravi Menon' });
      await makeContact(c, { personId: child.id, value: '9876500001', recordedBy: staff });
      await makeContact(c, { personId: father.id, value: '9876500001', recordedBy: staff });
      expect(child.spellzee_id).not.toBe(father.spellzee_id);
    });
  });

  it('blocks a rename that would create the duplicate', async () => {
    await withRollback(async (c) => {
      const staff = await makeStaff(c);
      const a = await makePerson(c, { createdBy: staff, name: 'Aarav Kumar' });
      const b = await makePerson(c, { createdBy: staff, name: 'Arav Kumaar' });
      await makeContact(c, { personId: a.id, value: '9876500003', recordedBy: staff });
      await makeContact(c, { personId: b.id, value: '9876500003', recordedBy: staff });

      await expectRejectionAt(c, 'duplicate_person_blocked', (cl) =>
        cl.query(`UPDATE persons SET full_name = 'Aarav Kumar' WHERE id = $1`, [b.id]),
      );
    });
  });

  it('does not block on a number that is no longer current', async () => {
    await withRollback(async (c) => {
      const staff = await makeStaff(c);
      const a = await makePerson(c, { createdBy: staff, name: 'Nila Suresh' });
      await c.query(
        `INSERT INTO contact_points
           (id, person_id, contact_type, raw_value, valid_from, valid_to, recorded_by)
         VALUES (gen_random_uuid(), $1, 'phone', '9876500004',
                 '2025-01-01T00:00:00Z', '2025-06-01T00:00:00Z', $2)`,
        [a.id, staff],
      );
      const b = await makePerson(c, { createdBy: staff, name: 'Nila Suresh' });
      await makeContact(c, { personId: b.id, value: '9876500004', recordedBy: staff });
      expect(b.spellzee_id).not.toBe(a.spellzee_id);
    });
  });
});

describe('duplicate search — what the service scorer indexes against', () => {
  it('finds probable matches by trigram similarity on the normalized name', async () => {
    await withRollback(async (c) => {
      const staff = await makeStaff(c);
      await makePerson(c, { createdBy: staff, name: 'Aarav Kumar' });
      const { rows } = await c.query(
        `SELECT spellzee_id,
                similarity(normalize_person_name(full_name), normalize_person_name($1)) AS score
           FROM persons
          WHERE retired_at IS NULL
            AND normalize_person_name(full_name) % normalize_person_name($1)
          ORDER BY score DESC`,
        ['Arav Kumaar'],
      );
      expect(rows.length).toBeGreaterThan(0);
      expect(Number(rows[0].score)).toBeGreaterThan(0.3);
    });
  });
});
