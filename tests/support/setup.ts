// Global setup, executed before every test file (see vitest.config.ts).
//
// Guards the invariants a test run depends on. Anything that needs a database
// belongs in a fixture or in globalSetup, not here - this file runs before every
// test file, including the unit tests that must never touch a database. The
// strategy those fixtures implement is docs/architecture/persistence-conventions.md
// PC-1.

if (process.env.NODE_ENV !== 'test') {
  throw new Error(
    `Tests must run with NODE_ENV=test (got ${String(process.env.NODE_ENV)}). ` +
      'Unset NODE_ENV (Vitest defaults it to "test") and run "npm run test".',
  );
}
