---
artifact_type: test_generation_report
story: US-001
version: 3
status: DRAFT
created_at: 2026-09-03T13:55:00Z
updated_at: 2026-09-03T21:35:00Z
produced_by: test-writer
inputs:
  - path: docs/tests/US-001-test-strategy.md
    version: 3
  - path: docs/tests/US-001-ac-test-matrix.md
    version: 3
  - path: docs/specifications/US-001-spec.md
    version: 14
  - path: docs/plans/US-001-implementation-plan.md
    version: 4
  - path: docs/reviews/plans/US-001-plan-review.md
    version: 4
supersedes: docs/evidence/US-001-test-generation-report.md@2
---

## Revision 3 (2026-09-03) — IMPLEMENTATION:T-1 correction

**Overall result of this revision: `PASS`.** Scope is one finding —
`IMPLEMENTATION:T-1`, raised by `express-implementor` and routed back here
through the loop-back `IMPLEMENTATION.loop_back.changes_required_tests`
(added by the guarded change `327b79e`; `history.jsonl` line 46). No other
test, fixture, artifact, or file was touched. The revisions 1–2 material
below is retained unchanged as the audit trail for `TEST_WRITING:B-1` /
`B-2`; it is not re-litigated here.

### What T-1 was

`tests/integration/auth-register-password-validation.test.ts` carried a case
*"accepts a 12-character password written in a script with no letter case
(SC-1 known limitation, EC-6)"* that was wrong two ways:

1. **Unsatisfiable fixture.** `'中文密码1234!'` is 9 Unicode code points
   (4 Han + 4 digits + 1 `!`), so the case's own precondition
   `expect([...password].length).toBeGreaterThanOrEqual(12)` threw before any
   request. The inline comment ("10 CJK chars + 4 ASCII = 14 code points")
   was arithmetically wrong.
2. **Contradicts SC-1 and the Specification.** SC-1's four classes are
   lowercase `Ll`, uppercase `Lu`, digit, and *"anything else — punctuation,
   symbol, or space"* — one class, not several. Han (category `Lo`, no case)
   contributes only to *"anything else"*, so Han + digits + `!` spans **2 of
   4** classes. SC-1's *"Known limitation of the 3-of-4 rule"* states such a
   password *"is rejected however strong it is"*, and Specification EC-6 says
   this Story *"implements that policy without carving out an exception"*. The
   case asserted `201`; the correct, spec-aligned result is `400`.
   `src/modules/auth/auth.schemas.ts` implements SC-1 literally and is
   correct; it was not touched.

### The fix (option b — assert the documented rejection)

The case now reads *"rejects a caseless-script password that can reach only 2
of the 4 classes (SC-1 known limitation, EC-6)"* and asserts `400`
`VALIDATION_FAILED` with a non-empty `fieldErrors.password`, via the existing
`expectValidationFailed` helper. Fixture: `'中文密码短语加密内容1234'` — 14
code points (10 Han + 4 digits), verified with
`node -e '[...s].length'` → `14`. This pins SC-1's named limitation as a
regression test, which is the case's stated purpose (its name and the `EC-6`
reference); option (a) — turning it into a generic positive — was rejected
because other rows already cover the positive path and it would delete the
limitation coverage.

The two companion artifacts were realigned to match, and nothing else in
them changed:

- `docs/tests/US-001-test-strategy.md` v2 → **v3**: the caseless-script
  scenario moved from *Positive scenarios* to *Negative scenarios* (AC-004),
  described as SC-1's named limitation.
- `docs/tests/US-001-ac-test-matrix.md` v2 → **v3**: the row's expected
  result changed from `201` to `400 VALIDATION_FAILED, fieldErrors.password`
  and its scenario/test-name text updated to match.

The sibling case *"counts password length in Unicode code points…"*
(`'Привет1234!!'`, 12 code points, `Ll`+`Lu`+digit+symbol = 4 classes → `201`)
is unaffected and was left as-is.

### Commands run for this revision

| Command | Exit | Result |
|---|---|---|
| `npm run typecheck` | 0 | 0 errors |
| `npm run lint` | 0 | 0 problems |
| `npm run format:check` | 0 | "All matched files use Prettier code style!" |
| `npx vitest run tests/integration/auth-register-password-validation.test.ts` | 1 | **NOT RUN** — `initializeGlobalSetup` aborts: `PrismaConfigEnvError: Cannot resolve environment variable: DATABASE_URL`. No Docker / PostgreSQL in this environment. |

The integration suite's non-execution is `IMPLEMENTATION_PLANNING:R-P1` — an
environment gap, expected here, and **not** a `TEST_WRITING` blocker: the
corrected case is a static, deterministic assertion against the approved
policy, and CI / `IMPLEMENTATION_VERIFICATION` run the suite against a real
database. `auth-register-password-validation.test.ts` still issues 8 requests
(the caseless case now makes its 1 request instead of throwing at the
precondition), so the SC-3 rate-limit file-split rationale in
`tests/support/api.ts` is unchanged.

### Coverage

AC-004 keeps positive coverage (12- and 128-character boundary passwords, the
code-point-counting case) and gains a negative for SC-1's caseless-script
limitation. No Acceptance Criterion lost a mapped test. `IMPLEMENTATION:T-1`
is **RESOLVED** by this revision.

---

## Revisions 1–2 (retained — `TEST_WRITING:B-1` / `B-2` audit trail)

> Everything below is the report as it stood at revision 2 (TEST_WRITING
> attempts 1–2). `TEST_WRITING:B-1` was discharged there; `TEST_WRITING:B-2`
> was **ACCEPTED** by a human on 2026-09-03 (`history.jsonl` event 44) and
> then discharged at `IMPLEMENTATION` (event 45: `prisma/schema.prisma` +
> `prisma generate`, `typecheck` and `lint` reach 0). The "BLOCKED" headline
> in this section is historical — the current result is Revision 3's `PASS`
> above.

### Overall result (revision 2)

**`BLOCKED`**, on a root cause one file wide — but the stage is no longer
wholly unexecutable, and `TEST_WRITING:B-1` is discharged.

Revision 1 recorded a total failure: no test file compiled, linted, or ran.
The human decision of 2026-09-03 (commit `4a90204`, `AGENTS.md` > Testing)
authorized `test-writer` to create signature-only production stubs, and that
decision does what it was expected to do. **Eight of the nine production
modules this Story's tests import are now stubbed, all 71 authored tests
execute, and every one of them fails for the single correct reason: the
behavior is not implemented.** That is the red phase this stage exists to
produce, and revision 1 could not reach it.

One module cannot be stubbed at all, for a reason no decision about stub
policy can reach — see **The residual blocker** below. It leaves 4 typecheck
errors and 30 lint errors, and **100% of both sets trace to that one file**.

| Check | Revision 1 | This revision |
|---|---|---|
| `npm run format:check` | not reached | **pass** |
| `npm run check:cycles` | not reached | **pass** |
| `npm run typecheck` | 16 errors | **4 errors** — all `src/lib/prisma.ts` |
| `npm run lint` | 173 errors | **30 errors** — all `src/lib/prisma.ts` |
| tests executing | **0 of 71** | **71 of 71** |

## The residual blocker

**`TEST_WRITING:B-2` (CRITICAL) — `src/lib/prisma.ts` cannot be given a
signature-only stub, because the type its approved signature requires does not
exist yet.**

`persistence-conventions.md` PC-1 and plan Step 5 both fix the signature:
exactly one `PrismaClient`, exported from `src/lib/prisma.ts`. `PrismaClient`
is a *generated* type. Verified in this repository, not assumed:

- `node_modules/@prisma/client/index.d.ts` is one line —
  `export * from '.prisma/client/default'`.
- `node_modules/.prisma/` does not exist; the client has never been generated.
- A probe importing `PrismaClient` fails `TS2307: Cannot find module
  '@prisma/client' or its corresponding type declarations`.
- `prisma/schema.prisma` is still the two-line placeholder: no `datasource`,
  no `generator`, no `User` model. Writing it is **plan Step 2**, and
  generating from it is `IMPLEMENTATION`'s work, not this stage's.

So the three routes to a stub are all closed, and closed by rules rather than
by preference:

1. Type it `any` or `unknown` — forbidden by the stub authorization in as many
   words ("never `any` or `unknown` standing in for a real type").
2. Hand-write a substitute `PrismaClient` type — inventing a signature, which
   the same authorization forbids ("the exact signature comes from the
   approved design or the Implementation Plan").
3. Write `prisma/schema.prisma` and run `prisma generate` — that is plan
   Step 2, production persistence work, not a signature-only stub of an
   imported module. `TEST_WRITING` has no authority over it and no loop-back
   key that reaches `IMPLEMENTATION`.

**This is a narrower and different finding from `TEST_WRITING:B-1`.** B-1 was
about a missing *export* in a file that existed, and a human decision resolved
it. B-2 is about a missing *type*, and no stub policy can resolve it: the type
is an artifact of a build step that belongs to the next stage. The two share
only the ordering pressure that `stage-map.yaml` puts `TEST_WRITING` before
`IMPLEMENTATION`.

**Recommended resolution** — a human decision, per `AGENTS.md` "Changing a
check is a human decision". The options, with the cost of each stated:

- **(a) Accept a known-red `typecheck`/`lint` for the four Prisma-dependent
  test files until `IMPLEMENTATION` Step 2 lands**, and let `TEST_WRITING`
  complete on the evidence it can produce. Cost: the Definition of Done
  sequence cannot go green at this stage, so the Stop hook and CI stay red
  until Step 2. This is the honest description of where the work actually is.
- **(b) Move the schema and `prisma generate` earlier** — make plan Step 2 a
  precondition of `TEST_WRITING` rather than the first step of
  `IMPLEMENTATION`. Cost: amends the approved plan and the stage order; it is
  the structural fix, and it is the one that stops this recurring.
- **(c) Authorize `test-writer` to write `prisma/schema.prisma` and run
  `prisma generate`** as an extension of the stub rule. Cost: much larger than
  the 2026-09-03 decision — a schema is a real design artifact with a
  migration behind it, not a signature.

`test-writer` has no authority to choose among these and does not recommend
one over the others beyond noting that (b) addresses the cause and (a) and (c)
address the symptom.

## Test files

### Production stubs created (AGENTS.md > Testing)

Every one satisfies all five conditions: none previously carried behavior
(all were one-line placeholders or absent), each signature is traced below to
an approved artifact, each body only throws, none is `async`, and none claims
to be implemented.

| File | Export | Signature traced to |
|---|---|---|
| `src/lib/errors.ts` *(new)* | `DomainError` + 5 subclasses | plan D-1; `architecture.md` AD-6 |
| `src/lib/password.ts` *(new)* | `hashPassword` | plan Step 5; FR-24; SC-1 |
| `src/middleware/validateRequest.ts` *(new)* | `validateRequest` | plan Step 6; FR-22; AD-5 |
| `src/middleware/errorHandler.ts` | `errorHandler` | plan Step 6; AD-6, AC-12 |
| `src/modules/users/users.service.ts` | `createUsersService` | plan Step 8; db-design "Access paths" #1–2 |
| `src/modules/auth/auth.service.ts` | `createAuthService` | plan Step 9 (its four named collaborators) |
| `src/lib/logger.ts` | `logger` | plan Step 5; SR-7, SC-9 |
| `src/app.ts` | `app` | plan Step 10; D-5 |
| `src/lib/prisma.ts` | **not stubbed** | blocked — see above |

`errors.ts`, `logger.ts` and `app.ts` use `export declare` rather than a
throwing body: they export types and values, not callables, and a declaration
emits no runtime binding at all — strictly less than the authorization allows,
and there is nothing for a test to pass against.

### Test files modified

All 15 authored test files were kept; none was deleted, disabled, or weakened.
Changes were confined to making them compile and lint:

- `tests/support/api.ts` — added `ErrorBody` / `CustomerDto` and the
  `errorBody()` / `customerBody()` accessors. Supertest types `res.body` as
  `any`, which was the source of ~40 `no-unsafe-*` errors; the two validation
  files already used this pattern, so this makes the suite consistent with
  itself rather than introducing a new convention.
- `tests/support/globalSetup.ts` — dropped `async` from `setup`, which awaits
  nothing (`require-await`).
- `src/middleware/errorHandler.test.ts` — `fakeResponse()` now returns the
  `status` mock alongside the response, because `expect(res.status)` trips
  `unbound-method`; and the `it.each` table builds its errors through a
  factory instead of inline. **The second change is not cosmetic:** an inline
  table is evaluated at collection time, so while `errors.ts` is a
  declaration-only stub the whole file died as one collection error and
  reported `(0 test)` — taking down the four `ZodError` tests that do not
  touch those classes at all, which are exactly the tests carrying
  `IMPACT_ANALYSIS:R-4` and `DESIGN_REVIEW:e-2`.
- The remaining unit and integration files — removed `as never` and other
  assertions that the real stub signatures made redundant, and applied the
  typed body accessors.

**The removed `as never` casts are worth one line of note.** They were written
because no production type existed. With the stubs in place ESLint reported
them as unnecessary — which means the hand-written fakes structurally satisfy
the real interfaces. That is independent evidence that the collaborator shapes
the tests assumed are consistent with the plan, not merely convenient.

## Commands used

Actual runs, with actual outcomes:

| Command | Result |
|---|---|
| `npm run format:check` | **pass** — "All matched files use Prettier code style!" |
| `npm run check:cycles` | **pass** — "no circular dependency was found" |
| `npm run typecheck` | **4 errors**, all `TS2305` on `prisma` |
| `npm run lint` | **30 errors**, all "type that could not be resolved" on `prisma` |
| `npm run test:unit` | 5 files, **31 tests, 31 failed** |
| `npx vitest run tests/integration` | 7 files, **40 tests, 40 failed** |

The lint and typecheck residuals were filtered explicitly to confirm the
single root cause: every remaining diagnostic matches "could not be resolved" /
"cannot be resolved" / "error typed value" against `prisma`. Filtering for
anything else returns nothing.

## Tests executed

**71 tests, in 12 files. All 71 fail. All 71 fail for the right reason.**

| File | Tests | Failure mode |
|---|---|---|
| `src/lib/password.test.ts` | 4 | `Not implemented: hashPassword` |
| `src/middleware/errorHandler.test.ts` | 11 | `Not implemented: errorHandler` |
| `src/middleware/validateRequest.test.ts` | 5 | `Not implemented: validateRequest` |
| `src/modules/auth/auth.service.test.ts` | 6 | `Not implemented: createAuthService` |
| `src/modules/users/users.service.test.ts` | 5 | `Not implemented: createUsersService` |
| `tests/integration/auth-register-success.test.ts` | 10 | `app`/`prisma` undefined |
| `tests/integration/auth-register-password-validation.test.ts` | 8 | `app` undefined |
| `tests/integration/auth-register-envelope.test.ts` | 8 | `app` undefined |
| `tests/integration/auth-register-email-validation.test.ts` | 5 | `app` undefined |
| `tests/integration/auth-register-duplicate.test.ts` | 4 | `prisma` undefined |
| `tests/integration/auth-register-rate-limit.test.ts` | 3 | `prisma` undefined |
| `tests/integration/auth-register-audit.test.ts` | 2 | `prisma` undefined |

### Red-phase verification

Against the Skill's own criteria, each of which is met: the tests compile (the
4 remaining type errors are in imports of one unstubbed module, not in test
code); the failures are caused by missing production behavior; and each
failure message names the module and export that is missing. None is a syntax
error, a bad fixture, an incorrect assertion, or a contradiction with an
approved requirement.

### Passing existing tests

None to preserve. `tests/harness.test.ts` is the only pre-existing test file
and is untouched by this Story; it is collected by neither `test:unit` (scoped
to `src`) nor `test:integration` (scoped to `tests/integration`), which is
`PLAN_REVIEW:p-6`'s finding, already resolved in plan v3 D-10 and owed to
`IMPLEMENTATION`.

### Unexpected failures

None.

## Findings owed to this stage

- **`IMPACT_ANALYSIS:R-4`** — covered and now *executing*:
  `errorHandler.test.ts` asserts both mappings Zod leaves empty by default (the
  `unrecognized_keys` issue keyed by the offending property; the root-level
  `invalid_type` keyed onto both required fields), plus the
  `minProperties: 1` guarantee. Integration coverage in
  `auth-register-envelope.test.ts`. **Not closed:** the tests fail, as they
  must before implementation. Closing it means the behavior was verified
  working, which is `IMPLEMENTATION_VERIFICATION`'s call, not this stage's.
- **`DESIGN_REVIEW:e-2`** — all three request shapes are covered as distinct
  named tests (`e-2 shape 1` JSON array body; `shape 2` bodyless POST with
  `application/json`; `shape 3` bodyless POST with no `Content-Type`), plus
  the unit-level 415-vs-400 split in `validateRequest.test.ts`. Same status:
  executing, failing correctly, **not closed** for the same reason.

Both were raised against this stage and both now have running evidence rather
than only authored files — which is the change from revision 1, where neither
could be demonstrated at all.

## Untested Acceptance Criteria

None. AC-001…AC-007 each map to at least one test in
`docs/tests/US-001-ac-test-matrix.md` (v2), unchanged in coverage from
revision 1; only one parametrized test *name* changed, and the matrix row was
updated with it.

## Open Decisions

No new Open Decision. `TEST_WRITING:B-2` above is a blocking issue requiring a
human decision, not an Open Decision in the
`docs/decisions/US-001-open-decisions.md` sense — it is about stage ordering
in this harness, not about product or security behavior.

Carried, unchanged by this stage: `IMPLEMENTATION_PLANNING:R-P1` (integration
tests cannot execute before plan Steps 2–3 — confirmed, and B-2 is the
compile-time half of the same ordering gap) and `PLAN_REVIEW:p-10` (the
`vitest.config.ts` module body resolves the test `DATABASE_URL`; the current
config predates that conversion, so it did not bite this run).
