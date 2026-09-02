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

## Self-describing sections

**Traceability, Affected Components and Open Decisions are self-describing
sections.** They do not carry requirements of their own. Each one describes
either the rest of this document (Traceability, Affected Components) or the
current state of another authoritative artifact (Open Decisions → the decision
registry). Their correctness therefore depends on something that changes
underneath them.

Two consequences, and they are not optional:

1. **After any change to the requirements, re-derive all three from the final
   document** — do not patch them incrementally alongside the edit that caused
   the change. A requirement renumbered, split, merged, narrowed or deleted
   invalidates rows in Traceability, may add or remove a layer in Affected
   Components, and may change which decision blocks what. Re-reading the three
   sections against the finished text is the last step of every revision, not a
   step that happens while the text is still moving.
2. **A self-describing section never becomes a second copy of the state it
   describes.** Referencing an authoritative artifact means naming it and
   pointing at it. It does not mean restating its version, its item count, its
   ordering, its status, or where each of its entries came from. A copy of
   another artifact's state is stale the moment that artifact advances, and a
   specification that carries such a copy is guaranteed to disagree with the
   registry sooner or later, through no change of its own. Point; do not
   transcribe.

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

Reason in terms of the project layering (`docs/architecture/module-map.md`).

**Never invent a filename.** A concrete file path may appear in this table only
when one of these two holds, and the row must make clear which:

1. the file already exists in the repository tree — verified by looking, not by
   recalling what a project of this shape usually contains; or
2. a repository convention names it directly, so the path is prescribed rather
   than guessed (a naming pattern in `docs/architecture/module-map.md`, a path
   in `docs/workflow/artifact-paths.yaml`, a file a documented command emits).

Where neither holds — the file does not exist yet and no convention prescribes
its name — **name the layer and the responsibility instead**, and say what has
to become true for it to exist ("a shared domain-error type, owned by the
Story that first needs one"). A plausible-looking path is worse than an
unnamed responsibility: it reads as a decision that was made, and downstream
stages will build against it.

This is a ban on invented paths, not on real ones. A file that exists gets
named.

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

**The decision registry (`docs/decisions/{story_id}-open-decisions.md`) is the
source of truth for this Story's open decisions.** This section is a pointer
into it, scoped to what this specification cannot state without an answer — it
is not a summary of the registry and never a copy of it.

List **only the decision ids that block a requirement in this document**, and
for each one say **what it blocks here**: the requirement, validation rule,
security requirement or error case that cannot be stated until it is answered.
Read the registry to decide what belongs in the list; carry forward every
question the Story or the clarification report flagged that blocks something
here, and do not propose a value, however hedged, for anything the registry
lists as unresolved.

- OD-<id> — <what in this document it blocks, and how>

**Do not restate registry state.** The following belong to the registry and
must not be transcribed into this section or anywhere else in this
specification:

- how many decisions exist, how many are open, or how many are resolved;
- the registry's `version`;
- the stage, artifact or review at which a decision was raised;
- a decision's `status`, its ordering, or its full question text;
- any other field the registry owns.

Each of those is stale the moment the registry advances, and the registry
advances for reasons that have nothing to do with this document. A reader who
needs a count, a version, or an origin opens the registry. Naming the file once
and citing ids is the whole contract.

A decision in the registry that blocks nothing in this document is not listed
here; that is not a dropped question, because the registry still holds it.

## Traceability

| AC id | Functional requirement(s) | Validation rule(s) | Security requirement(s) |
|---|---|---|---|

Every Acceptance Criterion has at least one mapped requirement. A criterion with
no mapping is a defect in this document: add the requirement if it is derivable,
or an explicit Open Decision if it is not — never leave the row blank.
```
