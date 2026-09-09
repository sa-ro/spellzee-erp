/**
 * The races. A single-threaded test can never catch these.
 *
 * Every rule here is enforced by a trigger that READS OTHER ROWS to decide,
 * which is exactly the shape that is unsafe on its own: two transactions can
 * each see a pre-write state and both commit. What makes each one safe is
 * stated in the migration and proved here with two real connections.
 *
 * These tests cannot share one rolled-back transaction — two connections
 * cannot see each other's uncommitted rows — so they truncate instead.
 * `vitest.config.ts` disables file parallelism so a truncate never lands in
 * the middle of another file's fixtures.
 */
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
  type Client,
  connect,
  makeContact,
  makePerson,
  makeStaff,
  truncateAll,
} from './helpers.js';

let a: Client;
let b: Client;

beforeEach(async () => {
  a ??= await connect();
  b ??= await connect();
  await a.query('ROLLBACK').catch(() => undefined);
  await b.query('ROLLBACK').catch(() => undefined);
  await truncateAll(a);
});

afterAll(async () => {
  await a?.query('ROLLBACK').catch(() => undefined);
  await b?.query('ROLLBACK').catch(() => undefined);
  await truncateAll(a);
  await a?.end();
  await b?.end();
});

describe('concurrent duplicate creation', () => {
  // NOTE on setup: the two persons are created and COMMITTED before the
  // concurrent transactions open. That is not a convenience — minting a
  // Spellzee ID takes a row lock on identity_sequences, so two open
  // transactions cannot both create a person anyway. (That lock is itself a
  // second line of defence for the create-a-student path; the race the
  // advisory lock exists for is the one below, where the persons already exist
  // and two coordinators record the same contact detail at the same moment.)
  it('lets exactly one of two simultaneous identical registrations through', async () => {
    const staff = await makeStaff(a);
    const pa = await makePerson(a, { createdBy: staff, name: 'Aarav Kumar' });
    const pb = await makePerson(a, { createdBy: staff, name: 'Aarav  Kumar' });

    await a.query('BEGIN');
    await b.query('BEGIN');

    // Transaction A records the phone and holds the advisory lock on
    // ('student' | 'aarav kumar') until it commits.
    await makeContact(a, { personId: pa.id, value: '9876543210', recordedBy: staff });

    // B attempts the same. It must BLOCK on the advisory lock rather than
    // reading a pre-A state and succeeding. Deliberately not awaited yet.
    const bInsert = makeContact(b, {
      personId: pb.id,
      value: '+91 98765 43210',
      recordedBy: staff,
    });

    let settledEarly = false;
    await Promise.race([
      bInsert.then(
        () => {
          settledEarly = true;
        },
        () => {
          settledEarly = true;
        },
      ),
      new Promise((r) => setTimeout(r, 750)),
    ]);
    expect(settledEarly, 'B should be blocked on the advisory lock while A is open').toBe(false);

    await a.query('COMMIT');

    await expect(bInsert).rejects.toThrow(/duplicate_person_blocked/);
    await b.query('ROLLBACK');

    // Exactly one live identity now holds that number under that name.
    const { rows } = await a.query(
      `SELECT count(*)::int AS n
         FROM contact_points c JOIN persons p ON p.id = c.person_id
        WHERE c.valid_to IS NULL
          AND normalize_contact_value(c.contact_type, c.raw_value) = '9876543210'
          AND normalize_person_name(p.full_name) = 'aarav kumar'`,
    );
    expect(rows[0].n).toBe(1);
  });

  it('does not serialize unrelated names', async () => {
    const staff = await makeStaff(a);
    const pa = await makePerson(a, { createdBy: staff, name: 'Aarav Kumar' });
    const pb = await makePerson(a, { createdBy: staff, name: 'Diya Raman' });

    await a.query('BEGIN');
    await b.query('BEGIN');
    await makeContact(a, { personId: pa.id, value: '9876543210', recordedBy: staff });

    // Different lock bucket — this must not wait on A at all.
    await expect(
      Promise.race([
        makeContact(b, { personId: pb.id, value: '9876500011', recordedBy: staff }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('blocked')), 1500)),
      ]),
    ).resolves.toBeDefined();

    await a.query('ROLLBACK');
    await b.query('ROLLBACK');
  });
});

describe('concurrent identity minting', () => {
  it('never issues the same Spellzee ID twice', async () => {
    const staff = await makeStaff(a);

    await a.query('BEGIN');
    await b.query('BEGIN');

    const pa = await makePerson(a, { createdBy: staff, name: 'Concurrent One' });
    // B blocks on the identity_sequences row until A commits — that is what
    // makes the counter gapless AND unique.
    const pbPromise = makePerson(b, { createdBy: staff, name: 'Concurrent Two' });
    await a.query('COMMIT');
    const pb = await pbPromise;
    await b.query('COMMIT');

    expect(pa.spellzee_id).not.toBe(pb.spellzee_id);
    expect(Number(pb.spellzee_id.slice(-6))).toBe(Number(pa.spellzee_id.slice(-6)) + 1);
  });
});

describe('concurrent merge into the same survivor', () => {
  it('lets only one of two simultaneous merges retire the survivor', async () => {
    const maker = await makeStaff(a);
    const checker = await makeStaff(a, 'team_lead_manager');
    const oldest = await makePerson(a, { createdBy: maker, name: 'Survivor' });
    const middle = await makePerson(a, { createdBy: maker, name: 'Middle' });
    const newest = await makePerson(a, { createdBy: maker, name: 'Newest' });

    const request = async (client: Client, retiredId: string, survivorId: string) => {
      const { rows } = await client.query(
        `INSERT INTO approval_requests
           (id, action_type, subject_type, subject_id, target_id, reason, requested_by)
         VALUES (gen_random_uuid(), 'person_merge', 'person', $1, $2, 'duplicate', $3)
         RETURNING id`,
        [retiredId, survivorId, maker],
      );
      await client.query(
        `INSERT INTO approval_decisions (id, approval_request_id, decision, decided_by, reason)
         VALUES (gen_random_uuid(), $1, 'approved', $2, 'verified')`,
        [rows[0].id, checker],
      );
      return rows[0].id as string;
    };

    const rA = await request(a, newest.id, middle.id);
    const rB = await request(a, middle.id, oldest.id);

    const merge = (client: Client, retiredId: string, survivorId: string, req: string) =>
      client.query(
        `UPDATE persons SET retired_at = now(), merged_into_person_id = $2, merged_by = $3,
                            merge_reason = 'duplicate', merge_approval_request_id = $4
          WHERE id = $1`,
        [retiredId, survivorId, maker, req],
      );

    await a.query('BEGIN');
    await b.query('BEGIN');

    // A: newest -> middle. Takes FOR UPDATE on `middle`.
    await merge(a, newest.id, middle.id, rA);
    // B: middle -> oldest. Must wait for A, then see middle as still live but
    // find a redirect pointing at it — one of the two must fail.
    const bMerge = merge(b, middle.id, oldest.id, rB);

    await a.query('COMMIT');

    let bFailed = false;
    try {
      await bMerge;
      await b.query('COMMIT'); // deferred redirect check fires here
    } catch {
      bFailed = true;
      await b.query('ROLLBACK');
    }
    expect(bFailed, 'the second merge must not leave a dangling redirect').toBe(true);

    const { rows } = await a.query(
      `SELECT count(*)::int AS n FROM persons p
        WHERE p.merged_into_person_id IS NOT NULL
          AND EXISTS (SELECT 1 FROM persons t
                       WHERE t.id = p.merged_into_person_id AND t.retired_at IS NOT NULL)`,
    );
    expect(rows[0].n).toBe(0);
  });
});
