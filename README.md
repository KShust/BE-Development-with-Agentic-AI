# Customer Portal

Backend REST API for customer registration, authentication, and profile
management, built with Node.js, TypeScript, Express 5, Prisma, and PostgreSQL.

## Status

Scaffold only — directory structure and empty module files for `auth` and
`users`. No business logic, routes, migrations, or tests yet. See
[docs/knowledge/project-state.md](docs/knowledge/project-state.md) for what is
actually delivered.

## Getting started

```bash
npm install
cp .env.example .env   # fill in the values
npm run dev
```

`npm run prisma:generate` and `npm run prisma:migrate` only work once
`prisma/schema.prisma` has a real datasource and models — it is still a
placeholder.

Day-to-day scripts: `npm run dev`, `npm run build`, `npm start`,
`npm run format`.

The **validation** commands — what must pass before a change is done — are listed
once, in `AGENTS.md` "Build and Validation Commands". This file does not keep a
second copy; a shorter one here would read as permission to run less.

`npm run typecheck` uses `tsconfig.typecheck.json`, which covers `src`, `tests`,
and the tooling configs; `npm run build` uses `tsconfig.json`, which compiles
`src` only and excludes test files from `dist/`.

## How work is done here

Changes are delivered through an artifact-driven workflow: a User Story becomes a
Specification, a design, a plan, tests, and only then code — with human approval
gates along the way.

| What you need | Where it lives |
|---|---|
| Rules that apply to every task, and the Open Decisions registry | [AGENTS.md](AGENTS.md) |
| Workflow stages, ownership, and routing | [docs/workflow/stage-map.yaml](docs/workflow/stage-map.yaml) |
| Human-readable workflow overview | [docs/workflow/stages.md](docs/workflow/stages.md) |
| Where every artifact lives | [docs/workflow/artifact-paths.yaml](docs/workflow/artifact-paths.yaml) |
| Architecture, API, persistence, and security conventions | [docs/architecture/](docs/architecture/) |
| Product context (vision, personas, business rules, NFRs) | [docs/product/](docs/product/) |
| Stories and their status | [docs/stories/](docs/stories/), [docs/catalog/stories.yaml](docs/catalog/stories.yaml) |

Workflow commands: `/so:status`, `/so:start <StoryId>`, `/so:next`,
`/so:approve`, `/so:reject`, `/so:archive`.

### GitHub integration

Not enabled, **and whether to enable it is an open question, not a pending
chore.** `AGENTS.md` Open Decisions holds it: whether Stories are authored
locally in `docs/stories/` or synchronized from GitHub Issues, and if GitHub,
which MCP server and what minimum token scope. A human resolves that; nothing
below is a decision that has been taken.

Today the backlog is local: the files under `docs/stories/` are authoritative,
`source.type` is `local_only`, and `backlog-sync` returns `PASS` with a note that
no remote source is configured. `reconciliation-reviewer` skips its source-Issue
comparison. Nothing else in the workflow depends on GitHub.

The rest of this section is **reference material for whoever resolves that
decision** — a worked example of one option, kept here so the token-scope
analysis is not redone from scratch. It is not a recommendation and not an
instruction to follow now. Should the decision land on GitHub Issues with
[github-mcp-server](https://github.com/github/github-mcp-server), the
configuration would be:

```json
{
  "mcpServers": {
    "github": {
      "command": "<absolute path to github-mcp-server>",
      "args": ["stdio", "--toolsets", "context,issues,pull_requests"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}" }
    }
  }
}
```

Scope the token, not just the toolsets. `--toolsets` limits which tools exist;
it does not limit what they may do, and the server's `--read-only` flag is
all-or-nothing. The intended split — write to Issues, read everything else —
comes from the token itself. Use a **fine-grained** personal access token,
limited to this repository:

| Permission | Access | Why |
|---|---|---|
| Issues | Read and write | `backlog-sync` keeps Issue and Story in step |
| Pull requests | Read-only | agents never create, merge, or force-push a PR (AGENTS.md) |
| Contents | Read-only | the local working tree is the source of truth for code |
| Metadata | Read-only | required by the GitHub API |

Verify the flag names against the version of `github-mcp-server` you install,
and set `GITHUB_PERSONAL_ACCESS_TOKEN` in the environment — never in a committed
file.

Until the Open Decision is resolved, leave `.mcp.json` as `{"mcpServers": {}}`.

Before committing, run the sequence in
[.claude/skills/pre-commit-checklist/SKILL.md](.claude/skills/pre-commit-checklist/SKILL.md).
[CI](.github/workflows/ci.yml) runs the same checks on every push to
`main`/`master` and on every pull request.
