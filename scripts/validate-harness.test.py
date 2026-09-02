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
    edit(work, "docs/workflow/workflow-state.yaml", "current_stage: CLARIFICATION", "current_stage: DESIGN")


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
    edit(
        work,
        "docs/workflow/workflow-state.yaml",
        "current_stage: CLARIFICATION",
        "current_stage: HUMAN_SPEC_APPROVAL",
    )


@case(
    "artifact exists that no recorded stage run produced",
    "docs/plans/US-001-implementation-plan.md",
    warning=True,
)
def _(work):
    (work / "docs" / "plans" / "US-001-implementation-plan.md").write_text(
        "# injected: never produced by IMPLEMENTATION_PLANNING\n", encoding="utf-8"
    )


# --------------------------------------------------------------------------
# Artifact timestamps and the staleness contract (artifact-schema.md)
# --------------------------------------------------------------------------


@case("artifact updated_at is ahead of the clock", "updated_at 2099-01-01T00:00:00Z is in the future")
def _(work):
    edit(
        work,
        "docs/specifications/US-001-spec.md",
        "updated_at: 2026-08-31T00:00:00Z",
        "updated_at: 2099-01-01T00:00:00Z",
    )


@case("artifact updated_at does not parse", "not a parsable ISO-8601 timestamp")
def _(work):
    edit(
        work,
        "docs/specifications/US-001-spec.md",
        "updated_at: 2026-08-31T00:00:00Z",
        "updated_at: last Tuesday",
    )


@case("downstream records a version the upstream has moved past", "stale input")
def _(work):
    # The review consumed the specification at version 1; the specification is
    # now at version 2 and the review carries no assessment.
    edit(
        work,
        "docs/specifications/US-001-spec.md",
        "artifact_type: specification\nstory: US-001\nversion: 1",
        "artifact_type: specification\nstory: US-001\nversion: 2",
    )


@case("stale input rebutted with an assessment is accepted", "harness OK", warning=True)
def _(work):
    edit(
        work,
        "docs/specifications/US-001-spec.md",
        "artifact_type: specification\nstory: US-001\nversion: 1",
        "artifact_type: specification\nstory: US-001\nversion: 2",
    )
    edit(
        work,
        "docs/reviews/specifications/US-001-spec-review.md",
        "  - path: docs/specifications/US-001-spec.md\n    version: 1\n",
        "  - path: docs/specifications/US-001-spec.md\n"
        "    version: 1\n"
        "    assessed_version: 2\n"
        "    assessment: >\n"
        "      v2 rewrote the status banner only. This review consumes the\n"
        "      requirements and the traceability matrix, neither of which moved.\n",
    )


@case("rebuttal names a version the upstream has already left behind", "the rebuttal is void")
def _(work):
    edit(
        work,
        "docs/specifications/US-001-spec.md",
        "artifact_type: specification\nstory: US-001\nversion: 1",
        "artifact_type: specification\nstory: US-001\nversion: 3",
    )
    edit(
        work,
        "docs/reviews/specifications/US-001-spec-review.md",
        "  - path: docs/specifications/US-001-spec.md\n    version: 1\n",
        "  - path: docs/specifications/US-001-spec.md\n"
        "    version: 1\n"
        "    assessed_version: 2\n"
        "    assessment: >\n"
        "      v2 rewrote the status banner only.\n",
    )


@case("rebuttal with no reason recorded", "with no assessment")
def _(work):
    edit(
        work,
        "docs/specifications/US-001-spec.md",
        "artifact_type: specification\nstory: US-001\nversion: 1",
        "artifact_type: specification\nstory: US-001\nversion: 2",
    )
    edit(
        work,
        "docs/reviews/specifications/US-001-spec-review.md",
        "  - path: docs/specifications/US-001-spec.md\n    version: 1\n",
        "  - path: docs/specifications/US-001-spec.md\n"
        "    version: 1\n"
        "    assessed_version: 2\n",
    )


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
