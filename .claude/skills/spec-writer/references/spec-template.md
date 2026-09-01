# Specification template

Structure for the `specification` artifact
(`docs/specifications/{story_id}-spec.md`). Section order matters — later
sections depend on the ids assigned earlier. Omit a section only when it is
genuinely empty, and say so explicitly ("None identified beyond the acceptance
criteria.") rather than deleting the heading, so a reviewer can tell "checked,
clean" from "not checked".

Every requirement cites its source: an Acceptance Criterion (`per AC-001`), a
project document (`per docs/architecture/security-conventions.md SC-1`), or a
resolved Open Decision. A statement with no citable source is not a
requirement — it belongs in Open Decisions as a question.

```markdown
---
artifact_type: specification
story: US-001
version: 1
status: DRAFT
created_at: <runtime ISO-8601>
updated_at: <runtime ISO-8601>
produced_by: spec-writer
inputs:
  - path: docs/stories/US-001-register-customer.md
    version: null
  - path: docs/evidence/US-001-clarification-report.md
    version: 1
  - path: docs/decisions/US-001-open-decisions.md
    version: 1
supersedes: null
---

# Specification: <Story Title>

Source story: `docs/stories/<StoryId>-<slug>.md`

## Overview

What this Story changes, in two or three sentences, in the language of
`docs/product/business-glossary.md`.

## Business Goal

Why it is being built. Cites the Story business-value section or
`docs/product/product-vision.md`.

## Business Flow

The end-to-end path through the system for the main scenario, and the points
where it can diverge. No implementation detail — behavior only.

## Functional Requirements

Numbered, one behavior per item.

FR-1. <requirement statement> (per AC-001 / per <doc reference>)

## Business Rules

Rules that constrain how the functional requirements behave — invariants,
ordering, policies. Reference the global rules in
`docs/product/business-rules.md` rather than restating them, and add only what
is specific to this Story.

BR-1. <rule statement> (per <source>)

## Acceptance Criteria

The Story's criteria restated with their stable ids, so downstream artifacts can
map to them. Do not add a criterion the Story does not contain; if the Story is
missing one, raise it in Open Decisions.

| AC id | Criterion | Observable outcome |
|---|---|---|

## Validation Rules

Required fields, types, formats, lengths, allowed values, normalization, and the
invalid cases. State them concretely — never as "the framework default". Where a
rule depends on an unresolved Open Decision, say so instead of inventing a
value.

VR-1. <field> — <rule> (per <source>)

## Security Requirements

Authentication, authorization, credential handling, and data-exposure
restrictions. Every item cites
`docs/architecture/security-conventions.md` or an Open Decision — never
invented.

SR-1. <requirement> (per <source>)

## Error Handling

For each failure case: the trigger, the HTTP status, the error `code`, and what
the message may and may not reveal (per
`docs/architecture/api-conventions.md` AC-5 / AC-6).

| Case | Status | Code | Notes |
|---|---|---|---|

## Non-Functional Requirements

Only what applies to this Story, cited from
`docs/product/non-functional-requirements.md`. Do not invent a performance,
scale, or compliance target.

## Edge Cases

Derived from the requirements above — not brainstormed. Each traces to the
requirement it stresses.

EC-1. <edge case> — relates to FR-<n> / BR-<n>

## Affected Components

Reason in terms of the project layering
(`docs/architecture/module-map.md`). Name concrete files where they already
exist; otherwise name the layer and its responsibility.

| Layer | Component | Why it is affected |
|---|---|---|
| routes | `src/modules/<m>/<m>.routes.ts` | ... |
| controllers | `src/modules/<m>/<m>.controller.ts` | ... |
| services | `src/modules/<m>/<m>.service.ts` | ... |
| repositories | `src/modules/<m>/<m>.repository.ts` | ... |
| schemas | `src/modules/<m>/<m>.schemas.ts` | ... |
| persistence | `prisma/schema.prisma` + migration | ... |

## Out of Scope

Carried from the Story, plus anything this specification deliberately excludes.

## Open Decisions

Every unresolved decision that affects this Story, with its impact. Carry
forward every question the Story or the clarification report already flagged —
do not drop one because it was not independently rediscovered, and do not
propose a value, however hedged, for anything the registry lists as unresolved.

- OD-<id> — <question> — <what it blocks>

## Traceability

| AC id | Functional requirement(s) | Validation rule(s) | Security requirement(s) |
|---|---|---|---|

Every Acceptance Criterion has at least one mapped requirement. A criterion with
no mapping is a defect in this document: add the requirement if it is derivable,
or an explicit Open Decision if it is not — never leave the row blank.
```
