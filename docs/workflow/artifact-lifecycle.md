# Status Vocabularies and the Stage Result Envelope

This file is the **single authoritative source** for the status values used
across the harness, and for the envelope a stage Skill returns.

Sections 1-3 define **three separate enums**. They describe different things and
MUST NOT be mixed or conflated. Section 4 defines the result envelope that
carries a verdict from a Skill to the orchestrator.

| Enum | Question it answers | Where it is stored |
|---|---|---|
| Artifact lifecycle status | "Is this document current?" | `status:` in each artifact's front matter (`artifact-schema.md`) |
| Review verdict | "What did this automated stage decide?" | `result.verdict` in the stage result envelope |
| Workflow status | "What state is the delivery workflow in?" | `status:` / `pending_human_gate.status` in `workflow-state.yaml` |
| Stage result envelope (§4) | "What did a stage Skill just return?" | the value a Skill returns to `story-orchestrator`; not persisted as-is |

---

## 1. Artifact lifecycle status

Applies to every story-level artifact (front-matter `status:` field).

| Value | Meaning |
|---|---|
| `DRAFT` | Produced by its owner Skill; not yet reviewed or approved. |
| `IN_REVIEW` | A downstream review stage is currently evaluating it. |
| `APPROVED` | Passed its review gate (and human gate where one exists). Safe to consume downstream. |
| `SUPERSEDED` | Not usable as a current input. Either a newer version exists (its `supersedes:` points here), or the artifact predates the stage that owns it — a pre-registry or hand-authored file that the owning stage must re-produce before anything consumes it. |
| `ARCHIVED` | Belongs to a delivery that has completed archive mode. Retained for history only. |

Rules:
- A revised artifact increments `version:` and sets `supersedes:` to the prior path/version. The prior revision becomes `SUPERSEDED`.
- Reviewers MUST check that every input artifact they consumed is the current (non-`SUPERSEDED`, non-`ARCHIVED`) version and that its `version:` matches what downstream artifacts recorded consuming.
- Stale input (a review or evidence artifact generated from a now-`SUPERSEDED` upstream) blocks progression until the dependent stage is re-run.

---

## 2. Review verdict

The only values an automated stage Skill may emit in `result.verdict`.

| Value | Meaning | Orchestrator action |
|---|---|---|
| `PASS` | Stage goal met. Zero blocking findings. May carry `non_blocking_findings`. | Advance to `stage-map.yaml` `next`. |
| `CHANGES_REQUIRED` | Correctable problem. The Skill sets `loop_back_stage` to a key defined under this stage's `loop_back` map. | Route to `loop_back_stage`. |
| `BLOCKED` | Stage cannot be evaluated: missing/stale mandatory input, unresolved blocking Open Decision, environment failure, artifact conflict. | Hold at current stage; surface `blocking_issues`; may require human decision. |
| `NOT_APPLICABLE` | Only for a stage marked `optional: true` whose `optional_when` condition is met and recorded. | Advance to `next`. |

Retired result values and their mapping (MUST NOT appear in any Skill):

| Retired | Canonical |
|---|---|
| `APPROVED` | `PASS` |
| `APPROVED_WITH_COMMENTS` | `PASS` with `non_blocking_findings` populated |
| `REJECTED` | `CHANGES_REQUIRED` (correctable) or `BLOCKED` (not evaluable) |
| `READY_FOR_PLANNING` | `PASS` |
| `READY_FOR_PLANNING_WITH_RISKS` | `PASS` with `non_blocking_findings` |
| `IMPLEMENTED_PENDING_VERIFICATION` | `PASS` |
| `PARTIALLY_IMPLEMENTED` | `CHANGES_REQUIRED` (`loop_back_stage: IMPLEMENTATION`, key `partial`) |
| `FAILED` | `CHANGES_REQUIRED` or `BLOCKED` |
| `READY_FOR_PR` (as a verdict) | `PASS` at `PR_PREPARATION` |
| `READY_FOR_PR_WITH_COMMENTS` | `PASS` with `non_blocking_findings` |
| `PROCEED_TO_*` | derive the next stage from `stage-map.yaml`; do not name it in the Skill |
| `RETURN_TO_*` | use `loop_back_stage` with a key from `stage-map.yaml` |

Note: `READY_FOR_PR` and `COMPLETED` and `ARCHIVED` are also **workflow stages**
(`stage-map.yaml`). They are not verdicts. The verdict at `PR_PREPARATION` is
`PASS`; the orchestrator then advances the *stage* to `READY_FOR_PR`.

---

## 3. Workflow status

Stored in `workflow-state.yaml` (`status:` and inside `pending_human_gate`).

| Value | Meaning |
|---|---|
| `NOT_STARTED` | Story activated; no stage has run. |
| `IN_PROGRESS` | An automated stage is the current stage and is runnable. |
| `WAITING_FOR_HUMAN` | Current stage is a `human_gate`; `pending_human_gate.status = PENDING`. |
| `BLOCKED` | Last stage returned `BLOCKED`, or a workflow invariant failed. |
| `COMPLETED` | Reached stage `COMPLETED` (human confirmed PR merged / delivery done). |
| `ARCHIVED` | Reached stage `ARCHIVED` via archive mode. |

`pending_human_gate.status` sub-enum: `PENDING`, `APPROVED`, `REJECTED`.

---

## 4. Finding severity

Every review stage classifies its findings with the same three values. **This
section defines what they mean; each Skill supplies the examples that fit its
own stage.** A Skill may not add a fourth level or redefine one of these.

| Severity | Meaning | Effect on the verdict |
|---|---|---|
| `Critical` | The reviewed thing must not proceed as it is: it would be unsafe, would ship something that must never ship, or rests on evidence that does not hold. Correcting it may require going back further than the stage that produced it. | Never `PASS`. |
| `Major` | A real defect that the owning stage can correct: something required is missing, wrong, or untraceable. The work is sound in shape but not acceptable yet. | Never `PASS`. |
| `Minor` | Worth fixing, blocks nothing: wording, local naming, a clearer structure, a non-load-bearing inconsistency. | `PASS`, carried in `non_blocking_findings`. |

Rules that hold for every stage:

- One `Critical` or `Major` finding means `verdict: CHANGES_REQUIRED` (or
  `BLOCKED` when the stage cannot be evaluated at all), never `PASS`.
- Severity describes **consequence, not confidence**. A defect you are unsure
  about is still classified by what it would cause if real; say the uncertainty
  in the finding text.
- Every finding names its location and what would resolve it, whatever its
  severity. A finding with no remedy is not a finding.
- Do not downgrade a finding because fixing it is inconvenient, or because the
  stage is late in the workflow.

---

## 5. Stage result envelope

The value an automated stage Skill returns to `story-orchestrator`. This section
is the **authoritative shape**; a Skill documents the values it can emit, never a
different set of fields.

```yaml
result:
  verdict: PASS | CHANGES_REQUIRED | BLOCKED | NOT_APPLICABLE
  stage: <canonical stage id from stage-map.yaml stage_order>
  story: <story id; must equal workflow-state.yaml.story>
  artifact_status: DRAFT | IN_REVIEW | APPROVED | SUPERSEDED | ARCHIVED
  artifacts: [<relative path>, ...]   # as produced, resolved from artifact-paths.yaml
  next_stage: <canonical stage id or null>   # advisory; the orchestrator derives
                                             # the real next stage from stage-map.yaml
  loop_back_stage: <canonical stage id or null>   # set only for CHANGES_REQUIRED
  loop_back_key: <key or null>        # the key under stages.<current>.loop_back
                                      # that names loop_back_stage; required
                                      # whenever loop_back_stage is set
  blocking_issues: []                 # non-empty only for BLOCKED
  non_blocking_findings: []
```

Field rules:

| Field | Rule |
|---|---|
| `verdict` | Only the four values in §2. `NOT_APPLICABLE` only where `stage-map.yaml` marks the stage `optional: true` and the Skill recorded the `optional_when` reason. |
| `stage` | The stage the Skill owns. A Skill never reports a stage it does not own. |
| `story` | Copied from `workflow-state.yaml`; a mismatch is an INCONSISTENT state. |
| `artifact_status` | The lifecycle status (§1) of the artifact(s) this run produced — not of its inputs. |
| `artifacts` | Plain relative paths. Empty only for `BLOCKED` or `NOT_APPLICABLE`. |
| `loop_back_stage` / `loop_back_key` | Both `null` unless `verdict: CHANGES_REQUIRED`; then both are set, and the key MUST exist under `stages.<current>.loop_back` in `stage-map.yaml`. A key the map does not define is rejected by the orchestrator. |
| `blocking_issues` | Strings naming the offending artifact or stage. Non-empty exactly when `verdict: BLOCKED`. |
| `non_blocking_findings` | Advisory findings that do not block; carried forward into `workflow-state.yaml`. |

Only `story-orchestrator` acts on this value: it validates the envelope, then
records the transition (`workflow-state.yaml` + one `history.jsonl` event).
A stage Skill never writes workflow state itself.
