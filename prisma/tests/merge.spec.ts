/**
 * Invariants of the controlled merge.
 *
 * Decided 2026-09-09 (docs/open-decisions.md #3):
 *   - merging two EXISTING identities requires maker–checker approval;
 *   - the OLDER Spellzee ID always survives — created-first wins;
 *   - the retired ID stays resolvable, redirecting to the survivor, so
 *     historical references never break.
 */
import { describe, expect, it } from 'vitest';
import {
  approvedMergeRequest,
  expectRejectionAt,
  makeContact,
  makePerson,
  makeStaff,
  mergeSql,
  withRollback,
} from './helpers.js';

describe('person merge', () => {
  it('retires the newer identity into the older one, and the redirect resolves', async () => {
    await withRollback(async (c) => {
      const maker = await makeStaff(c);
      const checker = await makeStaff(c, 'team_lead_manager');
      const older = await makePerson(c, { createdBy: maker, name: 'Aarav Kumar' });
      const newer = await makePerson(c, { createdBy: maker, name: 'Aarav Kumar' });

      const request = await approvedMergeRequest(c, {
        retiredId: newer.id,
        survivorId: older.id,
        requestedBy: maker,
        approvedBy: checker,
      });
      await c.query(mergeSql(), [newer.id, older.id, maker, request]);
      await c.query('SET CONSTRAINTS ALL IMMEDIATE');

      // The retired ID still exists and still resolves — one hop, always.
      const { rows } = await c.query(
        `SELECT r.spellzee_id AS retired, s.spellzee_id AS survivor
           FROM persons r JOIN persons s ON s.id = r.merged_into_person_id
          WHERE r.id = $1`,
        [newer.id],
      );
      expect(rows[0].retired).toBe(newer.spellzee_id);
      expect(rows[0].survivor).toBe(older.spellzee_id);
    });
  });

  it('refuses a merge with no approval request at all', async () => {
    await withRollback(async (c) => {
      const staff = await makeStaff(c);
      const older = await makePerson(c, { createdBy: staff });
      const newer = await makePerson(c, { createdBy: staff });
      await expectRejectionAt(c, 'merge_requires_approved_request', (cl) =>
        cl.query(
          'UPDATE persons SET retired_at = now(), merged_into_person_id = $2 WHERE id = $1',
          [newer.id, older.id],
        ),
      );
    });
  });

  it('refuses a half-filled merge — retiring an identity with no survivor', async () => {
    await withRollback(async (c) => {
      const staff = await makeStaff(c);
      const p = await makePerson(c, { createdBy: staff });
      await expectRejectionAt(c, 'persons_merge_fields_all_or_none', (cl) =>
        cl.query('UPDATE persons SET retired_at = now() WHERE id = $1', [p.id]),
      );
    });
  });

  it('refuses a merge whose request has not been decided', async () => {
    await withRollback(async (c) => {
      const maker = await makeStaff(c);
      const older = await makePerson(c, { createdBy: maker });
      const newer = await makePerson(c, { createdBy: maker });
      const { rows } = await c.query(
        `INSERT INTO approval_requests
           (id, action_type, subject_type, subject_id, target_id, reason, requested_by)
         VALUES (gen_random_uuid(), 'person_merge', 'person', $1, $2, 'looks like a duplicate', $3)
         RETURNING id`,
        [newer.id, older.id, maker],
      );
      await expectRejectionAt(c, 'merge_requires_approved_request', (cl) =>
        cl.query(mergeSql(), [newer.id, older.id, maker, rows[0].id]),
      );
    });
  });

  it('refuses a merge whose request was rejected', async () => {
    await withRollback(async (c) => {
      const maker = await makeStaff(c);
      const checker = await makeStaff(c, 'team_lead_manager');
      const older = await makePerson(c, { createdBy: maker });
      const newer = await makePerson(c, { createdBy: maker });
      const { rows } = await c.query(
        `INSERT INTO approval_requests
           (id, action_type, subject_type, subject_id, target_id, reason, requested_by)
         VALUES (gen_random_uuid(), 'person_merge', 'person', $1, $2, 'looks like a duplicate', $3)
         RETURNING id`,
        [newer.id, older.id, maker],
      );
      await c.query(
        `INSERT INTO approval_decisions (id, approval_request_id, decision, decided_by, reason)
         VALUES (gen_random_uuid(), $1, 'rejected', $2, 'different children, same household')`,
        [rows[0].id, checker],
      );
      await expectRejectionAt(c, 'merge_requires_approved_request', (cl) =>
        cl.query(mergeSql(), [newer.id, older.id, maker, rows[0].id]),
      );
    });
  });

  it('refuses an approval that names a different pair', async () => {
    await withRollback(async (c) => {
      const maker = await makeStaff(c);
      const checker = await makeStaff(c, 'team_lead_manager');
      const a = await makePerson(c, { createdBy: maker });
      const b = await makePerson(c, { createdBy: maker });
      const c3 = await makePerson(c, { createdBy: maker });
      const request = await approvedMergeRequest(c, {
        retiredId: c3.id,
        survivorId: a.id,
        requestedBy: maker,
        approvedBy: checker,
      });
      await expectRejectionAt(c, 'merge_approval_subject_mismatch', (cl) =>
        cl.query(mergeSql(), [b.id, a.id, maker, request]),
      );
    });
  });

  it('refuses to retire the OLDER identity — created-first always survives', async () => {
    await withRollback(async (c) => {
      const maker = await makeStaff(c);
      const checker = await makeStaff(c, 'team_lead_manager');
      const older = await makePerson(c, { createdBy: maker });
      const newer = await makePerson(c, { createdBy: maker });
      const request = await approvedMergeRequest(c, {
        retiredId: older.id,
        survivorId: newer.id,
        requestedBy: maker,
        approvedBy: checker,
      });
      const err = await expectRejectionAt(c, 'merge_older_id_must_survive', (cl) =>
        cl.query(mergeSql(), [older.id, newer.id, maker, request]),
      );
      expect(err.message).toContain(older.spellzee_id);
    });
  });

  it('refuses to merge a student into a parent', async () => {
    await withRollback(async (c) => {
      const maker = await makeStaff(c);
      const checker = await makeStaff(c, 'team_lead_manager');
      const parent = await makePerson(c, { type: 'parent', createdBy: maker });
      const student = await makePerson(c, { type: 'student', createdBy: maker });
      const request = await approvedMergeRequest(c, {
        retiredId: student.id,
        survivorId: parent.id,
        requestedBy: maker,
        approvedBy: checker,
      });
      await expectRejectionAt(c, 'merge_type_mismatch', (cl) =>
        cl.query(mergeSql(), [student.id, parent.id, maker, request]),
      );
    });
  });

  it('refuses a merge into an identity that is itself retired', async () => {
    await withRollback(async (c) => {
      const maker = await makeStaff(c);
      const checker = await makeStaff(c, 'team_lead_manager');
      const a = await makePerson(c, { createdBy: maker });
      const b = await makePerson(c, { createdBy: maker });
      const d = await makePerson(c, { createdBy: maker });

      const r1 = await approvedMergeRequest(c, {
        retiredId: b.id,
        survivorId: a.id,
        requestedBy: maker,
        approvedBy: checker,
      });
      await c.query(mergeSql(), [b.id, a.id, maker, r1]);

      const r2 = await approvedMergeRequest(c, {
        retiredId: d.id,
        survivorId: b.id,
        requestedBy: maker,
        approvedBy: checker,
      });
      await expectRejectionAt(c, 'merge_target_not_live', (cl) =>
        cl.query(mergeSql(), [d.id, b.id, maker, r2]),
      );
    });
  });

  it('refuses to leave a stale redirect when a survivor is itself merged away', async () => {
    await withRollback(async (c) => {
      const maker = await makeStaff(c);
      const checker = await makeStaff(c, 'team_lead_manager');
      const oldest = await makePerson(c, { createdBy: maker });
      const middle = await makePerson(c, { createdBy: maker });
      const newest = await makePerson(c, { createdBy: maker });

      // newest -> middle
      const r1 = await approvedMergeRequest(c, {
        retiredId: newest.id,
        survivorId: middle.id,
        requestedBy: maker,
        approvedBy: checker,
      });
      await c.query(mergeSql(), [newest.id, middle.id, maker, r1]);
      await c.query('SET CONSTRAINTS ALL IMMEDIATE');

      // middle -> oldest, without repointing newest. Deferred, so it must fail
      // when the constraints are made immediate (i.e. at commit).
      await c.query('SET CONSTRAINTS ALL DEFERRED');
      const r2 = await approvedMergeRequest(c, {
        retiredId: middle.id,
        survivorId: oldest.id,
        requestedBy: maker,
        approvedBy: checker,
      });
      await c.query(mergeSql(), [middle.id, oldest.id, maker, r2]);
      await expectRejectionAt(c, 'merge_redirect_chain', (cl) =>
        cl.query('SET CONSTRAINTS ALL IMMEDIATE'),
      );
    });
  });

  it('accepts the same case when the inbound redirect is repointed in the same transaction', async () => {
    await withRollback(async (c) => {
      const maker = await makeStaff(c);
      const checker = await makeStaff(c, 'team_lead_manager');
      const oldest = await makePerson(c, { createdBy: maker });
      const middle = await makePerson(c, { createdBy: maker });
      const newest = await makePerson(c, { createdBy: maker });

      const r1 = await approvedMergeRequest(c, {
        retiredId: newest.id,
        survivorId: middle.id,
        requestedBy: maker,
        approvedBy: checker,
      });
      await c.query(mergeSql(), [newest.id, middle.id, maker, r1]);
      await c.query('SET CONSTRAINTS ALL IMMEDIATE');
      await c.query('SET CONSTRAINTS ALL DEFERRED');

      const r2 = await approvedMergeRequest(c, {
        retiredId: middle.id,
        survivorId: oldest.id,
        requestedBy: maker,
        approvedBy: checker,
      });
      await c.query(mergeSql(), [middle.id, oldest.id, maker, r2]);
      await c.query(
        'UPDATE persons SET merged_into_person_id = $2 WHERE merged_into_person_id = $1',
        [middle.id, oldest.id],
      );
      await c.query('SET CONSTRAINTS ALL IMMEDIATE');

      const { rows } = await c.query('SELECT merged_into_person_id FROM persons WHERE id = $1', [
        newest.id,
      ]);
      expect(rows[0].merged_into_person_id).toBe(oldest.id);
    });
  });

  it('refuses a repoint that does not follow the chain — that is a merge and needs approval', async () => {
    await withRollback(async (c) => {
      const maker = await makeStaff(c);
      const checker = await makeStaff(c, 'team_lead_manager');
      const oldest = await makePerson(c, { createdBy: maker });
      const middle = await makePerson(c, { createdBy: maker });
      const newest = await makePerson(c, { createdBy: maker });

      const r1 = await approvedMergeRequest(c, {
        retiredId: newest.id,
        survivorId: middle.id,
        requestedBy: maker,
        approvedBy: checker,
      });
      await c.query(mergeSql(), [newest.id, middle.id, maker, r1]);
      await c.query('SET CONSTRAINTS ALL IMMEDIATE');

      // `middle` has NOT been merged away, so `newest` has no chain to follow.
      await expectRejectionAt(c, 'merge_repoint_only_follows_chain', (cl) =>
        cl.query('UPDATE persons SET merged_into_person_id = $2 WHERE id = $1', [
          newest.id,
          oldest.id,
        ]),
      );
    });
  });

  it('refuses to un-retire a merged identity by editing the row', async () => {
    await withRollback(async (c) => {
      const maker = await makeStaff(c);
      const checker = await makeStaff(c, 'team_lead_manager');
      const older = await makePerson(c, { createdBy: maker });
      const newer = await makePerson(c, { createdBy: maker });
      const request = await approvedMergeRequest(c, {
        retiredId: newer.id,
        survivorId: older.id,
        requestedBy: maker,
        approvedBy: checker,
      });
      await c.query(mergeSql(), [newer.id, older.id, maker, request]);

      await expectRejectionAt(c, 'person_merge_irreversible', (cl) =>
        cl.query(
          `UPDATE persons SET retired_at = NULL, merged_into_person_id = NULL, merged_by = NULL,
                              merge_reason = NULL, merge_approval_request_id = NULL
            WHERE id = $1`,
          [newer.id],
        ),
      );
    });
  });

  it('refuses new contact detail recorded against a retired identity', async () => {
    await withRollback(async (c) => {
      const maker = await makeStaff(c);
      const checker = await makeStaff(c, 'team_lead_manager');
      const older = await makePerson(c, { createdBy: maker });
      const newer = await makePerson(c, { createdBy: maker });
      const request = await approvedMergeRequest(c, {
        retiredId: newer.id,
        survivorId: older.id,
        requestedBy: maker,
        approvedBy: checker,
      });
      await c.query(mergeSql(), [newer.id, older.id, maker, request]);

      await expectRejectionAt(c, 'person_retired', (cl) =>
        makeContact(cl, { personId: newer.id, value: '9876500009', recordedBy: maker }),
      );
    });
  });

  it('frees the name+phone for a new identity once the earlier one is retired', async () => {
    await withRollback(async (c) => {
      const maker = await makeStaff(c);
      const checker = await makeStaff(c, 'team_lead_manager');
      const older = await makePerson(c, { createdBy: maker, name: 'Meera Nair' });
      const newer = await makePerson(c, { createdBy: maker, name: 'Meera Nair' });
      await makeContact(c, { personId: newer.id, value: '9876500010', recordedBy: maker });

      const request = await approvedMergeRequest(c, {
        retiredId: newer.id,
        survivorId: older.id,
        requestedBy: maker,
        approvedBy: checker,
      });
      await c.query(mergeSql(), [newer.id, older.id, maker, request]);

      // The survivor may now take that number: the retired row is not live.
      await makeContact(c, { personId: older.id, value: '9876500010', recordedBy: maker });
      const { rows } = await c.query(
        `SELECT count(*)::int AS n FROM contact_points
          WHERE person_id = $1 AND valid_to IS NULL`,
        [older.id],
      );
      expect(rows[0].n).toBe(1);
    });
  });

  it('refuses a person merged into themselves', async () => {
    await withRollback(async (c) => {
      const maker = await makeStaff(c);
      const p = await makePerson(c, { createdBy: maker });
      await expectRejectionAt(c, 'merge_not_self', (cl) =>
        cl.query(
          `UPDATE persons SET retired_at = now(), merged_into_person_id = id, merged_by = $2,
                              merge_reason = 'x', merge_approval_request_id = gen_random_uuid()
            WHERE id = $1`,
          [p.id, maker],
        ),
      );
    });
  });
});
