# Security Review Report Format

Structure for the artifact produced by the `security-reviewer` Skill at its registry
path in `docs/workflow/artifact-paths.yaml`. Section order matters.

Omit a section only when it is genuinely empty, and say so explicitly
("None identified.") rather than deleting the heading, so a reader can tell
"checked, clean" from "not checked".

---

## Front Matter

Shared block from `docs/workflow/artifact-schema.md`
(`artifact_type: security_review`), plus: `critical_findings`,
`major_findings`, `minor_findings`, `informational_findings`,
`security_sensitive` (bool), `runtime_checks` (`FULL` / `PARTIAL` / `NONE`),
`analysis_mode` (`TYPE_CHECKED` / `TEXT_ONLY`).
`created_at` / `updated_at` are runtime timestamps.

Illustrative (dates are examples only):

    ---
    artifact_type: security_review
    story: US-001
    version: 1
    status: DRAFT
    created_at: <runtime>
    updated_at: <runtime>
    produced_by: security-reviewer
    inputs:
      - path: docs/evidence/US-001-implementation-report.md
        version: 1
      - path: docs/verification/US-001-implementation-verification.md
        version: 1
      - path: docs/specifications/US-001-spec.md
        version: 1
    supersedes: null
    critical_findings: 1
    major_findings: 2
    minor_findings: 1
    informational_findings: 0
    security_sensitive: true
    runtime_checks: PARTIAL
    analysis_mode: TYPE_CHECKED
    ---

## 1. Executive Summary

Summarize:

- overall security result;
- principal security controls;
- Critical and Major risks;
- review limitations;
- recommended next action.

## 2. Reviewed Artifacts

List exact artifact paths and versions.

## 3. Security-Relevant Scope

Describe:

- exposed functionality;
- protected assets;
- trust boundaries;
- affected security components.

## 4. Environment and Tools

Record:

- Node version;
- Express, Prisma, and Zod versions in use;
- `NODE_ENV` and the configuration actually loaded;
- database target used for evidence;
- review commands run;
- checks that could not be executed;
- runtime capabilities;
- unavailable checks.

Do not record secrets.

## 5. Authentication Review

Record:

- applicable requirements;
- implementation evidence;
- tests;
- findings.

## 6. Authorization Review

Record:

- endpoint access;
- role checks;
- ownership checks;
- service-level boundaries;
- findings.

## 7. Password and Credential Handling

Record:

- request handling;
- policy enforcement;
- hashing;
- persistence;
- serialization;
- logging;
- tests;
- findings.

## 8. Sensitive Data Exposure

Record review results for:

- responses;
- entities;
- DTOs;
- logs;
- exceptions;
- reports;
- telemetry.

## 9. Input Validation

Record:

- constraints;
- runtime activation;
- negative scenarios;
- oversized or malformed input;
- findings.

## 10. API Security

Record:

- exposed endpoints;
- approved public access;
- protected operations;
- request and response restrictions;
- error behavior;
- findings.

## 11. Persistence Security

Record:

- sensitive fields;
- schema constraints;
- uniqueness;
- nullability;
- database location;
- generated files;
- findings.

## 12. Runtime Configuration

Record:

- startup environment validation;
- CORS, helmet, body limit, `trust proxy`, rate limits;
- cookie flags;
- secret handling;
- unsafe defaults;
- findings.

## 13. Logging and Telemetry

Record:

- sensitive logging review;
- hook telemetry review;
- payload retention;
- redaction controls;
- findings.

## 14. Dependencies

Record:

- added dependencies;
- approval status;
- review limitations;
- vulnerability scanning evidence when available;
- findings.

Do not state that dependencies are secure when vulnerability scanning was not
performed.

## 15. Security Test Coverage

Map security requirements and abuse cases to tests.

## 16. Abuse Case Review

For every reviewed abuse case record:

- scenario;
- expected protection;
- evidence;
- status;
- finding.

## 17. Repository Hygiene

Record:

- secret-like files;
- runtime artifacts in the change set;
- ignored files;
- unsafe local configuration;
- findings.

## 18. Deviations

List deviations between approved security requirements and actual
implementation.

## 19. Findings

For each finding provide:

- ID;
- severity;
- category;
- affected file or artifact;
- observed evidence;
- expected security behavior;
- risk;
- required correction;
- loop-back target;
- verification required after correction.

Do not include actual secret values.

## 20. Positive Controls

List security controls that were independently observed and verified.

## 21. Open Decisions

List unresolved security decisions.

If none exist, state:

    No blocking security Open Decisions were identified.

## 22. Review Limitations

List checks that were not performed and explain why.

## 23. Verdict Rationale

Explain the verdict (see Result Envelope). Do not use `PROCEED_TO_*` /
`RETURN_TO_*` labels — they are retired. When a human security decision is
needed (risk acceptance, exception, suspected credential compromise), return
`verdict: BLOCKED` and say so explicitly in `blocking_issues`.

---
