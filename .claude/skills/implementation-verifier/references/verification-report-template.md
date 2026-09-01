# Verification Report Format

Structure for the artifact produced by the `implementation-verifier` Skill at its registry
path in `docs/workflow/artifact-paths.yaml`. Section order matters.

Omit a section only when it is genuinely empty, and say so explicitly
("None identified.") rather than deleting the heading, so a reader can tell
"checked, clean" from "not checked".

---

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
