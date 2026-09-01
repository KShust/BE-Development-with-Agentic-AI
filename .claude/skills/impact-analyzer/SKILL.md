---
name: impact-analyzer
description: >
  Predicts where an approved User Story will land in the existing codebase,
  architecture, API, persistence model, tests, documentation and configuration,
  before any plan exists. Owns the IMPACT_ANALYSIS stage. Answers "what does
  this touch" — it does not decide the order of work or write the steps
  (implementation-planner), and it does not record what actually changed
  afterwards (reconciliation-reviewer).
---

# Purpose

Determine where and how an approved User Story is expected to affect the
existing system before implementation planning begins.

The result is a predictive analysis.

It describes the expected change surface based on currently available
requirements, designs, architecture documentation, and repository state.

It does not record the files that were actually changed during implementation.
Actual changes are captured later during Reconciliation.

---

# When To Use

Use this Skill when:

- a User Story has an approved Specification;
- required API and persistence designs exist;
- the team needs to understand the expected scope of change;
- an Implementation Plan has not yet been created;
- an existing codebase must be inspected before planning.

Typical requests:

- Analyze the impact of the active User Story.
- Identify affected modules, layers, files, and artifacts.
- Determine the expected change surface for the active Story (for example,
  "what does US-014 touch?").
- Prepare impact analysis before implementation planning.

---

# When Not To Use

Do not use this Skill:

- before the User Story has been clarified;
- while the Specification is rejected;
- instead of architecture design;
- instead of implementation planning;
- to generate implementation code;
- to determine the files actually changed after implementation;
- for unrelated repository-wide architecture assessment.

---

# Active Scope

Read:

- docs/workflow/active-story.yaml
- docs/workflow/workflow-state.yaml

Determine the active Story ID from the workflow artifacts.

Work only on the active User Story.

Do not analyze inactive backlog items unless explicitly requested.

If no active Story is defined, produce nothing and return
`verdict: BLOCKED` with `blocking_issues` naming the condition (see Result
Envelope). The four verdicts in `docs/workflow/artifact-lifecycle.md` §2 are the
only status vocabulary this Skill has: the orchestrator reads the envelope, not
a status line in the chat.

---

# Canonical Sources

- Workflow / stage: `docs/workflow/stage-map.yaml` (`IMPACT_ANALYSIS`;
  loop_back keys `changes_required_specification`, `changes_required_api`,
  `changes_required_database`).
- Artifact paths: `docs/workflow/artifact-paths.yaml` — **authoritative**.
  Resolve every path below from its registry key. Paths shown are illustrative.
- Status vocabulary: `docs/workflow/artifact-lifecycle.md`.
- Front matter: `docs/workflow/artifact-schema.md`.

# Required Context

Read (registry keys, resolved via `artifact-paths.yaml`):

- `story`
- `specification`  (approved)
- `specification_review`
- `api_design`, `openapi`  (or their `NOT_APPLICABLE` record)
- `database_design`, `entity_model`  (or their `NOT_APPLICABLE` record)
- `design_review`
- `open_decisions`

Read project architecture documentation:

- docs/architecture/architecture.md
- docs/architecture/module-map.md
- docs/architecture/api-conventions.md
- docs/architecture/persistence-conventions.md
- docs/architecture/security-conventions.md

Read relevant product context:

- docs/product/business-rules.md
- docs/product/business-glossary.md
- docs/product/non-functional-requirements.md

(`open_decisions` is already listed in Required Context above.)

Read AGENTS.md before analyzing the repository.

---

# Preconditions

The Skill may proceed only when all mandatory conditions are satisfied.

## Specification

The `specification` must exist and be current (not `SUPERSEDED`).

The `specification_review` verdict must be `PASS`, and `HUMAN_SPEC_APPROVAL`
must be recorded (the orchestrator routes here only after that gate).

Do not proceed when the review verdict is `CHANGES_REQUIRED` or `BLOCKED`, or
when the review is missing.

## Design Artifacts

`design_review` must exist with verdict `PASS`.

The following must exist when relevant to the Story:

- `api_design`, `openapi`
- `database_design`, `entity_model`

A design area may be absent only when the Specification explicitly marks it
`NOT_APPLICABLE` (and `API_DESIGN` / `DB_DESIGN` recorded that verdict).

Record every consumed artifact's version in this analysis's `inputs` front
matter.

## Architecture Documentation

The following files must exist and contain meaningful project guidance:

- docs/architecture/architecture.md
- docs/architecture/module-map.md
- docs/architecture/api-conventions.md
- docs/architecture/persistence-conventions.md
- docs/architecture/security-conventions.md

An empty or placeholder-only architecture document is a blocker.

Do not infer missing architectural constraints from framework conventions.

## Open Decisions

Inspect all relevant artifacts for every marker listed in `AGENTS.md` "Open
Decisions Policy". That list is authoritative and is deliberately not copied
here: a copy that drops one marker is a scan that silently passes.

If an unresolved decision can materially change the affected components,
stop the analysis and create a blocked Impact Analysis report.

Do not choose an answer on behalf of the developer.

---

# Tooling Strategy

Prefer semantic and IDE-aware analysis over plain-text matching.

## Preferred capabilities

- `Glob` for structure discovery (`src/modules/**`, `prisma/**`, `tests/**`).
- `Grep` for symbol, import, and call-site search across TypeScript sources.
- `Read` for the bounded set of files the analysis actually depends on.
- `package.json`, `tsconfig.json`, `prisma/schema.prisma`, `.env.example` for
  actual project capability — never assume a dependency exists.
- `git status` / `git diff` (read-only) through Bash for working-tree state.
- `npm run typecheck` when a claim about types or symbol usage needs
  compiler-grade confirmation rather than a text match.

Use only what the current analysis requires.

## Evidence strength

If the editor's IDE integration is connected, its live diagnostics are usable as
extra evidence. Never assume it is available and never block on it:
`npm run typecheck` and `npm run lint` are the authoritative signals.

Import and call reasoning therefore comes from `Grep` plus the TypeScript
compiler, so:

- record `analysis_mode: TYPE_CHECKED` when a conclusion was confirmed by
  `npm run typecheck` or by reading the actual file;
- record `analysis_mode: TEXT_ONLY` when it rests on pattern search alone, and
  lower the confidence of the affected findings accordingly.

Do not claim semantic certainty when only text search was used.

---

# Analysis Workflow

## Step 1: Resolve Active Story

Read the workflow state.

Determine:

- Story ID;
- current workflow stage;
- current artifact versions;
- current review status.

Verify that the expected stage allows Impact Analysis.

---

## Step 2: Validate Inputs

Check that all required artifacts exist.

Check:

- approval status;
- unresolved decisions;
- TODO and TBD markers;
- references to an architecture rule that no `docs/architecture/` document
  actually states;
- conflicting sources.

If blocked, produce a blocked report and stop.

---

## Step 3: Extract Required Capabilities

From the User Story, Acceptance Criteria, and Specification, identify:

- business capabilities introduced or changed;
- API behavior introduced or changed;
- persistence behavior introduced or changed;
- security behavior introduced or changed;
- validation behavior introduced or changed;
- documentation and operational behavior introduced or changed.

Do not yet map these requirements to implementation steps.

---

## Step 4: Inspect Existing Architecture

Analyze:

- feature modules under `src/modules/` and the shared directories;
- the responsibility each one owns (`module-map.md`); "package" in this
  codebase means an npm package, never a source folder;
- dependency direction;
- architectural boundaries;
- existing conventions;
- existing extension points.

Determine which architectural areas own the affected responsibilities.

Do not introduce a new module, a new shared directory, or a new layer beyond
routes/controllers/services/repositories unless the existing architecture
provides no appropriate location.

If a new architectural decision is required, create an Open Decision instead
of silently adding a new structure.

---

## Step 5: Inspect Existing Codebase

Search for existing:

- route files and their middleware composition;
- controllers;
- services;
- repositories;
- Prisma models and migrations;
- Zod request/response schemas and DTO types;
- shared middleware (validation, auth guard, rate limit, error handler);
- environment configuration (`src/config/env.ts`, `.env.example`);
- tests (`*.test.ts`, `tests/integration/`);
- OpenAPI generation wiring.

Prefer symbol-aware inspection when available.

Identify reusable components and existing patterns.

Avoid proposing duplicate abstractions when an existing component can be
extended safely.

---

## Step 6: Identify Expected Change Surface

Classify expected changes as:

- Create;
- Modify;
- Reuse;
- Remove;
- No Change;
- Unknown.

Analyze impact across:

### Modules

Which feature modules under `src/modules/` and which shared directories
(`src/middleware/`, `src/lib/`, `src/config/`, `prisma/`) are affected.

### Layers

Which layer files inside each affected module are involved
(`routes` / `controller` / `service` / `repository` / `schemas`), per
`docs/architecture/module-map.md`.

### Source Files

Likely files to create or modify.

### API

Endpoints, schemas, status codes, and error contracts.

### Persistence

Entities, attributes, constraints, indexes, and repository behavior.

### Security

Authentication, authorization, password handling, data exposure, and
configuration.

### Tests

Unit, integration, security, persistence, and contract tests.

### Configuration

Environment variables (`src/config/env.ts`, `.env.example`), dependencies, and
runtime configuration (middleware wiring, rate limits, CORS allow-list, body
limits, log level). This project has no profile mechanism; per-environment
values come from the environment, never from a profile.

### Documentation

Specifications, API contracts, architecture documents, and operational
documentation.

---

## Step 7: Analyze Risks

Identify risks such as:

- architecture boundary violations;
- breaking API changes;
- persistence incompatibility;
- schema or data migration risk;
- security regression;
- missing validation;
- duplicated domain logic;
- impact outside the active Story;
- dependency changes;
- configuration changes;
- insufficient test coverage;
- unsupported assumptions.

Classify each risk as:

- Critical;
- Major;
- Minor.

---

## Step 8: Identify Human Decisions

List decisions that require human approval before planning.

Examples:

- introduction of a new dependency;
- change to module ownership or layer boundaries;
- new architectural abstraction;
- backward-incompatible API change;
- schema migration strategy;
- authentication or authorization model;
- storage of sensitive information;
- behavior not defined by Acceptance Criteria.

Do not resolve these decisions automatically.

---

## Step 9: Produce Impact Analysis

Create the `impact_analysis` artifact at its registry path
(`docs/impact-analysis/{story_id}-impact-analysis.md`).

Do not modify source code.

Do not create the Implementation Plan (that is `implementation-planner`'s sole
output — this Skill owns `impact_analysis` and nothing else).

Do not update design artifacts.

---

# Output

- `impact_analysis` at
  `docs/impact-analysis/{story_id}-impact-analysis.md`,
  front matter per `docs/workflow/artifact-schema.md`,
  `artifact_type: impact_analysis`.

Use `references/impact-analysis-template.md` — it carries the exact section
order, the front-matter block, and what each section must contain. **The
template is the list; this file keeps no second copy of it**, because a copy
drifts and a reader cannot tell which one is current. Open it before writing.

---

# Validation Checklist

Before returning the result envelope, confirm each of these:

- Every capability the Specification requires maps to at least one expected
  change.
- Every file named was actually opened; nothing was inferred from a filename.
- Confidence is recorded per section, per the Confidence Rules.
- Every risk names a trigger and a consequence, not just a category.
- Nothing is asserted about code this analysis did not read, and the gaps are
  stated in Analysis Limitations.


# Result Envelope

Return exactly this (shape: `docs/workflow/artifact-lifecycle.md` §5); the story-orchestrator records the transition — this Skill
does not update `workflow-state.yaml`:

```yaml
result:
  verdict: PASS | CHANGES_REQUIRED | BLOCKED
  stage: IMPACT_ANALYSIS
  story: <StoryId>
  artifact_status: DRAFT
  artifacts:
    - docs/impact-analysis/<StoryId>-impact-analysis.md
  next_stage: IMPLEMENTATION_PLANNING
  loop_back_stage: null
  loop_back_key: null              # or a key under IMPACT_ANALYSIS.loop_back
  blocking_issues: []
  non_blocking_findings: []
```

- `PASS` — the change surface is identified with acceptable confidence; residual
  risks (if any) are listed in `non_blocking_findings`.
- `CHANGES_REQUIRED` — analysis shows an approved upstream artifact is wrong or
  incomplete. Set `loop_back_stage` using a key from
  `stage-map.yaml` `IMPACT_ANALYSIS.loop_back`:
  `changes_required_specification` → `SPECIFICATION`,
  `changes_required_api` → `API_DESIGN`,
  `changes_required_database` → `DB_DESIGN`.
- `BLOCKED` — missing/stale mandatory input, a convention this stage depends on is not stated anywhere in `docs/architecture/`, or a blocking Open
  Decision that could materially change the affected components.

---

# Confidence Rules

Use:

HIGH

The affected component exists and semantic or direct evidence confirms impact.

MEDIUM

The impact follows from approved design, but the final file or symbol does not yet exist.

LOW

The impact depends on unresolved architecture or implementation decisions.

Low-confidence findings must not silently become mandatory planning inputs.

---

# Boundaries

This Skill must not:

- modify source code;
- create tests;
- generate migration files;
- edit OpenAPI;
- create an Implementation Plan;
- approve architecture changes;
- resolve Open Decisions;
- change workflow stage automatically;
- create commits or Pull Requests;
- inspect unrelated features;
- treat predicted files as actual changes.

---

# Failure Handling

If required inputs are missing:

1. Create a BLOCKED Impact Analysis report.
2. List missing artifacts.
3. Explain why they are required.
4. Do not continue with partial assumptions.

If type-level confirmation is unavailable (dependencies not installed, build
broken for unrelated reasons):

1. Record the limitation.
2. Continue with file inspection and pattern search.
3. Mark `analysis_mode: TEXT_ONLY`.
4. Reduce confidence for every finding that needed compiler confirmation.

If architecture documents are empty:

1. Set status to BLOCKED.
2. List the empty documents.
3. Request architecture context.
4. Do not invent module ownership or dependency rules.

---

# Completion Criteria

The Skill is complete only when:

- active Story is identified;
- required artifacts are validated;
- architecture documentation is inspected;
- existing codebase is inspected;
- affected areas are classified;
- expected files are separated from uncertain candidates;
- API, persistence, security, tests, and configuration are covered;
- risks and Open Decisions are documented;
- traceability is provided;
- readiness result is explicit;
- Impact Analysis artifact is saved.

The Skill result is a proposal for planning.

It must later be compared with actual changes during Reconciliation.