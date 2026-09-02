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
from datetime import datetime, timedelta, timezone
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

# Allowance for clock skew when judging a timestamp "in the future". The defect
# this guards against is a hard-coded date - hours or days out, never seconds -
# so a few minutes of slack between the machine that wrote an artifact and the
# machine validating it costs nothing and stops a CI runner with a slightly slow
# clock from failing a correct tree.
CLOCK_SKEW_TOLERANCE = timedelta(minutes=5)

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


def parse_timestamp(value: str) -> datetime | None:
    """ISO-8601 -> aware datetime, or None when it does not parse.

    Everything the harness writes is UTC (`...Z`). A value with no offset is
    read as UTC rather than rejected: the schema asks for ISO-8601 and this
    script is not the place to litigate the shape, only whether the instant is
    possible.
    """
    text = value.strip().strip("\"'")
    if not text or text == "null":
        return None
    if text.endswith(("Z", "z")):
        text = text[:-1] + "+00:00"
    try:
        stamp = datetime.fromisoformat(text)
    except ValueError:
        return None
    if stamp.tzinfo is None:
        stamp = stamp.replace(tzinfo=timezone.utc)
    return stamp


def read_front_matter(path: Path) -> dict | None:
    """Front matter of a story-level Markdown artifact (artifact-schema.md).

    Returns the scalar fields plus `inputs`, a list of
    {path, version, assessed_version, assessment}. None when the file has no
    front-matter block at all - the Skill docs and templates that merely quote
    one are not artifacts and must not be read as such.
    """
    try:
        text = path.read_text(encoding="utf-8")
    except OSError:
        return None
    if not text.startswith("---"):
        return None
    end = text.find("\n---", 3)
    if end == -1:
        return None
    block = text[3:end]

    front: dict = {"inputs": []}
    entry: dict | None = None
    in_inputs = False
    folded_key: str | None = None

    for raw in block.splitlines():
        if not raw.strip() or raw.lstrip().startswith("#"):
            continue

        top = re.match(r"^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$", raw)
        if top:
            key, value = top.group(1), top.group(2).strip()
            in_inputs = key == "inputs"
            folded_key = None
            entry = None
            if not in_inputs:
                front[key] = value
            continue

        if not in_inputs:
            continue

        item = re.match(r"^\s*-\s+path:\s*(.+?)\s*$", raw)
        if item:
            entry = {"path": item.group(1).strip().strip("\"'"), "version": None}
            front["inputs"].append(entry)
            folded_key = None
            continue

        if entry is None:
            continue

        field = re.match(r"^\s+([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$", raw)
        if field:
            key, value = field.group(1), field.group(2).strip()
            if value in (">", "|", ">-", "|-"):
                entry[key] = ""
                folded_key = key
            else:
                entry[key] = value
                folded_key = None
            continue

        if folded_key is not None:
            entry[folded_key] = (entry[folded_key] + " " + raw.strip()).strip()

    return front


def as_int(value) -> int | None:
    try:
        return int(str(value).strip())
    except (TypeError, ValueError):
        return None


def story_artifact_files(story: str, artifacts: dict) -> dict[str, tuple[str, dict]]:
    """{relative path: (artifact key, front matter)} for the active Story.

    Only registry-resolvable Markdown artifacts that exist and carry front
    matter. `{slug}` patterns (the Story itself) are skipped: they are not
    resolvable from the registry alone, and artifact-schema.md exempts the Story
    from the produced-artifact block anyway.
    """
    found: dict[str, tuple[str, dict]] = {}
    for key, meta in sorted(artifacts.items()):
        if key in CROSS_STORY_ARTIFACTS:
            continue
        pattern = meta["pattern"]
        if "{slug}" in pattern or not pattern.endswith(".md"):
            continue
        rel = pattern.replace("{story_id}", story)
        path = REPO / rel
        if not path.is_file():
            continue
        front = read_front_matter(path)
        if front is not None:
            found[rel] = (key, front)
    return found


def read_scalars(text: str) -> dict[str, str]:
    """Top-level `key: value` pairs, comments and nesting ignored."""
    out: dict[str, str] = {}
    for raw in text.splitlines():
        if raw.startswith(("#", " ", "-")) or ":" not in raw:
            continue
        key, _, value = raw.partition(":")
        out[key.strip()] = value.split("#")[0].strip()
    return out


def gate_is_present(state_text: str) -> bool:
    """Whether workflow-state.yaml carries a `pending_human_gate` object.

    `read_scalars` ignores nesting, so the block-form mapping that
    `state-schema.md` prescribes reaches it as the empty string and would read
    as absent - which would make the human-gate check below unsatisfiable at
    every gate. Both spellings are accepted here: a value on the key's own line
    (`null`, or an inline mapping), or an indented block beneath it.
    """
    lines = state_text.splitlines()
    for index, line in enumerate(lines):
        if not line.startswith("pending_human_gate:"):
            continue
        inline = line.partition(":")[2].split("#")[0].strip()
        if inline:
            return inline != "null"
        for following in lines[index + 1 :]:
            if not following.strip():
                continue
            return following.startswith((" ", "\t"))
        return False
    return False


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
    has_gate = gate_is_present(state_text)
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


def check_artifact_timestamps(story, artifacts) -> None:
    """`updated_at` may not be ahead of the clock.

    artifact-schema.md requires `created_at` / `updated_at` to come from the
    system clock at runtime, and says in as many words that example dates in
    Skill docs are illustrative. A future `updated_at` is the signature of a
    hard-coded string copied out of a template: it makes the artifact look
    newer than anything written after it, and any ordering derived from
    timestamps is wrong from that point on.

    An error, not a warning: an artifact is revisable. Its owning stage re-runs,
    reads the clock, and the value is correct again.
    """
    if not story or story == "null":
        return

    now = datetime.now(timezone.utc)
    limit = now + CLOCK_SKEW_TOLERANCE

    for rel, (_key, front) in sorted(story_artifact_files(story, artifacts).items()):
        raw = front.get("updated_at")
        if not raw or raw == "null":
            continue
        stamp = parse_timestamp(raw)
        if stamp is None:
            error(f"{rel}: updated_at {raw!r} is not a parsable ISO-8601 timestamp")
            continue
        if stamp > limit:
            error(
                f"{rel}: updated_at {raw} is in the future "
                f"(now {now.strftime('%Y-%m-%dT%H:%M:%SZ')}) - "
                f"artifact-schema.md requires the runtime clock, not a copied example"
            )


def check_input_versions(story, artifacts, stages, stage_order) -> None:
    """`inputs[].version` must match the upstream artifact's current version.

    The staleness contract in artifact-schema.md: a downstream artifact records
    the version it read, and a mismatch against the upstream's current `version`
    means it was written from information that has since changed. The contract
    lets a stage rebut that presumption in place, with `assessed_version` (which
    must equal the upstream's current version) and a non-empty `assessment`
    saying why the change is not consumed here. Absent the rebuttal, the
    mismatch stands.

    An error, not a warning - **except where the workflow has already committed
    to re-running the stage that owns the stale artifact.** A loop-back revises
    an upstream artifact, which makes every downstream artifact that consumed it
    stale in the same instant; those stages have not re-run yet precisely
    because the workflow is on its way back to them. Neither remedy is reachable
    from inside the turn that creates the staleness: the orchestrator runs at
    most one stage per invocation, and no Skill may write an artifact another
    Skill owns. Failing there would make every loop-back end red with no
    available repair, which trains a reader to ignore the check - the same
    reasoning check_history_integrity gives for warning rather than failing.

    So the severity depends on where the owning stage sits relative to
    `current_stage` in `stage_order`:

    - **at or after `current_stage`** - the workflow reaches that stage before
      anything consumes its output again, so the staleness is pending, not
      unnoticed. A warning, which stays visible until the re-run clears it.
    - **before `current_stage`** - the workflow has moved past the stage that
      should have re-run, and the stale artifact is now feeding later stages.
      That is the case the contract exists for, and it stays an error.

    The rebuttal path is unchanged and still checked in full: `assessed_version`
    must equal the upstream's current version and carry a non-empty
    `assessment`, whatever stage owns the artifact.
    """
    if not story or story == "null":
        return

    producer = {
        key: stage for stage, body in stages.items() for key in body.get("outputs", [])
    }
    state_path = REPO / "docs" / "workflow" / "workflow-state.yaml"
    current_stage = None
    if state_path.is_file():
        current_stage = read_scalars(state_path.read_text(encoding="utf-8")).get(
            "current_stage"
        )
    current_index = stage_order.index(current_stage) if current_stage in stage_order else None

    known = story_artifact_files(story, artifacts)
    for rel, (key, front) in sorted(known.items()):
        for entry in front.get("inputs", []):
            upstream_rel = entry.get("path")
            if not upstream_rel or upstream_rel not in known:
                continue  # external input, or one this registry does not resolve
            upstream = known[upstream_rel][1]
            current = as_int(upstream.get("version"))
            recorded = as_int(entry.get("version"))
            if current is None or recorded is None:
                continue  # the Story artifact and other version-less inputs

            assessed = as_int(entry.get("assessed_version"))
            assessment = (entry.get("assessment") or "").strip()

            if assessed is not None:
                if not assessment:
                    error(
                        f"{rel}: inputs[{upstream_rel}] records assessed_version "
                        f"{assessed} with no assessment - artifact-schema.md requires "
                        f"the reason the change is not consumed here"
                    )
                if assessed <= recorded:
                    error(
                        f"{rel}: inputs[{upstream_rel}] assessed_version {assessed} "
                        f"is not later than the version read ({recorded}); it names "
                        f"the newer upstream version that was examined"
                    )
                if assessed != current:
                    error(
                        f"{rel}: inputs[{upstream_rel}] was assessed against version "
                        f"{assessed}, but {upstream_rel} is now at version {current} - "
                        f"the rebuttal is void and the input is stale again"
                    )
                continue

            if recorded != current:
                owning_stage = producer.get(key)
                pending = (
                    current_index is not None
                    and owning_stage in stage_order
                    and stage_order.index(owning_stage) >= current_index
                )
                if pending:
                    warn(
                        f"{rel}: inputs[{upstream_rel}] records version {recorded}, but "
                        f"{upstream_rel} is at version {current} - stale input. "
                        f"{owning_stage} has not re-run since, and the workflow is at "
                        f"{current_stage}, so the re-run is still ahead; this becomes an "
                        f"error if the workflow advances past {owning_stage} without it"
                    )
                else:
                    error(
                        f"{rel}: inputs[{upstream_rel}] records version {recorded}, but "
                        f"{upstream_rel} is at version {current} - stale input. Re-run the "
                        f"stage, or record assessed_version + assessment per "
                        f"artifact-schema.md"
                    )


def check_history_integrity(story, stages) -> None:
    """Timestamp ordering and transition legality across history.jsonl.

    Two invariants that nothing else enforces:

    - **Timestamps are possible, and do not go backwards.** No event may carry
      an instant ahead of the clock, and the log is append-only, so append order
      is real order: a later line carrying an earlier instant means one of the
      two events did not read the clock.
    - **Every transition is one stage-map.yaml allows**, and consecutive events
      chain (`to_stage` of one is `from_stage` of the next). A break in the
      chain is an event that was never appended: the log then shows two forward
      moves out of the same stage with no recorded move back.

    The allowed transitions are read from stage-map.yaml, never restated here -
    `next`, `on_approve`, `on_reject` and every `loop_back` target, plus a
    `BLOCKED` event holding at its own stage, which is what rule 4 of
    state-schema.md describes.

    **Warnings, not errors.** history.jsonl is append-only under state-schema.md
    and must not be rewritten, so a violation already in the log has no repair.
    Failing on one would wedge the harness permanently and the only way back
    would be to falsify the record - which is worse than the defect. A warning
    is permanent and visible, which is the honest outcome: the log says what
    happened, including the parts that went wrong.
    """
    path = REPO / "docs" / "workflow" / "history.jsonl"
    if not path.is_file():
        return  # already reported by check_history

    events: list[tuple[int, dict]] = []
    for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        try:
            events.append((number, json.loads(line)))
        except json.JSONDecodeError:
            continue  # already reported by check_history

    # --- timestamps are possible, and do not decrease ---------------------
    now = datetime.now(timezone.utc)
    limit = now + CLOCK_SKEW_TOLERANCE
    previous: tuple[int, datetime] | None = None
    for number, event in events:
        stamp = parse_timestamp(str(event.get("timestamp", "")))
        if stamp is None:
            warn(f"history.jsonl line {number}: timestamp {event.get('timestamp')!r} does not parse")
            continue
        if stamp > limit:
            warn(
                f"history.jsonl line {number}: timestamp {event['timestamp']} is in the "
                f"future (now {now.strftime('%Y-%m-%dT%H:%M:%SZ')}) - the run that wrote "
                f"it used a hard-coded string instead of the system clock"
            )
        if previous and stamp < previous[1]:
            warn(
                f"history.jsonl line {number}: timestamp {event['timestamp']} is earlier "
                f"than line {previous[0]} ({previous[1].strftime('%Y-%m-%dT%H:%M:%SZ')}); "
                f"an append-only log cannot go backwards in time"
            )
        previous = (number, stamp)

    # --- transitions are legal, and the chain is unbroken -----------------
    def allowed_from(stage: str) -> set[str]:
        body = stages.get(stage, {})
        targets = {body.get(f) for f in ("next", "on_approve", "on_reject")}
        targets |= set(body.get("loop_back", {}).values())
        return {t for t in targets if t}

    last_to: tuple[int, str] | None = None
    for number, event in events:
        if story and story != "null" and event.get("story") != story:
            continue
        source, target = event.get("from_stage"), event.get("to_stage")
        if not target:
            continue

        if source:
            if source not in stages:
                last_to = (number, target)
                continue  # check_history already reported the unknown stage
            legal = allowed_from(source)
            held = target == source and event.get("verdict") == "BLOCKED"
            if target not in legal and not held:
                warn(
                    f"history.jsonl line {number}: {source} -> {target} is not a "
                    f"transition stage-map.yaml defines for {source} "
                    f"(allowed: {', '.join(sorted(legal)) or 'none'})"
                )

            if last_to and last_to[1] != source:
                warn(
                    f"history.jsonl line {number}: starts at {source}, but line "
                    f"{last_to[0]} left the workflow at {last_to[1]} - an event "
                    f"recording the move {last_to[1]} -> {source} was never appended"
                )

        last_to = (number, target)


# --------------------------------------------------------------------------
# Not implemented: detecting one artifact transcribing another's state
#
# A specification that restates the decision registry's version or item count
# goes stale whenever the registry moves, through no change of its own - the
# defect that .claude/skills/spec-writer/references/spec-template.md
# ("Self-describing sections") now forbids. Catching it mechanically would mean
# reading prose for numbers and guessing which of them are claims about another
# artifact. Every version of that heuristic tried here matched requirement text
# that legitimately carries a number (a length bound, a status code, an id), and
# a check whose failures are mostly false is one people learn to ignore - which
# costs more than the check is worth.
#
# So this stays with spec-verifier, which reads the sentence and can tell a
# claim about the registry from a requirement. Its calibration rule is in
# .claude/skills/spec-verifier/SKILL.md ("Calibrating a defect in a
# self-describing section").
# --------------------------------------------------------------------------

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
    check_history_integrity(story, stages)
    check_artifact_timestamps(story, artifacts)
    check_input_versions(story, artifacts, stages, stage_order)
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
