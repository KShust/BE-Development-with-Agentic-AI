# CLAUDE.md

@AGENTS.md

---

**This file exists only to load `AGENTS.md` into every session. Do not put
project rules here.**

`AGENTS.md` is the canonical file for rules that apply to every task, and it is
written on the assumption that it is always in context — it says so in its own
opening lines. That assumption was false: a `/context` check on 2026-09-01
showed no memory-file category at all, so `AGENTS.md` was reaching an agent only
when a Skill happened to list it under its Inputs.

The visible cost of that gap was a copy of the technology stack that had grown
inside `.claude/skills/express-implementor/SKILL.md` — a symptom of the
implementer not knowing the stack, treated by duplicating it rather than by
fixing the load.

If you add rules, add them to `AGENTS.md`. If this file ever grows a second
section, that is the bug.

**Verifying it works:** run `/context` in a fresh session. A memory-file entry of
roughly 4k tokens should appear. If it does not, this import is not being
honored by the installed Claude Code version — say so rather than pasting
`AGENTS.md` content here, because two copies is the failure mode this whole
repository is organized against.
