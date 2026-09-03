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

// Unit and harness tests import the configuration boundary (src/config/env.ts)
// transitively but never reach a database. Give the two required-without-default
// variables a harmless placeholder so importing that module does not fail-fast
// in a run that has no real environment. An integration run has already set
// DATABASE_URL from .env.test in vitest.config.ts before this file loads, so the
// `||=` leaves the real value in place; the placeholder only fills the gap a
// unit run would otherwise hit (PLAN_REVIEW:p-10).
process.env.DATABASE_URL ||= 'postgresql://placeholder:placeholder@localhost:5433/placeholder';
process.env.CORS_ALLOWED_ORIGINS ||= 'http://localhost:3000';
