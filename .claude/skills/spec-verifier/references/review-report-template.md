# Specification review report template

Structure for the `specification_review` artifact
(`docs/reviews/specifications/{story_id}-spec-review.md`). Omit a category only
when it is genuinely empty — say "None found." rather than deleting the heading,
so a reader can tell "checked, clean" from "not checked".

Every finding cites the exact ids it concerns (`FR-n`, `BR-n`, `VR-n`, `SR-n`,
`EC-n`, `AC-00n`, `OD-n`) and is phrased as a problem or a question — never as a
drafted replacement sentence, a new requirement, or an answer to an Open
Decision.

```markdown
---
artifact_type: specification_review
story: US-001
version: 1
status: DRAFT
created_at: <runtime ISO-8601>
updated_at: <runtime ISO-8601>
produced_by: spec-verifier
inputs:
  - path: docs/specifications/US-001-spec.md
    version: 1
  - path: docs/stories/US-001-register-customer.md
    version: null
  - path: docs/decisions/US-001-open-decisions.md
    version: 1
supersedes: null
critical_findings: 0
major_findings: 0
minor_findings: 0
---

# Specification Review: <Story Title>

## Summary

- Verdict: `PASS` | `CHANGES_REQUIRED` | `BLOCKED`
- Traceability: <n>/<total> Acceptance Criteria actually covered by a
  requirement (not merely mentioned)
- Findings: <critical> Critical, <major> Major, <minor> Minor

## Reviewed Artifacts

| Artifact | Path | Version | Status |
|---|---|---|---|

Flag any input that is `SUPERSEDED`, or any version mismatch between what the
specification recorded consuming and what is current — that is a `BLOCKED`
condition, not a finding to note in passing.

## Completeness

Business goal, Acceptance Criteria, validation rules, security requirements,
error handling, out-of-scope, NFRs — present or missing, per section.

## Consistency

Story vs specification; `docs/product/business-rules.md` vs specification;
glossary terminology. A pair of statements that cannot both be true is a
finding; a phrasing you would have chosen differently is not.

## Traceability

For every row of the specification's traceability matrix, verify the mapped
requirement's own text actually satisfies that criterion's condition and
outcome. Sharing a topic or a noun is not coverage. Separately, verify every
Acceptance Criterion in the Story has a row at all.

| AC id | Mapped to | Actually covered? | Note |
|---|---|---|---|

## Security

Are authentication, authorization, and credential-handling requirements stated,
and does each cite `docs/architecture/security-conventions.md` or an Open
Decision? An invented security rule is a Critical finding.

## Open Decisions

Every decision from `docs/decisions/{story_id}-open-decisions.md` appears in the
specification with its impact described, and no requirement quietly settles one.
An open question the Story flagged that vanished from the specification is a
finding.

## Testability

Each Acceptance Criterion is expressed in observable terms — an outcome a test
could assert, not an internal implementation state.

## Findings

Ordered most severe first. `Critical` blocks; `Major` must be fixed before
proceeding; `Minor` is advisory and travels in `non_blocking_findings`.

### Critical

C-1. <problem> (<ids>) — <evidence: what was checked and what it actually says>
— <required correction, stated as the gap to close, not as drafted text>

### Major

M-1. ...

### Minor

m-1. ...

## Limitations

Anything that could not be checked, and why.

## Verdict Rationale

One paragraph, derived only from the findings above — no new judgment
introduced here. State the verdict and, for `CHANGES_REQUIRED`, the loop-back
target (`SPECIFICATION`, the only key `stage-map.yaml` allows at this stage).
A `PASS` here is not human approval: the orchestrator advances to
`HUMAN_SPEC_APPROVAL`.
```
