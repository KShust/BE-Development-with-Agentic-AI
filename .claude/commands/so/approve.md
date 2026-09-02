---
description: Record human approval for the current workflow human gate.
argument-hint: "[optional comment]"
---

Invoke the story-orchestrator Skill to record human approval of the current
human gate.

Optional approver comment:

$ARGUMENTS

Requirements:

- read docs/workflow/workflow-state.yaml; the current_stage MUST be a stage
  whose type is `human_gate` in docs/workflow/stage-map.yaml
  (HUMAN_SPEC_APPROVAL, HUMAN_PLAN_APPROVAL, HUMAN_PR_APPROVAL, READY_FOR_PR,
  COMPLETED). If it is not, refuse and report the current stage;
- confirm every artifact in the gate's `required_artifacts` exists, is current
  (not SUPERSEDED / ARCHIVED), and its recorded automated verdict is PASS with
  no blocking findings; if not, refuse and report what is missing;
- set pending_human_gate.status = APPROVED, decided_at (runtime), decided_by;
  store the comment;
- append a docs/workflow/history.jsonl event with verdict "HUMAN_APPROVED";
- **progress the approved artifacts' own `status:` to `APPROVED`** — every
  artifact the gate listed in `required_artifacts`, in its front matter. This is
  the moment `artifact-lifecycle.md` §1 describes: `APPROVED` means "passed its
  review gate (and human gate where one exists)", which becomes true here and
  nowhere else. It is a status progression recorded by the orchestrator, which is
  the one path `artifact-schema.md` permits, and it does **not** increment
  `version` — no content changed.
  Skipping it is not neutral: the orchestrator's input invariant requires
  `APPROVED` for any input gated by a review, so a specification left at `DRAFT`
  makes the next `/so:next` hold as `BLOCKED` against a gate that actually
  passed. An artifact nothing reviews (a decision registry, a clarification
  report) stays `DRAFT` and is not touched here;
- advance current_stage to the gate's `on_approve` target; clear
  pending_human_gate; set workflow status to IN_PROGRESS, or COMPLETED /
  ARCHIVED when entering those stages;
- do not invoke any stage Skill;
- do not create, push, or merge a Pull Request;
- finish with the Orchestration Result.