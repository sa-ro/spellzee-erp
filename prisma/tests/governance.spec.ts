/**
 * Governance invariants: append-only history, maker–checker, policy versioning.
 *
 * CLAUDE.md — "an audit trail that can be edited proves nothing, because the
 * edit leaves no trace of itself."
 */
import { describe, expect, it } from 'vitest';
import { expectRejectionAt, makeStaff, withRollback } from './helpers.js';

describe('append-only tables', () => {
  it('refuses UPDATE and DELETE on audit_log', async () => {
    await withRollback(async (c) => {
      const staff = await makeStaff(c);
      const { rows } = await c.query(
        `INSERT INTO audit_log (id, actor_id, action, entity_type, entity_id, new_value, reason)
         VALUES (gen_random_uuid(), $1, 'person.create', 'person', gen_random_uuid(),
                 '{"full_name":"Aarav Kumar"}'::jsonb, 'admission handover')
         RETURNING id`,
        [staff],
      );
      await expectRejectionAt(c, 'append_only_violation', (cl) =>
        cl.query(`UPDATE audit_log SET reason = 'tidied up' WHERE id = $1`, [rows[0].id]),
      );
      await expectRejectionAt(c, 'append_only_violation', (cl) =>
        cl.query('DELETE FROM audit_log WHERE id = $1', [rows[0].id]),
      );
    });
  });

  it('refuses even a zero-row UPDATE on audit_log — the intent is the violation', async () => {
    await withRollback(async (c) => {
      await expectRejectionAt(c, 'append_only_violation', (cl) =>
        cl.query(`UPDATE audit_log SET reason = 'x' WHERE id = gen_random_uuid()`),
      );
    });
  });

  it('refuses UPDATE on approval_requests and approval_decisions', async () => {
    await withRollback(async (c) => {
      const maker = await makeStaff(c);
      const checker = await makeStaff(c, 'team_lead_manager');
      const { rows } = await c.query(
        `INSERT INTO approval_requests
           (id, action_type, subject_type, subject_id, target_id, reason, requested_by)
         VALUES (gen_random_uuid(), 'person_merge', 'person', gen_random_uuid(),
                 gen_random_uuid(), 'duplicate', $1)
         RETURNING id`,
        [maker],
      );
      await c.query(
        `INSERT INTO approval_decisions (id, approval_request_id, decision, decided_by, reason)
         VALUES (gen_random_uuid(), $1, 'approved', $2, 'verified')`,
        [rows[0].id, checker],
      );
      await expectRejectionAt(c, 'append_only_violation', (cl) =>
        cl.query(`UPDATE approval_requests SET reason = 'changed my mind' WHERE id = $1`, [
          rows[0].id,
        ]),
      );
      await expectRejectionAt(c, 'append_only_violation', (cl) =>
        cl.query(
          `UPDATE approval_decisions SET decision = 'rejected' WHERE approval_request_id = $1`,
          [rows[0].id],
        ),
      );
    });
  });
});

describe('maker–checker', () => {
  it('refuses an approver who is the requester', async () => {
    await withRollback(async (c) => {
      const maker = await makeStaff(c);
      const { rows } = await c.query(
        `INSERT INTO approval_requests
           (id, action_type, subject_type, subject_id, target_id, reason, requested_by)
         VALUES (gen_random_uuid(), 'person_merge', 'person', gen_random_uuid(),
                 gen_random_uuid(), 'duplicate', $1)
         RETURNING id`,
        [maker],
      );
      await expectRejectionAt(c, 'maker_checker_violation', (cl) =>
        cl.query(
          `INSERT INTO approval_decisions (id, approval_request_id, decision, decided_by, reason)
           VALUES (gen_random_uuid(), $1, 'approved', $2, 'I am sure')`,
          [rows[0].id, maker],
        ),
      );
    });
  });

  it('refuses a second decision — approval is single-level and final', async () => {
    await withRollback(async (c) => {
      const maker = await makeStaff(c);
      const checker1 = await makeStaff(c, 'team_lead_manager');
      const checker2 = await makeStaff(c, 'restricted_admin');
      const { rows } = await c.query(
        `INSERT INTO approval_requests
           (id, action_type, subject_type, subject_id, target_id, reason, requested_by)
         VALUES (gen_random_uuid(), 'person_merge', 'person', gen_random_uuid(),
                 gen_random_uuid(), 'duplicate', $1)
         RETURNING id`,
        [maker],
      );
      const decide = (by: string, decision: string) =>
        c.query(
          `INSERT INTO approval_decisions (id, approval_request_id, decision, decided_by, reason)
           VALUES (gen_random_uuid(), $1, $3, $2, 'reviewed')`,
          [rows[0].id, by, decision],
        );
      await decide(checker1, 'approved');
      await expectRejectionAt(c, 'approval_decisions_approval_request_id_key', () =>
        decide(checker2, 'rejected'),
      );
    });
  });

  it('refuses a merge request with no target', async () => {
    await withRollback(async (c) => {
      const maker = await makeStaff(c);
      await expectRejectionAt(c, 'person_merge_request_needs_target', (cl) =>
        cl.query(
          `INSERT INTO approval_requests
             (id, action_type, subject_type, subject_id, reason, requested_by)
           VALUES (gen_random_uuid(), 'person_merge', 'person', gen_random_uuid(), 'duplicate', $1)`,
          [maker],
        ),
      );
    });
  });
});

describe('policy_versions', () => {
  const insert = (key: string, from: string, to: string | null, by: string) =>
    `INSERT INTO policy_versions (id, policy_key, value, effective_from, effective_to, created_by, reason)
     VALUES (gen_random_uuid(), '${key}', '0.85'::jsonb, '${from}', ${to ? `'${to}'` : 'NULL'}, '${by}',
             'PLACEHOLDER — awaiting business decision')`;

  it('refuses two versions of one policy in force at the same instant', async () => {
    await withRollback(async (c) => {
      const staff = await makeStaff(c, 'restricted_admin');
      await c.query(insert('test.key', '2026-01-01T00:00:00Z', null, staff));
      await expectRejectionAt(c, 'policy_no_overlap', (cl) =>
        cl.query(insert('test.key', '2026-06-01T00:00:00Z', null, staff)),
      );
    });
  });

  it('allows a superseded version followed by its replacement', async () => {
    await withRollback(async (c) => {
      const staff = await makeStaff(c, 'restricted_admin');
      await c.query(insert('test.key', '2026-01-01T00:00:00Z', '2026-06-01T00:00:00Z', staff));
      await c.query(insert('test.key', '2026-06-01T00:00:00Z', null, staff));
      const { rows } = await c.query(
        `SELECT count(*)::int AS n FROM policy_versions WHERE policy_key = 'test.key'`,
      );
      expect(rows[0].n).toBe(2);
    });
  });

  it('permits closing an open version, and nothing else', async () => {
    await withRollback(async (c) => {
      const staff = await makeStaff(c, 'restricted_admin');
      await c.query(insert('test.key', '2026-01-01T00:00:00Z', null, staff));
      await c.query(
        `UPDATE policy_versions SET effective_to = '2026-06-01T00:00:00Z' WHERE policy_key = 'test.key'`,
      );
      await expectRejectionAt(c, 'policy_versions_supersede_only', (cl) =>
        cl.query(`UPDATE policy_versions SET value = '0.9'::jsonb WHERE policy_key = 'test.key'`),
      );
      await expectRejectionAt(c, 'policy_versions_append_only', (cl) =>
        cl.query(`DELETE FROM policy_versions WHERE policy_key = 'test.key'`),
      );
    });
  });
});

describe('staff_users', () => {
  it('rejects a role outside the four settled on 2026-09-09', async () => {
    await withRollback(async (c) => {
      await expectRejectionAt(c, 'staff_users_role_known', (cl) =>
        cl.query(
          `INSERT INTO staff_users (id, staff_code, full_name, email, role)
           VALUES (gen_random_uuid(), 'S-BAD', 'Nobody', 'nobody@spellzee.test', 'superuser')`,
        ),
      );
    });
  });
});
