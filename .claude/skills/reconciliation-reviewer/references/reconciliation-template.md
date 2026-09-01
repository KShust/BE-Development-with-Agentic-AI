# Reconciliation Artifact Format

Structure for the artifact produced by the `reconciliation-reviewer` Skill at its registry
path in `docs/workflow/artifact-paths.yaml`. Section order matters.

Omit a section only when it is genuinely empty, and say so explicitly
("None identified.") rather than deleting the heading, so a reader can tell
"checked, clean" from "not checked".

---

Applies to the `reconciliation` artifact. The `traceability` artifact uses the
same shared front matter with `artifact_type: traceability` and just the matrix
body.

## Front Matter

Shared block from `docs/workflow/artifact-schema.md`
(`artifact_type: reconciliation`), plus: `reconciled_acceptance_criteria`,
`total_acceptance_criteria`, `critical_findings`, `major_findings`,
`minor_findings`, `informational_findings`, `candidate_files`, `excluded_files`.
`created_at` / `updated_at` are runtime timestamps. `inputs` records every
consumed artifact path + version.

Illustrative (dates are examples only):

    ---
    artifact_type: reconciliation
    story: US-001
    version: 1
    status: DRAFT
    created_at: <runtime>
    updated_at: <runtime>
    produced_by: reconciliation-reviewer
    inputs:
      - path: docs/evidence/US-001-implementation-report.md
        version: 1
      - path: docs/verification/US-001-implementation-verification.md
        version: 1
      - path: docs/reviews/security/US-001-security-review.md
        version: 1
    supersedes: null
    reconciled_acceptance_criteria: 4
    total_acceptance_criteria: 5
    critical_findings: 1
    major_findings: 1
    minor_findings: 0
    informational_findings: 2
    candidate_files: 14
    excluded_files: 3
    ---

## 1. Executive Summary

Summarize:

- Reconciliation result;
- Acceptance Criteria reconciliation;
- artifact consistency;
- planned-versus-actual alignment;
- principal drift;
- candidate Pull Request scope;
- recommended next action.

## 2. Artifact Inventory

For every Story artifact list:

- path;
- artifact type;
- version;
- status;
- current or stale;
- mandatory or optional;
- producing stage.

## 3. Source-of-Truth Review

Record:

- remote Issue status when inspected;
- local Story status;
- source-of-truth policy;
- synchronization differences;
- required action.

## 4. Acceptance Criteria Traceability Matrix

For every Acceptance Criterion record:

- ID;
- Story text;
- Specification reference;
- design reference;
- Plan step;
- implementation location;
- test reference;
- Verification evidence;
- Security Review evidence;
- final reconciliation status.

## 5. Specification and Design Alignment

Record:

- Specification-to-API consistency;
- Specification-to-database consistency;
- design-to-implementation consistency;
- deviations.

## 6. Predicted Versus Actual Impact

For predicted items record:

- predicted component;
- confidence;
- actual result;
- explanation.

For actual unpredicted items record:

- file or component;
- classification;
- justification;
- approval status.

## 7. Plan Versus Implementation

For every plan step record:

- completion state;
- implementation evidence;
- deviation;
- required action.

## 8. Test Reconciliation

Record:

- planned tests;
- actual tests;
- executed tests;
- Acceptance Criteria coverage;
- missing or extra test behavior;
- stale evidence.

## 9. API Reconciliation

Record:

- OpenAPI operations;
- runtime implementation;
- DTOs;
- validation;
- status codes;
- errors;
- deviations.

## 10. Persistence Reconciliation

Record:

- database design;
- Prisma models;
- repositories;
- constraints;
- migration evidence;
- query shape concerns (N+1, unbounded reads, sensitive columns);
- deviations.

## 11. Architecture Reconciliation

Record:

- package ownership;
- dependency direction;
- component responsibilities;
- semantic evidence;
- architecture drift.

## 12. Security Reconciliation

Record:

- Security Review version;
- security-sensitive files reviewed;
- changes after review;
- current evidence status;
- security drift.

## 13. Configuration and Dependency Reconciliation

Record:

- planned configuration;
- actual configuration;
- planned dependencies;
- actual dependencies;
- undocumented changes;
- local-environment assumptions.

## 14. Documentation Reconciliation

List:

- current documents;
- stale documents;
- missing updates;
- conflicting descriptions;
- required corrections.

## 15. Pull Request Candidate Scope

Create separate lists:

### Include

Files that belong to the active Story.

### Exclude Runtime Artifacts

Generated files such as build output, coverage reports, or logs.

### Exclude Local Configuration

IDE-local or developer-local configuration.

### Exclude Sensitive Files

Files containing or potentially containing secrets.

### Exclude Unrelated Changes

Changes outside the active Story.

### Human Decision Required

Files whose inclusion cannot be determined safely.

## 16. Drift Register

For every drift item provide:

- ID;
- drift type;
- severity;
- affected artifact or file;
- expected state;
- actual state;
- risk;
- required correction;
- loop-back target.

## 17. Findings

For every finding provide:

- ID;
- severity;
- category;
- evidence;
- impact;
- required correction;
- responsible stage;
- loop-back target.

## 18. Positive Alignment

List areas where intent, design, plan, implementation, tests, Verification, and
Security Review align correctly.

## 19. Open Decisions

List unresolved decisions.

If none exist, state:

    No blocking Open Decisions were identified.

## 20. Reconciliation Limitations

List:

- unavailable tools;
- unavailable remote evidence;
- unavailable runtime checks;
- low-confidence conclusions;
- human checks still required.

## 21. Verdict Rationale

Explain the verdict (see Result Envelope). Do not use `PROCEED_TO_*` /
`RETURN_TO_*` / `REPEAT_RECONCILIATION` labels — they are retired.

---
