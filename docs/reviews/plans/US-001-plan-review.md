---
artifact_type: plan_review
story: US-001
version: 1
status: APPROVED
created_at: 2026-09-03T06:09:54Z
updated_at: 2026-09-03T06:29:29Z
produced_by: plan-reviewer
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
  - path: docs/impact-analysis/US-001-impact-analysis.md
    version: 2
  - path: docs/plans/US-001-implementation-plan.md
    version: 1
  - path: docs/decisions/US-001-open-decisions.md
    version: 7
supersedes: null
critical_findings: 0
major_findings: 0
minor_findings: 5
---

# Plan Review: Customer Registration (US-001)

## 1. Review Summary

**Result: `PASS`** — 0 Critical, 0 Major, 5 Minor.

> **Provenance note.** A second `plan-reviewer` instance ran this stage
> concurrently and wrote its own review to this path before being overwritten;
> its transition was never recorded, so this artifact is the one the workflow
> carries. Findings `p-3`, `p-4` and `p-5` originate from that run. They are
> included here because they are real, not because they were reported: each was
> re-verified independently against the installed toolchain and the convention
> text (§7), and none of them overlaps `p-1` or `p-2`. That run also challenged
> this review's closure of `DESIGN_REVIEW:e-1`, and the challenge was correct —
> see §17.

The plan is executable as written. Every Acceptance Criterion AC-001…AC-007
reaches a named step and at least one test level; the twelve steps are ordered so
that no step depends on a later one; each carries observable evidence rather than
a description of success; and the plan introduces no behavior the approved
artifacts do not already contain.

What distinguishes this plan from a document review is that its load-bearing
claims were **re-verified by execution during this review rather than read**.
Claims that would have been expensive to discover as false at `IMPLEMENTATION`
were checked against the installed toolchain and the repository, and all of them
hold — see §3 and the verification table in §7.

**Principal risks.** None that block. The residual risk of the Story is
concentrated in `SPECIFICATION:FR-18`, `IMPACT_ANALYSIS:R-4`,
`DESIGN_REVIEW:e-1`, `e-2` and `d-4`, all of which the plan correctly carries to
the stage that owes them rather than pretending to close them here.

**Recommended next action.** Advance to `HUMAN_PLAN_APPROVAL` with the two Open
Questions the plan already raises, plus two items this review adds: finding
`p-1` (§14) and the surviving `DESIGN_REVIEW:e-1` defect (§17).

## 2. Reviewed Artifacts

| Artifact | Path | Version |
|---|---|---|
| Story | `docs/stories/US-001-register-customer.md` | — |
| Specification | `docs/specifications/US-001-spec.md` | 14 (`APPROVED`) |
| Specification review | `docs/reviews/specifications/US-001-spec-review.md` | 11 (`PASS`) |
| API design | `docs/designs/api/US-001-api-design.md` | 2 |
| OpenAPI contract | `docs/designs/api/US-001-openapi.yaml` | 2 |
| Database design | `docs/designs/database/US-001-db-design.md` | 2 |
| Entity model | `docs/designs/database/US-001-entity-model.md` | 1 |
| Design review | `docs/reviews/designs/US-001-design-review.md` | 2 (`PASS`) |
| Impact analysis | `docs/impact-analysis/US-001-impact-analysis.md` | 2 (`PASS`) |
| Implementation plan | `docs/plans/US-001-implementation-plan.md` | 1 (`DRAFT`) |
| Open decisions | `docs/decisions/US-001-open-decisions.md` | 7 (12 of 12 `RESOLVED`) |

No input is stale: every version the plan records in its own `inputs` matches the
version on disk. Preconditions hold — `SPEC_REVIEW` `PASS` past
`HUMAN_SPEC_APPROVAL`, `DESIGN_REVIEW` v2 `PASS`, `IMPACT_ANALYSIS` v2 `PASS`.

## 3. Strengths

- **The decisions are separated from the steps and each names the finding it
  discharges.** `PLAN_REVIEW` could therefore check a discharge instead of
  rediscovering a question, which is what let this review spend its effort on
  execution rather than on reading.
- **D-2 is a better resolution than either option the design offered.** The
  database design asked this stage to choose between `prisma.config.ts` reading
  `process.env` (and narrowing AD-7) or importing `src/config/env.ts`. The plan
  found a third path — `prisma/config` exports its own `env()` — which leaves
  AD-7, `AGENTS.md` and `eslint.config.js` untouched. **Independently verified
  here** (§7): the specifier resolves on the installed `prisma` 7.10.0, the
  helper returns the resolved value, and an unset variable throws
  `PrismaConfigEnvError` naming the variable rather than yielding `undefined` —
  which is exactly the fail-fast behavior AD-7 asks for. The rejection of the
  `src/config/env.ts` import is also right: that module validates all six
  application variables, so a `prisma migrate` invocation would fail for want of
  `CORS_ALLOWED_ORIGINS`, which the migration does not need.
- **D-3 is placed in Step 1, with the correct reason.** Registering
  `prisma.config.ts` in `tsconfig.typecheck.json` in the same step that creates
  the file is not tidiness — `eslint.config.js` points `parserOptions.project` at
  that config, so a root `.ts` outside the program fails `npm run lint` outright
  and every subsequent turn would fail the Stop hook.
- **D-6 was verified at the source, not assumed.** The plan's claim that
  `Retry-After` is gated on the same two flags as `RateLimit-*` is precise, down
  to the line. Confirmed here.
- **D-1 states the Specification is stale in as many words**, which is the
  condition on which `IMPACT_ANALYSIS` declined the
  `changes_required_specification` loop-back. Without that sentence an
  implementer following `AGENTS.md`'s order of authority — Specification above
  design — builds four error classes, leaves the `429` with no carrier, and ships
  a rate-limit body that violates AC-6 and the approved contract.
- **The plan names what it does *not* do, with reasons**: D-8 (no
  `users.schemas.ts`), D-9 (PC-1 not amended), the Files Explicitly Not Changed
  table, and the "Explicitly not open" list that keeps the gate from being asked
  to re-decide the `@prisma/adapter-pg` dependency and the `429` carrier.
- **R-P1 is the plan noticing a defect in its own ordering** and stating the
  mitigation, rather than leaving `test-writer` to discover that the suite it
  authors cannot run yet.
- **Evidence is executable at every step.** No step ends in "ensure it works";
  Step 11's one read-only check states why reading is the only available method.

## 4. Scope Review

**Required scope: complete.** `POST /api/v1/auth/register` and the foundations
FR-19…FR-24 name — configuration boundary, Prisma datasource/model/migration,
app assembly and process entry, error taxonomy, boundary validation, rate-limit
factory, password helper, PC-1 test database.

**Missing scope: none identified.**

**Scope expansion: none.** The breadth beyond the endpoint itself is authorized
twice over — by FR-19…FR-24 in the approved Specification, and by the human
decision of 2026-09-01 recorded in the clarification report — and the plan adds
nothing outside it. It adds no dependency (`New Dependencies: None`, confirmed
against `package.json`), creates no module, and states the scope-discipline rule
explicitly so an implementer does not read authorized breadth as a licence.

**Out of Scope compliance: holds.** No `products` / `orders` / `support` path
appears anywhere in the plan; the Files Explicitly Not Changed table names them.
`src/modules/auth/auth.repository.ts` is correctly excluded (BR-6: `auth`
persists nothing of its own until refresh tokens).

## 5. Requirements Traceability

| AC | Specification | Design | Impact analysis | Plan steps | Verification |
|---|---|---|---|---|---|
| AC-001 Successful registration | FR-1…FR-5, FR-17; VR-1, VR-2, VR-5; SR-1, SR-2 | api-design `201`; db-design §Model | §5, §6 | 2, 5, 7, 8, 9, 10 | Integration happy path; persistence; unit |
| AC-002 Unique email | FR-6, FR-7; VR-4; SR-6 | api-design `409`; db-design `@unique` | §5, §6 | 2, 5, 6, 8, 9 | Integration duplicate — **both** service-check and `P2002` race paths |
| AC-003 Email validation | FR-8; VR-1…VR-3; SR-6 | api-design `400`; contract `format: email`, 254 | §5 | 6, 7 | Integration validation; contract |
| AC-004 Password validation | FR-9; VR-5, VR-6, VR-8; SR-3 (**not** VR-7 — see `p-5`) | api-design `400`; contract policy | §5 | 6, 7 | Integration incl. boundaries 12/128, code points; unit |
| AC-005 Password storage | FR-10; SR-1…SR-4 | db-design `password_hash` unbounded | §5, §6 | 1, 2, 5, 8 | Persistence + security, asserted **against the database** |
| AC-006 Secure response | FR-11; SR-3…SR-6 | api-design four-field DTO | §5 | 7, 8, 9 | Security; contract |
| AC-007 Audit logging | FR-12; SR-3, SR-6, SR-7 | — | §5 | 5, 9 | Audit assertion; EC-4 failure tolerance |

Every AC reaches at least one step and at least one test level (NFR-006 holds).

Requirements carrying no AC are traced too: FR-13…FR-16 (Steps 6, 7, 10),
FR-18…FR-24 (Steps 1, 3, 5, 6, 10), SR-8…SR-10 (Steps 1, 6). The plan's note that
FR-19 carries the most weight is correct — without Step 3 there is no database for
AC-002 and AC-005 to be tested against, so NFR-005 and NFR-006 cannot be
satisfied at all.

## 6. Impact Analysis Coverage

Every HIGH- and MEDIUM-confidence area of impact analysis v2 is accounted for.

| Impact analysis area | Status in the plan |
|---|---|
| `src/modules/auth/`, `src/modules/users/` (HIGH) | Covered — Steps 8, 9 |
| `src/middleware/` (HIGH affected / LOW on filenames) | Covered — Step 6; D-7 fixes the four names |
| `src/lib/` (HIGH) | Covered — Step 5; `openapi.ts` reused unchanged |
| `src/config/` (HIGH) | Covered — Step 1 |
| `prisma/` (HIGH) | Covered — Step 2 |
| `src/app.ts`, `src/server.ts` (HIGH) | Covered — Step 10; D-5 fixes the order |
| `tests/` (HIGH) | Covered — Steps 3, 4 |
| Repository tooling (HIGH; `tsconfig.typecheck.json` + `.gitignore` MEDIUM) | Covered — Steps 1, 3; D-3, D-4 |
| `products` / `orders` / `support` — No Change (HIGH) | Honoured |
| Files reused unchanged (`eslint.config.js`, `tsconfig.json`, `src/lib/openapi.ts`, `scripts/generate-openapi.ts`, `tests/support/setup.ts`, `.prettierrc.json`, `.audit-allowlist.json`, `tests/harness.test.ts`) | Honoured; the plan cites impact analysis §6 wholesale |

**Three material differences, each explicitly explained** in the plan's
Impact-Analysis Reconciliation table — and all three are refinements the analysis
invited rather than departures:

1. `prisma.config.ts` needs **no** AD-7 amendment (D-2). The analysis marked the
   file's exact shape as unexecuted (§17) and flagged AD-7 as a *conditional*
   documentation change; the condition turned out false. Verified here.
2. `.gitignore` **is** changed, with `!.env.test` (D-4) — the analysis required
   this plan to pick one of its two resolutions, and it did. See `p-1`.
3. `src/modules/users/users.schemas.ts` is **not** created (D-8) — the analysis
   marked it `Unknown`; the database design decided.

`persistence-conventions.md` was listed by the analysis as a conditional
documentation change; the plan deliberately declines to amend it (D-9) and routes
it to the human gate instead. That is the correct call — see §15.

None missing; none requiring reanalysis.

## 7. Architecture Review

**Layering.** `routes → controllers → services → repositories` is respected at
every step. Step 8 puts Prisma only in `users.repository.ts`; Step 9 states that
`auth.service.ts` never imports `argon2` or Prisma; Step 6 keeps Prisma out of
middleware; Step 9's controller builds no error body.

**Dependency direction and module ownership.** The one cross-module edge —
`auth.service.ts` → `users.service.ts` — is the edge `module-map.md` permits, and
the plan names it as such. `users` exposes no endpoint here, correctly.

**Prisma model vs response DTO (AD-4).** Step 8 selects **exactly the four
response fields** on `create` and `id` only on `findUnique`; no Prisma model is
planned as an API shape.

**Validation placement (AD-5).** At the HTTP boundary in
`src/middleware/validateRequest.ts`, with services receiving typed input. The
password policy has a single expression in `auth.schemas.ts` (VR-8).

**Configuration boundary (AD-7).** `src/config/env.ts` is the only `process.env`
reader in `src/`; `prisma.config.ts` sits at the root and reads none at all.

**New abstractions (AD-8).** None. The plan's "Architectural Changes: **None**"
is accurate — every responsibility lands in a home `module-map.md` already names,
including the two `src/lib/` files that document lists as created by the Story
that first needs them. D-8's refusal to create an empty `users.schemas.ts` is
AD-8 applied correctly.

**Duplication.** None across steps or modules. `errorHandler.ts` is named **sole
owner** of the `fieldErrors` shape, and `jsonBodyErrors.ts` is separated from
`validateRequest.ts` on a stated reason (different mount points, one
responsibility each) rather than by habit.

### Claims re-verified by execution during this review

| Plan claim | Method | Result |
|---|---|---|
| D-2: `prisma/config` exports `env()`; resolves the URL; throws on unset | Imported the module on the installed `prisma` 7.10.0 and called it | **Holds.** Exports include `defineConfig, env`; resolved `{"url":"postgresql://probe"}`; unset → `PrismaConfigEnvError: Cannot resolve environment variable: …` |
| D-3: `tsconfig.typecheck.json` `include` lacks `prisma.config.ts` | Read the file | **Holds.** `["src", "tests", "scripts", "vitest.config.ts", "eslint.config.js"]` |
| D-4: `.env.test` is ignored by `.gitignore:28` | `git check-ignore -v .env.test` | **Holds.** `.gitignore:28:.env.*` |
| D-6: `Retry-After` is gated on `legacyHeaders \|\| standardHeaders` | Read `node_modules/express-rate-limit/dist/index.cjs` | **Holds.** The guard is at line 1052, the call at 1056 — the plan's citation is exact |
| D-1: AD-6 names **five** classes for US-001; Specification v14 names four | Read `architecture.md` AD-6 and spec FR-21 | **Holds.** AD-6: "US-001 is that Story: it creates the base plus `ConflictError`, `UnsupportedMediaTypeError`, `PayloadTooLargeError`, `ValidationError` and `TooManyRequestsError` — the five it actually throws". FR-21 names four |
| "No dependency is added"; every named library installed | Read `package.json` and `node_modules` | **Holds.** `prisma` / `@prisma/client` / `@prisma/adapter-pg` 7.10.0, `express-rate-limit` 8.7.0, `vitest` 4.1.11, all as claimed |
| Step 2 evidence uses `npm run prisma:migrate` / `prisma:deploy` | Read `package.json` scripts | **Holds.** Both scripts exist |
| "Every `src/` path is a one-line placeholder today" | Counted lines under `src/` | **Holds.** Every `src/**/*.ts` is 1 line except `src/lib/openapi.ts` (22), which the plan lists as reused unchanged |
| PC-1 names `.env.test` as a deliverable of the implementing Story | Read `persistence-conventions.md` PC-1 | **Holds.** "What the implementing Story must build … `.env.test` with the test `DATABASE_URL`, plus a matching placeholder line in `.env.example`" |
| `SPECIFICATION:FR-18` is still outstanding | Read `.env.example` | **Holds.** Lines 16, 17, 19 and 20 still declare the four JWT variables |
| Step 3: `fileParallelism: false` can be "scoped to `tests/integration`" | Read the Vitest 4.1.11 types and the current `vitest.config.ts`; ran a two-project probe | **Fails as written** (`p-3`). `fileParallelism` is a top-level `test.*` option — the `poolOptions` form is deprecated in the shipped types — and the current config is one flat block covering both trees. Per-project scoping via `test.projects` was confirmed to run on 4.1.11; probe removed, `git status` clean |
| SC-3's citation for the `429` error body | Read `security-conventions.md` SC-3 and `api-conventions.md` headings | **Fails** (`p-4`). SC-3 line 178 cites AC-5, but AC-5 is "Error status codes" and AC-6 is "Error body"; SC-3 line 111 cites AC-6 correctly |
| The AC-004 row's `VR-5…VR-8` range | Read spec VR-7 | **Fails** (`p-5`). VR-7 defers the breached-password check to US-009 and "is not part of this Story" |
| `DESIGN_REVIEW:e-1` is discharged by D-1 | Read the approved triage, the plan's Risks table, and the four spec sites | **Fails** (§17). The triage says e-1 "stays open"; the plan says "Mitigated", not "Closed"; the four stale sites survive at spec lines 41, 515, 940, 947 |

## 8. API Review

**Contract alignment.** The plan consumes the approved contract and never invents
behavior. Step 7 enumerates **six generation obligations the generator will not
supply on its own**, each a `.openapi()` metadata call and each silently absent
otherwise — `additionalProperties: false` on both closed objects, `writeOnly` on
`password`, the `const` values on `role` and every `code`, `minProperties: 1` on
`FieldErrors`, the `X-Request-Id` component header, and **all seven responses**.
That last one is the trap it says it is: a module registering only the `201`
produces a document that passes generation and silently disagrees with the
approved contract.

**Status codes.** `201`, `400` (two shapes via `oneOf`), `409`, `413`, `415`,
`429`, `500` — all seven planned, all mapped to a carrier. The `415`-vs-`400`
split is stated explicitly (a bodyless `POST` is a `400`, not a `415`).

**Validation.** Zod at the boundary; unknown properties rejected; the
`unrecognized_keys` and root-level `invalid_type` mappings both mandatory in
Step 6, because Zod's default flattening leaves `fieldErrors` empty for both and
would violate VR-11 and the contract's `minProperties: 1`.

**Compatibility.** Additive only — one new endpoint under the existing
`/api/v1`. No versioned break. D-6's decision to declare no rate-limit headers
keeps the implementation equal to the contract, and adding a declared header
later stays additive (AC-1).

**Planned tests.** Contract-level assertion that every declared response matches
the approved document including `minProperties: 1`, plus per-status integration
coverage. `npm run openapi:check` gates drift.

## 9. Persistence Review

**Entity.** One `User` model, exactly as db-design §Model.

**Constraints and types.** `id` `@db.Uuid` with `@default(uuid())` and **no
database default**; `email` `@db.VarChar(254)` `@unique`, the same 254 as the Zod
bound (VR-3); `password_hash` unbounded `String`, the one PC-4 exemption PC-10
grants; both timestamps **explicitly** `@db.Timestamptz(3)`. That last point is
the plan catching a real trap — Prisma's default `DateTime` mapping is
`timestamp(3)` *without* time zone and would violate PC-6 silently.

**Uniqueness and nullability.** Unique on `email` at the database level, with the
service-level check and the `P2002` race path producing the **same** `409` so the
two are indistinguishable to a client.

**Storage behavior.** The repository holds the two queries and the `P2002`
translation where Prisma is visible; neither select includes `password_hash`
(PC-8, SR-4); nothing from the Prisma error — message, code, or constraint name —
reaches a body or a log line (SC-9, SR-6). The service opens the one transaction
and the repository opens none (PC-9).

**Schema implications.** A committed migration ships with the schema change
(PC-2), generated by `npm run prisma:migrate`, purely additive. No
`prisma db push`; no edit to an applied migration.

**Planned tests.** Persistence assertions run **against the database**, not
against a response — normalized email stored, case- and whitespace-differing
duplicates rejected, credential stored as an Argon2id hash. Isolation is PC-1's:
`fileParallelism: false` for `tests/integration` with `TRUNCATE` between tests,
unit tests keeping shuffle and parallelism — correct as an intent, but see `p-3`
for the mechanism the plan leaves unnamed.

## 10. Security Review

Each convention section was opened and the plan judged against its text.

| Section | Finding |
|---|---|
| **SC-1** passwords and hashing | Satisfied. Argon2id parameters (`memoryCost: 19456`, `timeCost: 2`, `parallelism: 1`) live as **constants** in `src/config/env.ts`, never env vars, and Step 5 passes all three explicitly on every call with a unit test proving it |
| **SC-2** roles and default state | Satisfied. `Role` enum with `CUSTOMER`; no account-state column, which FR-4 and VR-9 justify and the project-wide Open Decision on the state model does not block |
| **SC-3** rate limiting | Satisfied. 10 requests per hour per IP on `/api/v1/auth` — the value `security-conventions.md` records as DECIDED 2026-09-01 for `register`. The plan also honours SC-3's instruction **not** to "harden" the duplicate path into constant-time behavior (Step 9 short-circuits without hashing, per FR-7) |
| **SC-4** authorization | Not applicable — the endpoint is public and unauthenticated by design. No client-supplied id is trusted anywhere |
| **SC-5** HTTP hardening | Satisfied. D-5's assembly carries `helmet()`, `x-powered-by` disabled, an explicit CORS allow-list, `express.json({ limit: '10kb' })`, and `trust proxy` as the **explicit hop count, never `true`** — which SR-8 requires and which is what makes the per-IP limit real |
| **SC-6** dependencies | Not triggered. No dependency added; `@prisma/adapter-pg` was approved by commit `0339b4a` with the reason in its message, verified installed at 7.10.0 |
| **SC-7** secrets and `.env.example` | Satisfied in substance — no secret in code, `.env.example` brought current by removing the four JWT entries and adding the test-database placeholder. The one point needing the gate's attention is `.env.test`: see finding `p-1` |
| **SC-8** schema safety | Satisfied. `migrate deploy` only; no `db push`; no destructive migration |
| **SC-9** what must never appear | Satisfied, and tested. Redaction is configured **on the Pino logger** rather than left to call-site discipline (SR-7); no Prisma text, code or constraint name reaches the `409` or a log line; no `message` or `details` value echoes the submitted password; the audit event carries no email and no IP |
| **AD-5** boundary validation | Satisfied — see §8 |

**Security tests are explicit**, not assumed: no `password` or `password_hash` in
any response body, no Prisma internals in the `409` or any log line, no password
echo in `message` or `details`.

## 11. Testing and Validation Review

**AC coverage.** All seven, mapped in §5. `test-writer` owns the AC test matrix
at Step 4 and NFR-006 requires the mapping.

**Test categories.** Integration (Supertest against the PC-1 database), security,
persistence, audit, and unit — each with named coverage rather than a category
label.

**Negative scenarios.** Thorough. Duplicate via **both** paths; bad email format,
over-254, missing, non-string; password below 12, above 128, fewer than three
classes, **boundaries at exactly 12 and 128**, length in Unicode code points;
unknown property keyed by the offending name; `415`; `413` over 10kb;
`MALFORMED_JSON`; `429` with the AC-6 body and `X-Request-Id` present; and EC-4,
a failed audit write that must not fail the request.

**The `e-2` trap is correctly identified and carried.** Three request shapes
converge on one `400` through two different Zod mechanisms — `[]` and a bodyless
`POST` *without* a content type produce one root-path `invalid_type` issue, while
a bodyless `POST` *with* `application/json` arrives as `{}` and produces two
per-field issues. The plan states that a suite covering only the third proves
nothing about the root-path mapping R-4 is about, and requires all three.

**Deterministic validation.** NFR-005 satisfied in intent: serial integration
tests with `TRUNCATE`, never against a shared or production database, with unit
tests keeping shuffle and parallelism. The *mechanism* for splitting those two
regimes is unnamed and not expressible in the config's current shape — see
`p-3`.

**Missing evidence: none.** Every step carries an executable check. Step 12 runs
the full `AGENTS.md` Definition of Done sequence; the plan correctly identifies
that **both** conditional checks apply — `audit:check` because `package.json`
changes for the two scripts even though no dependency is added, and
`validate:harness` because the change touches `AGENTS.md` and workflow artifacts.

**The two checks no command performs are named**, which is the right response to
an unmechanizable rule: BR-6's ownership rule (a Prisma import in
`auth.repository.ts` would pass every mechanical check; what would be wrong is
*whose* data it reads) and FR-22's ban on a controller calling `schema.parse()`
inline.

## 12. Execution Order Review

**Feasible and dependency-safe.** The plan's claim that no step depends on the
output of a later one holds on inspection:

- Step 1 must precede everything, and the placement of D-3 inside it is what
  keeps `npm run lint` green from that point on.
- Step 2 (schema, migration) precedes Step 3 (test database applying that
  migration) precedes Step 8 (repository queries against the model).
- Step 5 (`errors.ts`, `password.ts`) precedes Steps 6, 8, 9, which all throw or
  call into it.
- Step 7 (schemas) precedes Step 9 (routes composing validation).
- Step 10 (assembly) precedes Step 12 (full verification).
- Step 11 regenerates the contract after Step 7 defines it.

**The one ordering hazard is real, named, and mitigated.** `TEST_WRITING`
(Step 4) precedes `IMPLEMENTATION` in `stage-map.yaml`, but the schema, migration
and compose file arrive in Steps 2–3, which are `IMPLEMENTATION`. The tests
authored at Step 4 therefore **cannot execute when they are written**. The plan
states this as `R-P1`, instructs `test-writer` not to gate its completion on a
running suite, and places the first suite execution at Step 12. That is the
correct mitigation, and stating it is what prevents a false failure report at the
next stage.

The order differs from the Skill's illustrative sequence by placing test
preparation after the persistence and configuration steps in *plan numbering*
while keeping it first in *stage* order. The plan explains why, so the difference
is approved.

## 13. Reviewability

**Suitable for one Pull Request.** Judged by coherence rather than file count:

- **One independently shippable capability** — customer registration. The
  foundations are not a second capability; none of them is shippable or testable
  on its own, and each is required by an Acceptance Criterion or an FR of this
  Story.
- **No unaccounted module.** Every path traces to an AC, a design element, or an
  impact-analysis entry.
- **No dependency added.**
- **No refactoring** not required by an approved artifact.
- **No step crosses layers without saying why.**

The change is large — roughly 13 files created and 23 modified — but the size is
the Story's authorized breadth (FR-19…FR-24, confirmed by a human on
2026-09-01), not accumulated scope. `IMPACT_ANALYSIS:R-7` already requires the PR
summary to cite that authorization so the breadth does not read as scope creep at
`PR_REVIEW`, and the plan carries it there.

No decomposition is recommended.

## 14. Findings

### `p-1` — MINOR — D-4 crosses two convention lines it does not cite

**Location.** `docs/plans/US-001-implementation-plan.md`, Decisions §D-4
(`.env.test` is committed via a targeted `!.env.test` negation); also the
Configuration Changes table and Step 3.

**Problem.** D-4 argues against exactly one counter-authority — the `AGENTS.md`
Prohibited line "Never commit secrets, `.env`…" — reading it as a prohibition on
a *real* `.env`. Two further lines say the same thing and are cited nowhere in
the plan:

- `persistence-conventions.md` **PC-10**, final bullet: "Generated database
  artifacts, dumps, and `.env` files are never committed."
- `persistence-conventions.md` **PC-1**, second bullet: "Credentials are never
  hard-coded and never committed." The planned `.env.test` contains a connection
  string with a username and password, throwaway though they are.

**Why it matters.** The decision's substance survives review: its primary reason
was verified and is accurate — PC-1's "What the implementing Story must build"
list names `.env.test` literally, and a deliverable that exists on one machine
has not been delivered. The defect is not the choice but its routing. This is the
**only** decision in the plan that acts against a line in `AGENTS.md` Prohibited,
and the plan sets its own standard for exactly this case in D-9: "Amending a
convention is a human decision, so this plan does not make one." D-9 escalates;
D-4 does not, and it does not appear in Open Questions. A decision of this class
should be blessed deliberately at the gate, not inferred from a body paragraph.

**Why it is Minor and not Major.** It blocks no execution — the implementation is
identical either way — and the remedy is not a re-plan. `HUMAN_PLAN_APPROVAL` is
the very next stage, it is the person who owns the Prohibited line, and its
`on_reject` already routes to `IMPLEMENTATION_PLANNING` if they disagree. Looping
back to add a paragraph that asks the human, in order to then ask the human,
would take the decision rather than surface it.

**Required correction.** None to the substance. D-4 must be named as a **third
Open Question for `HUMAN_PLAN_APPROVAL`**, citing PC-10 and PC-1's second bullet
alongside the `AGENTS.md` line, so the gate records an explicit blessing. This
review carries it to the gate; the orchestrator's gate report must repeat it.

**Loop-back target.** None. Resolved at `HUMAN_PLAN_APPROVAL`, or routed to
`IMPLEMENTATION_PLANNING` by `/so:reject` if the human declines.

### `p-2` — MINOR — one Acceptance-Criterion identifier is written in the wrong vocabulary

**Location.** `docs/plans/US-001-implementation-plan.md`, Testing Strategy §
Integration, final row: "Contract: every declared response matches the approved
contract, `minProperties: 1` included | **AC-010**, FR-16".

**Problem.** Two AC vocabularies are in play across this Story's artifacts and
both are legitimate: `AC-001…AC-007` are the Story's Acceptance Criteria, and
`AC-1…AC-12` are `api-conventions.md` section ids. The intended reference here is
`api-conventions.md` **AC-10** (Contract source of truth), which the plan writes
correctly as `AC-10` everywhere else. Zero-padded to `AC-010` it reads as a Story
Acceptance Criterion — and the Story has only seven.

**Why it matters.** It sits in a table whose other rows cite Story ACs (`AC-001`,
`AC-002`, …), and immediately above the Traceability table keyed on
`AC-001…AC-007`. A reader building the AC test matrix at `TEST_WRITING` could
chase a criterion that does not exist. Non-load-bearing, but cheap to remove.

**Required correction.** Write `AC-10` at line 707, as the plan already does at
lines 398 and 639.

**Loop-back target.** None.

### `p-3` — MINOR — Step 3 states an outcome for `fileParallelism` without its mechanism

**Location.** `docs/plans/US-001-implementation-plan.md`, Step 3: "`vitest.config.ts`:
register `globalSetup`; `fileParallelism: false` scoped to `tests/integration`
(unit tests keep shuffling and parallelism)". Repeated in Testing Strategy §
Determinism.

**Problem.** `fileParallelism` is a **top-level `test.*` option** in the installed
Vitest 4.1.11 — the `poolOptions` variant is explicitly deprecated in the shipped
types ("use top-level `fileParallelism` instead"). The current `vitest.config.ts`
is a single flat `test` block whose one `include` covers **both** trees
(`src/**/*.test.ts` and `tests/**/*.test.ts`). In that shape there is no way to
say "scoped to `tests/integration`": setting the flag serializes everything.

**Why it matters.** The naive implementation of the sentence as written
contradicts the rest of the same sentence, and contradicts PC-1's "Unit tests
keep running in parallel". It would not fail any check — `npm run test` stays
green — so nothing downstream catches it; the unit suite just quietly stops
running in parallel and stops shuffling in the way NFR-005 relies on to expose
order dependencies.

**The mechanism exists and was confirmed by execution.** `test.projects` takes
per-project `fileParallelism`. A two-project probe (`unit` with
`fileParallelism: true`, `integration` with `false`) was run against the
installed 4.1.11 from this repository and both projects resolved and ran; the
probe directory was removed and `git status` is clean. So the outcome the plan
wants **is** reachable in the one file it names, and `IMPACT_ANALYSIS:R-2` does
not recur — no new config file is introduced.

**Why it is Minor.** The plan states the requirement correctly; only the
mechanism is unnamed, and it is reachable without changing the plan's file list
or its step boundaries.

**Required correction.** Say `test.projects` in Step 3, so `IMPLEMENTATION` does
not rediscover it or reach for the deprecated `poolOptions` form.

**Loop-back target.** None. Due at `IMPLEMENTATION`.

### `p-4` — MINOR — SC-3 cites the wrong `api-conventions.md` section for the error body

**Location.** `docs/architecture/security-conventions.md` SC-3, line 178:
"Exceeding a limit returns `429` with the standard error body
(`api-conventions.md` AC-5)."

**Problem.** `api-conventions.md` **AC-5 is "Error status codes"**; **AC-6 is
"Error body"**. The citation for a *body* is AC-6. SC-3 gets this right elsewhere
— line 111 cites AC-6 for the error body — so the section contradicts itself.

**Why it matters.** This is the same class as `p-1`: a defect in a convention
document, not in the plan or the code. It is small, but SC-3 is the section this
Story implements for the `429`, and the plan, the API design and this review all
cite AC-6 as the body shape. A reader who follows SC-3's pointer lands on the
status-code section and finds no body shape at all. No code changes either way.

**Required correction.** Amend SC-3 line 178 to cite AC-6. Amending a convention
is a human decision, so it is recorded here and carried to the gate rather than
made by this review.

**Loop-back target.** None. Due at a human decision, alongside `DB_DESIGN:PC-1`.

### `p-5` — MINOR — the AC-004 traceability row claims a requirement the Specification defers

**Location.** `docs/plans/US-001-implementation-plan.md`, Traceability table,
AC-004 row: "FR-9; **VR-5…VR-8**; SR-3".

**Problem.** Specification VR-7 reads: "`password` — the breached-password check
is **not** part of this Story; it is deferred to US-009". Folding it into the
contiguous range `VR-5…VR-8` presents a deferred requirement as one this Story
delivers.

**Why it matters.** Traceability is what `RECONCILIATION` compares the delivery
against, and `IMPLEMENTATION_VERIFICATION` will look for evidence of every
requirement the plan claims. A range that silently absorbs an out-of-scope item
either produces a false "covered" or a spurious gap. It also risks the opposite
failure — an implementer reading the range as authority to add a breach check,
which would be inventing scope.

**Note on this review.** §5 above copied the plan's range verbatim before this
was caught. The AC-004 row there should read `VR-5, VR-6, VR-8`.

**Required correction.** Write `VR-5, VR-6, VR-8` in the AC-004 row, or keep the
range and mark VR-7 deferred in the same cell.

**Loop-back target.** None.

## 15. Open Decisions

**No blocking Open Decisions were identified.**

`docs/decisions/US-001-open-decisions.md` v7 records twelve entries, all twelve
`RESOLVED` — verified by reading each status line. No `TODO`, `TBD`, `FIXME`,
`???`, `OPEN`, `unresolved` or "to be decided" marker appears in the Story, the
Specification, either design, the entity model, the impact analysis, or the plan.

Project-wide Open Decisions in `AGENTS.md` were checked against this Story's
surface: the account state model (registration needs only "enabled"), the
rate-limit thresholds for `login` / `refresh` / `logout` (register is decided),
refresh-token revocation storage, email verification, and roles beyond `CUSTOMER`
are all outside what this Story implements. None blocks.

Two items are correctly carried to `HUMAN_PLAN_APPROVAL` **to note, not to
answer**, and neither blocks implementation:

1. **PC-1 predates Prisma 7** (`DB_DESIGN:PC-1`, D-9). It describes neither the
   required adapter object nor the separate migration config file. The plan
   implements PC-1's substance and declines to amend the convention, which is the
   right call — amending one is a human decision. Whoever owns that decision
   should amend PC-1 so the next Story reads a convention that matches the
   toolchain.
2. **The `CHECK (email = lower(btrim(email)))` constraint stays unspecified**
   (`DB_DESIGN:check-constraint`, `ACCEPTED`). Endorsed twice already, by
   `DB_DESIGN` and by `DESIGN_REVIEW` v2, on the grounds that Prisma cannot
   express a `CHECK` while PC-2 makes `schema.prisma` the source of truth.
   Recorded so it is not reopened downstream as a fresh idea.

This review adds three more items for the gate. None is an Open Decision in the
registry sense:

3. **`p-1`** — a decision the plan already made, which needs an explicit human
   blessing because it is the only one that touches a line in `AGENTS.md`
   Prohibited.
4. **`DESIGN_REVIEW:e-1` survives this Story** (§17). D-1 protects US-001; the
   Specification stays stale at four sites for US-002 onward. The human call is
   whether to schedule a Specification revision or formally `ACCEPT` it the way
   `IMPACT_ANALYSIS:e1-loopback` was accepted.
5. **`p-4`** — `security-conventions.md` SC-3 line 178 cites AC-5 where AC-6 is
   meant. A one-line convention amendment, which is a human decision; it can be
   taken together with `DB_DESIGN:PC-1` above.

## 16. Required Plan Changes

None blocks the verdict; all five are Minor and may be folded into the next
revision of the plan, or waived by the human gate.

1. **D-4** — cite `persistence-conventions.md` PC-10 and PC-1's "never
   committed" bullet, and list D-4 in Open Questions for
   `HUMAN_PLAN_APPROVAL`. (`p-1`)
2. **Testing Strategy, Integration table (line 707)** — write `AC-10`, not
   `AC-010`. (`p-2`)
3. **Step 3 and Testing Strategy § Determinism** — name `test.projects` as the
   mechanism that scopes `fileParallelism: false` to `tests/integration`, since
   the option is top-level and the current config is one flat block. (`p-3`)
4. **Traceability, AC-004 row** — write `VR-5, VR-6, VR-8`, or mark VR-7
   deferred in the same cell. (`p-5`)

`p-4` requires no plan change — it is an amendment to
`security-conventions.md` SC-3, and amending a convention is a human decision.

## 17. Verdict Rationale

**`PASS`.**

No Critical and no Major finding was identified. The plan implements approved
requirements without inventing behavior; every Acceptance Criterion traces to a
step and a test; architecture, API, persistence and security conventions were
each opened and checked against the plan's text rather than against recollection;
the execution order is dependency-safe and its one hazard is named and mitigated;
every step carries executable evidence; and the change is coherent enough to read
as one Pull Request.

The five Minor findings go to `non_blocking_findings` per
`artifact-lifecycle.md` §4. `p-1` additionally requires the orchestrator to name
D-4 in the gate report, because a Minor severity describes its effect on
*execution*, not its claim on the human's attention.

**Four** findings this plan discharges are closed by this review, each verified
by execution rather than accepted from the plan's own account:

| Finding | Closed by | Verification |
|---|---|---|
| `IMPACT_ANALYSIS:R-2` | D-2 + D-3 | `prisma/config` `env()` resolves and throws on unset, so no `process.env` and no AD-7 amendment; `tsconfig.typecheck.json` gains the file in Step 1 |
| `IMPACT_ANALYSIS:R-3` | D-4 | `git check-ignore` confirms `.gitignore:28`; the plan picks the `!.env.test` resolution, CI on 5433, env override. See `p-1` |
| `IMPACT_ANALYSIS:R-5` | D-5 | The eleven-step assembly puts `requestId` at 5 and `rateLimit` at 7, so the `429` carries its required header |
| `IMPACT_ANALYSIS:R-6` | D-6 | Both header flags `false`; the `Retry-After` guard confirmed at `dist/index.cjs:1052` |

### `DESIGN_REVIEW:e-1` is **not** closed, and an earlier draft of this review closed it wrongly

An earlier draft of this section listed `e-1` in the table above as `RESOLVED` on
the grounds that D-1 states AD-6 governs. That was wrong, and three independent
records say so:

1. **The approved triage** (`docs/decisions/US-001-findings-triage.md`, `status:
   APPROVED`) files `IMPACT_ANALYSIS:e1-loopback` as `ACCEPTED` with the words:
   "declining `changes_required_specification` for e-1 is accepted; **the
   residual risk is e-1 itself, which stays open above**." The orchestrator
   applies that document and does not re-judge it.
2. **The plan's own Risks table** says `e-1` is "**Mitigated**" by D-1, while
   saying "**Closed**" for R-2, R-3, R-5 and R-6. The planner drew that
   distinction deliberately with a different word; the earlier draft flattened
   it.
3. **The lifecycle definition.** `RESOLVED` means "a later run fixed the thing"
   (`state-schema.md`, Finding lifecycle). Nothing fixed it. `e-1` is a defect
   **in the Specification**, and D-1 does not edit the Specification — it
   instructs US-001 not to follow it on this point.

The four stale sites are still there, confirmed by reading
`docs/specifications/US-001-spec.md` at this review: line 41 (the revision
preamble), line 515 (FR-21), line 940 (the `errorHandler.ts` component row) and
line 947 (the `src/lib/errors.ts` component row, which enumerates all four class
names). US-001 is protected by D-1; **US-002 onward is not**, because the next
Story reads the same stale Specification with no D-1 to warn it.

`e-1` therefore stays `RAISED`. It is not re-raised — it was never closed — and
this review adds no event for it. Whether it is eventually repaired (a
Specification revision) or formally `ACCEPTED` (as `e1-loopback` was) is a human
call, and it is carried to `HUMAN_PLAN_APPROVAL` as a fourth item.

### The open set

Eight findings remain open from before this review and are carried to the stages
that owe them: `SPECIFICATION:FR-18` to `IMPLEMENTATION`; `IMPACT_ANALYSIS:R-4`
to `TEST_WRITING` and Step 6; `DESIGN_REVIEW:e-1` to a human decision (above);
`DESIGN_REVIEW:e-2` and `IMPLEMENTATION_PLANNING:R-P1` to `TEST_WRITING`;
`DESIGN_REVIEW:d-4` to `IMPLEMENTATION_VERIFICATION`; `IMPACT_ANALYSIS:R-7` to
`PR_PREPARATION`; `DB_DESIGN:PC-1` to a human decision.

The five raised here bring the open set to **13**: `12 − 4 + 5`. It grew, and it
should have — four of the twelve were genuinely discharged by the plan, and five
real defects were found that no earlier stage had recorded. A count that only
falls is the failure mode the derived set was built to replace.

The plan proceeds to `HUMAN_PLAN_APPROVAL`. A `PASS` here is a review verdict and
not that approval.
