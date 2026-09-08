// ESLint is here for ONE job: enforcing the architecture boundaries in
// docs/folder-structure.md. Formatting and general style belong to Biome.
//
// The guard hook (.claude/hooks/guard-invariants.js) reads file *paths* and
// *text*. It cannot see an `import` statement, so every rule below covers
// something the hook structurally cannot:
//
//   hook   →  `await this.merithub.x()` in a command        (text)
//   eslint →  `import ... from '../../integrations/...'`    (the step before)
//
// Keep this file small. A slow lint gets skipped, and a skipped lint enforces
// nothing.

import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';

// The ten domain modules. Each one's internals are private to it; the rest of
// the codebase sees only its index.ts.
//
// Without this, a modular monolith is just a monolith with folders: one command
// imports another module's repository, the entitlement rule ends up written in
// two places, and the boundary that justified a single deployable is gone.
const MODULES = [
  'identity',
  'operations',
  'finance',
  'governance',
  'academic',
  'teacher-hr',
  'communication',
  'analytics',
];

const moduleEncapsulationZones = MODULES.map((owner) => ({
  target: MODULES.filter((other) => other !== owner).map(
    (other) => `./apps/api/src/modules/${other}`,
  ),
  from: `./apps/api/src/modules/${owner}`,
  except: ['./index.ts'],
  message: `Import from '${owner}' only through its index.ts. Its commands, queries, repository and internal types are private — reaching past the public API couples you to a layout that is free to change.`,
}));

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
      'prisma/generated/**',
      '.claude/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ─────────────────────────────────────────────────────────────────────────
  // Architecture boundaries — docs/folder-structure.md
  // ─────────────────────────────────────────────────────────────────────────
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: { import: importPlugin },
    settings: {
      'import/resolver': {
        // Each workspace has its own tsconfig — apps/api is Node, apps/web is
        // Next.js, and the root is a base that compiles nothing.
        typescript: {
          alwaysTryTypes: true,
          project: [
            './apps/api/tsconfig.json',
            './apps/web/tsconfig.json',
            './packages/contracts/tsconfig.json',
          ],
        },
        node: true,
      },
    },
    rules: {
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            // 0. Module encapsulation — each module's internals are private,
            //    reachable only through its index.ts. Generated above.
            ...moduleEncapsulationZones,

            // 0b. Dependencies point one way: modules → platform → common.
            //     If platform/ imports a module, the uniform write path is
            //     coupled to one domain, and the cycle makes both untestable
            //     in isolation.
            {
              target: './apps/api/src/platform',
              from: './apps/api/src/modules',
              message:
                'platform/ must not import modules/. Dependencies point modules → platform → common; the write path is domain-agnostic by design.',
            },
            {
              target: './apps/api/src/common',
              from: ['./apps/api/src/modules', './apps/api/src/platform'],
              message:
                'common/ is a leaf — it must not import modules/ or platform/. If a helper needs domain knowledge, it is not a common helper.',
            },

            // 1. modules/ must never reach the integration edge directly.
            //    A command writes an outbox row; a worker makes the call.
            //    Direct import means a third party landed in the request path.
            {
              target: './apps/api/src/modules',
              from: './apps/api/src/integrations',
              message:
                'modules/ must not import integrations/. Write an outbox row and let a worker call out — a third party in the request path donates its outage to you. See docs/folder-structure.md rule 1.',
            },

            // 2. modules/ must not reach into workers/ either. Workers are a
            //    separate deployable; importing one drags it into the API bundle.
            {
              target: './apps/api/src/modules',
              from: './apps/api/src/workers',
              message:
                'modules/ must not import workers/. Workers are a separate always-on deployable — importing one bundles it into the API, where it would scale to zero and stop draining silently.',
            },

            // 3. contracts/ must stay importable from a browser. Anything with a
            //    runtime dependency on the server breaks the frontend build.
            {
              target: './packages/contracts',
              from: ['./apps/api/src', './apps/web/src'],
              message:
                'packages/contracts must stay importable from the browser — no runtime dependency on NestJS, Prisma or app code. Types and enums only.',
            },

            // 4. The frontend consumes the API contract, never the API itself.
            {
              target: './apps/web',
              from: './apps/api',
              message:
                'The frontend imports response types from packages/contracts, never from apps/api. A re-declared type drifts silently and nothing fails until a user sees the wrong number.',
            },
          ],
        },
      ],

      // Day.js has exactly two import sites. A bare dayjs() resolves in the
      // host's local timezone — right on a laptop in India, wrong in a UTC
      // container, and it fails silently with a cutoff off by hours.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'dayjs',
              message:
                'Import from apps/api/src/common/time (backend) or apps/web/src/lib/format (frontend). A bare dayjs() uses the host timezone and fails silently.',
            },
          ],
        },
      ],
    },
  },

  // The two sanctioned Day.js import sites.
  {
    files: ['apps/api/src/common/time/**/*.ts', 'apps/web/src/lib/format/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': 'off' },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Commands and queries — the uniform write path
  // ─────────────────────────────────────────────────────────────────────────
  {
    files: ['apps/api/src/modules/**/commands/**/*.ts'],
    rules: {
      // A command reaching Prisma directly has bypassed authorize → write →
      // audit → outbox. It goes through platform/write-path, or through its
      // module's repository, which the write path calls.
      //
      // This catches the import, not the intent: a command that imports the
      // write path and then skips its audit step is semantic, and belongs to
      // erosion-auditor.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@prisma/client',
              message:
                'Commands do not touch Prisma directly — that bypasses authorize → write → audit → outbox. Go through platform/write-path. See docs/folder-structure.md rule 2.',
            },
            {
              name: 'dayjs',
              message: 'Import from apps/api/src/common/time, not dayjs directly.',
            },
          ],
        },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Type-aware correctness — the reason ESLint is here alongside Biome.
  // Biome has no type information, so it cannot express any of these.
  // ─────────────────────────────────────────────────────────────────────────
  {
    files: ['apps/**/*.{ts,tsx}', 'packages/**/*.ts'],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      // A dropped promise in a transaction commits half the work and reports
      // success. This is the single highest-value rule in the file.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      // An async callback where a void is expected — the classic
      // `array.forEach(async ...)` trap, which silently does not await.
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/require-await': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },

  // Tests may reach for Prisma and for raw dayjs — a constraint test asserts
  // the database rejects a violation, which means talking to it directly.
  {
    files: ['**/*.{spec,test,e2e-spec}.{ts,tsx}', 'apps/api/test/**/*.ts'],
    rules: {
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
