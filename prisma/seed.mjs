/**
 * Seed — idempotent, and its main job is the policy rows.
 *
 * EVERY value seeded here that is not yet a business decision carries a
 * `reason` that says so in words a person will recognise. A placeholder that
 * looks like a decision becomes one.
 *
 * Run:  node prisma/seed.mjs
 * Plain JavaScript on purpose: the API app does not exist yet, so there is no
 * TypeScript runner configured to run this through.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * The actor every seeded row is attributed to. `is_active: false` so it can
 * never be a login — it exists to satisfy the created_by foreign key, which is
 * real precisely so that "who did this" is never nullable.
 */
const SYSTEM_STAFF = {
  staffCode: 'SYSTEM',
  fullName: 'System (seed)',
  email: 'system@spellzee.invalid',
  role: 'restricted_admin',
  isActive: false,
};

/**
 * Only the policy keys this schema slice actually needs. The other fourteen
 * placeholders in docs/open-decisions.md belong to slices that do not exist
 * yet; seeding them now would spread invented numbers ahead of the code that
 * reads them.
 */
const POLICIES = [
  {
    policyKey: 'duplicate.match_confidence_threshold',
    value: 0.85,
    reason:
      'PLACEHOLDER — awaiting a business decision, see docs/open-decisions.md (§30.9, value-blocking). ' +
      'Nobody with authority has chosen 0.85. The service-level duplicate scorer reads this; the ' +
      'database blocks the exact name+contact case regardless of it.',
  },
];

const EFFECTIVE_FROM = new Date('2026-01-01T00:00:00.000Z');

async function main() {
  const staff = await prisma.staffUser.upsert({
    where: { staffCode: SYSTEM_STAFF.staffCode },
    update: {},
    create: SYSTEM_STAFF,
  });

  for (const policy of POLICIES) {
    const existing = await prisma.policyVersion.findFirst({
      where: { policyKey: policy.policyKey, effectiveTo: null },
    });
    if (existing) {
      continue;
    }
    await prisma.policyVersion.create({
      data: {
        policyKey: policy.policyKey,
        value: policy.value,
        effectiveFrom: EFFECTIVE_FROM,
        createdBy: staff.id,
        reason: policy.reason,
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
