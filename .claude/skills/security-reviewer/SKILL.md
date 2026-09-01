---
name: security-reviewer
description: >
  Performs an independent security review of the active User Story
  implementation in the Customer Portal Node/TypeScript Express API. Reviews
  authentication, authorization, sensitive data handling, input validation,
  API exposure, persistence, configuration, dependencies, logging, tests,
  and security-relevant deviations from approved artifacts. Use after
  Implementation Verification and before Reconciliation or Pull Request
  creation.
---

# Purpose

Perform an independent, evidence-based security review of the active User
Story implementation.

The Skill determines whether the implementation introduces unacceptable
security risks or violates approved security requirements.

The Skill focuses on security properties rather than general functional
correctness.

The Skill does not assume that successful compilation, passing tests, or an
approved Implementation Verification automatically imply secure behavior.

The Skill produces a Security Review artifact.

The Skill does not modify production code, rewrite tests, accept security
risk, create a Pull Request, approve merge, or mark the Story complete.

---

# Position in the Workflow

Canonical workflow: `docs/workflow/stage-map.yaml`. Relevant slice:

    IMPLEMENTATION_VERIFICATION
    → SECURITY_REVIEW            (this Skill)
    → RECONCILIATION
    → PR_REVIEW
    → HUMAN_PR_APPROVAL
    → PR_PREPARATION → READY_FOR_PR → COMPLETED → ARCHIVED

This Skill owns only the `SECURITY_REVIEW` stage. Loop-back
(`stage-map.yaml`): `changes_required` → `IMPLEMENTATION`,
`invalid_security_design` → `API_DESIGN`.

---

# Security Review Scope

The review covers security behavior introduced, modified, or affected by the
active User Story.

Review areas include:

- authentication;
- authorization;
- password and credential handling;
- sensitive data exposure;
- request validation;
- output encoding and serialization;
- error handling;
- persistence constraints;
- configuration;
- logging;
- dependency changes;
- database exposure;
- insecure defaults;
- security test coverage;
- abuse and misuse scenarios;
- deviations from approved security requirements.

The review must remain scoped to the active User Story and its affected
components.

Repository-wide security assessment is outside this Skill unless explicitly
requested.

---

# When To Use

Use this Skill when:

- an active User Story is configured;
- implementation has completed;
- an Implementation Report exists;
- Implementation Verification has completed;
- security review is the current workflow stage;
- the Story affects user input, credentials, authentication, authorization,
  personal data, persistence, API exposure, configuration, or external
  integrations;
- a previous Security Review rejected the implementation and security fixes
  have been applied.

Typical requests:

- Perform Security Review for the active User Story.
- Review the active Story's implementation for security issues.
- Check whether the registration implementation is safe for reconciliation.
- Re-run Security Review after security fixes.
- Review authentication, password handling, and data exposure for this Story.

---

# When Not To Use

Do not use this Skill:

- before implementation exists;
- before Implementation Verification;
- to define product security policy;
- to invent missing security requirements;
- to implement security fixes;
- to generate the initial test suite;
- to perform general code style review;
- to perform final Reconciliation;
- to accept security risk on behalf of a human;
- to create, approve, or merge a Pull Request;
- to change workflow state automatically;
- as a substitute for professional penetration testing or organization-specific
  security assessment when such assessment is required.

---

# Independent Review Principle

The Security Reviewer must remain independent from the Implementor.

The Implementor answers:

    Which security requirements were implemented?

The Security Reviewer answers:

    Which security properties can be independently verified, and which risks
    remain?

Do not trust the Implementation Report or Implementation Verification Report
without checking the underlying implementation and available evidence.

Do not treat the presence of auth middleware, helmet, or a rate limiter as
proof that the application is secure — check that each is actually applied to
the route in question.

Do not treat password hashing as sufficient protection if password input,
logging, serialization, database constraints, or endpoint access remain
unsafe.

---

# Active Scope

Read:

- docs/workflow/active-story.yaml
- docs/workflow/workflow-state.yaml

Determine:

- active Story ID;
- current workflow stage;
- current artifact versions;
- implementation attempt;
- verification attempt;
- security review attempt;
- expected next stage.

Work only on the active User Story.

If no active Story is configured, stop and report:

    SECURITY_REVIEW_BLOCKED:
    No active User Story is configured.

If the workflow stage does not permit Security Review, stop and report:

    SECURITY_REVIEW_BLOCKED:
    Current workflow stage does not allow Security Review.

Do not select another Story automatically.

---

# Canonical Sources

- Workflow / stage / loop-back: `docs/workflow/stage-map.yaml`
  (`SECURITY_REVIEW`; loop_back `changes_required` → `IMPLEMENTATION`,
  `invalid_security_design` → `API_DESIGN`).
- Artifact paths: `docs/workflow/artifact-paths.yaml` — **authoritative**.
  Resolve every path from its registry key. Paths shown are illustrative.
- Status vocabulary: `docs/workflow/artifact-lifecycle.md`.
- Front matter: `docs/workflow/artifact-schema.md`.

# Required Context

Read AGENTS.md first. Read `docs/workflow/active-story.yaml` and
`docs/workflow/workflow-state.yaml` (read only).

Read (registry keys, resolved via `artifact-paths.yaml`):

- `story`
- `specification`, `specification_review`
- `impact_analysis`
- `implementation_plan`, `plan_review`
- `implementation_report`
- `implementation_verification`  ← reuse its build/test evidence
- `api_design`, `openapi`, `database_design`, `entity_model`
  (or their `NOT_APPLICABLE` record)
- `design_review`
- `test_strategy`, `ac_test_matrix`  (+ executable tests: `*.test.ts` beside
  the modules they cover, and `tests/integration/`)
- `open_decisions`

Read relevant project configuration: `package.json`, `package-lock.json`,
`tsconfig.json`, `eslint.config.js`, `src/config/env.ts`, `src/app.ts`,
`src/middleware/`, `prisma/schema.prisma` and its migrations, `.gitignore`,
`.env.example`.

Read prior evidence only when needed: `docs/evidence/`.

Read architecture references:

- docs/architecture/architecture.md
- docs/architecture/module-map.md
- docs/architecture/api-conventions.md
- docs/architecture/persistence-conventions.md
- docs/architecture/security-conventions.md

Read product context:

- docs/product/business-rules.md
- docs/product/business-glossary.md
- docs/product/non-functional-requirements.md

(`open_decisions` is listed in Required Context above.)

Do not load unrelated Story artifacts unless a concrete security dependency
requires them.

---

# Artifact Authority

Use the following authority order:

1. Active User Story and Acceptance Criteria
2. Approved Specification
3. Resolved Story decisions
4. Approved security requirements and conventions
5. Approved API and database designs
6. Approved Implementation Plan
7. Product-wide business rules and NFRs
8. Implementation Verification evidence
9. Current code and configuration
10. Implementation Report claims

Current code cannot redefine security requirements. Tests cannot redefine
security requirements.

A convenient implementation choice cannot replace an unresolved security
decision.

If authoritative artifacts conflict, stop and report the conflict. Do not
silently select the least restrictive interpretation.

---

# Preconditions

## Implementation Verification

`implementation_verification` must exist with verdict `PASS`, current version.

Do not proceed to a positive Security Review result when
`implementation_verification` verdict is `CHANGES_REQUIRED` / `BLOCKED` /
missing. A functionally-failing implementation returns to the stage
`implementation-verifier` named before Security Review runs.

`specification_review`, `design_review`, and `plan_review` verdicts must be
`PASS`; `HUMAN_SPEC_APPROVAL` and `HUMAN_PLAN_APPROVAL` recorded. Record every
consumed artifact version in this review's `inputs`; any `SUPERSEDED` mandatory
input → `verdict: BLOCKED`.

## Security Requirements

The Specification or resolved Story decisions must define security-relevant
behavior when the Story handles:

- passwords;
- credentials;
- authentication;
- authorization;
- roles;
- personal data;
- account state;
- tokens;
- external input;
- externally accessible endpoints.

If material security behavior is undefined, do not invent policy. Return
`verdict: BLOCKED`; name `SPECIFICATION` in `blocking_issues` (an undefined
security requirement is an upstream defect, not something Security Review can
route to `IMPLEMENTATION`).

## Architecture Documentation

`docs/architecture/security-conventions.md` is the authority for this review,
together with the architecture, API, and persistence convention documents.

They are substantial today, so the realistic failure is not an empty file but a
**gap**: a security property the implementation exercises that no convention
rules on. Name the missing rule and return `verdict: BLOCKED` with
`SPECIFICATION` in `blocking_issues`. Never close a gap with general security
practice — an unstated rule is an Open Decision, not a default.

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

Security-sensitive Open Decisions are blockers.

Examples include:

- password policy;
- password hashing algorithm and parameters;
- password policy;
- account activation behavior;
- email uniqueness and normalization behavior;
- authentication requirements and token lifetimes;
- refresh-token rotation and revocation storage;
- authorization and ownership rules;
- rate-limit thresholds and lockout policy;
- sensitive data retention;
- CORS allow-list and proxy topology;
- migration strategy;
- error response information;
- audit logging requirements.

## Working Tree

Inspect the current Git state.

Identify:

- modified files;
- untracked files;
- deleted files;
- runtime artifacts (`dist/`, coverage, logs);
- configuration files;
- secret-like files (`.env`, key material, dumps);
- unrelated changes.

Do not modify or remove existing changes.

---

# Security Review Principles

## Requirements Before Assumptions

Security behavior must come from approved artifacts.

Do not invent password complexity, account lockout, token expiration, or other
business policies during review.

If a necessary security decision is missing, report it as a blocker.

## Deny by Default

Externally accessible functionality should not become publicly available
unless the approved requirements explicitly allow it.

## Least Privilege

Accounts, endpoints, tools, database access, and configuration should receive
only the permissions required by the current Story.

## Defense in Depth

Do not rely on a single control when multiple layers are appropriate.

Examples:

- request validation and database constraints;
- authorization rules and service-level ownership checks;
- password hashing and response DTO isolation;
- secret scanning and Git ignore rules.

## No Sensitive Data Exposure

Credentials and internal security data must not be exposed through:

- API responses;
- logs;
- exceptions;
- generated reports;
- telemetry;
- database consoles;
- committed files.

## Verify Runtime Effect

The presence of a middleware import, a config object, or a schema definition
does not prove that the control is active. A guard that is never registered in
`src/app.ts`, or registered after the route it protects, is inert.

Prefer runtime, test, configuration, or framework-wiring evidence.

## Evidence Over Confidence

A reviewer statement such as:

    The implementation appears secure.

is not sufficient evidence.

---

# Threat-Oriented Review Model

For each externally observable capability, consider:

- who can invoke it;
- what input is accepted;
- what data is read;
- what data is written;
- what sensitive data exists;
- what trust boundary is crossed;
- what happens on invalid input;
- what happens on repeated input;
- what happens on unauthorized input;
- what information is revealed by errors;
- what state can be changed;
- what abuse is possible.

Use practical, Story-scoped abuse cases.

Do not produce speculative enterprise threat models unrelated to the active
Story.

---

# Tooling Strategy

## Project inspection

- `Read` on `src/app.ts`, `src/middleware/`, `src/config/env.ts`, the module
  route files, `prisma/schema.prisma` and its migrations, `.gitignore`,
  `.env.example`, `package.json`.
- `git status --short`, `git diff` (read-only) for what actually changed.

## Evidence patterns

Trace security properties with targeted `Grep` over the changed surface and
confirm by reading the file:

- which routes mount the auth middleware, and which are deliberately public;
- where `argon2.hash` / `argon2.verify` are called, and whether any other
  hashing path exists;
- where tokens are signed and verified, and whether the algorithm is pinned;
- where the refresh cookie is set (`httpOnly`, `secure`, `sameSite`) and where
  it is rotated or revoked;
- every response DTO the Story touches, checked for `passwordHash`, tokens, or
  other sensitive fields;
- `process.env` outside `src/config/env.ts`; `console.log` under `src/`;
- rate limiters, `helmet`, `cors`, body-size limit, and `trust proxy` in
  `src/app.ts`;
- Pino redaction configuration in `src/lib/logger.ts`.

If the editor's IDE integration is connected, its live diagnostics are usable as
extra evidence. Never assume it is available and never block on it:
`npm run typecheck` and `npm run lint` are the authoritative signals.

## Build, lint, and tests

Reuse the evidence in `implementation_verification`. Re-run only when tracked
files changed after it:

- `npm run typecheck`
- `npm run lint`
- `npm run test` / `npx vitest run <path>` for the security tests

## Dependency review

- `npm audit` (and `npm audit --omit=dev` for the runtime surface) when the
  change touches dependencies; record the actual output.
- Compare `package.json` / `package-lock.json` diffs against the approved plan.

## Runtime

Do not start the application on an externally reachable interface. Prefer
Supertest against `src/app.ts`. Database access stays read-only outside approved
automated tests; never execute destructive SQL and never copy real data into a
report.

Record actual results. Do not claim a check that was not executed.

---

# Security Review Workflow

## Step 1: Resolve Active Story

Read workflow state.

Record:

- Story ID;
- current stage;
- implementation attempt;
- Implementation Verification version;
- Security Review attempt;
- relevant artifact versions.

Confirm that SECURITY_REVIEW is the current permitted stage.

---

## Step 2: Validate Artifact Chain

Verify that the Security Review uses current versions of:

- User Story;
- Specification;
- Specification Review;
- API Design;
- Database Design;
- Impact Analysis;
- Implementation Plan;
- Plan Review;
- Implementation Report;
- Implementation Verification.

If a material input is stale or superseded:

1. set result to BLOCKED;
2. list stale artifacts;
3. recommend regeneration of dependent artifacts;
4. stop before positive approval.

---

## Step 3: Determine Security-Relevant Scope

From the Story, Specification, designs, Impact Analysis, Implementation Plan,
and changed files, identify:

- exposed endpoints;
- authentication changes;
- authorization changes;
- password or token handling;
- personal data;
- persistence changes;
- validation changes;
- error handling changes;
- configuration changes;
- dependency changes;
- logging changes;
- external integrations.

Create a Story-specific security checklist.

---

## Step 4: Identify Assets and Trust Boundaries

List relevant assets:

- user credentials;
- password hashes;
- email addresses;
- account identifiers;
- role information;
- database content;
- configuration;
- session or authentication state.

Identify relevant trust boundaries:

- external client to Controller;
- Controller to Service;
- Service to Repository;
- application to database;
- application to external system;
- developer environment to repository;
- MCP tool to external service.

Do not invent boundaries that are unrelated to the Story.

---

## Step 5: Inspect Dependency Changes

Compare current dependencies with the approved plan.

Check for:

- newly added dependencies;
- unexpected transitive capabilities;
- unnecessary security libraries;
- obsolete or duplicate components;
- development-only dependencies used at runtime;
- test dependencies leaking into production configuration.

New dependencies without explicit approval are findings.

If dependency vulnerability tooling is unavailable, record that vulnerability
database checking was not performed.

Do not claim that dependencies are vulnerability-free without evidence.

---

## Steps 6-20: The review areas

Fifteen areas. Each one asks the same question — *does the implemented behavior
match an approved security requirement, and is the control actually in effect at
runtime?* Skip an area only when the Story cannot touch it, and record that it
was skipped and why.

| # | Area | Read |
|---|---|---|
| 6 | Authentication and middleware wiring | `src/app.ts`, `src/middleware/`, route files |
| 7 | Password handling | service, repository, schemas, fixtures |
| 8 | Sensitive data exposure | DTOs, serialization, errors, logs, telemetry |
| 9 | Input validation | Zod schemas, validation middleware |
| 10 | Account and identity rules | service, business rules |
| 11 | Authorization | routes, service, ownership checks |
| 12 | API security | approved OpenAPI vs implementation |
| 13 | Error handling | error middleware, error bodies |
| 14 | Persistence security | `schema.prisma`, migration SQL, repositories |
| 15 | Runtime configuration | `src/config/env.ts`, `.env.example`, `.gitignore` |
| 16 | Logging and telemetry | logger config, log call sites, hooks |
| 17 | Secrets and repository hygiene | tracked and untracked files |
| 18 | Security tests | test files and their assertions |
| 19 | Abuse cases | the Story's scope |
| 20 | Plan and implementation deviations | the whole approved chain |

### 6. Authentication and middleware wiring

Verify per-route access rules — which routes require the auth middleware and
which are deliberately public (register, login, refresh, health); default-deny
where the design requires it; token verification with a pinned algorithm
allow-list, the secret sourced from `src/config/env.ts`, and expiry actually
enforced; refresh-cookie flags (`httpOnly`, `secure`, `sameSite: "strict"`),
rotation, and revocation on logout and on reuse; CSRF posture, where
`SameSite=Strict` is the approved mechanism and any deviation needs an approved
decision; password hashing configuration (Argon2id, parameters, no alternative
path); middleware order in `src/app.ts`; helmet, CORS allow-list, body size
limit, `trust proxy`, rate limiters; the error handler registered last, returning
the approved generic body.

Flag broad rules: wildcard CORS with credentials, blanket `trust proxy`, or a
route reachable without the guard the design requires.

**A guard registered after the route it protects does nothing.** Never assume an
endpoint is protected because auth middleware exists somewhere in the app —
confirm it is applied to that route.

### 7. Password handling

When the Story handles passwords, verify that the plaintext password is accepted
only at the request boundary and is never persisted, logged, or returned; that
the password hash is never returned; that the approved encoder is used and its
configuration is not a no-op; that the password policy matches approved
requirements and an invalid password is rejected before persistence; that DTO and
record serialization cannot expose credential fields; and that test fixtures
introduce no committed real credentials.

Use the password mechanism defined by the approved security conventions. **If a
policy is absent, do not invent one** — record an Open Decision.

### 8. Sensitive data exposure

Inspect response DTOs, Prisma record serialization, error responses, log
statements, debug output, implementation reports, telemetry, database previews,
and test output.

Sensitive fields include the password, the password hash, tokens, the
authorization header, database credentials, secret keys, and internal security
state. Flag broad serialization of persistence records.

### 9. Input validation

Verify that validation is defined for every external input, is active at runtime,
and is server-side; that malformed input is rejected; that length constraints are
explicit and required fields enforced; that email validation follows approved
behavior; that unexpected fields cannot create unsafe state; and that validation
errors reveal no internal detail.

**A schema that is defined but never applied by the validation middleware
validates nothing** — confirm it runs on the route.

### 10. Account and identity rules

When the Story creates or modifies accounts, verify email uniqueness;
case-sensitivity behavior; default role; default account state; disabled-account
behavior; duplicate-registration behavior; ownership boundaries; identifier
exposure.

Confirm the implementation follows approved business rules. Do not infer identity
policy from framework defaults.

### 11. Authorization

For every affected operation determine whether it is public; whether
authentication is required; which role or principal may invoke it; whether
ownership checks are required; whether administrative operations are isolated;
and whether a service method can bypass endpoint authorization.

Look for insecure direct object access wherever an identifier is accepted.

**Authorization findings are Critical when an unauthorized user can read or
modify protected data.**

### 12. API security

Against the approved API design, verify that only approved endpoints exist; that
HTTP methods are appropriate; that request fields are restricted and response
fields minimized; that error responses leak no internal information; that
duplicate and validation behavior reveals no unnecessary data; that
authentication and authorization declarations match the implementation; and that
content types are constrained where required.

Undocumented endpoints or response fields are findings.

### 13. Error handling

Verify that no error response exposes anything in the list in
`security-conventions.md` SC-9 — that list is authoritative, and is deliberately
not copied here, so check the current SC-9 rather than a snapshot of it.

Check whether differing error responses unintentionally reveal account existence
where the product prohibits that. Do not redefine the approved duplicate-email
response during review; if the account-enumeration policy is undefined and
materially relevant, create an Open Decision.

### 14. Persistence security

Against the approved DB design, verify that password fields cannot contain
plaintext by design and by behavior; that sensitive columns have appropriate
length and nullability; that email uniqueness is enforced at the appropriate
layer; that constraints are explicit; that sensitive columns are never selected
into a response path; that the database URL and credentials come from the
environment and are absent from the repository, responses, and logs; that the
migration matching the model change is committed; and that no destructive
migration was applied without an approved decision.

**A clean application start is not evidence that the schema matches the design —
read the migration SQL.**

### 15. Runtime configuration

Inspect `src/config/env.ts`, `.env.example`, `src/app.ts`, and `.gitignore`.

Verify that every required variable is validated at startup and the process fails
fast when one is missing or invalid; that no `process.env` is read outside
`src/config/env.ts`; that no secret, token, connection string, or `.env` file is
committed and `.env.example` carries placeholders only; that CORS origins come
from configuration and never a wildcard with credentials; that `trust proxy`
matches the real deployment topology; that cookie `secure` is not disabled
outside local development and HTTPS is assumed in production; that
development-only settings (verbose logging, permissive CORS, disabled rate
limits) cannot become the runtime default; and that no debugging endpoint, admin
route, or introspection surface was added without an approved decision.

A committed live secret, or an externally reachable debug or admin surface, is a
Critical finding.

### 16. Logging and telemetry

Verify that logs and telemetry contain no password, password hash, authorization
header, token, credential-bearing request body, database credential, or
unnecessary personal information.

Tool-usage logs should record metadata — tool name, timestamp, status, input
size, response size — rather than full payloads. If PostToolUse telemetry stores
full tool input or response, flag the risk and recommend redaction or
metadata-only logging.

### 17. Secrets and repository hygiene

Inspect tracked and untracked files for tokens; authorization headers; hardcoded
passwords, JWT secrets, or API keys; private keys; `.env` files; connection
strings with credentials; database dumps; copied MCP or IDE configuration
containing secrets; logs containing credentials.

**Never copy a suspected secret value into the Security Review.** Record only the
file path, the secret category, and the remediation requirement. A potential live
secret is a Critical finding and requires human action.

### 18. Security tests

Verify that tests cover the relevant security behavior. For registration that
typically means: the password is hashed before persistence; the plaintext
password is not stored; the hash is not in the response; an invalid password is
rejected; an invalid email is rejected; duplicate-email behavior is enforced;
unapproved fields are not returned; the refresh token never appears in a response
body; a protected route rejects an absent, expired, or tampered token; endpoint
access matches the approved public or protected status.

Assess test quality: **a test that only asserts a method was called does not
prove the security property.**

### 19. Abuse cases

Identify a small set of realistic misuse cases for the active Story. For
registration, consider repeated duplicate registrations; malformed email;
oversized input; a weak or invalid password; unexpected request fields; attempts
to submit role or account-state fields; response inspection for sensitive fields;
unauthorized access to administrative behavior.

Include only cases relevant to approved scope. Do not invent rate limiting or
denial-of-service protections as mandatory requirements unless approved artifacts
define them; if one is materially needed but undefined, record an Open Decision
or a recommendation.

### 20. Plan and implementation deviations

Compare actual security behavior with the Specification, the security
conventions, the API design, the DB design, the Implementation Plan, the
Implementation Report, and the Implementation Verification.

Identify undocumented security behavior; omitted controls; permissive defaults;
unapproved changes; security-relevant supporting changes; false or incomplete
implementation claims.

---

## Step 21: Classify Findings

Severity is defined once, in `docs/workflow/artifact-lifecycle.md` §4 (`Critical` and `Major` both block; `Minor` does not). What follows is what each level looks like at this stage.

Classify each finding as:

### Critical

Blocks progression.

Examples:

- plaintext password persistence;
- password, hash, or refresh-token exposure in a response or log;
- a protected route reachable without authentication;
- identity taken from a client-supplied id instead of the token;
- unrestricted access to protected functionality;
- committed token or credential;
- missing required authorization;
- security-sensitive Open Decision implemented as an assumption;
- active test bypass hiding insecure behavior.

### Major

Requires correction before Reconciliation or Pull Request.

Examples:

- missing security test;
- weak input validation;
- undocumented security configuration;
- incomplete error sanitization;
- missing persistence constraint;
- unnecessary sensitive logging;
- unapproved dependency;
- generated database files tracked by Git.

### Minor

Does not immediately block progression but should be addressed or documented.

Examples:

- low-risk information exposure;
- incomplete security documentation;
- non-sensitive verbose logging;
- maintainability issue in security configuration;
- defense-in-depth recommendation not required by current Acceptance Criteria.

### Informational

Useful observation with no required correction. Informational observations must
not inflate severity.

---

## Step 22: Assign Security Category

For every finding assign one category:

- AUTHENTICATION;
- AUTHORIZATION;
- PASSWORD_HANDLING;
- DATA_EXPOSURE;
- INPUT_VALIDATION;
- API_SECURITY;
- ERROR_HANDLING;
- PERSISTENCE;
- CONFIGURATION;
- DEPENDENCY;
- LOGGING;
- SECRET_MANAGEMENT;
- TEST_COVERAGE;
- REPOSITORY_HYGIENE;
- OTHER.

---

## Step 23: Determine Loop-Back Target

`stage-map.yaml` defines two loop-backs for `SECURITY_REVIEW`:

| Root cause | verdict | loop_back_stage | key |
|---|---|---|---|
| Correct artifacts but insecure code | `CHANGES_REQUIRED` | `IMPLEMENTATION` | `changes_required` |
| Approved API/security design exposes a prohibited field or permits unsafe access | `CHANGES_REQUIRED` | `API_DESIGN` | `invalid_security_design` |

For any other upstream root cause (missing password policy / authorization
requirement → `SPECIFICATION`; missing security test → `TEST_WRITING`; omitted
security component → `IMPACT_ANALYSIS`; missing security step → the plan; a
change since verification → `IMPLEMENTATION_VERIFICATION`), return
`verdict: BLOCKED` and name the responsible stage in `blocking_issues` for the
orchestrator / a human to route. Do not route every finding to `IMPLEMENTATION`.

---

## Step 24: Create Security Review Report

Create the `security_review` artifact at its registry path
(`docs/reviews/security/{story_id}-security-review.md`), front matter per
`docs/workflow/artifact-schema.md` (`artifact_type: security_review`).

Do not modify source code, tests, or approved artifacts. Do not update workflow
state. Do not create a commit or Pull Request.

---

# Security Review Report Format

## Front Matter

Shared block from `docs/workflow/artifact-schema.md`
(`artifact_type: security_review`), plus: `critical_findings`,
`major_findings`, `minor_findings`, `informational_findings`,
`security_sensitive` (bool), `runtime_checks` (`FULL` / `PARTIAL` / `NONE`),
`analysis_mode` (`TYPE_CHECKED` / `TEXT_ONLY`).
`created_at` / `updated_at` are runtime timestamps.

Illustrative (dates are examples only):

    ---
    artifact_type: security_review
    story: US-001
    version: 1
    status: DRAFT
    created_at: <runtime>
    updated_at: <runtime>
    produced_by: security-reviewer
    inputs:
      - path: docs/evidence/US-001-implementation-report.md
        version: 1
      - path: docs/verification/US-001-implementation-verification.md
        version: 1
      - path: docs/specifications/US-001-spec.md
        version: 1
    supersedes: null
    critical_findings: 1
    major_findings: 2
    minor_findings: 1
    informational_findings: 0
    security_sensitive: true
    runtime_checks: PARTIAL
    analysis_mode: TYPE_CHECKED
    ---

## 1. Executive Summary

Summarize:

- overall security result;
- principal security controls;
- Critical and Major risks;
- review limitations;
- recommended next action.

## 2. Reviewed Artifacts

List exact artifact paths and versions.

## 3. Security-Relevant Scope

Describe:

- exposed functionality;
- protected assets;
- trust boundaries;
- affected security components.

## 4. Environment and Tools

Record:

- Node version;
- Express, Prisma, and Zod versions in use;
- `NODE_ENV` and the configuration actually loaded;
- database target used for evidence;
- review commands run;
- checks that could not be executed;
- runtime capabilities;
- unavailable checks.

Do not record secrets.

## 5. Authentication Review

Record:

- applicable requirements;
- implementation evidence;
- tests;
- findings.

## 6. Authorization Review

Record:

- endpoint access;
- role checks;
- ownership checks;
- service-level boundaries;
- findings.

## 7. Password and Credential Handling

Record:

- request handling;
- policy enforcement;
- hashing;
- persistence;
- serialization;
- logging;
- tests;
- findings.

## 8. Sensitive Data Exposure

Record review results for:

- responses;
- entities;
- DTOs;
- logs;
- exceptions;
- reports;
- telemetry.

## 9. Input Validation

Record:

- constraints;
- runtime activation;
- negative scenarios;
- oversized or malformed input;
- findings.

## 10. API Security

Record:

- exposed endpoints;
- approved public access;
- protected operations;
- request and response restrictions;
- error behavior;
- findings.

## 11. Persistence Security

Record:

- sensitive fields;
- schema constraints;
- uniqueness;
- nullability;
- database location;
- generated files;
- findings.

## 12. Runtime Configuration

Record:

- startup environment validation;
- CORS, helmet, body limit, `trust proxy`, rate limits;
- cookie flags;
- secret handling;
- unsafe defaults;
- findings.

## 13. Logging and Telemetry

Record:

- sensitive logging review;
- hook telemetry review;
- payload retention;
- redaction controls;
- findings.

## 14. Dependencies

Record:

- added dependencies;
- approval status;
- review limitations;
- vulnerability scanning evidence when available;
- findings.

Do not state that dependencies are secure when vulnerability scanning was not
performed.

## 15. Security Test Coverage

Map security requirements and abuse cases to tests.

## 16. Abuse Case Review

For every reviewed abuse case record:

- scenario;
- expected protection;
- evidence;
- status;
- finding.

## 17. Repository Hygiene

Record:

- secret-like files;
- runtime artifacts in the change set;
- ignored files;
- unsafe local configuration;
- findings.

## 18. Deviations

List deviations between approved security requirements and actual
implementation.

## 19. Findings

For each finding provide:

- ID;
- severity;
- category;
- affected file or artifact;
- observed evidence;
- expected security behavior;
- risk;
- required correction;
- loop-back target;
- verification required after correction.

Do not include actual secret values.

## 20. Positive Controls

List security controls that were independently observed and verified.

## 21. Open Decisions

List unresolved security decisions.

If none exist, state:

    No blocking security Open Decisions were identified.

## 22. Review Limitations

List checks that were not performed and explain why.

## 23. Verdict Rationale

Explain the verdict (see Result Envelope). Do not use `PROCEED_TO_*` /
`RETURN_TO_*` labels — they are retired. When a human security decision is
needed (risk acceptance, exception, suspected credential compromise), return
`verdict: BLOCKED` and say so explicitly in `blocking_issues`.

---

# Validation Checklist

Before returning the result envelope, confirm each of these:

- Every review step was performed and recorded, including those that found
  nothing.
- Every finding names a location, the asset at risk, and a remedy.
- No finding rests on a policy this Skill invented: each cites
  `security-conventions.md`, the Specification, or a resolved Open Decision.
- The verdict follows from the highest-severity finding.
- Nothing was fixed during the review.


# Result Envelope

Return exactly this (shape: `docs/workflow/artifact-lifecycle.md` §5); the story-orchestrator records the transition — this Skill
does not update `workflow-state.yaml`:

```yaml
result:
  verdict: PASS | CHANGES_REQUIRED | BLOCKED
  stage: SECURITY_REVIEW
  story: <StoryId>
  artifact_status: APPROVED        # of the security_review artifact itself
  artifacts:
    - docs/reviews/security/<StoryId>-security-review.md
  next_stage: RECONCILIATION
  loop_back_stage: null            # or IMPLEMENTATION / API_DESIGN
  loop_back_key: null              # or changes_required / invalid_security_design
  blocking_issues: []
  non_blocking_findings: []
```

## PASS

Use only when: `implementation_verification` verdict is `PASS`; no Critical or
Major findings; required security tests pass; security-sensitive Acceptance
Criteria are verified; no blocking security Open Decision. Minor / Informational
findings go in `non_blocking_findings`. The orchestrator advances to
`RECONCILIATION`.

## CHANGES_REQUIRED

Use when there is a Critical/Major finding the implementation (or the API/security
design) can fix:

- insecure code with correct artifacts → `loop_back_stage: IMPLEMENTATION`;
- the approved contract/design itself is unsafe →
  `loop_back_stage: API_DESIGN`.

## BLOCKED

Use when: a mandatory security requirement is undefined; a required artifact is
missing/stale; the implementation cannot be inspected; the environment prevents
meaningful review; a security-sensitive Open Decision is unresolved; a human
security decision is required; or the root cause is an upstream artifact other
than the API/security design (name the stage in `blocking_issues`).

---

# Prohibited Actions

This Skill must not:

- edit production code;
- edit tests;
- alter User Story or Acceptance Criteria;
- alter Specification;
- alter API or database design;
- alter Implementation Plan;
- resolve security decisions;
- accept security risk;
- expose secret values in reports;
- execute destructive database operations;
- create database connections without approval;
- weaken authentication, authorization, helmet, CORS, or rate-limit
  configuration;
- relax cookie flags or the token algorithm allow-list without an approved
  decision;
- disable or weaken security tests;
- suppress security findings;
- update workflow state automatically;
- commit or push files;
- create or merge a Pull Request;
- mark the Story `COMPLETED`;
- claim penetration testing was performed when the Skill only conducted code,
  configuration, and test review.

---

# Failure Handling

If `implementation_verification` verdict is not `PASS`:

1. Create the `security_review` artifact referencing the failed verification.
2. Return `verdict: BLOCKED`; put the verifier's recommended loop-back stage in
   `blocking_issues`.
3. Do not issue a positive security result.

If a potential live secret is found:

1. Do not display or copy the secret.
2. Record the affected file and secret category.
3. Create a Critical finding.
4. Recommend immediate human intervention.
5. Recommend credential rotation without claiming it has occurred.
6. Stop actions that could further expose the value.

If required runtime verification cannot be performed:

1. record the limitation;
2. continue static and configuration review where safe;
3. do not mark unverified controls as confirmed;
4. return `verdict: BLOCKED` (cannot evaluate) or `CHANGES_REQUIRED` (a concrete
   correctable insecurity was still found) according to impact.

If code-level confirmation is limited (dependencies not installed, an unrelated
build break):

1. use file inspection and pattern search;
2. record which checks could not be confirmed;
3. lower confidence where necessary;
4. avoid unsupported conclusions.

If vulnerability scanning is unavailable:

1. inspect dependency changes;
2. record that vulnerability database analysis was not performed;
3. do not claim dependency safety;
4. recommend an approved scanner when organizational policy requires one.

---

# Observability

Do not disable or bypass configured telemetry hooks.

Use telemetry to understand which tools and external capabilities participated
in implementation and verification.

Review telemetry for potential sensitive payload capture.

Preferred telemetry fields include:

- timestamp;
- session identifier;
- tool name;
- success or failure;
- input byte size;
- response byte size;
- duration when available.

Avoid logging full tool inputs and responses for security-sensitive tools.

Never store:

- passwords;
- password hashes;
- authorization tokens;
- authorization headers;
- database credentials;
- secret environment values;
- private keys;
- full credential-bearing request payloads.

If existing telemetry stores sensitive payloads, create a finding.

---

# Human Review Boundary

This Skill provides an engineering security review.

It cannot:

- accept business risk;
- approve exceptions to organizational policy;
- replace human code review;
- replace specialized security assessment;
- approve production deployment;
- approve merge;
- waive Critical or Major findings.

Return `verdict: BLOCKED` with an explicit "human security decision required"
note in `blocking_issues` when:

- a security exception is requested;
- risk acceptance is needed;
- a sensitive architectural decision remains open;
- available tooling cannot provide sufficient evidence;
- suspected credential compromise exists;
- organizational security policy requires specialist review.

The orchestrator surfaces this to a human; it is not a stage transition the
Skill routes.

---

# Completion Criteria

Security Review is complete only when:

- active Story and workflow stage are resolved;
- artifact versions are validated;
- security-relevant scope is identified;
- assets and trust boundaries are documented;
- authentication is reviewed when relevant;
- authorization is reviewed when relevant;
- password handling is reviewed when relevant;
- sensitive data exposure is reviewed;
- input validation is reviewed;
- API security is reviewed;
- persistence security is reviewed;
- runtime configuration is reviewed;
- logging and telemetry are reviewed;
- dependencies are reviewed within available capabilities;
- security tests are evaluated;
- relevant abuse cases are evaluated;
- repository hygiene is inspected;
- deviations are documented;
- findings are classified;
- loop-back targets are assigned;
- limitations are explicit;
- Security Review artifact is saved;
- review result is explicit;
- recommended next stage is explicit.

Finish with a concise summary containing:

- Security Review result;
- Critical finding count;
- Major finding count;
- principal risks;
- verified positive controls;
- review limitations;
- Security Review artifact path;
- recommended next stage.