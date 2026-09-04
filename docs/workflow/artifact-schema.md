# Artifact Front-Matter Schema

Authoritative schema for the YAML front matter of every **story-level Markdown
artifact** produced by a workflow Skill. Skills MUST emit this block. Reviewers
MUST validate it.

## Required block

```yaml
---
artifact_type: <canonical-artifact-type>   # a key from docs/workflow/artifact-paths.yaml
story: US-001
version: 1                                  # integer, starts at 1, +1 per revision
status: DRAFT                               # artifact lifecycle status (artifact-lifecycle.md §1)
created_at: <ISO-8601 timestamp, runtime>   # never hard-coded
updated_at: <ISO-8601 timestamp, runtime>
produced_by: <skill-name>                   # the owning Skill from artifact-paths.yaml
inputs:                                     # every artifact this one consumed
  - path: <relative-path>
    version: <integer or null>
supersedes: null                            # or the relative path of the prior version
---
```

## Field rules

| Field | Rule |
|---|---|
| `artifact_type` | Must match a registry key in `artifact-paths.yaml`. |
| `story` | Canonical Story id. Must equal `workflow-state.yaml.story`. |
| `version` | `1` on first creation. A re-run that changes content increments it. |
| `status` | One of `DRAFT, IN_REVIEW, APPROVED, SUPERSEDED, ARCHIVED`. New artifacts start `DRAFT`. A review stage may set an input's `status` progression only through the orchestrator-recorded result; Skills do not silently flip other artifacts' status. |
| `created_at` / `updated_at` | Generated at runtime from the system clock. Example dates in Skill docs are illustrative only and must be labelled as such. |
| `produced_by` | The Skill named as `owner` of this `artifact_type` in `artifact-paths.yaml`. |
| `inputs[]` | One entry per consumed artifact, with the version that was read. Enables stale-input detection. May optionally carry `assessed_version` + `assessment` — see the Staleness contract below. |
| `supersedes` | `null` unless this revision replaces an earlier one; then the earlier file's path. The earlier file's `status` becomes `SUPERSEDED`. |

## Staleness contract

- A reviewer that consumes artifact X at `version: N` records `{path: X, version: N}` in its own `inputs`.
- If X is later revised to `version: N+1` (old becomes `SUPERSEDED`), any downstream artifact still recording `version: N` is **presumed stale**.
- A **stale** review or evidence artifact **blocks progression** (`verdict: BLOCKED`) until the dependent stage re-runs against the current version.

### When the re-run is still ahead

A loop-back revises an upstream artifact, and every downstream artifact that
consumed it goes stale in the same instant. That is not a defect to repair — it
is what a loop-back *is*, and the workflow is already on its way back to those
stages. Neither remedy is reachable from inside the turn that creates the
staleness: `story-orchestrator` runs at most one stage per invocation, and no
Skill may write an artifact another Skill owns.

So the presumption's severity depends on where the stale artifact's owning stage
sits relative to `current_stage` in `stage_order`:

- **At or after `current_stage`** — the workflow reaches that stage before
  anything consumes its output again. The staleness is pending, not unnoticed.
  `scripts/validate-harness.py` reports it as a **warning**, which stays visible
  on every run until the re-run or a rebuttal clears it.
- **Before `current_stage`** — the workflow has moved past the stage that should
  have re-run, and a stale artifact is now feeding later stages. That is the case
  this contract exists for, and it is an **error**.

The distinction is about *timing*, never about *substance*: a pending artifact is
as stale as any other, and the stage that owns it still owes the re-run or the
rebuttal below. What the distinction avoids is failing every loop-back at the
moment it succeeds, with no repair available to the turn being failed — the same
reasoning that makes `history.jsonl` integrity a warning rather than an error.

### When the edge runs backwards

Both readings above assume every edge points forward: an artifact consumes
something an earlier stage produced. That holds until a stage consumes a
**review of itself**. A design revised through a loop-back records the review it
addressed, so `api_design` (owned by `API_DESIGN`) cites `design_review` (owned
by `DESIGN_REVIEW`, a *later* stage). When that review revises, the design goes
stale, and the forward reading grades it an error because `API_DESIGN` sits
before `current_stage`.

That grade has no reachable remedy, which is what separates it from every other
error this contract raises:

- **Re-running the design** happens only through another loop-back. Five
  stages route one to `API_DESIGN` — `DESIGN_REVIEW`, `IMPACT_ANALYSIS`,
  `TEST_WRITING`, `IMPLEMENTATION` and `RECONCILIATION` — and every one of them
  requires a `CHANGES_REQUIRED` verdict — which
  would have re-run the design anyway and cleared the edge as a side effect. So
  the only backward-edge staleness that survives is the kind a `PASS` produces,
  and a `PASS` is precisely the review saying there is nothing here to consume.
- **The rebuttal below** may be recorded only by the Skill that owns the
  downstream artifact, during a run of its own stage — which is the same
  unreachable re-run.

Clearing it would therefore take a fabricated review verdict or a rebuttal
written by a Skill that does not own the file. Both are prohibited, so the error
would stand permanently with falsifying the record as its only exit.

**A stale input whose upstream is owned by a stage that comes after the consuming
artifact's own stage is a warning.** It stays visible on every run. The forward
grading is untouched: an artifact genuinely built from a superseded upstream and
now feeding later stages is still an error.

### Rebutting the presumption

The presumption exists because a version mismatch usually means the downstream
artifact was written from information that has since changed. It is not always
true: an upstream revision may touch only parts the downstream artifact does not
consume, and forcing a downstream re-run then bumps a version for no change in
content — which bumps the next artifact down, and so on. That cascade is
churn, and each hop through it is another chance for a review to find a fresh
mismatch, so it does not converge on its own.

**A downstream artifact is stale only when the upstream revision changed
something that artifact actually consumes.** Where it did not, the downstream
stage may record that judgement in its own front matter instead of re-running,
by adding two optional fields to the `inputs[]` entry:

```yaml
inputs:
  - path: docs/decisions/US-001-open-decisions.md
    version: 5             # the version this artifact was written from
    assessed_version: 6    # a later upstream version, read and judged not to affect this artifact
    assessment: >          # required whenever assessed_version is present
      v6 adds OD-US-001-13, which affects DB_DESIGN only. This Specification
      states no requirement, validation rule or error case that depends on it,
      and no section of it changes.
```

Rules for the rebuttal:

| Rule | |
|---|---|
| Default | Absent `assessed_version`, a mismatch is stale. Silence is never a rebuttal. |
| `assessed_version` | Must equal the upstream's **current** `version`, and be greater than `version`. A rebuttal against a version that is itself no longer current is void, and the artifact is stale again. |
| `assessment` | Required with `assessed_version`, and never empty or generic. It names **what the upstream revision changed** and **why this artifact does not consume it**. "No relevant change" is not an assessment. |
| Who may record it | Only the Skill that owns the downstream artifact, during a recorded run of its own stage. It is a claim made by that stage, not a note anyone may add. |
| Scope | Never a way to defer a change the artifact does consume. If any consumed part moved, the artifact is stale — re-run the stage. |
| Review | The claim is reviewable. The next review stage checks the assessment against the upstream diff; an assessment that does not hold is a finding against the downstream artifact, and the artifact is stale after all. |

`version` still records what was actually read. `assessed_version` records what
was examined and found not to matter. Keeping them separate is what makes the
judgement auditable later: a reader can see both the version the content came
from and the version someone stood behind.

## OpenAPI YAML exception

`openapi` (`docs/designs/api/{story_id}-openapi.yaml`) is a YAML contract, not
Markdown. It carries traceability via top-level extension keys instead of a
front-matter block:

```yaml
info:
  version: "1"            # mirrors the paired api_design artifact version
x-story: US-001
x-source-specification: docs/specifications/US-001-spec.md
x-source-specification-version: 1
x-produced-by: openapi-designer
```

The paired `api_design` Markdown artifact carries the full front-matter block and
is the traceability anchor for the contract.

## Story artifact exception

The `story` artifact (`docs/stories/{story_id}-{slug}.md`) is authored by a human
or synced from a GitHub Issue by `backlog-sync` — it is an **input** to the
workflow, not a stage output. It does **not** carry the produced-artifact block
above (no `produced_by`, `inputs`, or `version` progression). Its front matter is:

```yaml
---
id: US-001
epic: EPIC-1
title: Customer Registration
slug: register-customer
priority: HIGH
source:
  type: github_issue | local_only
  repository: <owner/repo or null>
  issue_number: <int or null>
  issue_url: <string or null>
  last_synced_at: <ISO-8601 or null>
---
```

Story lifecycle status lives in `docs/catalog/stories.yaml`, never in this file.

## Non-Markdown / generated artifacts

`workflow_history` (JSONL), `story_catalog` (YAML), and generated runtime files
are governed by their own schemas (`state-schema.md`, and the catalog header) and
do not use this front matter.
