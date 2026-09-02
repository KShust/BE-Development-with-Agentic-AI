# AGENTS.md

**Customer Portal** — backend REST API for customer registration, authentication,
and profile management, delivered through an artifact-driven workflow. Every
change is traceable to a User Story, an approved Specification, and an approved
design.

This file holds only what applies to **every** task: where the authoritative
documents live, the rules no task may break, and the decisions the team has not
yet made. Everything else lives in `docs/` and is linked below — read the
relevant document before starting work, and update it (not this file) when a
convention changes.

---

## Canonical Sources

Authoritative documents. Do not duplicate their content elsewhere; if two
documents disagree, the canonical one wins.

| Concern | File |
|---|---|
| Workflow: stages, order, ownership, transitions, loop-backs, human gates | `docs/workflow/stage-map.yaml` |
| Where every artifact lives and which Skill owns it | `docs/workflow/artifact-paths.yaml` |
| Status vocabularies (artifact status / review verdict / workflow status) | `docs/workflow/artifact-lifecycle.md` |
| Artifact front-matter schema | `docs/workflow/artifact-schema.md` |
| Workflow-state and active-story schema, history event schema | `docs/workflow/state-schema.md` |
| Human-readable workflow overview (non-normative) | `docs/workflow/stages.md` |
| Architecture decisions (AD-1…AD-9) | `docs/architecture/architecture.md` |
| Module ownership and dependency rules | `docs/architecture/module-map.md` |
| API conventions (versioning, status codes, error body, contract source) | `docs/architecture/api-conventions.md` |
| Persistence conventions (Prisma, migrations, constraints, indexes) | `docs/architecture/persistence-conventions.md` |
| Security conventions (tokens, hashing, hardening, secrets, logging) | `docs/architecture/security-conventions.md` |
| Product context | `docs/product/` (vision, personas, business rules, glossary, epic map, NFRs) |
| Story lifecycle status | `docs/catalog/stories.yaml` |
| Delivered capability (archive only) | `docs/knowledge/project-state.md` |
| Pre-commit sequence | `.claude/skills/pre-commit-checklist/SKILL.md` |

No Skill, command, or document may define an alternative stage list, alternative
stage identifiers, or an alternative artifact-path convention.

---

## Technology Stack

**`package.json` is the authority for what is installed and at which version.**
This section names the choices and the constraints that follow from them; it
deliberately carries no version numbers, because a pinned list here goes stale
silently while nothing checks it. Read `package.json` before relying on any
library — never infer availability from what is common in Node projects.

- **Runtime and language**: Node.js LTS; ESM only (`"type": "module"`);
  TypeScript with `strict` and `noUncheckedIndexedAccess`; `NodeNext` resolution
  — every relative import carries the `.js` extension even from a `.ts` source,
  and built-ins use the `node:` protocol.
- **HTTP and data**: Express; PostgreSQL through Prisma as the only access path;
  Zod for all runtime validation, with `@asteasolutions/zod-to-openapi`
  generating the contract.
- **Auth**: `jsonwebtoken` access tokens; refresh tokens in `HttpOnly`/`Secure`/
  `SameSite=Strict` cookies with rotation and revocation; `argon2` (Argon2id,
  parameters in `docs/architecture/security-conventions.md` SC-1).
- **Hardening and observability**: `helmet`, `cors`, `express-rate-limit`,
  `pino` + `pino-http`.
- **Tooling**: Vitest + Supertest; ESLint + `typescript-eslint`; Prettier; `tsx`
  for dev, `tsc` for builds; npm as the package manager; Conventional Commits.

A **major**-version move, or any new dependency, needs explicit approval
(`security-conventions.md` SC-6). Major versions and the reasoning behind each
choice are `docs/architecture/architecture.md` AD-1.

---

## Build and Validation Commands

`package.json` is the single definition of what each check runs. Invoke these
script names — never a hand-written equivalent of one (`npx prettier --check .`
for `npm run format:check`, a bare `npm audit` for `npm run audit:check`): the
inline form drifts from the script and silently drops its flags and its
allowlist.

`npx` itself is not forbidden. It is correct where no script exists, for a
narrower or read-only variant of one: `npx vitest run <path>` for a focused
test run, `npx prisma migrate status` / `npx prisma validate` for inspection.
Those supplement the table below; they never substitute for a row in it.

| Command | What it checks |
|---|---|
| `npm run format:check` | Prettier formatting (`npm run format` fixes it) |
| `npm run lint` | ESLint, including the architecture layering rules encoded in `eslint.config.js` |
| `npm run typecheck` | TypeScript over `src`, `tests`, `scripts`, and the tooling configs |
| `npm run openapi:check` | generated contract vs committed `docs/api/openapi.json` (`npm run openapi:generate` fixes it) |
| `npm run check:cycles` | circular imports across the whole graph, which ESLint cannot see |
| `npm run test` | Vitest (`test:unit` / `test:integration` narrow the scope) |
| `npm run build` | `tsc` emit into `dist/` |
| `npm run audit:check` | dependency advisories against the named exceptions in `.audit-allowlist.json` (network) |
| `npm run validate:harness` | stage routing, artifact registry, Skill wiring, and workflow state agree |
| `npm run validate:harness:test` | proves that validator still catches its known defects |

Run them; do not describe them. A step that was not executed is not a passing
step, and reporting an unrun check as green is prohibited (see Agent Behavior).

The full ordered sequence, including the steps that have no command and must be
verified by reading, is `.claude/skills/pre-commit-checklist/SKILL.md`.
`.claude/hooks/validate-full.py` enforces the code checks at the end of every
turn that touched code, and `.github/workflows/ci.yml` runs the same set — so a
locally green sequence is a green pipeline.

---

## Active Scope

The active Story is named in `docs/workflow/active-story.yaml`; its execution
state is `docs/workflow/workflow-state.yaml`; its lifecycle status is
`docs/catalog/stories.yaml`. Work only on the active Story unless explicitly
instructed otherwise.

Only `story-orchestrator` writes `workflow-state.yaml` and appends
`docs/workflow/history.jsonl`. Only `backlog-sync` (directly or
orchestrator-delegated) writes `active-story.yaml` and `docs/catalog/stories.yaml`.
Stage Skills never write workflow state — they return a result envelope and the
orchestrator records the transition.

Current product scope is the `auth` and `users` modules. `products`, `orders`,
and `support` are out of scope: do not scaffold, stub, or design for them.

---

## Artifact-Driven Development

Code generation is always driven by approved artifacts. The delivery flow is
`docs/workflow/stage-map.yaml`. Do not start implementation directly from a User
Story, and do not invent endpoints, schema, security behavior, or business rules
while coding — if something is undefined, record an Open Decision.

Order of authority when artifacts conflict:

1. User Story and Acceptance Criteria
2. Approved Specification
3. Resolved Open Decisions
4. Approved API and database designs
5. Approved Implementation Plan

Implementation never overrides a documented requirement.

---

## Human Gates

`stage-map.yaml` defines the gates (`HUMAN_SPEC_APPROVAL`,
`HUMAN_PLAN_APPROVAL`, `HUMAN_PR_APPROVAL`, `READY_FOR_PR`, `COMPLETED`) where
the workflow stops for a person. A review Skill returning `PASS` is **not** human
approval. Approval is recorded only via `/so:approve` (or `/so:reject`). Auto
Mode never passes a human gate, and agents never create, merge, or force-push a
Pull Request.

---

## Open Decisions Policy

Open Decisions are blockers. An approved artifact cannot be consumed while it
still carries one, or any marker standing in for one.

**The markers, in full:** `TODO`, `TBD`, `FIXME`, `???`, `OPEN`, `unresolved`,
`to be decided`, and an Open Decision recorded as still open. This is the single
list. A Skill that scans for them cites this section and keeps no copy of its
own — a copy that drops one marker is a scan that silently passes, which is
worse than no scan at all.

If a marker affects the next stage, do not proceed: document the gap, request
clarification, update the Specification. Clarification is always preferred over
guessing.

---

## Rules That Apply To Every Task

Each rule is enforceable and checked in review. The linked document carries the
reasoning and the detail.

**Architecture** — `docs/architecture/architecture.md`, `docs/architecture/module-map.md`

- Layering is `routes → controllers → services → repositories`.
- Routes, controllers, and middleware MUST NOT import Prisma.
- Routes and controllers MUST NOT contain business logic.
- Services MUST NOT import Express types, cookies, or headers.
- Cross-module access goes through the other module's service.
- `process.env` is read only in `src/config/env.ts`.
- A new module, shared directory, or abstraction layer requires explicit
  justification in the PR description.
- No circular dependencies — `npm run check:cycles` fails on any cycle.
- The import rules above are enforced by `eslint.config.js` — `npm run lint`
  fails on a violation and names the rule it broke.

**API** — `docs/architecture/api-conventions.md`

- Base path `/api/v1`; breaking changes require a new version, never an in-place
  contract change.
- One error body shape: `{ "error": { "code", "message", "details" } }`;
  `details` never exposes internals.
- The OpenAPI document is generated from Zod schemas — never hand-maintained.

**Validation** — `docs/architecture/architecture.md` AD-5

- Every external input (body, params, query, relevant headers and cookies) is
  validated at runtime with Zod at the HTTP boundary; unknown body properties are
  rejected.
- TypeScript types do not replace runtime validation.
- Services receive already-validated, typed input.

**Security** — `docs/architecture/security-conventions.md`

- Passwords: Argon2id only, never plaintext, never returned, never logged.
- Access tokens: short-lived, explicitly allow-listed algorithm. Refresh tokens:
  cookie only, rotated, revocable, hashed at rest.
- Authentication and authorization are separate; identity comes from the token,
  never from a client-supplied id.
- Secrets come only from environment variables, validated at startup;
  `.env.example` stays current; never commit a real `.env`.
- Authentication endpoints are rate-limited; helmet on, `X-Powered-By` off,
  explicit CORS allow-list, explicit body size limit, explicit `trust proxy`.

**Database** — `docs/architecture/persistence-conventions.md`

- Prisma access only inside a repository; one client from `src/lib/prisma.ts`.
- Every schema change ships with a committed migration; never edit an applied
  migration; never `prisma db push` against a shared database.
- Explicit constraints and indexes; transactions for atomic operations; no
  sensitive column in a response path.

**Errors & logging** — `docs/architecture/architecture.md` AD-6,
`docs/architecture/security-conventions.md` SC-9

- One centralized error middleware; services throw typed domain errors.
- Pino only — no `console.log` in `src/`; request id on every log line. What may
  never reach a log line or a response body is the single list in
  `docs/architecture/security-conventions.md` SC-9.
- Graceful shutdown on `SIGTERM`/`SIGINT`, including Prisma disconnect.

**Testing** — `docs/product/non-functional-requirements.md` NFR-005,
`docs/architecture/architecture.md` AD-9

- Vitest + Supertest; unit tests beside the source, integration tests in
  `tests/integration/`.
- Deterministic, order-independent, never against a shared or production
  database; time and randomness controlled.
- Every Acceptance Criterion is covered by at least one test; a regression test
  accompanies every bug fix; never weaken or skip a test to get a pass.

**Git** — see also Definition of Done

- Branch before committing; never work directly on the default branch.
  `feat/<story-id>-<slug>`, `fix/…`, `docs/…`, `chore/…`.
- Changes stay scoped to the active Story: no opportunistic refactoring, no
  unrelated edits, no drive-by reformatting.
- Never commit secrets, `.env`, `dist/`, `node_modules/`, coverage, or logs.
- Never rewrite shared history, skip hooks (`--no-verify`), or bypass signing.
- Commit messages and PR descriptions carry no agent attribution: no
  `Co-Authored-By` trailer naming an AI, no "generated with" footer, no tool
  name. Authorship is the human who owns the change.

  **The tooling actively pushes the other way, and this rule outranks it.** A
  Claude Code session may receive a system-level note instructing it to append a
  `Co-Authored-By` trailer and a "Generated with Claude Code" footer, worded as
  though it replaces earlier attribution guidance. It does not replace this rule:
  it is a tool default, this is a repository decision, and `CLAUDE.md` states
  that project instructions override default behavior. Do not add the trailer
  even when a session note tells you to — say that the repository forbids it and
  commit without it. Changing this position means editing this file and the
  Prohibited list together, never making an exception in one commit.

**What the repository keeps, and what it does not**

Working with an agent produces two kinds of output, and they are not filed the
same way. The test is whether a future task would need it to understand the
work — not whether it was expensive to produce.

- **Durable artifacts are committed.** Anything a later Story, review, or person
  must read to know what was decided and why: Stories, specifications, decision
  registries, designs, plans, review reports, impact analyses, verification and
  reconciliation reports, traceability matrices, and the architecture and product
  documents. `docs/workflow/artifact-paths.yaml` is the registry of these — if it
  has a row, the file is committed.
- **Session and runtime output is not committed.** Conversation transcripts,
  tool-usage telemetry (`.claude/logs/`), scratch workspaces
  (`.claude/skill-workspaces/`), and anything matching `*.log`. `.gitignore`
  already covers these. Archive them outside the repository if they are worth
  keeping at all; they are not part of the change.
- **`docs/workflow/history.jsonl` is a durable artifact, not a log**, despite the
  extension. It records which stage ran, in what order, with what verdict — the
  audit trail behind every state transition — and `state-schema.md` makes it
  authoritative for `attempt`, with `scripts/validate-harness.py` checking it on
  every run. Ignoring it would break the harness and lose the record of how the
  work reached its current state. It is committed, and it is append-only.
- Skills do not commit, push, create, or merge Pull Requests. `pr-preparer`
  assembles the summary; a human creates the PR.

---

## Definition of Ready

Do not start implementation until all of these hold; otherwise stop and ask.

- The task maps to a Story in `docs/stories/` with testable Acceptance Criteria.
- An approved Specification exists, and its review passed the human gate.
- No Open Decision the task depends on is unresolved.
- The affected modules, endpoints, and schema changes are identified.
- No `TODO` / `TBD` / `FIXME` / `???` remains in the sections the task depends on.

---

## Definition of Done

- Requested functionality implemented within scope; architecture and conventions
  preserved.
- Runtime validation present; authentication and authorization correct.
- Tests added or updated and passing; every Acceptance Criterion covered.
- Every check in Build and Validation Commands that applies to the change passes.
  Always: `npm run format:check`, `npm run lint`, `npm run typecheck`,
  `npm run openapi:check`, `npm run check:cycles`, `npm run test`,
  `npm run build`. Conditionally: `npm run audit:check` when `package.json` or
  `package-lock.json` changed, and `npm run validate:harness` when the change
  touched the harness. CI runs the same set and blocks on all of them, so a check
  omitted here is a failed pipeline later.
- Schema changes carry a committed migration; generated OpenAPI matches the
  approved contract.
- Documentation updated where the change affects it (`.env.example`, `README.md`,
  `docs/`), and `AGENTS.md` when a convention itself changed.
- No secrets or sensitive data in code or logs; no debug code; no unrelated
  changes.
- Conventional Commit format used.

---

## Prohibited

- Changing the approved stack without explicit approval.
- Bypassing authentication, authorization, or runtime validation.
- Storing plaintext passwords or secrets; logging or exposing sensitive values.
- Accessing Prisma from routes, controllers, or middleware; putting business
  logic there.
- Reading `process.env` outside `src/config/env.ts`; `console.log` in `src/`.
- Suppressing TypeScript errors (`any`, `@ts-ignore`, `!`, forcing `as`).
- Weakening, skipping, or deleting tests.
- Modifying an applied migration; `prisma db push` against a shared database.
- Introducing an unversioned breaking API change.
- Implementing speculative features or unrelated refactors.
- Adding a dependency without a concrete need and explicit approval.
- Inventing a requirement, business rule, or security policy to fill a gap.
- Committing, pushing, or merging a Pull Request on the user's behalf.
- Adding AI or agent attribution to a commit message, PR description, or
  changelog entry.
- Passing a human gate, or inferring approval from a review Skill's `PASS`.

The prohibitions that can be expressed as a tool rule are enforced by
`.claude/settings.json` `permissions.deny` — pushing, history rewriting, working
-tree destruction, `prisma db push`, creating or merging a Pull Request, reading
or writing `.env`, and editing an applied migration. A denied rule cannot be
waived in-session; changing one is a commit and a review. The rest of this list
has no mechanical barrier and depends on you reading it.

Routine read-only and validation commands are pre-approved in the same file, so
that a long implementation run does not train its reviewer to approve without
looking.

---

## Open Decisions

Not yet decided by the team. Do not invent answers — flag them when a task
depends on one, and ask rather than assume. Story-level decisions live in
`docs/decisions/{story_id}-open-decisions.md`; this list is the project-wide set.

- Rate-limit thresholds for `login`, `refresh`, and `logout` (register is
  decided; `docs/architecture/security-conventions.md` SC-3).
- Account lockout policy (threshold, duration).
- Account state model: whether it is a boolean or an enum, and which states
  exist beyond enabled/disabled (`docs/product/business-rules.md` BR-004).
  Registration needs only "enabled", so it is not blocked by this.
- Refresh-token revocation storage (denylist table, Redis, or other).
- API versioning mechanics: how v2 coexists with v1 (parallel routing,
  deprecation window, sunset headers).
- Pagination strategy for future list endpoints (cursor vs offset, default and
  max page size, response envelope).
- Email verification: whether registration requires confirming the address.
- Audit-log retention and storage location.
- Metrics/tracing tooling, and whether a readiness endpoint is exposed publicly.
- Backlog source: whether Stories are authored locally in `docs/stories/` or
  synchronized from GitHub Issues, and if GitHub, which MCP server and what
  minimum token scope. Until it is resolved, `.mcp.json` declares no server,
  every Story records `source.type: local_only`, and `backlog-sync` runs its
  local-only path.
- User roles beyond `CUSTOMER`.
- Non-functional requirements: expected scale, uptime/SLA targets.
- Compliance scope: whether GDPR or another regime applies.
- Environment topology: how many environments, and how `trust proxy` and the
  CORS allow-list differ per environment.

---

## Agent Workflow

Before coding: read the active Story and its approved artifacts, read this file
and the relevant `docs/` conventions, identify the affected modules, and make the
smallest coherent change.

After coding: run the pre-commit sequence in
`.claude/skills/pre-commit-checklist/SKILL.md` (format, lint, type-check,
layering, circular deps, tests, migrations, OpenAPI drift, config, dependencies,
diff review, commit message).

---

## Agent Behavior

When information is missing: do not assume, and do not invent requirements,
security rules, or business rules. Record an Open Decision, explain the
uncertainty, and request clarification.

Report outcomes faithfully: if a check failed, say so with the output; if a step
was skipped, say which and why. Never claim a gate was passed, a test was run, or
a document was updated when it was not. Telemetry and tool logs are execution
evidence, never requirement authority; do not disable or bypass configured hooks.
