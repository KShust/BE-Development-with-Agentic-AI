---
name: pr-reviewer
description: >
  Reviews the Story's change set the way a human reviewer reads a Pull Request
  diff: scope and noise, readability, naming, duplication, dead code, comment
  and documentation accuracy, test quality as code, and commit hygiene. Owns the
  PR_REVIEW stage. Use after RECONCILIATION and before HUMAN_PR_APPROVAL. Does
  not re-verify Acceptance Criteria, re-run the security review, or create a
  Pull Request.
---

# Purpose

Own the **PR_REVIEW** stage. Every upstream stage asks whether the change is
*correct*. This stage asks whether it is *reviewable and maintainable* — the
judgement a person applies reading a diff, and the last quality gate before a
human is asked to approve.

The Skill does not edit code. It records findings and, on `CHANGES_REQUIRED`,
names the loop-back target.

# When to use

- The orchestrator routed the workflow to `PR_REVIEW`, after `RECONCILIATION`
  returned `PASS`.

# When NOT to use

- Before `IMPLEMENTATION_VERIFICATION`, `SECURITY_REVIEW`, and `RECONCILIATION`
  have all returned `PASS`. This stage reviews a change set those stages already
  found correct, safe, and consistent.
- To answer any question in the Scope boundary table below that belongs to
  another stage.
- To edit code, or to create, push, merge, or comment on a Pull Request.
- As a substitute for the human at `HUMAN_PR_APPROVAL`.

# Canonical sources

- Workflow / stage / loop-back: `docs/workflow/stage-map.yaml` (`PR_REVIEW`;
  loop_back keys `changes_required` → `IMPLEMENTATION`,
  `stale_reconciliation` → `RECONCILIATION`).
- Artifact paths: `docs/workflow/artifact-paths.yaml` — **authoritative**. This
  Skill's only output is `pr_review`.
- Front matter: `docs/workflow/artifact-schema.md`.
- Result vocabulary: `docs/workflow/artifact-lifecycle.md`.
- Conventions this review applies: `AGENTS.md` and `docs/architecture/`.

# Inputs (registry keys — resolve paths from artifact-paths.yaml)

- `story`, `specification` — what the change was supposed to be.
- `implementation_plan` — the shape the change was supposed to take.
- `implementation_report` — what the implementer says was changed.
- `implementation_verification`, `security_review`, `reconciliation`,
  `traceability` — the upstream verdicts. **Consume them; do not redo them.**
- The Git change set for the Story branch, read only.

# Preconditions

- `implementation_verification` and `security_review` verdicts are `PASS`.
- `reconciliation` verdict is `PASS` and its PR candidate file classification is
  present. That classification is authoritative for which files belong in the
  change set — this Skill reviews those files, it does not re-classify them.
- No tracked file changed after `reconciliation` ran. If any did →
  `verdict: CHANGES_REQUIRED`, loop_back key `stale_reconciliation`.
- Working tree is clean and the change set is on a Story branch, not the default
  branch.

# Scope boundary

Do **not** re-do upstream work. If a finding belongs to another stage, record it
as a pointer and route there rather than analysing it here.

| Question | Owner |
|---|---|
| Does it satisfy the Acceptance Criteria? | `implementation-verifier` |
| Does it build, type-check, pass tests? | `implementation-verifier` + the hooks |
| Is it a security risk? | `security-reviewer` |
| Does it match the approved artifacts? | `reconciliation-reviewer` |
| Does it violate layering or import rules? | `eslint.config.js` — a lint failure, not a review comment |
| **Is it reviewable, minimal, and maintainable?** | **this Skill** |

# Review checklist

## Change-set shape

- Every file in the change set is explained by the Story. Anything unrelated —
  drive-by reformatting, an opportunistic refactor, a stray config edit, a
  leftover scratch file — is a finding.
- The change is the smallest one that satisfies the plan. A new module, shared
  directory, or abstraction layer must carry the justification `AGENTS.md`
  requires.
- No generated, runtime, local, or sensitive file is included.

## Readability

- A reviewer can follow each file's diff without reconstructing context from the
  artifacts. Where they cannot, the code needs a comment or a clearer structure —
  name which.
- Names say what the thing is in this domain's vocabulary
  (`docs/product/business-glossary.md`).
- Control flow is followable: no unnecessary nesting, no unexplained early exit,
  no clever expression standing in for a readable one.

## Duplication and dead weight

- Logic added here that already exists elsewhere in `src/` — name both sites.
- Code introduced but never reached: unused export, unreferenced branch,
  parameter nothing supplies, `TODO` with no owner.
- Something the change made obsolete but left behind.

## Comments and documentation

- Comments describe intent, not the line beneath them, and none is stale with
  respect to the code it sits on.
- `README.md`, `.env.example`, and `docs/` are updated where this change affects
  them; `AGENTS.md` is updated only if a convention itself changed.

## Tests as code

- Test names state the behaviour, not the mechanics.
- The assertion actually pins the behaviour the Acceptance Criterion promises —
  a test that still passes with the feature removed is a finding.
- No test was weakened, skipped, or deleted to obtain a pass.

## Commit hygiene

- Conventional Commits format; the subject describes the behaviour change.
- No secrets, no `.env`, and no agent attribution in any message
  (`AGENTS.md` → Prohibited).
- Commits are individually coherent; nothing is a "wip" or "fix" with no content.

# Findings

Severity is defined once, in `docs/workflow/artifact-lifecycle.md` §4 (`Critical` and `Major` both block; `Minor` does not). What follows is what each level looks like at this stage.

Classify each finding and give file, line, what is wrong, and what would resolve
it.

- **Critical** — the change set contains something that must not be merged: an
  unrelated or generated file, a secret, dead or unreachable production code, a
  test that cannot fail.
- **Major** — a maintainer will pay for this: duplicated logic, a structure that
  cannot be followed, documentation the change invalidated, a misleading name in
  a public contract.
- **Minor** — worth fixing, does not block: local naming, comment wording,
  commit-message phrasing.

Any Critical or Major finding → `verdict: CHANGES_REQUIRED`. Minor findings
alone → `verdict: PASS` with `non_blocking_findings` populated.

# Output

- `pr_review` at the `pr_review` registry path, front matter per
  `artifact-schema.md` (`artifact_type: pr_review`, `produced_by: pr-reviewer`,
  `inputs` recording each consumed artifact's version).

Sections, in order:

1. **Verdict rationale** — one paragraph: why this verdict and not another.
2. **Change-set inventory** — the files reviewed, taken from the `reconciliation`
   classification, each marked reviewed or skipped-with-reason.
3. **Findings** — Critical, Major, Minor, in that order, each with location and
   remedy.
4. **Positive notes** — what a later reader should keep doing. Brief.
5. **Review limitations** — what could not be assessed, and why.

Report in chat: the verdict, every Critical and Major finding, and the loop-back
target if any. Those decide whether a human is asked to approve.

# Validation Checklist

Before returning the result envelope, confirm each of these:

- Every file in the `reconciliation` classification is marked reviewed, or
  skipped with a reason.
- Every finding names a file, a line, and a remedy.
- No finding restates a question the Scope boundary assigns to another stage.
- Any Critical or Major finding produced `CHANGES_REQUIRED`.
- Nothing outside `pr_review` was edited, and no Pull Request was touched.


# Result Envelope

Return exactly this (shape: `docs/workflow/artifact-lifecycle.md` §5); the
story-orchestrator records the transition — this Skill does not update
`workflow-state.yaml`:

```yaml
result:
  verdict: PASS | CHANGES_REQUIRED | BLOCKED
  stage: PR_REVIEW
  story: <StoryId>
  artifact_status: APPROVED        # of the pr_review artifact itself
  artifacts:
    - docs/reviews/pr/<StoryId>-pr-review.md
  next_stage: HUMAN_PR_APPROVAL
  loop_back_stage: null            # or IMPLEMENTATION / RECONCILIATION
  loop_back_key: null              # or changes_required / stale_reconciliation
  blocking_issues: []
  non_blocking_findings: []
```

| Situation | loop_back_stage | loop_back_key |
|---|---|---|
| Critical or Major finding in the change set | `IMPLEMENTATION` | `changes_required` |
| A tracked file changed after reconciliation ran | `RECONCILIATION` | `stale_reconciliation` |

`BLOCKED` when the change set cannot be read at all — no Story branch, an
unreadable diff, or a missing upstream verdict. Name the responsible stage in
`blocking_issues`; do not guess at the content of what is missing.

# Prohibited

- Editing code, tests, documentation, or any artifact this Skill does not own.
- Re-verifying Acceptance Criteria, re-running the security review, or
  re-deriving the PR candidate classification.
- Creating, pushing, merging, or commenting on a Pull Request.
- Recording human approval, or treating this Skill's `PASS` as approval.
- Raising a finding that names no file and no remedy.
- Inventing a convention that is not in `AGENTS.md` or `docs/architecture/`.
