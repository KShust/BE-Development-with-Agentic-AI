---
name: design-reviewer
description: >
  Independently reviews the API design (OpenAPI contract + API design notes) and
  the database design (DB design + entity model) for a User Story against the
  approved Specification, architecture conventions, security conventions, and
  cross-model consistency. Owns the DESIGN_REVIEW stage. Use after API_DESIGN and
  DB_DESIGN, before IMPACT_ANALYSIS.
---

# Purpose

Own the **DESIGN_REVIEW** stage. Provide a quality gate on the API and database
designs before the Story commits to impact analysis and planning.

Review both designs together in one pass. Do not split into separate API and DB
review stages in this version of the harness.

The Skill does not edit designs. It records findings and, on
`CHANGES_REQUIRED`, names the loop-back target.

# When to use

- The orchestrator routed the workflow to `DESIGN_REVIEW`, after `API_DESIGN`
  and `DB_DESIGN` have run or recorded `NOT_APPLICABLE`.

# When NOT to use

- To edit either design. Record findings and name the loop-back target.
- To review the Specification (`spec-verifier`) or the Implementation Plan
  (`plan-reviewer`).
- To review code — no implementation exists at this stage.
- As the security review. `security-reviewer` runs against the implementation;
  this stage checks the designs against the security conventions only.

# Canonical sources

- Workflow / stage / loop-back keys: `docs/workflow/stage-map.yaml`
  (`DESIGN_REVIEW`; loop_back keys `changes_required_api`,
  `changes_required_database`, `changes_required_both`).
- Artifact paths: `docs/workflow/artifact-paths.yaml` (authoritative; resolve
  every path from a registry key).
- Status vocabulary: `docs/workflow/artifact-lifecycle.md`.
- Front matter: `docs/workflow/artifact-schema.md`.

# Inputs (registry keys — resolve paths from artifact-paths.yaml)

- `story`
- `specification`, `specification_review`
- `api_design`, `openapi`  (may be marked NOT_APPLICABLE upstream)
- `database_design`, `entity_model`  (may be marked NOT_APPLICABLE upstream)
- `open_decisions`
- Architecture references: `docs/architecture/architecture.md`,
  `docs/architecture/api-conventions.md`,
  `docs/architecture/persistence-conventions.md`,
  `docs/architecture/security-conventions.md`,
  `docs/architecture/module-map.md`
- `docs/product/business-rules.md`, `docs/product/non-functional-requirements.md`
- `AGENTS.md`

# Preconditions

- `specification_review` verdict is `PASS`, and `HUMAN_SPEC_APPROVAL` was
  recorded (the orchestrator will only route here after that gate).
- For each design area not explicitly marked `NOT_APPLICABLE` by the approved
  Specification, the corresponding design artifacts exist and are `DRAFT` or
  `APPROVED`, not `SUPERSEDED`.
- The architecture convention documents cover the questions this review asks.
  They are substantial today, so the realistic failure is not an empty file but a
  **gap**: a rule the designs depend on that no convention states. Name the
  missing rule and return `verdict: BLOCKED`; do not fill the gap from general
  practice.
- No blocking Open Decision affecting API or persistence design.

If a design area is `NOT_APPLICABLE`, confirm the Specification actually says so
and review only the other area.

If **both** `API_DESIGN` and `DB_DESIGN` recorded `NOT_APPLICABLE`, there is no
design to review. Still produce a `design_review` artifact that records both
areas as out of scope (citing the Specification), and return
`verdict: NOT_APPLICABLE` — the orchestrator advances to `IMPACT_ANALYSIS`
(`DESIGN_REVIEW` is `optional: true` for exactly this case).

# Review checklist

## API design (when applicable)
- every Acceptance Criterion with externally observable behavior maps to an
  operation / status code in the OpenAPI contract;
- paths, methods, media type, versioning, and error model follow
  `api-conventions.md`;
- request and response schemas use DTOs, never entities;
- no response field exposes a credential or internal-only value;
- validation constraints from the Specification are reflected in the contract;
- error responses cover the documented failure cases (400/401/403/404/409 as
  applicable) and the structured error body from `api-conventions.md`;
- authentication / authorization per operation is stated and matches
  `security-conventions.md`;
- backward compatibility: note any breaking change to an existing contract.

## Database design (when applicable)
- entities trace to business concepts in `business-glossary.md` /
  `business-rules.md`;
- explicit column length, nullability, uniqueness, indexes — nothing left to a
  Prisma or database default;
- identifier type and generation follow `persistence-conventions.md`;
- sensitive fields (password hash, tokens, PII) identified with storage rules;
- the migration strategy is consistent with `persistence-conventions.md`
  (a committed Prisma migration, never `prisma db push`, and no edit to an
  applied migration);
- relationships and cardinality are explicit.

## Cross-model consistency
- every resource in the API maps to a coherent persistence model;
- field names, types, and constraints agree between DTO schemas and entities
  where they represent the same data;
- uniqueness / validation enforced consistently (e.g. email uniqueness at both
  request-validation and DB-constraint level);
- no business decision introduced by a design that is absent from the
  Specification or an approved decision → that is a finding, not something to
  accept.

# Findings

Severity is defined once, in `docs/workflow/artifact-lifecycle.md` §4 (`Critical` and `Major` both block; `Minor` does not). What follows is what each level looks like at this stage.

- **Critical** — the design would produce something unsafe or unbuildable: a
  credential field on a response DTO, an endpoint with no authorization where the
  Specification requires it, a persistence model that cannot satisfy a business
  invariant, a contract and a schema that disagree on the same data.
- **Major** — a defect the owning design stage must fix: a missing status code,
  an unstated constraint, an index the named access path needs, an operation with
  no traceable requirement.
- **Minor** — naming, description text, ordering, a redundant field definition.

For every `Critical`/`Major` finding, record which design area it belongs to
(API / database / both) and the required correction.

# Output

Create `design_review` at its registry path
(`docs/reviews/designs/{story_id}-design-review.md`) with front matter per
`docs/workflow/artifact-schema.md` (`artifact_type: design_review`).

Sections: Summary; Reviewed Artifacts (paths + versions); API Design Review;
Database Design Review; Cross-Model Consistency; Security Review of Designs;
Findings (id, severity, area, evidence, required correction); Open Decisions;
Limitations; Verdict.

# Validation Checklist

Before returning the result envelope, confirm each of these:

- Both designs were reviewed, or the `NOT_APPLICABLE` verdict of the absent one
  is recorded with its rationale.
- Cross-model consistency was checked in both directions: contract against
  persistence, and persistence against contract.
- Every finding names the artifact, the location in it, and the remedy.
- Any loop-back key named exists under `DESIGN_REVIEW` in `stage-map.yaml`.
- Neither design was edited.


# Result Envelope

Return exactly this (shape: `docs/workflow/artifact-lifecycle.md` §5); the story-orchestrator records the transition (this Skill
does not touch `workflow-state.yaml`):

```yaml
result:
  verdict: PASS | CHANGES_REQUIRED | BLOCKED | NOT_APPLICABLE
  stage: DESIGN_REVIEW
  story: <StoryId>
  artifact_status: APPROVED        # of the design_review artifact itself
  artifacts:
    - docs/reviews/designs/<StoryId>-design-review.md
  next_stage: IMPACT_ANALYSIS
  loop_back_stage: null            # or API_DESIGN / DB_DESIGN
  loop_back_key: null              # or changes_required_api / changes_required_database / changes_required_both
  blocking_issues: []
  non_blocking_findings: []
```

Loop-back selection (keys must match `stage-map.yaml` `DESIGN_REVIEW.loop_back`):

| Situation | loop_back_stage | key |
|---|---|---|
| API contract wrong / incomplete | `API_DESIGN` | `changes_required_api` |
| DB design wrong / incomplete | `DB_DESIGN` | `changes_required_database` |
| Both need changes | `API_DESIGN` | `changes_required_both` |

- `PASS` — no `Critical`/`Major` findings; both designs are sound and
  consistent.
- `CHANGES_REQUIRED` — `Critical` or `Major` findings; set `loop_back_stage`.
- `BLOCKED` — missing/stale mandatory input, a convention this stage depends on is not stated anywhere in `docs/architecture/`, or a blocking Open
  Decision.
- `NOT_APPLICABLE` — both design areas recorded `NOT_APPLICABLE` upstream; the
  `design_review` artifact documents that and `next_stage` is `IMPACT_ANALYSIS`.

# Prohibited

- Do not edit designs, the OpenAPI file, the Specification, or architecture docs.
- Do not resolve Open Decisions.
- Do not update workflow state.
- Do not create commits or Pull Requests.
