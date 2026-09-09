/**
 * Invariant: a Spellzee ID is assigned by the database and never changes.
 *
 * Baseline 6.1 — "A student receives a permanent Spellzee Student ID, for
 * example STU-2026-000184. The ID never changes."
 */
import { describe, expect, it } from 'vitest';
import { expectRejectionAt, makePerson, makeStaff, withRollback } from './helpers.js';

describe('permanent Spellzee identity', () => {
  it('assigns STU-YYYY-NNNNNN to a student and PAR-YYYY-NNNNNN to a parent', async () => {
    await withRollback(async (c) => {
      const staff = await makeStaff(c);
      const student = await makePerson(c, { type: 'student', createdBy: staff });
      const parent = await makePerson(c, { type: 'parent', createdBy: staff });

      expect(student.spellzee_id).toMatch(/^STU-\d{4}-\d{6}$/);
      expect(parent.spellzee_id).toMatch(/^PAR-\d{4}-\d{6}$/);
    });
  });

  it('numbers gaplessly and in order within a prefix', async () => {
    await withRollback(async (c) => {
      const staff = await makeStaff(c);
      const a = await makePerson(c, { createdBy: staff, name: 'First Child' });
      const b = await makePerson(c, { createdBy: staff, name: 'Second Child' });

      const seqOf = (id: string) => Number(id.slice(-6));
      expect(seqOf(b.spellzee_id)).toBe(seqOf(a.spellzee_id) + 1);
      // Lexicographic order is creation order — the merge rule depends on it.
      expect(a.spellzee_id < b.spellzee_id).toBe(true);
    });
  });

  it('refuses an ID supplied by application code', async () => {
    await withRollback(async (c) => {
      const staff = await makeStaff(c);
      await expectRejectionAt(c, 'spellzee_id_not_assignable', (cl) =>
        cl.query(
          `INSERT INTO persons (id, spellzee_id, person_type, full_name, created_by)
           VALUES (gen_random_uuid(), 'STU-2026-000184', 'student', 'Forged Identity', $1)`,
          [staff],
        ),
      );
    });
  });

  it('refuses to change an assigned Spellzee ID', async () => {
    await withRollback(async (c) => {
      const staff = await makeStaff(c);
      const p = await makePerson(c, { createdBy: staff });
      await expectRejectionAt(c, 'person_identity_immutable', (cl) =>
        cl.query(`UPDATE persons SET spellzee_id = 'STU-2026-999999' WHERE id = $1`, [p.id]),
      );
    });
  });

  it('refuses to turn a student into a parent', async () => {
    await withRollback(async (c) => {
      const staff = await makeStaff(c);
      const p = await makePerson(c, { type: 'student', createdBy: staff });
      await expectRejectionAt(c, 'person_identity_immutable', (cl) =>
        cl.query(`UPDATE persons SET person_type = 'parent' WHERE id = $1`, [p.id]),
      );
    });
  });

  it('permits the things that legitimately change — a new phone, a new spelling', async () => {
    await withRollback(async (c) => {
      const staff = await makeStaff(c);
      const p = await makePerson(c, { createdBy: staff, name: 'Aarav Kumar' });
      await c.query(`UPDATE persons SET full_name = 'Aarav Kumaar' WHERE id = $1`, [p.id]);
      const { rows } = await c.query('SELECT spellzee_id FROM persons WHERE id = $1', [p.id]);
      expect(rows[0].spellzee_id).toBe(p.spellzee_id);
    });
  });

  it('rejects an unknown person type', async () => {
    await withRollback(async (c) => {
      const staff = await makeStaff(c);
      await expectRejectionAt(c, 'unknown_person_type', (cl) =>
        cl.query(
          `INSERT INTO persons (id, person_type, full_name, created_by)
           VALUES (gen_random_uuid(), 'teacher', 'Not A Person Type', $1)`,
          [staff],
        ),
      );
    });
  });

  it('rejects a blank name', async () => {
    await withRollback(async (c) => {
      const staff = await makeStaff(c);
      await expectRejectionAt(c, 'persons_full_name_present', (cl) =>
        cl.query(
          `INSERT INTO persons (id, person_type, full_name, created_by)
           VALUES (gen_random_uuid(), 'student', '   ', $1)`,
          [staff],
        ),
      );
    });
  });

  it('will not let a student row point at a parent identity', async () => {
    await withRollback(async (c) => {
      const staff = await makeStaff(c);
      const parent = await makePerson(c, { type: 'parent', createdBy: staff });
      await expectRejectionAt(c, 'students_person_id_person_type_fkey', (cl) =>
        cl.query('INSERT INTO students (person_id) VALUES ($1)', [parent.id]),
      );
    });
  });
});
