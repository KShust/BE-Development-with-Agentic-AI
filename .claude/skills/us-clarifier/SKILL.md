---
name: us-clarifier
description: Clarifies a User Story, identifies ambiguities, missing requirements, and Open Decisions before specification writing. Owns the CLARIFICATION stage.
---

# Purpose

Own the **CLARIFICATION** stage. Analyze the active User Story and prepare it for
Specification creation by removing ambiguity and surfacing every decision that a
human must make.

# When to use

- The orchestrator routed the workflow to `CLARIFICATION`.
- A Story was re-activated and its clarification artifacts need revising.

# When NOT to use

- To write the Specification — that is `spec-writer` at `SPECIFICATION`.
- To answer an Open Decision. This Skill surfaces decisions; a human resolves
  them at `HUMAN_SPEC_APPROVAL`.
- To review a Specification — that is `spec-verifier`.
- To edit the Story text. `backlog-sync` owns the `story` artifact.

# Canonical sources

- Workflow / stage: `docs/workflow/stage-map.yaml` (`CLARIFICATION`).
- Artifact paths: `docs/workflow/artifact-paths.yaml` — **authoritative**.
  Resolve `story`, `clarification_report`, `open_decisions`. Paths shown below
  are illustrative.
- Front matter: `docs/workflow/artifact-schema.md`.
- Result vocabulary: `docs/workflow/artifact-lifecycle.md`.

# Inputs (registry keys)

- `story`
- `docs/workflow/active-story.yaml` (to confirm the active Story id)
- `docs/product/product-vision.md`, `docs/product/personas.md`,
  `docs/product/business-rules.md`, `docs/product/business-glossary.md`
- `AGENTS.md`

Load only the product context needed for this Story.

# Preconditions

- `story` exists at its registry path, parses, and carries Acceptance Criteria.
- It is the Story named in `docs/workflow/active-story.yaml`.
- If `clarification_report` or `open_decisions` already exist for this Story,
  this run is a revision: see "Re-running on an existing report".

# Responsibilities

Analyze: business intent, actor, business value, acceptance criteria, security
expectations, validation expectations, dependencies, assumptions.

Identify: ambiguities, contradictions, missing acceptance criteria, missing
validation rules, missing security requirements, missing non-functional
expectations.

# Open Decision detection

When information cannot be reliably derived from the Story or product docs, do
**not** invent a requirement. Record an Open Decision instead. Typical areas:
uniqueness rules, password policy, authorization rules, validation constraints,
duplicate handling, error handling, account state.

# Outputs

Both artifacts carry front matter per `docs/workflow/artifact-schema.md`.

- `open_decisions` (`docs/decisions/{story_id}-open-decisions.md`,
  `artifact_type: open_decisions`): one entry per decision with
  `id`, `question`, `context`, `affects` (stages/areas), `status: OPEN`,
  `options` (if known), `recommended` (optional, non-binding).
- `clarification_report` (`docs/evidence/{story_id}-clarification-report.md`,
  `artifact_type: clarification_report`): scope understanding, ambiguities
  found, contradictions, a checklist of what the Specification must cover, and a
  reference to every Open Decision. This report is a required **input** to
  `spec-writer`.

Do not write a Specification.

## Re-running on an existing report

`CLARIFICATION` is not a loop-back target, but it is re-run on Story
re-activation, so both artifacts may already exist. The mechanics are the
Re-entry rule in `docs/workflow/stage-map.yaml`. Specific to this stage:

- Keep every still-unanswered Open Decision, with its `id` unchanged, so
  downstream references stay valid.
- Mark a decision resolved only when an approved artifact or a recorded human
  decision answers it, and name that source in the entry.

# Validation Checklist

Before returning the result envelope, confirm each of these:

- Every ambiguity found is either answered from an existing artifact or raised
  as an Open Decision with an id.
- No Open Decision carries an answer this Skill chose.
- Every Open Decision names the stages or areas it affects.
- The report checklist covers every Acceptance Criterion in the Story.
- On a re-run: no previously raised Open Decision disappeared, and no id changed.


# Result Envelope

Return exactly this; the story-orchestrator records the transition (this Skill
does not update `workflow-state.yaml`):

```yaml
result:
  verdict: PASS | BLOCKED
  stage: CLARIFICATION
  story: <StoryId>
  artifact_status: DRAFT
  artifacts:
    - docs/decisions/<StoryId>-open-decisions.md
    - docs/evidence/<StoryId>-clarification-report.md
  next_stage: SPECIFICATION
  loop_back_stage: null
  blocking_issues: []
  non_blocking_findings: []
```

- `PASS` — scope is understood; ambiguities and Open Decisions are documented;
  the clarification report exists. Open Decisions may still be `OPEN`: they are
  resolved at `HUMAN_SPEC_APPROVAL`, not here.
- `BLOCKED` — the Story is missing or unintelligible, or `active-story.yaml`
  and `workflow-state.yaml` disagree.

# Prohibited

- Do not invent requirements, security rules, or business rules.
- Do not resolve Open Decisions.
- Do not write specifications, designs, or code.
- Do not update workflow state.
