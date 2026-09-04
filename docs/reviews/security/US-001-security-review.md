---
artifact_type: security_review
story: US-001
version: 1
status: APPROVED
created_at: 2026-09-03T23:41:00Z
updated_at: 2026-09-03T23:41:00Z
produced_by: security-reviewer
inputs:
  - path: docs/stories/US-001-register-customer.md
    version: null
  - path: docs/specifications/US-001-spec.md
    version: 14
  - path: docs/reviews/specifications/US-001-spec-review.md
    version: 11
  - path: docs/impact-analysis/US-001-impact-analysis.md
    version: 2
  - path: docs/plans/US-001-implementation-plan.md
    version: 4
  - path: docs/reviews/plans/US-001-plan-review.md
    version: 4
  - path: docs/evidence/US-001-implementation-report.md
    version: 4
  - path: docs/verification/US-001-implementation-verification.md
    version: 2
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
  - path: docs/tests/US-001-test-strategy.md
    version: 4
  - path: docs/tests/US-001-ac-test-matrix.md
    version: 4
  - path: docs/decisions/US-001-open-decisions.md
    version: 7
supersedes: null
critical_findings: 0
major_findings: 0
minor_findings: 1
informational_findings: 0
security_sensitive: true
runtime_checks: FULL
analysis_mode: TYPE_CHECKED
---

# Security Review — US-001 Customer Registration

## 1. Executive Summary

**Verdict: PASS — advance to `RECONCILIATION`.**

The registration implementation is sound from a security standpoint. Every
security-relevant control that the approved artifacts require is present **and
verified active at runtime**, not merely declared:

- **Password hashing** is Argon2id only, with the SC-1 cost parameters
  (`memoryCost 19456`, `timeCost 2`, `parallelism 1`) held as frozen constants
  in `src/config/env.ts` and passed explicitly on every call — no environment
  variable can weaken it, and no second hashing path exists.
- **The plaintext password** exists only on the inbound request body. It is
  never persisted (only `password_hash` is written), never returned (the
  response DTO is a 4-field `strictObject`), never placed in an error body
  (integration tests assert no echo), and is covered by Pino `redact` with
  `remove: true` including `*.` key variants.
- **Email uniqueness** is enforced in two layers — a service pre-check inside
  the same transaction as the insert, plus a database `UNIQUE` index — and a
  `P2002` surfacing from the race is translated to the same `ConflictError` with
  no Prisma text, constraint name, or SQL reaching the response or a log line
  (asserted).
- **Boundary validation** is a shared Zod middleware wired on the route ahead of
  the controller; the body is a `strictObject` that rejects unknown properties;
  the email is normalized (trim → lowercase) before validation, comparison and
  storage; the password policy is exactly SC-1 with nothing invented.
- **HTTP hardening** in `src/app.ts` is complete and correctly ordered: `helmet`
  on, `x-powered-by` off, explicit numeric `trust proxy` hop count from env
  (never `true`), explicit CORS allow-list from env (a `*` is rejected at config
  parse time), `10kb` JSON body limit, and the `express-rate-limit` factory
  (10/hour/IP) mounted on `/api/v1/auth` with `standardHeaders`/`legacyHeaders`
  off. `requestId` mounts before the limiter, so the `429` still carries
  `X-Request-Id`.
- **The audit event** carries `{ event, userId, requestId }` and nothing else —
  no email, no IP — confirmed against the live log output of the integration
  run; it is emitted after commit, best-effort, and a failed write is logged as
  an error without failing the request.
- **Secrets and hygiene**: no `.env` or secret-like file is tracked; the one new
  dependency (`@prisma/adapter-pg@7.10.0`, pinned) carries explicit recorded
  human approval per SC-6 (commit `0339b4a`); `npm run audit:check` passes with
  two well-reasoned allowlist entries, both transitive and unreachable.

**Critical: 0. Major: 0. Minor: 1** — `SECURITY_REVIEW:s-1`, a defence-in-depth
observability gap: the centralized error handler returns the generic `500` for
an unmapped error but does not log the underlying error server-side, so an
unexpected production failure (including one an attacker induces) leaves no
diagnostic trace beyond a detail-free `pino-http` completion line. No Acceptance
Criterion requires this and it does not block; the fix is one redacted
`logger.error` call.

**Review limitations:** none material. Full local runtime evidence was gathered
(typecheck, lint, the full 73-test suite against the PC-1 disposable Postgres,
and `audit:check`) — all green. No authentication or authorization surface
exists in this Story to review (registration is public by design, SC-4; no token
is issued).

**Recommended next action:** advance to `RECONCILIATION`.

## 2. Reviewed Artifacts

| Artifact | Path | Version | Status |
|---|---|---|---|
| User Story | `docs/stories/US-001-register-customer.md` | — (active) | — |
| Specification | `docs/specifications/US-001-spec.md` | 14 | APPROVED |
| Specification review | `docs/reviews/specifications/US-001-spec-review.md` | 11 | APPROVED |
| Impact analysis | `docs/impact-analysis/US-001-impact-analysis.md` | 2 | PASS |
| Implementation plan | `docs/plans/US-001-implementation-plan.md` | 4 | APPROVED |
| Plan review | `docs/reviews/plans/US-001-plan-review.md` | 4 | PASS |
| Implementation report | `docs/evidence/US-001-implementation-report.md` | 4 | DRAFT |
| Implementation verification | `docs/verification/US-001-implementation-verification.md` | 2 | APPROVED (PASS) |
| API design | `docs/designs/api/US-001-api-design.md` | 2 | APPROVED |
| OpenAPI contract | `docs/designs/api/US-001-openapi.yaml` | 2 | — |
| Database design | `docs/designs/database/US-001-db-design.md` | 2 | APPROVED |
| Entity model | `docs/designs/database/US-001-entity-model.md` | 1 | APPROVED |
| Design review | `docs/reviews/designs/US-001-design-review.md` | 2 | APPROVED |
| Test strategy | `docs/tests/US-001-test-strategy.md` | 4 | — |
| AC test matrix | `docs/tests/US-001-ac-test-matrix.md` | 4 | — |
| Open decisions | `docs/decisions/US-001-open-decisions.md` | 7 | 12/12 RESOLVED |

No input is `SUPERSEDED`. `implementation_verification` v2 is `PASS`
(`build/typecheck/lint/openapi/cycles` all 0; 73/73 tests; 7/7 ACs VERIFIED).
`HUMAN_SPEC_APPROVAL` and `HUMAN_PLAN_APPROVAL` are both recorded in
`docs/workflow/history.jsonl`.

## 3. Security-Relevant Scope

**Exposed functionality**

- `POST /api/v1/auth/register` — public, unauthenticated (SC-4). Accepts a JSON
  body of exactly `{ email, password }`. Creates one `User` row and returns a
  4-field projection. Issues no token, sets no cookie.

**Protected assets**

- The submitted plaintext password (in transit through the request boundary and
  the service only).
- The stored Argon2id password hash (`user.password_hash`).
- Registered email addresses (PII).
- The `User` row and its identifier.
- `DATABASE_URL` and other environment configuration.

**Trust boundaries crossed**

- External client → Express middleware chain → controller (untrusted input;
  Zod boundary validation).
- Controller → `auth.service` → `users.service` → `users.repository` → Postgres
  (already-validated, typed input past the boundary; Prisma the only DB path).
- Application → Pino log sink / audit event (SC-9 redaction + content policy).
- Developer environment → repository (`.gitignore`, `.env.example`, SC-6/SC-7).

**Affected security components**

`src/config/env.ts`, `src/lib/password.ts`, `src/lib/logger.ts`,
`src/lib/prisma.ts`, `src/lib/errors.ts`, `src/middleware/validateRequest.ts`,
`src/middleware/jsonBodyErrors.ts`, `src/middleware/rateLimit.ts`,
`src/middleware/requestId.ts`, `src/middleware/errorHandler.ts`, `src/app.ts`,
`src/modules/auth/*`, `src/modules/users/{service,repository}.ts`,
`prisma/schema.prisma` + `prisma/migrations/20260903192254_init_user/`.

## 4. Environment and Tools

- **Node**: v24.20.0. **Package manager**: npm.
- **Key library versions in use**: `express` 5.2.1, `@prisma/client` 7.10.0
  (with `@prisma/adapter-pg` 7.10.0), `zod` 4.5.4, `argon2` 0.45.1,
  `helmet` 8.3.0, `express-rate-limit` 8.7.0, `pino` 10.3.1, `pino-http` 11.x.
- **`NODE_ENV`**: Vitest default `test`; `TZ=UTC` from `vitest.config.ts`.
  `DATABASE_URL` sourced from the git-ignored `.env.test` (PC-1 disposable
  Postgres `postgres:17-alpine`, host `5433`, `customer_portal_test`).
- **Database target for evidence**: the PC-1 disposable container only. No
  shared or production database was touched; no destructive SQL was run.
- **Review commands executed this stage** (all exit 0):
  - `npm run typecheck` → 0 errors
  - `npm run lint` → 0 problems (includes the `eslint.config.js` layering rules)
  - `npm run test` → 13 files, **73 passed**, 0 errors, exit 0
  - `npm run audit:check` → "no unaccepted high/critical advisories (2 accepted)"
  - `git status --short`, `git diff HEAD`, `git diff main...HEAD`,
    `git show 0339b4a`
  - targeted `Grep` over `src/` for `process.env`, `console.`, `argon2`
- **Reused evidence**: `implementation_verification` v2 (build, `openapi:check`,
  `check:cycles`, migration apply/status). Re-run was not required — the only
  tracked change since v2 is the V-1 mock-scope fix in
  `tests/integration/auth-register-audit.test.ts` (test-only); `src/`,
  `prisma/`, `package.json`, `package-lock.json` are byte-identical to `HEAD`
  — but `typecheck`, `lint`, `test` and `audit:check` were re-run here anyway
  for independence and reproduced green.
- **Checks not executed**: `npm run validate:harness` (harness untouched by this
  Story; out of security scope). `npm run build` / `openapi:check` /
  `check:cycles` not re-run (no `src/` or schema change since v2; v2 recorded
  them green).
- **Runtime capability note**: the app was exercised only via Supertest against
  `src/app.ts` in the test suite; it was never bound to a network interface.

## 5. Authentication Review

**Applicable requirements.** None for this Story. `POST /auth/register` is one
of the endpoints SC-4 lists as deliberately public and unauthenticated. FR-1,
FR-17 and BR-4 confirm registration authenticates nobody, issues no access
token, and sets no refresh cookie. SC-3's JWT variables are deliberately absent
from `src/config/env.ts` (FR-18, verified in §12).

**Implementation evidence.** `auth.routes.ts` mounts only
`validateRequest(registerRequestSchema)` and the controller — no auth
middleware, and none is expected. No `jsonwebtoken` import anywhere in `src/`
(the package is in `package.json` for later Stories but unused here). No
cookie is set on any response path (`auth.controller.ts` calls
`res.status(201).json(body)` only; no `res.cookie`).

**Tests.** `auth-register-success.test.ts` asserts the response carries exactly
`id, email, role, createdAt` — no token field, no `Set-Cookie` assertion needed
because none is produced.

**Findings.** None. Authentication is correctly out of scope; nothing was added
speculatively.

## 6. Authorization Review

**Endpoint access.** `POST /api/v1/auth/register` — public by approved design
(SC-4, FR-1). This is the only route this Story mounts. `users.routes.ts` and
`auth`'s other verbs remain one-line placeholders.

**Role checks.** None required. The created row is assigned `role: CUSTOMER`
unconditionally in the schema default (`prisma/schema.prisma` `@default(CUSTOMER)`)
and the DTO returns the literal `'CUSTOMER'` (`registerResponseSchema`
`z.literal('CUSTOMER')`). The client cannot influence the role: `role` is not a
field of `registerRequestSchema`, and the `strictObject` rejects it as an
unknown property (integration test `rejects an unknown body property … keyed by
the offending property name` sends `admin: true` and gets a `400`).

**Ownership checks.** Not applicable — registration creates a new principal and
operates on no existing user-owned resource. No client-supplied identifier is
trusted; the response `id` is the server-generated `uuid`.

**Service-level boundaries.** `auth.service` reaches `users` only through
`usersService` (the one cross-module edge `module-map.md` permits), never its
repository or schemas — confirmed by `Grep` and by the `eslint.config.js`
`CROSS_MODULE` rule passing. `users.repository.ts` is the sole Prisma access to
the `User` row (BR-6).

**Findings.** None. Authorization findings would be Critical if an unauthorized
actor could read or modify protected data; no such path exists in this Story.

## 7. Password and Credential Handling

**Request handling.** The plaintext password enters only as
`registerRequestSchema.password` on the request body. `auth.controller.ts`
destructures `{ email, password }` from the already-validated `req.body` and
passes it to `service.register`. `auth.service.register` passes it to
`deps.hashPassword` and to nothing else; on the duplicate path it is **not**
hashed — the `ConflictError` is thrown before `hashPassword` is reached (FR-7,
SC-3), asserted at unit level in `auth.service.test.ts`.

**Policy enforcement.** `auth.schemas.ts` `passwordField` implements exactly
SC-1 and nothing more:

- `codePointLength(value) >= 12` and `<= 128` — counted with `[...value].length`,
  i.e. Unicode code points, not UTF-16 units or bytes (integration test
  `counts password length in Unicode code points …` proves a 12-code-point
  Cyrillic string is treated as length 12).
- `characterClassCount(value) >= 3` over the four classes `\p{Ll}`, `\p{Lu}`,
  `[0-9]`, "anything else" (single class). The known caseless-script limitation
  is preserved, not carved around — integration test
  `rejects a caseless-script password that can reach only 2 of the 4 classes`
  asserts a `400` for a Han+digits string, matching SC-1's stated behaviour.
- No breached-password check (VR-7 defers to US-009) — correctly absent.

The policy is expressed once, as the schema (VR-8); it is not duplicated in the
service and is not an environment variable.

**Hashing.** `src/lib/password.ts` `hashPassword` calls
`argon2.hash(password, { type: argon2.argon2id, memoryCost, timeCost,
parallelism })` with all three values from `ARGON2ID_PARAMETERS` in
`src/config/env.ts` — a `Object.freeze`d constant object, not env-derived (SR-2).
`argon2` is imported in exactly one non-test file (`password.ts`) — verified by
`Grep`; `auth.service.ts` calls the helper, never the library (FR-24). No
alternative hashing path, no `crypto.createHash`, no string comparison of
secrets anywhere.

**Persistence.** `users.repository.create` writes `data: { email, passwordHash }`
and selects `CUSTOMER_SELECT` (`{ id, email, role, createdAt }`) — the hash is
written but never selected back. The column is `password_hash TEXT NOT NULL`
(migration). `findByEmail` selects `id` only. No query in the codebase selects
`passwordHash`.

**Serialization.** `registerResponseSchema` is a `strictObject` of four fields;
`auth.controller.ts` builds the body field-by-field from `CustomerRecord`, which
itself has no hash field. A persistence model is never returned directly (AD-4,
SR-5).

**Logging.** `src/lib/logger.ts` `redact.paths` covers `password`,
`passwordHash`, `password_hash` and their `*.` nested forms, plus
`token`/`accessToken`/`refreshToken` variants, `DATABASE_URL`, and
`authorization`/`cookie` headers, with `remove: true`. The registration audit
line (`auth.service.ts` wired singleton) logs `{ event, userId, requestId }`
only — no password field is ever in a log payload in the first place. The live
`pino` output during the integration run (captured while running `npm run test`)
shows the `user.registered` lines and request-completion lines carrying no
password, hash, email, or cookie.

**Tests.** `password.test.ts` (unit, 4 cases: Argon2id type, the three cost
parameters, encoded output); `auth-register-success.test.ts` (`password_hash`
in the DB row starts `$argon2id$` and is `!= plaintext`; response carries no
credential field; `expectNoPlaintextLeak`); `auth-register-password-validation.test.ts`
(missing / non-string / 11 / 129 / <3 classes / caseless-script /
code-point-count / no echo in the error).

**Findings.** None.

## 8. Sensitive Data Exposure

| Surface | Reviewed | Result |
|---|---|---|
| `201` response body | `registerResponseSchema` `strictObject`, `auth.controller.ts` | Exactly `id, email, role, createdAt`. No hash, no token, no internal field. |
| Error bodies (`400/409/413/415/429/500`) | `errorHandler.ts`, `auth.schemas.ts` error envelopes | `{ error: { code, message[, details.fieldErrors] } }`. `details` present only for `VALIDATION_FAILED`; keys are field names, values are rule messages — never the submitted value. `409`/race path carries no Prisma text, `P2002`, or constraint name (asserted). |
| Prisma record serialization | `users.repository.ts` | Both queries use an explicit `select`; no `findMany`/`findFirst` returning the whole row into a response path. |
| Logs | `logger.ts` redaction; `auth.service.ts` audit payload; `pino-http` config | Audit line = `{ event, userId, requestId }`. No email, no IP (FR-12, SC-9). Redaction removes credential/cookie/`DATABASE_URL` keys. Verified against live run output. |
| Exceptions | `errorHandler.ts` catch-all | Generic `500` `{ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' }`. No stack, no `err.message` from an unknown error, reaches the client. |
| Implementation report / this review | inspected | No secret value, no connection string, no hash reproduced. |
| Telemetry (`.claude/logs/`) | git-ignored, not part of the change set | Not modified by this Story; out of scope. |

**Findings.** None on data exposure. See `SECURITY_REVIEW:s-1` (§19) for the
*absence* of a server-side diagnostic log on the `500` path — the concern there
is lost forensics, not leaked data.

## 9. Input Validation

- **Constraints defined.** `email`: required string, trimmed + lowercased, then
  `z.email()` and `.max(254)` (matching `@db.VarChar(254)` so an over-long value
  is a `400`, not a DB error — EC-8). `password`: required string + the SC-1
  refinements. Body: `strictObject` — exactly two properties, unknown rejected
  (VR-9). `Content-Type`: an explicit header check in `validateRequest` rejects a
  body with a non-JSON / missing type as `415` before the schema runs (VR-10).
- **Runtime activation.** `validateRequest(registerRequestSchema)` is wired on
  the route in `auth.routes.ts` ahead of `authController.register`. The negative
  integration tests (unknown property, array body, bodyless, wrong content type,
  oversized, malformed JSON) all return the mapped status — proving the
  middleware runs and is not merely declared.
- **Negative scenarios covered.** Missing field, non-string field, format
  failure, length under/over, weak composition, caseless script, unknown
  property, JSON array body, bodyless POST (with and without `application/json`),
  non-JSON content type (with and without a `Content-Type` header), `>10kb`
  body, unparseable JSON. Each has a named test and passes.
- **Oversized / malformed input.** `express.json({ limit: '10kb' })` +
  `jsonBodyErrors` translate `entity.too.large` → `PayloadTooLargeError` (`413`)
  and `entity.parse.failed` → `ValidationError` (`400 MALFORMED_JSON`, no
  `details`). Confirmed by `auth-register-envelope.test.ts`.
- **Error detail hygiene.** `toFieldErrors` in `errorHandler.ts` emits field
  names and generic rule messages; it never reads `issue.input` or echoes the
  value. The `minProperties: 1` contract guarantee (a `VALIDATION_FAILED`
  response never names zero fields) has an explicit fallback branch and unit
  coverage (`errorHandler.test.ts`).

**Findings.** None.

## 10. API Security

- **Exposed endpoints.** Exactly one: `POST /api/v1/auth/register`. `Grep` for
  `registry.registerPath` / `.post(` / `.get(` across `src/` finds no other
  registered route. The generated `docs/api/openapi.json` matches the Zod
  schemas (`openapi:check` exit 0 at verification v2).
- **Approved public access.** Matches SC-4 and the API design.
- **Protected operations.** None in this Story.
- **Request restriction.** `strictObject({ email, password })` — no mass
  assignment; `role`, `id`, account-state, etc. are rejected as unknown
  properties, not silently stripped.
- **Response restriction.** Four non-sensitive fields; `strictObject` prevents
  accidental widening in a later edit.
- **Error behaviour.** Single envelope shape (AC-6). `code` values are contract
  constants assigned at API_DESIGN (`VALIDATION_FAILED`, `MALFORMED_JSON`,
  `EMAIL_ALREADY_REGISTERED`, `PAYLOAD_TOO_LARGE`, `UNSUPPORTED_MEDIA_TYPE`,
  `RATE_LIMIT_EXCEEDED`, `INTERNAL_ERROR`) — none invented in implementation.
- **Content-type constraint.** Enforced (`415`).
- **Rate-limit headers.** `standardHeaders`/`legacyHeaders` both `false` — the
  limiter emits no `RateLimit-*` or `Retry-After` header the contract does not
  declare (asserted in `auth-register-rate-limit.test.ts`).
- **`helmet` response headers** observed on live responses during the test run:
  `Content-Security-Policy` (restrictive default), `Strict-Transport-Security`,
  `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`,
  `Referrer-Policy: no-referrer`, `Cross-Origin-*` — and `X-Powered-By` is
  absent.

**Findings.** None. No undocumented endpoint or response field.

## 11. Persistence Security

- **Sensitive fields.** `password_hash TEXT NOT NULL` — cannot hold plaintext by
  design (only `hashPassword` output is written) and by behaviour (the DB row
  assertion in `auth-register-success.test.ts` checks the `$argon2id$` prefix).
  Never in a response `select`.
- **Schema constraints.** `id UUID PRIMARY KEY` (`@default(uuid())`);
  `email VARCHAR(254) NOT NULL` with `CREATE UNIQUE INDEX "user_email_key"`;
  `role "Role" NOT NULL DEFAULT 'CUSTOMER'`; `created_at`/`updated_at`
  `TIMESTAMPTZ(3) NOT NULL`. Matches `US-001-db-design.md` v2 and
  `US-001-entity-model.md` v1.
- **Uniqueness.** Enforced at the database (`UNIQUE` index) and re-checked in the
  service transaction; the `P2002` race path maps to `ConflictError` with the
  same body as the pre-check (SR-6). `auth-register-duplicate.test.ts` covers
  plain, case-only, whitespace-only, and concurrent-race duplicates and asserts
  no `P2002` / `prisma` / `unique constraint` text in the body.
- **Nullability.** All columns `NOT NULL`; no nullable sensitive column.
- **Database location.** `DATABASE_URL` comes only from the environment
  (`src/config/env.ts`), reaches the client via `@prisma/adapter-pg` in
  `src/lib/prisma.ts`, and is redacted from logs. Not in the repository, a
  response, or a log line.
- **Migration.** `20260903192254_init_user/migration.sql` is committed, additive
  (`CREATE TYPE` / `CREATE TABLE` / `CREATE UNIQUE INDEX`), non-destructive, and
  `prisma migrate status` reports nothing pending (verification v2 §9). No
  applied migration was edited.
- **Transaction.** Opened in `usersRepository.transaction`
  (`prisma.$transaction`), composed by `users.service.ts` — not in a controller
  or an individual repository method (AD-3, PC-9).
- **Generated files.** `node_modules/@prisma/client` (generated) and `dist/` are
  git-ignored and not staged.

**Findings.** None.

## 12. Runtime Configuration

- **Startup validation.** `src/config/env.ts` `EnvSchema.safeParse(process.env)`
  throws (and the process exits) when a variable is missing/invalid (AD-7). It
  validates `NODE_ENV`, `PORT`, `LOG_LEVEL`, `DATABASE_URL`,
  `CORS_ALLOWED_ORIGINS`, `TRUST_PROXY`. **No JWT variable is present** —
  `SPECIFICATION:FR-18` satisfied; `Grep` confirms `JWT_` appears nowhere in
  `src/`.
- **`process.env` reads.** Only in `src/config/env.ts` — confirmed by `Grep`
  over `src/` and enforced by the `eslint.config.js` `no-restricted-properties`
  rule (which is `off` only for that one file and for tests).
- **CORS.** `cors({ origin: env.CORS_ALLOWED_ORIGINS })`. The env transform
  splits on comma, trims, drops empties, and `.refine`s that the list is
  non-empty **and does not contain `*`** — a wildcard fails startup. `credentials`
  is not enabled (defaults `false`), so the SC-5 "`*` with `credentials`"
  prohibition cannot be reached.
- **`helmet`.** `instance.use(helmet())` first in the chain; `x-powered-by`
  disabled on the next line.
- **Body limit.** `express.json({ limit: '10kb' })` — the SC-5 value, explicit.
- **`trust proxy`.** `instance.set('trust proxy', env.TRUST_PROXY)` where
  `TRUST_PROXY` is `z.coerce.number().int().min(0).max(10).default(0)` — a hop
  count, never boolean `true`. `.env.example` documents `0` local/CI, `1`
  production, and why the number is a security control (SR-8, SC-5).
- **Rate limits.** One factory, mounted on `/api/v1/auth`, `10` per hour per IP
  for register; `login`/`refresh`/`logout` numbers are correctly **not** set by
  this Story.
- **Cookie flags.** No cookie is set by this Story — nothing to misconfigure.
- **Secret handling.** All configuration is env-sourced and startup-validated;
  `.env.example` carries only local placeholders; no real `.env` is tracked.
- **Unsafe defaults.** None found. `NODE_ENV` defaults to `development` if
  unset, but that only affects `pino` verbosity and Express error verbosity —
  the error handler's generic `500` body is unconditional, not
  `NODE_ENV`-gated, so a missing `NODE_ENV` cannot expose a stack. No debug
  route, admin route, or introspection endpoint exists.

**Findings.** None blocking. See `SECURITY_REVIEW:s-1` for the error-logging
gap, which is an error-handling/observability matter rather than a config one.

`IMPLEMENTATION:G-1` (carried, MINOR, owed to a human PC-1 note) was reproduced:
`npx prisma` CLI commands fail on a bare checkout with `DATABASE_URL` unset
because `prisma.config.ts` resolves `env('DATABASE_URL')` eagerly. This is a
developer-experience / CI-setup matter, not a runtime security weakness of the
application (the app itself validates the variable at startup by design), and is
already tracked. Not re-raised here.

## 13. Logging and Telemetry

- **Sensitive logging.** None. The only Story-specific log call is
  `auth.service.ts` → `logger.info({ event, userId, requestId })` (audit) and
  `logger.error({ err, event }, 'audit write failed')` on the best-effort catch.
  `pino-http` request logging is bound to the same instance with `genReqId`
  taking the id from `res.locals.requestId`. Neither carries a credential, an
  email, or an IP in the payload the code constructs.
- **Redaction controls.** Configured on the logger instance (`redact.paths` +
  `remove: true`), not left to call-site discipline (SR-7). The path list covers
  SC-9's "never in a log line" categories. `pino-http` will still serialise
  `req.headers` generally; `authorization` and `cookie` are in the redaction
  list, and no other credential-bearing header is expected on this public
  endpoint.
- **Payload retention.** The audit event is metadata only (`event`, `userId`,
  `requestId`). It deliberately excludes PII so it does not outlive the request
  under an unset retention policy (NFR-011, SC-9). Audit storage remains an Open
  Decision — correctly not resolved here.
- **Hook telemetry.** `.claude/logs/tool-usage.jsonl` is git-ignored and not
  touched by this Story; no PostToolUse change was made. Out of scope.

**Findings.** `SECURITY_REVIEW:s-1` (MINOR) — the centralized error handler does
not emit a server-side log for an unmapped error before returning the generic
`500`. Detail in §19.

## 14. Dependencies

- **Added by this Story branch** (`git diff main...HEAD` on `package.json` /
  `package-lock.json`): exactly one direct dependency — `@prisma/adapter-pg`,
  pinned to `7.10.0` — plus its transitive `pg` stack (`pg`, `pg-pool`,
  `pg-protocol`, `pg-types`, `pgpass`, `postgres-*`, `@types/pg`). Two npm
  scripts (`db:test:up`, `db:test:down`) were also added.
- **Approval status.** `@prisma/adapter-pg` carries explicit recorded human
  approval per SC-6: commit `0339b4a` ("chore(deps): add the Prisma PostgreSQL
  driver adapter"), stating the reason (Prisma 7's `PrismaClient` cannot be
  constructed without a driver adapter on a direct connection), that only the
  adapter is declared (`pg` arrives transitively, nothing in `src/` imports it
  directly — confirmed by `Grep`), and that it is pinned to match
  `@prisma/client` / `prisma`. This is a consequence of the already-approved
  Prisma 7 major version (AD-1), not a new architectural choice.
- **Vulnerability scanning.** `npm run audit:check` executed this stage → exit 0:
  "no unaccepted high/critical advisories (2 accepted)". The two accepted
  entries in `.audit-allowlist.json`:
  - `GHSA-ggr8-5vv4-36mx` (deepmerge-ts, high) — reachable only through
    `@prisma/config` merging our own committed config; no attacker path; no
    fixed release on Prisma 7.10; recheck condition recorded.
  - `GHSA-3f6p-5ww8-9rcr` (mysql2, high) — `mysql2` is bundled by Prisma per
    supported DB but never loaded (this project has a single PostgreSQL
    datasource, PC-1); recheck condition recorded, with an explicit "becomes a
    blocker if any Story adds a MySQL datasource".
  Both reasons are current and specific; neither is a rubber-stamp. No allowlist
  entry lacks a reason or a recheck.
- **Review limitation.** `audit:check` covers the npm advisory database for
  high/critical severity against the committed lockfile. No SCA beyond that
  (e.g. supply-chain provenance, malware scanning) was performed — organisational
  policy does not currently require one.

**Findings.** None.

## 15. Security Test Coverage

| Security requirement / abuse case | Test(s) | Level | Result |
|---|---|---|---|
| Password stored only as Argon2id hash (SR-1, AC-005) | `auth-register-success.test.ts` "stores the password only as an Argon2id hash"; `password.test.ts` | integration + unit | pass |
| Argon2id parameters are SC-1 values, passed explicitly (SR-1, SR-2) | `password.test.ts` (type + 3 params + output) | unit | pass |
| Plaintext never persisted | `auth-register-success.test.ts` (DB row `passwordHash != password`) | integration | pass |
| Hash / credential never in response (SR-3, SR-4, AC-006) | `auth-register-success.test.ts` "never returns the password or password hash"; `expectNoCredentialFields` / `expectNoPlaintextLeak` | integration | pass |
| Duplicate path does not hash (FR-7, SC-3) | `auth.service.test.ts` (hash spy not called on duplicate) | unit | pass |
| Invalid email rejected at boundary (AC-003) | `auth-register-email-validation.test.ts` (missing / non-string / bad format / >254) | integration | pass |
| Password policy = SC-1 exactly (AC-004, VR-6) | `auth-register-password-validation.test.ts` (7 cases incl. caseless-script, code-point count) | integration | pass |
| Unknown property rejected, not stripped (VR-9) | `auth-register-envelope.test.ts` (`admin: true` → 400 keyed `admin`) | integration | pass |
| Duplicate email → 409, no second row, no Prisma text (AC-002, SR-6, EC-3) | `auth-register-duplicate.test.ts` (plain / case / whitespace / race) | integration | pass |
| No password echo in any validation error (SR-3, SC-9) | `auth-register-password-validation.test.ts` "never echoes the submitted password"; `auth-register-email-validation.test.ts` | integration | pass |
| Audit event content: `event`,`userId`,`requestId` only, no PII (AC-007, FR-12) | `auth-register-audit.test.ts` (key set assertion; `raw` contains no email / "ip"); `auth.service.test.ts` | integration + unit | pass |
| Audit failure does not fail the request (EC-4) | `auth-register-audit.test.ts` EC-4 (still `201`; `logger.error` called) | integration | pass |
| Rate limit `429`, no account, no hash (FR-13, EC-7) | `auth-register-rate-limit.test.ts` (11th request → 429; row null) | integration | pass |
| `429` carries `X-Request-Id` (middleware order, SR-8-adjacent) | `auth-register-rate-limit.test.ts` | integration | pass |
| No undeclared `RateLimit-*` / `Retry-After` headers | `auth-register-rate-limit.test.ts` | integration | pass |
| `415` / `413` / malformed-JSON mapped, generic bodies | `auth-register-envelope.test.ts` | integration | pass |
| `fieldErrors` never empty on `VALIDATION_FAILED` (VR-11) | `errorHandler.test.ts` | unit | pass |

**Test quality.** The integration tests assert real HTTP status, real response
bodies, and real database rows — not "a method was called". The former
false-positive risk (V-1: a process-global `logger.info` stub that out-of-test
`pino-http` also invoked) is resolved: the EC-4 stub is now scoped by payload
`event` and `vi.restoreAllMocks()` runs in `beforeEach`. No `.only`, no
`.skip`, no weakened assertion. Integration files run with `fileParallelism:
false` against a per-file truncated database; unit/harness files shuffle
(NFR-005).

**Gap.** No test forces the catch-all `500` branch of `errorHandler.ts`
(inherently hard to trigger through the HTTP boundary with all inputs
validated). Related to `SECURITY_REVIEW:s-1`; not itself a blocking gap.

## 16. Abuse Case Review

| Scenario | Expected protection | Evidence | Status |
|---|---|---|---|
| Repeated registration attempts from one IP (enumeration / spam) | `429` after 10/hour; per-IP bucket keyed off the real client IP (numeric `trust proxy`) | `auth-register-rate-limit.test.ts`; `rateLimit.ts`; `env.ts` `TRUST_PROXY` numeric | protected |
| Spoofing the client IP to defeat the per-IP limit | `trust proxy` is a hop count, never `true`; the proxy's appended `X-Forwarded-For` entry wins | `app.ts` `set('trust proxy', env.TRUST_PROXY)`; `env.ts` `min(0).max(10)`; SR-8 | protected |
| Mass-assignment of `role` / account-state / `id` | `strictObject` rejects unknown properties with `400` | `auth-register-envelope.test.ts` (`admin: true`) | protected |
| Duplicate-registration used to probe whether an email exists | Disclosure is the **decided** behaviour (BR-009); response says "already registered". Password is not hashed on this path, so no timing amplification and no added DoS cost | `auth-register-duplicate.test.ts`; `auth.service.ts` (throw before `hashPassword`); SC-3 explicitly forbids "hardening" this into constant-time without a new decision | accepted by design |
| Oversized body to exhaust memory/CPU on an unauthenticated route | `10kb` limit → `413` before the handler | `auth-register-envelope.test.ts` "rejects a body exceeding the 10kb limit" | protected |
| Malformed JSON / wrong content type to trigger an unhandled `500` | Mapped to `400 MALFORMED_JSON` / `415` via domain errors; generic bodies | `auth-register-envelope.test.ts` | protected |
| Log/header injection via a crafted `X-Request-Id` | Inbound id echoed only if it matches `^[A-Za-z0-9._~-]{1,128}$`; otherwise a fresh UUID — no CR/LF, no control chars | `requestId.ts` `SAFE_ID`; no test but the regex is exhaustive for the risk | protected |
| Argon2id memory pressure from concurrent hash calls on a public route | SC-1 parameters are deliberately low per-hash (19 MiB); rate limit caps concurrency; duplicate path skips hashing | `env.ts` `ARGON2ID_PARAMETERS`; SC-1 rationale | accepted by design |
| Unicode-normalisation collision on email (two "different" strings, one account) | Email lowercased + trimmed before compare and store; DB `UNIQUE` on the normalised value; case/whitespace-only duplicates tested | `auth.schemas.ts` `emailField.transform`; `auth-register-duplicate.test.ts` EC-1/EC-2 | protected (see note) |

**Note on the last row.** Normalisation is trim + lowercase only. It does not
apply NFKC/NFC Unicode normalisation, so two visually or canonically equivalent
but differently-encoded email strings could in principle create two accounts.
The approved decision (OD-US-001-10, BR-2) specifies exactly "trim then
lowercase" and nothing more; going beyond it would be inventing policy. This is
noted for the record, not raised as a finding — no approved requirement is
violated, and email deliverability (not account security) is the practical
exposure.

## 17. Repository Hygiene

- **Secret-like files.** None tracked. `git status` shows only doc/workflow
  files modified and `docs/verification/US-001-implementation-verification.md`
  untracked. No `.env`, `.pem`, `.key`, dump, or credential file.
- **Runtime artifacts in the change set.** None. `dist/`,
  `node_modules/@prisma/client`, `.env.test`, `coverage/` are all git-ignored
  and not staged.
- **`.gitignore` coverage.** `.env`, `.env.*` (with `!.env.example`),
  `node_modules/`, `dist/`, `coverage/`, `*.log` — covers SC-7. `.env.test` is
  therefore ignored, consistent with the D-4 decision that it stays local-only
  and CI supplies `DATABASE_URL` as a workflow variable.
- **`.env.example`.** Local placeholders only (`postgres:postgres@localhost`,
  `http://localhost:3000`). No real secret. Mirrors `src/config/env.ts`; the
  four JWT entries are removed (FR-18); the test-DB line is present, commented,
  with a note to place it in `.env.test`.
- **Unsafe local configuration.** `.claude/settings.local.json` is git-ignored;
  not part of this review.

**Findings.** None. (`IMPLEMENTATION:E-1` — the one-line `src/lib/shutdown.ts`
re-export that lets `src/server.ts` reach `disconnectPrisma` without tripping the
ESLint `PRISMA` import rule — is a carried MINOR owed to a human
`eslint.config.js` change. It adds no capability and no security surface: it
re-exports a single already-public function. Not re-raised here.)

## 18. Deviations

| Approved requirement | Implementation | Assessment |
|---|---|---|
| Spec FR-21 names **four** `DomainError` subclasses; `architecture.md` AD-6 names **five** (adds `TooManyRequestsError` for the `429`) | `src/lib/errors.ts` implements **five** (incl. `TooManyRequestsError`); `errorHandler.ts` maps it to `429` | Follows AD-6, the canonical source. This is the already-accepted `DESIGN_REVIEW:e-1` (human decision 2026-09-03, `US-001-findings-triage.md` v2): a stale spec copy, not an implementation defect. No security impact — the `429` mapping is required by SC-3 and is present. |
| SC-9 "diagnostics stay server-side" | Generic `500` body is returned; the underlying error is **not** written to the server log | Partial deviation → `SECURITY_REVIEW:s-1` (MINOR). The client-facing half (no leak) is satisfied; the server-side half (a diagnosable record exists) is not. |
| Everything else (SC-1 through SC-8, all SR-*, all VR-*, the Error Handling table) | as approved | No deviation. |

## 19. Findings

### SECURITY_REVIEW:s-1 — unmapped errors are not logged server-side

- **ID:** `SECURITY_REVIEW:s-1`
- **Severity:** Minor
- **Category:** LOGGING
- **Affected file:** `src/middleware/errorHandler.ts` (the final `res.status(500)`
  branch, lines ~100–102)
- **Observed evidence.** When `err` is neither a `ZodError` nor a `DomainError`,
  the handler responds `500 { code: 'INTERNAL_ERROR', message: 'An unexpected
  error occurred.' }` and returns. It does not call `logger.error` (or any
  logger) with the caught `err`. `pino-http` will still emit one
  request-completion line at `error` level for the `500` status, but that line
  carries `req` / `res` metadata only — not the exception type, message, or
  stack. The redacted `logger` singleton that would make such a line safe is
  already imported and configured elsewhere but is not used here.
- **Expected security behaviour.** SC-9 requires unexpected-error diagnostics to
  "stay server-side" — which presumes they exist server-side. An unauthenticated
  public endpoint is exactly where an induced, unhandled failure needs a
  first-class server-side record for detection and incident response.
- **Risk.** Low. No data is exposed to the client. The impact is lost forensics:
  a production `500` (including one an attacker triggers by finding an unhandled
  path) cannot be root-caused from logs beyond "a 500 happened". There is no
  confidentiality, integrity, or availability impact on the request itself.
- **Required correction.** In the catch-all branch, log the error through the
  existing redacted `logger` (e.g. `logger.error({ err }, 'unhandled error')`)
  before sending the generic `500`. The `logger.ts` redaction list already
  removes credentials/tokens/cookies/`DATABASE_URL`, so an `err` serialisation
  is safe; keep the client body unchanged.
- **Loop-back target.** `IMPLEMENTATION` (correct artifacts, a small code
  addition) — **but non-blocking**, so it does not force a loop-back now: it can
  be folded into any later `IMPLEMENTATION` re-entry, or carried to the PR as a
  known Minor. No Acceptance Criterion depends on it.
- **Verification required after correction.** A unit test in
  `errorHandler.test.ts` asserting that a non-domain, non-Zod error produces one
  `logger.error` call and still returns the generic `500` body with no `err`
  detail in the response.

No other findings. Areas 5, 6, 7, 8, 9, 10, 11, 14, 17 were reviewed and are
clean.

## 20. Positive Controls

Independently observed and verified this review:

1. **Argon2id only, non-weakenable parameters** — `password.ts` + `env.ts`;
   `Grep` confirms `argon2` imported in one non-test file; `password.test.ts`
   asserts the type and all three cost values; the DB row in
   `auth-register-success.test.ts` starts `$argon2id$`.
2. **Plaintext password confined to the request boundary** — not persisted
   (only `password_hash` written), not selected back, not in the DTO
   (`strictObject`, 4 fields), not in an error `details`, redacted from logs
   (`remove: true`, incl. `*.` variants).
3. **Duplicate-email path never hashes** — `ConflictError` thrown before
   `hashPassword`; unit-asserted; matches the deliberate SC-3 non-constant-time
   decision.
4. **Two-layer email uniqueness with a leak-free race path** — service pre-check
   in the same transaction as the insert + DB `UNIQUE` index + `P2002` → same
   `ConflictError`; no `P2002` / `prisma` / `unique constraint` string in the
   body (asserted).
5. **Boundary validation active on the route** — `validateRequest` wired ahead
   of the controller; `strictObject` rejects unknown properties; negative
   integration tests prove it runs.
6. **Email normalisation before validate / compare / store** — `emailField`
   `transform(trim → toLowerCase)` piped into `z.email().max(254)`; case- and
   whitespace-only duplicates are rejected (EC-1/EC-2).
7. **254 boundary aligned with `@db.VarChar(254)`** — an over-long address is a
   `400`, never a DB error (EC-8).
8. **HTTP hardening, correctly ordered** — `helmet` first (CSP, HSTS, nosniff,
   frameguard observed on live responses), `x-powered-by` off, numeric
   `trust proxy` from env, CORS allow-list from env with a config-time `*`
   rejection, `10kb` body limit, rate limiter on `/api/v1/auth`,
   `standardHeaders`/`legacyHeaders` off. `requestId` before the limiter → the
   `429` carries `X-Request-Id`.
9. **Rate limiter** — 10/hour/IP for register only; `login`/`refresh`/`logout`
   correctly not set; custom handler raises a domain error so the `429` body is
   built centrally.
10. **Request-id middleware is injection-safe** — inbound `X-Request-Id` echoed
    only if it matches a bounded safe charset, else a fresh `randomUUID()`.
11. **Audit event is metadata-only** — `{ event, userId, requestId }`, verified
    against live run output; no email, no IP; emitted post-commit, best-effort,
    failure logged as error without failing the request.
12. **Config boundary** — `src/config/env.ts` is the only `process.env` reader
    (`Grep` + ESLint-enforced); fail-fast Zod validation; no JWT variable
    present.
13. **Centralized error handler** — mounted last; maps only `ZodError` and
    `DomainError`; everything else is a generic `500` that leaks nothing on the
    SC-9 list; `fieldErrors` never empty on `VALIDATION_FAILED`.
14. **No secrets or runtime artifacts tracked**; `.gitignore` covers SC-7; the
    one new dependency has recorded SC-6 approval; `audit:check` green.
15. **`console.*` absent from `src/`** (`Grep` + ESLint `no-console`); Pino only,
    redaction on the instance.

## 21. Open Decisions

No blocking security Open Decisions were identified.

`docs/decisions/US-001-open-decisions.md` v7 has all twelve entries `RESOLVED`.
The project-wide Open Decisions that touch security areas
(`login`/`refresh`/`logout` rate-limit numbers, account lockout, refresh-token
revocation storage, audit-log retention/storage, compliance scope) are all for
capabilities **not introduced by this Story**, and the implementation correctly
does not pre-empt any of them (no lockout thresholds invented, no token
variables added, audit event deliberately PII-free so retention need not be
decided yet).

## 22. Review Limitations

- **`npm run build`, `npm run openapi:check`, `npm run check:cycles`,
  `prisma migrate deploy/status`** were not re-executed this stage. They were
  green at `implementation_verification` v2 and nothing they cover (`src/`, the
  schema, the generated contract) has changed since — `git diff --name-status
  HEAD` over `src/` and `prisma/` is empty; the only tracked change is a
  test-file mock scope. Reused, low risk.
- **`npm run validate:harness`** not run — the workflow harness is outside
  security scope and was not modified.
- **No dynamic scanning / DAST / fuzzing** was performed; the app was exercised
  only through the Supertest integration suite and never bound to a socket. The
  negative-path integration coverage is broad (see §15) but is not a substitute
  for a dedicated penetration test, which organisational policy does not
  currently mandate for this Story.
- **SCA depth** is the npm advisory database via `audit:check` only — no
  supply-chain provenance or malware analysis.
- **`prisma migrate reset`** (clean-apply-to-empty observation) is refused by
  Prisma's AI-agent guard, as at verification; `migrate status` + the reviewed
  SQL + the green integration suite stand in.
- Review ran on Windows; CI runs Linux. Nothing in the security surface is
  OS-dependent.

## 23. Verdict Rationale

`implementation_verification` v2 is `PASS` with independently reproduced
evidence. Every security control required by the Story, the Specification, and
`security-conventions.md` SC-1…SC-9 is present and was verified **active at
runtime**, not merely declared: Argon2id hashing with non-weakenable
parameters, plaintext confined to the boundary, a leak-free duplicate/race
path, active Zod boundary validation with `strictObject`, complete and
correctly-ordered HTTP hardening, a per-IP rate limit with a trustworthy client
IP, an injection-safe request id, and a PII-free best-effort audit event. The
one new dependency has recorded SC-6 approval and `audit:check` is green. There
are **no Critical and no Major findings**.

The single Minor finding (`SECURITY_REVIEW:s-1`) is a defence-in-depth
observability gap — unmapped errors are not logged server-side — with no
data-exposure component and no Acceptance Criterion dependence. Per
`artifact-lifecycle.md` §4 a Minor does not block; it is recorded in
`non_blocking_findings` for a later `IMPLEMENTATION` touch or the PR.

**Verdict: PASS. Next stage: `RECONCILIATION`.**
