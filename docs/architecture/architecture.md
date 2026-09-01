# Architecture

Explicit architecture decisions for the Customer Portal project. These are
project decisions, not general framework advice. Skills (`impact-analyzer`,
`implementation-planner`, `express-implementor`, `design-reviewer`,
`implementation-verifier`, `security-reviewer`, `reconciliation-reviewer`) treat
this file as authoritative.

Companion documents: `module-map.md` (module ownership + dependency rules),
`api-conventions.md`, `persistence-conventions.md`, `security-conventions.md`.

## AD-1 Runtime, build & repository layout

- Node.js 24 LTS, ESM only (`"type": "module"`), TypeScript 5.9 with
  `strict: true` and `noUncheckedIndexedAccess: true`.
- Single npm package (`customer-portal`). No monorepo, no workspaces, no second
  build target without an approved decision.
- Production code under `src/`. Tests live beside the code they cover
  (`*.test.ts`) or under `tests/` for cross-module integration suites — see
  AD-9.
- Module resolution is `NodeNext`: every relative import carries the `.js`
  extension (`./auth.service.js`), even from a `.ts` source. Built-ins use the
  `node:` protocol.
- Build is `tsc -p tsconfig.json` into `dist/` — it compiles `src` only and
  excludes `*.test.ts` and `tests/`, so no test file ships in `dist/`.
  Type-checking uses `tsconfig.typecheck.json` (`noEmit`), which additionally
  covers `tests/` and the tooling configs. Local dev runs through `tsx`.
  `dist/` is never committed.

```text
src/
  modules/{auth,users}/    # <module>.{routes,controller,service,repository,schemas}.ts
  middleware/
  lib/
  config/
  app.ts                   # Express app assembly (no listen)
  server.ts                # process entry: listen, signals, graceful shutdown
prisma/
```

`products`, `orders`, `support` are placeholders in `docs/product/product-vision.md`
only. Do not create those directories until the corresponding module is
actually requested.

## AD-2 Layered architecture

```text
routes → controllers → services → repositories → database
```

| Layer | File | Responsibility | Must not |
|---|---|---|---|
| routes | `<module>.routes.ts` | path/method wiring, middleware composition (validation, auth, rate limit) | contain business rules; import Prisma; build response bodies beyond delegating |
| controllers | `<module>.controller.ts` | translate validated HTTP input into a service call, map the service result to status code + DTO | contain business rules; import Prisma; call another controller |
| services | `<module>.service.ts` | all business logic, orchestration, transaction boundaries, entity → DTO mapping | import `express` types (`Request`/`Response`/`NextFunction`), cookies, or headers; call a controller |
| repositories | `<module>.repository.ts` | all Prisma access, queries, persistence-level constraints | contain business rules; call a service |
| schemas | `<module>.schemas.ts` | Zod request/response schemas — the single source of truth for validation and OpenAPI | contain business logic or database access |

Allowed dependency directions: `routes → controllers → services → repositories`.
Everything else in that set is forbidden (`routes → repositories`,
`controllers → repositories`, `repositories → services`, `services → controllers`).

### Why this shape

- Business logic outside routes/controllers means services can be unit-tested
  without starting Express.
- Repositories as the only Prisma access point means the data layer can be
  mocked or replaced without touching business logic.
- Services free of Express types keeps them reusable from a future queue worker
  or CLI, not just from HTTP.

### Enforcement

- The constraints above are non-negotiable and are checked at
  `IMPLEMENTATION_VERIFICATION` and `RECONCILIATION`.
- The import rules are enforced mechanically by `eslint.config.js`, using core
  `no-restricted-imports` / `no-restricted-properties` with one block per layer.
  `npm run lint` fails with the architecture rule that was broken.
  `eslint-plugin-boundaries` was evaluated and dropped: its dependency rules
  only fire between different *elements* (folders), so with one folder per
  module it cannot see `route -> repository` at all.
- Circular dependencies between modules are checked as part of the
  `pre-commit-checklist` Skill.

## AD-3 Transaction boundary policy

- Transactions begin and end in the **service** layer, via `prisma.$transaction`.
- A repository method never opens a transaction of its own; it accepts an
  optional transactional Prisma client so a service can compose several
  repository calls into one atomic operation.
- Routes and controllers never touch transactions.
- Any operation that writes to more than one table, or that reads-then-writes
  under a uniqueness rule, runs inside a transaction.

## AD-4 DTO / persistence boundary

- Every API request body, params, query, and relevant header/cookie set binds to
  a Zod schema in `<module>.schemas.ts`.
- Every API response body is a DTO defined as a Zod schema in the same file;
  the TypeScript type is derived with `z.infer`, never hand-written in parallel.
- Prisma model objects never appear in a controller signature, a request body,
  or a response body.
- Mapping persistence record ↔ DTO happens in the service layer. A mapper
  function in the module is allowed; a mapping library is not added without an
  approved decision.
- A response DTO contains only the fields the API contract lists. Credential
  fields (`passwordHash`, tokens) are never present, not even as `null`.

## AD-5 Validation boundary

- Request-shape validation (required, length, format, allowed values) is Zod at
  the HTTP boundary, applied by shared validation middleware in
  `src/middleware/`. Services receive already-validated, typed input.
- Unknown properties on a request body are rejected, not silently stripped.
- Business-rule validation (uniqueness, cross-field rules, state checks) lives in
  the service layer, before persistence, and is additionally enforced by a
  database constraint where the rule is an invariant (see
  `persistence-conventions.md` PC-4).
- Validation is server-side and independent of any client.
- TypeScript types are not runtime validation and never substitute for it.

## AD-6 Error handling architecture

- One centralized error middleware (`src/middleware/errorHandler.ts`) is the
  single place that maps errors to HTTP responses. It is registered last in
  `app.ts`.
- **Domain error taxonomy — decided** by a human on 2026-09-01. `src/lib/errors.ts`
  declares one abstract `DomainError` base and one subclass per failure
  *semantic*, not per feature: `ValidationError`, `UnauthorizedError`,
  `ForbiddenError`, `NotFoundError`, `ConflictError`. A new subclass requires a
  new failure semantic the table below does not already cover — not a new
  message.
- Every `DomainError` carries a stable `code` string, which is what reaches the
  client as `error.code` (`api-conventions.md` AC-6). The service supplies it at
  the throw site (`new ConflictError('EMAIL_ALREADY_REGISTERED')`), and its value
  comes from the Story's approved API design — never invented while coding. The
  class decides the status; the code tells the client *which* conflict.
- Services throw them; they carry no HTTP types and no status number. The
  middleware owns the class-to-status mapping below.
- **`src/lib/errors.ts` does not exist yet.** The first Story that needs a domain
  error creates it with the base and the subclasses that Story actually throws;
  the rest are added when first needed. Until then, do not import from it.
- The handler maps: Zod validation failure → `400`; domain "unauthenticated" →
  `401`; "forbidden" → `403`; "not found" → `404`; "conflict/duplicate" → `409`;
  unsupported media type → `415`; anything unmapped → `500`.
- Express 5 forwards rejected promises from async handlers to this middleware
  automatically; do not wrap handlers in try/catch to build error responses.
- Every error response body uses the structure in `api-conventions.md` (AC-6).
  What must never appear in one is the single list in
  `security-conventions.md` SC-9 — authoritative there, not restated here.

## AD-7 Configuration boundaries

- All environment access happens in `src/config/env.ts`, which parses
  `process.env` with Zod at startup and fails fast on missing/invalid values.
  No other file in `src/` reads `process.env`.
- Framework wiring (helmet, cors, rate limit, body limits, `trust proxy`,
  request id, logging) lives in `app.ts` and `src/middleware/`.
- Infrastructure singletons (`PrismaClient`, the Pino logger) live in `src/lib/`
  and are created exactly once.
- No business logic in configuration modules.
- Settings come from environment variables only; secrets are never committed
  (see `security-conventions.md`).

## AD-8 Reuse over duplication

Before creating a component, check for an existing one that can be extended
within these rules. A new module, or a new abstraction layer beyond
routes/controllers/services/repositories, requires an approved decision — an
Open Decision resolved by a human, not a silent addition, and a justification in
the PR description.

## AD-9 Test placement

- Unit tests for a module sit next to the source: `src/modules/auth/auth.service.test.ts`.
- Integration/API tests that mount the Express app with Supertest live under
  `tests/integration/`.
- `app.ts` MUST stay free of `listen()` so tests can mount the app without
  binding a port; `server.ts` owns `listen` and graceful shutdown.
- Test files never contain production logic and are never imported by `src/`.
- Tests are type-checked (`npm run typecheck` covers `tests/`) but never
  compiled into the build output.
- The runner configuration (UTC clock, shuffled file order, mock reset, the
  `NODE_ENV` guard) lives in `vitest.config.ts` and `tests/support/setup.ts`;
  `tests/README.md` documents what it enforces.
- Integration tests run serially against a disposable Postgres
  (`persistence-conventions.md` PC-1). Unit tests stay parallel and never touch a
  database.
