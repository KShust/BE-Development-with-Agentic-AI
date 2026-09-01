import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',

    // Unit tests live beside the source they cover; cross-module API tests live
    // under tests/integration (docs/architecture/architecture.md AD-9).
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: ['node_modules/**', 'dist/**', 'coverage/**'],

    // Explicit imports from 'vitest' — no implicit globals.
    globals: false,

    setupFiles: ['tests/support/setup.ts'],

    // TZ keeps timestamps deterministic regardless of the developer machine
    // (business-rules.md BR-007: UTC). NODE_ENV is deliberately NOT set here:
    // Vitest defaults it to "test", and leaving it alone means an exported
    // NODE_ENV=production in the shell is caught by the guard in
    // tests/support/setup.ts instead of being silently overwritten.
    env: { TZ: 'UTC' },

    // Tests must be independent of each other (NFR-005). Shuffling files makes
    // an accidental order dependency fail loudly instead of passing by luck;
    // Vitest prints the seed so a failure stays reproducible.
    sequence: { shuffle: { files: true, tests: false } },

    // No state leaks between tests.
    restoreMocks: true,
    clearMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,

    testTimeout: 10_000,
    hookTimeout: 10_000,
  },
});
