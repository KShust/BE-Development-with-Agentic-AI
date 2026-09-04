---
artifact_type: traceability
story: US-001
version: 1
status: APPROVED
created_at: 2026-09-04T06:06:44Z
updated_at: 2026-09-04T06:06:44Z
produced_by: reconciliation-reviewer
inputs:
  - path: docs/stories/US-001-register-customer.md
    version: null
  - path: docs/specifications/US-001-spec.md
    version: 14
  - path: docs/designs/api/US-001-api-design.md
    version: 2
  - path: docs/designs/api/US-001-openapi.yaml
    version: 2
  - path: docs/designs/database/US-001-db-design.md
    version: 2
  - path: docs/designs/database/US-001-entity-model.md
    version: 1
  - path: docs/impact-analysis/US-001-impact-analysis.md
    version: 2
  - path: docs/plans/US-001-implementation-plan.md
    version: 4
  - path: docs/tests/US-001-ac-test-matrix.md
    version: 4
  - path: docs/evidence/US-001-implementation-report.md
    version: 4
  - path: docs/verification/US-001-implementation-verification.md
    version: 2
  - path: docs/reviews/security/US-001-security-review.md
    version: 1
supersedes: null
---

# End-to-End Traceability Matrix: Customer Registration (US-001)

Authoritative AC → artifact / code / test matrix for US-001. Downstream Skills
reference this; they do not rebuild it. Final status vocabulary: `RECONCILED`,
`PARTIALLY_RECONCILED`, `NOT_RECONCILED`, `BLOCKED`.

**Summary: 7 of 7 Acceptance Criteria `RECONCILED`.**

---

## AC-001 — Successful registration

| Dimension | Trace |
|---|---|
| Story section | AC-001 "Successful Registration" (account created, role `CUSTOMER`, success response, customer can authenticate later) |
| Specification | FR-1, FR-2, FR-3, FR-4, FR-5, FR-10, FR-17; VR-1, VR-2, VR-5; SR-1, SR-2; AC table row AC-001 |
| Resolved decision | OD-US-001-01 (`201`, no `Location`), OD-US-001-02 (`{id,email,role,createdAt}`), OD-US-001-03 (email+password only), OD-US-001-05 (no state column) |
| API design | `US-001-api-design.md` §Operation, §Success response; `US-001-openapi.yaml` `POST /api/v1/auth/register` `201` → `RegisterResponse` (4 fields, `additionalProperties:false`), `X-Request-Id` header |
| Database design | `US-001-db-design.md` §Model (`user` table), §"Access paths" #2 (`create` selecting the 4 response fields); `US-001-entity-model.md` §Attributes, §"Mapping to the API contract" |
| Impact Analysis | §3 (Self-service account creation — Introduced), §6 Files To Modify (`auth/*`, `users/{service,repository}`), §10 Integration happy path |
| Plan step | Steps 2, 5, 7, 8, 9, 10 (Traceability table row AC-001) |
| Production location | `src/modules/auth/auth.controller.ts` `register` (`res.status(201).json({id,email,role,createdAt})`); `src/modules/auth/auth.service.ts` `createAuthService().register`; `src/modules/users/users.service.ts` `createCustomer` (inside `usersRepository.transaction`); `src/modules/users/users.repository.ts` `create` (`CUSTOMER_SELECT`); `src/lib/password.ts` `hashPassword`; `src/modules/auth/auth.schemas.ts` `registerResponseSchema`; `prisma/schema.prisma` `model User` + `20260903192254_init_user` |
| Test | `tests/integration/auth-register-success.test.ts` — creates 201 + 4 fields; role CUSTOMER; `X-Request-Id` present; one row persisted, retrievable by normalized email; email @254 bound; password @12 / @128 bounds. `src/modules/auth/auth.service.test.ts` — hash then create on happy path. `src/modules/users/users.service.test.ts` — exactly one row created |
| Verification evidence | `implementation_verification` v2 §7 AC-001 **VERIFIED**; §6 full suite 73/73 exit 0 |
| Security Review evidence | `security_review` v1 §7 (plaintext confined to boundary), §20 controls 1–2 |
| **Reconciliation status** | **RECONCILED** |

## AC-002 — Unique email

| Dimension | Trace |
|---|---|
| Story section | AC-002 "Unique Email" (rejected, no duplicate account, response states email already registered — amended 2026-09-01, BR-009) |
| Specification | FR-6, FR-7; VR-4; SR-6; BR-1, BR-2, BR-3, BR-5, BR-6; EC-1, EC-2, EC-3; Error Handling rows `409` (service check + P2002 race) |
| Resolved decision | BR-009 (disclosure is decided behaviour); OD-US-001-10 (trim then lowercase) |
| API design | `US-001-openapi.yaml` `409` → `ConflictErrorResponse` (`EMAIL_ALREADY_REGISTERED`, no details); design notes "no Prisma text in the body" |
| Database design | `US-001-db-design.md` §"The unique constraint is not a duplicate of the service check", §"Access paths", §"race / P2002 translation", unique index `user_email_key` |
| Impact Analysis | §8 persistence obligations 2 & 3 (P2002 translation; the transaction does not alone prevent the race), §10 Integration duplicate (incl. P2002 path) |
| Plan step | Steps 2, 5, 6, 8, 9 (Traceability row AC-002 — "both the check and race paths") |
| Production location | `src/modules/users/users.service.ts` `createCustomer` — pre-check inside `repository.transaction` + `isUniqueViolation` P2002 → `ConflictError('EMAIL_ALREADY_REGISTERED')`; `src/modules/auth/auth.service.ts` `register` — pre-check via `usersService.emailExists`, throws before `hashPassword` (FR-7); `src/lib/errors.ts` `ConflictError`; `src/modules/auth/auth.schemas.ts` `emailField` (trim→lowercase) |
| Test | `tests/integration/auth-register-duplicate.test.ts` — plain / case-only (EC-1) / whitespace-only (EC-2) / concurrent race (EC-3, no Prisma text). `src/modules/users/users.service.test.ts` — pre-check ConflictError, P2002 translation, no leak. `src/modules/auth/auth.service.test.ts` — not hashed on duplicate path; race path still hashes, same ConflictError |
| Verification evidence | `implementation_verification` v2 §7 AC-002 **VERIFIED** |
| Security Review evidence | `security_review` v1 §11 (two-layer uniqueness, leak-free race), §16 (enumeration accepted by design — BR-009), §20 controls 3–4 |
| **Reconciliation status** | **RECONCILED** |

## AC-003 — Email validation

| Dimension | Trace |
|---|---|
| Story section | AC-003 "Email Validation" (invalid format → validation error) |
| Specification | FR-8; VR-1, VR-2, VR-3, VR-4; SR-6; EC-5, EC-8; Error Handling row "Invalid email format or length" `400` |
| Resolved decision | OD-US-001-04 (max 254), OD-US-001-09 (`details.fieldErrors` populated), OD-US-001-10 (trim then lowercase) |
| API design | `US-001-openapi.yaml` `RegisterRequest.email` (`format: email`, `maxLength: 254`), `400` → `ValidationErrorResponse` (`VALIDATION_FAILED`, `details.fieldErrors`, `minProperties: 1`) |
| Database design | `US-001-db-design.md` §Model (`email @db.VarChar(254)` — same 254 as the boundary so an over-long value is a `400` not a DB error, EC-8) |
| Impact Analysis | §7 (email bounds), §10 Integration email validation, R-4 (fieldErrors mapping) |
| Plan step | Steps 6, 7 (Traceability row AC-003) |
| Production location | `src/modules/auth/auth.schemas.ts` `emailField` (`z.string().transform(trim+lowercase).pipe(z.email().max(254))`); `src/middleware/validateRequest.ts`; `src/middleware/errorHandler.ts` `toFieldErrors` |
| Test | `tests/integration/auth-register-email-validation.test.ts` — missing (EC-5) / non-string / bad format / >254 (EC-8) / no password echo. `src/middleware/validateRequest.test.ts` — schema failure forwarded as ZodError |
| Verification evidence | `implementation_verification` v2 §7 AC-003 **VERIFIED**, §11 |
| Security Review evidence | `security_review` v1 §9 (input validation), §8 (no submitted value echoed) |
| **Reconciliation status** | **RECONCILED** |

## AC-004 — Password validation

| Dimension | Trace |
|---|---|
| Story section | AC-004 "Password Validation" (policy failure → validation error; policy = `security-conventions.md` SC-1; breached-password check is US-009) |
| Specification | FR-9; VR-5, VR-6, VR-7 (deferred), VR-8, VR-11; SR-3; EC-6; Error Handling row "Password fails the policy" `400` |
| Resolved decision | OD-US-001-09 (`details.fieldErrors` names which rule failed, never echoes the value) |
| API design | `US-001-openapi.yaml` `RegisterRequest.password` (`writeOnly`, `minLength: 12`, `maxLength: 128`), `400` `VALIDATION_FAILED` |
| Database design | n/a (boundary rule; not persisted as policy) |
| Impact Analysis | §9 (policy: 12–128 code points, 3 of 4 classes, expressed once as the schema), §10 Integration password policy incl. boundaries |
| Plan step | Steps 6, 7 (Traceability row AC-004 — VR-7 deferred to US-009) |
| Production location | `src/modules/auth/auth.schemas.ts` `passwordField` — `codePointLength(value) >= 12` and `<= 128` (via `[...value].length`), `characterClassCount(value) >= 3` over `\p{Ll}` / `\p{Lu}` / `[0-9]` / other. No breached-password check (VR-7 correctly absent) |
| Test | `tests/integration/auth-register-password-validation.test.ts` — missing (EC-5) / non-string / 11 / 129 / <3 classes / caseless-script → 400 (EC-6, SC-1 known limitation) / 12-code-point Cyrillic → 201 / no echo. `src/middleware/errorHandler.test.ts` — ZodError → fieldErrors rows |
| Verification evidence | `implementation_verification` v2 §7 AC-004 **VERIFIED**; §6 confirms the T-1-corrected caseless case asserts `400` |
| Security Review evidence | `security_review` v1 §7 (policy is exactly SC-1, nothing invented; known caseless-script limitation preserved) |
| **Reconciliation status** | **RECONCILED** |

## AC-005 — Password storage

| Dimension | Trace |
|---|---|
| Story section | AC-005 "Password Storage" (stored only as an Argon2id hash, never plaintext) |
| Specification | FR-10; SR-1, SR-2, SR-3, SR-4; BR-5; AC table row AC-005 |
| Resolved decision | Argon2id parameters — human 2026-09-01, `security-conventions.md` SC-1 |
| API design | `password` `writeOnly`; not present in any response schema |
| Database design | `US-001-db-design.md` §Model (`password_hash TEXT NOT NULL`, unbounded — the PC-10 exemption), §"Neither query selects password_hash", §"Sensitive-data rules" |
| Impact Analysis | §9 (Argon2id `19456/2/1` explicit every call, constants in `env.ts`), §8 (`password_hash` selected by no query on this path) |
| Plan step | Steps 1, 2, 5, 8 (Traceability row AC-005) |
| Production location | `src/lib/password.ts` `hashPassword` (`argon2.hash(pw, {type: argon2id, memoryCost, timeCost, parallelism})` from `ARGON2ID_PARAMETERS`); `src/config/env.ts` `ARGON2ID_PARAMETERS` (`Object.freeze`, not env-derived); `src/modules/users/users.repository.ts` `create` writes `passwordHash`, `CUSTOMER_SELECT` never reads it |
| Test | `tests/integration/auth-register-success.test.ts` — DB row `passwordHash` starts `$argon2id$` and `!= submitted`. `src/lib/password.test.ts` (4) — Argon2id type + the three cost params + encoded output + no plaintext in the return. `src/modules/users/users.service.test.ts` — selects only id/email/role/createdAt |
| Verification evidence | `implementation_verification` v2 §7 AC-005 **VERIFIED**, §12 |
| Security Review evidence | `security_review` v1 §7 (non-weakenable params, single hashing path), §11, §15, §20 control 1 |
| **Reconciliation status** | **RECONCILED** |

## AC-006 — Secure response

| Dimension | Trace |
|---|---|
| Story section | AC-006 "Secure Response" (no password, no hash, no other sensitive internal field) |
| Specification | FR-11; SR-3, SR-4, SR-5, SR-6; AC table row AC-006; Traceability |
| Resolved decision | OD-US-001-02 (exactly `{id,email,role,createdAt}`) |
| API design | `US-001-openapi.yaml` `RegisterResponse` — 4 fields, `additionalProperties: false`; `password_hash` in no schema |
| Database design | `US-001-entity-model.md` §"Mapping to the API contract" (`passwordHash` returned by no endpoint; repository selects the 4 fields on the write path so it never leaves the repository); `US-001-db-design.md` §"Sensitive-data rules" |
| Impact Analysis | §9 (`additionalProperties: false` makes AC-006 a contract obligation), §7 |
| Plan step | Steps 7, 8, 9 (Traceability row AC-006) |
| Production location | `src/modules/auth/auth.schemas.ts` `registerResponseSchema` (`strictObject`, 4 fields); `src/modules/users/users.repository.ts` `CUSTOMER_SELECT = {id,email,role,createdAt}`; `src/modules/auth/auth.controller.ts` builds the body field-by-field from `CustomerRecord` (which has no hash field) |
| Test | `tests/integration/auth-register-success.test.ts` — never returns password / passwordHash / password_hash, no plaintext substring. `src/modules/users/users.service.test.ts` — result excludes `passwordHash` |
| Verification evidence | `implementation_verification` v2 §7 AC-006 **VERIFIED**, §8 |
| Security Review evidence | `security_review` v1 §8 (sensitive-data exposure table — 201 body exactly the 4 fields), §20 control 2 |
| **Reconciliation status** | **RECONCILED** |

## AC-007 — Audit logging

| Dimension | Trace |
|---|---|
| Story section | AC-007 "Audit Logging" (event logged for security audit, distinct from request logging, no password — `security-conventions.md` SC-9) |
| Specification | FR-12; SR-3, SR-6, SR-7; EC-4; AC table row AC-007 (`{ event: "user.registered", userId, requestId }`, after commit, distinct by `event`, no PII) |
| Resolved decision | OD-US-001-06 (content: no personal data), OD-US-001-11 (best-effort after commit) |
| API design | n/a (no response surface) |
| Database design | n/a (a log line is not a DB write; PC-9 fixes only the account write) |
| Impact Analysis | §3 (Security audit trail — Introduced), §9 (audit event carries `event`,`userId`,`requestId` and no personal data), §10 Audit (incl. EC-4) |
| Plan step | Steps 5, 9 (Traceability row AC-007) |
| Production location | `src/modules/auth/auth.service.ts` `register` — `try { await deps.auditLog({event:'user.registered', userId, requestId}) } catch { deps.logger.error({err,...}, 'audit write failed') }`, after `createCustomer` returns; wired singleton `auditLog: (e) => { logger.info(e); ... }`; `src/lib/logger.ts` `redact` (`remove: true`) |
| Test | `tests/integration/auth-register-audit.test.ts` — logged object keys exactly `event,requestId,userId`, excludes email/ip; EC-4: audit write throws → still `201`, `logger.error` called (V-1-corrected: stub scoped to the `user.registered` payload). `src/modules/auth/auth.service.test.ts` (3) — audit call shape; no PII; failure logged, request still succeeds |
| Verification evidence | `implementation_verification` v2 §7 AC-007 **VERIFIED** (fully; was `PARTIALLY_VERIFIED` at attempt 1 only because its test left the suite non-green — now green as code and as result) |
| Security Review evidence | `security_review` v1 §13 (metadata-only, verified against live run output), §15, §16, §20 control 11 |
| **Reconciliation status** | **RECONCILED** |

---

## Cross-cutting (not a single AC — request envelope / error shape)

| Item | Specification | Production | Test | Status |
|---|---|---|---|---|
| VR-9 — unknown body property rejected, keyed by its own name | VR-9; `IMPACT_ANALYSIS:R-4` | `auth.schemas.ts` `strictObject`; `errorHandler.toFieldErrors` `unrecognized_keys` branch | `auth-register-envelope.test.ts`; `errorHandler.test.ts` | RECONCILED |
| VR-10 — `415` (body + non-JSON type) and `413` (>10kb) | VR-10; FR-14, FR-22; SC-5 | `validateRequest.ts` Content-Type check → `UnsupportedMediaTypeError`; `app.ts` `express.json({limit:'10kb'})` + `jsonBodyErrors.ts` → `PayloadTooLargeError` | `auth-register-envelope.test.ts` (415 w/ + w/o header, 413) | RECONCILED |
| VR-11 — `details.fieldErrors` never empty on `VALIDATION_FAILED` | VR-11; OD-US-001-09; contract `minProperties: 1` | `errorHandler.toFieldErrors` fallback branch | `errorHandler.test.ts` "never sends an empty fieldErrors" | RECONCILED |
| `DESIGN_REVIEW:e-2` — three request shapes → one `400` via two Zod paths | e-2; `IMPACT_ANALYSIS:R-4` | `errorHandler.toFieldErrors` root-path branch keys both required fields | `auth-register-envelope.test.ts` shapes 1/2/3 | RECONCILED |
| Malformed JSON → `400 MALFORMED_JSON`, no `details` | Error Handling table; AD-6 | `jsonBodyErrors.ts` `entity.parse.failed` → `ValidationError('MALFORMED_JSON')` | `auth-register-envelope.test.ts` | RECONCILED |
| FR-13 — rate limit `429`, AC-6 body, no undeclared headers | FR-13, FR-23; SC-3; D-5, D-6; EC-7 | `rateLimit.ts` (10/hr, `standardHeaders/legacyHeaders: false`, `next(TooManyRequestsError)`); `app.ts` mount on `/api/v1/auth` after `requestId` | `auth-register-rate-limit.test.ts` (3) | RECONCILED |
| FR-15 — request id on response + every log line | FR-15; AC-9; NFR-010 | `requestId.ts` (`SAFE_ID` echo or `randomUUID`), `res.locals.requestId`, `X-Request-Id` header; `pino-http` `genReqId` | `auth-register-success.test.ts`; `auth-register-rate-limit.test.ts` (429 carries it) | RECONCILED |
| FR-16 — OpenAPI generated from Zod, not hand-maintained | FR-16; AC-10 | `auth.schemas.ts` `registry.registerPath` (7 responses); `npm run openapi:check` exit 0 | (contract test — `openapi:check` in CI) | RECONCILED |
| FR-18 — `.env.example` no JWT vars | FR-18; SC-3, SC-7 | `.env.example` (4 JWT entries removed); `src/config/env.ts` validates 6 non-JWT vars | `implementation_verification` v2 §13; `Grep` `JWT_` in `src/` → none | RECONCILED |
| FR-20 — `src/server.ts` process entry, graceful shutdown incl. Prisma disconnect | FR-20; `module-map.md` | `src/server.ts` (`listen`, SIGTERM/SIGINT, `disconnectPrisma`); `src/lib/shutdown.ts` re-export (`IMPLEMENTATION:E-1`) | (no direct test; reviewed by reading — plan Step 10) | RECONCILED (with carried Minor E-1) |
| FR-21 — `src/lib/errors.ts` domain-error taxonomy | FR-21; **AD-6 (5 classes)** | `src/lib/errors.ts` — `DomainError` + `ConflictError`, `UnsupportedMediaTypeError`, `PayloadTooLargeError`, `ValidationError`, `TooManyRequestsError` | `errorHandler.test.ts` parametrized DomainError → status mapping | RECONCILED **against AD-6**; spec v14 says "four" — `DESIGN_REVIEW:e-1`, human-ACCEPTED (see reconciliation §16 drift D-1) |
| FR-19 — PC-1 test-database setup | FR-19; PC-1 | `docker-compose.yml`, `db:test:up/down`, `vitest.config.ts` `test.projects`, `tests/support/{globalSetup,database}.ts`, `ci.yml` `services: postgres`, `AGENTS.md` table | full integration suite runs green against 5433 | RECONCILED (`.env.test` local-only per D-4 — `IMPLEMENTATION_PLANNING:R-P2` carried) |

---

## Traceability completeness check

- Every Acceptance Criterion AC-001…AC-007 has: an approved requirement, a
  resolved-decision reference where one applies, an approved design reference (or
  a recorded "n/a" with reason), an Impact-Analysis entry, a plan step, a
  production symbol, at least one test, an `IMPLEMENTATION_VERIFICATION` VERIFIED
  result, and a `SECURITY_REVIEW` reference. **7 / 7 RECONCILED.**
- Every requirement that maps to no AC (FR-13…FR-16, FR-18…FR-24, SR-8…SR-10) is
  carried by a project convention and delivered — traced in the cross-cutting
  table and in `reconciliation` §7.
- No AC is `PARTIALLY_RECONCILED`, `NOT_RECONCILED`, or `BLOCKED`.
- Open Minor items (`reconciliation` §17) attach to FR-20 (E-1), FR-19 / PC-1
  (R-P2, G-1), the PR summary (R-7), the plan text (p-9), the error handler
  (s-1), and `.gitignore` (r-1). None changes an AC status.
