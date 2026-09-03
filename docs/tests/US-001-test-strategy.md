---
artifact_type: test_strategy
story: US-001
version: 1
status: DRAFT
created_at: 2026-09-03T13:55:00Z
updated_at: 2026-09-03T13:55:00Z
produced_by: test-writer
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
  - path: docs/reviews/plans/US-001-plan-review.md
    version: 4
supersedes: null
---

# Test Strategy: Customer Registration (US-001)

**This stage returns `BLOCKED`.** The strategy below is complete and the test
source it describes is written, but none of it can compile, lint, or run yet —
see `docs/evidence/US-001-test-generation-report.md` for the evidence and the
blocking finding. This document, the paired AC-test matrix, and the test source
files are the deliverable that a human decision unblocks; nothing here needs to
be redone once it is.

## Scope

Every Acceptance Criterion of US-001 (AC-001…AC-007), the validation rules that
gate them (VR-1…VR-11), the security requirements that constrain what a
response and a log line may carry (SR-1…SR-10), the error-handling table's
seven response shapes, and the eight edge cases the Specification names
(EC-1…EC-8). Scope stops at US-001's own boundary: no login/refresh/logout
behavior (US-002), no email verification, no profile field, no role beyond
`CUSTOMER` — all explicitly Out of Scope in the Specification.

## Test levels selected

Per `docs/architecture/architecture.md` AD-9 and the plan's own Testing
Strategy table (`docs/plans/US-001-implementation-plan.md`, section "Testing
Strategy"), which this document does not re-derive but implements:

- **Integration** (Supertest against `src/app.ts`, PC-1 database): the
  majority of coverage — every HTTP-observable behavior: status codes, error
  bodies, headers, persistence, and the rate limit.
- **Unit**: the four items the plan names — service orchestration
  (`auth.service.ts`, `users.service.ts`), `password.ts`'s three explicit
  Argon2id parameters, the error middleware's `ZodError → fieldErrors`
  mapping (both `IMPACT_ANALYSIS:R-4` cases), and the `415`-vs-`400` split in
  `validateRequest.ts`.
- **Contract**: folded into the integration suite — every declared response
  shape is asserted against the approved `docs/designs/api/US-001-openapi.yaml`
  schemas directly (no separate schema-validation library added; SC-6 forbids
  an unneeded dependency).
- **Security**: folded into the relevant integration and unit tests rather
  than a separate suite — every response assertion also checks for credential
  fields and plaintext-password leakage (`tests/support/api.ts` helpers).

## Positive scenarios

- AC-001 happy path: `201`, exactly four fields, `role: CUSTOMER`, persisted
  row, `X-Request-Id` present.
- Boundary-valid inputs that must succeed: email at exactly 254 characters
  (VR-3), password at exactly 12 and exactly 128 characters (VR-6), a
  12-code-point password in a caseless script satisfying 3-of-4 classes via
  digit/symbol/other (SC-1's own named limitation, not violated by this case),
  a 12-code-point Cyrillic password proving the length is counted in code
  points, not bytes or UTF-16 units.

## Negative scenarios

- AC-002: duplicate email (service-check path).
- AC-003: missing, non-string, malformed, and over-length email.
- AC-004: missing, non-string, under-length, over-length, and
  under-composed password.
- VR-9: unknown body property.
- VR-10: wrong/missing `Content-Type` on a body-bearing request (`415`);
  oversized body (`413`).
- Malformed JSON (`400 MALFORMED_JSON`).
- FR-13/EC-7: the register rate limit.

## Boundary scenarios

Email: 254 (valid) vs. 255 (rejected). Password: 11 (rejected) vs. 12
(accepted); 128 (accepted) vs. 129 (rejected). Rate limit: the 10th request
(accepted) vs. the 11th (rejected). Every boundary pair is asserted in the
integration suite rather than inferred from one side.

## Validation scenarios

`IMPACT_ANALYSIS:R-4` and `DESIGN_REVIEW:e-2` are this Story's named coverage
trap and are covered explicitly rather than folded into the generic
email/password cases: three request shapes — a JSON array body, a bodyless
`POST` with `Content-Type: application/json`, and a bodyless `POST` with no
`Content-Type` — reach the same `400 VALIDATION_FAILED` through two different
Zod failure mechanisms (a root-level `invalid_type` issue for the first two,
schema-required-field issues for the bodyless-with-content-type case, and the
boundary middleware's own `415` check never firing for any of the three,
since none carries a body). Each is a distinct integration test, and the
`unrecognized_keys` mapping (unknown body property) is tested separately from
all three. The unit-level `errorHandler.test.ts` re-proves both underlying
Zod mechanisms directly against `ZodError` instances, independent of the HTTP
layer.

## Security scenarios

No response (success or error, across every status code exercised) contains a
`password`, `passwordHash`, or `password_hash` field, or the submitted
plaintext value, in any case where a password was submitted
(`tests/support/api.ts` — `expectNoCredentialFields`, `expectNoPlaintextLeak`,
applied wherever a request carried a password). The duplicate-email race path
is asserted to carry no Prisma error text, `P2002`, or constraint name
(SR-6, SC-9). The audit event is asserted to carry exactly `event`, `userId`,
`requestId` — no email, no IP (SC-9, FR-12).

## Persistence scenarios

The stored email is the normalized (trimmed, lowercased) value, asserted both
in the response and by reading the row directly (BR-2, VR-4, EC-1, EC-2). The
stored password is an Argon2id hash (`$argon2id$` prefix), never the
submitted plaintext (AC-005). A duplicate under a race leaves exactly one row
(EC-3). Every integration test truncates the one table (`user`) in a
`beforeEach` (`tests/support/database.ts`) — no test assumes it starts empty.

## Required fixtures

- `tests/support/api.ts` — Supertest wrapper, unique-email generator, a valid
  password fixture, and the shared no-leak/`X-Request-Id` assertions. Added
  beyond the plan's explicit Step-4 file list; `docs/architecture/module-map.md`
  and this stage's own SKILL.md both name `tests/support/` as the place for
  shared fixtures, so this is an ordinary elaboration, not a deviation.
- `tests/support/globalSetup.ts` — runs `prisma migrate deploy` for the
  `integration` Vitest project (PC-1). Not yet wired into `vitest.config.ts`;
  that conversion is `IMPLEMENTATION` plan Step 3 (D-10).
- `tests/support/database.ts` — truncates the one table between tests (PC-1).

## Why the integration suite is split across seven files, not one

`docs/architecture/module-map.md`'s Test placement rule names one file,
`tests/integration/auth-register.test.ts`, as the illustrative example — it
does not require exactly one file per endpoint. This Story's own approved
contract makes one file impractical: `security-conventions.md` SC-3 rate-limits
`POST /api/v1/auth/register` to **10 requests per hour per IP**, `express-rate-limit`
counts every request against that limiter regardless of its outcome, and this
Story's approved contract has far more than ten distinct
request/response scenarios to prove. Vitest gives every test **file** its own
fresh module graph by default, so each file's import of `src/app.ts` carries
its own independent, zero-count rate-limiter instance; splitting by topic
(success, duplicate, email validation, password validation, envelope,
rate-limit, audit) keeps every file except the one that deliberately tests the
limiter itself comfortably under the ten-request budget, with no code change
and no new test-only configuration. The Testing Principles above forbid a
test that depends on execution order or on another test's state — a single
file exceeding the budget partway through would violate exactly that, non-
deterministically, depending on which scenario happened to be the eleventh
request. This is recorded here because it is a real, evidenced constraint the
approved artifacts do not mention, not a stylistic preference.

## Excluded scenarios, with justification

- **Re-verifying a password on login, and any token issuance.** US-001 issues
  no token (BR-4); that behavior belongs to US-002.
- **Breached-password check.** Deferred to US-009 (VR-7).
- **Account lockout, rotation, expiry, history.** Not defined; SC-1 forbids
  inventing one.
- **Rate-limit thresholds for `login`/`refresh`/`logout`.** Not this Story's
  endpoint; SC-3 explicitly reserves them.
- **A dedicated `RateLimit-*`/`Retry-After` header contract test beyond
  asserting their absence.** D-6 (`standardHeaders: false`, `legacyHeaders:
  false`) is a configuration choice, not a header contract; asserting the
  headers are absent is what proves it.
- **Testing account-state or role values beyond `CUSTOMER`.** FR-4 and SC-2
  place both out of scope for this Story.

## Known limitations

1. **Nothing in this suite compiles, lints, or runs yet.** Every test file
   references a production export that does not exist (every module this
   Story touches is currently a one-line placeholder). This is not a defect in
   the tests — `npm run typecheck` reports exactly, and only, the twelve
   unresolved-export errors this causes, with no other diagnostic — but it is
   a genuine gap the approved Implementation Plan under-scoped. See the
   Test Generation Report for the full evidence and the resulting `BLOCKED`
   verdict.
2. **Two service-layer collaborator interfaces are assumed, not specified.**
   No approved artifact fixes an export or dependency-injection shape for
   `auth.service.ts` or `users.service.ts` beyond the responsibilities the
   Specification's Affected Components table names. `src/modules/auth/auth.service.test.ts`
   and `src/modules/users/users.service.test.ts` each document, in their own
   header comments, the specific collaborator shape they assume and why — in
   particular, an `emailExists` pre-check in `users.service.ts` that lets
   `auth.service.ts` skip hashing on the duplicate path (FR-7) while
   preserving the single transactional check-and-insert BR-5/BR-6 require.
   IMPLEMENTATION may reach the same externally observable behavior a
   different way; the fakes in those two files would then need updating to
   match, which is a routine test-implementation sync, not a spec deviation
   or a `changes_required_tests` loop-back.
3. **The FR-7 "no hash on the duplicate path" requirement has no HTTP-level
   proof.** A response-time assertion would be the natural integration-level
   check, but the Testing Principles explicitly forbid timing-dependent tests
   except where explicitly required, and SC-3 explicitly forbids "hardening"
   registration into constant-time behavior — so timing is exactly the wrong
   thing to assert on, in either direction. The unit-level
   `auth.service.test.ts` asserts it directly, by observing whether
   `hashPassword` was called, which does not depend on relative timing.

## Open Decisions affecting testing

None of the twelve entries in `docs/decisions/US-001-open-decisions.md`
(all `RESOLVED` at v7) affect this stage. This stage's own finding — the
compile/lint blocker above — is not an Open Decision in that registry's sense
(it is not a product or business-rule question); it is recorded in the Test
Generation Report as a `BLOCKED` finding for a human to resolve, per
`docs/workflow/artifact-lifecycle.md` §2.
