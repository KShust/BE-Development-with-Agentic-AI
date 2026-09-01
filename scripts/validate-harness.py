#!/usr/bin/env python3
"""Deterministic integrity check for the agentic development harness.

story-orchestrator states its workflow invariants in prose, which means nothing
enforces them: a Skill that forgets one still writes the transition and the
workflow carries on against the wrong artifacts. This script is the executable
half. It answers, with an exit code, whether the harness is internally
consistent right now.

Scope: structure and cross-references only. It does not judge the content of a
Specification, a plan, or a review - that is what the review stages are for.

Run:  npm run validate:harness      (or: python scripts/validate-harness.py)
Exit: 0 = consistent, 1 = at least one error.

The YAML here is read with targeted line parsing rather than a YAML library:
AGENTS.md gates new dependencies on explicit approval, and the four files this
reads have a fixed, simple shape. Every reader below fails loudly if a file does
not have the shape it expects, so a silent misparse cannot be mistaken for a
pass.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]

WORKFLOW_STATUS = {
    "NOT_STARTED",
    "IN_PROGRESS",
    "WAITING_FOR_HUMAN",
    "BLOCKED",
    "COMPLETED",
    "ARCHIVED",
}
STORY_STATE = {"BACKLOG", "READY", "IN_PROGRESS", "COMPLETED", "ARCHIVED"}
GATE_STATUS = {"PENDING", "APPROVED", "REJECTED"}
HISTORY_VERDICTS = {
    "PASS",
    "CHANGES_REQUIRED",
    "BLOCKED",
    "NOT_APPLICABLE",
    "ACTIVATED",
    "HUMAN_APPROVED",
    "HUMAN_REJECTED",
    "ARCHIVED",
}
HISTORY_FIELDS = {
    "timestamp",
    "story",
    "from_stage",
    "to_stage",
    "skill",
    "verdict",
    "artifacts",
    "attempt",
}

# Skills that exist for people or for coordination, not for a workflow stage.
NON_STAGE_SKILLS = {"pre-commit-checklist", "story-orchestrator"}

# Registered outside the per-Story flow: written across Stories, not by a stage.
CROSS_STORY_ARTIFACTS = {"workflow_history", "project_state", "story_catalog"}

errors: list[str] = []
warnings: list[str] = []


def error(msg: str) -> None:
    errors.append(msg)


def warn(msg: str) -> None:
    warnings.append(msg)


def read(rel: str) -> str | None:
    path = REPO / rel
    if not path.is_file():
        error(f"missing file: {rel}")
        return None
    return path.read_text(encoding="utf-8")


# --------------------------------------------------------------------------
# Targeted readers for the two registry files
# --------------------------------------------------------------------------


def read_stage_order(text: str) -> list[str]:
    block = re.search(r"^stage_order:\n((?:  - [A-Z_]+\n)+)", text, re.M)
    if not block:
        error("stage-map.yaml: no parsable stage_order block")
        return []
    return [line.strip(" -") for line in block.group(1).splitlines()]


def read_stages(text: str) -> dict[str, dict]:
    """Return {STAGE_ID: {type, skill, next, on_approve, on_reject, loop_back, ...}}."""
    body = text.split("\nstages:\n", 1)
    if len(body) != 2:
        error("stage-map.yaml: no `stages:` block")
        return {}
    stages: dict[str, dict] = {}
    current: str | None = None
    in_loop_back = False
    for raw in body[1].splitlines():
        if raw.startswith("#") or not raw.strip():
            continue
        if re.match(r"^[A-Za-z#]", raw):  # left the indented block
            break
        head = re.match(r"^  ([A-Z_]+):\s*$", raw)
        if head:
            current = head.group(1)
            stages[current] = {"loop_back": {}}
            in_loop_back = False
            continue
        if current is None:
            continue
        if re.match(r"^    loop_back:\s*$", raw):
            in_loop_back = True
            continue
        if in_loop_back:
            entry = re.match(r"^      ([a-z_]+):\s*([A-Z_]+)\s*$", raw)
            if entry:
                stages[current]["loop_back"][entry.group(1)] = entry.group(2)
                continue
            if raw.startswith("    ") and not raw.startswith("      "):
                in_loop_back = False
        field = re.match(r"^    (type|skill|next|on_approve|on_reject|optional):\s*(\S+)\s*$", raw)
        if field:
            stages[current][field.group(1)] = field.group(2)
            continue
        listing = re.match(r"^    (inputs|outputs|required_artifacts|produces):\s*\[(.*)$", raw, re.S)
        if listing:
            stages[current][listing.group(1)] = listing.group(2)
            continue
        # continuation of a bracketed list
        for key in ("inputs", "outputs", "required_artifacts", "produces"):
            value = stages[current].get(key)
            if isinstance(value, str) and not value.rstrip().endswith("]"):
                stages[current][key] = value + " " + raw.strip()
                break
    for stage in stages.values():
        for key in ("inputs", "outputs", "required_artifacts", "produces"):
            if key in stage:
                raw_list = str(stage[key]).split("]")[0]
                stage[key] = [k.strip() for k in raw_list.split(",") if k.strip()]
    return stages


def read_artifacts(text: str) -> dict[str, dict[str, str]]:
    """Return {artifact_key: {pattern, owner}}."""
    artifacts: dict[str, dict[str, str]] = {}
    current: str | None = None
    for raw in text.splitlines():
        if raw.startswith("#"):
            continue
        head = re.match(r"^  ([a-z_]+):\s*$", raw)
        if head:
            current = head.group(1)
            artifacts[current] = {}
            continue
        if current is None:
            continue
        field = re.match(r"^    (pattern|owner):\s*(.+?)\s*$", raw)
        if field:
            artifacts[current][field.group(1)] = field.group(2)
    return {k: v for k, v in artifacts.items() if "pattern" in v}


def read_scalars(text: str) -> dict[str, str]:
    """Top-level `key: value` pairs, comments and nesting ignored."""
    out: dict[str, str] = {}
    for raw in text.splitlines():
        if raw.startswith(("#", " ", "-")) or ":" not in raw:
            continue
        key, _, value = raw.partition(":")
        out[key.strip()] = value.split("#")[0].strip()
    return out


# --------------------------------------------------------------------------
# Checks
# --------------------------------------------------------------------------


def check_skills() -> set[str]:
    """Every Skill directory holds exactly one SKILL.md whose name matches it."""
    root = REPO / ".claude" / "skills"
    if not root.is_dir():
        error("missing directory: .claude/skills")
        return set()
    found = set()
    for directory in sorted(p for p in root.iterdir() if p.is_dir()):
        skill_file = directory / "SKILL.md"
        if not skill_file.is_file():
            error(f"skill {directory.name}: no SKILL.md")
            continue
        found.add(directory.name)
        text = skill_file.read_text(encoding="utf-8")
        if not text.startswith("---"):
            error(f"skill {directory.name}: SKILL.md has no front matter")
            continue
        declared = re.search(r"^name:\s*(\S+)\s*$", text, re.M)
        if not declared:
            error(f"skill {directory.name}: front matter has no `name`")
        elif declared.group(1) != directory.name:
            error(
                f"skill {directory.name}: front matter name is "
                f"{declared.group(1)!r}, must match the directory"
            )
        if not re.search(r"^description:", text, re.M):
            error(f"skill {directory.name}: front matter has no `description`")
        nested = [p for p in directory.rglob("SKILL.md") if p != skill_file]
        if nested:
            error(f"skill {directory.name}: extra SKILL.md at {nested[0].relative_to(REPO)}")
    return found


def check_stage_map(stage_order, stages, artifacts, skills) -> None:
    if not stage_order:
        return

    duplicates = {s for s in stage_order if stage_order.count(s) > 1}
    if duplicates:
        error(f"stage-map.yaml: stage_order repeats {sorted(duplicates)}")

    known = set(stage_order)
    defined = set(stages)
    for stage in sorted(defined - known):
        error(f"stage-map.yaml: stage {stage} is defined but absent from stage_order")
    for stage in sorted(known - defined):
        if stage not in {"ARCHIVED"}:  # terminal stages may be definition-only
            if stage not in stages:
                error(f"stage-map.yaml: stage_order lists {stage} with no definition")

    for name, stage in sorted(stages.items()):
        if stage.get("type") == "automated_skill":
            skill = stage.get("skill")
            if not skill:
                error(f"stage {name}: type automated_skill but no `skill`")
            elif skill not in skills:
                error(f"stage {name}: skill {skill!r} has no .claude/skills/{skill}/SKILL.md")

        for field in ("next", "on_approve", "on_reject"):
            target = stage.get(field)
            if target and target not in known:
                error(f"stage {name}: {field} -> {target}, which is not in stage_order")

        for key, target in sorted(stage.get("loop_back", {}).items()):
            if target not in known:
                error(f"stage {name}: loop_back[{key}] -> {target}, which is not in stage_order")

        for field in ("inputs", "outputs", "required_artifacts", "produces"):
            for key in stage.get(field, []):
                if key not in artifacts:
                    error(f"stage {name}: {field} names {key!r}, absent from artifact-paths.yaml")

    # Every automated stage must produce something, or it cannot be verified.
    for name, stage in sorted(stages.items()):
        if stage.get("type") == "automated_skill" and not stage.get("outputs"):
            error(f"stage {name}: automated stage declares no outputs")

    # Every human gate must name the artifacts a person is asked to look at.
    for name, stage in sorted(stages.items()):
        if stage.get("type") == "human_gate" and not stage.get("required_artifacts"):
            error(f"stage {name}: human gate declares no required_artifacts")

    reachable = {stage_order[0]}
    for name, stage in stages.items():
        for field in ("next", "on_approve", "on_reject"):
            if stage.get(field):
                reachable.add(stage[field])
        reachable.update(stage.get("loop_back", {}).values())
    for stage in sorted(known - reachable):
        error(f"stage {stage}: no transition anywhere reaches it")


def check_artifacts(artifacts, stages) -> None:
    seen_patterns: dict[str, str] = {}
    for key, meta in sorted(artifacts.items()):
        pattern = meta["pattern"]
        if pattern in seen_patterns:
            error(f"artifact {key}: shares its pattern with {seen_patterns[pattern]}")
        seen_patterns[pattern] = key
        if "owner" not in meta:
            error(f"artifact {key}: no owner")

    produced: dict[str, str] = {}
    for name, stage in sorted(stages.items()):
        for key in stage.get("outputs", []) + stage.get("produces", []):
            if key in produced:
                error(f"artifact {key}: produced by both {produced[key]} and {name}")
            produced[key] = name

    consumed = {k for s in stages.values() for k in s.get("inputs", [])}
    consumed |= {k for s in stages.values() for k in s.get("required_artifacts", [])}
    for key in sorted(set(artifacts) - set(produced) - consumed - CROSS_STORY_ARTIFACTS):
        warn(f"artifact {key}: registered but no stage produces or consumes it")


def check_stages_doc(stage_order) -> None:
    text = read("docs/workflow/stages.md")
    if text is None:
        return
    table = re.findall(r"^\| \d+ \| `([A-Z_]+)`", text, re.M)
    if table != stage_order:
        error(
            "docs/workflow/stages.md: the stage table disagrees with stage_order "
            f"({len(table)} rows vs {len(stage_order)} stages)"
        )


def strip_retired_listings(path: Path) -> str:
    """File body with the passages that name retired ids on purpose removed.

    `stage-map.yaml` maps them to their replacements and `stages.md` tells a
    reader they are gone; both are the documentation of the retirement, not a
    use of it.
    """
    body = path.read_text(encoding="utf-8")
    body = re.sub(r"\n#+ Retired identifiers\n[\s\S]*?(?=\n#|\Z)", "\n", body)
    body = re.sub(r"\nretired_identifiers:\n(?:  .*\n)+", "\n", body)
    return body


def check_retired(stage_order) -> None:
    text = read("docs/workflow/stage-map.yaml")
    if text is None:
        return
    block = re.search(r"^retired_identifiers:\n((?:  .*\n)+)", text, re.M)
    retired = re.findall(r"^  ([A-Z_]+):", block.group(1), re.M) if block else []

    active = list((REPO / ".claude" / "skills").rglob("SKILL.md"))
    active += list((REPO / ".claude" / "commands").rglob("*.md"))
    active += [REPO / "docs" / "workflow" / "stages.md", REPO / "AGENTS.md"]
    for identifier in retired:
        if identifier in stage_order:
            continue  # a retired alias that is also a live stage id is fine
        for path in active:
            if not path.is_file():
                continue
            if re.search(rf"\b{identifier}\b", strip_retired_listings(path)):
                error(
                    f"retired stage id {identifier} still appears in "
                    f"{path.relative_to(REPO).as_posix()}"
                )


def check_state(stage_order, stages, artifacts) -> None:
    active_text = read("docs/workflow/active-story.yaml")
    state_text = read("docs/workflow/workflow-state.yaml")
    if active_text is None or state_text is None:
        return

    active = read_scalars(active_text)
    state = read_scalars(state_text)

    story = active.get("active_story")
    if story != state.get("story"):
        error(
            f"active-story.yaml active_story={story!r} disagrees with "
            f"workflow-state.yaml story={state.get('story')!r}"
        )

    stage = state.get("current_stage")
    if stage not in stage_order:
        error(f"workflow-state.yaml: current_stage {stage!r} is not in stage_order")

    for field in ("previous_stage", "last_completed_stage"):
        value = state.get(field)
        if value and value != "null" and value not in stage_order:
            error(f"workflow-state.yaml: {field} {value!r} is not in stage_order")

    status = state.get("status")
    if status not in WORKFLOW_STATUS:
        error(f"workflow-state.yaml: status {status!r} is not a workflow status")

    if state.get("workflow") != "story-delivery":
        error(f"workflow-state.yaml: workflow {state.get('workflow')!r} is not story-delivery")

    try:
        if int(state.get("attempt", "0")) < 1:
            error("workflow-state.yaml: attempt must be >= 1")
    except ValueError:
        error(f"workflow-state.yaml: attempt {state.get('attempt')!r} is not an integer")

    is_gate = stages.get(stage, {}).get("type") == "human_gate"
    has_gate = state.get("pending_human_gate") not in (None, "null", "")
    if is_gate and not has_gate:
        error(f"workflow-state.yaml: current_stage {stage} is a human gate but pending_human_gate is null")
    if has_gate and not is_gate:
        error(f"workflow-state.yaml: pending_human_gate is set but {stage} is not a human gate")
    if is_gate and status != "WAITING_FOR_HUMAN":
        error(f"workflow-state.yaml: at human gate {stage} but status is {status!r}")

    gate_status = re.search(r"^\s+status:\s*(\S+)", state_text.split("pending_human_gate:")[-1], re.M)
    if has_gate and gate_status and gate_status.group(1) not in GATE_STATUS:
        error(f"workflow-state.yaml: pending_human_gate.status {gate_status.group(1)!r} is invalid")

    story_path = active.get("story_path")
    if story_path and story_path != "null" and not (REPO / story_path).is_file():
        error(f"active-story.yaml: story_path {story_path} does not exist")

    if story and story != "null" and "story" in artifacts:
        expected_dir = artifacts["story"]["pattern"].split("{")[0]
        if story_path and not story_path.startswith(expected_dir):
            error(f"active-story.yaml: story_path is outside the registry location {expected_dir}")

    return story


def check_catalog(story) -> None:
    text = read("docs/catalog/stories.yaml")
    if text is None:
        return
    entries = re.findall(
        r"^  - id: (\S+)\n(?:.*\n)*?    path: (\S+)\n(?:.*\n)*?    state: (\S+)",
        text,
        re.M,
    )
    if not entries:
        error("docs/catalog/stories.yaml: no parsable story entries")
        return
    ids = [e[0] for e in entries]
    duplicates = {i for i in ids if ids.count(i) > 1}
    if duplicates:
        error(f"docs/catalog/stories.yaml: duplicate story ids {sorted(duplicates)}")
    for story_id, path, state in entries:
        if state not in STORY_STATE:
            error(f"docs/catalog/stories.yaml: {story_id} state {state!r} is invalid")
        if not (REPO / path).is_file():
            error(f"docs/catalog/stories.yaml: {story_id} path {path} does not exist")
    if story and story != "null" and story not in ids:
        error(f"active Story {story} has no entry in docs/catalog/stories.yaml")

    in_progress = [i for i, _, s in entries if s == "IN_PROGRESS"]
    if len(in_progress) > 1:
        error(f"docs/catalog/stories.yaml: more than one Story IN_PROGRESS: {in_progress}")


def check_history(story, stage_order) -> None:
    path = REPO / "docs" / "workflow" / "history.jsonl"
    if not path.is_file():
        error("missing file: docs/workflow/history.jsonl")
        return
    last = None
    for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        try:
            event = json.loads(line)
        except json.JSONDecodeError as exc:
            error(f"history.jsonl line {number}: not valid JSON ({exc.msg})")
            continue
        missing = HISTORY_FIELDS - set(event)
        if missing:
            error(f"history.jsonl line {number}: missing fields {sorted(missing)}")
        if event.get("verdict") not in HISTORY_VERDICTS:
            error(f"history.jsonl line {number}: verdict {event.get('verdict')!r} is invalid")
        for field in ("from_stage", "to_stage"):
            value = event.get(field)
            if value is not None and value not in stage_order:
                error(f"history.jsonl line {number}: {field} {value!r} is not a stage")
        last = (number, event)

    if last and story and story != "null":
        number, event = last
        if event.get("story") != story:
            error(
                f"history.jsonl line {number}: last event is for {event.get('story')!r}, "
                f"but the active Story is {story!r}"
            )


def check_unrecorded_artifacts(story, artifacts, stages) -> None:
    """Warn about Story artifacts that no recorded stage run produced.

    A loop-back legitimately leaves artifacts for stages ahead of current_stage,
    but history.jsonl shows those stages ran. An artifact with no history event
    for its owning stage came from somewhere else: a pre-registry migration, or a
    hand-authored file. Downstream stages resolve their inputs by path and would
    read it as current output, so it is surfaced instead of silently trusted.

    A warning, not an error: the condition is legitimate (US-001 carries migrated
    artifacts) and failing on it would wedge the very workflow meant to replace
    them.
    """
    if not story or story == "null":
        return

    path = REPO / "docs" / "workflow" / "history.jsonl"
    if not path.is_file():
        return  # already reported by check_history

    ran: set[str] = set()
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue  # already reported by check_history
        if event.get("story") == story and event.get("skill"):
            ran.add(event["skill"])

    producer = {key: stage for stage, body in stages.items() for key in body.get("outputs", [])}

    for key, meta in sorted(artifacts.items()):
        if key in CROSS_STORY_ARTIFACTS or key == "story":
            continue
        pattern = meta["pattern"]
        if "{slug}" in pattern:
            continue  # not resolvable from the registry alone
        stage = producer.get(key)
        if stage is None:
            continue  # not the output of a stage (e.g. the archive summary)
        rel = pattern.replace("{story_id}", story)
        if not (REPO / rel).is_file():
            continue
        skill = stages[stage].get("skill")
        if skill and skill not in ran:
            warn(
                f"{rel}: exists, but history.jsonl records no run of {stage} "
                f"({skill}) for {story} - treat it as prior work and revise it, "
                f"do not read it as current output"
            )


def main() -> int:
    stage_map_text = read("docs/workflow/stage-map.yaml")
    artifact_text = read("docs/workflow/artifact-paths.yaml")
    if stage_map_text is None or artifact_text is None:
        print("harness: cannot validate, a registry file is missing", file=sys.stderr)
        return 1

    stage_order = read_stage_order(stage_map_text)
    stages = read_stages(stage_map_text)
    artifacts = read_artifacts(artifact_text)
    skills = check_skills()

    if not stages:
        error("stage-map.yaml: no stages parsed")
    if not artifacts:
        error("artifact-paths.yaml: no artifacts parsed")

    check_stage_map(stage_order, stages, artifacts, skills)
    check_artifacts(artifacts, stages)
    check_stages_doc(stage_order)
    check_retired(stage_order)
    story = check_state(stage_order, stages, artifacts)
    check_catalog(story)
    check_history(story, stage_order)
    check_unrecorded_artifacts(story, artifacts, stages)

    stage_skills = {s.get("skill") for s in stages.values() if s.get("skill")}
    for skill in sorted(skills - stage_skills - NON_STAGE_SKILLS):
        warn(f"skill {skill}: exists but no stage in stage-map.yaml routes to it")

    for message in warnings:
        print(f"warn  {message}")
    for message in errors:
        print(f"ERROR {message}", file=sys.stderr)

    if errors:
        print(
            f"\nharness: {len(errors)} error(s), {len(warnings)} warning(s)",
            file=sys.stderr,
        )
        return 1

    print(
        f"harness OK: {len(stage_order)} stages, {len(artifacts)} artifacts, "
        f"{len(skills)} skills, {len(warnings)} warning(s)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
