/**
 * Invariants around historical contact detail.
 *
 * Baseline 6.4 — "Store historical contact details rather than creating
 * identities for every new contact detail."
 */
import { describe, expect, it } from 'vitest';
import { expectRejectionAt, makeContact, makePerson, makeStaff, withRollback } from './helpers.js';

describe('contact points', () => {
  it('keeps a superseded number as history instead of overwriting it', async () => {
    await withRollback(async (c) => {
      const staff = await makeStaff(c);
      const p = await makePerson(c, { createdBy: staff });
      await c.query(
        `INSERT INTO contact_points
           (id, person_id, contact_type, raw_value, is_primary, valid_from, valid_to, recorded_by)
         VALUES (gen_random_uuid(), $1, 'phone', '9876543210', true,
                 '2025-01-01T00:00:00Z', '2025-06-01T00:00:00Z', $2)`,
        [p.id, staff],
      );
      await makeContact(c, {
        personId: p.id,
        value: '9000000001',
        isPrimary: true,
        recordedBy: staff,
      });

      const { rows } = await c.query(
        'SELECT raw_value, valid_to FROM contact_points WHERE person_id = $1 ORDER BY valid_from',
        [p.id],
      );
      expect(rows).toHaveLength(2);
      expect(rows.filter((r) => r.valid_to === null)).toHaveLength(1);
    });
  });

  it('allows several alternate numbers alongside one primary', async () => {
    await withRollback(async (c) => {
      const staff = await makeStaff(c);
      const p = await makePerson(c, { createdBy: staff });
      await makeContact(c, {
        personId: p.id,
        value: '9876543210',
        isPrimary: true,
        recordedBy: staff,
      });
      await makeContact(c, { personId: p.id, value: '9000000002', recordedBy: staff });
      await makeContact(c, { personId: p.id, value: '9000000003', recordedBy: staff });
      await makeContact(c, {
        personId: p.id,
        type: 'email',
        value: 'parent@example.com',
        isPrimary: true,
        recordedBy: staff,
      });

      const { rows } = await c.query(
        'SELECT count(*)::int AS n FROM contact_points WHERE person_id = $1',
        [p.id],
      );
      expect(rows[0].n).toBe(4);
    });
  });

  it('rejects a second current primary phone — one_primary_contact_per_person_per_type', async () => {
    await withRollback(async (c) => {
      const staff = await makeStaff(c);
      const p = await makePerson(c, { createdBy: staff });
      await makeContact(c, {
        personId: p.id,
        value: '9876543210',
        isPrimary: true,
        recordedBy: staff,
      });
      await expectRejectionAt(c, 'one_primary_contact_per_person_per_type', (cl) =>
        makeContact(cl, {
          personId: p.id,
          value: '9000000004',
          isPrimary: true,
          recordedBy: staff,
        }),
      );
    });
  });

  it('rejects the same live number recorded twice against one person, however it is typed', async () => {
    await withRollback(async (c) => {
      const staff = await makeStaff(c);
      const p = await makePerson(c, { createdBy: staff });
      await makeContact(c, { personId: p.id, value: '+91 98765 43210', recordedBy: staff });
      await expectRejectionAt(c, 'no_duplicate_active_contact_value', (cl) =>
        makeContact(cl, { personId: p.id, value: '098765-43210', recordedBy: staff }),
      );
    });
  });

  it('normalizes the Indian country-code and trunk-zero forms to one key', async () => {
    await withRollback(async (c) => {
      const { rows } = await c.query(
        `SELECT normalize_phone('+91 98765 43210') a,
                normalize_phone('09876543210')    b,
                normalize_phone('9876543210')     d,
                normalize_phone('(+91) 98765-43210') e,
                normalize_email('  Parent@Example.COM ') f`,
      );
      expect(rows[0].a).toBe('9876543210');
      expect(rows[0].b).toBe('9876543210');
      expect(rows[0].d).toBe('9876543210');
      expect(rows[0].e).toBe('9876543210');
      expect(rows[0].f).toBe('parent@example.com');
    });
  });

  it('normalizes names without erasing non-Latin script', async () => {
    await withRollback(async (c) => {
      const { rows } = await c.query(
        `SELECT normalize_person_name('  Aarav   S.  Kumar ') a,
                normalize_person_name('ஆரவ் குமார்') b`,
      );
      expect(rows[0].a).toBe('aarav s kumar');
      expect(rows[0].b).not.toBe('');
    });
  });

  it('rejects a value that cannot be a phone number', async () => {
    await withRollback(async (c) => {
      const staff = await makeStaff(c);
      const p = await makePerson(c, { createdBy: staff });
      await expectRejectionAt(c, 'contact_points_value_normalizes', (cl) =>
        makeContact(cl, { personId: p.id, value: '12345', recordedBy: staff }),
      );
    });
  });

  it('rejects a value that cannot be an email address', async () => {
    await withRollback(async (c) => {
      const staff = await makeStaff(c);
      const p = await makePerson(c, { createdBy: staff });
      await expectRejectionAt(c, 'contact_points_value_normalizes', (cl) =>
        makeContact(cl, {
          personId: p.id,
          type: 'email',
          value: 'not-an-email',
          recordedBy: staff,
        }),
      );
    });
  });

  it('rejects a validity window that ends before it starts', async () => {
    await withRollback(async (c) => {
      const staff = await makeStaff(c);
      const p = await makePerson(c, { createdBy: staff });
      await expectRejectionAt(c, 'contact_points_period_valid', (cl) =>
        cl.query(
          `INSERT INTO contact_points (id, person_id, contact_type, raw_value, valid_from, valid_to, recorded_by)
           VALUES (gen_random_uuid(), $1, 'phone', '9876543210',
                   '2026-06-01T00:00:00Z', '2026-01-01T00:00:00Z', $2)`,
          [p.id, staff],
        ),
      );
    });
  });
});

describe('student_guardians', () => {
  it('rejects a second primary guardian for one student', async () => {
    await withRollback(async (c) => {
      const staff = await makeStaff(c);
      const s = await makePerson(c, { type: 'student', createdBy: staff, name: 'Diya Raman' });
      await c.query('INSERT INTO students (person_id) VALUES ($1)', [s.id]);
      const m = await makePerson(c, { type: 'parent', createdBy: staff, name: 'Latha Raman' });
      const f = await makePerson(c, { type: 'parent', createdBy: staff, name: 'Raman Iyer' });
      await c.query('INSERT INTO parents (person_id) VALUES ($1), ($2)', [m.id, f.id]);

      const link = (parentId: string, relationship: string, isPrimary: boolean) =>
        c.query(
          `INSERT INTO student_guardians
             (id, student_person_id, parent_person_id, relationship, is_primary, recorded_by)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
          [s.id, parentId, relationship, isPrimary, staff],
        );

      await link(m.id, 'mother', true);
      await link(f.id, 'father', false); // a second guardian is fine
      await expectRejectionAt(c, 'one_primary_guardian_per_student', () =>
        c.query(
          `UPDATE student_guardians SET is_primary = true
            WHERE student_person_id = $1 AND parent_person_id = $2`,
          [s.id, f.id],
        ),
      );
    });
  });

  it('rejects a duplicate active link for the same student/guardian pair', async () => {
    await withRollback(async (c) => {
      const staff = await makeStaff(c);
      const s = await makePerson(c, { type: 'student', createdBy: staff, name: 'Kavin Selvam' });
      await c.query('INSERT INTO students (person_id) VALUES ($1)', [s.id]);
      const m = await makePerson(c, { type: 'parent', createdBy: staff, name: 'Selvam Anand' });
      await c.query('INSERT INTO parents (person_id) VALUES ($1)', [m.id]);

      const link = () =>
        c.query(
          `INSERT INTO student_guardians
             (id, student_person_id, parent_person_id, relationship, recorded_by)
           VALUES (gen_random_uuid(), $1, $2, 'father', $3)`,
          [s.id, m.id, staff],
        );

      await link();
      await expectRejectionAt(c, 'one_active_link_per_student_guardian_pair', () => link());
    });
  });
});
