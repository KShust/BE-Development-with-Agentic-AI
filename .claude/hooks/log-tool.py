#!/usr/bin/env python3
"""PostToolUse telemetry hook for the Customer Portal repo.

Appends one metadata-only JSON line per tool call to .claude/logs/tool-usage.jsonl.

Design rules (AGENTS.md, docs/architecture/security-conventions.md SC-9):
  - metadata only: tool, category, coarse action, sizes, success — never the
    tool input or output body, never a command line, never a file's content;
  - fail open: a telemetry problem must never break the tool call, so every
    failure path exits 0 silently;
  - the log is execution evidence, never requirement authority.

Wire it up in .claude/settings.local.json:

    "hooks": {
      "PostToolUse": [
        { "matcher": "*",
          "hooks": [ { "type": "command",
                       "command": "python .claude/hooks/log-tool.py" } ] }
      ]
    }
"""

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

MAX_LOG_BYTES = 5 * 1024 * 1024

# Bash commands are classified by their leading tokens only. The command text
# itself is never written to the log: it can carry connection strings, tokens,
# or heredoc file content.
BASH_ACTIONS = (
    ("npm run typecheck", "typecheck"),
    ("npm run lint", "lint"),
    ("npm run format", "format"),
    ("npm run build", "build"),
    ("npm run test", "test"),
    ("npm test", "test"),
    ("npx vitest", "test"),
    ("vitest", "test"),
    ("npm run prisma", "prisma"),
    ("npx prisma", "prisma"),
    ("prisma", "prisma"),
    ("npm audit", "audit"),
    ("npm install", "install"),
    ("npm ci", "install"),
    ("git status", "git-read"),
    ("git diff", "git-read"),
    ("git log", "git-read"),
    ("git show", "git-read"),
    ("git ls-files", "git-read"),
    ("git add", "git-write"),
    ("git commit", "git-write"),
    ("git checkout", "git-write"),
    ("git branch", "git-write"),
    ("git push", "git-remote"),
    ("git pull", "git-remote"),
    ("gh ", "github-cli"),
)

# Repo areas worth distinguishing when a tool touches a file.
AREAS = (
    ("docs/workflow", "workflow-state"),
    ("docs/stories", "story"),
    ("docs/specifications", "specification"),
    ("docs/reviews", "review"),
    ("docs/designs", "design"),
    ("docs/plans", "plan"),
    ("docs/tests", "test-artifact"),
    ("docs/evidence", "evidence"),
    ("docs/verification", "verification"),
    ("docs/decisions", "open-decisions"),
    ("docs/architecture", "architecture-doc"),
    ("docs/product", "product-doc"),
    ("docs", "docs"),
    ("prisma", "prisma"),
    ("tests", "tests"),
    ("src/modules", "module"),
    ("src/middleware", "middleware"),
    ("src/lib", "lib"),
    ("src/config", "config"),
    ("src", "src"),
    (".claude/skills", "skill"),
    (".claude", "agent-config"),
)

SENSITIVE_PATH = re.compile(r"(^|[\\/])\.env|secret|credential|\.pem$|\.key$", re.I)


def repo_root(payload):
    """Resolve the project root.

    Derived from this file's own location, never from the payload `cwd`: the
    shell's working directory can drift during a session, and a hook that
    resolves paths against a drifted cwd writes to (or validates) the wrong
    tree. `cwd` is only a fallback for an unexpected layout.
    """
    root = Path(__file__).resolve().parents[2]
    if (root / ".claude").is_dir():
        return root
    cwd = payload.get("cwd")
    if cwd and Path(cwd).is_dir():
        return Path(cwd)
    return root


def classify_bash(command):
    stripped = " ".join(str(command).split()).lower()
    for prefix, action in BASH_ACTIONS:
        if stripped.startswith(prefix):
            return action
    head = stripped.split(" ", 1)[0]
    # keep only a bare executable name, never arguments
    return head if re.fullmatch(r"[a-z0-9._-]{1,20}", head or "") else "other"


def classify_tool(tool_name, tool_input):
    if tool_name.startswith("mcp__github__"):
        return "github", None
    if tool_name.startswith("mcp__Claude_Browser__") or tool_name.startswith(
        "mcp__claude-in-chrome__"
    ):
        return "browser", None
    if tool_name.startswith("mcp__"):
        parts = tool_name.split("__")
        return "mcp", parts[1] if len(parts) > 2 else None
    if tool_name in ("Bash", "PowerShell"):
        return "shell", classify_bash(tool_input.get("command", ""))
    if tool_name in ("Read", "Write", "Edit", "NotebookEdit"):
        return "file", tool_name.lower()
    if tool_name in ("Grep", "Glob"):
        return "search", tool_name.lower()
    if tool_name in ("WebSearch", "WebFetch"):
        return "web", tool_name.lower()
    if tool_name in ("Agent", "Task", "Skill"):
        return "delegation", tool_name.lower()
    return "other", None


def classify_area(root, tool_input):
    raw = tool_input.get("file_path") or tool_input.get("path") or ""
    if not raw:
        return None, False
    try:
        rel = Path(raw).resolve().relative_to(root.resolve()).as_posix()
    except (ValueError, OSError):
        rel = str(raw).replace("\\", "/")
    sensitive = bool(SENSITIVE_PATH.search(rel))
    for prefix, area in AREAS:
        if rel.startswith(prefix):
            return area, sensitive
    return "other", sensitive


def byte_size(value):
    try:
        return len(json.dumps(value, ensure_ascii=False, default=str).encode("utf-8"))
    except (TypeError, ValueError):
        return 0


def main():
    payload = json.load(sys.stdin)

    tool_name = payload.get("tool_name") or payload.get("tool") or "UNKNOWN"
    tool_input = payload.get("tool_input") or payload.get("inputs") or {}
    tool_response = payload.get("tool_response", payload.get("response"))
    if not isinstance(tool_input, dict):
        tool_input = {}

    root = repo_root(payload)
    category, action = classify_tool(tool_name, tool_input)
    area, sensitive = classify_area(root, tool_input)

    success = None
    if isinstance(tool_response, dict):
        for key in ("success", "is_error", "error"):
            if key in tool_response:
                success = not bool(tool_response[key]) if key != "success" else bool(
                    tool_response[key]
                )
                break

    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "session": str(payload.get("session_id", ""))[:8] or None,
        "tool": tool_name,
        "category": category,
        "action": action,
        "area": area,
        "touched_sensitive_path": sensitive or None,
        "input_keys": sorted(tool_input.keys())[:12],
        "input_bytes": byte_size(tool_input),
        "response_bytes": byte_size(tool_response),
        "success": success,
    }
    entry = {k: v for k, v in entry.items() if v is not None}

    log_file = root / ".claude" / "logs" / "tool-usage.jsonl"
    log_file.parent.mkdir(parents=True, exist_ok=True)

    if log_file.exists() and log_file.stat().st_size > MAX_LOG_BYTES:
        log_file.replace(log_file.with_suffix(".jsonl.1"))

    with open(log_file, "a", encoding="utf-8") as handle:
        handle.write(json.dumps(entry, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    try:
        main()
    except Exception:  # telemetry must never break a tool call
        pass
    sys.exit(0)
