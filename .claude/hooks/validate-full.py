#!/usr/bin/env python3
"""Stop gate: the full validation sequence must pass before a turn may end.

This is the deterministic gate behind the Definition of Done in AGENTS.md.
AGENTS.md "Build and Validation Commands" is the single list of what runs; this
hook is what makes it enforceable instead of advisory. A turn cannot be declared
finished while any applicable check fails.

Three scopes, selected from the working tree:
  - code touched         -> the always-on checks
  - harness touched      -> npm run validate:harness
  - dependencies touched -> npm run audit:check (needs the network; CI blocks on
                            it too, so skipping it locally only defers failure)

The npm scripts are invoked by name on purpose: package.json stays the single
definition of what each check actually runs.

Scope guard: the harness writes far more documents than code. If the working
tree shows no change under src/, prisma/, tests/, or the build configuration,
there is nothing for this gate to verify and it exits immediately.

Contract:
  - nothing to check / all pass -> exit 0, no output
  - a check fails               -> {"decision": "block", "reason": <output>}
  - already blocked once        -> exit 0 (stop_hook_active; no loops)
"""

import json
import subprocess
import sys
from pathlib import Path

# Ordered: cheapest and most localized failure first.
CHECKS = (
    ("format", "npm run format:check", "Formatting differs from Prettier."),
    ("lint", "npm run lint", "ESLint failed (this includes the architecture layering rules)."),
    ("typecheck", "npm run typecheck", "TypeScript type-check failed."),
    (
        "openapi",
        "npm run openapi:check",
        "The committed OpenAPI document no longer matches the Zod schemas.",
    ),
    (
        "cycles",
        "npm run check:cycles",
        "Circular imports detected (architecture.md AD-2, module-map.md).",
    ),
    ("test", "npm run test", "Tests failed."),
    # A type-check is not a build: tsconfig.json emits and uses a different
    # rootDir, so it catches what only emission catches.
    ("build", "npm run build", "The build failed."),
)

CODE_PREFIXES = ("src/", "prisma/", "tests/")

# A dependency change is the one thing CI blocks on that the always-on checks
# cannot see: an advisory against a package nothing imports yet still fails
# `npm run audit:check`. Scoped to the two files that can cause it, because the
# check needs the network and has no business running on an ordinary code edit.
DEPS_FILES = ("package.json", "package-lock.json")
DEPS_CHECK = (
    "npm run audit:check",
    "A dependency advisory is not accepted in .audit-allowlist.json "
    "(security-conventions.md SC-6).",
)

# Editing the harness can break stage routing, the artifact registry, or the
# workflow state without touching a line of application code. Those files get
# their own scope guard and their own validator.
HARNESS_PREFIXES = (
    "docs/workflow/",
    "docs/catalog/",
    "docs/stories/",
    ".claude/skills/",
    ".claude/commands/",
)
HARNESS_CHECK = (
    "npm run validate:harness",
    "The agentic harness is structurally inconsistent.",
)
CODE_FILES = (
    # A hand-edit of the generated contract is prohibited (api-conventions.md
    # AC-10); listing it here means such an edit triggers the gate that rejects it.
    "docs/api/openapi.json",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "tsconfig.typecheck.json",
    "eslint.config.js",
    "vitest.config.ts",
    ".prettierrc.json",
    ".prettierignore",
)

MAX_REASON_CHARS = 4000
CHECK_TIMEOUT_SECONDS = 240


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


def changed_paths(root):
    """Repo-relative paths with uncommitted changes, or None when git cannot say.

    None means "unknown", and every caller treats unknown as "run the checks":
    skipping a gate is the dangerous direction, running one unnecessarily costs
    a few seconds.
    """
    try:
        result = subprocess.run(
            ["git", "status", "--porcelain", "--untracked-files=all"],
            cwd=str(root),
            capture_output=True,
            text=True,
            timeout=60,
        )
    except Exception:
        return None
    if result.returncode != 0:
        return None

    paths = []
    for line in result.stdout.splitlines():
        path = line[3:].strip().strip('"')
        # rename entries look like "old -> new"; the destination is what matters
        if " -> " in path:
            path = path.split(" -> ", 1)[1]
        paths.append(path)
    return paths


def touched_code(paths):
    if paths is None:
        return True
    return any(p.startswith(CODE_PREFIXES) or p in CODE_FILES for p in paths)


def touched_harness(paths):
    if paths is None:
        return True
    return any(p.startswith(HARNESS_PREFIXES) for p in paths)


def touched_deps(paths):
    if paths is None:
        return True
    return any(p in DEPS_FILES for p in paths)


def block(reason):
    print(json.dumps({"decision": "block", "reason": reason}))
    sys.exit(0)


def main():
    payload = json.load(sys.stdin)

    # Second invocation after this gate already blocked once: let the turn end.
    if payload.get("stop_hook_active"):
        return

    root = repo_root(payload)

    if not (root / "node_modules").is_dir():
        return  # dependencies not installed; nothing to enforce yet

    paths = changed_paths(root)
    selected = []
    if touched_harness(paths):
        selected.append(("harness", *HARNESS_CHECK))
    if touched_code(paths):
        selected.extend(CHECKS)
    if touched_deps(paths):
        selected.append(("audit", *DEPS_CHECK))
    if not selected:
        return

    for name, command, headline in selected:
        try:
            result = subprocess.run(
                command,
                cwd=str(root),
                shell=True,
                capture_output=True,
                text=True,
                timeout=CHECK_TIMEOUT_SECONDS,
            )
        except subprocess.TimeoutExpired:
            block(
                f"`{command}` did not finish within {CHECK_TIMEOUT_SECONDS}s and was "
                f"killed. Investigate before reporting this work as done."
            )

        if result.returncode != 0:
            output = (result.stdout + result.stderr).strip()
            block(
                f"{headline}\n\n"
                f"Failing command: `{command}` (exit {result.returncode}).\n"
                f"This is the Definition of Done gate in AGENTS.md — fix the failure, "
                f"do not weaken or skip the check, and do not report the task as "
                f"complete until it passes.\n\n"
                + output[-MAX_REASON_CHARS:]
            )


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # surface, never silently pass a gate
        print(
            json.dumps(
                {
                    "decision": "block",
                    "reason": (
                        "The Stop validation gate (.claude/hooks/validate-full.py) "
                        f"failed to run: {type(exc).__name__}: {exc}. "
                        "Validation status is therefore UNKNOWN — run "
                        "`npm run format:check && npm run lint && npm run typecheck "
                        "&& npm run test` manually and report the real result."
                    ),
                }
            )
        )
    sys.exit(0)
