# Module Map

Ownership and dependency rules for every directory under `src/`. Adding a
directory not listed here requires an approved decision (see
`architecture.md` AD-8).

Replaces the "package map" concept of a JVM project: in this codebase the unit
of ownership is a **feature module** (`src/modules/<name>/`) plus a small set of
shared directories. "Package" always means an npm package, never a source
folder.

## Feature modules — `src/modules/<module>/`

A module owns one bounded piece of behavior and is the only place its business
rules live. Current modules: `auth`, `users`.

| File | Contains | May import | Notes |
|---|---|---|---|
| `<module>.routes.ts` | Express `Router`, middleware composition | its own controller, shared middleware, its own schemas | No business logic. No Prisma. |
| `<module>.controller.ts` | HTTP ↔ service translation | its own service, its own schemas, `src/lib` helpers | No business logic. No Prisma. No other module's controller. |
| `<module>.service.ts` | business logic, orchestration, transactions, DTO mapping | its own repository, its own schemas, `src/lib`, `src/config`, **another module's service** | No `express` types. No Prisma client directly (only through its repository, or a transactional client it passes down). |
| `<module>.repository.ts` | Prisma queries for this module's data | `src/lib/prisma.ts`, its own schemas (types only) | Queries only. No business rules. Never imports a service. |
| `<module>.schemas.ts` | Zod request/response schemas, `z.infer` types, OpenAPI registrations | `zod`, `@asteasolutions/zod-to-openapi` | Leaf. No I/O, no business logic. |

Cross-module rule: a module reaches another module only through its
**service**. Importing another module's repository, schemas-as-behavior, or
Prisma models is an architecture violation.

## Shared directories

| Directory | Contains | May import | Notes |
|---|---|---|---|
| `src/middleware/` | cross-cutting Express middleware: request id, error handler, validation, auth guard, rate limiters | `src/lib`, `src/config`, `zod` | Framework-facing. Never imports a module's service or repository except the auth guard's documented dependency on the auth service. |
| `src/lib/` | infrastructure singletons and pure helpers. Present today: `prisma.ts`, `logger.ts`, `openapi.ts`. Planned, created by the Story that first needs them: `errors.ts` (see `architecture.md` AD-6), token/hash helpers | `src/config`, third-party libs | Leaf-ish. Never imports a module. |
| `src/config/` | `env.ts` — Zod-validated environment parsing, derived config objects | `zod` only | The only file in `src/` that reads `process.env`. Leaf. |
| `src/app.ts` | Express app assembly: global middleware order, module routers, error handler last | modules' routes, `src/middleware`, `src/lib`, `src/config` | No `listen()`. No business logic. |
| `src/server.ts` | process entry: `listen`, `SIGTERM`/`SIGINT`, graceful shutdown, Prisma disconnect | `src/app.ts`, `src/lib`, `src/config` | Nothing imports this file. |
| `prisma/` | `schema.prisma` and `migrations/` | — | Schema is the source of truth for the database; migrations are append-only. |

## Dependency direction rules

- `routes → controllers → services → repositories → src/lib/prisma.ts`.
- `src/config` and `src/lib` are leaves relative to modules: they never import a
  module.
- Forbidden and treated as a Major or Critical finding depending on impact:
  `routes → repositories`, `controllers → repositories`, `controllers → Prisma`,
  `services → express`, `repositories → services`, `services → controllers`,
  any module importing another module's repository.
- No cycles between modules, and none between a module and `src/lib`. Circular
  imports are checked in the `pre-commit-checklist` Skill.

## Test placement rule

For a production file `src/modules/<module>/<module>.<layer>.ts`, its unit tests
live beside it as `<module>.<layer>.test.ts`. Integration tests that mount the
whole app with Supertest live under `tests/integration/` and are named after the
behavior they cover (`auth-register.test.ts`), not after a class.

Shared test fixtures and helpers live under `tests/support/` and are never
imported by `src/`.
