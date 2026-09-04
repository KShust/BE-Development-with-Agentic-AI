// Vitest `globalSetup` for the `integration` project
// (docs/architecture/persistence-conventions.md PC-1). Runs once before the
// integration test files in a run, applying the committed Prisma migrations
// to the disposable test database.
//
// Not yet wired into vitest.config.ts: that conversion to `test.projects`
// (plan Step 3, D-10, docs/plans/US-001-implementation-plan.md) is
// IMPLEMENTATION's, not TEST_WRITING's — see AGENTS.md "Definition of Ready"
// and this stage's Constraints ("Do not modify production source files"; a
// runner config is exactly that kind of file). This file has no effect on any
// test run until that wiring lands. It resolves `DATABASE_URL` from
// `process.env` only, because D-4/D-10 fix the config module body (not this
// file) as the one place that reads `process.env.DATABASE_URL` ??
// `.env.test`, before either the main process or a worker needs it.
//
// PC-1: "when the database is unreachable, fails with the command to run
// rather than a raw connection error" — the Stop hook forwards this message
// verbatim (.claude/hooks/validate-full.py), so it has to name the fix, not
// just describe the symptom.

import { execFileSync } from 'node:child_process';

export default function setup(): void {
  try {
    execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
      stdio: 'pipe',
      env: process.env,
      shell: true, // npx resolves through a shell shim on Windows.
    });
  } catch (cause) {
    throw new Error(
      'Integration tests need the disposable Postgres instance PC-1 describes, ' +
        'reachable at DATABASE_URL, with the committed migrations applied. Run ' +
        '"npm run db:test:up" to start it (docker compose, host port 5433). ' +
        'On a fresh clone, also create .env.test with the test DATABASE_URL ' +
        '(docs/architecture/persistence-conventions.md PC-1); .env.example ' +
        'carries the placeholder.',
      { cause },
    );
  }
}
