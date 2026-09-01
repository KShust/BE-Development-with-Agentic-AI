# Implementation Report Format

Structure for the artifact produced by the `express-implementor` Skill at its registry
path in `docs/workflow/artifact-paths.yaml`. Section order matters.

Omit a section only when it is genuinely empty, and say so explicitly
("None identified.") rather than deleting the heading, so a reader can tell
"checked, clean" from "not checked".

---

## Front Matter

Shared block from `docs/workflow/artifact-schema.md`
(`artifact_type: implementation_report`), plus:
`tests_status`, `build_status`, `diagnostics_status` (each `PASS` / `FAIL` /
`NOT_RUN`), `security_sensitive` (bool). `created_at` / `updated_at` are runtime
timestamps. `attempt` mirrors `workflow-state.yaml.attempt`.

Illustrative (dates are examples only):

    ---
    artifact_type: implementation_report
    story: US-001
    version: 1
    status: DRAFT
    created_at: <runtime>
    updated_at: <runtime>
    produced_by: express-implementor
    inputs:
      - path: docs/plans/US-001-implementation-plan.md
        version: 1
      - path: docs/reviews/plans/US-001-plan-review.md
        version: 1
      - path: docs/tests/US-001-ac-test-matrix.md
        version: 1
    supersedes: null
    tests_status: PASS
    build_status: PASS
    diagnostics_status: PASS
    security_sensitive: true
    ---

## 1. Summary

Describe:

- implemented capability;
- implementation status;
- validation status;
- important limitations.

## 2. Source Artifacts

List the exact paths and versions of:

- User Story;
- Specification;
- designs;
- Impact Analysis;
- Implementation Plan;
- Plan Review;
- test artifacts.

## 3. Implemented Acceptance Criteria

For each Acceptance Criterion provide:

- AC identifier;
- implementation location (file + symbol);
- relevant test (file path + full `describe` > `it` name, matching the
  `ac_test_matrix` row);
- current status.

## 4. Change Set

Every created / modified file, each classified `Planned` /
`Required Supporting Change` / `Unexpected` / `Unrelated`, with the plan step or
justification. Unrelated changes must not be included in the work.

## 5. Validation Evidence

Actual commands run, exit status, and results for: format check, lint,
typecheck, build, unit tests, integration/API tests, persistence tests,
security tests, contract tests, and `npm run audit:check` where applicable. Do
not claim `PASS` for a check that was not executed.

## 6. Configuration Changes

Every configuration change, with the approving plan step.

## 7. Deviations and Discovered Problems

Anything where repository reality diverged from the plan / impact analysis, and
what was done about it.

## 8. Open Decisions

Any Open Decision touched or newly required. If a security-sensitive decision is
missing, the implementation must stop and this report returns `BLOCKED`.

---
