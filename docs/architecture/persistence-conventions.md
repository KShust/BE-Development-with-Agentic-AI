# Persistence Conventions

Explicit persistence decisions for this project. `db-designer` and
`design-reviewer` enforce these; `express-implementor` implements to them;
`implementation-verifier` and `security-reviewer` check against them.

## PC-1 Database & client

- PostgreSQL is the only database. Prisma ORM 7 is the only access path.
- The connection string comes from `DATABASE_URL` (see `.env.example`), parsed
  and validated in `src/config/env.ts`. Credentials are never hard-coded and
  never committed.
- Exactly one `PrismaClient` instance exists, exported from `src/lib/prisma.ts`.
  No other file constructs a client.
- Database access happens only in a module's repository file
  (`architecture.md` AD-2). Prisma is never imported by a route, controller,
  middleware, or schema file.
- **Test database — decided.** Resolved by a human on 2026-09-01. Automated tests
  run against a disposable PostgreSQL instance, never the development or a shared
  database.

  | Concern | Decision |
  |---|---|
  | Local | `docker compose up` a `db` service on port **5433**, not 5432 |
  | CI | GitHub Actions native `services: postgres` — no extra dependency |
  | Schema | `prisma migrate deploy` against the empty database |
  | Isolation | integration tests run serially; `TRUNCATE` between tests |
  | Connection | `DATABASE_URL` from `.env.test` |

  **Why `migrate deploy` and not `db push`.** `db push` would be a few seconds
  faster and is not forbidden here — SC-8 bans it only against a *shared*
  database. It is rejected anyway: pushing the Prisma schema directly means the
  tests never exercise the committed migrations, so a migration that fails on an
  empty database passes CI unnoticed. Running `migrate deploy` makes every test
  run a proof that PC-2 holds.

  **Why integration tests run serially.** `vitest.config.ts` shuffles files and
  runs them in parallel, which is correct for unit tests and unsafe against one
  shared database — a `TRUNCATE` in one file would delete rows another file is
  mid-assertion on. `tests/integration` therefore sets `fileParallelism: false`.
  Unit tests keep running in parallel. Revisit only when integration runtime
  actually becomes a problem; a schema-per-worker scheme is the next step, and
  it needs its own decision.

  **What the implementing Story must build** (none of it exists yet; the first
  Story that needs database-backed tests creates it):

  - a `docker-compose.yml` with a `db` service on 5433, and `db:test:up` /
    `db:test:down` npm scripts, both added to the `AGENTS.md` command table;
  - `.env.test` with the test `DATABASE_URL`, plus a matching placeholder line in
    `.env.example`;
  - a Vitest `globalSetup` that runs `prisma migrate deploy` and, **when the
    database is unreachable, fails with the command to run** rather than a raw
    connection error — the Stop hook forwards that message, so it is what an
    agent reads when a run fails;
  - a truncation fixture under `tests/support/`;
  - a `services: postgres` block in `.github/workflows/ci.yml`.

## PC-2 Schema & migrations

- `prisma/schema.prisma` is the source of truth for the data model.
- Every schema change ships with a Prisma migration created by
  `npm run prisma:migrate` and committed in the same change.
- `prisma migrate deploy` is the only way schema reaches a non-local
  environment. `prisma db push` is forbidden against any shared database — it
  applies schema without a migration record.
- An already-applied migration is never edited. A mistake is corrected by a new
  migration.
- `db-designer` specifies both the model change and the resulting migration
  intent; `design-reviewer` checks they agree.
- Destructive migrations (dropping a column or table, narrowing a type) require
  an explicit human decision recorded for that Story.

## PC-3 Identifiers

- Surrogate primary key named `id`.
- Type: `String` with `@id @default(uuid())` — opaque, non-enumerable, safe to
  expose in an API path.
- No business/natural key as a primary key. Natural keys (e.g. email) get a
  `@unique` constraint instead.
- A Story that needs ordered or externally meaningful ids must raise an Open
  Decision rather than switching the strategy silently.

## PC-4 Explicit constraints (no implicit defaults)

Every persisted field declares, explicitly:

- nullability — optional (`?`) only when the design says the value may be
  absent;
- `@unique` (or a model-level `@@unique`) for every uniqueness rule;
- `@db.VarChar(n)` (or an equivalent explicit type) for every text column that
  has a bounded length;
- `@map`/`@@map` when the database name differs from the field/model name.

A business invariant that can be expressed as a database constraint is
expressed as one — application-level checks alone are not sufficient
(e.g. email uniqueness is both a service check and a `@unique` constraint, so a
race cannot create a duplicate).

`db-designer` states the exact constraints; the Prisma model and the migration
must both match them.

## PC-5 Naming

- Prisma models: `PascalCase` singular (`User`, `RefreshToken`).
- Database tables: `snake_case` singular, via `@@map("user")`.
- Fields: `camelCase` in Prisma, `snake_case` in the database, via
  `@map("password_hash")`.
- Indexes and constraints keep Prisma's generated names unless a review requires
  an explicit one; when named explicitly, use `uq_<table>_<col>`,
  `fk_<table>_<ref>`, `ix_<table>_<col>`.

## PC-6 Audit timestamps

- Every model has `createdAt DateTime @default(now())` and
  `updatedAt DateTime @updatedAt`, stored as `timestamptz` in UTC
  (see `docs/product/business-rules.md` BR-007).
- `createdAt` is never updated. Timestamps are set by Prisma/the database, not
  assembled by hand in a service.
- Application code treats all timestamps as UTC and serializes them as ISO 8601
  (see `api-conventions.md` AC-11).

## PC-7 Indexes

- Index every foreign key column.
- Index every column used as a lookup or filter key by a repository query — the
  email lookup used by login is the first example. A `@unique` constraint
  already provides an index; do not add a duplicate.
- `db-designer` lists the required indexes; the migration creates them.
- A query that filters on an unindexed column is a finding, not a runtime
  detail to discover later.

## PC-8 Relations & query shape

- Declare relations explicitly with `@relation`, including the referential
  action (`onDelete`, `onUpdate`) — never rely on an implicit default for
  deletion behavior.
- Fetch related data in one query with `include`/`select` rather than looping
  over `findUnique` (no N+1).
- Select only the fields needed. A query that reads a user row must not select
  `passwordHash` unless the caller is the authentication path that needs it.
- Any query that can return many rows carries a limit. Unbounded `findMany` is
  forbidden (the pagination strategy is an Open Decision — see
  `api-conventions.md` AC-8).

## PC-9 Transactions

- Multi-write operations, and read-then-write operations guarded by a uniqueness
  rule, run inside `prisma.$transaction` opened by the service
  (`architecture.md` AD-3).
- A repository method accepts an optional transactional client so a service can
  compose several calls atomically; it never opens its own transaction.

## PC-10 Sensitive data

- Passwords are stored only as an Argon2id hash, in a column named
  `password_hash` (`passwordHash` in Prisma), non-null. It is the one text column
  exempt from the explicit-length rule in PC-4: declare it `String` with no
  `@db.VarChar(n)`, because the encoded hash length follows the Argon2id
  parameters (`security-conventions.md` SC-1) and a bound set today would
  silently truncate after a parameter change. Any other exemption from PC-4
  needs an approved decision. Plaintext is never persisted, never logged, and
  never returned.
- Refresh tokens are stored hashed, never in plaintext, together with their
  rotation/revocation state. The storage mechanism for revocation (table, Redis,
  or other) is an Open Decision — see `AGENTS.md`.
- Any other sensitive column is identified by `db-designer` with its handling
  rules, and excluded from every response DTO (`architecture.md` AD-4).
- Generated database artifacts, dumps, and `.env` files are never committed.
