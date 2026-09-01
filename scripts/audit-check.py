#!/usr/bin/env python3
"""Turns `npm audit` into a gate with named, dated exceptions.

`npm audit` on its own is all-or-nothing: either every finding fails the build,
or -- the usual outcome -- the step is marked advisory and stops blocking
anything at all, including the critical vulnerability that arrives next year.

This sits in between. Every high or critical advisory must be listed in
.audit-allowlist.json with a reason and a review date. Anything else fails.

It also fails when a listed advisory has disappeared. That is good news, not a
defect: the upstream fix landed, and the exception must go rather than sit there
silently covering advisories nobody has looked at.

Network-bound, so this is a CI and pre-commit step, not a Stop-hook check.

Exit: 0 = every high/critical advisory is accounted for, 1 = it is not.
"""

import json
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
ALLOWLIST = REPO / ".audit-allowlist.json"
BLOCKING = {"high", "critical"}


def npm_audit() -> dict:
    """Run `npm audit --json`. A non-zero exit just means findings exist."""
    result = subprocess.run(
        "npm audit --json",
        cwd=str(REPO),
        shell=True,
        capture_output=True,
        text=True,
        timeout=300,
    )
    if not result.stdout.strip():
        print(f"audit: npm produced no report.\n{result.stderr.strip()}", file=sys.stderr)
        raise SystemExit(1)
    return json.loads(result.stdout)


def advisories(report: dict) -> dict[str, dict]:
    """Collect the root advisories, keyed by GHSA id.

    npm reports one entry per affected package, so a single advisory reaching
    three packages in a chain shows up three times. Only the originating entry
    carries the advisory metadata (`via` holds an object rather than a package
    name), so keying on the URL collapses the chain back to one finding.
    """
    found: dict[str, dict] = {}
    for name, entry in report.get("vulnerabilities", {}).items():
        for via in entry.get("via", []):
            if not isinstance(via, dict):
                continue  # transitive: points at another package, not an advisory
            if via.get("severity") not in BLOCKING:
                continue
            ghsa = str(via.get("url", "")).rstrip("/").rsplit("/", 1)[-1]
            if not ghsa:
                continue
            found.setdefault(
                ghsa,
                {
                    "package": via.get("name", name),
                    "severity": via.get("severity"),
                    "title": via.get("title", ""),
                    "url": via.get("url", ""),
                },
            )
    return found


def main() -> int:
    if not ALLOWLIST.is_file():
        print(f"audit: missing {ALLOWLIST.name}", file=sys.stderr)
        return 1

    accepted = {
        entry["id"]: entry
        for entry in json.loads(ALLOWLIST.read_text(encoding="utf-8")).get("accepted", [])
    }
    found = advisories(npm_audit())

    unexpected = sorted(set(found) - set(accepted))
    stale = sorted(set(accepted) - set(found))

    for ghsa in sorted(set(found) & set(accepted)):
        print(f"audit: accepted {ghsa} ({found[ghsa]['package']}) - {accepted[ghsa]['reviewed']}")

    if unexpected:
        print("\naudit: high/critical advisories that nobody has accepted:", file=sys.stderr)
        for ghsa in unexpected:
            item = found[ghsa]
            print(
                f"  {ghsa}  {item['severity']:8}  {item['package']}\n"
                f"      {item['title']}\n      {item['url']}",
                file=sys.stderr,
            )
        print(
            "\nFix the dependency, or record the risk in .audit-allowlist.json with a\n"
            "reason and a review date. Do not add an entry to silence the build.",
            file=sys.stderr,
        )

    if stale:
        print("\naudit: accepted advisories that no longer appear:", file=sys.stderr)
        for ghsa in stale:
            print(f"  {ghsa} ({accepted[ghsa].get('package', '?')})", file=sys.stderr)
        print(
            "\nThe upstream fix landed. Remove the entry from .audit-allowlist.json so\n"
            "the list keeps covering only risks someone has actually reviewed.",
            file=sys.stderr,
        )

    if unexpected or stale:
        return 1

    print(f"audit: no unaccepted high/critical advisories ({len(found)} accepted).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
