---
name: backlog-sync
description: >
  Resolves the active User Story into local repository artifacts and owns the
  story catalog. Runs in one of two modes: local-only, where docs/stories/ files
  are authoritative and it confirms and activates them; or GitHub-synced, where
  it pulls User Stories from Issues, preserves Issue identity, and detects
  local/remote conflicts without silently overwriting locally modified
  requirements. Owns the BACKLOG_SYNC stage. Use on /so:start, on an explicit
  backlog sync, or on a RECONCILIATION story_source_conflict loop-back.
---

# Purpose

Own the **BACKLOG_SYNC** stage. Bring the active User Story (and, on demand, the
wider backlog) from the configured GitHub source into local artifacts so the
rest of the workflow has an authoritative local Story.

This Skill also **owns `docs/catalog/stories.yaml`** (registry key
`story_catalog`) and may update `docs/workflow/active-story.yaml` when activating
a Story on the orchestrator's behalf.

# When to use

- An explicit backlog-sync request.
- Story activation through `/so:start`.
- A `RECONCILIATION` `story_source_conflict` loop-back.

# When NOT to use

- On an ordinary `/so:next`. `stage-map.yaml` gives this stage a `run_policy`;
  it is not part of every `continue`.
- To create a Story that exists in no source. Never invent a repository, an
  Issue number, or a requirement.
- To change a Story's lifecycle `state` outside activation. `story-orchestrator`
  sets `COMPLETED` and `ARCHIVED`.
- To edit a Story so it matches what the code does. That divergence is a
  `reconciliation-reviewer` finding, not a sync.

# Canonical sources

- Workflow / stage: `docs/workflow/stage-map.yaml` (`BACKLOG_SYNC`).
- Artifact paths: `docs/workflow/artifact-paths.yaml` — resolve `story`,
  `story_catalog`. Do not hard-code paths; examples below are illustrative.
- State schema: `docs/workflow/state-schema.md`.
- Result vocabulary: `docs/workflow/artifact-lifecycle.md`.

# Run policy

Per `stage-map.yaml`, this Skill does **not** run on every `continue`. Run only:

- on an explicit backlog-sync request;
- during Story activation (`/so:start`);
- on a `RECONCILIATION` `story_source_conflict` loop-back.

# Inputs

- Existing `docs/stories/*.md` and `docs/catalog/stories.yaml`.
- `docs/workflow/active-story.yaml` — its `source.type` selects the mode.
- GitHub MCP (read mode) and the configured server, **only in GitHub-synced
  mode**.

Determine the mode from state, never from memory: read
`active-story.yaml.source` and check whether a GitHub MCP server is configured.
Do not hard-code which mode this project is in — that changes without this file
changing (the backlog source is an Open Decision in `AGENTS.md`).

**Local-only mode** — no `repository` in `active-story.yaml.source` and no
GitHub MCP server configured:

- treat local `docs/stories/*.md` as authoritative;
- keep `source.type` / `repository` / `issue_number` / `issue_url` as recorded
  (or `null`);
- return `PASS` with a `non_blocking_findings` note that no remote source is
  configured.

Never fabricate a repository name or issue number.

# Preconditions

- The run is allowed by the `run_policy` for `BACKLOG_SYNC` in
  `stage-map.yaml`: an explicit sync, a Story activation, or a
  `story_source_conflict` loop-back.
- `docs/catalog/stories.yaml` and `docs/workflow/active-story.yaml` exist and
  parse.
- If a GitHub source is configured, the MCP server is reachable. If it is not,
  do not fail: fall back to the local-only path in Source-of-truth policy and
  say so in `non_blocking_findings`.

# Responsibilities

1. Identify GitHub Issues that represent User Stories (by label / project /
   naming convention configured for the repository).
2. For the target Story (active Story, or each backlog Story on a full sync):
   - resolve its canonical id (`US-XXX`) and `slug`;
   - create or update the local `story` artifact at the registry path;
   - preserve GitHub Issue identity: number, URL, and last-synced marker;
   - keep the Story body faithful to the Issue — do not reinterpret or add
     requirements.
3. Maintain `docs/catalog/stories.yaml`:
   - one entry per Story with `id`, `slug`, `path`, `epic`, `title`, `state`,
     and `source` block;
   - `state` ∈ `BACKLOG | READY | IN_PROGRESS | COMPLETED | ARCHIVED`;
   - update `state` only for legitimate transitions (a human or the
     orchestrator drives `IN_PROGRESS` / `COMPLETED` / `ARCHIVED`; this Skill
     may set `BACKLOG` → `READY` when an Issue becomes ready).
4. On activation delegation from the orchestrator: also write
   `docs/workflow/active-story.yaml` per `state-schema.md`.

# Source-of-truth policy

- **Before a Story is `IN_PROGRESS`**: the GitHub Issue is authoritative for
  the Story title, description, and Acceptance Criteria. Overwrite the local
  Story to match, preserving local formatting only.
- **After a Story is `IN_PROGRESS`**: the local approved Specification and
  downstream artifacts are authoritative for delivery detail. A change to the
  Issue's requirements requires **explicit resynchronization** and invalidates
  dependent artifacts (Specification onward) — report it, do not auto-apply.
- Local edits to an `IN_PROGRESS` Story that diverge from the Issue are a
  **conflict**.

# Conflict handling

When the local Story and the GitHub Issue materially disagree and the Story is
`IN_PROGRESS` (or no source-of-truth rule resolves it):

1. Do not overwrite either side.
2. Record the differing fields (title / intent / business value / each
   Acceptance Criterion / Definition of Done / labels).
3. Classify each difference: `formatting_only`, `approved_clarification`,
   `unapproved_requirement_change`, `missing_sync`, `remote_drift`.
4. Return `verdict: BLOCKED` with `blocking_issues` naming the conflicting
   fields; recommend human resolution.

# Output

- `story` artifact(s) under `docs/stories/` with the **story front matter**
  defined in `docs/workflow/artifact-schema.md` ("Story artifact exception"):
  `id`, `epic`, `title`, `slug`, `priority`, and a `source` block:
  ```yaml
  source:
    type: github_issue | local_only
    repository: <owner/repo or null>
    issue_number: <int or null>
    issue_url: <string or null>
    last_synced_at: <ISO-8601 or null>
  ```
  The Story is a workflow **input**, not a produced artifact — it does NOT carry
  `produced_by` / `inputs` / `version`. It keeps NO mutable lifecycle `status`
  field — that lives in the catalog.
- Updated `docs/catalog/stories.yaml`.
- Optionally updated `docs/workflow/active-story.yaml` (activation only).

# Prohibited

- Do not modify requirements or Acceptance Criteria beyond faithful copying.
- Do not resolve Open Decisions.
- Do not write `docs/workflow/workflow-state.yaml` (orchestrator only).
- Do not create branches, commits, or Pull Requests.
- Do not perform write operations on GitHub Issues unless explicitly approved
  by a human for a specific operation.

# Validation Checklist

Before returning the result envelope, confirm each of these:

- Every Story file written parses, and its front matter matches
  `artifact-schema.md`.
- `story_catalog` and `active-story.yaml` agree on id, slug, path, and source
  for every Story touched, and exactly one Story is active.
- No local requirement text was overwritten without a recorded conflict.
- Source identity was carried through or genuinely re-read, never invented.


# Result Envelope

Return exactly this (see `docs/workflow/artifact-lifecycle.md`); the
story-orchestrator records the transition — this Skill does not update
`workflow-state.yaml`:

```yaml
result:
  verdict: PASS | BLOCKED
  stage: BACKLOG_SYNC
  story: <StoryId>
  artifact_status: DRAFT | APPROVED
  artifacts:
    - docs/stories/<StoryId>-<slug>.md
    - docs/catalog/stories.yaml
  next_stage: CLARIFICATION
  loop_back_stage: null
  blocking_issues: []
  non_blocking_findings: []
```

- `PASS` — Story synced (or local source confirmed); catalog updated.
- `BLOCKED` — unresolved source-of-truth conflict; needs a human. `BACKLOG_SYNC`
  has no `loop_back` map; conflicts are always `BLOCKED`, never
  `CHANGES_REQUIRED`.
