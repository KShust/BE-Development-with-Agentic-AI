---
artifact_type: implementation_plan
story: US-001
version: 4
status: DRAFT
created_at: 2026-09-03T01:43:14Z
updated_at: 2026-09-03T12:35:48Z
produced_by: implementation-planner
inputs:
  - path: docs/stories/US-001-register-customer.md
    version: null
  - path: docs/decisions/US-001-open-decisions.md
    version: 7
  - path: docs/specifications/US-001-spec.md
    version: 14
  - path: docs/reviews/specifications/US-001-spec-review.md
    version: 11
  - path: docs/designs/api/US-001-api-design.md
    version: 2
  - path: docs/designs/api/US-001-openapi.yaml
    version: 2
  - path: docs/designs/database/US-001-db-design.md
    version: 2
  - path: docs/designs/database/US-001-entity-model.md
    version: 1
  - path: docs/reviews/designs/US-001-design-review.md
    version: 2
  - path: docs/impact-analysis/US-001-impact-analysis.md
    version: 2
  - path: docs/decisions/US-001-findings-triage.md
    version: 2
  - path: docs/reviews/plans/US-001-plan-review.md
    version: 3
supersedes: null
---

# Implementation Plan: Customer Registration (US-001)

## Revision history

**Revision 4 (2026-09-03).** `HUMAN_PLAN_APPROVAL` rejected revision 3 and routed
the Story back to `IMPLEMENTATION_PLANNING` (`docs/workflow/history.jsonl`,
2026-09-03T12:00:14Z, `human:KShust`). The rejection is not a quality finding —
the automated verdict was `PASS` and stands. It is the answer to Open Question 3,
and it goes against what revision 3 proposed: **the `!.env.test` negation is
declined and the recorded fallback is taken.** `PLAN_REVIEW:p-1` is thereby
answered. **No step boundary moves and no module file list changes**; what
changes is which side of D-4 is committed, and two defects in revision 3's own
text that the rejection identified.

| # | Change | Discharges |
|---|---|---|
| 1 | D-4 is rewritten to the fallback: CI supplies `DATABASE_URL` as a workflow variable, `.env.test` stays local-only, and `.gitignore` is **not modified at all** | `PLAN_REVIEW:p-1` — **answered at the gate**, no longer open |
| 2 | The `.gitignore` row **leaves** Files To Modify and Configuration Changes. Revision 3 claimed at D-4 that "either outcome leaves the file list … unchanged"; that was wrong, because `.gitignore:28` (`.env.*`) already ignores `.env.test`, so under the fallback there is nothing to change | the gate's second finding |
| 3 | D-4's count of the conventions the declined resolution would have crossed is corrected from **three to five**: revision 3 named `AGENTS.md` Prohibited, PC-10 and PC-1 but missed `security-conventions.md` **SC-7** lines 295 and 299 entirely | the gate's third finding |
| 4 | Front matter records `plan_review` at **v3**; revision 3 recorded v2, which `scripts/validate-harness.py` flags as a stale input | harness validator warning |

**Carried forward still open**, unchanged by this revision: `PLAN_REVIEW:p-4`
(`security-conventions.md` SC-3 line 178 — resolved in the repository by commit
`b28766f`, which this plan does not own and does not edit), `DESIGN_REVIEW:e-1`
(accepted at `b28766f`), and `PLAN_REVIEW:p-8` (D-10 omits `sequence` from the
shared root block; owed to `IMPLEMENTATION`, nil effect at one harness file).
Open Questions 1 and 2 stay recorded-not-blocking; **Question 3 is now answered
and is retained only as the record of the decision.**

**Revision 3 (2026-09-03).** `PLAN_REVIEW` revision 2 returned
`CHANGES_REQUIRED` on `PLAN_REVIEW:p-6` (Major) and routed the Story back to
`IMPLEMENTATION_PLANNING` (`docs/workflow/history.jsonl`, 2026-09-03T07:22:16Z).
The defect was in D-10's own decision text: the two projects it declared
collected `tests/harness.test.ts` into neither, so the repository's only existing
test would stop running. **Nothing about the Story, its scope, its file lists or
its step boundaries changed in this revision** — one project was added to one
array, and one mechanism the plan had left unnamed was named.

| # | Change | Discharges |
|---|---|---|
| 1 | D-10 declares **three** projects — `unit`, `harness`, `integration` — so the union of the `include` globs covers every test file the repository has; the collection assertion the review asked for is added to Step 3's evidence and executed | `PLAN_REVIEW:p-6` (the loop-back reason) |
| 2 | Step 3 and D-10 name `process.loadEnvFile()` on the installed Node as the `.env.test` reader, guarded so an externally set `DATABASE_URL` still wins, and state that no dependency is added for it | `PLAN_REVIEW:p-7` |
| 3 | Files Explicitly Not Changed states that `tests/harness.test.ts` is unchanged **and still collected**, which is the claim `p-6` showed the plan was not entitled to | `PLAN_REVIEW:p-6` |

**Carried to `HUMAN_PLAN_APPROVAL` still open**, unchanged by this revision:
`PLAN_REVIEW:p-1` (D-4 commits `.env.test`; the human owns the decision, and it
is Open Question 3 below) and `PLAN_REVIEW:p-4` (`security-conventions.md` SC-3
line 178 cites `api-conventions.md` AC-5 where it means AC-6 — a convention-text
defect this plan does not own and does not edit).

**Revision 2 (2026-09-03).** `HUMAN_PLAN_APPROVAL` rejected revision 1 on
`PLAN_REVIEW:p-3` (decision recorded in `docs/workflow/history.jsonl`,
2026-09-03T06:44:24Z, `human:KShust`) and routed the Story back to
`IMPLEMENTATION_PLANNING`. The rejection reason was one defect: Step 3 stated an
outcome — file parallelism disabled for `tests/integration` while unit tests stay
parallel — that the mechanism it named could not produce. **Nothing about the
Story, its scope, its file lists or its step boundaries changed in this
revision**; four textual defects were repaired and the plan's own claims about
Vitest were replaced with executed evidence.

| # | Change | Discharges |
|---|---|---|
| 1 | Step 3 now names `test.projects` as the mechanism, with the two-project shape written out and confirmed by execution at the installed Vitest 4.1.11 | `PLAN_REVIEW:p-3` (the rejection reason) |
| 2 | Step 3's "one mechanism to confirm during the step" is resolved by execution rather than deferred: root `test.env` does **not** reach `globalSetup`, so the config module body assigns `process.env.DATABASE_URL` | plan review §11; removes an unexecuted claim |
| 3 | Testing Strategy § Integration writes `AC-10` (the `api-conventions.md` section), not `AC-010` | `PLAN_REVIEW:p-2` |
| 4 | Traceability, AC-004 row writes `VR-5, VR-6, VR-8`; VR-7 is marked deferred to US-009 | `PLAN_REVIEW:p-5` |
| 5 | D-4 cites `persistence-conventions.md` PC-10 and PC-1's second bullet alongside the `AGENTS.md` line, and is listed as Open Question 3 for the gate | `PLAN_REVIEW:p-1` — **surfaced, not decided** |

**Carried to `HUMAN_PLAN_APPROVAL` still open**, and deliberately not closed by
this revision: `PLAN_REVIEW:p-1` (D-4 commits `.env.test`; the human owns the
Prohibited line it acts against), `PLAN_REVIEW:p-4` (`security-conventions.md`
SC-3 line 178 cites AC-5 where it means AC-6 — a convention amendment, no plan
change), `DESIGN_REVIEW:e-1` (Specification v14 stale against `architecture.md`
AD-6 at four sites; mitigated for this Story by D-1, unrepaired for US-002
onward), and Open Questions 1 and 2. The three findings this revision does close
are `p-2`, `p-3` and `p-5`.

## Goal

Deliver `POST /api/v1/auth/register` — one public, rate-limited, unauthenticated
endpoint that creates a single `User` row with an Argon2id password hash and the
role `CUSTOMER`, returns a four-field DTO, and emits one audit event — together
with the project foundations this Story is the first to need: the Prisma
datasource, model and migration, the application bootstrap and process entry,
the configuration boundary, the error taxonomy, and the PC-1 test-database
setup.

This plan introduces no behavior that the approved artifacts do not already
contain. Where an approved artifact left a choice to this stage, the choice is
made here, in **Decisions** below, and is traceable from the step that applies
it.

## Source Artifacts

| Artifact | Path | Version | Status |
|---|---|---|---|
| Story | `docs/stories/US-001-register-customer.md` | — | active |
| Specification | `docs/specifications/US-001-spec.md` | 14 | `APPROVED`, past `HUMAN_SPEC_APPROVAL` |
| Specification review | `docs/reviews/specifications/US-001-spec-review.md` | 11 | `APPROVED`, `PASS` |
| API design | `docs/designs/api/US-001-api-design.md` | 2 | `DRAFT`, accepted by design review v2 |
| OpenAPI contract | `docs/designs/api/US-001-openapi.yaml` | 2 | accepted by design review v2 |
| Database design | `docs/designs/database/US-001-db-design.md` | 2 | `DRAFT`, accepted by design review v2 |
| Entity model | `docs/designs/database/US-001-entity-model.md` | 1 | `DRAFT`, accepted by design review v2 |
| Design review | `docs/reviews/designs/US-001-design-review.md` | 2 | `APPROVED`, `PASS` (0 Critical, 0 Major, 5 Minor) |
| Impact analysis | `docs/impact-analysis/US-001-impact-analysis.md` | 2 | `DRAFT`, `PASS` with 7 residual risks |
| Open decisions | `docs/decisions/US-001-open-decisions.md` | 7 | 12 of 12 `RESOLVED` |
| Findings triage | `docs/decisions/US-001-findings-triage.md` | 1 | `APPROVED` (human, 2026-09-03) |

Conventions consumed: `architecture.md` (AD-2…AD-9), `module-map.md`,
`api-conventions.md`, `persistence-conventions.md` (PC-1…PC-10),
`security-conventions.md` (SC-1…SC-9), `business-rules.md`,
`non-functional-requirements.md`, `AGENTS.md`.

---

## Decisions this plan makes

Nine choices that the approved artifacts explicitly left to
`IMPLEMENTATION_PLANNING`. Each names the finding it discharges, so
`PLAN_REVIEW` can check the discharge rather than rediscover the question. A
tenth, **D-10**, is recorded at Step 3 rather than here, because it is a
mechanism for one step and reads better beside the file it configures.

`PLAN_REVIEW` v1 accepted D-1…D-9 on their substance; revision 2 changes only
D-4's citations and its routing to the gate (`PLAN_REVIEW:p-1`).

### D-1 — The domain-error class list: **AD-6 is authoritative, and it names five**

Discharges `DESIGN_REVIEW:e-1` (MAJOR) and impact-analysis R-1.

**`src/lib/errors.ts` creates the abstract `DomainError` base and five
subclasses: `ConflictError`, `UnsupportedMediaTypeError`,
`PayloadTooLargeError`, `ValidationError` and `TooManyRequestsError`.**

`docs/architecture/architecture.md` AD-6 is the canonical home of the domain-error
taxonomy and names those five for US-001, as amended by commit `fa21f62` (author
`KShust`, 2026-09-02). **Specification v14 is stale on this point and must not be
followed on it.** It says four, at four sites — the revision preamble, FR-21, the
`src/middleware/errorHandler.ts` Affected Components row ("the four domain-error
classes FR-21 creates"), and the `src/lib/errors.ts` component row, which
enumerates the four names.

This statement is required, not decorative. `AGENTS.md`'s order of authority
ranks the approved Specification **above** the approved API design, so an
implementer reading in that order builds four classes, leaves the `429` with no
carrier, and ships a rate-limit response body that violates AC-6 and the approved
contract. `IMPACT_ANALYSIS` declined the `changes_required_specification`
loop-back (analysis §14) **on the express condition that this plan carry the
statement in as many words**. It does, here.

FR-21 restates AD-6 rather than deciding anything, so nothing substantive is
being overridden — a stale copy is being set aside in favour of its source. The
detection net if this is missed anyway is the AC-6 body assertion on the `429`
(Testing Strategy, contract level).

`UnauthorizedError`, `ForbiddenError` and `NotFoundError` are **not** created:
they have no throw site in this Story, and AD-6 leaves each to the Story that
first throws it.

### D-2 — `prisma.config.ts` reads no `process.env`, so AD-7 needs no amendment

Discharges the AD-7 half of `IMPACT_ANALYSIS:R-2` and db-design finding 2.

Prisma 7.10.0 rejects `url` in the `datasource` block (P1012), so this Story must
add a root `prisma.config.ts`. The database design offered two resolutions — the
file reads `DATABASE_URL` directly and AD-7's wording is narrowed to `src/`, or
it imports the validated value from `src/config/env.ts` — and asked this stage to
choose deliberately.

**Neither is needed. `prisma/config` exports its own `env()` helper, and the
config file uses that.** The file's whole content is:

```ts
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: { url: env('DATABASE_URL') },
});
```

**Verified by execution during this stage** (probe run from the repository root
and removed; `git status` clean afterwards): the import specifier `prisma/config`
resolves on the installed `prisma` 7.10.0; `defineConfig({ datasource: { url:
env('X') } })` returns the resolved URL; and `env()` on an unset variable throws
`PrismaConfigEnvError: Cannot resolve environment variable: DATABASE_URL` rather
than yielding `undefined`. The helper's implementation
(`node_modules/@prisma/config/dist/index.js:515`) is `process.env[name]` with a
throw on empty.

Why this is the better resolution, not merely a third one:

- **The file contains no `process.env` reference at all**, so it satisfies AD-7's
  normative sentence ("No other file in `src/` reads `process.env`"), the
  `AGENTS.md` one-line summary, and the `eslint.config.js` rule — without any of
  the three being amended. **No convention change, and nothing escalated to
  `HUMAN_PLAN_APPROVAL` for it.**
- **Importing `src/config/env.ts` was the worse option and is rejected.** That
  module validates all six application variables at startup; a `prisma migrate`
  invocation would then fail for want of `CORS_ALLOWED_ORIGINS` or `TRUST_PROXY`,
  which the migration does not need. It would also couple repository tooling to
  shipped application code across the `rootDir: src` boundary.
- The failure mode is a named error identifying the missing variable, which is
  what AD-7's "fails fast on missing/invalid values" asks for.

### D-3 — `tsconfig.typecheck.json` gains `prisma.config.ts` in the same change

Discharges the lint half of `IMPACT_ANALYSIS:R-2` (MAJOR).

`eslint.config.js:82` points `parserOptions.project` at `tsconfig.typecheck.json`,
whose `include` is `["src", "tests", "scripts", "vitest.config.ts",
"eslint.config.js"]`. A root-level `.ts` file outside that program makes
`npm run lint` fail outright ("The file was not found in any of the provided
project(s)"), and the file would be invisible to `npm run typecheck`.

`include` becomes `["src", "tests", "scripts", "vitest.config.ts",
"eslint.config.js", "prisma.config.ts"]`, in **Step 1**, the same step that
creates the file. `tsconfig.json` (build) is deliberately untouched: `rootDir:
src` correctly keeps tooling out of `dist/`.

### D-4 — `.env.test` stays local-only; CI supplies `DATABASE_URL` as a workflow variable

Discharges `IMPACT_ANALYSIS:R-3` (MAJOR). **Decided by a human at
`HUMAN_PLAN_APPROVAL` on 2026-09-03** (`docs/workflow/history.jsonl`,
2026-09-03T12:00:14Z, `human:KShust`), which declined the `!.env.test` negation
revision 3 proposed and selected the fallback that decision already recorded.
This section is the decision as taken; the case revision 3 made for the other
resolution is preserved at the end, as the archive of a question now closed.

`git check-ignore -v .env.test` resolves to `.gitignore:28` (`.env.*`, with only
`!.env.example` re-included). The impact analysis named two defensible
resolutions and required this plan to pick one; the pick belongs to the gate,
and the gate made it.

**Resolution: `.env.test` is created locally by each developer and is never
committed. `.gitignore` is not modified — `.gitignore:28` already ignores the
file, so the resolution requires no change there at all. CI does not read
`.env.test`; the CI job supplies `DATABASE_URL` to the test step as a workflow
environment variable pointing at its own `services: postgres` on host port
5433.**

**No convention line is crossed.** That is the whole point of the decision:
`AGENTS.md` Prohibited, `persistence-conventions.md` PC-10 and PC-1, and
`security-conventions.md` SC-7 all stay literally true, and this plan makes no
claim on the human's authority to amend any of them.

What the decision costs, recorded so `RECONCILIATION` does not read either as an
oversight:

1. **PC-1 names `.env.test` literally as a deliverable** of the implementing
   Story, and under this resolution that deliverable is not in the repository.
   What ships instead is everything needed to produce it: the compose file on
   port 5433, the `db:test:up` / `db:test:down` scripts, and the reader in
   `vitest.config.ts` that fails with the exact command to run when the file is
   absent. Step 1's `.env.example` entry documents the variable.
2. **The connection string lives in two places** — the developer's local
   `.env.test` and the CI workflow's environment — so the two can drift. The
   mitigation is that both point at the same fixed host port 5433, and a drift
   surfaces immediately as a connection failure in the affected environment
   rather than silently.

**The resolution order does not change** (D-10): `process.env.DATABASE_URL`
wins, and only when it is unset is `.env.test` read via `process.loadEnvFile()`.
That single order now serves both environments — CI sets the variable and never
touches the file; a developer sets no variable and the file is read. What the
gate changed is which side is committed, not how the value is resolved.

#### The declined alternative, recorded

Revision 3 proposed committing `.env.test` behind a targeted `!.env.test`
negation in `.gitignore`, arguing that PC-1 names the file as a deliverable,
that its content is a throwaway local URL of the same class as the already
re-included `.env.example`, and that one committed URL cannot drift.

**That resolution would have crossed five convention lines, not the three
revision 3 named.** The undercount is itself recorded, because the case was
argued to the gate on the smaller number:

- `AGENTS.md` Prohibited: "Never commit secrets, `.env`, `dist/`, …".
- `persistence-conventions.md` **PC-10**, final bullet: "Generated database
  artifacts, dumps, and `.env` files are never committed."
- `persistence-conventions.md` **PC-1**, second bullet: "Credentials are never
  hard-coded and never committed."
- `security-conventions.md` **SC-7**, line 295: "No credentials, tokens, private
  keys, or `.env` files are committed." Committing `.env.test` would have made
  this sentence literally false.
- `security-conventions.md` **SC-7**, line 299: "`.gitignore` covers `.env`,
  `node_modules/`, `dist/`, `coverage/`, and logs." The negation would have
  carved a named exception into exactly that coverage.

Should the question ever be reopened, a clean approval is an edit to five lines
rather than three, **and** a constraint restricting `.env.test` to exactly
`DATABASE_URL` — which exists nowhere in the conventions today, and without
which nothing mechanical stops a second variable being added to a committed
file.

### D-5 — Middleware order in `src/app.ts`, stated rather than discovered

Discharges `IMPACT_ANALYSIS:R-5` (MINOR).

`X-Request-Id` is `required: true` on **every** declared response including the
`429`, and with `d-1` resolved through `next(...)` the `429` body is written by
the centralized error middleware. If the limiter is mounted first it
short-circuits before the id exists and the `429` violates its own contract.

The assembly order in `src/app.ts` is **exactly**:

1. `helmet()`
2. `app.disable('x-powered-by')`
3. `app.set('trust proxy', env.TRUST_PROXY)` — the explicit hop count, never `true` (SR-8, SC-5)
4. `cors({ origin: <allow-list from env> })`
5. **`requestId`** — before anything that can terminate a request
6. `pinoHttp` request logging, bound to the id from step 5
7. **`rateLimit`** mounted on `/api/v1/auth`
8. `express.json({ limit: '10kb' })`
9. **`jsonBodyErrors`** — translates the parser's errors, immediately after step 8
10. module routers under `/api/v1`
11. `errorHandler` — **last** (AD-6)

Steps 5 and 7 are the constraint this decision exists for; steps 8 and 9 are
adjacent by API-design requirement (see D-7).

### D-6 — The limiter declares no headers: `standardHeaders: false`, `legacyHeaders: false`

Discharges `IMPACT_ANALYSIS:R-6` (MINOR) and API-design open question 1.

The approved contract declares no rate-limit response headers, because no
requirement asks for one. `express-rate-limit` emits `RateLimit-*` by default.
Both flags are set to `false` in the same options object as the custom handler,
so the implementation emits exactly what the contract describes.

**Verified against the installed 8.7.0**: `Retry-After` is also gated on those
two flags — `dist/index.cjs:1052` guards the `Retry-After` write with
`if (config.legacyHeaders || config.standardHeaders)` — so setting both to
`false` suppresses it too, and no undeclared header survives. Adding a declared
header later is additive (AC-1) and belongs to the Story that decides what it
should say.

### D-7 — The five filenames the approved artifacts deliberately left open

The Specification names layers and responsibilities for these because it has no
authority to pick a name; `API_DESIGN` produces the HTTP contract, not internal
structure. Names follow the existing `src/middleware/` camelCase convention
(`errorHandler.ts`, `requestId.ts`).

| Responsibility | File | Authority that deferred it |
|---|---|---|
| Boundary validation: `Content-Type` `415` check, then Zod application | `src/middleware/validateRequest.ts` | FR-22 |
| `express-rate-limit` factory with the `TooManyRequestsError` handler | `src/middleware/rateLimit.ts` | FR-23 |
| Argon2id wrapper applying the SC-1 parameters on every call | `src/lib/password.ts` | FR-24 |
| Body-parser error translation (`413`, malformed-JSON `400`) | `src/middleware/jsonBodyErrors.ts` | API design, "Who translates the body-parser's errors" |
| Vitest `globalSetup`; truncation fixture | `tests/support/globalSetup.ts`; `tests/support/database.ts` | PC-1 (responsibility only) |

`jsonBodyErrors.ts` is a **small dedicated middleware mounted immediately after
`express.json()`**, not part of `validateRequest.ts` and not inside
`errorHandler.ts`. The API design fixed the layer and excluded the error
middleware (teaching it the parser's error objects would give it a third
category and put library-specific detection in the one place the architecture
keeps generic); a separate file keeps `validateRequest.ts` to the one
responsibility FR-22 gives it, since the two run at different mount points —
application-level for the parser's errors, route-level for schema validation.

### D-8 — `src/modules/users/users.schemas.ts` is not created

The Specification named the row so the design stage would decide rather than
discover, and the database design decided: both access paths take their types
from the generated Prisma client, which `module-map.md` permits for a repository.
`users` exposes no endpoint in this Story, so there is no request or response
schema to define. The file stays a placeholder. Creating it empty would be an
unused abstraction (AD-8).

### D-9 — PC-1's Prisma 7 gap is surfaced, not closed

Carries `DB_DESIGN:PC-1` (MINOR) forward unchanged.

`persistence-conventions.md` PC-1 predates Prisma 7. What it says about
`DATABASE_URL` and about exactly one `PrismaClient` in `src/lib/prisma.ts`
remains true and this plan implements it. What it does not describe is that the
client now requires an adapter object and that migrations read their URL from a
separate config file.

**Amending a convention is a human decision, so this plan does not make one.** It
is listed in Open Questions for `HUMAN_PLAN_APPROVAL` to note. It does **not**
block implementation: D-2 and Step 1 satisfy the convention's substance, and the
gap is documentary.

### Not carried to the gate, and why

- **`@prisma/adapter-pg`** is approved and installed. Commit `0339b4a` (author
  `KShust`, 2026-09-02) pins it at 7.10.0 and records the SC-6 approval in its
  message; `pg` 8.23.0 arrives transitively. **This plan cites that commit and
  raises no dependency question.** The revision-1 database-design claim that it
  was unapproved was corrected at source by db-design v2.
- **The `429` carrier.** The design review formally withdrew its escalation once
  commit `fa21f62` amended AD-6. This plan carries the class (D-1), not the
  question.

---

## Architectural Changes

**None.** No new module, no new shared directory, no new abstraction layer, and
no change to the layering rules. Every responsibility this Story introduces has a
home `module-map.md` already names, including the two `src/lib/` files that
document lists as "created by the Story that first needs them". AD-8's
justification requirement is not triggered.

The one architectural *statement* this plan makes is D-1, and it resolves a
documented conflict in favour of the canonical source rather than introducing
anything.

---

## Impact-Analysis Reconciliation

The impact analysis (v2) is consumed, not rewritten. This plan agrees with its
predicted change surface with **three refinements**, each recorded because
`RECONCILIATION` will compare the two:

| # | Impact analysis said | This plan says | Why |
|---|---|---|---|
| 1 | `prisma.config.ts` reading `DATABASE_URL` creates an AD-7 question for this stage to settle, possibly by narrowing AD-7's wording (§12 marks `architecture.md` AD-7 as a conditional documentation change) | No AD-7 or `AGENTS.md` change is needed; the file reads no `process.env` (D-2) | `prisma/config` exports its own `env()` helper. Verified by execution this stage; the analysis flagged the file's exact shape as unexecuted (§17) |
| 2 | `.gitignore` is a `MEDIUM`-confidence change, "one of two resolutions" | `.gitignore` is **not changed at all** (D-4) | The gate picked the resolution R-3 required, and it is the one that needs no edit: `.gitignore:28` (`.env.*`) already ignores `.env.test` |
| 3 | `src/modules/users/users.schemas.ts` is `Unknown` — "created only if the design needs it" | Not created (D-8) | The design takes repository types from the Prisma client |

Everything else is carried forward as predicted: the affected modules and layers,
the file lists below, no new module or dependency, and all seven risks. Of the two
files the analysis newly identified, `tsconfig.typecheck.json` is in this plan's
Files To Modify and `.gitignore` is not — refinement 2 is why, and it is the one
place where this plan's file list is narrower than the predicted surface.

---

## Files To Create

| Path | Responsibility | Traces to |
|---|---|---|
| `prisma.config.ts` | Prisma 7 migration connection config (D-2) | db-design §Prisma 7; R-2 |
| `prisma/migrations/<timestamp>_init_user/migration.sql` | `CREATE TYPE Role`; `CREATE TABLE "user"`; PK; unique on `email` | PC-2; db-design §Migration |
| `docker-compose.yml` | `db` service on port **5433** | FR-19; PC-1 |
| `.env.test` | Test `DATABASE_URL`. **Created locally, never committed** — `.gitignore:28` already ignores it (D-4) | FR-19; PC-1 |
| `src/lib/errors.ts` | `DomainError` base + **five** subclasses (D-1) | FR-21; AD-6 |
| `src/lib/password.ts` | Argon2id wrapper, SC-1 parameters passed explicitly every call | FR-24; SR-1, SR-2 |
| `src/middleware/validateRequest.ts` | `415` `Content-Type` check, then Zod application | FR-22; AD-5; VR-1…VR-6, VR-9, VR-10 (`415` half) |
| `src/middleware/rateLimit.ts` | Limiter factory; custom handler calling `next(new TooManyRequestsError(...))`; both header flags `false` (D-6) | FR-13, FR-23; SC-3; AD-6 |
| `src/middleware/jsonBodyErrors.ts` | Translates the parser's `413` and malformed-JSON errors into domain errors (D-7) | FR-21; API design; AD-6 |
| `tests/support/globalSetup.ts` | `prisma migrate deploy`; on an unreachable database, fail with the command to run | FR-19; PC-1 |
| `tests/support/database.ts` | `TRUNCATE` fixture — exactly one table, `user` | FR-19; PC-1; db-design §Test database |
| `tests/integration/auth-register.test.ts` | Supertest coverage of the endpoint | NFR-005, NFR-006; AD-9 |
| Unit tests beside each implemented source file | Service, helper and middleware logic without Express or a database | NFR-005; AD-9; `module-map.md` |

## Files To Modify

Every `src/` path below is a one-line placeholder today, so the edit is a first
implementation.

| Path | After the change | Traces to |
|---|---|---|
| `prisma/schema.prisma` | `datasource` (**no `url`**), `generator`, `Role` enum, `User` model — `@db.Uuid`, `@db.VarChar(254)` + `@unique`, unbounded `password_hash`, **explicit `@db.Timestamptz(3)`** | db-design §Model; PC-3…PC-6, PC-10 |
| `src/config/env.ts` | Zod validation of exactly `NODE_ENV`, `PORT`, `LOG_LEVEL`, `DATABASE_URL`, `CORS_ALLOWED_ORIGINS`, `TRUST_PROXY`; Argon2id cost constants. **No JWT variable** | FR-18; AD-7, SC-1, SC-3, SR-2, SR-9 |
| `src/lib/prisma.ts` | The single `PrismaClient`, constructed with `@prisma/adapter-pg` | PC-1; db-design §2 |
| `src/lib/logger.ts` | Pino with redaction configured on the logger | SR-7; SC-9 |
| `src/middleware/errorHandler.ts` | `ZodError` + the five `DomainError` subclasses → AC-6 bodies; sole owner of the VR-11 `fieldErrors` shape incl. both R-4 mappings; generic `500` | VR-11; AD-6, AC-12; R-4 |
| `src/middleware/requestId.ts` | Inbound-id reuse, response header, log correlation | FR-15; AC-9, NFR-010 |
| `src/modules/auth/auth.routes.ts` | Mount the endpoint; compose `validateRequest` + controller | FR-1 |
| `src/modules/auth/auth.controller.ts` | Validated request → service → `201` DTO. No `try/catch` building error bodies | FR-5, FR-11; AC-12 |
| `src/modules/auth/auth.service.ts` | Calls `src/lib/password.ts`, calls `users.service.ts`, emits the audit event, throws domain errors. **Never imports `argon2` or Prisma** | FR-6, FR-7, FR-10, FR-12, FR-24; BR-6 |
| `src/modules/auth/auth.schemas.ts` | Request/response Zod schemas, the single expression of the SC-1 password policy, OpenAPI registration of **all seven responses** | FR-16, FR-22; VR-1…VR-6, VR-8, VR-9 |
| `src/modules/users/users.service.ts` | Transactional uniqueness-check-and-insert; raises `ConflictError` | FR-2; BR-1, BR-5, BR-6; PC-9 |
| `src/modules/users/users.repository.ts` | The two Prisma queries; `P2002` translation; selects that never include `password_hash` | BR-1, BR-6, FR-5; PC-8, PC-9 |
| `src/app.ts` | The eleven-step assembly of D-5 | FR-13, FR-14, FR-23; SC-5 |
| `src/server.ts` | `listen`, `SIGTERM`/`SIGINT`, graceful shutdown incl. Prisma disconnect | FR-20; `module-map.md` |
| `tsconfig.typecheck.json` | `include` gains `prisma.config.ts` (D-3) | R-2 |
| `vitest.config.ts` | `test.projects` with `unit`, `harness` and `integration`, the three `include` globs covering every test file on disk; `fileParallelism: false` and `globalSetup` on `integration` only; resolve the test `DATABASE_URL` in the config module body via `process.loadEnvFile()` (D-10) | FR-19; PC-1 |
| `package.json` | `db:test:up` / `db:test:down` scripts. **No other script change** | FR-19; PC-1 |
| `AGENTS.md` | The two new scripts added to the Build and Validation Commands table | FR-19; PC-1 (by name) |
| `.env.example` | Add the test-database placeholder; **remove the four JWT entries** | FR-18; SC-3, SC-7 |
| `.github/workflows/ci.yml` | `services: postgres` on host port 5433; `DATABASE_URL` supplied to the test step as a workflow environment variable (D-4); the stale "Not here yet" header comment removed | FR-19; PC-1 |
| `docs/api/openapi.json` | Regenerated by `npm run openapi:generate`, never hand-edited | FR-16; AC-10 |
| `tests/README.md` | Its "None of the plumbing exists yet" paragraph becomes false, and it documents how to create the uncommitted `.env.test` a fresh clone needs (D-4) | Impact analysis §12; PC-1 |
| `README.md` | Only if it describes setup the compose file and new scripts change | Impact analysis §12 (LOW) |

## Files Explicitly Not Changed

| Path | Why |
|---|---|
| `src/modules/auth/auth.repository.ts` | `auth` persists nothing of its own until refresh tokens (BR-6) |
| `src/modules/users/users.schemas.ts` | D-8 |
| `src/modules/users/users.controller.ts`, `users.routes.ts` | `users` exposes no endpoint in this Story |
| `src/lib/openapi.ts`, `scripts/generate-openapi.ts`, `eslint.config.js`, `tsconfig.json`, `tests/support/setup.ts` | Reused unchanged (impact analysis §6) |
| `tests/harness.test.ts` | Reused unchanged **and still collected** — the `harness` project of D-10 exists so that this row is a claim about its execution and not only about its text (`PLAN_REVIEW:p-6`) |
| `.gitignore` | The impact analysis predicted a change here and revision 3 planned one. `HUMAN_PLAN_APPROVAL` declined the `!.env.test` negation (D-4), and the resolution it chose needs no edit: line 28 (`.env.*`) already ignores `.env.test`. Listed rather than dropped silently, because `RECONCILIATION` compares this plan against a predicted surface that includes it |
| `scripts/validate-harness.py`, `scripts/validate-harness.test.py`, `docs/workflow/artifact-schema.md` | Human approval only (`AGENTS.md` Prohibited); nothing here needs them |
| Any `products` / `orders` / `support` path | Out of scope (`AGENTS.md` Active Scope) |

---

## Execution Order

Twelve steps. Each names the files it touches, the artifact that requires it, and
the observable evidence that it is done. No step depends on the output of a later
one.

**Stage ownership.** Steps 1–3 and 5–12 are `IMPLEMENTATION` (`express-implementor`).
**Step 4 is `TEST_WRITING`** (`test-writer`), which runs first in workflow order —
see the note after the table.

### Step 1 — Configuration boundary and Prisma connection plumbing

**Files.** `src/config/env.ts`; `prisma.config.ts` (new); `tsconfig.typecheck.json`; `.env.example`.

- `src/config/env.ts` validates exactly the six variables with Zod at startup and
  exports the Argon2id constants (`memoryCost: 19456`, `timeCost: 2`,
  `parallelism: 1`) as constants, never env vars (SC-1, SR-2). No JWT variable
  (FR-18, BR-4).
- `prisma.config.ts` exactly as D-2.
- `tsconfig.typecheck.json` `include` gains `prisma.config.ts` (D-3) — **in this
  step, not later**; otherwise every subsequent turn fails the Stop hook.
- `.env.example` gains the test-database placeholder and **loses the four JWT
  entries** (FR-18). This closes triage finding `SPECIFICATION:FR-18`, which is
  an outstanding obligation and not, as the pre-triage note claimed, already done.

**Evidence.** `npm run lint` and `npm run typecheck` both exit 0 with
`prisma.config.ts` present — the specific proof D-3 exists for.
`npx prisma validate` exits 0.

### Step 2 — Persistence: schema and migration

**Files.** `prisma/schema.prisma`; `prisma/migrations/<timestamp>_init_user/migration.sql` (new).

- The `User` model exactly as db-design §Model, with **`@db.Timestamptz(3)`
  declared explicitly** on both timestamps — Prisma's default `DateTime` mapping
  is `timestamp(3)` *without* time zone and would violate PC-6 silently.
- `id` is `@db.Uuid` with `@default(uuid())` and **no database default**.
- `email` is `@db.VarChar(254)` `@unique` — the same 254 as the Zod bound (VR-3).
- `password_hash` is unbounded `String` — the one PC-4 exemption (PC-10).
- Migration generated with `npm run prisma:migrate` and committed in the same
  change (PC-2). Purely additive.

**Evidence.** `npx prisma validate` exits 0; the migration directory exists and is
committed; `npm run prisma:deploy` applies cleanly to an empty database.

### Step 3 — Test-database infrastructure (PC-1, in full)

**Files.** `docker-compose.yml` (new); `package.json`; `vitest.config.ts`;
`.github/workflows/ci.yml`; `AGENTS.md`. **`.gitignore` is not touched**, and
`.env.test` is created locally rather than committed (D-4).

- `docker-compose.yml`: a `db` service on host port **5433**.
- `.env.test`: the test `DATABASE_URL` against 5433. **Created locally by the
  developer and not committed** (D-4); `.gitignore:28` already ignores it, so no
  `.gitignore` edit is part of this step. The placeholder that documents the
  variable is `.env.example`, written in Step 1.
- `package.json`: `db:test:up` and `db:test:down`. **No other script changes.**
- `AGENTS.md`: both scripts added to the Build and Validation Commands table —
  PC-1 requires this **by name**, so it is a deliverable, not housekeeping.
- `vitest.config.ts`: converted to **`test.projects`** — the mechanism, written
  out in full below (D-10). **Three** projects, `unit`, `harness` and
  `integration`, whose `include` globs together cover every test file the
  repository has; file parallelism is disabled on the `integration` project only;
  `globalSetup` is declared on that project only; the test `DATABASE_URL`
  resolves as `process.env.DATABASE_URL` ?? `.env.test` (D-4) in the config
  module body, **read with `process.loadEnvFile()`** and no new dependency. That
  order is what lets one mechanism serve both sides of D-4: CI sets the variable,
  a developer's machine falls through to the local file.
- `.github/workflows/ci.yml`: `services: postgres` mapped to host **5433**;
  `DATABASE_URL` supplied to the test step as a workflow environment variable, so
  CI never reads `.env.test` (D-4); the stale "Not here yet: database-backed
  integration tests" header comment removed.

#### D-10 — `test.projects` is the mechanism, and this is its shape

Discharges `PLAN_REVIEW:p-3`, the finding `HUMAN_PLAN_APPROVAL` rejected
revision 1 on, and `PLAN_REVIEW:p-6`, the finding `PLAN_REVIEW` revision 2 raised
against revision 2's answer to it. Revision 1 asked for `fileParallelism: false`
"scoped to `tests/integration`" without naming how. It is a **top-level `test.*`
option** at the installed Vitest 4.1.11, and the flat `vitest.config.ts` it
replaces is one `test` block whose single `include` covers both trees — so the
sentence as written would either serialize the whole suite or scope nothing.

`vitest.config.ts` becomes one root `test` block carrying the shared options it
carries today, plus a `projects` array:

```ts
test: {
  // shared options unchanged: environment, globals, exclude, setupFiles,
  // env: { TZ: 'UTC' }, restoreMocks, clearMocks, unstubEnvs, unstubGlobals,
  // testTimeout, hookTimeout. The flat `include` is removed - each project
  // declares its own, and the three together cover the whole tree.
  projects: [
    {
      extends: true,
      test: {
        name: 'unit',
        include: ['src/**/*.test.ts'],
        fileParallelism: true,
        sequence: { shuffle: { files: true, tests: false } },
      },
    },
    {
      extends: true,
      test: {
        name: 'harness',
        include: ['tests/*.test.ts'],
        fileParallelism: true,
      },
    },
    {
      extends: true,
      test: {
        name: 'integration',
        include: ['tests/integration/**/*.test.ts'],
        fileParallelism: false,
        globalSetup: ['tests/support/globalSetup.ts'],
      },
    },
  ],
}
```

**Why there is a third project — `PLAN_REVIEW:p-6`.** Revision 2 declared only
`unit` and `integration`. `tests/harness.test.ts` sits at the top level of
`tests/` and matches neither `src/**/*.test.ts` nor
`tests/integration/**/*.test.ts`; the flat config it replaces collected it
through `tests/**/*.test.ts`. A project `include` overrides rather than extends
the root one, so the file would simply stop running. The `harness` project is
preferred over widening `unit` to `['src/**/*.test.ts', 'tests/*.test.ts']`
because the file is neither a unit test of a `src/` module nor an integration
test — it asserts that the *configuration* is correct (its own header says a
failure there means the configuration is broken rather than the application), and
the block D-10 restructures is exactly what it guards. Naming it keeps each
project's `include` one coherent tree and gives any future `tests/*.test.ts` a
home rather than a silent drop.

**Verified by execution during this stage** against the installed 4.1.11 (probes
built at the repository root, run, then removed; `git status` clean of them
afterwards):

- **The collected set covers the tree.** `npx vitest --root . list` with **no**
  `--project` filter, against the three-project config, lists
  `[harness] tests/harness.test.ts` and its two test cases — the repository's
  only test file today, so the union equals the tree. This is the assertion
  `PLAN_REVIEW` §11 asked for, and it is the check that would have caught `p-6`.
- **The defect is real, and it turns silent only after Step 4.** With revision
  2's two-project shape, `vitest list` printed nothing and a full run exited **1**
  ("No test files found") — today, with no integration tests written yet. With a
  single throwaway file added under `tests/integration/`, the same shape exited
  **0** reporting `Test Files 1 passed (1)`, with `tests/harness.test.ts` absent.
  So the failure becomes invisible precisely when `TEST_WRITING` lands Step 4's
  suite. The three-project shape in the same state exited **0** with
  `Test Files 2 passed (2)`, `Tests 3 passed (3)`.
- **The scoping works, and it is not merely type-valid.** Two unit files and two
  integration files, each holding for 1.5s and appending a timestamp: the unit
  files started 1 ms apart and overlapped; the integration files did not overlap
  at all, the second starting after the first had ended. So `unit` keeps its
  parallelism and its shuffle, and `integration` runs one file at a time — the
  outcome PC-1 and NFR-005 both ask for.
- **`globalSetup` belongs on the `integration` project, not at the root.** With
  it declared at root and `extends: true` on both projects it ran **three times**
  in one command; declared on the `integration` project alone it ran exactly
  once, and only when integration tests run. That also keeps `npm run test:unit`
  free of any database dependency — and the `harness` project, which declares no
  `globalSetup`, needs no database either.
- **`extends: true` carries the root block into each project**, and the probe ran
  with it on all three; a project written without it does not inherit the shared
  options, so it is not decoration.
- `ProjectConfig` in the shipped types is `Omit<InlineConfig, NonProjectOptions
  | 'sequencer' | 'deps'>`, and `NonProjectOptions` lists neither
  `fileParallelism`, `globalSetup`, `include`, `env` nor `sequence` — so every
  per-project option above is a supported one. The deprecation of the
  `poolOptions` form is at `reporters.d.DtoKVV2s.d.ts:1627`
  ("use top-level `fileParallelism` instead"), which is what makes the flat
  config unable to express the scoping.
- **The three existing test scripts keep working unchanged**, which is what lets
  Step 3 hold to "no other script change" in `package.json`. Against the
  three-project config, `npm run test:unit` (`vitest run src`) matched no file and
  exited 0 on its `--passWithNoTests`, triggering no `globalSetup`;
  `npm run test:integration` (`vitest run tests/integration`) matched only the
  integration file. A positional path filter selects files across projects, so
  neither script needs a `--project` flag, and `--project harness` resolves for a
  focused run when one is wanted. `tests/harness.test.ts` is collected by
  `npm run test` and by neither narrowed script — which is exactly its behaviour
  today under the flat config, so nothing regresses.

No new config file is introduced, so `IMPACT_ANALYSIS:R-2` does not recur, and
`vitest.config.ts` stays the one file the Files To Modify table already names.

**The `DATABASE_URL` question revision 1 deferred is answered here, by
execution.** `globalSetup` runs in the main process and test files run in
workers, so the resolved URL must reach both. Root `test.env` reaches the
**workers only** — the probe read `undefined` for a `test.env` variable inside
`globalSetup` while a test file in the same run read it correctly. **So the
config module body assigns `process.env.DATABASE_URL` before `defineConfig`**
(main process, before either consumer), and `test.env` is not used for it.

**And it is read with Node's built-in — `PLAN_REVIEW:p-7`.** Revision 2 stated
the resolution order without naming what parses `.env.test`. The mechanism is
**`process.loadEnvFile()`**, a function on the installed Node v24.20.0 (confirmed
at this stage), called from the config module body **only when
`process.env.DATABASE_URL` is unset** — D-4 requires an externally supplied value
to win, and a probe confirmed both halves: loading the file populates
`process.env.DATABASE_URL`, and with the variable already set the guard leaves
the external value in place. **No dependency is added**, which keeps the "New
Dependencies: none" claim below true: `dotenv` is declared in neither
`dependencies` nor `devDependencies` and adding it would need SC-6 approval, and
`vite`'s `loadEnv` is present only transitively under Vitest, so importing it
directly would rely on hoisting an undeclared package. `process.loadEnvFile`
throws `ENOENT` when the file is absent (confirmed by the same probe), so the
call is wrapped to fail with the command to run — naming `npm run db:test:up` and
the missing `.env.test` — rather than a raw error. That is the same PC-1
requirement that governs an unreachable database, for the same reason: the Stop
hook forwards that message.

**Evidence.** `npx vitest --root . list` with no `--project` filter lists every
test file on disk (the `p-6` assertion); `npx vitest --root . list --project unit`,
`--project harness` and `--project integration` each resolve and list only their
own tree; `npm run db:test:up` starts the service; `npm run test:integration`
reaches the database and reports test results rather than a connection error;
`npm run test:unit` passes with the database **stopped**; with the database
stopped, the run fails with **the command to run** and not a raw connection error
(PC-1 states this explicitly — the Stop hook forwards that message);
`npm run format:check` passes on the new YAML.

Two of those assertions exist because of D-4 and are not optional:

- **`.env.test` is not committed and `.gitignore` is unchanged.** After the step,
  `git status --porcelain` shows no `.env.test`, `git check-ignore -v .env.test`
  still resolves to `.gitignore:28`, and `git diff -- .gitignore` is empty. This
  is the observable form of the gate's decision; a future revision that quietly
  re-adds the negation fails here.
- **CI does not depend on the file.** With `.env.test` absent and `DATABASE_URL`
  set in the environment, the suite resolves the URL from the variable and never
  calls `process.loadEnvFile()` — the guard's other half, and the path CI takes.
  With the variable unset and the file absent, the wrapped `ENOENT` names both
  `npm run db:test:up` and the `.env.test` that must be created, which is the
  first-clone experience this resolution accepts.

### Step 4 — Tests (stage `TEST_WRITING`)

**Files.** `tests/integration/auth-register.test.ts` (new);
`tests/support/globalSetup.ts` (new); `tests/support/database.ts` (new); unit
tests beside each source file.

Coverage is specified in **Testing Strategy** below. The two triage findings due
at this stage are `IMPACT_ANALYSIS:R-4` and `DESIGN_REVIEW:e-2`, both carried
there.

**Ordering consequence, stated so it is not discovered.** `TEST_WRITING` runs
*before* `IMPLEMENTATION` in `stage-map.yaml`, but the schema, the migration and
the compose file arrive in Steps 2–3. **The tests authored here cannot execute
until Step 3 completes**, so `test-writer` must not gate its own completion on a
running suite — it authors against the approved contract and the AC test matrix.
The first execution of the integration suite happens in Step 12.

**Evidence.** The AC test matrix maps every one of AC-001…AC-007 to at least one
named test (NFR-006).

### Step 5 — Shared foundations

**Files.** `src/lib/errors.ts` (new); `src/lib/password.ts` (new);
`src/lib/prisma.ts`; `src/lib/logger.ts`.

- `errors.ts`: `DomainError` base plus the **five** subclasses of D-1. Each
  carries a stable `code` supplied at the throw site; no HTTP types, no status
  numbers (AD-6).
- `password.ts`: wraps `argon2`, passing all three SC-1 parameters explicitly on
  every call from `src/config/env.ts`. `auth.service.ts` calls this; it never
  imports `argon2` (FR-24).
- `prisma.ts`: exactly one `PrismaClient`, constructed with `@prisma/adapter-pg`
  (commit `0339b4a`). No other file constructs a client (PC-1).
- `logger.ts`: Pino with **redaction configured on the logger**, not left to
  call-site discipline (SR-7, SC-9).

**Evidence.** `npm run typecheck` exits 0; `npm run lint` exits 0 (the `src/lib`
layering block); unit test proves `password.ts` passes all three parameters.

### Step 6 — Middleware

**Files.** `src/middleware/requestId.ts`; `src/middleware/validateRequest.ts` (new);
`src/middleware/jsonBodyErrors.ts` (new); `src/middleware/rateLimit.ts` (new);
`src/middleware/errorHandler.ts`.

- `requestId.ts`: reuse a trusted inbound `X-Request-Id`, set the response
  header, bind the id to every log line (FR-15, AC-9).
- `validateRequest.ts`: the explicit `Content-Type` check first — a request
  **with a body** and a missing or non-JSON type throws
  `UnsupportedMediaTypeError` — then Zod application so services receive typed
  input. A bodyless `POST` is a `400`, not a `415` (Error Handling table).
- `jsonBodyErrors.ts`: the parser's size error → `PayloadTooLargeError`; its
  parse error → `ValidationError` carrying `MALFORMED_JSON`.
- `rateLimit.ts`: the factory, 10 requests per hour per IP (SC-3), custom
  `handler` calling `next(new TooManyRequestsError('RATE_LIMIT_EXCEEDED'))`,
  `standardHeaders: false`, `legacyHeaders: false` (D-6).
- `errorHandler.ts`: maps `ZodError` and the five `DomainError` subclasses to
  AC-6 bodies; generic `500` otherwise; **sole owner of the `fieldErrors`
  shape**, including both R-4 mappings:
  - the `unrecognized_keys` issue → keyed by **the offending property name**;
  - the root-level `invalid_type` issue (a JSON array, a string, a number) →
    keyed onto **both required fields**, `email` and `password`, as not supplied.

  Neither is optional: the default Zod flattening leaves `fieldErrors` **empty**
  for both, which violates VR-11 and the contract's `minProperties: 1`.

**Evidence.** `npm run lint` exits 0 (no Prisma in middleware; no `console`); unit
tests cover both R-4 mappings and the `415`-vs-`400` split.

### Step 7 — `auth.schemas.ts` and the contract source

**Files.** `src/modules/auth/auth.schemas.ts`.

Request and response schemas, the **single** expression of the SC-1 password
policy (VR-8), normalization (trim then lowercase) before validation (BR-2,
VR-4), and registration into the existing `src/lib/openapi.ts`.

**Six generation obligations the generator will not supply on its own** —
each a `.openapi()` metadata call, and each silently absent otherwise:

1. `additionalProperties: false` on **both** closed objects (Zod strict mode);
2. `writeOnly` on `password`;
3. the `const` values on `role` and on **every** `code`;
4. **`minProperties: 1` on `FieldErrors`** — a Zod record does not emit it, and
   without it the generated document re-admits the empty-`fieldErrors` response
   `d-2` was raised about;
5. the `X-Request-Id` response header as a registered component header;
6. **all seven responses** — `201`, `400` (two shapes via `oneOf`), `409`, `413`,
   `415`, `429`, `500`. A module registering only the `201` produces a document
   that silently disagrees with the approved contract.

**Evidence.** `npm run openapi:generate` then `npm run openapi:check` exits 0; the
generated document contains all seven responses and `minProperties: 1`.

### Step 8 — `users` module

**Files.** `src/modules/users/users.repository.ts`; `src/modules/users/users.service.ts`.

- Repository: `findUnique` by email selecting **`id` only**; `create` selecting
  **exactly the four response fields**. Both accept an optional transactional
  client and neither opens its own transaction (PC-9). **Neither selects
  `password_hash`** (PC-8, SR-4).
- Repository: translate Prisma `P2002` into
  `ConflictError('EMAIL_ALREADY_REGISTERED')` where Prisma is visible. Nothing
  from the Prisma error — message, `P2002`, or constraint name — reaches the body
  or a log line (SC-9, SR-6). Untranslated, AD-6 maps neither and the client gets
  a `500` where the contract declares `409`.
- Service: the uniqueness check and the insert as **one transaction** it opens
  (BR-5, BR-6, PC-9), raising the same `ConflictError` on the check path.

**Evidence.** `npm run lint` exits 0 (Prisma only in the repository); `npm run
check:cycles` exits 0; unit tests cover both conflict paths.

### Step 9 — `auth` module

**Files.** `src/modules/auth/auth.service.ts`; `auth.controller.ts`; `auth.routes.ts`.

- Service: **short-circuits the duplicate path without hashing** (FR-7, SC-3 —
  and SC-3 forbids "hardening" this into constant-time behavior); calls
  `src/lib/password.ts`; calls `users.service.ts` — the one cross-module edge
  `module-map.md` permits; emits the audit event
  `{ event: "user.registered", userId, requestId }` **after the commit,
  best-effort**, carrying no email and no IP (FR-12, SC-9). A failed audit write
  is logged as an error and **does not fail the request** (EC-4).
- Controller: validated request → service → `201` DTO. No business logic, no
  `try/catch` building error bodies (AC-12).
- Routes: mount `POST /register`, composing `validateRequest` and the controller.

**Evidence.** `npm run lint` exits 0 (no Express types in the service, no Prisma
in the controller); unit tests cover the orchestration without Express or a
database.

### Step 10 — Application assembly and process entry

**Files.** `src/app.ts`; `src/server.ts`.

- `app.ts`: the eleven-step order of **D-5**, exactly. No `listen()` (AD-9).
- `server.ts`: `listen`, `SIGTERM`/`SIGINT`, graceful shutdown **including the
  Prisma disconnect** (FR-20).

**Evidence.** `npm run build` exits 0; the app starts under `npm run dev`; an
integration test asserts `X-Request-Id` is present **on the `429`**, which is the
specific proof D-5 exists for.

### Step 11 — Generated contract and documentation reconciliation

**Files.** `docs/api/openapi.json`; `tests/README.md`; `README.md` (if affected).

- Regenerate the contract; never hand-edit it (AC-10).
- `tests/README.md`: its "None of the plumbing exists yet" paragraph is now false.
- `README.md`: update only if it describes setup the compose file and the two new
  scripts change.

**Evidence.** `npm run openapi:check` exits 0; no stale sentence remains in either
document — verified by reading, which is the only way this one can be checked.

### Step 12 — Full verification

Run the complete `AGENTS.md` Definition of Done sequence, in the
`.claude/skills/pre-commit-checklist/SKILL.md` order. See **Validation Strategy**.

**Evidence.** Every command exits 0, with output, not description.

---

## Validation Strategy

**Always** (`AGENTS.md` Definition of Done), and CI runs the same set:

| Command | Gate it holds here |
|---|---|
| `npm run format:check` | New `.ts`, `.yml` and config files |
| `npm run lint` | The layering rules in `eslint.config.js` — the mechanical half of every architecture claim above; also the **D-3 proof**, since it fails outright on an unregistered root `.ts` |
| `npm run typecheck` | `src`, `tests`, `scripts`, the tooling configs, **and `prisma.config.ts`** |
| `npm run openapi:check` | Generated contract vs committed `docs/api/openapi.json` |
| `npm run check:cycles` | Circular imports, which ESLint cannot see |
| `npm run test` | Vitest — unit and integration |
| `npm run build` | `tsc` emit into `dist/` |

**Conditionally required, and both apply to this Story:**

- `npm run audit:check` — `package.json` changes (the two scripts), so it is
  required even though **no dependency is added**.
- `npm run validate:harness` — the change touches `AGENTS.md` and workflow
  artifacts.

**Narrower read-only commands used as step evidence** (these supplement the table,
never substitute for a row in it): `npx prisma validate`, `npx prisma migrate
status`, `npx vitest run <path>`.

**Two checks that no command performs**, and which must be verified by reading:

1. **BR-6's ownership rule.** `auth.repository.ts` importing Prisma would pass
   every mechanical check; what would be wrong is *whose* data it reads.
2. **FR-22's ban on a controller calling `schema.parse()` inline.** No lint rule
   catches it, which is why the Specification states it as a requirement.

---

## Testing Strategy

By level, mapped to Acceptance Criteria. `test-writer` authors these at Step 4;
the AC test matrix is its artifact, and NFR-006 requires every AC to reach at
least one test.

### Integration (Supertest, against the PC-1 database)

| Coverage | AC / source |
|---|---|
| Happy path: `201`, exactly four fields, `role: CUSTOMER`, `X-Request-Id` present, row persisted | AC-001 |
| Duplicate: `409` `EMAIL_ALREADY_REGISTERED`, no second row — **and the same response via the `P2002` race path**, so the two are indistinguishable | AC-002, EC-3 |
| Email validation: bad format, >254, missing, non-string; `details.fieldErrors.email` populated | AC-003, EC-5, EC-8 |
| Password policy: below 12, above 128, fewer than 3 classes, **boundary values at exactly 12 and 128**, length counted in Unicode code points | AC-004, EC-6 |
| Envelope: unknown property `400` **keyed by the offending property name**; `415` on a body with a wrong or missing `Content-Type`; `413` over `10kb`; `MALFORMED_JSON` on unparseable input | VR-9, VR-10, R-4 |
| **The three converging shapes** — `[]`, bodyless POST **with** `application/json`, bodyless POST **with no** `Content-Type` | `DESIGN_REVIEW:e-2` |
| Rate limit: `429` with the **AC-6 body**, not the limiter's default payload; no account created, no password hashed; **`X-Request-Id` present** | FR-13, EC-7, D-5, D-6 |
| Contract: every declared response matches the approved contract, `minProperties: 1` included | AC-10 (`api-conventions.md`), FR-16 |

**`e-2` is the coverage trap of this Story.** Three request shapes reach the same
`400` through **two different Zod mechanisms**: `[]` and a bodyless POST *without*
a content type both produce one root-path `invalid_type` issue, while a bodyless
POST *with* `application/json` arrives as `{}` and produces two per-field issues.
A suite covering only the third exercises the per-field path and proves nothing
about the root-path mapping R-4 is about. **Cover all three.**

### Security

| Coverage | AC / source |
|---|---|
| No `password` or `password_hash` in any response body | AC-006, SR-4 |
| No Prisma text, error code or constraint name in the `409` body or in any log line | SR-6, SC-9 |
| No `message` or `details` value echoes the submitted password | VR-11, SC-1 |

### Persistence

| Coverage | AC / source |
|---|---|
| The stored email is the **normalized** value (trimmed, lowercased) | AC-005, EC-1, EC-2, BR-2 |
| Case- and whitespace-differing duplicates are rejected | EC-1, EC-2 |
| The stored credential is an Argon2id hash, never plaintext — asserted **against the database**, not a response | AC-005 |

### Audit

| Coverage | AC / source |
|---|---|
| A log line `{ event: "user.registered", userId, requestId }` after commit, carrying **no email and no IP** | AC-007 |
| **A failed audit write does not fail the request** | EC-4 |

### Unit

Service orchestration without Express or a database; `password.ts` applying all
three SC-1 parameters; the error middleware's `ZodError` → `fieldErrors` mapping,
**including both R-4 cases**; the `415`-vs-`400` split in `validateRequest.ts`.

### Determinism

Deterministic and order-independent (NFR-005): integration tests serial with
`TRUNCATE` between them (PC-1), unit tests keeping shuffle and parallelism, never
against a shared or production database. **The mechanism is the three-project
`test.projects` block of D-10** — `fileParallelism: false` on the `integration`
project only — not a top-level `fileParallelism`, which would serialize the unit
suite too and silently drop the shuffle NFR-005 relies on.

---

## Risks

The seven from the impact analysis, with what this plan does about each. Four are
closed here; three are carried to the stage that owns them.

| Id | Severity | Status after this plan |
|---|---|---|
| R-1 / `DESIGN_REVIEW:e-1` | MAJOR | **Mitigated** by D-1, which states in as many words that AD-6's five-class list is authoritative and FR-21's four is stale. Detection net: the `429` AC-6 body assertion |
| R-2 | MAJOR | **Closed** by D-2 (no `process.env`, no convention amendment) and D-3 (`tsconfig.typecheck.json` in Step 1) |
| R-3 | MAJOR | **Closed** by D-4 as decided at `HUMAN_PLAN_APPROVAL` on 2026-09-03: `.env.test` local-only, CI on 5433 supplying `DATABASE_URL` as a workflow variable, `.gitignore` unchanged |
| R-4 | MAJOR | **Carried to `TEST_WRITING` and Step 6.** Both Zod mappings are mandatory; `minProperties: 1` must reach the generated document via `.openapi()` |
| R-5 | MINOR | **Closed** by D-5, the explicit eleven-step order |
| R-6 | MINOR | **Closed** by D-6, both header flags `false`, verified against the installed 8.7.0 |
| R-7 | MINOR | **Carried to `PR_PREPARATION`.** The PR summary cites the human authorization of 2026-09-01 (clarification report §5), FR-19…FR-24 and PC-1, so the breadth does not read as scope creep |

**Plan-level risk R-P1 — tests cannot run when they are written.** `TEST_WRITING`
precedes `IMPLEMENTATION`, but the schema, migration and compose file arrive in
Steps 2–3. **Consequence:** a `test-writer` that gates completion on a green or
even a running suite will report a false failure. **Mitigation:** Step 4 states
this; the first suite execution is Step 12.

**Scope discipline.** This Story's breadth is authorized (FR-19, confirmed by a
human on 2026-09-01) but it is not a licence: **no opportunistic refactoring, no
unrelated edits, no drive-by reformatting.** That is what would turn an
authorized scope into a real finding at `PR_REVIEW`.

## New Dependencies

**None.** Every library is already declared and installed: `express` 5,
`@prisma/client` 7.10.0, `@prisma/adapter-pg` 7.10.0, `pg` 8.23.0 (transitive),
`argon2`, `zod` 4, `@asteasolutions/zod-to-openapi`, `helmet`, `cors`,
`express-rate-limit` 8.7.0, `pino`, `pino-http`, `vitest`, `supertest`. SC-6 and
SR-10 are not triggered, and **nothing is escalated to `HUMAN_PLAN_APPROVAL` for
a dependency**.

`@prisma/adapter-pg` was approved by commit `0339b4a` (author `KShust`), which
records the SC-6 reason in its message. `package.json` still changes — the two
PC-1 scripts — so `npm run audit:check` is required.

## Configuration Changes

| File | Change |
|---|---|
| `src/config/env.ts` | Validates the six variables; holds the Argon2id constants; **no JWT variable** |
| `.env.example` | Test-database placeholder **added**; the four JWT entries **removed** (FR-18) |
| `.env.test` | New, **local-only and never committed** (D-4) |
| `tsconfig.typecheck.json` | `include` gains `prisma.config.ts` (D-3) |
| `prisma.config.ts` | New; migration connection via `env('DATABASE_URL')` (D-2) |
| `vitest.config.ts` | `test.projects` (`unit` / `harness` / `integration`); `globalSetup` and `fileParallelism: false` on `integration` only; test URL resolution in the module body via `process.loadEnvFile()` (D-10) |
| `package.json` | `db:test:up`, `db:test:down` |
| `AGENTS.md` | Both scripts in the Build and Validation Commands table |
| `.github/workflows/ci.yml` | `services: postgres` on 5433; `DATABASE_URL` as a workflow environment variable (D-4); stale header comment removed |
| `docker-compose.yml` | New; `db` service on 5433 |

**No secret is committed, and no `.env` file of any kind is.** `.env.test` stays
on the developer's machine; CI holds its `DATABASE_URL` in the workflow
environment; no value moves into code. `.gitignore` needs no exception, so the
coverage `security-conventions.md` SC-7 line 299 describes is left intact.

## Open Questions

None blocks implementation. Questions 1 and 2 are recorded for
`HUMAN_PLAN_APPROVAL` to note rather than to answer before work starts.
**Question 3 is answered** — it is retained as the record of a closed decision,
not as a question this plan still asks.

1. **`persistence-conventions.md` PC-1 needs an amendment, now for two reasons**
   (D-9). Amending a convention is a human decision, so this plan implements
   PC-1's substance and does not edit it. **Whoever owns that decision should
   amend PC-1** so the next Story reads a convention that matches both the
   toolchain and the delivery:
   - It **predates Prisma 7** and describes neither the required adapter object
     nor the separate migration config file. (`DB_DESIGN:PC-1`, already open —
     and settled in the repository by commit `b28766f`, which added the "Prisma 7
     splits the connection in two" block.)
   - It **names `.env.test` literally as a deliverable** of the implementing
     Story, and after the `HUMAN_PLAN_APPROVAL` decision of 2026-09-03 (D-4) this
     Story deliberately does not ship that file. The convention will keep
     describing a deliverable that no Story delivers until someone rewords it —
     the accepted cost of the decision, recorded here so the next reader meets it
     as a known gap rather than as a defect. Both belong in the same edit.
2. **The `CHECK (email = lower(btrim(email)))` constraint stays unspecified.**
   Endorsed twice already — by `DB_DESIGN` and by `DESIGN_REVIEW` v2 — on the
   grounds that Prisma cannot express a `CHECK` while PC-2 makes `schema.prisma`
   the source of truth, so it would be raw SQL the model does not describe.
   Recorded so it is not reopened downstream as a fresh idea.
3. **ANSWERED — whether `.env.test` may be committed.** Revision 3 asked the
   gate to bless a `!.env.test` negation in `.gitignore`. **`HUMAN_PLAN_APPROVAL`
   declined it on 2026-09-03** (`docs/workflow/history.jsonl`,
   2026-09-03T12:00:14Z, `human:KShust`) and selected the recorded fallback: CI
   supplies `DATABASE_URL` as a workflow variable and `.env.test` stays
   local-only. D-4 now states that resolution directly, and the declined
   alternative is archived at the end of D-4 together with the correction that it
   would have crossed **five** convention lines rather than the three revision 3
   named — `security-conventions.md` SC-7 lines 295 and 299 were missed.
   `PLAN_REVIEW:p-1` is answered by this decision. Nothing here is still open;
   it is listed so the next reader does not reopen it as a fresh idea.

**Explicitly not open**, and listed so the gate is not asked to decide something
already decided: the `@prisma/adapter-pg` dependency (commit `0339b4a`) and the
`429` carrier (commit `fa21f62`, escalation formally withdrawn by the design
review that raised it).

## Traceability

| AC | Requirements | Steps that deliver it | Test level |
|---|---|---|---|
| AC-001 | FR-1…FR-5, FR-17; VR-1, VR-2, VR-5; SR-1, SR-2 | 2, 5, 7, 8, 9, 10 | Integration happy path; persistence; unit |
| AC-002 | FR-6, FR-7; VR-4; SR-6 | 2, 5, 6, 8, 9 | Integration duplicate — **both** the check and race paths |
| AC-003 | FR-8; VR-1…VR-3; SR-6 | 6, 7 | Integration validation; contract |
| AC-004 | FR-9; VR-5, VR-6, VR-8; SR-3 (**VR-7 is deferred to US-009** by the Specification and is delivered nowhere in this Story) | 6, 7 | Integration policy incl. boundaries; unit |
| AC-005 | FR-10; SR-1…SR-4 | 1, 2, 5, 8 | Persistence + security, against the database |
| AC-006 | FR-11; SR-3…SR-6 | 7, 8, 9 | Security; contract |
| AC-007 | FR-12; SR-3, SR-6, SR-7 | 5, 9 | Audit assertion; EC-4 failure tolerance |

Requirements mapping to no AC, carried by convention and delivered here: FR-13…FR-16
(Steps 6, 7, 10), FR-18…FR-24 (Steps 1, 3, 5, 6, 10), SR-8…SR-10 (Steps 1, 6).
FR-19 carries the most weight: without Step 3, AC-002 and AC-005 have no database
to be tested against, so NFR-005 and NFR-006 cannot be satisfied at all.
