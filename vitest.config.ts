import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['prisma/tests/**/*.spec.ts'],
    // The constraint suite shares one persistent `spellzee_test` database
    // (no Docker on this machine, so no per-test container). Most tests isolate
    // themselves by rolling back a transaction, but the concurrency tests need
    // two real connections and therefore truncate. Running files in parallel
    // would let a truncate land in the middle of another file's fixtures.
    fileParallelism: false,
    sequence: { concurrent: false },
    testTimeout: 20_000,
  },
});
