#!/usr/bin/env python3
"""PostToolUse gate: lint a source file immediately after it is edited.

Fast feedback layer. Runs ESLint on the single file that was just written, so an
architecture violation (AGENTS.md layering rules, enforced by eslint.config.js
`no-restricted-imports`) surfaces at the edit that caused it rather than at the
end of the turn.

Scope: TypeScript/JavaScript under src/ only. Everything else exits silently.
The slow checks (types, tests, formatting) belong to the Stop gate in
validate-full.py.

Contract:
  - clean file            -> exit 0, no output
  - lint failure          -> {"decision": "block", "reason": <eslint output>}
  - anything unexpected   -> exit 0 (a broken gate must not wedge the session;
                             the Stop gate is the authoritative one)
"""

import json
import subprocess
import sys
from pathlib import Path

WATCHED_TOOLS = {"Edit", "Write", "MultiEdit"}
SOURCE_SUFFIXES = {".ts", ".tsx", ".mts", ".cts", ".js", ".mjs", ".cjs"}
MAX_REASON_CHARS = 3000


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


def relative_source(root, raw):
    """Return the repo-relative path if it is a lintable source file, else None."""
    if not raw:
        return None
    try:
        rel = Path(raw).resolve().relative_to(root.resolve()).as_posix()
    except (ValueError, OSError):
        return None
    if not rel.startswith("src/"):
        return None
    if Path(rel).suffix not in SOURCE_SUFFIXES:
        return None
    return rel


def main():
    payload = json.load(sys.stdin)

    if (payload.get("tool_name") or "") not in WATCHED_TOOLS:
        return

    tool_input = payload.get("tool_input") or {}
    if not isinstance(tool_input, dict):
        return

    root = repo_root(payload)
    rel = relative_source(root, tool_input.get("file_path"))
    if rel is None:
        return

    eslint = root / "node_modules" / "eslint" / "bin" / "eslint.js"
    if not eslint.is_file():
        return  # dependencies not installed; nothing to enforce yet

    if not (root / rel).is_file():
        return  # file was moved or deleted after the edit

    result = subprocess.run(
        ["node", str(eslint), "--no-warn-ignored", rel],
        cwd=str(root),
        capture_output=True,
        text=True,
        timeout=120,
    )

    if result.returncode == 0:
        return

    output = (result.stdout + result.stderr).strip()
    print(
        json.dumps(
            {
                "decision": "block",
                "reason": (
                    f"ESLint failed on {rel}. Fix the violations before continuing "
                    f"(AGENTS.md: layering and import rules are enforced by "
                    f"eslint.config.js, not by review).\n\n"
                    + output[-MAX_REASON_CHARS:]
                ),
            }
        )
    )


if __name__ == "__main__":
    try:
        main()
    except Exception:
        pass  # a failing gate must never wedge the session
    sys.exit(0)
