#!/usr/bin/env python3
"""Tests for scripts/validate-harness.py.

The validator is only worth its exit code if it has been seen to fail. Each case
copies the harness into a scratch tree, injects exactly one defect, and asserts
that the validator rejects it and says which one. A case that stops failing
means the validator lost a check.

Some checks warn rather than fail, because the condition they describe is
legitimate but must stay visible. Those cases are marked `warning=True` and
assert the opposite exit code: the run still succeeds, and the message appears.
Without them a warning-only check would never be exercised.

Run:  npm run validate:harness:test
Exit: 0 = every case was detected, 1 = at least one slipped through.
"""

from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]

# Everything the validator reads. Kept in one place so a new input surfaces here
# as a failing baseline rather than as a silently unexercised check.
TREE = (
    ("scripts/validate-harness.py", "file"),
    ("docs", "dir"),
    (".claude/skills", "dir"),
    (".claude/commands", "dir"),
    ("AGENTS.md", "file"),
)

CASES: list[tuple[str, object, str, bool]] = []


def case(name: str, expect: str, *, warning: bool = False):
    """Register a case. `warning=True` expects a clean exit that still reports."""

    def register(fn):
        CASES.append((name, fn, expect, warning))
        return fn

    return register


def build(work: Path) -> None:
    if work.exists():
        shutil.rmtree(work)
    work.mkdir(parents=True)
    for rel, kind in TREE:
        source, target = REPO / rel, work / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        if kind == "dir":
            shutil.copytree(source, target, ignore=shutil.ignore_patterns("__pycache__"))
        else:
            shutil.copy(source, target)


def run(work: Path) -> tuple[int, str]:
    result = subprocess.run(
        [sys.executable, str(work / "scripts" / "validate-harness.py")],
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    return result.returncode, (result.stdout or "") + (result.stderr or "")


def edit(work: Path, rel: str, old: str, new: str) -> None:
    path = work / rel
    text = path.read_text(encoding="utf-8")
    if old not in text:
        raise AssertionError(f"anchor no longer present in {rel}: {old[:60]!r}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8", newline="\n")


def current_stage(work: Path) -> str:
    """The `current_stage` the scratch tree's workflow state actually holds.

    Cases that need to move the workflow to a different stage must not hard-code
    the stage it is at today: the value is live state, it changes as the active
    Story advances, and an anchor on one stage id turns a correct tree into a
    failing test run. Read it instead.
    """
    text = (work / "docs" / "workflow" / "workflow-state.yaml").read_text(encoding="utf-8")
    found = re.search(r"^current_stage:\s*(\S+)\s*$", text, re.M)
    if not found:
        raise AssertionError("workflow-state.yaml has no parsable current_stage")
    return found.group(1)


GATE = "HUMAN_SPEC_APPROVAL"

# A populated gate object in the shape state-schema.md prescribes: a block
# mapping, not an inline scalar. The cases below write it out explicitly instead
# of editing whatever the live tree holds, so they keep testing the same thing
# whether or not the active Story happens to be sitting at a gate today.
GATE_BLOCK = """
  stage: HUMAN_SPEC_APPROVAL
  status: {status}
  required_artifacts:
    - type: specification
      path: docs/specifications/US-001-spec.md
      version: 1
  automated_verdict: PASS
  blocking_findings: []
  requested_at: 2026-08-31T00:00:00Z
  decided_at: null
  decided_by: null
  comment: null"""


def at_stage(work: Path, stage: str) -> None:
    """Move the scratch tree's workflow state to `stage`, from wherever it is."""
    was = current_stage(work)
    if was != stage:
        edit(
            work,
            "docs/workflow/workflow-state.yaml",
            f"current_stage: {was}",
            f"current_stage: {stage}",
        )


def set_gate(work: Path, body: str) -> None:
    """Replace the whole `pending_human_gate` value, whatever shape it is in.

    The value may be an inline scalar (`null`) or an indented block, and a case
    must be able to swap either for either - so this drops the key's own line
    together with every indented line beneath it, then writes `body`.
    """
    path = work / "docs" / "workflow" / "workflow-state.yaml"
    lines = path.read_text(encoding="utf-8").splitlines(keepends=True)
    out: list[str] = []
    index = 0
    replaced = False
    while index < len(lines):
        if lines[index].startswith("pending_human_gate:"):
            out.append("pending_human_gate:" + body + "\n")
            replaced = True
            index += 1
            while index < len(lines) and lines[index].startswith((" ", "\t")):
                index += 1
            continue
        out.append(lines[index])
        index += 1
    if not replaced:
        raise AssertionError("workflow-state.yaml has no pending_human_gate key")
    path.write_text("".join(out), encoding="utf-8", newline="\n")


SPEC = "docs/specifications/US-001-spec.md"
REVIEW = "docs/reviews/specifications/US-001-spec-review.md"


def front_matter(work: Path, rel: str, key: str) -> str:
    """A top-level front-matter scalar, as the scratch tree currently holds it.

    Anchored at column 0, so `version:` finds the artifact's own version and not
    one of the indented `inputs[]` entries.
    """
    text = (work / rel).read_text(encoding="utf-8")
    found = re.search(rf"^{key}:\s*(\S+)\s*$", text, re.M)
    if not found:
        raise AssertionError(f"{rel}: no parsable {key} in front matter")
    return found.group(1)


def bump_version(work: Path, rel: str, by: int = 1) -> int:
    """Advance an artifact's own `version`, returning the new value."""
    was = int(front_matter(work, rel, "version"))
    edit(work, rel, f"version: {was}\n", f"version: {was + by}\n")
    return was + by


def recorded_input(work: Path, rel: str, upstream: str) -> int:
    """The version `rel` records having consumed `upstream` at."""
    text = (work / rel).read_text(encoding="utf-8")
    found = re.search(
        rf"^  - path: {re.escape(upstream)}\n    version: (\d+)\s*$", text, re.M
    )
    if not found:
        raise AssertionError(f"{rel}: no versioned inputs[] entry for {upstream}")
    return int(found.group(1))


def consumers_of(work: Path, upstream: str) -> list[str]:
    """Every story artifact that records a versioned `inputs[]` entry for `upstream`.

    Bumping an upstream makes *all* of its consumers stale at once, not just the
    one a case has in mind. A case that rebuts a single consumer therefore leaves
    the rest failing and stops testing what it names. This finds the full set, so
    the rebuttal cases stay about the rebuttal.
    """
    found = []
    for path in sorted((work / "docs").rglob("*.md")):
        text = path.read_text(encoding="utf-8")
        if re.search(rf"^  - path: {re.escape(upstream)}\n    version: \d+", text, re.M):
            found.append(path.relative_to(work).as_posix())
    return found


def rebut(work: Path, rel: str, upstream: str, assessed: int, reason: str | None) -> None:
    """Add an assessed_version (and optionally its assessment) to an input entry."""
    was = recorded_input(work, rel, upstream)
    body = f"  - path: {upstream}\n    version: {was}\n    assessed_version: {assessed}\n"
    if reason is not None:
        body += f"    assessment: >\n      {reason}\n"
    edit(work, rel, f"  - path: {upstream}\n    version: {was}\n", body)


def event(timestamp: str, source: str, target: str, **overrides) -> dict:
    """One history event with the schema's required fields filled in."""
    body = {
        "timestamp": timestamp,
        "story": "US-001",
        "from_stage": source,
        "to_stage": target,
        "skill": "us-clarifier",
        "verdict": "PASS",
        "artifacts": [],
        "attempt": 1,
    }
    body.update(overrides)
    return body


def append_history(work: Path, *events: dict) -> None:
    """Append events to the scratch tree's history.jsonl.

    The baseline log holds a single activation event, so every history case
    builds the sequence it needs. This appends rather than rewrites, which is
    also the only thing state-schema.md allows the real log.
    """
    path = work / "docs" / "workflow" / "history.jsonl"
    body = path.read_text(encoding="utf-8").rstrip("\n")
    lines = [body] + [json.dumps(e) for e in events]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")


# --------------------------------------------------------------------------
# One defect per case
# --------------------------------------------------------------------------


@case("routing target that is not a stage", "not in stage_order")
def _(work):
    edit(work, "docs/workflow/stage-map.yaml", "    next: SPEC_REVIEW", "    next: NOWHERE_STAGE")


@case("stage points at a Skill that does not exist", "has no .claude/skills")
def _(work):
    shutil.rmtree(work / ".claude" / "skills" / "spec-verifier")


@case("Skill front matter name disagrees with its directory", "must match the directory")
def _(work):
    edit(work, ".claude/skills/db-designer/SKILL.md", "name: db-designer", "name: database-designer")


@case("active Story disagrees with workflow state", "disagrees with")
def _(work):
    edit(work, "docs/workflow/workflow-state.yaml", "story: US-001", "story: US-002")


@case("current_stage is not a real stage", "is not in stage_order")
def _(work):
    edit(
        work,
        "docs/workflow/workflow-state.yaml",
        f"current_stage: {current_stage(work)}",
        "current_stage: DESIGN",
    )


@case("stage consumes an unregistered artifact", "absent from artifact-paths.yaml")
def _(work):
    edit(work, "docs/workflow/stage-map.yaml", "    inputs: [story]", "    inputs: [story, ghost_artifact]")


@case("stages.md drifted from stage_order", "disagrees with stage_order")
def _(work):
    edit(work, "docs/workflow/stages.md", "| 18 | `PR_REVIEW` | skill | `pr-reviewer` | `pr_review` |\n", "")


@case("history.jsonl is not valid JSON", "not valid JSON")
def _(work):
    (work / "docs" / "workflow" / "history.jsonl").write_text("{oops\n", encoding="utf-8")


@case("history event names a stage that does not exist", "is not a stage")
def _(work):
    edit(work, "docs/workflow/history.jsonl", '"to_stage": "CLARIFICATION"', '"to_stage": "CLARIFY"')


@case("catalog points at a Story file that is gone", "does not exist")
def _(work):
    (work / "docs" / "stories" / "US-003-customer-profile-view.md").unlink()


@case("two Stories marked IN_PROGRESS", "more than one Story IN_PROGRESS")
def _(work):
    edit(
        work,
        "docs/catalog/stories.yaml",
        "    title: Customer Login\n    state: READY",
        "    title: Customer Login\n    state: IN_PROGRESS",
    )


@case("retired stage id used in a Skill", "retired stage id")
def _(work):
    edit(work, ".claude/skills/spec-writer/SKILL.md", "# Purpose", "# Purpose\n\nAfter this, go to PLANNING.")


@case("human gate with no pending_human_gate", "pending_human_gate is null")
def _(work):
    at_stage(work, GATE)
    set_gate(work, " null")


# Both cases below require the validator to SEE a block-form pending_human_gate.
# Read as absent - which is what a top-level-scalars-only parse does to a nested
# mapping - neither check can fire, and each silently stops testing anything.
# That is the defect they exist to catch: it made the gate checks unsatisfiable
# at every human gate, and went unnoticed until the workflow first reached one.
@case("pending_human_gate carries a status that is not a gate status", "pending_human_gate.status")
def _(work):
    at_stage(work, GATE)
    set_gate(work, GATE_BLOCK.format(status="AWAITING"))


@case("pending_human_gate is set at a stage that is not a human gate", "is not a human gate")
def _(work):
    at_stage(work, "SPEC_REVIEW")
    set_gate(work, GATE_BLOCK.format(status="PENDING"))


@case(
    "artifact exists that no recorded stage run produced",
    "docs/plans/US-001-implementation-plan.md",
    warning=True,
)
def _(work):
    # Construct the condition instead of inheriting it: the case used to rely
    # on IMPLEMENTATION_PLANNING not having run yet in the live Story. Once it
    # ran, its skill appeared in history.jsonl and the injected file read as
    # legitimately produced. Dropping that stage's own events first makes the
    # artifact unrecorded by construction, which no later stage can age out.
    history = work / "docs" / "workflow" / "history.jsonl"
    kept = [
        line
        for line in history.read_text(encoding="utf-8").splitlines(keepends=True)
        if '"skill": "implementation-planner"' not in line
    ]
    history.write_text("".join(kept), encoding="utf-8", newline="\n")
    (work / "docs" / "plans" / "US-001-implementation-plan.md").write_text(
        "# injected: never produced by IMPLEMENTATION_PLANNING\n", encoding="utf-8"
    )


# --------------------------------------------------------------------------
# Artifact timestamps and the staleness contract (artifact-schema.md)
# --------------------------------------------------------------------------


@case("artifact updated_at is ahead of the clock", "2099-01-01T00:00:00Z is in the future")
def _(work):
    edit(
        work,
        SPEC,
        f"updated_at: {front_matter(work, SPEC, 'updated_at')}",
        "updated_at: 2099-01-01T00:00:00Z",
    )


@case("artifact updated_at does not parse", "not a parsable ISO-8601 timestamp")
def _(work):
    edit(
        work,
        SPEC,
        f"updated_at: {front_matter(work, SPEC, 'updated_at')}",
        "updated_at: last Tuesday",
    )


@case("downstream records a version the upstream has moved past", "stale input")
def _(work):
    # The review recorded the specification at the version it read. Advance the
    # specification; the review carries no assessment, so it is stale.
    bump_version(work, SPEC)


@case("stale input rebutted with an assessment is accepted", "harness OK", warning=True)
def _(work):
    # Every consumer is rebutted, not only the spec review: one bump staleses
    # them all, and a case that left four of them failing would assert the exit
    # code of an unrelated defect.
    now_at = bump_version(work, SPEC)
    for rel in consumers_of(work, SPEC):
        rebut(
            work,
            rel,
            SPEC,
            assessed=now_at,
            reason=(
                "The new revision rewrote the status banner only. This artifact "
                "consumes the requirements and the traceability matrix, neither "
                "of which moved."
            ),
        )


@case(
    "a design cites the review that revised it, and the review revises again",
    "stale input on a backward edge",
    warning=True,
)
def _(work):
    # A loop-back makes a design consume the review that sent it back, so the
    # edge runs backwards through stage_order. The design can only re-run via
    # another loop-back, which needs a CHANGES_REQUIRED verdict - and that would
    # have re-run the design anyway. Warn, so the condition stays visible
    # without demanding a repair that a PASS makes unreachable.
    #
    # Pin current_stage rather than inheriting wherever the live Story sits.
    # The bump staleses every consumer of the review, and they are not all
    # backward: artifacts owned by stages after DESIGN_REVIEW cite it on a
    # forward edge, which is a hard error once their stage is behind
    # current_stage. DESIGN_REVIEW is the one position where both kinds warn -
    # late enough that API_DESIGN and DB_DESIGN are behind it and reach the
    # backward branch this case names, early enough that every forward consumer
    # grades as pending. It also cannot age: the review is owned by
    # DESIGN_REVIEW, so every future consumer is either earlier (backward) or
    # later (pending), and no new artifact can turn this case red.
    edit(
        work,
        "docs/workflow/workflow-state.yaml",
        f"current_stage: {current_stage(work)}",
        "current_stage: DESIGN_REVIEW",
    )
    bump_version(work, "docs/reviews/designs/US-001-design-review.md")


@case("rebuttal names a version the upstream has already left behind", "the rebuttal is void")
def _(work):
    now_at = bump_version(work, SPEC, by=2)
    rebut(work, REVIEW, SPEC, assessed=now_at - 1, reason="Banner only.")


@case("rebuttal with no reason recorded", "with no assessment")
def _(work):
    now_at = bump_version(work, SPEC)
    rebut(work, REVIEW, SPEC, assessed=now_at, reason=None)


# --------------------------------------------------------------------------
# history.jsonl integrity (state-schema.md, stage-map.yaml)
#
# These warn rather than fail: the log is append-only, so a violation already
# recorded has no repair, and failing on one would wedge the harness with
# falsifying the record as the only way out. The cases assert the warning is
# raised and the run still exits clean.
# --------------------------------------------------------------------------


@case("history timestamp goes backwards", "cannot go backwards in time", warning=True)
def _(work):
    append_history(
        work,
        event("2026-08-31T01:00:00Z", "CLARIFICATION", "SPECIFICATION"),
        event("2026-08-30T12:00:00Z", "SPECIFICATION", "SPEC_REVIEW", skill="spec-writer"),
    )


@case("history timestamp is ahead of the clock", "is in the future", warning=True)
def _(work):
    append_history(work, event("2099-01-01T00:00:00Z", "CLARIFICATION", "SPECIFICATION"))


@case("history records a transition stage-map.yaml does not define", "is not a transition", warning=True)
def _(work):
    append_history(work, event("2026-08-31T01:00:00Z", "CLARIFICATION", "PR_REVIEW"))


@case("a transition event was never appended", "was never appended", warning=True)
def _(work):
    # CLARIFICATION -> SPECIFICATION, then a jump that starts at SPEC_REVIEW:
    # the SPECIFICATION -> SPEC_REVIEW event is missing from the chain.
    append_history(
        work,
        event("2026-08-31T01:00:00Z", "CLARIFICATION", "SPECIFICATION"),
        event(
            "2026-08-31T02:00:00Z",
            "SPEC_REVIEW",
            "HUMAN_SPEC_APPROVAL",
            skill="spec-verifier",
        ),
    )


def main() -> int:
    root = Path(tempfile.mkdtemp(prefix="harness-validator-test-"))
    work = root / "tree"
    try:
        build(work)
        code, out = run(work)
        if code != 0:
            print("baseline FAILED: the untouched harness does not validate", file=sys.stderr)
            print(out, file=sys.stderr)
            return 1
        print(f"baseline: {out.strip()}\n")

        missed = 0
        for name, mutate, expect, warning in CASES:
            build(work)
            mutate(work)
            code, out = run(work)
            caught = (code == 0 if warning else code != 0) and expect in out
            print(f"  {'pass' if caught else 'MISS'}  {name}")
            if not caught:
                missed += 1
                wanted = "a zero exit (warning)" if warning else "a non-zero exit"
                print(f"        expected {expect!r} and {wanted}, got exit={code}")
                print("        " + out.strip().replace("\n", "\n        ")[:500])

        print(f"\n{len(CASES) - missed}/{len(CASES)} cases detected")
        return 1 if missed else 0
    finally:
        shutil.rmtree(root, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main())
