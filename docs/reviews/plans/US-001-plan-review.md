---
artifact_type: plan_review
story: US-001
version: 3
status: APPROVED
created_at: 2026-09-03T06:09:54Z
updated_at: 2026-09-03T09:26:45Z
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
    version: 3
  - path: docs/decisions/US-001-open-decisions.md
    version: 7
  - path: docs/decisions/US-001-findings-triage.md
    version: 1
supersedes: null
critical_findings: 0
major_findings: 0
minor_findings: 3
---

# Plan Review: Customer Registration (US-001)

## 1. Review Summary

**Result: `PASS`** — 0 Critical, 0 Major, 3 Minor.

> **Revision 3 — reviews implementation plan version 3.** `PLAN_REVIEW` v2
> returned `CHANGES_REQUIRED` on `PLAN_REVIEW:p-6` (Major) and routed the Story
> back to `IMPLEMENTATION_PLANNING` (history event 2026-09-03T07:22:16Z). This
> revision checks the two closures plan v3 claims, verifies that the revision
> touched nothing else, carries forward what remains open, and reviews the newly
> written text on its own terms. Revision 1's and revision 2's verified
> conclusions are retained where plan v3 did not move the ground under them.

**Both claimed closures hold, and both are closed — verified by execution at this
stage, not read from the plan's revision table.**

- **`p-6` (Major) is closed.** Against the three-project shape of D-10,
  `npx vitest --root . -c <probe> list` with no `--project` filter collects
  `[harness] tests/harness.test.ts` and both of its cases. Against revision 2's
  two-project shape the same command collects **nothing**. The plan's sharper
  claim — that the defect turns *silent* once Step 4 lands integration tests —
  reproduced exactly: with one throwaway file under `tests/integration/`, the
  two-project shape exited **0** reporting `Test Files 1 passed (1)` with the
  harness file absent, while the three-project shape exited **0** reporting
  `Test Files 2 passed (2)`, `Tests 3 passed (3)`. Probes were created at the
  repository root, run, and removed; `git status` is clean of them.
- **`p-7` (Minor) is closed.** `process.loadEnvFile` is a `function` on the
  installed Node v24.20.0, and all three halves of the plan's guard behave as
  D-10 states: with `DATABASE_URL` unset the file's value is loaded; with it set
  externally the guard leaves the external value in place; a missing file throws
  `ENOENT`. No dependency is added, so the plan's "New Dependencies: none" claim
  stays true.

**The revision's central claim — that nothing but D-10 changed — was verified
against the diff, not accepted.** `git diff 6099ab3^ 6099ab3` over the plan is
confined to the front matter, the revision history, the `vitest.config.ts` row of
Files To Modify, the `tests/harness.test.ts` row of Files Explicitly Not Changed,
Step 3 with D-10, and two trailing consistency edits ("two-project" to
"three-project" in Testing Strategy, and the Configuration Changes row). No file
list, step boundary, or decision D-1 through D-9 moved.

**Principal risk.** None that blocks. The plan reaches the gate owing one genuine
human decision (`PLAN_REVIEW:p-1`, surfaced as the plan's Open Question 3), and
carrying two defects in artifacts this Story does not own (`PLAN_REVIEW:p-4`,
`DESIGN_REVIEW:e-1`).

**Recommended next action.** Advance to `HUMAN_PLAN_APPROVAL`. The gate owes an
explicit answer on Open Question 3; both of its outcomes are already planned for,
so neither answer requires re-planning.

## 2. Reviewed Artifacts

| Artifact | Path | Version |
|---|---|---|
| Implementation plan (under review) | `docs/plans/US-001-implementation-plan.md` | 3 |
| Story | `docs/stories/US-001-register-customer.md` | — |
| Specification | `docs/specifications/US-001-spec.md` | 14 |
| Specification review | `docs/reviews/specifications/US-001-spec-review.md` | 11 |
| API design | `docs/designs/api/US-001-api-design.md` | 2 |
| OpenAPI contract | `docs/designs/api/US-001-openapi.yaml` | 2 |
| Database design | `docs/designs/database/US-001-db-design.md` | 2 |
| Entity model | `docs/designs/database/US-001-entity-model.md` | 1 |
| Design review | `docs/reviews/designs/US-001-design-review.md` | 2 |
| Impact analysis | `docs/impact-analysis/US-001-impact-analysis.md` | 2 |
| Open decisions | `docs/decisions/US-001-open-decisions.md` | 7 (12 of 12 `RESOLVED`) |
| Findings triage | `docs/decisions/US-001-findings-triage.md` | 1 (`APPROVED`) |

Every version the plan records in its own `inputs` matches the version on disk.
No input is `SUPERSEDED` or `ARCHIVED`, so the staleness contract of
`artifact-schema.md` is not triggered.

## 3. Strengths

- **The closure evidence is executable, and it reproduces.** Both `p-6` and
  `p-7` were re-verified independently at this stage from the plan's own stated
  commands. A plan that reports a probe precisely enough for a reviewer to re-run
  it is the reason this review can close a Major finding rather than defer it.
- **The third project is argued, not just added.** D-10 explains why `harness`
  is preferred over widening `unit`'s glob — the file asserts that the
  configuration is correct, which is neither a unit test of a `src/` module nor
  an integration test — and gives any future `tests/*.test.ts` a home instead of
  a silent drop.
- **The `p-6` defect is characterized by its failure mode, not just its fix.**
  The plan states, and this review confirms, that the two-project shape fails
  loudly today and silently after Step 4. That is the sentence that makes the
  finding worth its Major grade.
- **The blast radius of the revision is stated and true.** "Nothing about the
  Story, its scope, its file lists or its step boundaries changed" is checkable
  against the diff, and it checks out.
- Traceability is complete: AC-001 through AC-007 is the full set defined by the
  Story and Specification, and every one maps to steps and a named test level.
- All twelve steps carry an `Evidence` block — the "Evidence Before Completion"
  principle holds step by step, with no "ensure everything works" terminator.

## 4. Scope Review

**Required scope.** Present and unchanged from v2: one endpoint, plus the
foundations this Story is first to need (Prisma datasource/model/migration,
application bootstrap and entry, configuration boundary, error taxonomy, PC-1
test-database setup).

**Missing scope.** None identified.

**Scope expansion.** None introduced by revision 3. The one file the revision
adds text about (`vitest.config.ts`) was already in Files To Modify at v2; the
change is to its description, not to the file set.

**Out of Scope compliance.** Holds. No `products` / `orders` / `support` path
appears. The `harness` project added by D-10 collects an existing test file and
creates none.

## 5. Requirements Traceability

| AC | Specification | Design | Impact analysis | Plan steps | Planned verification |
|---|---|---|---|---|---|
| AC-001 | FR-1…FR-5, FR-17; VR-1, VR-2, VR-5; SR-1, SR-2 | API 201; db Model | 5, 6 | 2, 5, 7, 8, 9, 10 | Integration happy path; persistence; unit |
| AC-002 | FR-6, FR-7; VR-4; SR-6 | API 409; db unique | 5, 7 | 2, 5, 6, 8, 9 | Integration duplicate — check **and** race paths |
| AC-003 | FR-8; VR-1…VR-3; SR-6 | API 400 | 6 | 6, 7 | Integration validation; contract |
| AC-004 | FR-9; VR-5, VR-6, VR-8 (VR-7 deferred to US-009) | API 400 | 6 | 6, 7 | Integration policy incl. boundaries; unit |
| AC-005 | FR-10; SR-1…SR-4 | db Model | 7 | 1, 2, 5, 8 | Persistence + security against the database |
| AC-006 | FR-11; SR-3…SR-6 | API 201 DTO | 5 | 7, 8, 9 | Security; contract |
| AC-007 | FR-12; SR-3, SR-6, SR-7 | — | 8 | 5, 9 | Audit assertion; EC-4 failure tolerance |

Confirmed at this stage: AC-001 through AC-007 is the complete set appearing in
the Story and the Specification, so the matrix has no uncovered criterion. The
AC-004 row still correctly marks VR-7 deferred (the `p-5` closure from v2 holds).

## 6. Impact Analysis Coverage

Unchanged by revision 3 and re-confirmed:

| Impact finding | Disposition |
|---|---|
| R-1 (error taxonomy) | Covered — D-1 |
| R-2 (`prisma.config.ts` typecheck + AD-7) | Covered — D-2, D-3 |
| R-3 (`.env.test` git-ignored) | Covered — D-4, carried to the gate as `p-1` |
| R-4 (empty `fieldErrors`, `minProperties`) | Carried to `TEST_WRITING` |
| R-5 (request-id before the limiter) | Covered — D-5 |
| R-6 (limiter headers undeclared) | Covered — D-6 |
| R-7 (PR summary cites the authorization) | Carried to `PR_PREPARATION` |

No area requires reanalysis.

## 7. Architecture Review

Revision 3 touches one configuration file's description and no source layer, so
the architecture conclusions of revisions 1 and 2 stand unchanged: layering
`routes → controllers → services → repositories` is respected step by step;
Prisma appears only in `src/lib/prisma.ts` and the repository; `process.env` is
read only in `src/config/env.ts` (and, per D-2, **not** in `prisma.config.ts`,
which uses `prisma/config`'s own `env()` helper); `auth` reaches `users` through
its service; no new module or abstraction layer is introduced.

One point specific to this revision: `vitest.config.ts` is tooling configuration,
outside the `src/` layering rules that `eslint.config.js` enforces, so the
three-project block raises no layering question.

Duplication check: the `harness` project's `include` (`tests/*.test.ts`) does not
overlap `unit` (`src/**/*.test.ts`) or `integration`
(`tests/integration/**/*.test.ts`). The three globs partition the tree rather
than double-collecting any file — confirmed by the probe, which reported each
file exactly once.

## 8. API Review

Unchanged by revision 3. Contract alignment, the seven declared responses, the
AC-6 error body, the 415/413/400/409/429 mapping, and the generated document
check (`npm run openapi:check`) are as approved at v1 and v2. No new API surface
appears.

## 9. Persistence Review

Unchanged by revision 3 in substance. The one persistence-adjacent element the
revision does touch is *how the test database URL reaches the test process*:
`process.loadEnvFile()` in the config module body, guarded so an external
`DATABASE_URL` wins. Verified at this stage (section 1). This matters because
`globalSetup` runs in the main process while test files run in workers, and the
plan's earlier probe — that root `test.env` reaches workers only — is what makes
the module-body assignment the correct placement rather than a stylistic choice.

Entities, constraints, uniqueness, nullability, `@db.Timestamptz(3)`, the
committed migration, and the `TRUNCATE` fixture are unchanged and remain as
approved.

## 10. Security Review

Unchanged by revision 3. Argon2id via `src/lib/password.ts` with SC-1 parameters
passed explicitly; no JWT variable in `src/config/env.ts` (FR-18); rate limiting
per SC-3 with both header flags `false`; Pino redaction configured on the logger
per SC-9; `password_hash` never in a select on a response path.

`.env.test` is the one security-adjacent item, and it is correctly routed rather
than decided: it carries a local test-database URL and no secret, but it crosses
three convention lines, and D-4 argues the case while leaving the decision to the
gate. That is the right disposition — see `p-1`.

## 11. Testing and Validation Review

**AC coverage.** Complete (section 5).

**Test categories.** Unit beside source, integration under `tests/integration/`,
persistence against the disposable database, security, contract, and audit — all
present.

**Determinism.** Integration serial with `TRUNCATE` between tests; unit parallel
with file shuffle. The mechanism is now named, shaped, and executed rather than
asserted, which was the whole content of `p-3` and `p-6`.

**Missing evidence.** None blocking. One small gap in the declared shape is
recorded as `p-8` below: `sequence.shuffle` is declared on the `unit` project
only, and the root block D-10 sketches does not list `sequence` among the shared
options it carries forward, so the `harness` project inherits none. The flat
config being replaced applies shuffle to everything it collects, including
`tests/harness.test.ts`. The practical effect today is nil — file shuffling is a
no-op on the single harness file, and `tests: false` means intra-file order was
never shuffled — so this is a future-proofing point, not a regression in
observable behavior.

## 12. Execution Order Review

Feasible and dependency-safe; unchanged by revision 3. Steps 1-3 build the
foundations, Step 4 authors tests, Steps 5-12 implement and verify. No step
depends on a later one.

The `TEST_WRITING`-before-`IMPLEMENTATION` ordering consequence remains
explicitly stated in Step 4: the authored tests cannot execute until Step 3
completes, so `test-writer` must not gate its completion on a running suite.
That is `IMPLEMENTATION_PLANNING:R-P1`, and the plan continues to carry it in the
right place.

## 13. Reviewability

Suitable as one Pull Request. Applying the Step 12 tests: the plan delivers a
single independently shippable capability (one endpoint plus the foundations it
cannot ship without); every module it touches is accounted for by an AC, a design
element, or an impact-analysis entry; it adds **no** dependency; it includes no
refactoring beyond what the approved artifacts require.

The file count is large for a first Story, and that is inherent to being first —
`IMPACT_ANALYSIS:R-7` already routes the explanation to `PR_PREPARATION` so the
breadth does not read as scope creep.

## 14. Findings

### `PLAN_REVIEW:p-6` — RESOLVED (was Major)

- **Location.** Plan v3 Step 3, D-10.
- **Problem (as raised).** D-10's two projects collected `tests/harness.test.ts`
  into neither, so the repository's only test would stop running.
- **Resolution.** A third project, `harness`, with `include: ['tests/*.test.ts']`.
  Verified by execution at this stage: unfiltered `vitest list` collects the
  harness file and both cases under the three-project shape and nothing under the
  two-project shape; with an integration file present, the two-project shape
  exits 0 while omitting it and the three-project shape reports 2 files / 3 tests.
- **Status.** Closed.

### `PLAN_REVIEW:p-7` — RESOLVED (was Minor)

- **Location.** Plan v3 Step 3, D-10.
- **Problem (as raised).** Step 3 required the test `DATABASE_URL` to fall back
  to `.env.test` but named no reader for it.
- **Resolution.** `process.loadEnvFile()` on the installed Node v24.20.0, called
  from the config module body only when `process.env.DATABASE_URL` is unset, with
  the `ENOENT` case wrapped to name the command to run. All three behaviors
  verified at this stage. No dependency added.
- **Status.** Closed.

### `PLAN_REVIEW:p-1` — Minor, RAISED (carried, not closed)

- **Location.** Plan v3 D-4; Open Question 3.
- **Problem.** D-4 commits `.env.test` via a `!.env.test` negation, against
  `AGENTS.md` Prohibited, `persistence-conventions.md` PC-10's final bullet, and
  PC-1's second bullet.
- **Why it matters.** The plan crosses three convention lines. It now cites all
  three and argues the case, which is what v2 asked for — but the decision itself
  belongs to a person.
- **Required correction.** None from the Planner. `HUMAN_PLAN_APPROVAL` answers
  it: approval blesses the negation; declining selects the recorded fallback (CI
  supplies `DATABASE_URL` as a workflow variable, `.env.test` stays local-only),
  which changes Step 3 and the `.gitignore` row only.
- **Loop-back target.** None — `HUMAN_PLAN_APPROVAL`.

### `PLAN_REVIEW:p-4` — Minor, RAISED (carried, not closed)

- **Location.** `docs/architecture/security-conventions.md` SC-3, line 178.
- **Problem.** SC-3 line 178 cites `api-conventions.md` AC-5 for the 429 error
  body, but AC-5 is *Error status codes* and AC-6 is *Error body*; SC-3 line 111
  cites AC-6 correctly.
- **Why it matters.** A convention that misdirects a reader to the wrong section
  invites the wrong 429 body. The plan already builds against AC-6.
- **Required correction.** None from the Planner — this Story owns neither the
  file nor the amendment. A human amends SC-3.
- **Loop-back target.** None — human decision.

### `PLAN_REVIEW:p-8` — Minor, RAISED (new in this revision)

- **Location.** Plan v3 D-10, the `projects` array and the root-block comment.
- **Problem.** `sequence: { shuffle: { files: true, tests: false } }` is declared
  on the `unit` project only, and the root block's enumeration of shared options
  ("environment, globals, exclude, setupFiles, env, restoreMocks, clearMocks,
  unstubEnvs, unstubGlobals, testTimeout, hookTimeout") does not include
  `sequence`. So `harness` — and any future `tests/*.test.ts` — inherits no file
  shuffle, where the flat `vitest.config.ts` being replaced applies it to every
  file it collects, `tests/harness.test.ts` included.
- **Why it matters.** File shuffling is the mechanism NFR-005 relies on to make
  an accidental order dependency fail loudly rather than pass by luck. The effect
  today is nil (one harness file; `tests: false` never shuffled within a file),
  so this is about the second file added to that tree, not about current
  behavior.
- **Required correction.** None before implementation. When `IMPLEMENTATION`
  writes the config, either declare `sequence` in the root block so all three
  projects inherit it, or add it to the `harness` project. Leaving it on `unit`
  alone is also defensible if stated deliberately — the point is that the
  omission should be a choice rather than an artifact of moving the option.
- **Loop-back target.** None — `IMPLEMENTATION`.

### Carried from earlier stages, unchanged by this review

`SPECIFICATION:FR-18` (Major, owed to `IMPLEMENTATION`), `DESIGN_REVIEW:e-1`
(Major, spec v14 stale against AD-6 — mitigated for this Story by D-1, unrepaired
for US-002 onward), `IMPACT_ANALYSIS:R-4` and `DESIGN_REVIEW:e-2` (owed to
`TEST_WRITING`), `DESIGN_REVIEW:d-4` (owed to `IMPLEMENTATION_VERIFICATION`),
`IMPACT_ANALYSIS:R-7` (owed to `PR_PREPARATION`), `DB_DESIGN:PC-1` (human
decision), `IMPLEMENTATION_PLANNING:R-P1` (owed to `TEST_WRITING`).

None of these is owed by `IMPLEMENTATION_PLANNING`, and none blocks the gate.

## 15. Open Decisions

No blocking Open Decisions were identified. All twelve entries in
`docs/decisions/US-001-open-decisions.md` v7 are `RESOLVED`, and a scan of the
plan for every marker in the `AGENTS.md` Open Decisions Policy list returns
nothing.

The plan's three Open Questions are correctly graded by the plan itself: 1 and 2
are recorded for the gate to note, and 3 asks for a decision whose two outcomes
are both already planned for. None of the three prevents implementation from
starting once the gate answers question 3.

## 16. Required Plan Changes

**None.** The plan is approved as written.

`p-8` is a Minor point for `IMPLEMENTATION` to settle when it writes
`vitest.config.ts`; it does not require a plan revision, and re-planning for it
would cost more than it saves.

## 17. Verdict Rationale

`PASS`. The one Major finding that sent the plan back — `p-6` — is closed, and
closed against executed evidence rather than against the plan's account of it:
the three-project shape collects every test file on disk, the two-project shape
does not, and the difference becomes invisible exactly when `TEST_WRITING` lands
its suite. `p-7` is closed on the same standard. The revision changed nothing
else, which the diff confirms.

No Critical or Major finding remains. The three Minor findings are correctly
routed away from `IMPLEMENTATION_PLANNING`: `p-1` to the human gate, `p-4` to a
human amendment of a file this Story does not own, and `p-8` to `IMPLEMENTATION`.
Under Step 14, a `CHANGES_REQUIRED` here would have nothing for the Planner to
do — which is the definition of a plan that should advance.

The plan proceeds to `HUMAN_PLAN_APPROVAL`. A `PASS` at this stage is a review
verdict and not that approval; `/so:approve` or `/so:reject` records the decision.
