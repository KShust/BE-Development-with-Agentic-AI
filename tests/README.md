# Tests

Layout follows `docs/architecture/architecture.md` AD-9.

| Location | Contains | Runs with |
|---|---|---|
| `src/**/*.test.ts` | unit tests, beside the source they cover — service logic without Express and without a live database | `npm run test:unit` |
| `tests/integration/*.test.ts` | API tests that mount `src/app.ts` with Supertest, and persistence tests | `npm run test:integration` |
| `tests/support/` | shared setup and fixtures; never imported by `src/` | — |
| `tests/harness.test.ts` | asserts the test harness itself is configured correctly | `npm run test` |

`npm run test` runs everything. The two narrower scripts pass when their
folder is still empty, so they stay usable before the first test of that kind
exists; the full run does not.

## Rules that the configuration enforces

- `TZ=UTC` for every run, so timestamp assertions do not depend on the developer
  machine (`docs/product/business-rules.md` BR-007).
- Test files are **shuffled** (`sequence.shuffle.files`). An accidental order
  dependency fails loudly instead of passing by luck. Vitest prints the seed, so
  a failure stays reproducible: `npx vitest run --sequence.seed=<seed>`.
- Mocks are restored and cleared between tests; env and global stubs are undone.
- `tests/support/setup.ts` refuses to run when `NODE_ENV` is not `test`.

## The test database

Decided 2026-09-01; the full record is `docs/architecture/persistence-conventions.md`
PC-1, which is authoritative. In short: a disposable Postgres on port **5433**
(docker compose locally, GitHub Actions `services:` in CI), schema applied with
`prisma migrate deploy`, connection from `.env.test`, `TRUNCATE` between tests.

Integration tests run **serially** (`fileParallelism: false` for this folder).
Unit tests keep the parallel, shuffled execution described above. One shared
database plus parallel files would mean one file truncating rows another is
asserting on.

Still true regardless: never point a test at the development `DATABASE_URL`, and
never invent a connection mechanism inside a test file — use the shared fixture.

**None of the plumbing exists yet.** The compose file, the `db:test:up` /
`db:test:down` scripts, `.env.test`, the Vitest `globalSetup`, the truncation
fixture, and the CI service block are all built by the first Story that needs
database-backed tests; PC-1 lists exactly what that Story owes. `tests/integration/`
is empty until then.
