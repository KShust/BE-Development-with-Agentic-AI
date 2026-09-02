---
name: spec-writer
description: >
  Creates a complete, implementation-ready Specification from a clarified User
  Story, and is also the only Skill that revises one — a SPEC_REVIEW loop-back
  or a rejected human gate comes back here, never to the reviewer. Owns the
  SPECIFICATION stage.
---

# Purpose

Own the **SPECIFICATION** stage. Produce the Specification that becomes the
primary source of truth for design, planning, testing, and implementation.

# When to use

- The orchestrator routed the workflow to `SPECIFICATION`, whether as a first
  pass or as a revision through a loop-back.

# When NOT to use

- Before `CLARIFICATION` produced `clarification_report` and `open_decisions`.
- To design the HTTP contract or the persistence model — those are
  `openapi-designer` and `db-designer`, after the specification is approved.
- To review this Specification. `spec-verifier` owns `SPEC_REVIEW`, and a review
  by its own author is not independent.
- To resolve an Open Decision by choosing an answer.

# Canonical sources

- Workflow / stage: `docs/workflow/stage-map.yaml` (`SPECIFICATION`).
- Artifact paths: `docs/workflow/artifact-paths.yaml` — **authoritative**.
  Resolve `story`, `clarification_report`, `open_decisions`, `specification`.
- Front matter: `docs/workflow/artifact-schema.md`.
- Result vocabulary: `docs/workflow/artifact-lifecycle.md`.

# Inputs (registry keys)

- `story`
- `clarification_report`  (required — consume it; it defines what this spec must cover)
- `open_decisions`
- `docs/product/product-vision.md`, `docs/product/business-rules.md`,
  `docs/product/business-glossary.md`,
  `docs/product/non-functional-requirements.md`
- `AGENTS.md`

# Preconditions

- `clarification_report` and `open_decisions` exist (`CLARIFICATION` completed).
- If unresolved Open Decisions exist: do **not** guess answers. Record the ones
  that block a requirement in the Specification's "Open Decisions" section, by
  id, with what each blocks — under the contract that section carries in
  `references/spec-template.md`: a pointer into the registry, never a copy of
  it. The decisions are resolved at `HUMAN_SPEC_APPROVAL`.

# Non-negotiable constraints

Check the draft against all of these before writing the file. They are what make
the output trustworthy.

1. **Every requirement cites a source.** Before writing any sentence into
   Functional Requirements, Business Rules, Validation Rules, or Security
   Requirements, be able to point at where it came from: the Story text, an
   Acceptance Criterion, the clarification report, or a project document. If you
   cannot, it is not a requirement — it belongs in Open Decisions, phrased as a
   question. This holds for small "obviously fine" details (a status code,
   whether an error names the failing field) unless a project convention already
   settles it.
2. **A hedged guess is still an invention.** Proposing a concrete value "as a
   suggestion, not a mandate" for something `AGENTS.md` lists as an Open
   Decision is exactly the failure this stage exists to prevent. No proposed
   default.
3. **Do not expand scope.** Do not introduce Acceptance Criteria beyond the
   Story, even as recommended additions. A real gap becomes an Open Decision
   about scope, not new scope.
4. **Edge cases and validation scenarios are derived, not brainstormed.** Each
   traces back to a requirement already written. An edge case that occurs to you
   only because "APIs usually handle X" is an Open Decision about scope.
5. **Every Acceptance Criterion appears in the traceability table**, mapped to at
   least one requirement. An unmapped criterion is a defect in your own draft:
   add the missing requirement if it is derivable, or an explicit Open Decision
   if it is not. Never leave the row blank.
6. **Carry forward every open question** the Story and the clarification report
   already flagged, even the ones you did not independently rediscover.

# Specification structure

Use `references/spec-template.md` — it carries the exact section order, the id
conventions (`FR-`, `BR-`, `VR-`, `SR-`, `EC-`), the citation format, and the
front-matter block.

Front matter per `docs/workflow/artifact-schema.md`
(`artifact_type: specification`), then the sections of the template, in its
order. **The template is the list — this file does not keep a second copy of it**,
because a copy drifts and a reader cannot tell which one is current. Open
`references/spec-template.md` and follow it.

Three of its sections are the ones most often dropped, so they are named here as
a reminder, not as a substitute for reading the template: **Business Rules**,
**Edge Cases**, **Affected Components**.

The template also states the rule for a section with nothing in it: say so
explicitly ("None identified beyond the acceptance criteria.") rather than
deleting the heading, so a reviewer can tell "checked, clean" from "not
checked".

# Output

- `specification` (`docs/specifications/{story_id}-spec.md`), `status: DRAFT`,
  following `references/spec-template.md`.

## Revising an existing Specification

A Specification may already exist at the registry path. Usually that is a
loop-back — `SPEC_REVIEW` (`changes_required`) and `HUMAN_SPEC_APPROVAL`
(`on_reject`) both route back here — but it can also be a migrated or
hand-authored file that no recorded run of this stage produced. **The trigger is
that the file exists, not how this stage was reached**: check the path before
writing, and if something is there, revise it rather than replace it. The
mechanics are the Re-entry rule in `docs/workflow/stage-map.yaml`. Specific to
this stage:

- Every finding in the paired `specification_review` is addressed, or explicitly
  answered, in the revision.
- If the prior Specification predates the current `clarification_report` and
  `open_decisions` — which is always true of one this stage never produced —
  treat it as prior work only: those inputs, not the prior Specification, are
  authoritative. Its `status` being `DRAFT` is not evidence that it is current.
- Report in chat what changed between versions and why.

# Validation Checklist

Before returning the result envelope, confirm each of these:

- Every Acceptance Criterion maps to at least one requirement, and every
  requirement traces to the Story or to a resolved Open Decision.
- No requirement invents an endpoint, field, business rule, or security policy
  that no input artifact contains.
- Every unresolved Open Decision that blocks something in this document appears,
  named by id, with what it blocks here. The registry
  (`docs/decisions/{story_id}-open-decisions.md`) stays the source of truth: no
  count, version, status, origin stage or ordering is transcribed into the
  Specification. See the Open Decisions section of
  `references/spec-template.md`.
- No `TODO` / `TBD` / `FIXME` / `???` remains outside the Open Decisions section.
- Every section of `references/spec-template.md` is present.
- On a revision: no requirement the review left unchallenged was dropped.
- **Every behavior names the layer that owns it, and no component is invented.**
  For each behavior the Specification states, name the responsible layer from
  `docs/architecture/module-map.md`. Before writing any concrete file path,
  check the repository conventions for a *deferred assignment* — a component
  the conventions say does not exist yet and will be "created by the Story that
  first needs it" (the `src/lib/` row of `docs/architecture/module-map.md`, and
  `docs/architecture/architecture.md` AD-6 for `src/lib/errors.ts`). Where the
  file does not exist and no convention prescribes its name, record the layer
  and the responsibility. A component is never named because it seems like the
  logical place for the behavior to live; it is named because the tree or a
  convention already puts it there.
- **The three self-describing sections were re-derived after the last edit.**
  Once the final wording of the requirements is settled — after the last
  change, not alongside it — re-derive `Traceability` from the finished
  requirement text, re-check `Affected Components` against the finished
  behaviors and the repository tree, and re-check `Open Decisions` against the
  current registry. Each is a fresh derivation from the final document, not an
  inspection of what the previous revision said. This is the last action before
  the result envelope; an edit made after it restarts it.


# Result Envelope

Return exactly this; the story-orchestrator records the transition:

```yaml
result:
  verdict: PASS | CHANGES_REQUIRED | BLOCKED
  stage: SPECIFICATION
  story: <StoryId>
  artifact_status: DRAFT
  artifacts:
    - docs/specifications/<StoryId>-spec.md
  next_stage: SPEC_REVIEW
  loop_back_stage: null            # or CLARIFICATION
  loop_back_key: null              # or new_open_decision
  blocking_issues: []
  non_blocking_findings: []
```

- `PASS` — all Acceptance Criteria represented; validation, security, error
  handling, and traceability sections complete; the Open Decisions that block a
  requirement here listed by id with what they block.
- `CHANGES_REQUIRED` with `loop_back_stage: CLARIFICATION`, `loop_back_key:
  new_open_decision` — writing the Specification surfaced a question the
  decision registry does not hold. `open_decisions` is owned by `us-clarifier`
  (`docs/workflow/artifact-paths.yaml`) and this Skill must not write it, so the
  registry is repaired by re-running `CLARIFICATION`, not by editing the file
  out of band. Name the question in `blocking_issues`, phrased as a question and
  with the requirement it blocks. Do not invent the id, and do not answer it.
- `BLOCKED` — `clarification_report` missing, or an Open Decision makes a
  mandatory requirement impossible to state even as a documented gap.

# Prohibited

- Do not invent security or business behavior.
- Do not resolve Open Decisions.
- Do not create designs, tests, or code.
- Do not update workflow state.
