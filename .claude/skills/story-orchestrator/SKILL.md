---
name: story-orchestrator
description: >
  Coordinates the artifact-driven delivery workflow for the active User Story.
  Reads workflow state, validates stage invariants, selects exactly one next
  workflow Skill, evaluates its result envelope, records the state transition,
  and stops at every human gate. Supports start, continue, status, and archive
  modes. Use when starting, resuming, inspecting, or archiving a Story delivery
  flow.
argument-hint: <start|continue|status|archive> [StoryId]
---

# Purpose

Coordinate the end-to-end story-delivery workflow for one active User Story.

The Orchestrator is a **state-machine coordinator**. It answers:

- which Story is active;
- which workflow stage is current;
- whether the current stage is complete;
- what the next permitted transition is;
- which Skill owns that transition;
- whether a review requires a loop-back;
- whether a human gate blocks progression;
- whether the Story is ready for archival.

The Orchestrator does not perform stage work (clarification, design, planning,
implementation, verification, security review, reconciliation, PR preparation).
It routes to the responsible Skill and records the outcome.

---

# Canonical Sources (READ, never duplicate)

| Concern | Authoritative file | Orchestrator use |
|---|---|---|
| Workflow, stage ids, ownership, transitions, loop-backs, human gates | `docs/workflow/stage-map.yaml` | the ONLY source of stage order and routing |
| Artifact locations + owners | `docs/workflow/artifact-paths.yaml` | resolve every artifact path from a registry key |
| Status vocabularies | `docs/workflow/artifact-lifecycle.md` | interpret verdicts, artifact status, workflow status |
| Workflow-state / active-story schema | `docs/workflow/state-schema.md` | shape of the two state files + `history.jsonl` |
| Artifact front matter | `docs/workflow/artifact-schema.md` | staleness / version checks |
| Project rules | `AGENTS.md` | stable behavioral constraints |

This Skill MUST NOT contain its own stage list, its own stage→skill map, or its
own artifact paths. If this document ever appears to disagree with
`stage-map.yaml` or `artifact-paths.yaml`, those files win — stop and report the
drift.

Mutable state:

- `docs/workflow/active-story.yaml` — identity of the active Story.
- `docs/workflow/workflow-state.yaml` — execution state. **Only this Skill writes it.**
- `docs/workflow/history.jsonl` — append-only transition log (registry key
  `workflow_history`). **Only this Skill appends to it.** There is no other
  workflow event log; never create `orchestrator-events.jsonl`.

---

# When to use

- Starting, resuming, inspecting, or archiving a Story delivery flow — normally
  through `/so:start`, `/so:next`, `/so:status`, or `/so:archive`.

# When NOT to use

- To do a stage's work. This Skill routes and records; it never produces a
  stage artifact.
- To record a human decision. `/so:approve` and `/so:reject` do that, and only a
  person issues them.
- To advance more than one stage, or to run `archive` without an explicit
  request.
- To resolve a blocked stage by editing the artifact that blocks it.

# Supported Modes

- `start` — activate one eligible Story and initialize state. Load `references/start-flow.md`.
- `continue` (default; also invoked as `/so:next`) — advance by at most one stage. Load `references/continue-flow.md`.
- `status` — read-only report. Load `references/status-flow.md`.
- `archive` — consolidate a COMPLETED Story. Load `references/archive-flow.md`.

Load only the reference file for the requested mode. If no mode is given, use
`continue`. Never infer `archive`; it always requires an explicit user request.

---

# Single-Step Rule

One `continue` invocation performs **at most one** stage transition:

1. resolve active Story and current stage;
2. validate workflow-level invariants;
3. either invoke the one responsible Skill, or (at a human gate) stop;
4. read the Skill's result envelope;
5. record exactly one transition (or hold);
6. stop with a concise Orchestration Result.

Do not run multiple stage Skills, do not recurse, do not run the workflow to
completion in one call.

---

# The Stage Result Envelope

The envelope's shape is defined in `docs/workflow/artifact-lifecycle.md` §5 and
is authoritative there. Do not restate it here. Read it, then validate the
returned value against it before acting: a Skill that returns a different shape
has not completed its stage, and is handled under Failure Handling.

Validate, in this order:

1. `stage` equals `current_stage`, and the Skill matches `stages.<current>.skill`.
2. `story` equals `workflow-state.yaml.story`.
3. `verdict` is one of the four values in `artifact-lifecycle.md` §2.
4. Every path in `artifacts` exists and resolves to a registry pattern in
   `artifact-paths.yaml` owned by that Skill.
5. For `CHANGES_REQUIRED`: both `loop_back_stage` and `loop_back_key` are set,
   and the key exists under `stages.<current>.loop_back` with that stage as its
   value.
6. For `BLOCKED`: `blocking_issues` is non-empty.

Routing:

- `PASS` → advance `current_stage` to `stages.<current>.next` from `stage-map.yaml`.
- `NOT_APPLICABLE` → allowed only where `stage-map.yaml` marks the stage
  `optional: true` and the Skill recorded the `optional_when` reason; then
  advance to `.next`.
- `CHANGES_REQUIRED` → the Skill's `loop_back_key` MUST be a key under
  `stages.<current>.loop_back`, and `loop_back_stage` MUST be the stage that key
  maps to. Route there; increment `attempt` if returning to a stage already
  attempted. Record the key in the `history.jsonl` event.
- `BLOCKED` → keep `current_stage`; set workflow `status: BLOCKED`; surface
  `blocking_issues`; recommend a human decision.

Never convert `CHANGES_REQUIRED` or `BLOCKED` into a successful transition.
Never manufacture a result the Skill did not return.
If the Skill produced no canonical output artifact for its stage, treat the
stage as failed (see Failure Handling) regardless of chat text.

---

# Human Gates

`stage-map.yaml` stages with `type: human_gate`
(`HUMAN_SPEC_APPROVAL`, `HUMAN_PLAN_APPROVAL`, `HUMAN_PR_APPROVAL`,
`READY_FOR_PR`, `COMPLETED`) are **not executable by a Skill**.

When `current_stage` is a human gate:

1. Do not invoke any Skill.
2. Set workflow `status: WAITING_FOR_HUMAN`.
3. Build `pending_human_gate` in `workflow-state.yaml` per `state-schema.md`:
   - `stage`, `status: PENDING`, `requested_at` (runtime timestamp);
   - `required_artifacts`: the gate's `required_artifacts` from `stage-map.yaml`,
     each resolved to `{type, path, version}` via `artifact-paths.yaml` +
     the artifact's front matter;
   - `automated_verdict`: the verdict of the review stage that fed this gate;
   - `blocking_findings`: that review's blocking findings (should be empty to
     reach the gate).
4. Report, verbatim and exact:
   - which artifacts require human review (paths + versions);
   - the current automated verdict;
   - any blocking findings;
   - the exact command to record approval: `/so:approve` (or `/so:reject`).
5. Stop.

The Orchestrator MUST NOT infer approval from a review Skill's `PASS`, from chat
history, or from a GitHub state. Only `/so:approve` / `/so:reject` (which write
`pending_human_gate.status` and `decided_by`/`decided_at`) move a gate.

On `/so:approve`: set `pending_human_gate.status: APPROVED`, append a
`history.jsonl` event (`skill: null`, `verdict: "HUMAN_APPROVED"`), advance
`current_stage` to the gate's `on_approve`, clear `pending_human_gate`, set
`status: IN_PROGRESS` (or `COMPLETED`/`ARCHIVED` when entering those stages).

On `/so:reject`: set `status: REJECTED`, record the human `comment`, append a
`history.jsonl` event (`verdict: "HUMAN_REJECTED"`), route to the gate's
`on_reject`.

Auto Mode never bypasses a human gate.

---

# Workflow-Level Invariants

Before invoking any automated stage Skill, verify:

- exactly one active Story exists (`active-story.yaml`), and
  `workflow-state.yaml.story` names the same Story;
- `workflow-state.yaml` parses and conforms to `state-schema.md`;
- `current_stage` is a member of `stage-map.yaml` `stage_order`;
- every registry key in `stages.<current>.inputs` resolves to an artifact that
  exists and whose `status` is `APPROVED` (for artifacts gated by a review) or
  `DRAFT`/`APPROVED` (for un-reviewed inputs), and is not `SUPERSEDED`/`ARCHIVED`;
- no downstream input records a superseded upstream version (staleness);
- no unresolved **blocking** Open Decision in `open_decisions` affects the next
  stage;
- no blocking `TODO`/`TBD`/`FIXME`/`???`/`unresolved` marker in an `APPROVED`
  input artifact;
- the routed Skill exists in the environment and matches
  `stages.<current>.skill`;
- MCP capabilities the stage depends on are available (else follow the Skill's
  fallback rules or hold).

The Orchestrator performs only workflow-level validation. Each Skill runs its
own detailed preconditions.

If an invariant fails: do not route; set `status: BLOCKED` or
`WAITING_FOR_HUMAN` as appropriate; report the specific failure; recommend the
earliest responsible stage or a human action.

---

# Skill Invocation

Before invoking `stages.<current>.skill`:

1. Confirm the Skill exists and equals the stage owner.
2. Pass: the active Story id; the current canonical stage; resolved paths for
   `stages.<current>.inputs` (from `artifact-paths.yaml`); an instruction to
   stay within its documented responsibility and to return the standard result
   envelope.
3. Do not paste full artifact bodies; let the Skill load its own context.
4. Invoke no other stage Skill in the same `continue`.
5. Wait for completion. Read the result envelope and inspect the produced
   artifact(s) at their registry paths.
6. Determine exactly one transition.

`BACKLOG_SYNC` has `run_policy` in `stage-map.yaml`: do not run `backlog-sync`
on every `continue`. Run it on explicit sync, on activation, or on a
`RECONCILIATION` `story_source_conflict` loop-back.

---

# Recording a Transition

After a valid result, update `workflow-state.yaml` (per `state-schema.md`):

- `previous_stage` := old `current_stage`;
- `current_stage` := the derived next / loop-back / unchanged;
- `last_completed_stage` := old stage when verdict was `PASS`/`NOT_APPLICABLE`;
- `status` := `IN_PROGRESS` | `WAITING_FOR_HUMAN` | `BLOCKED` | `COMPLETED` | `ARCHIVED`;
- `attempt` := reset to 1 on forward move; +1 on loop-back to an attempted stage;
- `last_invoked_skill`, `last_result` (verdict/stage/recorded_at),
  `last_artifacts` ([{type, path, version}]);
- `pending_human_gate` per the Human Gates section;
- `blocking_issues`;
- `non_blocking_findings` := **recomputed, not appended to** — replay
  `history.jsonl` for this Story and keep every id whose latest event says
  `RAISED`, in the structured shape `state-schema.md` defines. A finding the
  Skill just closed leaves this list in the same write that records the closure;
  never carry the previous list forward untouched;
- `started_at` (first automated stage), `updated_at` (always),
  `completed_at` / `archived_at` when reaching those stages.

Then append one line to `docs/workflow/history.jsonl`:

```json
{"timestamp":"<runtime>","story":"US-001","from_stage":"<old>","to_stage":"<new>","skill":"<skill-or-null>","verdict":"<verdict>","artifacts":[],"attempt":<n>,"findings":[]}
```

`findings` carries the entries the Skill reported, validated before the append
(`state-schema.md`, Finding lifecycle): an `id` shaped `<STAGE>:<local-id>`, a
severity, a status, and a specific one-line summary. Reject an entry that is
prose without an id, that closes an id never raised, or that raises an id
already raised — and say which, rather than dropping it silently. The append is
the record; the derived set above is only a view of it.

## Progressing reviewed inputs to APPROVED

`DRAFT → APPROVED` for an artifact that has already cleared its review gate is
normally the work of `/so:approve`, which progresses the human gate's
`required_artifacts` (see `.claude/commands/so/approve.md`). `DESIGN_REVIEW` is
the one review stage in `stage-map.yaml` whose reviewed inputs have **no**
following human gate — it routes straight to `IMPACT_ANALYSIS` — so without this
step the design artifacts never reach `APPROVED` and the input invariant above
(`status` is `APPROVED` for artifacts gated by a review) can never be satisfied
from `IMPACT_ANALYSIS` onward.

So: **on a `PASS` (or `NOT_APPLICABLE`) verdict out of `DESIGN_REVIEW`, in the
same write that records the transition, progress the front-matter `status:` of
`api_design`, `openapi`, `database_design` and `entity_model` from `DRAFT` to
`APPROVED`** — skipping any whose owning stage (`API_DESIGN` / `DB_DESIGN`)
recorded `NOT_APPLICABLE`, and skipping `openapi` for its `status:` (the OpenAPI
YAML exception in `artifact-schema.md` gives it no such field; it is carried by
the paired `api_design`). Do **not** increment `version` or `updated_at` — no
content changed. This is the orchestrator-recorded status progression that
`artifact-schema.md` permits ("A review stage may set an input's `status`
progression only through the orchestrator-recorded result"), and the moment
`artifact-lifecycle.md` §1 describes for an artifact with a review gate and no
human gate. A `CHANGES_REQUIRED` verdict progresses nothing; the loop-back
owner re-runs and re-emits `DRAFT`.

## Migrating the free-text findings

`non_blocking_findings` was free text before this schema and only ever grew.
On the first transition after a Story's state still holds unstructured entries,
convert them once: give each `id: LEGACY:<n>` numbered in the order they appear,
`severity: MINOR`, `status: RAISED`, and the original prose as `summary`; record
them in that transition's `findings`; then write the derived set in the new
shape.

The conversion is mechanical and deliberately so — **it does not decide whether
any of them is still open.** Many are provably closed already, and reading a
prose entry to judge that is a human call, not a migration. So the entries land
as `RAISED`, and triaging them is a separate pass. Say in the run summary that
`LEGACY:*` ids are unreviewed, so the count is not mistaken for a real open set.

**Unless that pass already happened.** If `docs/decisions/{story_id}-findings-triage.md`
exists with `status: APPROVED`, apply it instead of the mechanical default: file
each finding it lists with the id, severity and status it gives, and drop every
free-text entry it does not list. Do not re-judge it — it is a recorded human
decision, and the mechanical path exists only for a Story that has not had one.
Cite the document in the run summary so the resulting counts can be checked
against it.

Why the triage is a human pass and not a smarter conversion: on US-001 three of
the forty-nine entries were misfiled in ways only execution revealed. One
recorded an obligation in the present tense as though it were done, and would
have been closed while the work was still outstanding; two described harness
gaps that a later branch had already fixed, and would have stayed open. No
reading of the prose distinguishes those cases from the rest.

Preserve all prior history. Never rewrite `history.jsonl`.

Do not claim a transition occurred unless the state file was successfully
written.

---

# Idempotency

Repeated invocation must be safe.

Before invoking a Skill, check whether the current stage already has a current
successful output artifact (exists, correct `story`, `status` not
`SUPERSEDED`/`ARCHIVED`, inputs not stale):

- if complete and valid → do not regenerate; validate and advance;
- if the output has an unresolved `CHANGES_REQUIRED`/`BLOCKED` record → follow
  that, do not overwrite;
- if a fresh attempt is required → increment `attempt`, preserve the prior
  artifact via `version`/`supersedes`, do not discard review history.

---

# Loop-Back Precedence

When a review returns `CHANGES_REQUIRED`, use its `loop_back_stage` (which must
be a key under `stages.<current>.loop_back` in `stage-map.yaml`).

When multiple findings imply different targets, select the **earliest**
responsible stage in `stage_order`, explain why later fixes are insufficient,
and preserve all findings. Do not pick the cheapest correction.

If a Skill names a `loop_back_stage` not present in the stage's `loop_back` map,
reject it: hold at the current stage as `BLOCKED` and require a human decision.

---

# Auto Mode Boundary

Auto Mode may: read artifacts and repo state; run non-destructive analysis;
run approved build/test commands; create Story-scoped documentation; apply
approved implementation changes via the routed Skill; invoke configured Skills;
collect diagnostics; write `workflow-state.yaml` and append `history.jsonl`.

Auto Mode must NOT: pass a human gate; resolve an Open Decision; accept security
risk; modify requirements; push to a protected branch; merge or create a Pull
Request; delete historical artifacts; archive an active Story; expose secrets;
run destructive database operations.

Deny-and-ask rules and hooks remain authoritative. The Orchestrator must not
disable, bypass, or reconfigure hooks.

---

# Tooling Strategy

Use built-in tools for local file and repo operations.

Use the built-in Read/Grep/Glob tools for project structure and symbol
inspection, and the Bash tool for the npm scripts named in `AGENTS.md` "Build
and Validation Commands" (that table is the single list; do not keep a shorter
one here) and `git` when a stage needs build, diagnostic, or test evidence. Prisma inspection goes through `npx prisma` commands; database
access stays read-only outside approved automated tests.

The editor's IDE integration, when connected, provides live diagnostics; treat
them as optional extra evidence, never as a precondition.

Use GitHub MCP only for reading source Issues, backlog synchronization, and
branch/PR metadata. Never use write-capable remote tools before the current
stage allows it.

---

# Failure Handling

- Routed Skill fails to run: do not advance; record the failed Skill and
  evidence; keep the stage; increment `attempt`; recommend retry or human help.
- Skill runs but produces no canonical output artifact at its registry path:
  treat as failed; keep state; report the missing path.
- Output artifact cannot be parsed / has no valid result envelope: treat as
  `BLOCKED`; preserve it; do not infer approval from prose.
- MCP unavailable: use the Skill's documented fallback, else hold without a
  state change.
- Hook blocks an action: respect it; do not bypass; report the guardrail; keep
  or return to the appropriate stage.
- Two active Stories / state files disagree: `status: BLOCKED`; report both
  identifiers; require human resolution; do not pick one.

---

# Observability

For every invocation, ensure a `history.jsonl` event is appended (or, for
`status` mode, none — it is read-only).

Do not log secrets: no tokens, authorization headers, passwords, password
hashes, database credentials, private keys, secret env values.

Tool-usage telemetry (`.claude/logs/tool-usage.jsonl`, git-ignored) is separate
and not managed by this Skill.

Telemetry is execution evidence, never requirement authority.

---

# Output Format

Every invocation finishes with a concise Orchestration Result:

```
Mode:                continue
Active Story:        US-001
Starting Stage:      SPEC_REVIEW
Routed Skill:        spec-verifier
Verdict:             PASS
Output Artifact(s):  docs/reviews/specifications/US-001-spec-review.md (v1)
Transition:          SPEC_REVIEW → HUMAN_SPEC_APPROVAL
Ending Stage:        HUMAN_SPEC_APPROVAL
Workflow Status:     WAITING_FOR_HUMAN
Human Gate:          HUMAN_SPEC_APPROVAL — review docs/specifications/US-001-spec.md (v1)
                     and docs/reviews/specifications/US-001-spec-review.md (v1);
                     automated verdict PASS; run /so:approve or /so:reject
Blocking Issues:     none
Recommended Command: /so:approve   (after human review)
```

Paths shown must be resolved from `artifact-paths.yaml`. Do not claim a
transition unless `workflow-state.yaml` was updated.

---

# Validation Checklist

This Skill does not return a result envelope — it *consumes* one and returns the
Orchestration Result above. Before returning that, confirm each of these:

- Exactly one stage transition was recorded.
- `workflow-state.yaml` and the appended `history.jsonl` event agree on story,
  stage, skill, verdict, and attempt.
- The result envelope was validated before the transition was recorded.
- Any loop-back key named by the Skill exists under that stage in
  `stage-map.yaml`.
- No human gate was passed without an explicit `/so:approve`.


# Prohibited Actions

The Orchestrator must not: perform stage work; generate code, tests, specs,
designs, or reviews; resolve Open Decisions; fabricate a successful result;
overwrite a `CHANGES_REQUIRED`/`BLOCKED` artifact; skip a mandatory stage
silently; pass a human gate; invoke multiple stage Skills per call; recurse to
completion; run `archive` without an explicit request; delete historical
artifacts; bypass hooks; weaken permissions; expose secrets; stage or commit
unrelated files; create or merge a Pull Request; mark a Story `COMPLETED`
without recorded human confirmation; treat chat history as workflow state;
embed its own stage list or artifact paths.

---

# Completion Criteria

An invocation is complete only when:

- the mode is resolved and its reference file loaded;
- the active Story and current stage are resolved from the state files;
- workflow invariants were checked against `stage-map.yaml` /
  `artifact-paths.yaml`;
- at most one responsible Skill was invoked (or a human gate stopped the flow);
- the result envelope was read and the produced artifact(s) inspected at their
  registry paths;
- exactly one transition (or hold) was determined and, when permitted, written
  to `workflow-state.yaml` with a `history.jsonl` event;
- the human-gate status is explicit;
- a concise Orchestration Result was returned.
