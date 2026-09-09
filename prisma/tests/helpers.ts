/**
 * Constraint-test harness.
 *
 * These tests talk to a REAL PostgreSQL (`spellzee_test`, port 5433). That is
 * not a preference: when the invariants live in the database, a mocked
 * repository proves nothing about the component most likely to fail.
 *
 * There is no Docker on this machine and therefore no Testcontainers, so the
 * database persists between runs and isolation is the suite's own job:
 *   - `withRollback` wraps a test in a transaction that is always rolled back;
 *   - the concurrency tests, which genuinely need two connections and so cannot
 *     share one transaction, truncate the tables they touched instead.
 *
 * `pg` is used directly rather than Prisma because the assertion is about the
 * database's error, its SQLSTATE and its constraint NAME.
 */
import { config } from 'dotenv';
import pg from 'pg';

config();

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) {
  throw new Error('TEST_DATABASE_URL is not set — copy .env.example to .env');
}

export type Client = pg.Client;

export async function connect(): Promise<Client> {
  const client = new pg.Client({ connectionString });
  await client.connect();
  return client;
}

/**
 * Run `fn` inside a transaction and always roll it back. Nothing a test writes
 * survives, so the shared test database stays clean without truncation.
 */
export async function withRollback<T>(fn: (c: Client) => Promise<T>): Promise<T> {
  const client = await connect();
  try {
    await client.query('BEGIN');
    return await fn(client);
  } finally {
    await client.query('ROLLBACK').catch(() => undefined);
    await client.end();
  }
}

/** Tables the constraint suite writes to, in FK-safe truncation order. */
export const TEST_TABLES = [
  'audit_log',
  'contact_points',
  'student_guardians',
  'students',
  'parents',
  'persons',
  'approval_decisions',
  'approval_requests',
  'policy_versions',
  'staff_users',
  'identity_sequences',
] as const;

/** For the concurrency tests only — they cannot share one transaction. */
export async function truncateAll(client: Client): Promise<void> {
  await client.query(`TRUNCATE TABLE ${TEST_TABLES.map((t) => `"${t}"`).join(', ')} CASCADE`);
}

// --- fixture builders -------------------------------------------------------

let seq = 0;
function uniq(): string {
  seq += 1;
  return `${Date.now().toString(36)}${seq.toString(36)}`;
}

export async function makeStaff(c: Client, role = 'staff_coordinator'): Promise<string> {
  const code = `S-${uniq()}`;
  const { rows } = await c.query(
    `INSERT INTO staff_users (id, staff_code, full_name, email, role)
     VALUES (gen_random_uuid(), $1, 'Test Staff', $2, $3) RETURNING id`,
    [code, `${code.toLowerCase()}@spellzee.test`, role],
  );
  return rows[0].id as string;
}

export interface PersonRow {
  id: string;
  spellzee_id: string;
}

export async function makePerson(
  c: Client,
  opts: { type?: 'student' | 'parent'; name?: string; createdBy: string },
): Promise<PersonRow> {
  const { rows } = await c.query(
    `INSERT INTO persons (id, person_type, full_name, created_by)
     VALUES (gen_random_uuid(), $1, $2, $3)
     RETURNING id, spellzee_id`,
    [opts.type ?? 'student', opts.name ?? 'Aarav Kumar', opts.createdBy],
  );
  return rows[0] as PersonRow;
}

export async function makeContact(
  c: Client,
  opts: {
    personId: string;
    type?: 'phone' | 'email';
    value: string;
    isPrimary?: boolean;
    validTo?: string | null;
    recordedBy: string;
  },
): Promise<string> {
  const { rows } = await c.query(
    `INSERT INTO contact_points (id, person_id, contact_type, raw_value, is_primary, valid_to, recorded_by)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6) RETURNING id`,
    [
      opts.personId,
      opts.type ?? 'phone',
      opts.value,
      opts.isPrimary ?? false,
      opts.validTo ?? null,
      opts.recordedBy,
    ],
  );
  return rows[0].id as string;
}

/** Requests a person_merge and approves it with a different staff member. */
export async function approvedMergeRequest(
  c: Client,
  opts: { retiredId: string; survivorId: string; requestedBy: string; approvedBy: string },
): Promise<string> {
  const { rows } = await c.query(
    `INSERT INTO approval_requests
       (id, action_type, subject_type, subject_id, target_id, reason, requested_by)
     VALUES (gen_random_uuid(), 'person_merge', 'person', $1, $2, 'duplicate confirmed by coordinator', $3)
     RETURNING id`,
    [opts.retiredId, opts.survivorId, opts.requestedBy],
  );
  const requestId = rows[0].id as string;
  await c.query(
    `INSERT INTO approval_decisions (id, approval_request_id, decision, decided_by, reason)
     VALUES (gen_random_uuid(), $1, 'approved', $2, 'verified against admission records')`,
    [requestId, opts.approvedBy],
  );
  return requestId;
}

/** Performs the merge itself: the retired row redirects to the survivor. */
export function mergeSql(): string {
  return `UPDATE persons
             SET retired_at = now(),
                 merged_into_person_id = $2,
                 merged_by = $3,
                 merge_reason = 'duplicate identity',
                 merge_approval_request_id = $4
           WHERE id = $1`;
}

/**
 * Asserts the database rejected the operation, and that it rejected it for the
 * stated reason — matching on the constraint name or the greppable token in
 * the trigger's message, never on a generic error type.
 */
export async function expectRejection(
  promise: Promise<unknown>,
  token: string,
): Promise<pg.DatabaseError> {
  try {
    await promise;
  } catch (error) {
    const err = error as pg.DatabaseError;
    const haystack = `${err.constraint ?? ''} ${err.message ?? ''}`;
    if (!haystack.includes(token)) {
      throw new Error(
        `expected rejection matching "${token}" but got: ${err.message} (constraint=${err.constraint})`,
      );
    }
    return err;
  }
  throw new Error(`expected the database to reject this, matching "${token}", but it was accepted`);
}

let savepointSeq = 0;

/**
 * Same assertion, but inside a SAVEPOINT so the surrounding transaction stays
 * usable. A rejected statement aborts the whole transaction in PostgreSQL, so
 * without this a test could only ever assert one violation.
 */
export async function expectRejectionAt(
  client: Client,
  token: string,
  fn: (c: Client) => Promise<unknown>,
): Promise<pg.DatabaseError> {
  savepointSeq += 1;
  const sp = `sp_${savepointSeq}`;
  await client.query(`SAVEPOINT ${sp}`);
  try {
    return await expectRejection(fn(client), token);
  } finally {
    await client.query(`ROLLBACK TO SAVEPOINT ${sp}`);
  }
}
