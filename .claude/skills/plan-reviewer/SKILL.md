---
name: plan-reviewer
description: >
  Reviews an implementation plan for completeness, feasibility, architectural
  compliance, scope control, traceability, testing coverage, and security.
  Use after an implementation plan has been created and before tests or
  implementation work begins.
---

# Purpose

Determine whether the proposed Implementation Plan is safe, complete,
reviewable, and ready for execution.

The Skill reviews the plan against approved requirements, designs, predicted
impact, project architecture, and engineering constraints.

The Skill does not implement the plan and does not silently correct it.

When problems are found, the Skill produces actionable review findings and
identifies the workflow stage to which the Story should return.

---

# When To Use

Use this Skill when:

- the active Story has an approved Specification;
- API and database designs exist when required;
- Impact Analysis has completed;
- an Implementation Plan has been created;
- tests and implementation have not started;
- a plan must pass a quality gate before execution.

Typical requests:

- Review the implementation plan for the active Story.
- Validate the active Story's implementation plan before implementation starts.
- Check whether this plan is ready for test writing and execution.
- Review the plan against the Specification and Impact Analysis.

---

# When Not To Use

Do not use this Skill:

- to create an Implementation Plan;
- before Impact Analysis is available;
- to implement code;
- to generate tests;
- to rewrite approved requirements;
- to resolve Open Decisions;
- to review the implementation after coding;
- as a replacement for human approval when one is required.

---

# Active Scope

Read:

- docs/workflow/active-story.yaml
- docs/workflow/workflow-state.yaml

Determine:

- active Story ID;
- current workflow stage;
- active artifact versions;
- expected plan review stage.

Work only on the active Story unless explicitly instructed otherwise.

If no active Story is configured, review nothing and return
`verdict: BLOCKED` with `blocking_issues` naming the condition (see Result
Envelope). The four verdicts in `docs/workflow/artifact-lifecycle.md` §2 are the
only status vocabulary this Skill has: the orchestrator reads the envelope, not
a status line in the chat.

---

# Canonical Sources

- Workflow / stage: `docs/workflow/stage-map.yaml` (`PLAN_REVIEW`; loop_back key
  `changes_required` → `IMPLEMENTATION_PLANNING`).
- Artifact paths: `docs/workflow/artifact-paths.yaml` — **authoritative**.
  Resolve every path from its registry key. Paths shown are illustrative.
- Status vocabulary: `docs/workflow/artifact-lifecycle.md`.
- Front matter: `docs/workflow/artifact-schema.md`.

# Required Context

Read (registry keys, resolved via `artifact-paths.yaml`):

- `story`
- `specification`, `specification_review`
- `impact_analysis`
- `implementation_plan`
- `api_design`, `openapi`, `database_design`, `entity_model`
  (or their `NOT_APPLICABLE` record)
- `design_review`
- `open_decisions`

Read architecture references:

- docs/architecture/architecture.md
- docs/architecture/module-map.md
- docs/architecture/api-conventions.md
- docs/architecture/persistence-conventions.md
- docs/architecture/security-conventions.md

Read product-level constraints:

- docs/product/business-rules.md
- docs/product/non-functional-requirements.md

(`open_decisions` is listed in Required Context above.)

Read AGENTS.md before starting the review.

---

# Preconditions

## Specification

`specification_review` verdict must be `PASS`, and `HUMAN_SPEC_APPROVAL` must be
recorded.

Do not proceed when the review verdict is `CHANGES_REQUIRED` or `BLOCKED`, or
when the review is missing.

## Design Review

`design_review` must exist with verdict `PASS`.

## Impact Analysis

`impact_analysis` must exist with verdict `PASS`, current version.

Do not proceed when it is `BLOCKED` or missing.

## Human Plan Approval

This stage runs **before** `HUMAN_PLAN_APPROVAL`. The plan being reviewed is
`DRAFT`; a `PASS` here sends it to that human gate.

## Implementation Plan

The Implementation Plan must exist and contain meaningful steps.

An empty or placeholder-only plan is a blocker.

## Open Decisions

Inspect all required artifacts for every marker listed in `AGENTS.md` "Open
Decisions Policy". That list is authoritative and is deliberately not copied
here: a copy that drops one marker is a scan that silently passes.

An unresolved decision is blocking when it affects:

- public API behavior;
- persistence design;
- security behavior;
- architecture;
- Acceptance Criteria;
- test expectations;
- dependency selection;
- execution order.

Do not resolve Open Decisions during plan review.

---

# Review Principles

## Requirements Before Implementation Preference

The plan must implement approved requirements.

The plan must not introduce new business behavior.

## Contract Before Code

When the Story changes API behavior, the plan must reference the approved
OpenAPI contract.

## Persistence Design Before Persistence Code

When the Story changes persistence behavior, the plan must reference the
approved database design.

## Tests Before or With Implementation

The plan must define tests before the corresponding implementation is
considered complete.

## Minimal Scope

The plan must avoid unrelated refactoring and opportunistic improvements.

## Reviewable Increments

The plan must be structured into small, ordered, verifiable steps. A step no
reviewer can check is a Major finding in this Skill's own classification
("non-reviewable step"), so it is a requirement, not a preference.

## Evidence Before Completion

Every significant implementation step must carry a validation activity or an
observable completion criterion. Its absence is the Major finding "missing
validation evidence"; Step 11 checks this against the plan step by step.

---

# Tooling Strategy

Use documentation artifacts as the primary source of approved intent.

Use `Glob`, `Grep`, and `Read` to verify claims the plan makes about the
existing repository, and `package.json` / `tsconfig.json` /
`prisma/schema.prisma` to confirm what the project actually provides.

Inspect selectively: do not read the whole repository when the plan and the
Impact Analysis identify a bounded change surface.

When a claim needs compiler-grade confirmation, `npm run typecheck` is the
evidence; a pattern match is not.

If confirmation is unavailable:

1. Continue the document-based review.
2. Record what could not be confirmed.
3. Avoid unsupported claims about symbol relationships.
4. Lower confidence for the affected findings.

---

# Review Workflow

## Step 1: Resolve Active Story

Read workflow state and determine:

- Story ID;
- current stage;
- plan version;
- Impact Analysis version;
- Specification version.

Confirm that the workflow is currently at PLAN_REVIEW or an equivalent stage.

---

## Step 2: Validate Artifact Chain

Verify that the plan references the current approved versions of:

- User Story;
- Specification;
- Specification Review;
- API Design;
- Database Design;
- Impact Analysis.

Flag stale or superseded inputs.

The plan must not be approved if it was created from outdated artifacts.

---

## Step 3: Verify Scope Alignment

Compare the plan with:

- User Story;
- Acceptance Criteria;
- Specification;
- explicit Out of Scope statements.

Identify:

- missing required behavior;
- unsupported additions;
- unrelated changes;
- hidden scope expansion;
- speculative abstractions.

---

## Step 4: Verify Impact Analysis Coverage

For every HIGH-confidence and MEDIUM-confidence affected area in Impact
Analysis, determine whether the plan:

- addresses it;
- explicitly excludes it with justification;
- postpones it through an approved decision;
- accidentally ignores it.

The plan may differ from Impact Analysis, but every material difference must be
explicitly explained.

---

## Step 5: Verify Architecture Compliance

Check:

- route, controller, service, and repository responsibilities;
- dependency direction (`docs/architecture/module-map.md`);
- module ownership and cross-module access through services only;
- Prisma model vs response DTO separation;
- placement of validation (Zod at the boundary, business rules in the service);
- error handling through the centralized middleware and typed domain errors;
- configuration boundaries (`src/config/env.ts` as the only `process.env`
  reader);
- reuse of existing components.

The dependency rules themselves are `module-map.md`, and `eslint.config.js`
enforces them mechanically — a plan that violates one produces a failing build,
not a shipped defect. Flag it anyway, because catching it here costs a paragraph
and catching it later costs an implementation pass. Then spend the rest of this
step on what no linter can see:

- business logic placed in a route or controller;
- a Prisma model planned as an API shape (`architecture.md` AD-4);
- validation planned somewhere other than the HTTP boundary (AD-5), or a
  business rule planned into a schema;
- a new module, shared directory, or abstraction layer without the
  justification AD-8 requires;
- responsibilities duplicated across steps, or across modules.

---

## Step 6: Verify API Plan

When API behavior changes, check that the plan includes:

- OpenAPI update or confirmed approved contract;
- endpoint implementation;
- request and response model handling;
- validation behavior;
- error mapping;
- authentication and authorization;
- contract tests;
- compatibility considerations.

The plan must not invent API behavior not present in the approved design.

---

## Step 7: Verify Persistence Plan

When persistence behavior changes, check that the plan includes:

- Prisma model changes;
- explicit constraints;
- nullability;
- length limits;
- uniqueness;
- indexes for every foreign key and queried lookup column;
- repository behavior and transaction boundaries;
- the migration the change requires;
- persistence tests against a disposable test database.

The plan must include a committed Prisma migration for every schema change, and
must never rely on `prisma db push` or an edit to an applied migration.

---

## Step 8: Verify Security Plan

Check that the plan addresses every security requirement the Story touches. The
requirements live in `docs/architecture/security-conventions.md`; what follows
names the sections to check the plan against, and is not a copy of the rules in
them:

- passwords and hashing — SC-1;
- roles and the default account state — SC-2;
- authentication, token lifetimes, the refresh cookie, rate limiting — SC-3;
- authorization and ownership resolved from the token identity — SC-4;
- HTTP hardening (helmet, CORS, body limit, `trust proxy`) — SC-5;
- dependencies — SC-6;
- secrets, `src/config/env.ts`, `.env.example` — SC-7;
- schema safety — SC-8;
- what may never reach a response, an error body, or a log line — SC-9;
- input validation at the HTTP boundary — `architecture.md` AD-5.

Open the section before judging the plan against it. A plan that satisfies your
recollection of a rule rather than its text is exactly what this stage exists to
catch.

If the Story handles passwords, credentials, tokens, personal data, or account
state, absence of an explicit security step is a blocking finding.

---

## Step 9: Verify Testing Strategy

Map each Acceptance Criterion to at least one planned verification method.

Review expected coverage across:

- unit tests for service logic (no Express, no live database);
- integration/API tests that mount `src/app.ts` with Supertest;
- persistence tests against the disposable test database;
- security tests (protected routes, sensitive fields absent from responses);
- contract tests against the approved OpenAPI design;
- negative scenarios and boundaries.

Flag tests that merely reproduce implementation structure without validating
observable behavior.

---

## Step 10: Verify Execution Order

Check whether the implementation sequence respects dependencies.

A typical order may include:

1. Contract and artifact confirmation.
2. Test preparation.
3. Persistence changes.
4. Service behavior.
5. API or controller behavior.
6. Security integration.
7. Build and diagnostics.
8. Full verification.
9. Documentation reconciliation.

This order is guidance, not a mandatory template.

Approve a different order when the plan explains why it is safer or more
efficient.

---

## Step 11: Verify Validation Steps

Each significant step must define how its result will be checked — the
"Evidence Before Completion" principle, applied step by step.

Planned evidence may include:

- `npm run typecheck` result;
- `npm run lint` result;
- `npm run format:check` result;
- `npm run test` result;
- `npm run build` result where the plan requires the compiled output;
- generated-OpenAPI comparison against the approved contract;
- security review;
- traceability report.

A plan that ends with an unverified statement such as "ensure everything
works" is not ready.

---

## Step 12: Review Change Size

Determine whether the plan is reasonably reviewable as one Pull Request.

**Judge by coherence, not by size.** File count alone is not a finding: a Story
that legitimately touches five layers of one module produces more files than one
that edits two, and both are reviewable. Ask instead whether a reviewer can hold
the change in their head as a single idea.

Flag when any of these hold — each is checkable, none needs a threshold:

- the plan delivers **more than one independently shippable capability** (the
  strongest signal; a plan that could be split into two Stories, each with its
  own Acceptance Criteria, should be);
- it touches a module that no Acceptance Criterion, design element, or
  impact-analysis entry accounts for;
- it adds a dependency (always flag; approval is separate);
- it includes refactoring not required by an approved artifact;
- a single plan step changes files across more than one layer for reasons the
  step does not state.

If none of these hold, a large plan is a large plan — say so and move on.

Do not split scope automatically.

Recommend a human decision when decomposition is needed.

---

## Step 13: Classify Findings

Severity is defined once, in `docs/workflow/artifact-lifecycle.md` §4 (`Critical` and `Major` both block; `Minor` does not). What follows is what each level looks like at this stage.

Classify each finding as:

### Critical

Blocks plan approval.

Examples:

- unresolved requirement;
- missing Acceptance Criterion coverage;
- security requirement omitted;
- contradiction with approved design;
- stale Specification;
- unsupported scope expansion.

### Major

Requires plan correction before implementation.

Examples:

- incomplete test strategy;
- affected component omitted;
- unclear execution order;
- non-reviewable step;
- missing validation evidence.

### Minor

Improves clarity or maintainability but does not block execution.

Examples:

- naming consistency;
- additional explanation;
- optional optimization;
- documentation refinement.

---

## Step 14: Determine Loop-Back Target

`stage-map.yaml` defines exactly one loop-back for `PLAN_REVIEW`:
`changes_required` → `IMPLEMENTATION_PLANNING`.

For every Critical or Major finding, identify the earliest stage that could
correct it. If that stage is upstream of `IMPLEMENTATION_PLANNING`
(a Specification / design / impact-analysis defect), the plan cannot be fixed by
re-planning alone: return `verdict: BLOCKED` and name the upstream stage in
`blocking_issues` so a human can route it. Otherwise return
`verdict: CHANGES_REQUIRED` with `loop_back_stage: IMPLEMENTATION_PLANNING`.

Do not send trivial issues back; use `non_blocking_findings` for `Minor` items.

---

## Step 15: Produce Plan Review

Create the `plan_review` artifact at its registry path
(`docs/reviews/plans/{story_id}-plan-review.md`), front matter per
`docs/workflow/artifact-schema.md` (`artifact_type: plan_review`).

Do not modify the Implementation Plan. Do not update workflow state.

---

# Output

- `plan_review` at
  `docs/reviews/plans/{story_id}-plan-review.md`,
  front matter per `docs/workflow/artifact-schema.md`,
  `artifact_type: plan_review`.

Use `references/plan-review-template.md` — it carries the exact section order,
the front-matter block, and what each section must contain. **The template is
the list; this file keeps no second copy of it**, because a copy drifts and a
reader cannot tell which one is current. Open it before writing.

---

# Validation Checklist

Before returning the result envelope, confirm each of these:

- Every review dimension was evaluated and recorded, including those that found
  nothing.
- Every finding names a plan step and what would resolve it.
- The verdict follows from the highest-severity finding.
- Any loop-back key named exists under `PLAN_REVIEW` in `stage-map.yaml`.
- The plan itself was not edited.


# Result Envelope

Return exactly this (shape: `docs/workflow/artifact-lifecycle.md` §5); the story-orchestrator records the transition (this Skill
does not update `workflow-state.yaml`):

```yaml
result:
  verdict: PASS | CHANGES_REQUIRED | BLOCKED
  stage: PLAN_REVIEW
  story: <StoryId>
  artifact_status: APPROVED        # of the plan_review artifact itself
  artifacts:
    - docs/reviews/plans/<StoryId>-plan-review.md
  next_stage: HUMAN_PLAN_APPROVAL
  loop_back_stage: null            # or IMPLEMENTATION_PLANNING
  loop_back_key: null              # or changes_required
  blocking_issues: []
  non_blocking_findings: []
```

- `PASS` — no Critical or Major findings; every Acceptance Criterion covered;
  security and validation sufficient; the plan is executable and reviewable as
  one Pull Request. Minor findings go in `non_blocking_findings`. The
  orchestrator then advances to `HUMAN_PLAN_APPROVAL`.
- `CHANGES_REQUIRED` — Critical or Major findings that re-planning can fix;
  `loop_back_stage: IMPLEMENTATION_PLANNING`.
- `BLOCKED` — mandatory artifact missing/stale; blocking Open Decision;
  architecture documentation unavailable; an upstream (Specification / design /
  impact-analysis) defect the plan cannot resolve — name the upstream stage in
  `blocking_issues`; or the plan cannot be evaluated reliably.

---

# Boundaries

This Skill must not:

- edit the Implementation Plan;
- generate source code or tests;
- alter OpenAPI, designs, or the Specification;
- resolve Open Decisions;
- update workflow state (the orchestrator does that);
- create a branch, commit, or Pull Request;
- approve its own generated plan;
- replace the `HUMAN_PLAN_APPROVAL` gate.

---

# Failure Handling

If the plan is missing:

1. Create a `plan_review` artifact with the review context.
2. Record the missing path in `blocking_issues`.
3. Return `verdict: BLOCKED` (a missing plan is not something plan review can
   route; the orchestrator holds at `PLAN_REVIEW` / `IMPLEMENTATION_PLANNING`).
4. Stop.

If an input artifact is stale (a downstream artifact recorded an older upstream
version):

1. Identify the version mismatch.
2. Return `verdict: BLOCKED`; name the stale artifact in `blocking_issues`.
3. Recommend regeneration of the dependent artifacts.
4. Stop before detailed approval.

If repository verification is not possible (dependencies not installed, build
broken for unrelated reasons):

1. Continue with the document and file-based review.
2. Record which checks could not be confirmed against the code.
3. Avoid unsupported claims about symbol relationships.
4. Downgrade the affected findings to lower confidence.

---

# Completion Criteria

Plan Review is complete only when:

- active Story is identified;
- artifact versions are validated;
- scope is checked;
- Acceptance Criteria are traced;
- Impact Analysis coverage is checked;
- architecture is reviewed;
- API impact is reviewed;
- persistence impact is reviewed;
- security is reviewed;
- testing and validation are reviewed;
- execution order is reviewed;
- change size is assessed;
- findings are classified;
- loop-back target is assigned when the verdict is `CHANGES_REQUIRED`;
- the `plan_review` artifact is saved;
- the result envelope is returned with an explicit `verdict`.

Test writing and implementation must not begin when the verdict is
`CHANGES_REQUIRED` or `BLOCKED`, and only begin after `HUMAN_PLAN_APPROVAL`.
