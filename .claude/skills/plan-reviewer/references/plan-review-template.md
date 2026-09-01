# Output Format

Structure for the artifact produced by the `plan-reviewer` Skill at its registry
path in `docs/workflow/artifact-paths.yaml`. Section order matters.

Omit a section only when it is genuinely empty, and say so explicitly
("None identified.") rather than deleting the heading, so a reader can tell
"checked, clean" from "not checked".

---

Use the following structure.

## Front Matter

Shared block from `docs/workflow/artifact-schema.md`
(`artifact_type: plan_review`), plus finding counts. `created_at` / `updated_at`
are runtime timestamps. Illustrative (dates are examples only):

    ---
    artifact_type: plan_review
    story: US-001
    version: 1
    status: DRAFT
    created_at: <runtime>
    updated_at: <runtime>
    produced_by: plan-reviewer
    inputs:
      - path: docs/plans/US-001-implementation-plan.md
        version: 1
      - path: docs/specifications/US-001-spec.md
        version: 1
      - path: docs/impact-analysis/US-001-impact-analysis.md
        version: 1
    supersedes: null
    critical_findings: 0
    major_findings: 0
    minor_findings: 0
    ---

## 1. Review Summary

State:

- overall result;
- plan readiness;
- principal risks;
- recommended next action.

## 2. Reviewed Artifacts

List all reviewed artifact paths and versions.

## 3. Strengths

List plan elements that are clear, safe, traceable, and executable.

## 4. Scope Review

Cover:

- required scope;
- missing scope;
- scope expansion;
- Out of Scope compliance.

## 5. Requirements Traceability

Map:

- Acceptance Criterion;
- Specification section;
- design artifact;
- Impact Analysis section;
- plan step;
- planned test or validation.

## 6. Impact Analysis Coverage

For each material Impact Analysis finding, state:

- covered;
- excluded with justification;
- missing;
- requires reanalysis.

## 7. Architecture Review

Record findings related to:

- layers;
- dependencies;
- module ownership (`module-map.md`); "package" in this codebase means an npm
  package, never a source folder;
- component responsibilities;
- reuse versus duplication.

## 8. API Review

Record:

- contract alignment;
- status code handling;
- request and response handling;
- validation;
- compatibility;
- planned tests.

## 9. Persistence Review

Record:

- entities;
- constraints;
- uniqueness;
- nullability;
- storage behavior;
- schema implications;
- planned tests.

## 10. Security Review

Record:

- authentication;
- authorization;
- password handling;
- sensitive data;
- configuration;
- security tests.

## 11. Testing and Validation Review

Record:

- AC coverage;
- test categories;
- negative scenarios;
- deterministic validation;
- missing evidence.

## 12. Execution Order Review

Explain whether the order is feasible and dependency-safe.

## 13. Reviewability

Assess whether the planned change is suitable for one reviewable Pull Request.

## 14. Findings

For each finding provide:

- ID;
- severity;
- location;
- problem;
- why it matters;
- required correction;
- loop-back target.

## 15. Open Decisions

List decisions that must be resolved before implementation.

If none exist, explicitly state:

No blocking Open Decisions were identified.

## 16. Required Plan Changes

Provide a concise list of changes the Planner must make.

Do not rewrite the plan.

## 17. Verdict Rationale

Explain the verdict (see Result Envelope). Do not use `PROCEED_TO_*` /
`RETURN_TO_*` labels — they are retired.

---
