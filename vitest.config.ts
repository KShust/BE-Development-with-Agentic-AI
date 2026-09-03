import { defineConfig } from 'vitest/config';

// Resolve the test DATABASE_URL in the config module body, before defineConfig,
// so both the main process (the integration project's globalSetup) and the
// worker processes (the test files) see the same value (plan D-10). An
// externally supplied value always wins — CI sets DATABASE_URL as a workflow
// variable and never touches .env.test (plan D-4); only when it is unset is the
// local .env.test read. A missing .env.test is deliberately NOT fatal here: unit
// and harness runs need no database, and the integration project's globalSetup
// is what produces the actionable PC-1 message when a run actually needs one
// (PLAN_REVIEW:p-10).
if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile('.env.test');
  } catch {
    // .env.test absent — see the note above.
  }
}

export default defineConfig({
  test: {
    environment: 'node',

    // Explicit imports from 'vitest' — no implicit globals.
    globals: false,

    setupFiles: ['tests/support/setup.ts'],
    exclude: ['node_modules/**', 'dist/**', 'coverage/**'],

    // TZ keeps timestamps deterministic regardless of the developer machine
    // (business-rules.md BR-007: UTC). NODE_ENV is deliberately NOT set here:
    // Vitest defaults it to "test", so an exported NODE_ENV=production is caught
    // by the guard in tests/support/setup.ts instead of being overwritten.
    env: { TZ: 'UTC' },

    // Shuffled file order (NFR-005): an accidental order dependency fails loudly
    // instead of passing by luck. Declared here in the shared root block as well
    // as on the unit project so the harness project and any future
    // tests/*.test.ts inherit it too (PLAN_REVIEW:p-8).
    sequence: { shuffle: { files: true, tests: false } },

    // No state leaks between tests.
    restoreMocks: true,
    clearMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,

    testTimeout: 10_000,
    hookTimeout: 10_000,

    // Three projects whose include globs together cover every test file on disk
    // (plan D-10). `unit` keeps parallel, shuffled execution; `integration` runs
    // one file at a time against the one shared database (PC-1) and carries the
    // globalSetup that applies the committed migrations; `harness` collects
    // tests/harness.test.ts, which matches neither of the other two globs
    // (PLAN_REVIEW:p-6).
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts'],
          fileParallelism: true,
          sequence: { shuffle: { files: true, tests: false } },
        },
      },
      {
        extends: true,
        test: {
          name: 'harness',
          include: ['tests/*.test.ts'],
          fileParallelism: true,
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          fileParallelism: false,
          globalSetup: ['tests/support/globalSetup.ts'],
        },
      },
    ],
  },
});
