---
artifact_type: ac_test_matrix
story: US-001
version: 4
status: DRAFT
created_at: 2026-09-03T13:55:00Z
updated_at: 2026-09-03T23:05:00Z
produced_by: test-writer
inputs:
  - path: docs/specifications/US-001-spec.md
    version: 14
  - path: docs/designs/api/US-001-api-design.md
    version: 2
  - path: docs/designs/api/US-001-openapi.yaml
    version: 2
  - path: docs/designs/database/US-001-db-design.md
    version: 2
  - path: docs/impact-analysis/US-001-impact-analysis.md
    version: 2
  - path: docs/plans/US-001-implementation-plan.md
    version: 4
  - path: docs/verification/US-001-implementation-verification.md
    version: 1
supersedes: docs/tests/US-001-ac-test-matrix.md@3
---

# Acceptance-Criterion → Test Matrix: Customer Registration (US-001)

**Revision 4 (2026-09-03) — `IMPLEMENTATION_VERIFICATION:V-1` correction.** No
row changed: the fix for V-1 refined the mock scope inside the existing EC-4
case in `tests/integration/auth-register-audit.test.ts` (AC-007, second row) —
same file, same test name, same expected result. The write-up is in
`docs/evidence/US-001-test-generation-report.md` (v4).

Every Acceptance Criterion below has at least one mapped scenario (NFR-006); no
row is `NOT COVERED`. The rows were authored in the RED phase before
`IMPLEMENTATION`; the workflow has since reached `IMPLEMENTATION_VERIFICATION`
and every mapped test now compiles and passes green against a real database
(the loop-back to this stage was for V-1 alone) — see the report's Revision 4
command table.

## AC-001 — Successful registration

| Scenario | Test Level | Test File | Test Name | Expected Result |
|---|---|---|---|---|
| Happy path, 201, four fields | Integration | tests/integration/auth-register-success.test.ts | creates an account and returns 201 with exactly the four contract fields | `201`; body keys exactly `id, email, role, createdAt` |
| Role is CUSTOMER | Integration | tests/integration/auth-register-success.test.ts | sets role to CUSTOMER (FR-3, SC-2) | `role: "CUSTOMER"` |
| X-Request-Id present | Integration | tests/integration/auth-register-success.test.ts | returns X-Request-Id on the success response (AC-9, FR-15, NFR-010) | header present, non-empty |
| Row persisted, findable by normalized email | Integration | tests/integration/auth-register-success.test.ts | persists exactly one row, retrievable by the normalized email (FR-2, BR-1) | one row exists |
| Email boundary: exactly 254 chars accepted | Integration | tests/integration/auth-register-success.test.ts | accepts an email at exactly the 254-character bound (VR-3) | `201` |
| Password boundary: exactly 12 chars accepted | Integration | tests/integration/auth-register-success.test.ts | accepts a password at exactly the 12-character minimum (VR-6) | `201` |
| Password boundary: exactly 128 chars accepted | Integration | tests/integration/auth-register-success.test.ts | accepts a password at exactly the 128-character maximum (VR-6) | `201` |
| Orchestration: hash then create (unit) | Unit | src/modules/auth/auth.service.test.ts | hashes the password and creates the account on the happy path (AC-001, FR-10) | `hashPassword` and `createCustomer` both called |
| Orchestration: exactly one row created (unit) | Unit | src/modules/users/users.service.test.ts | creates exactly one account for a new email (FR-2) | `repository.create` called once |

## AC-002 — Unique email

| Scenario | Test Level | Test File | Test Name | Expected Result |
|---|---|---|---|---|
| Duplicate rejected, no second row | Integration | tests/integration/auth-register-duplicate.test.ts | rejects a duplicate email with 409 EMAIL_ALREADY_REGISTERED, and creates no second account (FR-6, BR-1) | `409`, `EMAIL_ALREADY_REGISTERED`, 1 row |
| Case-only duplicate (EC-1) | Integration | tests/integration/auth-register-duplicate.test.ts | rejects a duplicate that differs only by letter case (EC-1, BR-2) | `409`, 1 row |
| Whitespace-only duplicate (EC-2) | Integration | tests/integration/auth-register-duplicate.test.ts | rejects a duplicate that differs only by leading or trailing whitespace (EC-2, VR-4) | `409`, 1 row |
| Concurrent race (EC-3), no Prisma leak | Integration | tests/integration/auth-register-duplicate.test.ts | returns the identical 409 body for two concurrent registrations of the same email, with no Prisma text leaked (EC-3, SR-6, SC-9) | one `201`, one `409` identical body, 1 row, no Prisma text |
| Pre-check short-circuits before hashing | Unit | src/modules/auth/auth.service.test.ts | never hashes the password on the duplicate-email path (FR-7, SC-3) | `hashPassword` not called |
| Race path still hashes, same ConflictError | Unit | src/modules/auth/auth.service.test.ts | still hashes the password when the pre-check passes but the insert loses the race, and surfaces the same ConflictError (EC-3, BR-1) | `hashPassword` called; `ConflictError` thrown |
| Service raises ConflictError on pre-check hit | Unit | src/modules/users/users.service.test.ts | raises ConflictError(EMAIL_ALREADY_REGISTERED) when the email already exists, and creates no row (AC-002, FR-6) | throws `ConflictError`; `create` not called |
| P2002 translated to the same ConflictError | Unit | src/modules/users/users.service.test.ts | translates a database-level unique violation (P2002) into the same ConflictError as the pre-check (EC-3, BR-1) | throws `ConflictError` |
| P2002 text never leaks | Unit | src/modules/users/users.service.test.ts | never leaks the Prisma error message, code, or constraint name through the translated error (SR-6, SC-9) | message excludes Prisma text/`P2002` |

## AC-003 — Email validation

| Scenario | Test Level | Test File | Test Name | Expected Result |
|---|---|---|---|---|
| Missing email (EC-5) | Integration | tests/integration/auth-register-email-validation.test.ts | rejects a missing email (VR-1, EC-5) | `400 VALIDATION_FAILED`, `fieldErrors.email` |
| Non-string email | Integration | tests/integration/auth-register-email-validation.test.ts | rejects a non-string email (VR-1) | `400 VALIDATION_FAILED`, `fieldErrors.email` |
| Invalid format | Integration | tests/integration/auth-register-email-validation.test.ts | rejects an invalid email format (VR-2) | `400 VALIDATION_FAILED`, `fieldErrors.email` |
| Over 254 chars (EC-8) | Integration | tests/integration/auth-register-email-validation.test.ts | rejects an email over 254 characters, one past the boundary (VR-3, EC-8) | `400 VALIDATION_FAILED`, `fieldErrors.email` |
| No password echo on this path | Integration | tests/integration/auth-register-email-validation.test.ts | never echoes the submitted password in a validation error (SR-3, SC-9, VR-11) | body excludes submitted password |

## AC-004 — Password validation

| Scenario | Test Level | Test File | Test Name | Expected Result |
|---|---|---|---|---|
| Missing password (EC-5) | Integration | tests/integration/auth-register-password-validation.test.ts | rejects a missing password (VR-5, EC-5) | `400 VALIDATION_FAILED`, `fieldErrors.password` |
| Non-string password | Integration | tests/integration/auth-register-password-validation.test.ts | rejects a non-string password (VR-5) | `400 VALIDATION_FAILED`, `fieldErrors.password` |
| 11 chars (below minimum, EC-6) | Integration | tests/integration/auth-register-password-validation.test.ts | rejects a password one character short of the 12-character minimum (VR-6, EC-6) | `400 VALIDATION_FAILED` |
| 129 chars (above maximum, EC-6) | Integration | tests/integration/auth-register-password-validation.test.ts | rejects a password one character past the 128-character maximum (VR-6, EC-6) | `400 VALIDATION_FAILED` |
| Fewer than 3 of 4 classes | Integration | tests/integration/auth-register-password-validation.test.ts | rejects a password satisfying fewer than 3 of the 4 character classes (VR-6) | `400 VALIDATION_FAILED` |
| Caseless-script password reaching only 2 of 4 classes (SC-1 known limitation, EC-6) | Integration | tests/integration/auth-register-password-validation.test.ts | rejects a caseless-script password that can reach only 2 of the 4 classes (SC-1 known limitation, EC-6) | `400 VALIDATION_FAILED`, `fieldErrors.password` |
| Unicode code-point counting | Integration | tests/integration/auth-register-password-validation.test.ts | counts password length in Unicode code points, not UTF-16 code units or bytes (SC-1) | `201` at 12 code points |
| No password echo on this path | Integration | tests/integration/auth-register-password-validation.test.ts | never echoes the submitted password in a validation error (SR-3, SC-9) | body excludes submitted password |

## AC-005 — Password storage

| Scenario | Test Level | Test File | Test Name | Expected Result |
|---|---|---|---|---|
| Stored as Argon2id hash, never plaintext | Integration | tests/integration/auth-register-success.test.ts | stores the password only as an Argon2id hash, never in plaintext (AC-005, SR-1) | DB row `passwordHash` starts `$argon2id$`, ≠ submitted value |
| Hash call uses exactly the 3 SC-1 parameters | Unit | src/lib/password.test.ts | hashes with Argon2id and exactly the three decided cost parameters, on every call | `argon2.hash` called with `{type: argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1}` |
| No library defaults relied on | Unit | src/lib/password.test.ts | does not rely on the library defaults — every parameter is passed explicitly | same as above, asserted per-call |
| Hash function returns the encoded hash | Unit | src/lib/password.test.ts | returns the encoded hash argon2 produces | return value matches mocked hash |
| Plaintext never in the returned hash | Unit | src/lib/password.test.ts | never returns the plaintext password itself (SR-3) | hash string excludes plaintext |
| Repository selects only id/email/role/createdAt | Unit | src/modules/users/users.service.test.ts | selects only id, email, role and createdAt on insert — never password_hash (SR-4, PC-8) | result excludes `passwordHash`/`password_hash` |

## AC-006 — Secure response

| Scenario | Test Level | Test File | Test Name | Expected Result |
|---|---|---|---|---|
| No credential field on success | Integration | tests/integration/auth-register-success.test.ts | never returns the password or password hash in the response body (AC-006, SR-4) | no `password`/`passwordHash`/`password_hash` key; no plaintext substring |

## AC-007 — Audit logging

| Scenario | Test Level | Test File | Test Name | Expected Result |
|---|---|---|---|---|
| Audit event content and shape | Integration | tests/integration/auth-register-audit.test.ts | logs a user.registered event with event, userId and requestId, and no personal data (FR-12, SC-9) | logged object keys exactly `event, requestId, userId`; excludes email |
| Failed audit write does not fail the request (EC-4) | Integration | tests/integration/auth-register-audit.test.ts | does not fail the request when the audit write itself throws, and logs that failure as an error (EC-4) | `201` still returned; `logger.error` called |
| Audit call shape (unit) | Unit | src/modules/auth/auth.service.test.ts | emits a user.registered audit event carrying only event, userId and requestId, after account creation (AC-007, FR-12) | `auditLog` called with exact shape |
| No personal data in audit call (unit) | Unit | src/modules/auth/auth.service.test.ts | does not include the email or any personal data in the audit event (SC-9) | payload excludes email |
| Audit failure logged, request still succeeds (unit) | Unit | src/modules/auth/auth.service.test.ts | logs a failed audit write as an error and still returns the created account (EC-4) | result returned; `logger.error` called |

## Cross-cutting: envelope, VR-9/VR-10, IMPACT_ANALYSIS:R-4, DESIGN_REVIEW:e-2

These bind no single AC (Traceability section of the Specification places
VR-9/VR-10/VR-11 across the whole operation, not one criterion) and are
covered here.

| Scenario | Test Level | Test File | Test Name | Expected Result |
|---|---|---|---|---|
| Unknown property keyed by its own name | Integration | tests/integration/auth-register-envelope.test.ts | rejects an unknown body property with 400, keyed by the offending property name (VR-9, IMPACT_ANALYSIS:R-4) | `fieldErrors.admin` populated |
| e-2 shape 1: JSON array body | Integration | tests/integration/auth-register-envelope.test.ts | e-2 shape 1 — a JSON array body is 400, naming both email and password as missing (DESIGN_REVIEW:e-2, R-4) | `fieldErrors.email` and `.password` both populated |
| e-2 shape 2: bodyless + application/json | Integration | tests/integration/auth-register-envelope.test.ts | e-2 shape 2 — a bodyless POST with application/json is 400 VALIDATION_FAILED, not 415 (DESIGN_REVIEW:e-2) | `400`, not `415` |
| e-2 shape 3: bodyless + no Content-Type | Integration | tests/integration/auth-register-envelope.test.ts | e-2 shape 3 — a bodyless POST with no Content-Type is 400 VALIDATION_FAILED, not 415 (DESIGN_REVIEW:e-2, Error Handling table) | `400`, not `415` |
| Body + wrong Content-Type → 415 | Integration | tests/integration/auth-register-envelope.test.ts | rejects a request with a body and a non-JSON Content-Type as 415 (VR-10, FR-22) | `415 UNSUPPORTED_MEDIA_TYPE` |
| Body + no Content-Type → 415 | Integration | tests/integration/auth-register-envelope.test.ts | rejects a request with a body and no Content-Type as 415 (VR-10) | `415 UNSUPPORTED_MEDIA_TYPE` |
| Oversized body → 413 | Integration | tests/integration/auth-register-envelope.test.ts | rejects a body exceeding the 10kb limit with 413 (VR-10, FR-14, SC-5) | `413 PAYLOAD_TOO_LARGE` |
| Malformed JSON → 400 MALFORMED_JSON | Integration | tests/integration/auth-register-envelope.test.ts | rejects unparseable JSON with 400 MALFORMED_JSON and omits details (Error Handling table, AC-11) | `400 MALFORMED_JSON`, no `details` |
| `unrecognized_keys` → keyed fieldErrors (unit) | Unit | src/middleware/errorHandler.test.ts | keys an unrecognized-property failure by the offending property name, not left empty (IMPACT_ANALYSIS:R-4) | `fieldErrors.admin` populated |
| Root-level `invalid_type` → both fields (unit) | Unit | src/middleware/errorHandler.test.ts | keys a root-level (non-object body) failure onto both required fields, not left empty (IMPACT_ANALYSIS:R-4, DESIGN_REVIEW:e-2) | `fieldErrors.email` and `.password` populated |
| `fieldErrors` never empty (unit, VR-11) | Unit | src/middleware/errorHandler.test.ts | never sends an empty fieldErrors object for any ZodError (VR-11, contract minProperties: 1) | non-empty object |
| No password echo (unit) | Unit | src/middleware/errorHandler.test.ts | never echoes a submitted password value in message or details (SR-3, SC-9) | body excludes plaintext |
| DomainError → status/code mapping (unit, AD-6) | Unit | src/middleware/errorHandler.test.ts | maps a domain error carrying %s to status %i (parametrized: EMAIL_ALREADY_REGISTERED/UNSUPPORTED_MEDIA_TYPE/PAYLOAD_TOO_LARGE/RATE_LIMIT_EXCEEDED/MALFORMED_JSON) | status+code per AD-6 |
| MALFORMED_JSON omits details (unit) | Unit | src/middleware/errorHandler.test.ts | omits details entirely for MALFORMED_JSON rather than sending it empty (AC-11, Error Handling table) | `details` undefined |
| Unmapped error → generic 500 (unit) | Unit | src/middleware/errorHandler.test.ts | returns a generic 500 body for an unmapped error, leaking no internals (SC-9, SR-6) | `500 INTERNAL_ERROR`, no internals |
| 415-vs-400 split, body + wrong type (unit) | Unit | src/middleware/validateRequest.test.ts | rejects a request with a body and a non-JSON Content-Type as 415, before the schema runs | `next(UnsupportedMediaTypeError)` |
| 415-vs-400 split, body + no type (unit) | Unit | src/middleware/validateRequest.test.ts | rejects a request with a body and no Content-Type at all as 415 | `next(UnsupportedMediaTypeError)` |
| Bodyless request not raised as 415 (unit) | Unit | src/middleware/validateRequest.test.ts | does not raise 415 for a bodyless request, leaving it to the schema instead (Error Handling table) | `next()` arg is not `UnsupportedMediaTypeError` |
| Valid body passes through (unit) | Unit | src/middleware/validateRequest.test.ts | applies the schema and calls next() with no error on a valid application/json body | `next()` called with no argument |
| Schema failure forwarded as ZodError (unit) | Unit | src/middleware/validateRequest.test.ts | forwards a schema failure to next() as a ZodError rather than building a response itself (AC-12) | `next(ZodError)` |

## Cross-cutting: rate limit (FR-13, EC-7, SC-3, D-5, D-6)

| Scenario | Test Level | Test File | Test Name | Expected Result |
|---|---|---|---|---|
| 11th request → 429, no account, no hash | Integration | tests/integration/auth-register-rate-limit.test.ts | returns 429 with the AC-6 body on the 11th request, creating no account and hashing no password (FR-13, EC-7) | `429 RATE_LIMIT_EXCEEDED`; no row |
| X-Request-Id survives the limiter (D-5) | Integration | tests/integration/auth-register-rate-limit.test.ts | carries X-Request-Id on the 429 response, proving the limiter runs after requestId in the middleware order (D-5) | header present on `429` |
| No RateLimit-*/Retry-After headers (D-6) | Integration | tests/integration/auth-register-rate-limit.test.ts | does not emit RateLimit-* or Retry-After headers (D-6: standardHeaders/legacyHeaders false) | headers absent |

## Traceability check

Every AC-001…AC-007 has at least one row above (NFR-006). Every `Critical`/
`Major`-severity live finding this stage was handed
(`IMPACT_ANALYSIS:R-4`, `DESIGN_REVIEW:e-2`) has dedicated rows at both the
integration and unit level. `IMPLEMENTATION_PLANNING:R-P1` and
`PLAN_REVIEW:p-10` are addressed structurally — see the Test Generation
Report — rather than by a test row, since both describe why the suite cannot
execute yet rather than a behavior to assert.
