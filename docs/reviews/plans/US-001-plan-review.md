---
artifact_type: plan_review
story: US-001
version: 2
status: APPROVED
created_at: 2026-09-03T06:09:54Z
updated_at: 2026-09-03T07:14:45Z
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
    version: 2
  - path: docs/decisions/US-001-open-decisions.md
    version: 7
  - path: docs/decisions/US-001-findings-triage.md
    version: 1
supersedes: null
critical_findings: 0
major_findings: 1
minor_findings: 3
---

# Plan Review: Customer Registration (US-001)

## 1. Review Summary

**Result: `CHANGES_REQUIRED`** — 0 Critical, **1 Major**, 3 Minor.

> **Revision 2 — reviews implementation plan version 2.** `HUMAN_PLAN_APPROVAL`
> rejected plan v1 on `PLAN_REVIEW:p-3` (history event 2026-09-03T06:44:24Z,
> `human:KShust`) and routed the Story back to `IMPLEMENTATION_PLANNING`. This
> revision re-reviews the plan under the `stage-map.yaml` Re-entry rule: it
> checks the three closures plan v2 claims, carries forward what remains open,
> and reviews the newly written text on its own terms. Revision 1's verified
> conclusions are retained where plan v2 did not touch the ground under them,
> and every one of its execution-verified claims (§7) still holds — plan v2
> changed no file list, no step boundary and no decision except D-4's citations.

**The three claimed closures hold, and are closed.** `p-2` (`AC-010` → `AC-10`),
`p-3` (`test.projects` named as the mechanism) and `p-5` (AC-004 row reads
`VR-5, VR-6, VR-8` with VR-7 marked deferred) were each verified against plan
v2's text rather than accepted from its revision-history table — see §7.

**But naming the mechanism exposed a defect the unnamed mechanism hid.** D-10
now writes the two-project `vitest.config.ts` out in full, which is exactly what
the gate asked for — and the shape as written collects `tests/harness.test.ts`
into **neither** project. That file is the repository's only existing test, and
it is the one that verifies the test configuration itself. Under D-10 it stops
running, in every command, silently and with a green exit code. That is finding
`p-6`, **Major**, and it is why this review returns `CHANGES_REQUIRED` rather
than advancing to the gate.

**Principal risks.** `p-6` is a plan-level defect with a two-word remedy and no
consequence for scope, file lists or step boundaries. Nothing else about the plan
degraded: the substance reviewed at revision 1 is intact and its verdict on that
substance is unchanged.

**Recommended next action.** Return to `IMPLEMENTATION_PLANNING` for a revision 3
that fixes `p-6` and may fold in `p-7`. The three items the gate is owed —
`p-1`, `p-4` and `DESIGN_REVIEW:e-1` — are unchanged and travel with the plan to
`HUMAN_PLAN_APPROVAL` once it returns.

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
| Implementation plan | `docs/plans/US-001-implementation-plan.md` | **2** (`DRAFT`) |
| Open decisions | `docs/decisions/US-001-open-decisions.md` | 7 (12 of 12 `RESOLVED`) |
| Findings triage | `docs/decisions/US-001-findings-triage.md` | 1 (`APPROVED`) |

No input is stale: every version the plan records in its own `inputs` matches the
version on disk, and plan v2 additionally records the review it answers
(`docs/reviews/plans/US-001-plan-review.md` v1). Preconditions hold —
`SPEC_REVIEW` `PASS` past `HUMAN_SPEC_APPROVAL`, `DESIGN_REVIEW` v2 `PASS`,
`IMPACT_ANALYSIS` v2 `PASS`.

**Re-entry check (`stage-map.yaml` Re-entry rule).** `git diff` between plan v1
and v2 is 176 insertions and 21 deletions, and every deletion is text the
revision replaced in place. No requirement, decision, file-list row, step or
Open Question disappeared between versions. The revision is a revision, not a
rewrite.

## 3. Strengths

Revision 1's strengths stand unchanged; the plan's substance was not what the
gate rejected. Retained, and re-confirmed against v2's text:

- **The decisions are separated from the steps and each names the finding it
  discharges**, so this stage checks a discharge instead of rediscovering a
  question.
- **D-2 is a better resolution than either option the design offered** — the
  `prisma/config` `env()` helper leaves AD-7, `AGENTS.md` and `eslint.config.js`
  untouched. Verified at revision 1 by importing the module on the installed
  `prisma` 7.10.0.
- **D-3 is placed in Step 1, with the correct reason** — `eslint.config.js`
  points `parserOptions.project` at `tsconfig.typecheck.json`, so an unregistered
  root `.ts` fails `npm run lint` outright.
- **D-6 was verified at the source**, down to the `Retry-After` guard line.
- **D-1 states the Specification is stale in as many words**, the condition on
  which `IMPACT_ANALYSIS` declined its loop-back.
- **The plan names what it does not do, with reasons** — D-8, D-9, Files
  Explicitly Not Changed, and the "Explicitly not open" list.
- **R-P1 is the plan noticing a defect in its own ordering.**
- **Evidence is executable at every step.**

New in revision 2, and worth recording:

- **D-10 replaces an assumption with an executed answer.** Revision 1 deferred
  the `DATABASE_URL` propagation question to the step ("confirm against the
  installed version rather than assuming"). Revision 2 answers it: root
  `test.env` reaches workers but not `globalSetup`, so the config module body
  assigns `process.env.DATABASE_URL`. Resolving a deferred confirmation at
  planning time rather than leaving it for `IMPLEMENTATION` is the right
  instinct, and it is what turned `p-6` from an invisible surprise into a
  reviewable one.
- **D-4 now argues against all three counter-authorities and routes itself to
  the gate.** The documentary half of `p-1` is fully discharged (§14).
- **The revision-history table names what it closes and what it deliberately does
  not**, which let this review check five specific claims instead of re-reading
  a thousand lines.

## 4. Scope Review

Unchanged from revision 1, and re-confirmed against the v1→v2 diff.

**Required scope: complete.** `POST /api/v1/auth/register` plus the foundations
FR-19…FR-24 name.

**Missing scope: none identified.**

**Scope expansion: none.** Plan v2 adds no file, no step and no dependency. The
diff touches the revision history, D-4's citations, Step 3 / D-10, one Files To
Modify cell, one Testing Strategy cell, one Traceability cell and Open Question 3
— nothing else.

**Out of Scope compliance: holds.** No `products` / `orders` / `support` path
appears anywhere in the plan.

## 5. Requirements Traceability

| AC | Specification | Design | Impact analysis | Plan steps | Verification |
|---|---|---|---|---|---|
| AC-001 Successful registration | FR-1…FR-5, FR-17; VR-1, VR-2, VR-5; SR-1, SR-2 | api-design `201`; db-design §Model | §5, §6 | 2, 5, 7, 8, 9, 10 | Integration happy path; persistence; unit |
| AC-002 Unique email | FR-6, FR-7; VR-4; SR-6 | api-design `409`; db-design `@unique` | §5, §6 | 2, 5, 6, 8, 9 | Integration duplicate — **both** service-check and `P2002` race paths |
| AC-003 Email validation | FR-8; VR-1…VR-3; SR-6 | api-design `400`; contract `format: email`, 254 | §5 | 6, 7 | Integration validation; contract |
| AC-004 Password validation | FR-9; **VR-5, VR-6, VR-8**; SR-3 (VR-7 deferred to US-009) | api-design `400`; contract policy | §5 | 6, 7 | Integration incl. boundaries 12/128, code points; unit |
| AC-005 Password storage | FR-10; SR-1…SR-4 | db-design `password_hash` unbounded | §5, §6 | 1, 2, 5, 8 | Persistence + security, asserted **against the database** |
| AC-006 Secure response | FR-11; SR-3…SR-6 | api-design four-field DTO | §5 | 7, 8, 9 | Security; contract |
| AC-007 Audit logging | FR-12; SR-3, SR-6, SR-7 | — | §5 | 5, 9 | Audit assertion; EC-4 failure tolerance |

Every AC reaches at least one step and at least one test level (NFR-006 holds).
The AC-004 row is corrected here as well as in the plan — revision 1 of this
review copied the plan's `VR-5…VR-8` range verbatim before `p-5` was caught.

Requirements carrying no AC are traced too: FR-13…FR-16 (Steps 6, 7, 10),
FR-18…FR-24 (Steps 1, 3, 5, 6, 10), SR-8…SR-10 (Steps 1, 6).

**One caveat carried by `p-6`.** The traceability above is a claim about the plan,
not yet about a suite that runs. Under D-10 as written, the only test file that
exists today runs in no project; the AC coverage above is authored at
`TEST_WRITING` into `tests/integration/`, which the `integration` project does
collect, so no AC row is affected. `p-6` costs the harness test, not an
Acceptance Criterion — that is why it is Major and not Critical.

## 6. Impact Analysis Coverage

Unchanged from revision 1: every HIGH- and MEDIUM-confidence area of impact
analysis v2 is accounted for, with three material differences the plan explains
in its Impact-Analysis Reconciliation table (no AD-7 amendment via D-2;
`.gitignore` changed via D-4; `users.schemas.ts` not created via D-8). None
missing; none requiring reanalysis.

| Impact analysis area | Status in the plan |
|---|---|
| `src/modules/auth/`, `src/modules/users/` (HIGH) | Covered — Steps 8, 9 |
| `src/middleware/` (HIGH affected / LOW on filenames) | Covered — Step 6; D-7 fixes the four names |
| `src/lib/` (HIGH) | Covered — Step 5; `openapi.ts` reused unchanged |
| `src/config/` (HIGH) | Covered — Step 1 |
| `prisma/` (HIGH) | Covered — Step 2 |
| `src/app.ts`, `src/server.ts` (HIGH) | Covered — Step 10; D-5 fixes the order |
| `tests/` (HIGH) | Covered — Steps 3, 4, **with the `p-6` gap in the collection shape** |
| Repository tooling (HIGH; `tsconfig.typecheck.json` + `.gitignore` MEDIUM) | Covered — Steps 1, 3; D-3, D-4 |
| `products` / `orders` / `support` — No Change (HIGH) | Honoured |
| Files reused unchanged (`eslint.config.js`, `tsconfig.json`, `src/lib/openapi.ts`, `scripts/generate-openapi.ts`, `tests/support/setup.ts`, `.prettierrc.json`, `.audit-allowlist.json`, **`tests/harness.test.ts`**) | Honoured in intent — but see `p-6`: the plan lists `tests/harness.test.ts` among the files it does not change, and D-10 changes whether it runs |

That last row is where `p-6` lives. The impact analysis and this plan both class
`tests/harness.test.ts` as untouched, and in file terms it is. What D-10 alters
is not the file but its collection — a change no file list can show.

## 7. Architecture Review

Unchanged from revision 1. Layering, dependency direction, module ownership,
AD-4 model/DTO separation, AD-5 validation placement, AD-7 configuration
boundary, AD-8 (no new abstraction) and duplication were each re-checked against
v2's text and none is affected by the revision.

One addition, checked because D-10 introduces a `process.env` write outside
`src/config/env.ts`:

- **`vitest.config.ts` assigning `process.env.DATABASE_URL` does not violate
  AD-7 or fail `npm run lint`.** The `no-restricted-properties` rule that
  enforces AD-7 is scoped to `files: ['src/**/*.ts']` (`eslint.config.js:96` and
  `:102`), and is switched off entirely for `**/*.test.ts` and `tests/**/*.ts`
  (`:174`, `:178`). A root-level config file is outside both. AD-7's normative
  sentence is about `src/`, which this is not.

### Claims re-verified during this review

Revision 1's verification table is retained in full below, with the three
rejected rows replaced by their revision-2 outcomes and four new rows added.

| Plan claim | Method | Result |
|---|---|---|
| D-2: `prisma/config` exports `env()`; resolves the URL; throws on unset | Imported the module on the installed `prisma` 7.10.0 and called it (revision 1) | **Holds.** Resolved the configured URL; unset → `PrismaConfigEnvError` naming the variable |
| D-3: `tsconfig.typecheck.json` `include` lacks `prisma.config.ts` | Read the file (revision 1) | **Holds** |
| D-4: `.env.test` is ignored by `.gitignore:28` | `git check-ignore -v .env.test` (revision 1) | **Holds** |
| D-6: `Retry-After` is gated on both header flags | Read `express-rate-limit` `dist/index.cjs` (revision 1) | **Holds.** Guard at line 1052 |
| D-1: AD-6 names five classes; Specification v14 names four | Read `architecture.md` AD-6 and spec FR-21 (revision 1) | **Holds** |
| "No dependency is added"; every named library installed | Read `package.json` | **Holds.** `prisma` / `@prisma/client` / `@prisma/adapter-pg` 7.10.0, `express-rate-limit` 8.7.0, `vitest` 4.1.11 — all exactly as the plan claims |
| `SPECIFICATION:FR-18` is still outstanding | Read `.env.example` (revision 1) | **Holds.** The four JWT variables are still declared |
| **`p-2` closed: no `AC-010` remains** | `grep -n 'AC-010'` over plan v2 | **Closed.** The only occurrence is the revision-history row describing the fix; the Testing Strategy row now reads `AC-10 (api-conventions.md)`, matching lines 455 and 779 |
| **`p-5` closed: the AC-004 row no longer claims VR-7** | Read the Traceability table | **Closed.** The row reads `VR-5, VR-6, VR-8` and states that VR-7 is deferred to US-009 and delivered nowhere in this Story |
| **`p-3` closed: the mechanism is named** | Read D-10; checked the shipped Vitest 4.1.11 types | **Closed.** `projects?: TestProjectConfiguration[]` exists (`reporters.d.DtoKVV2s.d.ts:2859`); `ProjectConfig` is declared at `:3597` as `InlineConfig` minus `NonProjectOptions`, `sequencer` and `deps`, and `NonProjectOptions` at `:3572` lists none of `fileParallelism`, `globalSetup`, `include`, `env`, `sequence` — so every per-project option D-10 uses is supported. The deprecation the plan cites is at `:1627`, verbatim ("use top-level `fileParallelism` instead") |
| **D-10's two-project shape collects `tests/harness.test.ts`** | Compared both `include` globs against the repository's test files | **Fails** (`p-6`). `tests/harness.test.ts` matches neither `src/**/*.test.ts` nor `tests/integration/**/*.test.ts` |
| **The `.env.test` read has an available mechanism** | Read `package.json`; checked `vite` and the installed Node | **Partly.** No `dotenv` is declared; `vite` 8.2.2 is present but only transitively; Node v24.20.0 provides `process.loadEnvFile`. The plan names none of them — `p-7` |
| **`vitest.config.ts` may write `process.env`** | Read `eslint.config.js` lines 96, 102, 164, 174 | **Holds.** The AD-7 rule is scoped to `src/**/*.ts` |
| SC-3's citation for the `429` error body | Read `security-conventions.md` SC-3 and `api-conventions.md` headings (revision 1) | **Fails** (`p-4`, unchanged). Line 178 cites AC-5; AC-5 is "Error status codes", AC-6 is "Error body" |
| `DESIGN_REVIEW:e-1` is discharged by D-1 | Read the approved triage, the plan's Risks table, and the four spec sites (revision 1) | **Fails** (§17, unchanged). The triage says e-1 stays open; the plan says "Mitigated", not "Closed" |

**What this review could not execute.** Revision 1 confirmed `test.projects`
scoping by running a two-project probe on the installed Vitest. This revision
attempted to re-run an equivalent probe outside the repository and the command
was **denied by the permission layer**, so D-10's runtime claims — unit files
overlapping, integration files strictly serial, `globalSetup` running once on the
project and three times at root, `test.env` not reaching `globalSetup` — are
**not independently re-executed here**. They are supported by: the type-level
evidence above, which is direct and which I did read; revision 1's own probe,
which confirmed per-project `fileParallelism` runs on 4.1.11; and the plan's
account. Per this Skill's Tooling Strategy, the affected claims are recorded at
lower confidence rather than asserted. **`p-6` does not depend on any of them** —
it follows from comparing two glob patterns against the files on disk, which
needs no probe.

## 8. API Review

Unchanged from revision 1. Plan v2 touched nothing in the contract surface.

**Contract alignment.** Step 7's six generation obligations stand:
`additionalProperties: false` on both closed objects, `writeOnly` on `password`,
the `const` values on `role` and every `code`, `minProperties: 1` on
`FieldErrors`, the `X-Request-Id` component header, and all seven responses.

**Status codes.** `201`, `400` (two shapes via `oneOf`), `409`, `413`, `415`,
`429`, `500` — all planned, all mapped to a carrier. The `415`-vs-`400` split is
explicit.

**Validation.** Zod at the boundary; unknown properties rejected; both R-4
mappings mandatory in Step 6.

**Compatibility.** Additive only under the existing `/api/v1`.

**Planned tests.** Contract-level assertion that every declared response matches
the approved document, `minProperties: 1` included; `npm run openapi:check`
gates drift.

## 9. Persistence Review

Unchanged from revision 1: one `User` model as db-design §Model; `@db.Uuid` id
with no database default; `@db.VarChar(254)` `@unique` email matching the Zod
bound; unbounded `password_hash` as PC-10's one PC-4 exemption; both timestamps
explicitly `@db.Timestamptz(3)`; the `409` identical on the check and `P2002`
paths; Prisma confined to the repository with no `password_hash` in any select;
a committed additive migration, no `db push`, no edit to an applied migration.

**Planned tests** run against the database rather than a response. Isolation is
PC-1's — serial integration files with `TRUNCATE` between them, unit tests
keeping shuffle and parallelism — and revision 2 now names the mechanism that
delivers it (D-10). The mechanism is right; its glob set is not, which is `p-6`.

## 10. Security Review

Each convention section was opened at revision 1 and the plan judged against its
text. Plan v2 changed nothing in this surface; the table is retained.

| Section | Finding |
|---|---|
| **SC-1** passwords and hashing | Satisfied. Argon2id parameters as constants in `src/config/env.ts`, passed explicitly on every call, with a unit test proving it |
| **SC-2** roles and default state | Satisfied. `Role` enum with `CUSTOMER`; no account-state column |
| **SC-3** rate limiting | Satisfied. 10 requests per hour per IP on `/api/v1/auth`, the value SC-3 records as DECIDED 2026-09-01; the duplicate path is deliberately not hardened into constant time |
| **SC-4** authorization | Not applicable — the endpoint is public and unauthenticated by design |
| **SC-5** HTTP hardening | Satisfied. `helmet()`, `x-powered-by` disabled, explicit CORS allow-list, an explicit body size limit, `trust proxy` as an explicit hop count |
| **SC-6** dependencies | Not triggered. No dependency added; `@prisma/adapter-pg` approved by commit `0339b4a`. **`p-7` is adjacent to this line**: the unnamed `.env.test` read is the one place in the plan where an implementer might reach for one |
| **SC-7** secrets and `.env.example` | Satisfied in substance. The one point needing the gate's attention is `.env.test` — `p-1` |
| **SC-8** schema safety | Satisfied. `migrate deploy` only; no destructive migration |
| **SC-9** what must never appear | Satisfied, and tested. Redaction on the logger, not at call sites; no Prisma text in the `409` or any log line; no password echo; the audit event carries no email and no IP |
| **AD-5** boundary validation | Satisfied — see §8 |

## 11. Testing and Validation Review

**AC coverage.** All seven, mapped in §5.

**Test categories.** Integration, security, persistence, audit and unit, each
with named coverage rather than a category label.

**Negative scenarios.** Thorough, and unchanged: duplicate via both paths; email
format / over-254 / missing / non-string; password below 12, above 128, fewer
than three classes, boundaries at exactly 12 and 128, code-point counting;
unknown property keyed by the offending name; `415`; `413`; `MALFORMED_JSON`;
`429` with the AC-6 body and `X-Request-Id` present; EC-4.

**The `e-2` trap is correctly identified and carried** — all three converging
request shapes, not only the bodyless `POST` with a content type.

**Deterministic validation.** NFR-005's two regimes are now expressible: D-10's
`integration` project takes `fileParallelism: false` while `unit` keeps
`fileParallelism: true` and the file shuffle. This is what `p-3` asked for and it
is delivered.

**Missing evidence — one gap, and it is `p-6`.** Every step still carries an
executable check, and Step 12 runs the full Definition of Done sequence with both
conditional checks correctly identified. But D-10's evidence line proves the
split (`vitest list --project unit` / `--project integration` each resolve their
own tree) **without proving that every test file the repository has lands in one
of them**. That is precisely the assertion that would have caught `p-6`, and it
is the one the step does not make. A revision should add it: the collected set
across all projects must equal the set of test files on disk.

## 12. Execution Order Review

Unchanged from revision 1 and unaffected by plan v2: no step depends on the
output of a later one. Step 1 precedes everything and carries D-3; Step 2
precedes Step 3 precedes Step 8; Step 5 precedes Steps 6, 8, 9; Step 7 precedes
Step 9; Step 10 precedes Step 12; Step 11 regenerates after Step 7.

**The one ordering hazard is real, named, and mitigated** — `R-P1`: tests
authored at Step 4 (`TEST_WRITING`) cannot execute until Steps 2–3 land, so
`test-writer` must not gate completion on a running suite, and the first suite
execution is Step 12. Stating it is what prevents a false failure report at the
next stage.

## 13. Reviewability

**Suitable for one Pull Request**, unchanged from revision 1 and judged by
coherence rather than file count: one independently shippable capability
(customer registration), no unaccounted module, no dependency added, no
refactoring beyond what an approved artifact requires, no step crossing layers
without saying why. The size — roughly 13 files created and 23 modified — is the
Story's authorized breadth (FR-19…FR-24, human decision of 2026-09-01), and
`IMPACT_ANALYSIS:R-7` already routes that citation to the PR summary.

No decomposition is recommended.

## 14. Findings

Four findings are open at the close of this review: one Major raised here, one
Minor raised here, and two Minor carried forward unchanged from revision 1
because nothing has yet answered them. Three findings revision 1 raised —
`p-2`, `p-3`, `p-5` — are **closed**, verified in §7 against plan v2's text; they
are not restated as findings.

### `p-6` — MAJOR — the two-project config collects `tests/harness.test.ts` into no project

**Location.** `docs/plans/US-001-implementation-plan.md`, Step 3 § D-10, the
`projects` array; and the Files To Modify row for `vitest.config.ts`.

**Problem.** D-10 removes the flat `include` — "The flat `include` is removed -
each project declares its own" — and declares:

- `unit`: `include: ['src/**/*.test.ts']`
- `integration`: `include: ['tests/integration/**/*.test.ts']`

The repository's test files today are `src/**/*.test.ts` (**none exist yet**) and
`tests/harness.test.ts`. That file sits at the top level of `tests/`, not under
`tests/integration/`, so it matches **neither** glob. The current flat config
collects it through `include: ['src/**/*.test.ts', 'tests/**/*.test.ts']`; the
replacement does not. A project `include` overrides rather than extends the root
one, and `extends: true` does not restore it.

**Why it matters.** Three reasons, in order of weight:

1. **Nothing catches it.** `npm run test` exits 0 with the file uncollected —
   there is no failure, only a smaller run. `npm run test:unit`
   (`vitest run src --passWithNoTests`) and `npm run test:integration`
   (`vitest run tests/integration --passWithNoTests`) both carry
   `--passWithNoTests`, so neither reports the absence either. This is the same
   failure shape as `p-3`: a configuration change that stays green while
   silently doing less.
2. **The file it drops is the one that guards the configuration.**
   `tests/harness.test.ts` says so in its own header comment — if it fails, the
   configuration is broken rather than the application — and it asserts that
   `NODE_ENV` is `test` and that timestamps are UTC, which is the
   `env: { TZ: 'UTC' }` setting D-10 moves into the shared block. Removing it
   from the run removes the check on the very block being restructured.
3. **`AGENTS.md` Prohibited forbids weakening, skipping or deleting tests.** A
   test that no longer runs has been skipped, whether or not any line of it was
   edited. The plan lists `tests/harness.test.ts` among the files it reuses
   unchanged, which is true of the file and false of its execution.

**Why it is Major and not Critical.** No Acceptance Criterion loses coverage —
the US-001 suite is authored into `tests/integration/`, which the `integration`
project does collect — and the correction is local to one array in one step, with
no consequence for scope, file lists or step boundaries. It is Major rather than
Minor because the plan as written would land a repository whose only existing
test does not run, and no check in the Definition of Done sequence would say so.

**Required correction.** In D-10, make the collected set cover every test file
the repository has. Either give the `unit` project
`include: ['src/**/*.test.ts', 'tests/*.test.ts']`, or add a third project for
the harness tree, or move `tests/harness.test.ts` under a directory one of the
two globs already covers (the last changes a file the plan currently lists as
unchanged, so the first is the smallest). Whichever is chosen, add the assertion
named in §11 to Step 3's evidence: the union of the projects' collected files
equals the test files on disk — `npx vitest list` with no `--project` filter,
compared against the tree.

**Loop-back target.** `IMPLEMENTATION_PLANNING` — the defect is in the plan's own
decision text, and `IMPLEMENTATION` must not be left to rediscover it.

### `p-7` — MINOR — Step 3 states how the test `DATABASE_URL` resolves but not how `.env.test` is read

**Location.** `docs/plans/US-001-implementation-plan.md`, Step 3 (the
`vitest.config.ts` bullet) and D-10's closing paragraph.

**Problem.** Step 3 requires the test `DATABASE_URL` to resolve as
`process.env.DATABASE_URL` first and `.env.test` second, and D-10 establishes —
by execution — that the assignment must happen in the config module body because
`test.env` does not reach `globalSetup`. What neither says is **how the config
body parses `.env.test`**. The repository has no `dotenv` dependency (checked
against `package.json`: it is in neither `dependencies` nor `devDependencies`).
`vite` 8.2.2 exports `loadEnv` and is present in `node_modules`, but only as a
transitive dependency of Vitest — importing it directly would rely on hoisting
and would be an undeclared dependency. The zero-dependency mechanism that does
exist is Node's built-in `process.loadEnvFile()`, available on the installed
Node v24.20.0 (confirmed: it is a function on `process`).

**Why it matters.** This is the same class as `p-3`, one level down: an outcome
stated without the mechanism that produces it. The risk is not that the step is
impossible — it is that the obvious reach is `dotenv`, which `AGENTS.md`
prohibits adding without explicit approval, and the second-most obvious is
`vite`'s `loadEnv`, which the plan's own "No new dependencies" claim would then
be quietly wrong about. Naming the built-in closes both doors in one line.

**Why it is Minor.** The outcome is reachable, by more than one route, without
changing the plan's file list, step boundaries or dependency posture — unlike
`p-3`, where the mechanism named could not produce the stated outcome at all.
Implementation is not blocked; it is merely left to choose, and one of the
choices is prohibited.

**Required correction.** Name the mechanism in Step 3 — `process.loadEnvFile()`
on the installed Node, applied only when `process.env.DATABASE_URL` is unset,
since D-4 requires an externally set value to win — and state that no dependency
is added for it. May be folded into the same revision as `p-6`.

**Loop-back target.** `IMPLEMENTATION_PLANNING`, with `p-6`.

### `p-1` — MINOR — carried forward: D-4's decision still needs the gate's blessing

**Status: `RAISED`, unchanged.** Raised at revision 1; **not re-raised here.**

**What plan v2 fixed.** The documentary half is fully discharged. D-4 now cites
all three counter-authorities — the `AGENTS.md` Prohibited line,
`persistence-conventions.md` PC-10's final bullet on `.env` files never being
committed (line 169) and PC-1's second bullet on credentials never being
hard-coded or committed (lines 11–12), both verified in the convention text —
and lists D-4 as **Open Question 3** with both outcomes planned for: approval
blesses the `!.env.test` negation, declining it selects the recorded fallback
(CI supplies `DATABASE_URL` as a workflow variable, `.env.test` stays
local-only) and changes Step 3 and the `.gitignore` row only.

**Why it stays open.** The finding's substance was never the citations; it was
that committing `.env.test` crosses a line in `AGENTS.md` Prohibited and only a
human may bless that. Plan v2 surfaces the decision, as required, and explicitly
declines to take it. **`p-1` closes when `HUMAN_PLAN_APPROVAL` records an
answer**, not before. The rejection of 2026-09-03T06:44:24Z said the same: not
decided there, and still owed at the next gate.

**Loop-back target.** None. Resolved at `HUMAN_PLAN_APPROVAL`.

### `p-4` — MINOR — carried forward: SC-3 cites the wrong `api-conventions.md` section

**Status: `RAISED`, unchanged.** Raised at revision 1; **not re-raised here.**

`docs/architecture/security-conventions.md` SC-3 line 178 cites
`api-conventions.md` AC-5 for the `429` error body, but AC-5 is "Error status
codes" and AC-6 is "Error body" — SC-3 line 111 cites AC-6 correctly for the same
thing. It is a defect in a convention document, not in the plan or the code, and
no plan change discharges it. Amending a convention is a human decision, so it
travels to the gate alongside `DB_DESIGN:PC-1`.

**Loop-back target.** None. Due at a human decision.

## 15. Open Decisions

**No blocking Open Decisions were identified.**

`docs/decisions/US-001-open-decisions.md` v7 records twelve entries, **all twelve
`RESOLVED`** — re-verified at this revision by reading every status line (lines
108, 152, 187, 217, 255, 295, 322, 364, 397, 437, 477, 530). No marker from the
`AGENTS.md` Open Decisions Policy list appears anywhere in plan v2; the scan was
re-run against the revised file.

Project-wide Open Decisions in `AGENTS.md` were checked against this Story's
surface: the account state model, the rate-limit thresholds for `login` /
`refresh` / `logout`, refresh-token revocation storage, email verification and
roles beyond `CUSTOMER` are all outside what this Story implements. None blocks.

Items the plan correctly carries to `HUMAN_PLAN_APPROVAL` **once it returns from
the loop-back**, unchanged by this revision:

1. **PC-1 predates Prisma 7** (`DB_DESIGN:PC-1`, D-9) — to note, not to answer.
2. **The normalization `CHECK` constraint stays unspecified**
   (`DB_DESIGN:check-constraint`, `ACCEPTED`) — recorded so it is not reopened.
3. **`p-1`** — D-4 commits `.env.test`; this one **does** need an answer.
4. **`DESIGN_REVIEW:e-1` survives this Story** (§17) — schedule a Specification
   revision, or formally `ACCEPT` it as `e1-loopback` was.
5. **`p-4`** — a one-line amendment to `security-conventions.md` SC-3, takeable
   together with item 1.

## 16. Required Plan Changes

1. **D-10's `projects` array** — make the collected set cover
   `tests/harness.test.ts`; smallest form is
   `include: ['src/**/*.test.ts', 'tests/*.test.ts']` on the `unit` project.
   (`p-6`, **Major — blocks the verdict**)
2. **Step 3 evidence** — add the assertion that the union of the projects'
   collected files equals the test files on disk, which is what would have caught
   `p-6`. (`p-6`)
3. **Step 3 / D-10** — name `process.loadEnvFile()` as the `.env.test` read,
   applied only when `process.env.DATABASE_URL` is unset, and state that no
   dependency is added for it. (`p-7`, Minor)

Nothing else. `p-1` and `p-4` require no plan change: the first is a decision for
the gate, the second an amendment to a convention document.

## 17. Verdict Rationale

**`CHANGES_REQUIRED`**, `loop_back_stage: IMPLEMENTATION_PLANNING`,
`loop_back_key: changes_required`.

One Major finding means the verdict is not `PASS` (`artifact-lifecycle.md` §4).
`p-6` is correctable by the stage that produced it — the fix is one glob in one
decision — and it is upstream of nothing, so `CHANGES_REQUIRED` rather than
`BLOCKED`, and `IMPLEMENTATION_PLANNING` is the earliest responsible stage rather
than a later one absorbing the correction. The key is the only one
`stage-map.yaml` defines under `PLAN_REVIEW`.

**What this revision confirms about the last one.** The gate rejected plan v1
because Step 3 stated an outcome its named mechanism could not produce. Plan v2
names the mechanism, and the mechanism is correct — `p-3` is genuinely closed,
verified against the shipped Vitest types rather than accepted on the plan's
account. Writing the config out in full is what made `p-6` visible: an unnamed
mechanism has no globs to check. The rejection therefore did its work, and the
right response to `p-6` is the same one — return it to the stage that owns it
rather than let `IMPLEMENTATION` discover that the harness test stopped running.

**Findings closed by this review.** None. `p-2`, `p-3` and `p-5` were closed by
the `IMPLEMENTATION_PLANNING` run that produced plan v2 and are recorded as
`RESOLVED` in `history.jsonl` at 2026-09-03T07:03:30Z; this review **verified**
those closures (§7) rather than re-closing them, so it emits no duplicate event
for them.

### `DESIGN_REVIEW:e-1` is still not closed

Unchanged from revision 1, and restated because the plan carries it to the gate.
The approved triage (`docs/decisions/US-001-findings-triage.md`, `APPROVED`)
files `IMPACT_ANALYSIS:e1-loopback` as `ACCEPTED` and records that the residual
risk is e-1 itself, which stays open. The plan's own Risks table says
"**Mitigated**" for e-1 where it says "**Closed**" for R-2, R-3, R-5 and R-6 — a
distinction its author drew deliberately. And `RESOLVED` means a later run fixed
the thing (`state-schema.md`, Finding lifecycle); nothing fixed this one. D-1
instructs US-001 not to follow the Specification on this point; it does not edit
the Specification, which stays stale at lines 41, 515, 940 and 947. US-001 is
protected; **US-002 onward is not.** `e-1` stays `RAISED`, no event is added for
it, and whether it is repaired or formally `ACCEPTED` is a human call.

### The open set

Ten findings were open entering this stage. This review raises two — `p-6` and
`p-7` — and closes none, bringing the open set to **12**:
`SPECIFICATION:FR-18` (`IMPLEMENTATION`), `DESIGN_REVIEW:e-1` (human decision),
`IMPACT_ANALYSIS:R-4` (`TEST_WRITING` and Step 6), `IMPACT_ANALYSIS:R-7`
(`PR_PREPARATION`), `DESIGN_REVIEW:e-2` (`TEST_WRITING`), `DESIGN_REVIEW:d-4`
(`IMPLEMENTATION_VERIFICATION`), `DB_DESIGN:PC-1` (human decision),
`IMPLEMENTATION_PLANNING:R-P1` (`TEST_WRITING`), `PLAN_REVIEW:p-1`
(`HUMAN_PLAN_APPROVAL`), `PLAN_REVIEW:p-4` (human decision), and the two raised
here (`IMPLEMENTATION_PLANNING`).

The plan does **not** proceed to `HUMAN_PLAN_APPROVAL` from this review. It
returns to `IMPLEMENTATION_PLANNING` for a revision 3.
