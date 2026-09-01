---
name: implementation-verifier
description: >
  Independently verifies a Node/TypeScript Express implementation against the
  active User Story, Acceptance Criteria, approved Specification, API and database
  designs, Implementation Plan, tests, architecture rules, and actual
  repository state. Use after implementation and before security review,
  reconciliation, or Pull Request creation.
---

# Purpose

Independently verify that the implementation of the active User Story is:

- functionally correct;
- complete;
- traceable;
- consistent with approved artifacts;
- architecturally compliant;
- buildable;
- covered by appropriate automated tests;
- ready for a dedicated Security Review.

This Skill verifies evidence.

It must not trust completion claims from the Implementor without independently
checking the repository, tests, build results, diagnostics, and changed files.

The Skill does not modify requirements, approve security, reconcile the final
change set, create a Pull Request, or mark the Story as complete.

---

# Position in the Workflow

Canonical workflow: `docs/workflow/stage-map.yaml`. Relevant slice:

    IMPLEMENTATION
    → IMPLEMENTATION_VERIFICATION   (this Skill)
    → SECURITY_REVIEW
    → RECONCILIATION
    → PR_REVIEW
    → HUMAN_PR_APPROVAL
    → PR_PREPARATION → READY_FOR_PR → COMPLETED → ARCHIVED

This Skill owns only the `IMPLEMENTATION_VERIFICATION` stage. Loop-back
(`stage-map.yaml`): `changes_required` → `IMPLEMENTATION`.

---

# When To Use

Use this Skill when:

- implementation has been produced for the active User Story;
- an Implementation Report exists;
- the Implementor recommends proceeding to Implementation Verification;
- source code and tests are available;
- independent verification is required before Security Review;
- a previous verification attempt failed and the implementation was corrected.

Typical requests:

- Verify the implementation of the active User Story.
- Validate the active Story against its Specification and Acceptance Criteria.
- Check whether the current implementation is ready for Security Review.
- Re-run implementation verification after fixes.
- Verify the implementation independently from the Implementor.

---

# When Not To Use

Do not use this Skill:

- before implementation exists;
- to implement missing behavior;
- to generate an Implementation Plan;
- to create tests that should have existed before implementation;
- to rewrite failed tests so that implementation passes;
- to perform the final Security Review;
- to perform final Reconciliation;
- to create, approve, or merge a Pull Request;
- to resolve Open Decisions;
- to change workflow stage automatically;
- as a replacement for human review.

---

# Independence Principle

The Implementor and Verifier have different responsibilities.

The Implementor answers:

    What was implemented?

The Verifier answers:

    What can be independently demonstrated?

The Implementation Report is evidence input, not authoritative proof.

If the Implementation Report says that a check passed, independently reproduce
that check whenever the environment allows it.

Do not copy the Implementor's conclusions into the Verification Report without
supporting evidence.

---

# Active Scope

Read:

- docs/workflow/active-story.yaml
- docs/workflow/workflow-state.yaml

Determine:

- active Story ID;
- current workflow stage;
- active artifact versions;
- implementation attempt;
- verification attempt;
- current branch when recorded;
- expected next stage.

Work only on the active User Story.

If no active Story is configured, stop and report:

    IMPLEMENTATION_VERIFICATION_BLOCKED:
    No active User Story is configured.

If the workflow stage does not allow verification, stop and report:

    IMPLEMENTATION_VERIFICATION_BLOCKED:
    Current workflow stage does not allow Implementation Verification.

Do not select or activate another Story automatically.

---

# Canonical Sources

- Workflow / stage / loop-back: `docs/workflow/stage-map.yaml`
  (`IMPLEMENTATION_VERIFICATION`; loop_back `changes_required` → `IMPLEMENTATION`).
- Artifact paths: `docs/workflow/artifact-paths.yaml` — **authoritative**.
  Resolve every path from its registry key. Paths shown are illustrative.
- Status vocabulary: `docs/workflow/artifact-lifecycle.md`.
- Front matter: `docs/workflow/artifact-schema.md`.

# Required Context

Read AGENTS.md first. Read `docs/workflow/active-story.yaml` and
`docs/workflow/workflow-state.yaml` (read only).

Read (registry keys, resolved via `artifact-paths.yaml`):

- `story`
- `specification`, `specification_review`
- `impact_analysis`
- `implementation_plan`, `plan_review`
- `implementation_report`
- `api_design`, `openapi`, `database_design`, `entity_model`
  (or their `NOT_APPLICABLE` record)
- `design_review`
- `test_strategy`, `ac_test_matrix`  (+ the executable tests: `*.test.ts`
  beside the modules they cover, and `tests/integration/`)
- `open_decisions`

Read prior evidence only when needed: `docs/evidence/`.

Read architecture references:

- docs/architecture/architecture.md
- docs/architecture/module-map.md
- docs/architecture/api-conventions.md
- docs/architecture/persistence-conventions.md
- docs/architecture/security-conventions.md

Read product rules:

- docs/product/business-rules.md
- docs/product/business-glossary.md
- docs/product/non-functional-requirements.md

(`open_decisions` is listed in Required Context above.)

Do not load unrelated completed Stories, historical Specifications, or archived
artifacts unless a concrete dependency requires them.

---

# Artifact Authority

Use the following authority order:

1. Active User Story and Acceptance Criteria
2. Approved Specification
3. Resolved Story decisions
4. Approved API and persistence designs
5. Approved Implementation Plan
6. Architecture and product rules
7. Test artifacts
8. Implementation Report
9. Current implementation

Source code cannot redefine approved requirements.

Tests cannot redefine approved requirements.

The Implementation Report cannot override repository evidence.

If authoritative artifacts conflict, stop and report the conflict.

Do not choose a preferred interpretation silently.

---

# Preconditions

## User Story

The active User Story must exist.

Acceptance Criteria must be identifiable.

## Specification

`specification_review` verdict is `PASS`; `HUMAN_SPEC_APPROVAL` recorded.

## Designs

`design_review` verdict is `PASS`. Required `api_design` / `openapi` /
`database_design` / `entity_model` exist or are recorded `NOT_APPLICABLE`.

## Impact Analysis

`impact_analysis` verdict is `PASS`.

## Plan Review

`plan_review` verdict is `PASS`; `HUMAN_PLAN_APPROVAL` recorded.

## Implementation Report

`implementation_report` must exist, current version. The `IMPLEMENTATION` stage
returned `verdict: PASS` (implementation candidate ready) or
`CHANGES_REQUIRED` with `loop_back_stage: IMPLEMENTATION` (still partial). A
still-partial implementation may be inspected but cannot yield a `PASS`
verification.

## Staleness

Record each consumed artifact version in the verification report `inputs`. Any
`SUPERSEDED` mandatory input → `verdict: BLOCKED`.

## Working Tree

Inspect the current Git state.

Identify:

- modified files;
- untracked files;
- deleted files;
- unrelated changes;
- generated database files;
- current branch.

Do not overwrite current changes.

## Open Decisions

Search required artifacts for unresolved markers:

- Open Decision
- OPEN
- TODO
- TBD
- FIXME
- ???
- unresolved
- to be decided

An unresolved decision is blocking when it affects observable behavior,
security, API, persistence, validation, architecture, or testing.

---

# Verification Principles

## Evidence Over Claims

A statement such as:

    Everything works.

is not evidence.

Acceptable evidence includes:

- a successful `npm run build` / `npm run typecheck`;
- observed test execution and its exit status;
- `npm run lint` output, including the layering rule;
- generated-OpenAPI vs approved-contract comparison;
- the constraints actually present in `prisma/schema.prisma` and the committed
  migration;
- import-graph inspection of the changed files;
- traceability from Acceptance Criteria to code and tests.

## Independent Execution

Run verification independently when possible.

Do not rely only on logs copied from an earlier implementation run.

## Requirements-Based Verification

Verify observable behavior against approved requirements.

Do not verify only that code looks plausible.

## Negative-Path Verification

A successful happy path is insufficient when Acceptance Criteria define error
or rejection behavior.

## No Self-Healing During Verification

Do not modify production code or tests while verifying.

If verification finds a defect:

1. Record the finding.
2. Identify the correct loop-back stage.
3. Stop or continue collecting evidence as appropriate.
4. Do not fix the defect inside this Skill.

## Deterministic Results

Prefer deterministic build, test, diagnostics, schema, and contract evidence
over model judgment.

---

# Tooling Strategy

## Repository inspection

- `Glob` / `Grep` / `Read` for structure, imports, and call sites.
- `git status --short`, `git diff --name-status`, `git diff` (read-only) through
  Bash for the actual change set.
- `package.json`, `tsconfig.json`, `eslint.config.js`, `prisma/schema.prisma`,
  `.env.example` for what the project actually provides.

## Architecture verification

Dependency-direction checks are import checks. Verify with targeted `Grep` over
the changed files:

- `from ".*prisma"` or `PrismaClient` appearing in a `*.routes.ts`,
  `*.controller.ts`, or middleware file — forbidden;
- `from "express"` (or `Request` / `Response` / `NextFunction`) appearing in a
  `*.service.ts` — forbidden;
- a service importing another module's repository — forbidden;
- `process.env` outside `src/config/env.ts` — forbidden;
- `console.log` / `console.error` under `src/` — forbidden.

Confirm anything type-dependent with `npm run typecheck` rather than inferring
it from a text match.

If the editor's IDE integration is connected, its live diagnostics are usable as
extra evidence. Never assume it is available and never block on it:
`npm run typecheck` and `npm run lint` are the authoritative signals.

## Build, lint, and diagnostics

Run through Bash and record the actual exit code:

- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm run build` (when the plan requires the compiled output)

## Test execution

- `npm run test` for the full suite; `npx vitest run <path>` for a focused run.
- Prefer Supertest against `src/app.ts` over starting a server; do not launch
  `npm run dev` unless the approved plan requires a running instance.

## Database verification

- Read `prisma/schema.prisma` and the committed migration SQL as primary
  evidence of the actual constraints.
- `npx prisma migrate status` and `npx prisma validate` are read-only checks.
- Do not mutate database state outside approved automated tests, and do not
  point a command at a shared database.

Record actual exit codes and relevant output. Do not claim a check passed
unless it was executed.

---

# Verification Workflow

## Step 1: Resolve Active Story

Read workflow state.

Record:

- active Story ID;
- current stage;
- Specification version;
- Plan version;
- Implementation Report version;
- implementation attempt;
- verification attempt.

Confirm that Implementation Verification is allowed.

---

## Step 2: Validate Artifact Chain

Verify that all dependent artifacts reference current versions.

Check for:

- stale Specification;
- superseded design;
- outdated Impact Analysis;
- old Implementation Plan;
- review of a different plan version;
- Implementation Report based on outdated artifacts.

If a material version mismatch exists:

1. Set verification status to BLOCKED.
2. identify stale artifacts;
3. recommend regeneration of dependent artifacts;
4. stop before functional verification.

---

## Step 3: Establish Repository Baseline

Inspect:

- current branch;
- Git status;
- changed files;
- untracked files;
- build output (`dist/`), `node_modules/`, coverage output, logs — runtime
  artifacts that must never reach the Pull Request;
- `package.json` / `package-lock.json` changes;
- application and environment configuration;
- existing baseline failures when evidence exists.

Record unrelated changes separately.

---

## Step 4: Reconstruct Required Behavior

From the User Story, Specification, designs, and Acceptance Criteria, produce a
verification checklist.

For every Acceptance Criterion identify:

- required observable behavior;
- expected success result;
- expected failure result;
- relevant API contract;
- relevant persistence effect;
- relevant security condition;
- expected automated test.

This checklist drives all subsequent verification.

---

## Step 5: Inspect Implementation Scope

Compare the actual changed files with:

- Impact Analysis;
- Implementation Plan;
- Implementation Report.

Classify changed files as:

- Planned;
- Required Supporting Change;
- Unexpected;
- Unrelated;
- Generated Runtime Artifact (`dist/`, coverage, logs, generated client
  output).

Unexpected changes require explanation.

Unrelated changes are a verification finding.

Generated runtime artifacts must not be treated as implementation deliverables.

---

## Step 6: Verify Compilation and Build

Run `npm run typecheck`, `npm run lint`, and (when the plan requires the
compiled output) `npm run build`.

Collect:

- the exact command;
- start and completion status;
- exit status;
- type errors and lint errors;
- warnings relevant to the Story;
- generated reports.

A failed build produces a Critical finding.

Do not continue to a PASS verdict after a failed build.

Other evidence collection may continue when useful for diagnosis.

---

## Step 7: Run Automated Tests

Run Story-relevant tests first.

Then run the required project test suite.

Record:

- test command;
- number or names of relevant test groups when available;
- passed tests;
- failed tests;
- skipped tests;
- aborted tests;
- execution limitations.

A test reported as existing but not executed is not verified.

A test passing only because it was disabled is not evidence.

---

## Step 8: Verify Acceptance Criteria

For every Acceptance Criterion, assign one status:

- VERIFIED;
- PARTIALLY_VERIFIED;
- NOT_VERIFIED;
- FAILED;
- BLOCKED.

Provide:

- implementation location;
- test evidence;
- runtime or contract evidence;
- outstanding gap.

An Acceptance Criterion cannot be marked VERIFIED solely because matching code
exists.

---

# Per-Criterion Verification Depth

The Specification and the Acceptance Criteria define *what* to verify. This
section defines *how deeply*, for any Story.

For every Acceptance Criterion, exercise all three of the following before it
may be marked VERIFIED:

- **The success path** the Criterion describes: the request is accepted, the
  documented status code is returned, the response matches the approved
  contract, and any state the Criterion promises is actually persisted.
- **Every failure path the approved artifacts name** — each rejected input,
  conflict, and unauthorized case: the documented status code is returned, the
  error body matches the one shape in `docs/architecture/api-conventions.md`,
  and no partial state is written.
- **The absence of what must not appear**: no credential, secret, hash, token,
  or internal field reaches a response, a log line, or an error body
  (`docs/architecture/security-conventions.md`).

Boundary rules — length, format, uniqueness, case sensitivity, allowed values —
are verified against the value in the approved Specification. If the
Specification does not state a boundary the implementation enforces, that is a
finding: the implementation invented a requirement. Do not verify against a
boundary this Skill, or the implementation, supplied.

---

## Step 9: Verify API Contract

When the Story changes API behavior, compare implementation with the approved
OpenAPI artifact.

Verify:

- path;
- HTTP method;
- request schema;
- response schema;
- status codes;
- content types;
- validation errors;
- conflict errors;
- authentication requirements;
- authorization requirements.

Record every contract deviation.

Do not update OpenAPI to match an incorrect implementation.

---

## Step 10: Verify Persistence Behavior

Compare implementation and actual schema evidence with the approved DB design.

Verify:

- table or entity representation;
- primary key;
- expected columns and types;
- explicit lengths;
- nullability;
- uniqueness;
- relations and referential actions;
- indexes where required;
- repository behavior and transaction boundaries;
- a committed migration matching the model change;
- no `passwordHash` (or other sensitive column) selected into a response path.

Read the generated migration SQL, not only `schema.prisma` — the migration is
what the database will actually apply. `npx prisma migrate status` must show no
pending or missing migration for the change.

---

## Step 11: Verify Architecture

Use semantic analysis when available.

Verify:

- routes wire middleware and delegate; controllers translate HTTP only;
- services own business behavior and transaction boundaries;
- repositories own every Prisma call;
- no route, controller, or middleware imports Prisma;
- no `express` type leaks into a service;
- no Prisma model is returned as an API shape;
- cross-module access goes through the other module's service;
- file placement follows `docs/architecture/module-map.md`;
- no unnecessary layer, module, or shared directory was introduced;
- no approved boundary was bypassed.

Architecture violations are Major or Critical findings depending on impact.

---

## Step 12: Verify Validation and Error Handling

Verify:

- Zod validation is actually wired into the route, for every input surface the
  design lists (body, params, query, headers, cookies);
- unknown body properties are rejected, not silently stripped;
- invalid input produces the approved response and the `fieldErrors` shape;
- a uniqueness conflict maps to the approved status code;
- unexpected errors return the generic body, with no Prisma or SQL text;
- error representation follows `docs/architecture/api-conventions.md` AC-6;
- error behavior is consistent across the relevant endpoints.

Check the actual middleware wiring in the route file and `src/app.ts`. A schema
that exists in `<module>.schemas.ts` but is not applied by the route is not
validation — confirm it with a negative-path test, not by reading the schema.

---

## Step 13: Verify Basic Security-Relevant Behavior

This stage performs only the security checks required to establish functional
readiness.

The dedicated `security-reviewer` performs the broader adversarial review.

Verify at minimum:

- plaintext passwords are not persisted;
- password hashes and refresh tokens are not returned in any response body;
- passwords, tokens, cookies, and authorization headers are not logged;
- sensitive fields are excluded from response DTOs;
- the required authentication/authorization middleware is actually wired on the
  route, and identity comes from the token, not from a request parameter;
- helmet, the CORS allow-list, the body size limit, and rate limiting on
  authentication endpoints are in place;
- no permissive configuration (wildcard CORS with credentials, blanket
  `trust proxy`, disabled validation) bypasses the Story constraints.

Any suspected vulnerability must be forwarded to Security Review even when it
does not block functional verification.

---

## Step 14: Verify Configuration

Inspect relevant configuration files.

Verify:

- every new setting is validated in `src/config/env.ts` and mirrored in
  `.env.example`;
- no `process.env` read outside `src/config/env.ts`;
- migration handling matches `docs/architecture/persistence-conventions.md`;
- no secret, `.env`, or build output is committed;
- test configuration points at a disposable database, so the test evidence is
  valid;
- configuration changes match the approved plan.

Flag undocumented configuration changes.

---

## Step 15: Inspect Diagnostics and Warnings

Collect TypeScript compiler and ESLint diagnostics.

Classify findings as:

- Error;
- Relevant Warning;
- Unrelated Warning;
- Informational.

A passing test run does not mean `npm run typecheck` and `npm run lint` are
clean — run them.

Record relevant warnings that may affect reliability, nullability, security, or
future maintenance.

---

## Step 16: Verify Test Quality

Review tests, not only test results.

Check whether tests:

- map to Acceptance Criteria;
- verify observable behavior;
- include negative scenarios;
- assert persistence effects when relevant;
- assert sensitive data is not exposed;
- avoid depending on execution order or on state left by another test file;
- avoid false-positive assertions;
- do not bypass the authentication middleware unintentionally (for example by
  calling a service directly where the criterion is about a protected route);
- do not mock away the behavior they claim to verify.

Do not rewrite tests during verification.

---

## Step 17: Check Scope and Regression Risk

Check for:

- unrelated refactoring;
- unnecessary dependency additions;
- configuration changes outside the Story;
- public API changes not described by Specification;
- modified behavior in unrelated modules;
- broad security configuration changes;
- removed or weakened tests.

Run the broader project test suite when feasible.

If full regression testing is not possible, explicitly report the limitation.

---

## Step 18: Evaluate Implementation Report Accuracy

Compare the Implementation Report with actual repository evidence.

Identify:

- omitted files;
- incorrect status claims;
- tests claimed but not run;
- validation claimed but not observed;
- undocumented plan deviations;
- security-sensitive changes not disclosed.

Implementation Report inaccuracies must be recorded as findings.

---

## Step 19: Classify Findings

Severity is defined once, in `docs/workflow/artifact-lifecycle.md` §4 (`Critical` and `Major` both block; `Minor` does not). What follows is what each level looks like at this stage.

Classify each finding as:

### Critical

Blocks progression.

Examples:

- build failure;
- failed Acceptance Criterion;
- plaintext password storage;
- password hash exposure;
- missing required behavior;
- implementation contradicts approved Specification;
- test manipulation that hides incorrect behavior;
- unresolved decision materialized as code.

### Major

Requires correction before Security Review or Reconciliation.

Examples:

- missing negative test;
- architecture violation;
- undocumented configuration change;
- contract mismatch;
- missing persistence constraint;
- relevant diagnostics;
- unexplained scope expansion.

### Minor

Does not block progression but should be corrected or documented.

Examples:

- documentation inconsistency;
- non-blocking warning;
- naming issue;
- low-risk maintainability improvement.

---

## Step 20: Determine Loop-Back Target

`stage-map.yaml` defines exactly one loop-back for
`IMPLEMENTATION_VERIFICATION`: `changes_required` → `IMPLEMENTATION`.

- A **code defect with correct upstream artifacts** → `verdict:
  CHANGES_REQUIRED`, `loop_back_stage: IMPLEMENTATION`.
- A defect caused by an **upstream artifact** (Specification / design /
  impact-analysis / plan / a missing test) → `verdict: BLOCKED`; name the
  responsible upstream stage in `blocking_issues` so a human can route it. Do
  not silently send an upstream defect to `IMPLEMENTATION`.

---

## Step 21: Create Verification Report

Create the `implementation_verification` artifact at its registry path
(`docs/verification/{story_id}-implementation-verification.md`), front matter per
`docs/workflow/artifact-schema.md`
(`artifact_type: implementation_verification`).

Do not modify production code or tests. Do not update workflow state. Do not
create a commit or Pull Request.

**This Skill owns the authoritative build and test evidence for the Story.**
Downstream stages reuse it and only re-run validation if tracked files changed
after this verification.

---

# Verification Report Format

## Front Matter

Shared block from `docs/workflow/artifact-schema.md`
(`artifact_type: implementation_verification`), plus:
`build_status`, `tests_status` (`PASS` / `FAIL` / `NOT_RUN`),
`typecheck_status`, `lint_status`,
`acceptance_criteria_verified`, `acceptance_criteria_total`,
`critical_findings`, `major_findings`, `minor_findings`,
`analysis_mode` (`TYPE_CHECKED` / `TEXT_ONLY`).
`created_at` / `updated_at` are runtime timestamps.

Illustrative (dates are examples only):

    ---
    artifact_type: implementation_verification
    story: US-001
    version: 1
    status: DRAFT
    created_at: <runtime>
    updated_at: <runtime>
    produced_by: implementation-verifier
    inputs:
      - path: docs/evidence/US-001-implementation-report.md
        version: 1
      - path: docs/specifications/US-001-spec.md
        version: 1
      - path: docs/plans/US-001-implementation-plan.md
        version: 1
    supersedes: null
    build_status: PASS
    typecheck_status: PASS
    lint_status: PASS
    tests_status: FAIL
    acceptance_criteria_verified: 4
    acceptance_criteria_total: 5
    critical_findings: 1
    major_findings: 1
    minor_findings: 0
    analysis_mode: TYPE_CHECKED
    ---

## 1. Executive Summary

Summarize:

- verification result;
- build status;
- test status;
- Acceptance Criteria coverage;
- critical risks;
- recommended next action.

## 2. Verified Artifacts

List exact paths and versions of all reviewed artifacts.

## 3. Environment

Record:

- Node version;
- package manager and lockfile state;
- TypeScript version and `strict` settings actually in effect;
- `NODE_ENV` and any test-specific configuration;
- database target used for tests;
- verification commands run;
- checks that could not be executed.

Do not record secrets.

## 4. Repository State

Record:

- branch;
- modified files;
- untracked files;
- deleted files;
- unrelated changes;
- generated runtime artifacts.

## 5. Build Evidence

Record:

- command or tool;
- result;
- exit status when available;
- errors;
- relevant warnings.

## 6. Test Evidence

Record:

- commands run (`npm run test`, `npx vitest run <path>`);
- test files or suites;
- results;
- failures;
- skipped tests;
- limitations.

## 7. Acceptance Criteria Matrix

For every Acceptance Criterion record:

- ID;
- required behavior;
- implementation evidence;
- test evidence;
- status;
- findings.

## 8. API Contract Verification

Record:

- matched operations;
- mismatches;
- missing behavior;
- extra undocumented behavior;
- status code verification;
- response data exposure.

## 9. Persistence Verification

Record:

- expected design;
- `prisma/schema.prisma` evidence;
- migration SQL evidence;
- constraint mismatches;
- query shape (N+1, unbounded reads, sensitive columns selected);
- runtime artifact handling.

## 10. Architecture Verification

Record:

- module and layer placement;
- dependency direction;
- layer responsibilities;
- the import checks actually run;
- violations.

## 11. Validation and Error Handling

Record:

- input validation;
- error mapping;
- runtime activation;
- negative-path evidence.

## 12. Basic Security Readiness

Record:

- password and token handling;
- sensitive response fields;
- logging and redaction;
- authentication and authorization wiring;
- concerns forwarded to Security Review.

## 13. Configuration Verification

Record:

- relevant settings;
- plan alignment;
- unsafe defaults;
- undocumented changes.

## 14. Test Quality Review

Record:

- AC coverage;
- positive scenarios;
- negative scenarios;
- false-positive risks;
- missing tests.

## 15. Scope Verification

Compare:

- planned files;
- actual files;
- required supporting files;
- unexpected files;
- unrelated files.

## 16. Implementation Report Accuracy

List discrepancies between the report and repository evidence.

If none exist, state:

    The Implementation Report is materially consistent with observed evidence.

## 17. Findings

For every finding provide:

- ID;
- severity;
- category;
- affected artifact or file;
- observed evidence;
- expected behavior;
- why it matters;
- required correction;
- loop-back target.

## 18. Verification Limitations

List:

- checks not executed;
- unavailable tools;
- environment restrictions;
- low-confidence conclusions;
- remaining manual checks.

## 19. Verdict Rationale

Explain the verdict (see Result Envelope below). Do not use `PROCEED_TO_*` /
`RETURN_TO_*` labels — they are retired.

---

# Validation Checklist

Before returning the result envelope, confirm each of these:

- Every Acceptance Criterion carries a status and the evidence behind it.
- No criterion is `VERIFIED` on the existence of matching code alone.
- Build and test evidence comes from a run this stage performed, not quoted from
  the Implementation Report.
- Every finding is classified and names a location.
- Nothing was fixed, reformatted, or re-run into passing during verification.


# Result Envelope

Return exactly this (shape: `docs/workflow/artifact-lifecycle.md` §5); the story-orchestrator records the transition — this Skill
does not update `workflow-state.yaml`:

```yaml
result:
  verdict: PASS | CHANGES_REQUIRED | BLOCKED
  stage: IMPLEMENTATION_VERIFICATION
  story: <StoryId>
  artifact_status: APPROVED        # of the verification artifact itself
  artifacts:
    - docs/verification/<StoryId>-implementation-verification.md
  next_stage: SECURITY_REVIEW
  loop_back_stage: null            # or IMPLEMENTATION
  loop_back_key: null              # or changes_required
  blocking_issues: []
  non_blocking_findings: []
```

- `PASS` — build passes; all required tests pass with observed evidence; every
  Acceptance Criterion is `VERIFIED`; no Critical or Major findings. Minor
  findings go in `non_blocking_findings`. The orchestrator advances to
  `SECURITY_REVIEW`.
- `CHANGES_REQUIRED` — build fails, a required test fails, an Acceptance
  Criterion is not verified, or a Critical/Major code defect exists **with
  correct upstream artifacts** → `loop_back_stage: IMPLEMENTATION`.
- `BLOCKED` — a mandatory input is missing/stale; the environment prevents
  meaningful verification; the active Story cannot be determined; unrelated
  repository state prevents reliable evidence; an unresolved decision invalidates
  expected behavior; or the defect originates in an **upstream artifact** (name
  the responsible stage in `blocking_issues`).

---

# Prohibited Actions

This Skill must not:

- edit production code or tests;
- alter the User Story, Acceptance Criteria, Specification, designs, or plan;
- resolve Open Decisions;
- suppress diagnostics; disable tests; change assertions to make tests pass;
- update OpenAPI or database constraints to match incorrect code;
- approve security posture (that is `security-reviewer`'s stage);
- update workflow state (the orchestrator does that);
- commit, push, or create/merge a Pull Request;
- mark the Story `COMPLETED`;
- claim verification without observed evidence.

---

# Failure Handling

If build execution fails because of the implementation:

1. Create the verification artifact.
2. Record a Critical finding.
3. Return `verdict: CHANGES_REQUIRED`, `loop_back_stage: IMPLEMENTATION`.

If build execution cannot start because of the environment:

1. Record the environment blocker.
2. Return `verdict: BLOCKED`; explain what evidence is unavailable.

If an automated test fails:

1. Preserve failure output.
2. Map the failure to an Acceptance Criterion or implementation area.
3. Do not change the test.
4. If the cause is a code defect with correct artifacts →
   `verdict: CHANGES_REQUIRED`, `loop_back_stage: IMPLEMENTATION`. If the cause
   is a missing/incorrect test or an upstream artifact → `verdict: BLOCKED`,
   name the responsible stage (`TEST_WRITING` / `SPECIFICATION` / ...) in
   `blocking_issues`.

If type-level confirmation is unavailable (dependencies not installed, an
unrelated build break):

1. Use file inspection and pattern search.
2. Record which checks could not be confirmed.
3. Mark `analysis_mode: TEXT_ONLY`.
4. Avoid unsupported claims about symbol relationships.

If the database is unavailable:

1. verify the Prisma model, the migration SQL, and the persistence tests;
2. record the missing runtime schema evidence;
3. do not claim schema compliance from assumptions.

---

# Observability

Do not disable or bypass configured hooks.

Verification evidence may include:

- the commands run and their exit status;
- build, typecheck, lint, and test invocations;
- the git commands used to capture the change set;
- success or failure status per check.

Do not paste full test or build logs into the Verification Report; reference the
command and summarize the result.

Do not record:

- authorization headers;
- tokens;
- passwords;
- database credentials;
- secret environment values;
- unnecessary personal data.

---

# Human Review Boundary

This Skill may recommend progression to Security Review.

It cannot:

- provide final Pull Request approval;
- replace human code review;
- approve merge;
- accept an unresolved product decision;
- waive a Critical or Major finding.

Human reviewers retain responsibility for reviewing the diff and approving the
Pull Request.

---

# Completion Criteria

Implementation Verification is complete only when:

- the active Story is resolved;
- input artifact versions are validated;
- repository state is captured;
- build is executed or a blocker is documented;
- relevant tests are executed or limitations are documented;
- every Acceptance Criterion receives an explicit status;
- API behavior is verified when relevant;
- persistence behavior is verified when relevant;
- architecture is checked;
- validation and error handling are checked;
- basic security readiness is checked;
- configuration is checked;
- actual change scope is compared with the plan;
- Implementation Report accuracy is evaluated;
- findings are classified;
- loop-back targets are assigned;
- Verification Report is saved;
- the result and recommended next stage are explicit.

Finish with a concise summary containing:

- verification result;
- build status;
- test status;
- Acceptance Criteria coverage;
- Critical and Major finding counts;
- Verification Report path;
- recommended next stage.
- 