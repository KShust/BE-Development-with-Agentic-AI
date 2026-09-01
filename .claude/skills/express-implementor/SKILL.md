---
name: express-implementor
description: >
  Implements an approved User Story in the Customer Portal Node/TypeScript
  Express API by following the approved Specification, API and database
  designs, Impact Analysis, Implementation Plan, tests, architecture rules,
  and security constraints. Use only after the plan is approved and required
  tests or test specifications are available.
---

# Purpose

Implement the active User Story in the Customer Portal Node/TypeScript project.

The Skill converts approved delivery artifacts into a minimal, scoped, and
reviewable set of code and configuration changes.

The Skill must follow the approved Implementation Plan.

The Skill must not redesign the Story, silently resolve Open Decisions,
introduce unrelated improvements, or reinterpret Acceptance Criteria.

The Skill produces an implementation candidate.

The Skill does not approve its own work and does not declare the Story
complete.

---

# Technology Context

The stack is `AGENTS.md` "Technology Stack" and `docs/architecture/architecture.md`
AD-1. **Read them there** — this Skill deliberately keeps no copy, because two
lists drift and neither says which one is current.

Two consequences matter enough to repeat here, because they change what you
type rather than what you choose:

- Every relative import carries the `.js` extension, even from a `.ts` source
  (`NodeNext`). Built-ins use the `node:` protocol.
- Express 5 forwards a rejected promise from an async handler to the error
  middleware by itself. Do not wrap handlers in `try/catch` to build error
  responses.

Before using any library, confirm it is actually in `package.json`. Do not
assume one is available because it is common in Node or Express projects.

---

# When To Use

Use this Skill when:

- an active User Story is configured;
- the User Story has an approved Specification;
- relevant API and persistence designs exist;
- Impact Analysis is ready for planning;
- the Implementation Plan is approved;
- required test artifacts or failing tests are available;
- implementation work has not yet been completed;
- the workflow state allows implementation.

Typical requests:

- Implement the approved plan for the active User Story.
- Execute the implementation for the active Story (for example,
  "implement US-014").
- Implement the current Story using the approved artifacts.
- Continue implementation from the current workflow state.
- Apply the approved implementation plan for the Express API.

---

# When Not To Use

Do not use this Skill:

- directly from an unclarified User Story;
- when the Specification is missing or rejected;
- when Open Decisions remain unresolved;
- before API or database design is completed when relevant;
- before Impact Analysis;
- before Plan Review approval;
- to create or revise product requirements;
- to create system-level architecture;
- to create speculative abstractions;
- to perform unrelated refactoring;
- to approve implementation;
- to create or merge a Pull Request;
- to change GitHub Issue status automatically;
- to bypass failing tests or validation gates.

---

# Active Scope

Read:

- docs/workflow/active-story.yaml
- docs/workflow/workflow-state.yaml

Determine:

- active Story ID;
- current workflow stage;
- approved artifact versions;
- current implementation attempt;
- current branch when recorded;
- expected next workflow stage.

Work only on the active User Story.

If no active Story is configured, stop and report:

IMPLEMENTATION_BLOCKED: No active User Story is configured.

If the workflow stage does not permit implementation, stop and report:

IMPLEMENTATION_BLOCKED: Current workflow stage does not allow implementation.

Do not select another Story automatically.

---

# Canonical Sources

- Workflow / stage / loop-back keys: `docs/workflow/stage-map.yaml`
  (`IMPLEMENTATION`; loop_back keys `partial` → `IMPLEMENTATION`,
  `blocked_by_plan` → `IMPLEMENTATION_PLANNING`).
- Artifact paths: `docs/workflow/artifact-paths.yaml` — **authoritative**.
  Resolve every path from its registry key. Paths shown are illustrative.
- Status vocabulary: `docs/workflow/artifact-lifecycle.md`.
- Front matter: `docs/workflow/artifact-schema.md`.

# Canonical Input Artifacts

Read AGENTS.md first. Read `docs/workflow/active-story.yaml` and
`docs/workflow/workflow-state.yaml` (read only — never write them).

Read (registry keys, resolved via `artifact-paths.yaml`):

- `story`
- `specification`, `specification_review`
- `impact_analysis`
- `implementation_plan`, `plan_review`
- `api_design`, `openapi`  (or their `NOT_APPLICABLE` record)
- `database_design`, `entity_model`  (or their `NOT_APPLICABLE` record)
- `design_review`
- `test_strategy`, `ac_test_matrix`  (+ the executable tests: `*.test.ts`
  beside the modules they cover, and `tests/integration/`)
- `open_decisions`

Read architecture references:

- docs/architecture/architecture.md
- docs/architecture/module-map.md
- docs/architecture/api-conventions.md
- docs/architecture/persistence-conventions.md
- docs/architecture/security-conventions.md

Read product constraints:

- docs/product/business-rules.md
- docs/product/business-glossary.md
- docs/product/non-functional-requirements.md

Read Story decisions when present:

- docs/decisions/<StoryId>*.md

Do not load unrelated product or historical artifacts unless needed to resolve
a concrete dependency.

---

# Artifact Authority

Use the following authority order:

1. Active User Story and Acceptance Criteria
2. Approved Specification
3. Approved API and persistence designs
4. Resolved Story decisions
5. Approved Impact Analysis
6. Approved Implementation Plan
7. Architecture and project conventions
8. Existing implementation patterns

Existing code does not override approved requirements.

The Implementation Plan does not override the Specification.

The Specification does not override the original Acceptance Criteria unless
the change was explicitly approved and traceable.

If authoritative artifacts conflict, stop and report the conflict.

Do not choose one interpretation silently.

---

# Preconditions

## User Story

The active User Story must exist.

Acceptance Criteria must be present and identifiable.

## Specification

`specification` must exist (current, not `SUPERSEDED`). `specification_review`
verdict must be `PASS` and `HUMAN_SPEC_APPROVAL` recorded.

Do not proceed when the review verdict is `CHANGES_REQUIRED` / `BLOCKED` /
missing.

## Design

`design_review` verdict must be `PASS`. Relevant design artifacts
(`api_design` / `openapi` / `database_design` / `entity_model`) must exist or be
recorded `NOT_APPLICABLE`. Explicit security requirements are required when the
Story changes authentication, authorization, credentials, roles, account state,
or sensitive data.

## Impact Analysis

`impact_analysis` must exist with verdict `PASS` (current version).

## Implementation Plan

`implementation_plan` must exist. `plan_review` verdict must be `PASS`.
**`HUMAN_PLAN_APPROVAL` must be recorded** in `workflow-state.yaml`. Do not
implement a plan whose review is `CHANGES_REQUIRED` / `BLOCKED`, or one that has
not passed the human gate.

## Tests

`test_strategy`, `ac_test_matrix`, and the executable tests (`*.test.ts`
beside the source, plus `tests/integration/`) must exist (`TEST_WRITING` completed). If failing behavior tests were not
created, return `verdict: CHANGES_REQUIRED` with `loop_back_stage:
IMPLEMENTATION_PLANNING` only if the plan is at fault; otherwise this is an
orchestration error — return `BLOCKED`.

## Staleness

Record every consumed artifact's version in the Implementation Report `inputs`.
If any input is `SUPERSEDED`, return `BLOCKED`.

## Open Decisions

Search required artifacts for unresolved markers:

- Open Decision
- OPEN
- TODO
- TBD
- FIXME
- ???
- unresolved
- to be decided

Do not proceed when unresolved decisions affect:

- business behavior;
- API contract;
- persistence constraints;
- security behavior;
- validation;
- error handling;
- new dependencies;
- architecture;
- test expectations.

## Working Tree

Inspect Git status before making changes.

If unrelated uncommitted changes exist:

1. List the unrelated changes.
2. Do not overwrite them.
3. Ask for an explicit human decision if safe isolation is not possible.

---

# Implementation Principles

## Plan-Guided Implementation

Follow the approved Implementation Plan in its defined order.

Do not improvise alternative architecture without approval.

If the plan becomes infeasible because of repository reality:

1. Stop the affected step.
2. Record the discovered conflict.
3. Recommend returning to IMPLEMENTATION_PLANNING or IMPACT_ANALYSIS.
4. Do not silently redesign the implementation.

## Minimal Change

Implement only what is required by the active Story.

Avoid:

- unrelated formatting changes;
- broad renaming;
- opportunistic refactoring;
- dependency upgrades;
- new frameworks;
- generic abstractions without immediate need;
- changes outside the identified impact surface.

## Existing Patterns First

Inspect existing project patterns before creating new components.

Reuse established:

- module layout (`module-map.md`: `src/modules/<module>/<module>.<layer>.ts`);
- naming conventions;
- Zod schema and DTO patterns;
- validation patterns;
- domain-error and error-middleware patterns;
- security configuration;
- test conventions.

Do not copy an existing pattern when the pattern violates current approved
architecture or security requirements.

## Contract-First Implementation

When API behavior is defined by OpenAPI:

- implement the approved contract;
- preserve documented status codes;
- preserve request and response schemas;
- preserve validation behavior;
- preserve error behavior;
- do not expose additional fields.

## Explicit Persistence Design

Do not leave an important constraint to a Prisma or database default.

Define explicitly in `prisma/schema.prisma` when required by design:

- column type and length (`@db.VarChar(n)` for bounded text);
- nullability (optional `?` only where the design says so);
- uniqueness (`@unique` / `@@unique`);
- identifiers (`@id @default(uuid())` per `persistence-conventions.md` PC-3);
- relations with an explicit `@relation` and referential actions
  (`onDelete` / `onUpdate`);
- indexes for every foreign key and every queried lookup column;
- `@map` / `@@map` naming.

Every schema change ships with a committed migration created by
`npm run prisma:migrate` in the same change.

## Security-First Defaults

Prefer secure behavior when approved requirements leave an implementation
choice, but do not invent new business policy.

Security-sensitive ambiguity must become an Open Decision.

---

# Tooling Strategy

## Repository and project inspection

- `Glob` / `Grep` / `Read` for structure, symbols, and call sites. Read only the
  bounded change surface identified by the Impact Analysis and the plan.
- `git status` / `git diff` (read-only) through Bash for working-tree state.
- `package.json`, `tsconfig.json`, `eslint.config.js`, `prisma/schema.prisma`,
  `.env.example` for actual project capability — never assume a dependency
  exists.

Symbol reasoning comes from `Grep` plus the TypeScript compiler. State that
limitation when a conclusion rests on text search alone, and prefer
`npm run typecheck` output over inference when checking whether a symbol is
really used or really typed.

If the editor's IDE integration is connected, its live diagnostics are usable as
extra evidence. Never assume it is available and never block on it:
`npm run typecheck` and `npm run lint` are the authoritative signals.

## File changes

- `Edit` / `Write` for source changes. Rename by editing every referencing file
  found with `Grep`, then confirming with `npm run typecheck` — a rename is not
  complete until the compiler agrees.
- Never reformat files the Story did not touch.

## Validation

Run through Bash and record actual exit codes:

- `npm run format` (changed files only) / `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm run test` (Vitest; `npx vitest run <path>` for a focused run)
- `npm run build` when the plan requires a compiled artifact

`.claude/skills/pre-commit-checklist/SKILL.md` is the canonical order.

## Database access

- `npm run prisma:migrate` creates a migration; `npm run prisma:generate`
  refreshes the client. `prisma db push` is forbidden against a shared database.
- `npx prisma migrate status` and `npx prisma studio` are read-only inspection
  aids. Any write to a database outside an approved automated test needs
  explicit human approval.

## Long-running processes

Do not start `npm run dev` or any long-lived server unless the approved
validation plan requires it; prefer Supertest, which mounts `src/app.ts`
in-process without binding a port.

Do not assume a command passed unless its actual exit status and output were
observed.

---

# Implementation Workflow

## Step 1: Resolve Active Story

Read workflow state.

Record:

- Story ID;
- workflow stage;
- artifact versions;
- plan version;
- implementation attempt number.

Confirm that implementation is the currently permitted stage.

---

## Step 2: Validate Preconditions

Check:

- Story exists;
- Specification is approved;
- required designs exist;
- Impact Analysis is ready;
- Plan Review is approved;
- required tests or test specifications exist;
- no blocking Open Decisions remain;
- architecture documents are populated;
- working tree is safe.

If a precondition fails:

1. Create a blocked Implementation Report.
2. Identify the missing or invalid prerequisite.
3. Recommend the correct loop-back stage.
4. Stop before modifying code.

---

## Step 3: Establish Traceability Map

Before editing code, map:

- Acceptance Criterion;
- Specification requirement;
- design artifact;
- approved plan step;
- expected production component;
- expected test.

Keep this map available throughout implementation.

Do not implement a plan step that cannot be traced to an approved requirement
or necessary supporting infrastructure.

---

## Step 4: Inspect Current Repository

Inspect only the bounded change surface identified by Impact Analysis and the
Implementation Plan.

Confirm:

- existing modules and shared directories under `src/`;
- relevant symbols;
- extension points;
- current security configuration (`src/middleware/`, `src/app.ts`);
- current persistence configuration (`prisma/schema.prisma`, existing
  migrations, `src/lib/prisma.ts`);
- existing tests;
- existing error handling (`src/middleware/errorHandler.ts`);
- current environment schema (`src/config/env.ts`, `.env.example`).

Compare repository reality with predicted Impact Analysis.

If material differences exist, stop and recommend re-running Impact Analysis
or Planning.

---

## Step 5: Confirm Execution Sequence

Read the approved plan steps.

For every step identify:

- required input;
- intended file or symbol;
- expected output;
- validation method;
- dependencies on earlier steps.

Do not reorder steps without recording why.

If a different order is necessary for technical correctness, stop and request
plan revision or human approval.

---

## Step 6: Establish Test Baseline

Run the existing relevant tests before production changes.

Record:

- command;
- exit status;
- passing tests;
- failing tests;
- unrelated baseline failures.

If the baseline already fails:

1. Record the failure.
2. Determine whether the failure is related to the active Story.
3. Do not attribute pre-existing failures to the new implementation.
4. Ask for a human decision when the failure prevents reliable validation.

When test-first artifacts exist, run the new tests and confirm that expected
tests fail for the expected reason before implementation.

Do not modify tests merely to make an unjustified implementation pass.

---

## Step 7: Implement Persistence Changes

When required by the approved plan:

- create or update Prisma models in `prisma/schema.prisma`;
- declare every constraint explicitly (type/length, nullability, uniqueness,
  relations with referential actions, indexes, `@map` naming);
- create the migration with `npm run prisma:migrate` and commit it with the
  change; refresh the client with `npm run prisma:generate`;
- create or update the module repository — the only place Prisma is imported;
- add persistence tests against the disposable test database.

The implementation must not:

- run `prisma db push` against a shared database, or use it in place of a
  migration;
- edit an already-applied migration;
- point tests at the development or a shared database;
- commit database dumps or `.env` files;
- weaken a uniqueness, nullability, length, or referential constraint;
- introduce an unbounded query, or a query filtering on an unindexed column;
- read `passwordHash` (or any other sensitive column) in a query whose result
  reaches a response DTO.

Follow `docs/architecture/persistence-conventions.md` and the approved DB
design. Run the relevant persistence tests after this step.

---

## Step 8: Implement Domain and Service Behavior

Implement approved business behavior in the Service layer.

Requirements:

- keep business logic out of routes and controllers;
- keep all Prisma access behind the module repository;
- open transactions with `prisma.$transaction` in the service, never in a
  repository or controller (`architecture.md` AD-3);
- map persistence records to DTOs in the service; never return a Prisma model
  from a service to a controller as an API shape;
- never import `express` types (`Request`, `Response`, `NextFunction`), cookies,
  or headers into a service;
- signal failures by throwing a typed domain error from `src/lib/errors.ts`,
  never by returning an HTTP status;
- reach another module only through its service;
- keep functions focused and within the ESLint complexity thresholds;
- avoid duplicated business logic.

Run the relevant unit tests after this step.

---

## Step 9: Implement Validation

Implement validation defined by:

- Acceptance Criteria;
- Specification;
- API design;
- business rules;
- security conventions.

Validation must not depend on any client.

Implement request validation as Zod schemas in `<module>.schemas.ts`, applied by
the shared validation middleware at the route boundary — body, params, query,
and any relevant header or cookie. Unknown body properties are rejected, not
stripped. Services receive already-validated, typed input (`z.infer`), never a
raw request.

Business-rule validation (uniqueness, cross-field rules, state checks) belongs
in the service, and every invariant that can also be a database constraint must
be one (`persistence-conventions.md` PC-4).

Do not add a new dependency without explicit approval.

Validation messages and error representation must follow
`docs/architecture/api-conventions.md` (AC-6), including the `fieldErrors`
shape derived from the Zod issue list.

---

## Step 10: Implement API Layer

When required:

- create or modify request schemas in `<module>.schemas.ts`;
- create or modify response DTO schemas in the same file, and register them for
  OpenAPI generation;
- implement the controller operation and wire it in `<module>.routes.ts` with
  its validation, auth, and rate-limit middleware;
- map service outcomes to the approved status codes (`201` + `Location` on
  create, `204` where there is no body);
- keep the generated OpenAPI document consistent with the approved `openapi`
  design artifact;
- never return a Prisma model as an API shape;
- never expose a password hash, a refresh token, or any other sensitive
  internal field.

Do not return sensitive values merely because the entity contains them.

Run web-layer and contract tests after this step.

---

## Step 11: Implement Error Handling

Throw a domain error from the service; map it to HTTP in exactly one place.

- **Throw**: a domain error from `src/lib/errors.ts`, carrying no HTTP type.
  That file may not exist yet — `architecture.md` AD-6 says the first Story that
  needs a domain error creates it, and that the class taxonomy is an Open
  Decision. If this Story is that Story, the plan must already say so; if it does
  not, raise the Open Decision instead of inventing a class hierarchy.
- **Map**: only in `src/middleware/errorHandler.ts`, using the status table in
  `architecture.md` AD-6 (validation failure -> `400`, unauthenticated -> `401`,
  forbidden -> `403`, not found -> `404`, conflict -> `409`, unsupported media
  type -> `415`, unmapped -> `500`). Do not add a mapping the table does not
  have; if the Story needs one, that is an Open Decision.
- **Shape**: the single error body in `api-conventions.md` AC-6. The `code` is
  part of the contract, so it comes from the approved API design, not from
  improvisation at the call site.
- **Never**: `try/catch` in a controller to build an error response. Express 5
  forwards a rejected promise from an async handler to the error middleware on
  its own.
- **Never disclose**: the list in `security-conventions.md` SC-9 — authoritative
  there, and deliberately not copied here.

---

## Step 12: Implement Security Behavior

When the Story handles registration, credentials, user identity, roles, or
account state:

- hash passwords with Argon2id (`argon2`), never a reversible or ad-hoc scheme;
- verify passwords with the library verify function, never string equality;
- never store, log, or return a plaintext password or its hash;
- keep refresh tokens out of response bodies: `HttpOnly`, `Secure`,
  `SameSite=Strict` cookie only, hashed at rest, rotated and revoked on use;
- verify access tokens with an explicitly allow-listed algorithm; never trust
  the token's own `alg`;
- resolve identity from the token, never from a client-supplied id
  (`api-conventions.md` AC-3);
- keep authentication responses non-enumerating: same generic message and
  comparable timing for unknown email and wrong password;
- apply rate limiting to authentication endpoints as the approved design
  specifies;
- read secrets only through `src/config/env.ts`; never hard-code one;
- preserve secure default behavior (helmet on, `X-Powered-By` off, CORS
  allow-list, explicit body size limit, explicit `trust proxy`).

For password registration:

- apply the approved password policy;
- validate before persistence;
- hash before persistence;
- ensure response DTOs exclude credential fields.

If no approved password policy exists, stop and create an Open Decision.

Do not invent password complexity requirements during implementation.

---

## Step 13: Update Configuration

Change application configuration only when listed in the approved plan.

For configuration:

- add every new setting to the Zod schema in `src/config/env.ts` so startup
  fails fast when it is missing or invalid;
- add the matching placeholder to `.env.example` in the same change;
- never read `process.env` anywhere else in `src/`;
- keep environment-specific values (CORS allow-list, `trust proxy` hops, token
  TTLs, log level) in configuration, never hard-coded;
- never commit a real `.env`, a credential, or a token.

Document every configuration change in the Implementation Report.

Do not embed secrets in repository configuration.

---

## Step 14: Update Documentation

Update only documentation required by approved artifacts and actual changes.

Possible updates include:

- OpenAPI contract;
- architecture references;
- persistence documentation;
- configuration documentation;
- README instructions;
- Story traceability.

Do not rewrite approved source requirements to match implementation behavior.

When implementation reveals a requirement or design problem, return to the
appropriate earlier stage.

---

## Step 15: Format Changed Files

Run `npm run format` and confirm with `npm run format:check`.

Format only the files this Story changed. A repository-wide reformat is an
unrelated change and must not appear in the diff.

---

## Step 16: Run Incremental Validation

After every meaningful implementation group:

1. `npm run typecheck` (and `npm run build` when the plan requires the compiled
   output);
2. `npm run lint`;
3. run the relevant tests (`npx vitest run <path>`);
4. address failures caused by the current changes;
5. record the actual command and exit status as evidence.

Do not postpone all validation until the end.

If three consecutive correction attempts fail for the same issue:

1. stop implementation;
2. summarize attempted fixes;
3. identify the likely root cause;
4. recommend returning to IMPLEMENTATION_PLANNING, API_DESIGN, DB_DESIGN, or
   CLARIFICATION;
5. request human review.

---

## Step 17: Run Full Required Validation

Run all validation commands required by:

- AGENTS.md;
- Implementation Plan;
- project conventions;
- test plan.

At minimum:

- `npm run format:check`;
- `npm run lint` (including the layering rule);
- `npm run typecheck`;
- `npm run test` (unit, integration/API, persistence, security, contract);
- `npm run build` when the plan requires a compiled artifact;
- `npm audit` when the change adds or updates a dependency.

Record actual commands, tools, exit codes, and results.

Do not claim PASS for any check that was not executed.

---

## Step 18: Inspect Git Change Set

Inspect the working tree.

Classify changed files as:

- Planned;
- Required Supporting Change;
- Unexpected;
- Unrelated.

Unexpected changes require explanation.

Unrelated changes must not be silently included.

Compare the change set with:

- Impact Analysis;
- Implementation Plan.

Do not perform final Reconciliation in this Skill, but identify differences for
the later Reconciliation stage.

---

## Step 19: Create Implementation Report

Create the `implementation_report` artifact at its registry path
(`docs/evidence/{story_id}-implementation-report.md`).

Do not update workflow state. Do not create a commit or Pull Request.

---

# Implementation Report Format

## Front Matter

Shared block from `docs/workflow/artifact-schema.md`
(`artifact_type: implementation_report`), plus:
`tests_status`, `build_status`, `diagnostics_status` (each `PASS` / `FAIL` /
`NOT_RUN`), `security_sensitive` (bool). `created_at` / `updated_at` are runtime
timestamps. `attempt` mirrors `workflow-state.yaml.attempt`.

Illustrative (dates are examples only):

    ---
    artifact_type: implementation_report
    story: US-001
    version: 1
    status: DRAFT
    created_at: <runtime>
    updated_at: <runtime>
    produced_by: express-implementor
    inputs:
      - path: docs/plans/US-001-implementation-plan.md
        version: 1
      - path: docs/reviews/plans/US-001-plan-review.md
        version: 1
      - path: docs/tests/US-001-ac-test-matrix.md
        version: 1
    supersedes: null
    tests_status: PASS
    build_status: PASS
    diagnostics_status: PASS
    security_sensitive: true
    ---

## 1. Summary

Describe:

- implemented capability;
- implementation status;
- validation status;
- important limitations.

## 2. Source Artifacts

List the exact paths and versions of:

- User Story;
- Specification;
- designs;
- Impact Analysis;
- Implementation Plan;
- Plan Review;
- test artifacts.

## 3. Implemented Acceptance Criteria

For each Acceptance Criterion provide:

- AC identifier;
- implementation location (file + symbol);
- relevant test (file path + full `describe` > `it` name, matching the
  `ac_test_matrix` row);
- current status.

## 4. Change Set

Every created / modified file, each classified `Planned` /
`Required Supporting Change` / `Unexpected` / `Unrelated`, with the plan step or
justification. Unrelated changes must not be included in the work.

## 5. Validation Evidence

Actual commands run, exit status, and results for: format check, lint,
typecheck, build, unit tests, integration/API tests, persistence tests,
security tests, contract tests, and `npm audit` where applicable. Do not claim
`PASS` for a check that was not executed.

## 6. Configuration Changes

Every configuration change, with the approving plan step.

## 7. Deviations and Discovered Problems

Anything where repository reality diverged from the plan / impact analysis, and
what was done about it.

## 8. Open Decisions

Any Open Decision touched or newly required. If a security-sensitive decision is
missing, the implementation must stop and this report returns `BLOCKED`.

---

# Validation Checklist

Before returning the result envelope, confirm each of these:

- Every plan step is implemented, or recorded as a deviation with its reason.
- The full validation sequence was run, and the report carries the real commands
  and the real exit statuses.
- The change set contains nothing the plan did not call for.
- No Open Decision was resolved in code, and no requirement was invented at the
  keyboard.
- No test was weakened, skipped, or deleted to obtain a pass.


# Result Envelope

Return exactly this (shape: `docs/workflow/artifact-lifecycle.md` §5); the story-orchestrator records the transition — this Skill
does not update `workflow-state.yaml`, create commits, or open a Pull Request:

```yaml
result:
  verdict: PASS | CHANGES_REQUIRED | BLOCKED
  stage: IMPLEMENTATION
  story: <StoryId>
  artifact_status: DRAFT
  artifacts:
    - docs/evidence/<StoryId>-implementation-report.md
  next_stage: IMPLEMENTATION_VERIFICATION
  loop_back_stage: null
  loop_back_key: null              # or a key under IMPLEMENTATION.loop_back
  blocking_issues: []
  non_blocking_findings: []
```

- `PASS` — the plan is fully implemented; build, required tests, and diagnostics
  pass with recorded evidence; the change set is scoped; no undisclosed
  security-sensitive change. The orchestrator advances to
  `IMPLEMENTATION_VERIFICATION` (independent verification still happens there).
- `CHANGES_REQUIRED` — implementation is incomplete but progressing and no
  upstream artifact is at fault → `loop_back_stage: IMPLEMENTATION`
  (key `partial`); or the plan itself is infeasible as written →
  `loop_back_stage: IMPLEMENTATION_PLANNING` (key `blocked_by_plan`).
- `BLOCKED` — a precondition failed, an authoritative artifact conflict exists,
  a security-sensitive Open Decision is unresolved, or three correction attempts
  failed on the same issue. Record the likely root cause and recommend a human
  review.

---

# Prohibited

- Do not redesign the Story or reinterpret Acceptance Criteria.
- Do not resolve Open Decisions or invent business / security policy.
- Do not perform unrelated refactoring, renames, dependency upgrades, or
  formatting outside changed files.
- Do not add a dependency without explicit human approval.
- Do not weaken, disable, or delete tests; do not weaken assertions.
- Do not run `prisma db push` against a shared database, edit an applied
  migration, or apply a destructive migration without an approved decision.
- Do not commit database dumps, `.env` files, or build output.
- Do not read `process.env` outside `src/config/env.ts`, or use `console.log`
  in `src/`.
- Do not silence TypeScript with `any`, `@ts-ignore`, `!`, or a forcing `as`.
- Do not update workflow state, create a branch/commit, or open/merge a Pull
  Request.
- Do not mark the Story complete.

---

# Completion Criteria

Complete only when: the active Story and stage are resolved; preconditions
validated; a traceability map was established; the approved plan steps were
executed in order (or a deviation recorded); incremental and full validation
were run with recorded evidence; the change set was inspected and classified;
the `implementation_report` was written with real evidence; and the result
envelope was returned with an explicit `verdict`.