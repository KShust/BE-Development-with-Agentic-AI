---
artifact_type: plan_review
story: US-001
version: 4
status: APPROVED
created_at: 2026-09-03T06:09:54Z
updated_at: 2026-09-03T12:49:56Z
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
    version: 4
  - path: docs/decisions/US-001-open-decisions.md
    version: 7
  - path: docs/decisions/US-001-findings-triage.md
    version: 2
supersedes: null
critical_findings: 0
major_findings: 0
minor_findings: 3
---

# Plan Review: Customer Registration (US-001)

Fourth review of this plan, against **revision 4**. Revisions 1–3 were reviewed
at versions 1–3 of this document; that history is not repeated here, only what
changed and what it changed.

## 1. Review Summary

**Verdict: `PASS`.** 0 Critical, 0 Major, 3 Minor. The plan is executable,
traceable and reviewable as one Pull Request, and it goes to
`HUMAN_PLAN_APPROVAL`.

**What this revision had to do.** `HUMAN_PLAN_APPROVAL` rejected revision 3 on
2026-09-03T12:00:14Z. The rejection was not a quality finding — the automated
verdict was `PASS` and stands — it was the answer to Open Question 3, and it went
against what revision 3 proposed: the `!.env.test` negation was **declined** and
the recorded fallback taken. The human scoped the loop-back precisely, naming the
plan lines to revise and stating that step boundaries do not move.

**The scope was honoured exactly.** The revision-4 commit (`945d55c`) touches
three files: the plan, and the two workflow-state files the orchestrator owns.
Within the plan, the diff hunks fall entirely in the D-4 territory the human
named — front matter, revision history, D-4, the impact-analysis reconciliation
row, the three file tables, Step 3 and its evidence, risk R-3, Configuration
Changes and Open Question 3. **No step boundary moved, no module file list
changed, no traceability row changed, no testing-strategy row changed.** This was
checked against the diff, not against the plan's claim about itself.

**All four claimed changes are correct, and each was verified against the
repository rather than read.** See §4. The correction of the crossed-convention
count from three to five is the one worth naming: revision 3 argued its case to
the gate on the smaller number, and revision 4 records the undercount rather than
quietly fixing it.

**Principal risks.** Unchanged in kind from revision 3, and all carried by name
to the stage that owns them: `IMPACT_ANALYSIS:R-4` and `DESIGN_REVIEW:e-2` to
`TEST_WRITING`, `SPECIFICATION:FR-18` and `PLAN_REVIEW:p-8` to `IMPLEMENTATION`,
`IMPACT_ANALYSIS:R-7` to `PR_PREPARATION`. The one risk the fallback newly
creates is `p-10` below, and it is Minor.

**Recommended next action.** `/so:approve` at `HUMAN_PLAN_APPROVAL`, then
`TEST_WRITING`.

## 2. Reviewed Artifacts

| Artifact | Path | Version |
|---|---|---|
| Story | `docs/stories/US-001-register-customer.md` | — |
| Specification | `docs/specifications/US-001-spec.md` | 14 (`APPROVED`) |
| Specification review | `docs/reviews/specifications/US-001-spec-review.md` | 11 (`APPROVED`, `PASS`) |
| API design | `docs/designs/api/US-001-api-design.md` | 2 |
| OpenAPI contract | `docs/designs/api/US-001-openapi.yaml` | 2 |
| Database design | `docs/designs/database/US-001-db-design.md` | 2 |
| Entity model | `docs/designs/database/US-001-entity-model.md` | 1 |
| Design review | `docs/reviews/designs/US-001-design-review.md` | 2 (`APPROVED`, `PASS`) |
| Impact analysis | `docs/impact-analysis/US-001-impact-analysis.md` | 2 |
| **Implementation plan** | `docs/plans/US-001-implementation-plan.md` | **4** (the subject) |
| Open decisions | `docs/decisions/US-001-open-decisions.md` | 7 (12 of 12 `RESOLVED`) |
| Findings triage | `docs/decisions/US-001-findings-triage.md` | 2 (`APPROVED`, human) |

Conventions read for this review: `AGENTS.md`, `architecture.md`,
`module-map.md`, `api-conventions.md`, `persistence-conventions.md`,
`security-conventions.md`, `business-rules.md`,
`non-functional-requirements.md`.

**How this review was scoped.** Revision 3 passed this stage on every dimension.
Revision 4 changes one decision and nothing else, so the dimensions below were
re-examined in two ways, and each section says which applies: the changed surface
(scope, persistence configuration, security and secrets, execution order at
Step 3, reviewability) was re-derived from the artifacts and the repository; the
unchanged surface (traceability, architecture, API, testing strategy) was
re-checked for drift against the delta and confirmed unmoved by diff. Nothing was
inherited on the strength of the plan's own claim that it did not change.

## 3. Strengths

- **The decision is stated as taken, not as argued.** D-4 now reads as a
  resolution with its costs recorded, and the case revision 3 made for the other
  outcome is archived beneath it rather than deleted. A future reader can see
  both what was decided and what was given up.
- **The plan corrects its own advocacy.** Revision 3 told the gate the declined
  resolution would cross three convention lines. It would have crossed five.
  Revision 4 records the undercount explicitly, in the section where the case was
  made. That is the behaviour this stage exists to make cheap.
- **`.gitignore` is moved to Files Explicitly Not Changed rather than dropped.**
  The impact analysis predicted a change there; silently removing the row would
  have read as an unexplained narrowing at `RECONCILIATION`. The row states why
  the chosen resolution needs no edit.
- **The decision has observable evidence attached.** Step 3 asserts
  `git status --porcelain` shows no `.env.test`, `git check-ignore -v .env.test`
  still resolves to `.gitignore:28`, and `git diff -- .gitignore` is empty. A
  later revision that quietly re-adds the negation fails a named check rather
  than passing unnoticed.
- **One mechanism serves both environments.** The `process.env.DATABASE_URL`
  before `.env.test` resolution order is unchanged from revision 3; only which
  side is committed changed. CI sets the variable and never reads the file; a
  developer sets no variable and the file is read. The plan says this in as many
  words.

## 4. Scope Review

**Required scope.** Unchanged and complete: the endpoint, the persistence
foundation, the configuration boundary, the error taxonomy, the PC-1
test-database setup. Every Files To Create / Files To Modify row still traces to
an approved artifact.

**The four claimed changes, each verified against the repository:**

| # | Claim | Verification | Result |
|---|---|---|---|
| 1 | D-4 rewritten to the fallback; `.gitignore` **not modified at all** because `.gitignore:28` already ignores `.env.test` | `git check-ignore -v .env.test` resolves to `.gitignore:28:.env.*`; line 29 is `!.env.example`, and no negation for `.env.test` exists | **Correct** |
| 2 | The `.gitignore` row leaves Files To Modify and Configuration Changes | Absent from both tables; present in Files Explicitly Not Changed with the reasoning | **Correct** |
| 3 | The crossed-convention count is five, not three: `security-conventions.md` SC-7 lines **295** and **299** were missed | Line 295 reads "No credentials, tokens, private keys, or `.env` files are committed."; line 299 reads "`.gitignore` covers `.env`, `node_modules/`, `dist/`, `coverage/`, and logs." Both quoted accurately, both line numbers exact. `AGENTS.md` Prohibited, PC-10 final bullet and PC-1 second bullet also confirmed verbatim | **Correct** |
| 4 | Front matter records `plan_review` at v3 | Front matter `inputs` carries `docs/reviews/plans/US-001-plan-review.md` at version 3, and the findings-triage input was raised 1 to 2 in the same edit | **Correct**; see `p-9` for what the same edit missed |

**Missing scope.** None. The one place this plan's file list is narrower than the
predicted surface is `.gitignore`, and refinement 2 of the Impact-Analysis
Reconciliation states it.

**Scope expansion.** None. `npm run validate:harness` reports `harness OK` with
6 warnings and 0 errors; the only warning naming this stage is the stale
`plan_review` input that this document clears.

**Out of Scope compliance.** No `products`, `orders` or `support` path appears.
No dependency is added — confirmed against the plan's New Dependencies section
and the absence of any dependency row in the change tables.

## 5. Requirements Traceability

Unchanged from revision 3 and re-confirmed unmoved by diff — no hunk touches the
Traceability section, the Testing Strategy tables, or any AC row. Re-checked
independently that the Story carries exactly AC-001…AC-007 and that all seven
appear in the plan's traceability table.

| AC | Specification | Design | Impact analysis | Plan steps | Verification |
|---|---|---|---|---|---|
| AC-001 | FR-1…FR-5, FR-17 | contract `201`; `User` model | §6 modules, §7 persistence | 2, 5, 7, 8, 9, 10 | Integration happy path; persistence; unit |
| AC-002 | FR-6, FR-7 | `409` `EMAIL_ALREADY_REGISTERED`; unique on `email` | R-4 envelope; PC-9 | 2, 5, 6, 8, 9 | Integration, **both** check and `P2002` race paths |
| AC-003 | FR-8; VR-1…VR-3 | request schema bounds | R-4 | 6, 7 | Integration validation; contract |
| AC-004 | FR-9; VR-5, VR-6, VR-8 | password policy in `auth.schemas.ts` | — | 6, 7 | Integration incl. 12/128 boundaries; unit |
| AC-005 | FR-10; SR-1…SR-4 | `password_hash` unbounded, never selected | PC-8, PC-10 | 1, 2, 5, 8 | Persistence + security, asserted against the database |
| AC-006 | FR-11; SR-3…SR-6 | four-field DTO | AD-4 | 7, 8, 9 | Security; contract |
| AC-007 | FR-12; SR-7 | audit event shape | SC-9 | 5, 9 | Audit assertion; EC-4 tolerance |

`VR-7` remains correctly marked deferred to US-009 on the AC-004 row — the
`PLAN_REVIEW:p-5` correction from revision 2, still in place.

## 6. Impact Analysis Coverage

All seven risks are addressed, and the only status that moved is R-3.

| Id | Status in the plan | Assessment |
|---|---|---|
| R-1 / `DESIGN_REVIEW:e-1` | Mitigated by D-1 | **Covered.** D-1 states AD-6's five-class list is authoritative and FR-21's four is stale, in as many words, which is the condition `IMPACT_ANALYSIS` set when it declined the specification loop-back |
| R-2 | Closed by D-2 and D-3 | **Covered.** Verified independently: `persistence-conventions.md` PC-1 now carries the "Prisma 7 splits the connection in two" block naming both the adapter and `prisma.config.ts`, and requiring `tsconfig.typecheck.json` to list the file |
| R-3 | Closed by D-4 as decided at the gate | **Covered, and this is the delta.** The resolution is the one the human selected; `.gitignore` unchanged; CI supplies `DATABASE_URL` as a workflow variable |
| R-4 | Carried to `TEST_WRITING` and Step 6 | **Correctly carried.** Both Zod mappings mandatory; `minProperties: 1` must reach the generated document |
| R-5 | Closed by D-5 | **Covered.** The eleven-step order puts `requestId` (5) ahead of `rateLimit` (7) |
| R-6 | Closed by D-6 | **Covered.** Both header flags `false`, verified by the plan against the installed 8.7.0 including the `Retry-After` gating |
| R-7 | Carried to `PR_PREPARATION` | **Correctly carried** |

The three refinements against the impact analysis are each explained, and
refinement 2 (`.gitignore` not changed at all) is the one revision 4 rewrote. Its
reasoning is sound: the analysis predicted a change under either resolution, and
the resolution the gate chose is the one needing no edit.

## 7. Architecture Review

Re-checked for drift against the delta; no hunk touches this surface, and no
finding.

- **Layers.** `routes → controllers → services → repositories` respected
  throughout Steps 6–9. `auth.service.ts` never imports `argon2` or Prisma;
  `users.repository.ts` is the only Prisma site; the controller builds no error
  body.
- **Dependencies and module ownership.** One cross-module edge, `auth.service`
  calling `users.service`, which `module-map.md` permits. No new module, no new
  shared directory, no new abstraction layer, so AD-8's justification requirement
  is not triggered.
- **Component responsibilities.** D-7 keeps `jsonBodyErrors.ts` separate from
  `validateRequest.ts` and out of `errorHandler.ts`, with the reasoning stated.
  D-8 declines to create `users.schemas.ts` rather than creating it empty.
- **Configuration boundary.** D-2 remains the strongest architectural result in
  this plan: `prisma.config.ts` reads no `process.env` at all, so AD-7 needs no
  amendment. Independently confirmed against PC-1's Prisma 7 block, which now
  records the same conclusion.
- **Reuse versus duplication.** `src/lib/openapi.ts`,
  `scripts/generate-openapi.ts`, `eslint.config.js`, `tsconfig.json` and
  `tests/support/setup.ts` are reused unchanged and listed as such.

## 8. API Review

Re-checked for drift; unchanged from revision 3, no finding.

Contract alignment is by generation, not by hand (AC-10). Step 7's six generation
obligations remain complete, and each is the kind that is silently absent
otherwise — `additionalProperties: false` on both closed objects, `writeOnly` on
`password`, the `const` values, `minProperties: 1` on `FieldErrors`, the
`X-Request-Id` component header, and **all seven** responses. The `429` carrier
question is closed (`fa21f62`), and D-6 keeps the limiter from emitting headers
the contract does not declare. Compatibility: purely additive, one new path, no
versioned break.

## 9. Persistence Review

The model, constraints and migration are unchanged from revision 3 and carry no
finding: `@db.Uuid`, `@db.VarChar(254)` `@unique` matching the Zod bound,
unbounded `password_hash` under the one PC-4 exemption PC-10 grants, explicit
`@db.Timestamptz(3)` on both timestamps, a committed additive migration, and a
transactional check-and-insert opened by the service (PC-9).

**The changed surface here is the test database, and it is where `p-10` sits.**
The mechanism is correct: `globalSetup` runs in the main process and test files in
workers, so the URL is resolved in the config module body before either consumer,
and `prisma migrate deploy` spawned from `globalSetup` inherits it. Under the
fallback, CI sets `DATABASE_URL` and never reads the file, and the developer sets
nothing and the file is read. Both paths work. What the plan does not record is
what the absent file now means for a run that needs no database — see `p-10`.

## 10. Security Review

Each section below was opened and read before the plan was judged against it.

| Section | Plan's treatment | Assessment |
|---|---|---|
| SC-1 passwords | Argon2id via `src/lib/password.ts`, all three parameters passed explicitly on every call, constants from `src/config/env.ts` and never env vars | **Satisfied** |
| SC-2 role and account state | `CUSTOMER` only; registration needs only "enabled", so the account-state Open Decision does not block | **Satisfied** |
| SC-3 rate limiting | 10/hour/IP on `/api/v1/auth`, `429` carrying the AC-6 body via `TooManyRequestsError`; the duplicate path deliberately not constant-timed, which SC-3 requires | **Satisfied** |
| SC-4 authorization | Not applicable — the endpoint is public and unauthenticated by design | **Correctly out of scope** |
| SC-5 HTTP hardening | D-5: helmet, `x-powered-by` off, explicit `trust proxy` hop count, explicit CORS allow-list, `10kb` body limit | **Satisfied** |
| SC-6 dependencies | None added; `@prisma/adapter-pg` approved at `0339b4a`. `npm run audit:check` still required because `package.json` gains two scripts | **Satisfied** |
| SC-7 secrets | **The delta.** No `.env` file of any kind is committed; `.gitignore` needs no exception, so the coverage line 299 describes is left intact; `.env.example` gains the placeholder and loses the four JWT entries (FR-18) | **Satisfied, and strengthened by the fallback** |
| SC-8 schema safety | `migrate deploy`, never `db push`; migration committed and never edited after application | **Satisfied** |
| SC-9 logging and exposure | Redaction configured on the logger rather than left to call-site discipline; no Prisma text, code or constraint name in any body or log line; the audit event carries no email and no IP | **Satisfied** |
| AD-5 validation | Zod at the HTTP boundary, unknown properties rejected, services receive typed input; FR-22's ban on an inline controller `parse()` listed as a read-only check | **Satisfied** |

**The security result of the gate's decision is a net improvement, and worth
stating plainly.** Revision 3 asked for permission to cross five convention lines
(it believed three). Revision 4 crosses none. The cost is documentary — PC-1
names a deliverable this Story now does not ship — and it is recorded as
`IMPLEMENTATION_PLANNING:R-P2` for the human who owns the PC-1 amendment, not
absorbed silently.

## 11. Testing and Validation Review

Re-checked for drift; no hunk touches the Testing Strategy, and no finding
against it.

- **AC coverage.** All seven ACs reach at least one named level (NFR-006). The AC
  test matrix is `test-writer`'s artifact at Step 4.
- **Categories.** Integration, security, persistence, audit and unit are all
  present, with the `e-2` three-shape trap called out explicitly and the reason it
  is a trap explained — two Zod mechanisms converging on one `400`.
- **Negative scenarios.** Duplicate via both the check and the `P2002` race path;
  the `415`/`400` split; `413`; malformed JSON; the `429` body; policy boundaries
  at exactly 12 and 128, counted in code points.
- **Deterministic validation.** NFR-005 is served by the three-project
  `test.projects` block — `fileParallelism: false` on `integration` only, shuffle
  retained on `unit`. `PLAN_REVIEW:p-8` remains correctly owed to
  `IMPLEMENTATION`: `sequence` is declared on the `unit` project rather than in
  the shared root block, so the `harness` project and any future
  `tests/*.test.ts` inherit no file shuffle. Nil effect today at one harness file,
  which is why it is Minor and not a loop-back.
- **Missing evidence.** None at the plan level. Every step carries either a
  command that exits 0 or, for the two checks no command performs (BR-6's
  ownership rule, FR-22's inline-`parse()` ban), an explicit statement that they
  are verified by reading.

## 12. Execution Order Review

Twelve steps, dependency-safe, and no step depends on a later one —
re-confirmed, since Step 3 is the step revision 4 rewrote.

The order is sound, and the two things that make it unusual are both stated
rather than left to be discovered:

1. **Step 4 is `TEST_WRITING` and runs first in workflow order, but the schema,
   migration and compose file arrive in Steps 2–3.** The plan states the
   consequence as `R-P1`: `test-writer` must not gate its own completion on a
   running suite. The first suite execution is Step 12.
2. **Step 1 registers `prisma.config.ts` in `tsconfig.typecheck.json` in the same
   step that creates the file**, because otherwise every subsequent turn fails the
   Stop hook. Correct, and the reason is given.

Step 3's rewrite disturbs neither. `.gitignore` leaves the step's file list;
`.env.test` remains a local creation, with `.env.example` carrying the documented
placeholder written in Step 1.

## 13. Reviewability

**One reviewable Pull Request.** Assessed against the five signals, not against
file count:

- **One independently shippable capability** — customer registration. The
  foundations (Prisma connection, app bootstrap, config boundary, error taxonomy,
  test database) are not a second capability: none of them ships or is testable
  without the endpoint, and FR-19 authorizes them explicitly.
- **No unaccounted module.** Every touched path traces to an AC, a design
  element, or an impact-analysis entry.
- **No dependency added.**
- **No refactoring beyond what an approved artifact requires.** The plan states
  the scope-discipline rule itself.
- **No step spans layers without saying why.** Steps 5–10 each name one layer or
  one assembly.

The breadth is real and authorized (FR-19, human confirmation 2026-09-01), and
`IMPACT_ANALYSIS:R-7` correctly carries to `PR_PREPARATION` the obligation to
cite that authorization so the diff does not read as scope creep.

## 14. Findings

Three Minor, none blocking. Two are raised by this review; one is carried forward
unchanged.

### `PLAN_REVIEW:p-9` — MINOR — the Source Artifacts table cites `findings-triage` v1 while the front matter correctly records v2

**Location.** `docs/plans/US-001-implementation-plan.md` line 143 (Source
Artifacts table), against lines 30–31 (front matter `inputs`).

**Problem.** Revision 4 deliberately raised the `findings-triage` input from
version 1 to version 2 in the front matter — the diff shows the edit — and left
the Source Artifacts table in the body saying version 1. The file is at version 2.
Before this revision both said 1 and were consistently stale; now they disagree
with each other.

**Why it matters.** The plan genuinely consumed triage v2: revision 2 of that
document is where `DESIGN_REVIEW:e-1` was accepted, and the plan's own revision
history cites the acceptance. The body table is the version record a human reads;
the front matter is the one `scripts/validate-harness.py` reads. They must not
disagree, and here the human-facing one is the wrong one.

**Required correction.** Change the Source Artifacts row for
`docs/decisions/US-001-findings-triage.md` from version 1 to version 2. One
character.

**Loop-back target.** None — Minor. `IMPLEMENTATION_PLANNING` owns it whenever
the plan is next touched.

### `PLAN_REVIEW:p-10` — MINOR — the fallback makes an absent `.env.test` fail runs that need no database, and the plan records neither the cost nor the narrowed claim

**Location.** `docs/plans/US-001-implementation-plan.md` Step 3 and D-10 (the
config-module-body reader), against D-4's two recorded costs and D-10's "free of
any database dependency" bullet.

**Problem.** The test `DATABASE_URL` is resolved **in the `vitest.config.ts`
module body**, which is evaluated for *every* vitest invocation regardless of
which project runs. When `process.env.DATABASE_URL` is unset the body calls
`process.loadEnvFile()`, which the plan itself confirms throws `ENOENT` on an
absent file. Under revision 3 the file was committed, so it was present after a
clone and this never arose. Under the fallback it is absent on a fresh clone — so
`npm run test:unit` and the `harness` project, both of which need no database,
fail on a missing config file rather than running.

**Why it matters.** Two of the plan's own statements narrow without saying so.
D-10 asserts the arrangement "keeps `npm run test:unit` free of any database
dependency" — true of `globalSetup`, no longer true of the config body. And D-4
records exactly two accepted costs (PC-1's undelivered deliverable; the
connection string living in two places) when the fallback has a third. The
operational edge is real but bounded: `.claude/hooks/validate-full.py` runs the
code checks at the end of every turn that touched code, so an agent on a clone
without `.env.test` would fail every such turn — reading the wrapped error the
plan already requires, which names `npm run db:test:up` and the file to create.

**Why it is Minor and not Major.** The mechanism is correct and the alternatives
are worse: D-10 established by execution that root `test.env` does not reach
`globalSetup`, so the module body is the only place that serves both consumers.
The failure is loud, actionable, and already specified to name the command to run,
and `tests/README.md` is already in Files To Modify to document creating the file.
Nothing about the implementation changes; only what the plan claims about it.

**Required correction.** Record the third accepted cost in D-4 — a fresh clone
must create `.env.test` before *any* vitest command, not only an integration run —
and narrow D-10's "free of any database dependency" bullet to say it is
`globalSetup` that unit and harness runs avoid, not the URL resolution.
Optionally note that gating the read on the `integration` project being selected
would remove the cost, and that this plan does not do so.

**Loop-back target.** None — Minor.

### `PLAN_REVIEW:p-8` — MINOR — carried forward unchanged

`vitest.config.ts` D-10 declares `sequence.shuffle` on the `unit` project only and
omits `sequence` from the shared root block, so the `harness` project and any
future `tests/*.test.ts` inherit no file shuffle that NFR-005 relies on. Nil
effect today at one harness file. **Owed to `IMPLEMENTATION`**, unchanged by
revision 4.

### Findings closed by this review

Three ids whose latest event still says `RAISED` are demonstrably no longer open.
Each was verified in the repository during this review, not taken from a report.
They stayed open only because no stage with a result envelope had run since the
repair — the constraint `state-schema.md` places on closures — and
`HUMAN_PLAN_APPROVAL` flagged exactly this lag in its rejection comment.

| id | New status | Evidence verified this review |
|---|---|---|
| `PLAN_REVIEW:p-4` | `RESOLVED` | `security-conventions.md` SC-3 line 178 now reads "returns `429` with the standard error body (`api-conventions.md` **AC-6**)". Repaired by commit `b28766f` |
| `DB_DESIGN:PC-1` | `RESOLVED` | `persistence-conventions.md` PC-1 now carries the "Prisma 7 splits the connection in two — decided" block, naming the `@prisma/adapter-pg` driver adapter for the client and `prisma.config.ts` for migrations — the two things the finding said it described nowhere. Repaired by commit `b28766f` |
| `DESIGN_REVIEW:e-1` | `ACCEPTED` | `docs/decisions/US-001-findings-triage.md` v2, section "Revision 2 — `DESIGN_REVIEW:e-1` is accepted", decided by `KShust` on 2026-09-03: a real defect in an artifact past its human gate, with no proportionate route back |

**`DB_DESIGN:PC-1` closes; `IMPLEMENTATION_PLANNING:R-P2` does not.** They name
the same convention and the same human owner, and the plan's Open Question 1
correctly keeps them together for one amendment — but they are different
substance. PC-1's Prisma 7 gap is repaired; PC-1 naming `.env.test` as a
deliverable this Story deliberately does not ship is not, and cannot be until
someone rewords it. Closing the first does not close the second.

**`PLAN_REVIEW:p-1` is not re-closed here.** It was already `RESOLVED` on the
`implementation-planner` envelope at 2026-09-03T12:37:02Z, carrying the gate's
answer. Repeating it would be a no-op.

## 15. Open Decisions

**No blocking Open Decisions were identified.**

`docs/decisions/US-001-open-decisions.md` v7 records 12 of 12 entries `RESOLVED` —
confirmed by reading every `**Status.**` line in the file, not by trusting the
count. No `TODO`, `TBD`, `FIXME`, `???`, `OPEN`, `unresolved` or "to be decided"
marker appears in any consumed artifact in a position that affects this stage; the
occurrences of "unresolved" in the decisions document are prose about
project-wide decisions recorded in `AGENTS.md` (compliance scope, per-environment
`trust proxy`), each explicitly out of this Story's path.

The plan's three Open Questions are correctly classified:

1. **PC-1 needs an amendment** — now for one reason rather than two. The Prisma 7
   half is repaired in the repository (`DB_DESIGN:PC-1`, closed above); the
   `.env.test` deliverable half stands as `IMPLEMENTATION_PLANNING:R-P2`. A human
   owns it, it is documentary, and it blocks nothing.
2. **The `CHECK (email = lower(btrim(email)))` constraint stays unspecified** —
   endorsed twice already; recorded so it is not reopened downstream as a fresh
   idea.
3. **ANSWERED** — whether `.env.test` may be committed. Decided at the gate on
   2026-09-03. Retained as the record of a closed decision, which is the right
   treatment.

## 16. Required Plan Changes

None are required before `HUMAN_PLAN_APPROVAL`. Both new findings are Minor and
neither changes what gets built.

Whenever the plan is next touched:

1. Source Artifacts row for `docs/decisions/US-001-findings-triage.md`: version
   **1 to 2** (`p-9`).
2. D-4: record the third accepted cost of the fallback — a fresh clone must create
   `.env.test` before any vitest command, not only an integration run (`p-10`).
3. D-10: narrow the "free of any database dependency" bullet to `globalSetup`
   (`p-10`).

## 17. Verdict Rationale

**`PASS`.**

No Critical and no Major finding was identified, which is the condition for this
verdict. The plan implements approved requirements and adds no behavior of its
own; every Acceptance Criterion reaches at least one planned test; security is
addressed section by section against `security-conventions.md`; every significant
step carries evidence that is a command exit code or an explicitly named reading
check; the execution order is dependency-safe with its two awkward edges stated
rather than discovered; and the change is one coherent capability reviewable as a
single Pull Request.

The specific question this revision had to answer — did the plan take the decision
the gate made, and take it accurately — is answered yes on all four claimed
changes, each verified against the repository. The revision honoured the loop-back
scope exactly: the diff touches only the plan and the orchestrator's own state
files, and within the plan only the D-4 territory the human named.

The two findings raised here are Minor by the definition in
`artifact-lifecycle.md` §4: a version citation in a body table that the same
document's front matter already has right, and an unrecorded consequence of a
decision whose mechanism is sound and whose failure mode is loud and
self-explaining. Neither changes a file, a step, or a test. Sending the plan back
to `IMPLEMENTATION_PLANNING` for either would cost a full stage cycle to fix one
character and two sentences, which is the "do not send trivial issues back" case
exactly.

`PLAN_REVIEW` returning `PASS` is a review verdict and not human approval
(`AGENTS.md` Human Gates). The plan goes to `HUMAN_PLAN_APPROVAL`, where a person
records the decision with `/so:approve` or `/so:reject`.
