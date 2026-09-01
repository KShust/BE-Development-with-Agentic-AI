# Output Format

Structure for the artifact produced by the `impact-analyzer` Skill at its registry
path in `docs/workflow/artifact-paths.yaml`. Section order matters.

Omit a section only when it is genuinely empty, and say so explicitly
("None identified.") rather than deleting the heading, so a reader can tell
"checked, clean" from "not checked".

---

The Impact Analysis uses the shared front matter from
`docs/workflow/artifact-schema.md` (`artifact_type: impact_analysis`), plus an
extension line `analysis_mode: TYPE_CHECKED | TEXT_ONLY`.

`created_at` / `updated_at` are runtime timestamps — never hard-coded.
`status` starts `DRAFT`. `inputs[]` records each consumed artifact path + version
(especially `specification` and `specification_review`).

Illustrative front matter (dates are examples only):

```yaml
---
artifact_type: impact_analysis
story: US-001
version: 1
status: DRAFT
created_at: <runtime>
updated_at: <runtime>
produced_by: impact-analyzer
inputs:
  - path: docs/specifications/US-001-spec.md
    version: 1
  - path: docs/reviews/specifications/US-001-spec-review.md
    version: 1
  - path: docs/reviews/designs/US-001-design-review.md
    version: 1
supersedes: null
analysis_mode: TYPE_CHECKED
---
```

# 1. Executive Summary

Summarize:

- change purpose;
- expected scope;
- affected architectural areas;
- overall risk.

# 2. Source Artifacts

List every artifact used in the analysis.

Include its path and relevant version or status.

# 3. Business Capability Impact

Describe which business capabilities are introduced, modified, or reused.

# 4. Module Impact

For every affected module, provide:

- module name;
- impact type;
- rationale;
- confidence.

# 5. Layer Impact

For every affected module layer, provide:

- module and layer (e.g. `auth` / service);
- responsibility;
- impact type;
- rationale;
- the architecture constraint that applies (from `module-map.md`).

# 6. Expected File Changes

Use separate sections:

## Files To Create
## Files To Modify
## Files To Reuse
## Files Potentially Affected

For each item provide:

- expected path;
- responsibility;
- reason;
- source requirement;
- confidence: HIGH, MEDIUM, or LOW.

Do not present uncertain file paths as facts.

# 7. API Impact

Describe:

- new or modified operations;
- request and response impact;
- error behavior;
- compatibility concerns;
- relevant OpenAPI sections.

# 8. Persistence Impact

Describe:

- Prisma models;
- fields and types;
- constraints (nullability, length, uniqueness, relations);
- indexes;
- repository behavior;
- the migration the change implies;
- data-migration or backfill implications.

Every schema change requires a committed Prisma migration; `prisma db push`
against a shared database is never an acceptable substitute
(`docs/architecture/persistence-conventions.md` PC-2).

# 9. Security Impact

Describe:

- authentication impact;
- authorization impact;
- sensitive data;
- password or credential handling;
- exposure risks;
- security configuration changes.

# 10. Testing Impact

List expected:

- unit tests;
- integration tests;
- security tests;
- persistence tests;
- API or contract tests.

Map testing areas to Acceptance Criteria.

# 11. Configuration and Dependency Impact

Identify:

- environment variables (`src/config/env.ts`, `.env.example`);
- `package.json` dependency or script changes;
- middleware wiring in `src/app.ts`;
- runtime changes (logging, rate limits, CORS allow-list, body limits);
- external service changes.

New dependencies require explicit human approval.

# 12. Documentation Impact

List documentation that may need updates.

# 13. Risks

For every risk provide:

- severity;
- description;
- affected area;
- mitigation;
- human decision required.

# 14. Open Decisions

List unresolved decisions affecting planning.

If none exist, explicitly state:

No blocking Open Decisions were identified.

# 15. Planning Inputs

Provide a concise list of facts that the Implementation Planner must consume.

Do not convert these facts into implementation steps.

# 16. Traceability

Map:

- Acceptance Criterion;
- Specification section;
- Design artifact;
- affected system area;
- expected test category.

# 17. Analysis Limitations

State:

- unavailable tools;
- missing documents;
- low-confidence predictions;
- areas that require reanalysis.

# 18. Readiness Result

State the verdict and explain it. See the Result Envelope section below for the
mapping: a clean analysis is `PASS`; an analysis with residual risks is `PASS`
with `non_blocking_findings`; an un-analysable Story is `BLOCKED`; an analysis
that shows an upstream artifact must change is `CHANGES_REQUIRED` with a
loop-back.

---
