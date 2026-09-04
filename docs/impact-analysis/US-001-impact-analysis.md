---
artifact_type: impact_analysis
story: US-001
version: 2
status: DRAFT
created_at: 2026-09-02T21:34:24Z
updated_at: 2026-09-02T21:55:20Z
produced_by: impact-analyzer
inputs:
  - path: docs/stories/US-001-register-customer.md
    version: null
  - path: docs/specifications/US-001-spec.md
    version: 14
  - path: docs/reviews/specifications/US-001-spec-review.md
    version: 11
  - path: docs/designs/api/US-001-api-design.md
    version: 2
  - path: docs/designs/api/US-001-openapi.yaml
    version: 2
  - path: docs/designs/database/US-001-db-design.md
    version: 2
  - path: docs/designs/database/US-001-entity-model.md
    version: 1
  - path: docs/reviews/designs/US-001-design-review.md
    version: 2
  - path: docs/decisions/US-001-open-decisions.md
    version: 7
supersedes: null
analysis_mode: TYPE_CHECKED
---

# Impact Analysis: Customer Registration (US-001)

Predictive. It states where this Story is expected to land in the repository as
it stands today, not what was changed — Reconciliation records that later.

# 1. Executive Summary

**Purpose.** Deliver `POST /api/v1/auth/register`: one public, rate-limited,
unauthenticated endpoint that creates a single `User` row with an Argon2id
password hash and the role `CUSTOMER`, returns a four-field DTO, and emits one
audit event.

**Expected scope — larger than the endpoint, and that is decided, not drift.**
This is the first Story of the product. Every file under `src/` is a one-line
placeholder except `src/lib/openapi.ts`, and `prisma/schema.prisma` holds two
comment lines with no `datasource`, no `generator` and no model — all verified by
reading each file. So the Story also carries the project's first Prisma model and
migration, its application bootstrap and process entry point, its configuration
boundary, its error taxonomy, and the PC-1 test-database setup. That scope was
confirmed by a human on 2026-09-01 and is recorded in specification FR-19 and
§5 of the clarification report.

**Affected architectural areas.** The `auth` module (routes, controller, service,
schemas), the `users` module (service, repository — it owns the `User` record per
BR-6 and exposes no endpoint here), all four shared directories
(`src/middleware/`, `src/lib/`, `src/config/`, `prisma/`), the app assembly and
process entry, the test tree, and six repository-level tooling and documentation
files.

**Overall risk: Medium.** No architectural boundary is crossed, no new module or
abstraction layer is required, and the dependency set is already installed and
approved. The risk is concentrated in three places, each with a named trigger
below: a documented class-list discrepancy that outranks the design that is right
(R-1); a Prisma 7 connection mechanism that the persistence convention predates
and that pulls two build-tooling files into scope which no approved artifact
names (R-2, R-3); and two Zod error-mapping behaviours that produce a
contract-violating response if implemented the obvious way (R-4).

**Three impacts surfaced here that no approved artifact names.** All three were
confirmed by execution, not by reading, and all three land on
`IMPLEMENTATION_PLANNING`: `tsconfig.typecheck.json` and `.gitignore` are in the
change surface (§6, §11), and `npm run lint` fails outright on an unregistered
root-level TypeScript file (R-2).

# 2. Source Artifacts

| Artifact | Path | Version | Status |
|---|---|---|---|
| Story | `docs/stories/US-001-register-customer.md` | — | active |
| Specification | `docs/specifications/US-001-spec.md` | 14 | `APPROVED`, past `HUMAN_SPEC_APPROVAL` |
| Specification review | `docs/reviews/specifications/US-001-spec-review.md` | 11 | `APPROVED`, verdict `PASS` |
| API design | `docs/designs/api/US-001-api-design.md` | 2 | `DRAFT`, accepted by design review v2 |
| OpenAPI contract | `docs/designs/api/US-001-openapi.yaml` | 2 (`info.version`) | accepted by design review v2 |
| Database design | `docs/designs/database/US-001-db-design.md` | 2 | `DRAFT`, accepted by design review v2 |
| Entity model | `docs/designs/database/US-001-entity-model.md` | 1 | `DRAFT`, accepted by design review v2 |
| Design review | `docs/reviews/designs/US-001-design-review.md` | 2 | `APPROVED`, verdict `PASS` (0 Critical, 0 Major, 5 Minor) |
| Open decisions | `docs/decisions/US-001-open-decisions.md` | 7 | all twelve entries `RESOLVED` |

Conventions read in full: `architecture.md` (AD-2, AD-4, AD-5, AD-6, AD-7, AD-9),
`module-map.md`, `api-conventions.md` (AC-1…AC-12), `persistence-conventions.md`
(PC-1…PC-10), `security-conventions.md` (SC-1…SC-9), `business-rules.md`,
`business-glossary.md`, `non-functional-requirements.md`, `AGENTS.md`.

Repository state read directly: every file under `src/` and `prisma/`,
`package.json`, `tsconfig.json`, `tsconfig.typecheck.json`, `vitest.config.ts`,
`eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `.gitignore`,
`.env.example`, `.github/workflows/ci.yml`, `scripts/generate-openapi.ts`,
`docs/api/openapi.json`, `tests/`.

# 3. Business Capability Impact

| Capability | Impact | Notes |
|---|---|---|
| Self-service account creation | **Introduced** | The first capability of the product; EPIC-1's entry point |
| Email uniqueness per account | **Introduced** | BR-001 / BR-1, enforced twice — service check and database constraint |
| Credential storage | **Introduced** | Argon2id hash only; the store US-002's sign-in will verify against |
| Role assignment | **Introduced** | `CUSTOMER` only; no permission model (SC-2) |
| Security audit trail | **Introduced** | One event, `{ event: "user.registered", userId, requestId }`, after commit, best-effort |
| Request correlation | **Introduced** | Request id on the response and every log line (AC-9, NFR-010) |
| Authentication / session | **Not touched** | Registration issues no token and sets no cookie (BR-4) |
| Profile management | **Not touched** | US-003 / US-004, with their own migration |

Confidence: **HIGH** — every row traces to a numbered requirement in an
`APPROVED` Specification.

# 4. Module Impact

| Module / directory | Impact | Rationale | Confidence |
|---|---|---|---|
| `src/modules/auth/` | **Modify** (placeholders → first implementation) | Owns the endpoint, the registration orchestration, the request/response schemas and the password policy's single expression (FR-1, FR-22, VR-8) | HIGH |
| `src/modules/users/` | **Modify** (service + repository only) | Owns the `User` record; `auth` reaches it through `users.service.ts` (BR-6, glossary, `module-map.md` cross-module rule) | HIGH |
| `src/middleware/` | **Modify** + **Create** | `errorHandler.ts` and `requestId.ts` exist as placeholders; boundary validation and the rate-limit factory are new files whose names no convention fixes | HIGH (that it is affected) / LOW (on filenames) |
| `src/lib/` | **Modify** + **Create** | `prisma.ts` and `logger.ts` are placeholders; `errors.ts` and the hashing helper are new; `openapi.ts` is reused unchanged | HIGH |
| `src/config/` | **Modify** | `env.ts` becomes the only reader of `process.env` and holds the Argon2id constants (AD-7, SC-1, SR-2) | HIGH |
| `prisma/` | **Modify** + **Create** | First `datasource`, `generator`, `Role` enum and `User` model; first migration directory | HIGH |
| `src/app.ts`, `src/server.ts` | **Modify** | App assembly and process entry, both one-line placeholders today (FR-14, FR-20, AD-9) | HIGH |
| `tests/` | **Modify** + **Create** | Unit tests beside the source, integration tests, the PC-1 truncation fixture and `globalSetup` | HIGH |
| Repository tooling | **Modify** | `package.json`, `vitest.config.ts`, `.github/workflows/ci.yml`, `AGENTS.md`, `.env.example`, `docs/api/openapi.json`, and — newly identified here — `tsconfig.typecheck.json` and `.gitignore` | HIGH except the last two (MEDIUM, see §13) |
| `src/modules/products\|orders\|support` | **No Change** | Out of scope (`AGENTS.md` Active Scope). No such directory exists and none is created | HIGH |

**No new module, no new shared directory, and no new abstraction layer is
required.** Every responsibility this Story introduces has a home that
`module-map.md` already names — including the two `src/lib/` files, which that
document lists as "created by the Story that first needs them". Nothing here
triggers the AD-8 justification requirement.

# 5. Layer Impact

| Module / layer | Responsibility this Story gives it | Impact | Architecture constraint that applies |
|---|---|---|---|
| `auth` / routes | Mount `POST /api/v1/auth/register`; compose boundary validation and the controller | Modify | No business logic, no Prisma; may import its own controller, shared middleware, its own schemas |
| `auth` / controller | Validated request → service call → success DTO | Modify | No business logic, no Prisma, no other module's controller; no `try/catch` to build error bodies (AC-12) |
| `auth` / service | Orchestration: call the hashing helper, call `users.service.ts`, emit the audit event, throw typed domain errors | Modify | No Express types, no Prisma; **may** import another module's service — the one cross-module edge `module-map.md` permits |
| `auth` / schemas | Zod request/response schemas, the single expression of the SC-1 password policy, OpenAPI registration | Modify | Leaf: no I/O, no business logic; imports `zod` and `zod-to-openapi` only |
| `auth` / repository | **Not touched** | No Change | `auth` persists nothing of its own until refresh tokens (BR-6). The file stays a placeholder |
| `users` / service | Uniqueness check + insert as one transactional operation; raises the conflict error | Modify | Owns the transaction (PC-9, AD-3, BR-5); no Express types |
| `users` / repository | The only Prisma access to `User`: `findUnique` by email selecting `id`; `create` selecting the four response fields | Modify | Prisma only here; accepts an optional transactional client; never imports a service (PC-8, PC-9) |
| `users` / controller, routes | **No Change** | No Change | `users` exposes no endpoint in this Story |
| `users` / schemas | Undetermined | **Unknown** | Specification names the row so the design decides rather than discovers; the repository may take its types from the Prisma client, which `module-map.md` permits |
| `middleware` / error handler | Map `ZodError` + the `DomainError` subclasses to AC-6 bodies; sole owner of VR-11's `fieldErrors` shape; generic `500` otherwise | Modify | Registered **last** in `app.ts`; the single mapping site (AD-6, AC-12); no Prisma |
| `middleware` / request id | Reuse a trusted inbound `X-Request-Id`, set the response header, put the id on every log line | Modify | Must be mounted **ahead of the rate limiter** — see R-5 |
| `middleware` / boundary validation | `Content-Type` check producing `415`, then Zod application so services receive typed input | Create | AD-5: validation is applied by shared middleware, never by a controller calling `schema.parse()` inline |
| `middleware` / rate limiting | `express-rate-limit` factory, mounted on `/api/v1/auth`, with a custom handler calling `next(new TooManyRequestsError(...))` | Create | SC-3 fixes the shape and the mount point; AD-6 fixes the carrier |
| `lib` / errors | `DomainError` base + **five** subclasses (see R-1) | Create | Leaf; never imports a module |
| `lib` / password hashing | Wrap `argon2`, apply the SC-1 cost parameters from the config boundary on every call | Create | `src/lib/` may import `src/config` and third-party libraries, never a module. `auth.service.ts` calls it rather than importing `argon2` (FR-24) |
| `lib` / prisma | The single `PrismaClient`, now constructed with a driver adapter | Modify | PC-1: exactly one instance, exported here; nothing else constructs a client |
| `lib` / logger | Pino with redaction configured on the logger | Modify | SC-9: Pino only, redaction not left to call-site discipline |
| `config` / env | Zod-validated startup parsing of six variables + Argon2id constants | Modify | The only file in `src/` that reads `process.env` (AD-7); imports `zod` only |
| `src/app.ts` | helmet, `X-Powered-By` off, CORS allow-list, `trust proxy`, `express.json({ limit: '10kb' })`, body-parser error translation, limiter mount, router mount, error handler last | Modify | No `listen()` (AD-9), no business logic |
| `src/server.ts` | `listen`, `SIGTERM`/`SIGINT`, graceful shutdown incl. Prisma disconnect | Modify | Nothing imports this file |

`eslint.config.js` encodes every constraint in this table as
`no-restricted-imports` blocks, so `npm run lint` fails on a violation and names
the rule. Two are **not** mechanically enforced and are reviewer-visible only:
BR-6's ownership rule (`auth.repository.ts` importing Prisma would pass every
check — what would be wrong is *whose* data it reads), and FR-22's ban on a
controller calling `schema.parse()` inline.

Confidence: **HIGH**. Every layer rule was read from `module-map.md` and
cross-checked against the live `eslint.config.js`.

# 6. Expected File Changes

Impact types: **Create** (no file at the path today), **Modify** (a file exists —
in most cases a one-line placeholder, so the edit is a first implementation),
**Reuse** (consumed unchanged), **No Change**, **Unknown**.

## Files To Create

| Expected path | Responsibility | Reason | Source | Confidence |
|---|---|---|---|---|
| `src/lib/errors.ts` | `DomainError` base + five subclasses | AD-6 names both the file and US-001 as the Story that creates it | FR-21; AD-6 | **HIGH** |
| `src/middleware/<boundary-validation>.ts` | `415` header check, then Zod application | FR-22 fixes the layer; no convention fixes the name | FR-22; AD-5 | HIGH on the file, **LOW on the path** |
| `src/middleware/<rate-limit>.ts` | `express-rate-limit` factory with the `TooManyRequestsError` handler | FR-23 fixes the layer; no convention fixes the name | FR-13, FR-23; SC-3 | HIGH on the file, **LOW on the path** |
| `src/lib/<password-hash>.ts` | Wrap `argon2` with the SC-1 cost parameters | FR-24 fixes the layer; no convention fixes the name | FR-24; SR-1, SR-2 | HIGH on the file, **LOW on the path** |
| `prisma.config.ts` (repository root) | The migration connection URL Prisma 7 no longer accepts in the schema | **Re-verified by execution during this analysis** — see below | db-design §"Prisma 7 changed how the connection is configured" | **HIGH** |
| `prisma/migrations/<timestamp>_<name>/migration.sql` | `CREATE TYPE Role`; `CREATE TABLE "user"`; PK; unique on `email` | PC-2: every schema change ships a committed migration | db-design §Migration; PC-2 | HIGH on existence, LOW on the name |
| `docker-compose.yml` | `db` service on port **5433** | PC-1 names the file literally | FR-19; PC-1 | **HIGH** |
| `.env.test` | Test `DATABASE_URL` | PC-1 names the file literally. **Currently git-ignored** — see §11 and R-3 | FR-19; PC-1 | **HIGH** |
| Vitest `globalSetup` (likely under `tests/support/`) | `prisma migrate deploy`; on an unreachable database, fail with the command to run | PC-1 requires it by responsibility and names no filename | FR-19; PC-1 | HIGH on the file, **LOW on the path** |
| `tests/support/<truncation-fixture>.ts` | `TRUNCATE` between tests — exactly one table, `user` | PC-1 names the directory, not the file | FR-19; PC-1; db-design §Test database | HIGH on the file, **LOW on the path** |
| `tests/integration/auth-register.test.ts` | Supertest coverage of the endpoint | `module-map.md` prescribes this exact name shape ("named after the behavior") | NFR-005, NFR-006; AD-9 | MEDIUM |
| Unit tests beside each implemented source file | Service and helper logic without Express or a database | `module-map.md` test-placement rule | NFR-005; AD-9 | MEDIUM |

**`prisma.config.ts` re-verified rather than inherited.** Running
`npx prisma validate` on a datasource block carrying `url = env("DATABASE_URL")`
against the installed Prisma 7.10.0 returns error **P1012**: *"The datasource
property `url` is no longer supported in schema files. Move connection URLs for
Migrate to `prisma.config.ts`…"*. The database design reported this; this analysis
reproduced it rather than repeating the claim. Two build-tooling consequences
follow that no approved artifact names — see `tsconfig.typecheck.json` below and
R-2.

## Files To Modify

Every `src/` path below is a one-line placeholder today, verified by reading each
file. They are classified **Modify** because the file exists; the work is a first
implementation.

| Expected path | Responsibility after the change | Source | Confidence |
|---|---|---|---|
| `prisma/schema.prisma` | `datasource` (no `url`), `generator`, `Role` enum, `User` model with `@db.Uuid`, `@db.VarChar(254)` + `@unique`, unbounded `password_hash`, `timestamptz(3)` timestamps | db-design §Model; PC-3…PC-6, PC-10 | **HIGH** |
| `src/config/env.ts` | Zod validation of exactly `NODE_ENV`, `PORT`, `LOG_LEVEL`, `DATABASE_URL`, `CORS_ALLOWED_ORIGINS`, `TRUST_PROXY`; Argon2id cost constants. **No JWT variable** | FR-18, BR-4, SR-2, SR-9; AD-7, SC-1, SC-3 | **HIGH** |
| `src/lib/prisma.ts` | One `PrismaClient`, constructed with `@prisma/adapter-pg` | PC-1; db-design §2 | **HIGH** |
| `src/lib/logger.ts` | Pino instance with redaction configured on the logger | SR-7; SC-9 | **HIGH** |
| `src/middleware/errorHandler.ts` | `ZodError` + `DomainError` → AC-6 bodies; the `fieldErrors` mapping; generic `500` | Error Handling; VR-11, AD-6, AC-12 | **HIGH** |
| `src/middleware/requestId.ts` | Inbound-id reuse, response header, log correlation | FR-15; AC-9, NFR-010 | **HIGH** |
| `src/modules/auth/auth.routes.ts` | Mount the endpoint, wire boundary validation + controller | FR-1 | **HIGH** |
| `src/modules/auth/auth.controller.ts` | Request → service → 201 DTO | FR-5, FR-11 | **HIGH** |
| `src/modules/auth/auth.service.ts` | Hash via the `src/lib` helper, call `users.service.ts`, emit the audit event, throw domain errors | FR-6, FR-7, FR-10, FR-12, FR-24; BR-6 | **HIGH** |
| `src/modules/auth/auth.schemas.ts` | Request/response Zod schemas, the password policy, OpenAPI registration incl. `minProperties: 1` on `FieldErrors` | FR-16, FR-22, VR-1…VR-6, VR-8, VR-9 | **HIGH** |
| `src/modules/users/users.service.ts` | Transactional uniqueness-check-and-insert; raises the conflict error | FR-2; BR-1, BR-5, BR-6; PC-9 | **HIGH** |
| `src/modules/users/users.repository.ts` | The two Prisma queries; `P2002` translation; selects that never include `password_hash` | BR-1, BR-6, FR-5; PC-8, PC-9 | **HIGH** |
| `src/app.ts` | helmet, CORS, `trust proxy`, `express.json({ limit: '10kb' })`, body-parser error translation, limiter mount, routers, error handler last | FR-13, FR-14, FR-23; SC-5 | **HIGH** |
| `src/server.ts` | `listen`, signal handling, graceful shutdown with Prisma disconnect | FR-20; `module-map.md` | **HIGH** |
| `vitest.config.ts` | `fileParallelism: false` scoped to `tests/integration`; register the `globalSetup`. Unit tests keep shuffling and parallelism | FR-19; PC-1 | **HIGH** |
| `package.json` | `db:test:up` / `db:test:down` scripts. No other script change | FR-19; PC-1 | **HIGH** |
| `AGENTS.md` | The two new scripts added to the Build and Validation Commands table | FR-19; PC-1 (by name) | **HIGH** |
| `.env.example` | Add the test-database placeholder; **remove** the four JWT entries | FR-18; SC-3, SC-7 | **HIGH** |
| `.github/workflows/ci.yml` | A `services: postgres` block; the "not here yet" comment block becomes stale and must go | FR-19; PC-1 | **HIGH** |
| `docs/api/openapi.json` | Regenerated by `npm run openapi:generate`, never hand-edited | FR-16; AC-10 | **HIGH** |
| `tsconfig.typecheck.json` | **Newly identified.** Its `include` must gain `prisma.config.ts`, or `npm run lint` fails — see R-2 | This analysis; verified by execution | **HIGH** (conditional on `prisma.config.ts` living at the root) |
| `.gitignore` | **Newly identified.** `.env.test` is matched by `.env.*` at line 28 and cannot be committed as written — see R-3 | This analysis; `git check-ignore -v` | **MEDIUM** (one of two resolutions; see R-3) |

## Files To Reuse

| Path | Why it is reused unchanged | Confidence |
|---|---|---|
| `src/lib/openapi.ts` | The shared registry already exists and works (22 real lines). Modules register **into** it; it is not replaced | **HIGH** |
| `scripts/generate-openapi.ts` | Already discovers `src/modules/*/*.schemas.ts` by directory scan, so a newly-populated `auth.schemas.ts` is picked up with no edit | **HIGH** |
| `tests/support/setup.ts` | The `NODE_ENV=test` guard stands; the database fixture is separate by design, as its own comment states | **HIGH** |
| `eslint.config.js` | Already encodes every layering rule this Story must satisfy, including the `src/lib/prisma.ts` and `src/config/env.ts` exemptions | **HIGH** |
| `tsconfig.json` | Build config: `rootDir: src`, `include: ["src"]`. A root `prisma.config.ts` is outside it, which is correct — it is tooling, not shipped code | **HIGH** |
| `.prettierrc.json`, `.prettierignore` | New `.ts` and `.yml` files must satisfy `npm run format:check`; `prisma/migrations/` and `*.md` are already exempt | **HIGH** |
| `.audit-allowlist.json` | Exists; `npm run audit:check` is required because `package.json` changes | **HIGH** |
| `tests/harness.test.ts` | Harness self-check, unaffected | **HIGH** |

## Files Potentially Affected

| Path | Why it may be affected | Confidence |
|---|---|---|
| `src/modules/users/users.schemas.ts` | Created only if the design needs it; the repository may take types from the Prisma client | **Unknown** — deliberately left to the plan (Specification, Affected Components) |
| `tests/README.md` | Its closing paragraph says "None of the plumbing exists yet". FR-19 makes that false, and stale documentation is a Reconciliation finding | **MEDIUM** |
| `README.md` | Not read in detail; may describe setup steps that `docker-compose.yml` and `db:test:up` change | **LOW** |
| `.github/workflows/ci.yml` header comment | The "Not here yet: database-backed integration tests" block is contradicted by this Story | **HIGH** that it needs an edit, folded into the Modify row above |
| A second Vitest config for the integration project | Only if the plan implements `fileParallelism: false` as a separate config rather than a workspace/project entry. Such a file would hit the same `tsconfig.typecheck.json` gap as R-2 | **LOW** |

## Files Explicitly Not Changed

| Path | Why |
|---|---|
| `src/modules/auth/auth.repository.ts` | `auth` persists nothing of its own until refresh tokens (BR-6). Stays a placeholder |
| `src/modules/users/users.controller.ts`, `users.routes.ts` | `users` exposes no endpoint in this Story |
| `scripts/validate-harness.py`, `scripts/validate-harness.test.py`, `docs/workflow/artifact-schema.md` | Changed only with explicit human approval (`AGENTS.md` Prohibited). Nothing in this Story needs them |
| Any `products` / `orders` / `support` path | Out of scope (`AGENTS.md` Active Scope) |

# 7. API Impact

**One new operation. No existing operation changes, because none exists** —
`docs/api/openapi.json` currently has `"paths": {}`, verified by reading it. There
is therefore no compatibility concern and no versioning question: `/api/v1` is
introduced, not amended (AC-1).

| Aspect | Impact |
|---|---|
| Path / method | `POST /api/v1/auth/register` — new. The `/auth/` verb path is AC-3's deliberate exception |
| Auth | Public. **No security scheme is declared document-wide**, because this Story issues no JWT (BR-4). SC-4's deny-by-default requirement is met by the operation being listed as public in the approved design |
| Request | `RegisterRequest`: exactly `email` and `password`, `additionalProperties: false` (VR-9's contract form). `email` `format: email`, `minLength: 1`, `maxLength: 254`; `password` `writeOnly`, 12–128 |
| Success | `201` + `RegisterResponse` — exactly `id` (uuid string), `email`, `role` (`const: CUSTOMER`), `createdAt` (ISO 8601 UTC); `additionalProperties: false`. **No `Location` header** |
| Response header | `X-Request-Id`, `required: true` on **every** response including the `429` — the constraint behind R-5 |
| Errors | Seven declared responses: `400` (two codes via `oneOf`), `409`, `413`, `415`, `429`, `500` |
| Contract source | Generated from Zod via `src/lib/openapi.ts`; `npm run openapi:check` gates drift against `docs/api/openapi.json` |

**Error codes are contract, assigned by API_DESIGN, and inventing one during
implementation is a finding** (AC-6): `VALIDATION_FAILED`, `MALFORMED_JSON`,
`EMAIL_ALREADY_REGISTERED` (pre-decided), `PAYLOAD_TOO_LARGE`,
`UNSUPPORTED_MEDIA_TYPE`, `RATE_LIMIT_EXCEEDED`, `INTERNAL_ERROR`.

**Five OpenAPI generation obligations the contract states and the generator will
not supply on its own**, each a `.openapi()` metadata call in `auth.schemas.ts`:
`additionalProperties: false` on both closed objects (Zod strict mode, not the
default); `writeOnly` on `password`; the `const` values on `role` and on every
`code`; **`minProperties: 1` on `FieldErrors`** — which a Zod record does not emit
by itself, and whose absence silently re-admits the empty-`fieldErrors` response
design review `d-2` was raised about; and the `X-Request-Id` response header as a
registered component header. A module that registers only the `201` produces a
document that silently disagrees with the approved contract.

**One expected non-match that is not a defect.** `npm run openapi:check` compares
the generated document against the committed `docs/api/openapi.json` and neither
against `US-001-openapi.yaml`. `info.version` differs by design (the generated
document carries the `package.json` version, `0.1.0`), and design review `d-4`
predicts a second: a Zod pipeline that trims and lowercases before validating may
not render as a plain `string` with `format` and bounds. Comparison against the
approved contract is **semantic**, and it is `IMPLEMENTATION_VERIFICATION`'s.

Confidence: **HIGH** — the contract was read in full and the generator script was
read to confirm how registration reaches the document.

# 8. Persistence Impact

**The project's first model, first migration and first datasource.**
`prisma/schema.prisma` today is two comment lines; `prisma/migrations/` does not
exist. Both verified by listing the directory.

| Concern | Impact |
|---|---|
| Model | One: `User` → table `user` (PC-5) |
| Enum | `Role`, exactly one member `CUSTOMER` |
| Columns | `id uuid` PK (`@db.Uuid`, client-generated via `@default(uuid())`, **no database default**); `email varchar(254)` `UNIQUE`; `password_hash text` unbounded (the one PC-4 exemption, PC-10); `role Role` default `CUSTOMER`; `created_at`/`updated_at` `timestamptz(3)` |
| Nullability | Every column `NOT NULL` |
| Indexes | Two, both implicit: PK on `id`, unique index on `email`. **No hand-added index** — PC-7 forbids duplicating one a `@unique` already provides |
| Relations | None. `User` is the only model |
| Repository behaviour | `findUnique` by email selecting `id` only; `create` selecting exactly the four response fields. Both accept an optional transactional client and neither opens its own transaction (PC-9) |
| Migration | One, additive: `CREATE TYPE`, `CREATE TABLE`, PK, unique constraint. Nothing dropped or narrowed, so PC-2's destructive-migration rule and SC-8 do not apply |
| Data migration / backfill | **None.** There is no existing data and no existing table |

**Three persistence behaviours that are design obligations, not implementation
detail:**

1. **`timestamptz(3)` must be declared explicitly.** Prisma's default mapping for
   `DateTime` on PostgreSQL is `timestamp(3)` *without* a time zone — so omitting
   the annotation produces a column that violates PC-6 while the schema still
   reads correctly.
2. **The `P2002` unique violation must be translated into the same
   `ConflictError('EMAIL_ALREADY_REGISTERED')` the service check produces**, caught
   where Prisma is visible. If it reaches the error middleware as a Prisma error,
   AD-6 maps only `ZodError` and `DomainError` and the client gets a `500` where
   the contract declares a `409`. Nothing from that error — message, `P2002`, or
   the constraint name — may reach the body or a log line (SC-9, SR-6).
3. **The transaction does not, by itself, prevent the race.** Under READ
   COMMITTED both concurrent registrations can find no row and both attempt an
   insert; the constraint is what stops the duplicate. That is why BR-1 requires
   both, and it is what makes obligation 2 load-bearing rather than defensive.

**The truncation fixture has exactly one table to clear**, `user`. No dependent
table to cascade to and no sequence to reset, because `id` is a client-generated
UUID.

Confidence: **HIGH** for the model and constraints (design read in full, and
`prisma/` inspected directly). **HIGH** for the `prisma.config.ts` requirement —
re-verified by running `npx prisma validate`.

# 9. Security Impact

| Area | Impact |
|---|---|
| Authentication | **None introduced.** No token issued, no cookie set, no session (BR-4). The endpoint is public and that is recorded in the approved design, which is how SC-4's deny-by-default is satisfied |
| Authorization | **None.** One role, `CUSTOMER`, assigned by default. No permission model, no role parameter accepted from the client |
| Password handling | Argon2id with `memoryCost: 19456`, `timeCost: 2`, `parallelism: 1` passed **explicitly on every call** — library defaults are forbidden because "the current default" moves between releases. The parameters are constants in `src/config/env.ts`, never environment variables, so no environment can weaken hashing |
| Password policy | 12–128 code points, 3 of 4 character classes, every printable character accepted. Expressed **once**, as the Zod schema in `auth.schemas.ts` — never as an OpenAPI `pattern`, never in the service, never as an env var |
| Sensitive data | `password_hash` is selected by no query on this path and appears in no response schema — structural, not a promise about a mapper. The plaintext exists only in the inbound body |
| Data exposure | `additionalProperties: false` on `RegisterResponse` makes AC-006 a contract obligation. The duplicate-email disclosure is **decided behaviour** (BR-009, BR-3) and a review asking for it to be genericized is answered by that rule, not by a code change |
| Timing | The duplicate path **short-circuits without hashing** (FR-7). SC-3 decided this explicitly and forbids "hardening" it into constant-time behaviour without a new approved decision |
| Rate limiting | 10 requests per hour per IP on `POST /auth/register`, via one factory mounted on `/api/v1/auth`. **The Story must not invent limits for `login`, `refresh` or `logout`**, and must not apply the register number to routes it does not create |
| Client-IP integrity | `TRUST_PROXY` is an explicit hop count (`0` local/CI, `1` production). Blanket `trust proxy: true` is forbidden — it lets a caller spoof the IP the limit counts, which disables rate limiting silently |
| Logging | Pino only; `no-console` is `error` for `src/**` in `eslint.config.js`. Redaction configured on the logger. The audit event carries `event`, `userId`, `requestId` and **no personal data** — not the email, not the IP |
| Configuration | `src/config/env.ts` is the only reader of `process.env`, enforced by `no-restricted-properties` scoped to `src/**/*.ts`. `.env` stays uncommitted |
| Dependencies | **No new dependency.** All the runtime packages the Story needs are already declared and installed, `@prisma/adapter-pg` 7.10.0 included |
| Hardening | helmet on, `X-Powered-By` off, explicit CORS allow-list, explicit `10kb` body limit |

**The adapter is approved — do not re-raise it at the gate.** Database design
revision 1 recorded `@prisma/adapter-pg` as an unapproved new dependency requiring
a decision at `HUMAN_PLAN_APPROVAL`. That is stale and was corrected at its source
by db-design v2. Re-verified here: commit **`0339b4a`** (author `KShust`,
2026-09-02, *"chore(deps): add the Prisma PostgreSQL driver adapter"*) declares it
pinned at `7.10.0`, `pg` 8.23.0 arrives transitively, and both are present in
`node_modules`. `IMPLEMENTATION_PLANNING` **cites `0339b4a`; it does not carry the
question to the gate.**

Confidence: **HIGH**. Every claim traces to a convention read in full; the
dependency and commit claims were verified by running `git show` and reading
`package.json` and `node_modules`.

# 10. Testing Impact

Every Acceptance Criterion must be covered by at least one test (NFR-006), and
`tests/integration/` is empty today.

| Category | Expected coverage | AC |
|---|---|---|
| Integration — happy path | `201`, four-field body, `role: CUSTOMER`, `X-Request-Id` present, row persisted | AC-001 |
| Integration — duplicate | `409` `EMAIL_ALREADY_REGISTERED`; no second row; **and the same response via the `P2002` path**, so the two are indistinguishable | AC-002, EC-3 |
| Integration — email validation | Bad format, `>254` characters, missing, non-string; `details.fieldErrors.email` populated | AC-003, EC-8, EC-5 |
| Integration — password policy | Below 12, above 128, fewer than 3 classes, boundary values at exactly 12 and 128, Unicode counted in code points | AC-004, EC-6 |
| Integration — request envelope | Unknown property `400` **keyed by the offending property name**; `415` on a body with a wrong/missing `Content-Type`; `413` over `10kb`; `MALFORMED_JSON` on unparseable input | VR-9, VR-10 |
| Integration — **the three converging shapes** | Body `[]`; bodyless POST **with** `application/json`; bodyless POST **with no** `Content-Type`. See below — this is design review `e-2` | e-2 |
| Integration — rate limit | `429` with the **AC-6 body** (not the limiter's plain-text default), no account created, no password hashed | FR-13, EC-7 |
| Integration — contract | Every declared response shape matches the approved contract, `minProperties: 1` included | AC-10, FR-16 |
| Security | No `password` or `password_hash` in any response body; no Prisma text, code or constraint name in the `409` body or in a log line | AC-005, AC-006, SR-4, SR-6 |
| Persistence | Stored value is the **normalized** email (trimmed, lowercased); case- and whitespace-differing duplicates rejected; hash is Argon2id and never plaintext | AC-005, EC-1, EC-2 |
| Audit | A log line `{ event: "user.registered", userId, requestId }` after commit, carrying no email and no IP; **and that a failed audit write does not fail the request** | AC-007, EC-4 |
| Unit | Service orchestration without Express or a database; the hashing helper applies all three SC-1 parameters; the error middleware's `ZodError` → `fieldErrors` mapping | AD-9 |

**`e-2` in one sentence, because it is the coverage trap of this Story:** three
request shapes reach the same `400` through **two different Zod mechanisms** — `[]`
and a bodyless POST *without* a content type both produce one root-path
`invalid_type` issue, while a bodyless POST *with* `application/json` arrives as
`{}` and produces two per-field issues. A suite covering only the third exercises
the per-field path and proves nothing about the root-path mapping that R-4 is
about. **Cover all three.**

**Test infrastructure is part of this Story** (FR-19): compose file, `.env.test`,
`globalSetup` running `prisma migrate deploy` with a helpful failure message,
truncation fixture, serial execution for `tests/integration`, and the CI service
block. Without it AC-002 and AC-005 have no database to be tested against, so
NFR-005 and NFR-006 cannot be satisfied at all.

Confidence: **HIGH** on what must be covered; **MEDIUM** on file names and the
integration-project mechanism.

# 11. Configuration and Dependency Impact

## Environment variables

| Variable | Action | Source |
|---|---|---|
| `NODE_ENV`, `PORT`, `LOG_LEVEL`, `DATABASE_URL` | Validated in `src/config/env.ts`; already in `.env.example` | FR-18 |
| `CORS_ALLOWED_ORIGINS`, `TRUST_PROXY` | Validated; already in `.env.example` with the SC-5 values | FR-18; SC-5 |
| Test-database placeholder | **Added** to `.env.example`, paired with `.env.test` | FR-19; PC-1 |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL` | **Removed** from `.env.example`; none enters `src/config/env.ts` | FR-18; BR-4, SC-3 |

The four JWT entries are present in `.env.example` today, verified by reading it,
so FR-18 is an edit rather than an addition. The removal was flagged for
`HUMAN_SPEC_APPROVAL` twice and answered at the second gate; it is decided, not
tacit.

## Dependencies

**No `package.json` dependency change is expected.** Every library the Story needs
is already declared and installed: `express` 5, `@prisma/client` 7.10.0,
`@prisma/adapter-pg` 7.10.0, `pg` 8.23.0 (transitive), `argon2`, `zod` 4,
`@asteasolutions/zod-to-openapi`, `helmet`, `cors`, `express-rate-limit` 8.7.0,
`pino`, `pino-http`, and `supertest`/`vitest` for tests. SC-6 and SR-10 are
therefore not triggered.

`package.json` still changes — the `db:test:up` / `db:test:down` **scripts** — so
`npm run audit:check` is a required check for this Story under the
`AGENTS.md` Definition of Done.

## Runtime and middleware wiring (`src/app.ts`)

helmet; `X-Powered-By` disabled; CORS from the allow-list; explicit `trust proxy`
hop count; `express.json({ limit: '10kb' })`; the body-parser error translation
immediately after it; the rate limiter mounted on `/api/v1/auth`; module routers;
the error handler **last**. Ordering is constrained by R-5.

## Build tooling — two files no approved artifact names

1. **`tsconfig.typecheck.json` must include `prisma.config.ts`.** Its `include` is
   `["src", "tests", "scripts", "vitest.config.ts", "eslint.config.js"]`, and
   `eslint.config.js` sets `parserOptions.project` to that same file. Verified by
   execution: a root-level `.ts` file that is not in the program makes
   `npm run lint` fail with *"The file was not found in any of the provided
   project(s)"*. See R-2.
2. **`.gitignore` currently excludes `.env.test`.** `git check-ignore -v
   .env.test` resolves to `.gitignore:28` (`.env.*`, with only `!.env.example`
   re-included). See R-3.

`tsconfig.json` (build) needs no change: `rootDir: src` and `include: ["src"]`
correctly leave root tooling out of `dist/`.

Confidence: **HIGH** — every claim in this section was verified by reading the
file or running the command, not inferred.

# 12. Documentation Impact

| Document | Expected update | Confidence |
|---|---|---|
| `.env.example` | Test-database placeholder in, four JWT entries out (FR-18, FR-19) | HIGH |
| `AGENTS.md` | `db:test:up` / `db:test:down` added to the Build and Validation Commands table — PC-1 requires this **by name** | HIGH |
| `docs/api/openapi.json` | Regenerated; never hand-edited | HIGH |
| `tests/README.md` | Its "None of the plumbing exists yet" paragraph becomes false | MEDIUM |
| `.github/workflows/ci.yml` header comment | Its "Not here yet: database-backed integration tests" block becomes false | HIGH |
| `README.md` | May describe setup that the compose file and new scripts change | LOW |
| `docs/architecture/persistence-conventions.md` PC-1 | **Predates Prisma 7.** It describes neither the required adapter object nor the separate migration config file. Amending a convention is a human decision, recorded here, not made here | HIGH that the gap is real |
| `docs/architecture/architecture.md` AD-7 | Only if the plan resolves the `prisma.config.ts` question by narrowing AD-7's wording to `src/` — see R-2 | MEDIUM, conditional |
| `docs/specifications/US-001-spec.md` | Stale on the domain-error class list in two places — see R-1. **Not revised by this Story**; the reasoning is in §14 | HIGH that it is stale |

# 13. Risks

## R-1 — Major. The Specification says four domain-error classes; the canonical convention says five, and the Specification outranks the designs

**Affected area.** `src/lib/errors.ts`, `src/middleware/errorHandler.ts`, the
rate-limit middleware, the `429` response.

**Description.** `architecture.md` AD-6, as amended by commit `fa21f62` (author
`KShust`, 2026-09-02), names **five** subclasses for US-001 to create:
`ConflictError`, `UnsupportedMediaTypeError`, `PayloadTooLargeError`,
`ValidationError` and `TooManyRequestsError`. Specification v14 says **four**, in
two places — FR-21, whose exclusion list reads as exhaustive and never mentions
`TooManyRequestsError`, and the Affected Components row for
`src/middleware/errorHandler.ts`, which says "the four domain-error classes FR-21
creates". This is design review v2's finding `e-1`, and it is addressed to this
stage.

**Trigger.** An implementer follows the `AGENTS.md` order of authority literally,
where the approved Specification ranks **above** the approved API and database
designs, and creates four classes.

**Consequence.** There is no carrier for the `429`. The limiter is then either
left at its defaults — `express-rate-limit` 8.7.0's default handler sets the
status, writes its own plain-text payload and never calls `next`, so the error
middleware never sees it — producing a body that violates AC-6 and the approved
contract's `429` schema; or a class is invented during implementation, which AC-6
makes a finding in itself. Either way this is `d-1` reappearing one layer further
down, after the design work that closed it.

**Mitigation, and it must be explicit rather than assumed.**
`IMPLEMENTATION_PLANNING` states in the plan, in as many words, that **AD-6's
five-class list is authoritative** and that `src/lib/errors.ts` creates five
subclasses — so `IMPLEMENTATION` never has to choose between two approved
documents on its own. An integration test asserting the AC-6 body on the `429`
is the detection net if the mitigation is missed.

**Human decision required: no** — but see §14 for why the loop-back to
`SPECIFICATION` was considered and deliberately not taken. The severity here is
the *risk to the delivery*; the design review's `Minor` was a classification of
the *artifacts under review*, and both are correct on their own axis.

## R-2 — Major. A root-level `prisma.config.ts` breaks `npm run lint` unless `tsconfig.typecheck.json` is updated

**Affected area.** `prisma.config.ts`, `tsconfig.typecheck.json`,
`eslint.config.js` (consumer), the whole pre-commit and CI gate.

**Description.** Prisma 7.10.0 rejects `url` in the `datasource` block —
reproduced during this analysis: `npx prisma validate` returns **P1012**, *"The
datasource property `url` is no longer supported in schema files. Move connection
URLs for Migrate to `prisma.config.ts`"*. So the Story must add that file.
`tsconfig.typecheck.json` includes only `["src", "tests", "scripts",
"vitest.config.ts", "eslint.config.js"]`, and `eslint.config.js` points
`parserOptions.project` at it.

**Trigger.** The file is created at the repository root — the location Prisma
expects — and `tsconfig.typecheck.json` is not updated in the same change.

**Consequence.** `npm run lint` **fails outright**, not subtly: *"Parsing error:
'parserOptions.project' has been provided… The file was not found in any of the
provided project(s)"*. Verified by execution during this analysis (probe file
created, `npm run lint` run, probe removed; the working tree was left clean). The
Stop hook and CI run the same gate, so this blocks every subsequent turn until
fixed. The file is also invisible to `npm run typecheck` until included, so it
would ship untyped.

**Mitigation.** Add `prisma.config.ts` to `tsconfig.typecheck.json`'s `include` in
the same change that creates it. `tsconfig.json` (build) is deliberately left
alone — `rootDir: src` correctly excludes tooling from `dist/`.

**Human decision required: partly.** The related AD-7 question is genuinely open
and the database design already raised it: `prisma.config.ts` must read
`DATABASE_URL`, while AD-7 states flatly that `process.env` is read only in
`src/config/env.ts` — and the ESLint rule enforcing it is scoped to
`files: ['src/**/*.ts']`, so a root-level file passes the lint while contradicting
the prose. `IMPLEMENTATION_PLANNING` should choose deliberately — narrow AD-7's
wording to `src/`, or have the config import the validated value — rather than let
the lint's silence decide.

## R-3 — Major. `.env.test` is git-ignored, so the test setup as specified cannot be committed

**Affected area.** `.gitignore`, `.env.test`, `.github/workflows/ci.yml`, every
integration test.

**Description.** PC-1 and FR-19 require `.env.test` carrying the test
`DATABASE_URL`. `git check-ignore -v .env.test` resolves to **`.gitignore:28`** —
`.env.*`, with only `!.env.example` re-included. Verified by running the command.
No approved artifact names `.gitignore`.

**Trigger.** The file is created and the developer's local run passes, because the
file exists on that machine. It is never committed.

**Consequence.** CI and a fresh clone have no test `DATABASE_URL`. Integration
tests cannot connect, so AC-002 and AC-005 have no database to be tested against
and NFR-005 / NFR-006 are unsatisfiable — the exact failure FR-19 exists to
prevent, arriving after the work looks done.

**Mitigation — two defensible resolutions, and the plan picks one.** Either
`.gitignore` gains `!.env.test` (it carries only a throwaway local test URL
against port 5433, no secret — but it is an exception to a rule that exists for
good reasons and should be written down), or CI supplies `DATABASE_URL` as a
workflow environment variable and `.env.test` stays a local-only convenience, in
which case the `globalSetup` must not *require* the file. The second keeps the
secrets rule intact; the first keeps one source of truth.

**Human decision required: no.** Both resolutions are within
`IMPLEMENTATION_PLANNING`'s authority, but the choice must be recorded rather than
made by whichever the implementer tries first.

## R-4 — Major. Two Zod issue shapes leave `details.fieldErrors` empty, violating the contract

**Affected area.** `src/middleware/errorHandler.ts`, `auth.schemas.ts`, the `400`
response.

**Description.** Zod reports an **unrecognized key** as one `unrecognized_keys`
issue at the object root, and a **non-object body** as one `invalid_type` issue at
the object root. Zod's default flattening puts a root-path issue in form-level
errors, so `details.fieldErrors` comes back empty for both — verified by the
design and re-verified by design review v2 against the installed `zod` 4.5.4.

**Trigger.** The implementation uses the default flattening helper, which is the
obvious way to build `fieldErrors`.

**Consequence.** A `400` whose `details.fieldErrors` is `{}` — violating VR-11,
the `minProperties: 1` on `FieldErrors`, and the response's own declared schema.

**Mitigation.** Map the `unrecognized_keys` issue onto the **offending property
name**, and the root-level `invalid_type` issue onto the **two required field
keys** (`email` and `password`, both as not supplied). Ensure `minProperties: 1`
actually reaches the generated document via `.openapi()` metadata — a Zod record
does not emit it, and without it a contract test cannot see the failure.

**Human decision required: no.** Both mappings are decided in the approved API
design; the risk is that they read as commentary and get skipped.

## R-5 — Minor. Middleware ordering: the request-id middleware must precede the rate limiter

**Affected area.** `src/app.ts`.

**Description.** `X-Request-Id` is declared `required: true` on **every** response
including the `429`, and with `d-1` resolved through `next(...)` the `429` body is
written by the centralized error middleware.

**Trigger.** The limiter is mounted before the request-id middleware in the app
assembly.

**Consequence.** The limiter short-circuits before the id exists, the header
cannot be set, and the `429` violates its own declared contract.

**Mitigation.** Order them deliberately in the plan. FR-15 and FR-23 already place
both in `src/app.ts`, so nothing is undecided — the risk is discovering the
constraint from a failing test instead of stating it.

**Human decision required: no.**

## R-6 — Minor. Rate-limit response headers are emitted but undeclared

**Affected area.** The rate-limit middleware, the approved contract.

**Description.** `express-rate-limit` emits `RateLimit-*` headers by default and
`Retry-After` on a `429`. SC-3 decides the threshold and the mount point and says
nothing about headers, so the contract declares none — declaring a response header
no requirement asks for is what the design stage's checklist forbids.

**Trigger.** The limiter is configured without settling `standardHeaders` /
`legacyHeaders`.

**Consequence.** The implementation emits headers the contract does not describe.
Low harm; a strict contract test could flag it.

**Mitigation.** The limiter needs a custom `handler` anyway (R-1), so the same
configuration object is where these are set — one decision, one place.
`IMPLEMENTATION_PLANNING` settles which way; either is defensible and adding a
declared header later is additive.

**Human decision required: no.**

## R-7 — Minor. Scope is unusually broad for one Story, and reviewers should see it was authorized

**Affected area.** The whole change set.

**Description.** This Story ships the first migration, the app bootstrap, the
process entry, the config boundary, the error taxonomy and the entire
test-database setup, alongside one endpoint. A PR reviewer meeting it cold would
reasonably ask whether scope crept.

**Trigger.** None in the work itself — the risk is a review-time objection.

**Consequence.** Avoidable churn at `PR_REVIEW` or `HUMAN_PR_APPROVAL`.

**Mitigation.** The PR summary cites the human confirmation of 2026-09-01
(clarification report §5), FR-19, FR-20, FR-21 and FR-24, and PC-1's "the first
Story that needs database-backed tests creates it". Every element traces to a
convention that assigns it to the first Story needing it. **No unrelated
refactoring may ride along** — that is what would turn an authorized scope into a
real finding.

**Human decision required: no.**

# 14. Open Decisions

**No blocking Open Decision was identified.** All twelve entries in
`docs/decisions/US-001-open-decisions.md` v7 (`OD-US-001-01` … `OD-US-001-12`) are
`RESOLVED`, verified by reading each entry's status line. No `TODO`, `TBD`,
`FIXME`, `???`, `OPEN`, `unresolved` or "to be decided" marker appears in any
`APPROVED` input artifact — scanned across all nine, per the single marker list in
`AGENTS.md`. The one match is in the design review, where the list itself is
being quoted.

Project-wide decisions in `AGENTS.md` that this Story deliberately does **not**
depend on: the account-state model (FR-4 persists no state column), lockout
policy, refresh-token revocation storage, email verification, roles beyond
`CUSTOMER`, NFR-011's scale and compliance targets, and API-versioning mechanics.
Each is out of scope with a named authority, and none blocks planning.

## Why this stage did not use `changes_required_specification`

`IMPACT_ANALYSIS` holds the loop-back key that reaches `SPECIFICATION`, and design
review `e-1` explicitly asked this stage to decide deliberately. **It was
considered and not used.** The reasoning, so a later reader can disagree with the
judgement rather than have to reconstruct it:

- **What it would cost.** `SPECIFICATION` → `SPEC_REVIEW` → `HUMAN_SPEC_APPROVAL`
  → `API_DESIGN` → `DB_DESIGN` → `DESIGN_REVIEW` → back here: six stages replayed,
  **including a human gate re-crossed**, and a `v14` document that has already
  passed that gate superseded — to correct two sentences that restate a
  convention. Every re-run bumps a version and re-stales the artifact below it.
- **What it would fix.** Nothing substantive. The class list's canonical home is
  `architecture.md` AD-6, which is authoritative for architecture decisions under
  `AGENTS.md` Canonical Sources, and FR-21 cites AD-6 rather than deciding
  anything. Three artifacts already say five; the Specification's two sentences
  are a stale copy, which is the failure mode `AGENTS.md` is organized against.
- **What makes the alternative safe.** The residual danger is real and is R-1: an
  implementer following the order of authority literally builds four classes. The
  mitigation is not a hope — the plan must **state that AD-6's list is
  authoritative**, and a `429` contract test catches it if the plan does not. That
  is the same remedy design review `e-1` named for this branch.
- **What would change the answer.** If `IMPLEMENTATION_PLANNING` cannot or does
  not carry that statement, or if a second substantive Specification defect
  appears, the loop-back becomes worth its cost — one revision then closes both.

# 15. Planning Inputs

Facts `implementation-planner` must consume. These are not steps and imply no
ordering.

1. **`src/lib/errors.ts` creates five subclasses**, per AD-6: `ConflictError`,
   `UnsupportedMediaTypeError`, `PayloadTooLargeError`, `ValidationError`,
   `TooManyRequestsError`. **The plan must state that AD-6's list is authoritative
   and that Specification FR-21's count of four is stale** (R-1).
2. **The `429` carrier is the rate limiter's own `handler` calling
   `next(new TooManyRequestsError(...))`.** Nothing about the `429` is escalated to
   `HUMAN_PLAN_APPROVAL` — the design review formally withdrew that escalation once
   commit `fa21f62` made the AD-6 amendment.
3. **`@prisma/adapter-pg` is approved and installed. Cite commit `0339b4a`; do not
   carry it to the gate as an open decision.**
4. **A `prisma.config.ts` is required** (Prisma 7.10.0 error P1012, reproduced
   here), **and `tsconfig.typecheck.json`'s `include` must gain it or `npm run
   lint` fails** (R-2). The AD-7 `process.env` question attached to that file is
   for the plan to settle deliberately.
5. **`.env.test` is currently git-ignored** by `.gitignore:28`. Choose and record
   a resolution (R-3).
6. **The request-id middleware is mounted ahead of the rate limiter** in
   `src/app.ts` (R-5).
7. **Settle `standardHeaders` / `legacyHeaders`** on the limiter, in the same
   configuration object as the custom handler (R-6).
8. **Two Zod issue mappings are mandatory**, not decoration: unrecognized-keys →
   the offending property name; root-level `invalid_type` → both required field
   keys. And `minProperties: 1` must reach the generated document via `.openapi()`
   metadata (R-4).
9. **The `P2002` unique violation is translated into
   `ConflictError('EMAIL_ALREADY_REGISTERED')`** where Prisma is visible, with
   nothing from the Prisma error reaching the body or a log line.
10. **Four filenames are the plan's to choose** — the boundary validation
    middleware, the rate-limit factory, the password-hashing helper, and the
    body-parser error translation's home (the design named the layer: the
    application-level chain immediately after the JSON parser, explicitly **not**
    the centralized error middleware).
11. **`timestamptz(3)` must be annotated explicitly**; Prisma's default `DateTime`
    mapping is `timestamp(3)` without a time zone and would violate PC-6 silently.
12. **`AGENTS.md`'s command table gains `db:test:up` / `db:test:down`** — PC-1
    requires this by name, so it is a deliverable, not housekeeping.
13. **No new dependency is needed**, so SC-6 / SR-10 are not triggered — but
    `package.json` changes (scripts), so `npm run audit:check` is a required check.
14. **`npm run validate:harness` is also required**, because `AGENTS.md` and
    workflow artifacts are part of this change.
15. **Test coverage must include all three converging request shapes** of design
    review `e-2`, not only the bodyless POST with a content type.
16. **PC-1 predates Prisma 7** and describes neither the adapter object nor the
    separate migration config file. Amending it is a human decision, recorded here
    and not made by any stage so far.
17. **The `CHECK (email = lower(btrim(email)))` constraint is deliberately not
    specified** and has now been endorsed twice — by `DB_DESIGN` and by
    `DESIGN_REVIEW` v2. Do not reopen it as a fresh idea.

# 16. Traceability

| AC | Specification | Design artifact | Affected system area | Expected test category |
|---|---|---|---|---|
| AC-001 | FR-1…FR-5, FR-17; VR-1, VR-2, VR-5; SR-1, SR-2 | Contract `201` + `RegisterResponse`; db-design `User` model | `auth` routes/controller/service, `users` service/repository, `prisma/schema.prisma`, migration | Integration happy path; persistence; unit (service) |
| AC-002 | FR-6, FR-7; VR-4; SR-6 | Contract `409` + `ConflictErrorResponse`; db-design unique constraint + `P2002` translation | `users` service/repository, `auth` service, `errorHandler.ts` | Integration duplicate — **both** the service-check and race paths |
| AC-003 | FR-8; VR-1, VR-2, VR-3; SR-6 | `RegisterRequest.email` `format`/`maxLength`; `ValidationErrorResponse` | boundary validation middleware, `auth.schemas.ts`, `errorHandler.ts` | Integration validation; contract |
| AC-004 | FR-9; VR-5…VR-8; SR-3 | `password` 12–128 + SC-1 policy in the description | `auth.schemas.ts`, boundary validation middleware | Integration policy incl. boundary values; unit |
| AC-005 | FR-10; SR-1…SR-4 | Not observable at the boundary; `writeOnly` on `password`; db-design `password_hash` | `src/lib/<password-hash>.ts`, `users.repository.ts`, `prisma/schema.prisma` | Persistence + security (asserted against the database, not a response) |
| AC-006 | FR-11; SR-3…SR-6 | `RegisterResponse` `additionalProperties: false`, four fields | `auth.controller.ts` DTO, `users.repository.ts` select | Security; contract |
| AC-007 | FR-12; SR-3, SR-6, SR-7 | No contract surface — a log line, not a response | `auth.service.ts`, `src/lib/logger.ts` | Audit assertion on the `event` field; EC-4 failure-tolerance test |

Requirements mapping to no AC, carried by convention and covered here: FR-13…FR-16
(rate limit, hardening, correlation, generated contract), FR-18…FR-24 (env
example, PC-1 test setup, process entry, error taxonomy, validation middleware,
limiter location, hashing helper), SR-8…SR-10 (trusted client IP, config boundary,
dependency approval). FR-19 carries the most weight: without it AC-002 and AC-005
have no database to be tested against.

# 17. Analysis Limitations

- **This is a prediction.** Every path marked LOW confidence is a candidate, not a
  fact; the actual change set is Reconciliation's to record.
- **`analysis_mode: TYPE_CHECKED`, with the scope stated.** `npm run typecheck`
  passes on the repository as it stands (exit 0), and every file named as existing
  was opened and read rather than inferred from its name. But the production code
  does not exist yet, so no claim about a symbol, an import edge, or a type in the
  *delivered* implementation could be compiler-confirmed — those claims rest on the
  approved designs and on the conventions, and are marked MEDIUM.
- **Four filenames are genuinely undetermined** (boundary validation, rate-limit
  factory, hashing helper, body-parser translation). This is by design: the
  Specification defers them to `IMPLEMENTATION_PLANNING`, and inventing them here
  would be the exact drift that cost that document four revisions.
- **Verified by execution during this analysis**, not taken from an upstream
  artifact: `npx prisma validate` reproducing P1012 on a `url` datasource;
  `npm run lint` failing on an unregistered root `.ts` file (probe created and
  removed, working tree left clean); `git check-ignore -v .env.test` resolving to
  `.gitignore:28`; `git show` on commits `0339b4a` and `fa21f62`;
  `@prisma/adapter-pg` 7.10.0 and `pg` 8.23.0 present in `node_modules`;
  `docs/api/openapi.json` holding empty `paths`; `npm run typecheck` exit 0.
- **Taken from upstream artifacts without independent re-verification**, because
  design review v2 verified each by execution and re-running them adds nothing:
  `express-rate-limit` 8.7.0's default handler never calling `next`; `body-parser`
  2.3.0 strict-mode first-character behaviour; `zod` 4.5.4 issue shapes for `[]`,
  unrecognized keys, `undefined` and `null`; `express` 5.2.1 leaving `req.body`
  undefined when no parser runs.
- **The exact TypeScript shape of `prisma.config.ts` was not executed.** That it
  is required is confirmed; what it must contain should be checked against the
  installed version when it is written.
- **`README.md` was not read in detail**, so its row in §12 is LOW confidence.
- **Areas that will need reanalysis** if `IMPLEMENTATION_PLANNING` resolves them
  differently than assumed: the `prisma.config.ts` location and the AD-7 question
  (R-2), and the `.env.test` resolution (R-3). A different choice on either moves
  which files are touched.

## Provenance of this revision

Revision 1 of this document was written on 2026-09-02 at 21:34:24Z **outside a
recorded stage run**: `docs/workflow/history.jsonl` held no `IMPACT_ANALYSIS`
event for US-001, and `scripts/validate-harness.py` reported it as prior work
that must be revised rather than read as current output. Revision 2 is the
recorded run. Nothing substantive changed, and that is a finding rather than an
omission — every load-bearing repository claim revision 1 made was re-checked
against the working tree at 21:55Z and every one of them held:

- all seventeen files under `src/` are one-line placeholders except
  `src/lib/openapi.ts` (22 lines), and `prisma/schema.prisma` is two comment
  lines with no `datasource`, `generator` or model;
- `git check-ignore -v .env.test` resolves to `.gitignore:28` (the `.env.*`
  pattern), so R-3 stands;
- `tsconfig.typecheck.json`'s `include` is `["src", "tests", "scripts",
  "vitest.config.ts", "eslint.config.js"]` and `eslint.config.js:82` points
  type-aware linting at that same program, so a root `prisma.config.ts` outside
  the `include` is unlintable — R-2 stands, and this revision confirms its
  *mechanism* by reading the ESLint configuration, where revision 1 confirmed
  its *symptom* by running a probe;
- `docs/api/openapi.json` has empty `paths`;
- `@prisma/adapter-pg` 7.10.0 is declared in `package.json` and installed, `pg`
  8.23.0 arrives transitively, and commits `0339b4a` and `fa21f62` exist with
  the subjects the analysis attributes to them;
- `architecture.md` AD-6 names **five** subclasses for US-001 at lines 171-173,
  which is what makes R-1 real;
- all twelve `Status.` lines in the decision registry read `RESOLVED` (12 of
  12), and the seven marker matches in that file are its own status vocabulary,
  its revision history, and references to project-wide decisions this Story does
  not depend on — no live blocking marker;
- `npm run typecheck` exits 0, so `analysis_mode: TYPE_CHECKED` still holds for
  the repository as it stands.

The one claim carried from revision 1 without re-execution is its probe result
that `npm run lint` *fails* on an unregistered root `.ts` file. The ESLint
configuration above is sufficient evidence for R-2's remedy, and re-creating a
probe file would dirty a clean working tree for nothing.

# 18. Readiness Result

**Verdict: `PASS`, with seven residual risks carried as non-blocking findings.**

The change surface is identified with acceptable confidence. Every capability the
Specification requires maps to at least one expected change; every affected layer
has a home the existing architecture already names; no new module, shared
directory or abstraction layer is required; no new dependency is needed; and no
Open Decision blocks planning — all twelve are `RESOLVED` and no blocking marker
appears in any approved input.

`CHANGES_REQUIRED` was considered on the one ground available — design review
`e-1`, the stale class list, for which this stage holds
`changes_required_specification` — and deliberately not taken. §14 records the
reasoning in full and names what would change the answer.

`BLOCKED` does not apply: every mandatory input exists, is current, and carries a
`PASS` from its review stage; the architecture documents are substantive rather
than placeholders; and no environment failure prevented the analysis.

The four risks graded Major are all mitigable inside `IMPLEMENTATION_PLANNING`
and none needs a human decision to proceed — but three of them (R-1, R-2, R-3)
are invisible to every automated check until late, which is why each is stated
with its trigger, its consequence and its remedy rather than left as a category.
