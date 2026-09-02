---
artifact_type: specification
story: US-001
version: 14
status: APPROVED
created_at: 2026-08-26T00:00:00Z
updated_at: 2026-09-02T13:02:48Z
produced_by: spec-writer
inputs:
  - path: docs/stories/US-001-register-customer.md
    version: null
  - path: docs/evidence/US-001-clarification-report.md
    version: 7
  - path: docs/decisions/US-001-open-decisions.md
    version: 7
supersedes: null
---

# Specification: Customer Registration

Source story: `docs/stories/US-001-register-customer.md`

> **Revision 14 — consumes the decisions resolved at the gate.** The
> `HUMAN_SPEC_APPROVAL` gate returned this document with every entry in
> `docs/decisions/US-001-open-decisions.md` answered. That is not a defect
> report: the version 10 review passed with no blocking finding, and this
> revision exists to consume answers, not to repair requirements. Ten
> requirements that named a decision id as the reason they could not be stated
> now state the behavior instead — FR-4, FR-5, FR-11, FR-12, FR-14, FR-21,
> VR-3, VR-4, VR-10, VR-11 — together with the Error Handling table, four Edge
> Cases and three Affected Components rows.
>
> Three of the answers were written into conventions rather than into the
> registry alone, because they bind more than this Story, and this document
> cites the convention rather than the decision in each case:
> `security-conventions.md` SC-5 for the `10kb` body limit,
> `security-conventions.md` SC-9 for what an audit event carries and for
> audit writes being best-effort after the commit, and
> `architecture.md` AD-6 for the two new domain-error subclasses and the `413`
> mapping. AD-6 also now names US-001 as the Story that creates
> `src/lib/errors.ts`, and names the four subclasses it creates — so FR-21 no
> longer reasons its way to that list, it cites it.
>
> **The Open Decisions section is now empty of blocking ids**, and says so
> rather than disappearing. One item remains flagged for the gate that is not a
> registry entry: the `.env.example` JWT question in FR-18, which the gate did
> not address and which is a choice this document made rather than a question
> it could not answer.
>
> m-1 (review v10): the granularity paragraph grouped `docker-compose.yml` with
> files whose name a convention supplies, and the review doubted PC-1 names it.
> PC-1 does — its "What the implementing Story must build" list names
> `docker-compose.yml` literally, alongside `.env.test`, `tests/support/` and
> `.github/workflows/ci.yml`. The paragraph now cites that list, so the name is
> prescribed rather than inferred from `docker compose up`. m-2: the revision 12
> note below carried a claim about PC-1 supplying six filenames that revision 13
> had already corrected in the live text; it is now marked superseded where it
> stands, so a reader working down the log meets the correction with the claim.
>
> The registry and the clarification report advanced from version 6 to version 7
> while this revision was being written. That revision corrected a stale count
> sentence in the registry's own preamble and changed no entry and no answer, so
> nothing in this document moved because of it; the front matter records the
> versions actually read.
>
> **Revision 13 — closes the version 9 review by removing what caused it.** M-1
> was the fourth finding in this chain against the same sentence: this section's
> Open Decisions block restated how many decisions the registry holds, which
> version it is at, and the stage each was raised at. Every one of those is state
> the registry owns, and each went stale the moment the registry advanced —
> without this document changing at all. The spec template's Open Decisions
> contract now forbids transcribing them, so revision 13 does not correct the
> counts: it deletes them. What remains is what the section is for — the blocking
> decision ids and what each blocks here. A reader who needs a count, a version,
> or an origin opens `docs/decisions/US-001-open-decisions.md`, which is the only
> place either is correct.
>
> The resolved entries are dropped from the list for the same reason. They block
> nothing here, and the facts they carried are already in the requirements they
> bind, cited from the convention that settled them — FR-5 from AC-4, FR-14 and
> SR-8 from SC-5. Nothing is lost and one copy is retired.
>
> m-1: the granularity paragraph described its own exception wrongly, claiming
> PC-1 supplies six filenames when it supplies three; the other two are
> responsibilities with no name, and two more already exist. The table rows were
> correct throughout — only the sentence about them was wrong. m-2: FR-22's
> range said VR-1…VR-9 run in the boundary middleware, two wider than its own
> subordinate clause; VR-7 is an exclusion and VR-8 a placement rule, and neither
> runs anywhere. m-3: the open list is in numeric order.
>
> No requirement changed meaning in this revision. Every edit is to a section
> that describes the document or another artifact rather than stating a
> requirement.
>
> **Revision 12 — closes the version 8 review; the Major became a decision, not
> a fix.** The `415`, the `413` and the malformed-JSON `400` had no stated route
> to the centralized error middleware: none is a `ZodError` or a `DomainError`,
> AD-6's taxonomy has no class for either semantic, and AD-6 names `415` in its
> handler mapping while never mentioning `413`. As written, all three would have
> returned `500`. This document does not choose the mechanism — AD-6 reserves a
> new subclass for an approved decision — so the question is recorded as
> **OD-US-001-12** and referenced from the Error Handling section and the Open
> Decisions list. It is the one open entry that describes a gap inside a
> convention rather than inside this Story.
>
> m-1: the granularity paragraph now describes its own exceptions correctly —
> `src/server.ts` exists as a placeholder, and PC-1 supplies six filenames for
> files that do not. **[Superseded at revision 13.** That count was wrong: PC-1
> names three of those files literally and leaves two as responsibilities with
> no filename. The live Affected Components section was corrected at revision 13
> and refined at revision 14; this sentence is left in place because the log is
> a record of what each revision said, not a second copy of the current text.**]**
> m-2: the `415`'s scope is aligned to AC-2, the more specific
> of its two sources — it applies to a request with a body, and a bodyless `POST`
> is a `400` for missing fields.
>
> **Revision 11 — closes the version 7 review, and changes how this section
> works.** M-1 was the first finding in this chain that would have shipped a
> wrong status code: `express.json()` is content-type-conditional, so it *skips*
> a non-JSON request instead of rejecting it, and revision 10's flow produced a
> `400` where AC-2 requires a `415`. Revision 10 had also asserted that a `415`
> was "structurally not producible" in route-level middleware, which is simply
> untrue — reading a request header is what middleware does. FR-22 and VR-10 now
> split the rule: the `415` is an explicit header check in the boundary
> middleware, the `413` stays with `express.json()`. M-2: VR-11 had two owners;
> `errorHandler.ts` is now its sole one and the schemas row no longer claims it.
>
> **Root cause, addressed rather than patched.** Every finding from review v5
> onward has been a seam between a requirement and the Affected Components table.
> The cause was that this document pinned filenames for files that do not exist
> and that it has no authority to name. The spec template's own rule for this
> section is "name concrete files where they already exist; otherwise name the
> layer and its responsibility" — this revision follows it. A filename now
> appears for a not-yet-existing file only where a convention supplies it
> (`src/lib/errors.ts` per AD-6, `src/server.ts` per module-map); everything else
> names a layer and a responsibility. The Minors are closed with it: SR-8, SR-9
> and SR-10 gained the justification paragraph the unmapped FRs already had, and
> both FR-22 and FR-24 now name `IMPLEMENTATION_PLANNING` as the stage that may
> choose an internal file name, since `API_DESIGN`'s outputs under
> `stage-map.yaml` are `api_design` and `openapi` — the HTTP contract, not
> internal structure.
>
> **Revision 10 — closes the version 6 review.** Both Major findings were
> contradictions this document created itself, in the seam between a requirement
> added late and the Affected Components table that was not updated with it.
>
> M-1: FR-22 claimed all of VR-1…VR-11 run in the shared validation middleware
> while the table said VR-10 is enforced by `express.json()`. The table was
> right and the requirement was wrong — `express.json()` runs before a route
> reaches its middleware, so the `415`/`413` VR-10 needs cannot be produced
> there. FR-22 now scopes itself to VR-1…VR-9 and says where the other two are
> enforced and why. M-2: FR-24 forbade `auth.service.ts` from importing `argon2`
> while that file's row still listed "Argon2id hashing" as its content and did
> not cite FR-24; the row now says it calls the helper, and the helper has a
> component row of its own.
>
> m-1: the requirements were in the order they were appended (…19, 21, 24, 22,
> 23, 20) because each revision inserted before an anchor. They are now in
> numeric order. **No id changed** — the blocks were moved, not renumbered, so
> every reference elsewhere in this document and in the reviews still resolves.
> m-2: the justification list for the requirements that map to no Acceptance
> Criterion now covers FR-24.
>
> **Revision 9 — an author's pass before review, not a review response.** No
> stage ran and no workflow transition was recorded; `SPEC_REVIEW` had not yet
> executed against revision 8. One Major and three Minor problems were found by
> re-reading the conventions rather than the document.
>
> The Major is the fifth instance of one recurring defect in this
> specification's drafting: a required behavior stated without naming the file a
> convention has already promised for it. `module-map.md` lists `src/lib/` as
> holding "`errors.ts` … [and] token/hash helpers", both "created by the Story
> that first needs them". Revision 8 acted on the first half of that sentence
> (FR-21) and missed the second, leaving Argon2id hashing sitting in
> `auth.service.ts` with no helper named. FR-24 closes it. A `grep` across every
> convention document for deferred assignments now returns only those two
> sources, so the class is exhausted rather than merely reduced.
>
> The three Minor: the `auth.schemas.ts` row separated defining a rule from
> applying it and said why VR-10 is absent; a `users.schemas.ts` row was added so
> the design stage decides rather than discovers; and the pre-existing-file list
> gained `docs/api/openapi.json`, the seventh — a correction to the same list
> revision 8 had just corrected.
>
> **Revision 8 — closes the version 5 review.** M-1: FR-21 creates
> `src/lib/errors.ts` with the `DomainError` base and `ConflictError`, which AD-6
> assigns to the first Story that throws a domain error — this one. M-2: FR-22
> puts boundary validation in the shared middleware AD-5 requires. A third
> instance of the same defect, which the review did not name, was found while
> fixing these two and is closed by FR-23: the rate-limit factory SC-3 assigns to
> this Story had no home either. m-1: the Affected Components preamble now names
> all six files that already carry real content, `.env.example` among them.
>
> **Timestamp correction.** Revisions 6 and 7 recorded `updated_at` values ahead
> of the real clock, because those runs wrote a hardcoded string instead of
> reading the system clock as `docs/workflow/artifact-schema.md` requires. This
> revision records the true runtime value (2026-09-02T05:55:55Z). The two
> `history.jsonl` entries carrying the wrong values are **not** rewritten — that
> log is append-only by `docs/workflow/state-schema.md`, and editing it to hide an
> authoring error is exactly what the rule prevents. Order by version and by
> append position is unaffected.
>
> **Revision 7 — closes the version 4 review.** M-1: BR-6 assigns the `User`
> record's persistence to the `users` module, where the glossary and
> `module-map.md` put it — `users.repository.ts` holds the only Prisma access,
> `users.service.ts` owns the transactional uniqueness-check-and-insert, `auth`
> reaches it through that service, and `auth.repository.ts` is explicitly not
> part of this Story. BR-6 also records why `eslint.config.js` cannot catch the
> violation. M-2: FR-19 now carries both halves of PC-1's isolation decision, and
> `vitest.config.ts` is a component row. M-3: FR-20 puts `src/server.ts` in
> scope with `listen`, signal handling and the Prisma disconnect. m-1: the Open
> Decisions section cites the current registry. m-2: AC-004's row no longer
> lists VR-11.
> m-3: the Affected Components preamble names `src/lib/openapi.ts` and
> `vitest.config.ts` as existing rather than calling every file a placeholder.
>
> **Revision 6 — no requirement changed.** The decision registry marked
> OD-US-001-02's empty-body option foreclosed, which is what FR-5
> already stated; this document re-records the input versions it consumed so the
> staleness contract in `docs/workflow/artifact-schema.md` stays satisfied. The
> requirements, rules and traceability below are unchanged from revision 5.
>
> **Revision 5 — closes the version 3 review.** Both Major and the one Minor
> finding are addressed. M-1: FR-19 now states the PC-1 test-database scope in
> full, including the `db:test:up` / `db:test:down` scripts and their `AGENTS.md`
> command-table rows and the `.env.example` placeholder, and Affected Components
> gains `package.json` and `AGENTS.md` rows. M-2: FR-18 no longer claims
> exclusivity or derives the JWT removal from SC-7 — SC-7 is a floor, the removal
> rests on SC-3, and it is stated as a choice with the alternative left open for
> the gate. m-1: AC-003's traceability row now lists only the rules whose failure
> is that criterion's condition. No requirement the review left unchallenged was
> dropped or reworded.
>
> **Revision 4 — closes the version 2 review.** All three Major and all four
> Minor findings of `docs/reviews/specifications/US-001-spec-review.md` (v2) are
> addressed: FR-17 and the AC-001 traceability row carry the criterion's fourth
> outcome (M-1); FR-5 states that the resolved status decision forecloses an
> empty response body, so OD-US-001-02 chooses fields only (M-2); FR-18 states
> the end state of `.env.example`, with the alternative reading flagged for the
> gate rather than left implicit (M-3); FR-13 no longer restates SC-3's number
> (m-1); BR-4 quotes SC-3 accurately and separates the lifetimes from the secrets
> (m-2); the `src/config/env.ts` row enumerates its variables (m-3); FR-2 cites
> BR-001 (m-4). No requirement the review left unchallenged was dropped or
> reworded.
>
> **Revision 3 — no requirement changed.** The decision registry absorbed
> OD-US-001-10 and OD-US-001-11, so this document re-records the
> input versions it consumed. Without that, the staleness contract in
> `docs/workflow/artifact-schema.md` would treat this specification as generated
> from a superseded registry and block progression. The requirements, rules, and
> traceability below are unchanged from revision 2.
>
> **Revision 2 — replaces the pre-registry version 1 in place.** Version 1 was
> written by the legacy `story-spec-writer` before `CLARIFICATION` ran, and was
> `SUPERSEDED` for that reason. `supersedes` is `null` rather than
> self-referential: the prior revision occupied this same path, so `version: 2`
> is what downstream staleness detection reads
> (`docs/workflow/artifact-schema.md`). The authorities for this revision are the
> clarification report and the decision registry, not the prior text.
>
> **What changed, and why.** Version 1's FR-2 required the duplicate-email error
> not to reveal existing-account status. That is now the opposite of the decided
> behavior: `docs/product/business-rules.md` BR-009 records registration as the
> deliberate exception, decided by a human on 2026-09-01, and the Story's own
> AC-002 carries the matching amendment. Version 1 also cited `AGENTS.md` for
> rules that now live in the architecture convention documents, and listed as
> undecided several things since decided (password policy, Argon2id parameters,
> the register rate limit, email case-folding). Two of its open questions were
> **not** covered by the clarification report and are carried forward here as
> OD-US-001-10 and OD-US-001-11 — see Open Decisions. No requirement that its
> review left unchallenged was dropped.

## Overview

A prospective Customer creates their own account by submitting an email and a
password to a public endpoint, with no operator involvement. One `User` record is
persisted — the Customer, their Account, and their Profile are three views of it
(`docs/product/business-glossary.md`) — carrying the email, an Argon2id password
hash, and the role `CUSTOMER`.

Registration authenticates nobody: it issues no access token and sets no refresh
cookie. Its only obligation towards later sign-in is that it stores a hash US-002
can verify.

This is the first Story of the product. Every module file it touches is currently
a one-line placeholder and `prisma/schema.prisma` has no datasource, so the Story
also carries the project's first Prisma model and migration, its application
bootstrap, its configuration boundary, and the test-database setup that
`docs/architecture/persistence-conventions.md` PC-1 assigns to the first Story
needing database-backed tests. That scope was confirmed by a human on 2026-09-01
(`docs/evidence/US-001-clarification-report.md` §5).

## Business Goal

Allow customers to self-register without administrator involvement (Story,
Business Value). It is the entry point of EPIC-1 and a precondition for the
product-vision success criterion that a person with no prior account can reach an
accepted authenticated request without any manual step by an operator
(`docs/product/product-vision.md`, Success Criteria).

## Business Flow

**Main path.** A prospective Customer submits an email and a password to
`POST /api/v1/auth/register`. The request is validated at the HTTP boundary. The
email is normalized before it is compared or stored. The system checks that no
account exists for that email; finding none, it hashes the password with
Argon2id, persists one `User` record with role `CUSTOMER` in an enabled state,
emits a security-audit event, and returns a success response that carries no
credential material.

**Divergences.**

- The submitted email is already registered → the request is rejected, no
  account is created, and the response states that the email is already
  registered (per AC-002, `docs/product/business-rules.md` BR-009). The password
  is never hashed on this path.
- The email fails format or length validation → rejected at the boundary before
  any service or database work (per AC-003).
- The password fails the password policy → rejected at the boundary (per
  AC-004).
- The request carries an unknown body property, a wrong `Content-Type`, or an
  oversized body → rejected at the boundary (per `AGENTS.md` Validation,
  `docs/architecture/api-conventions.md` AC-2).
- The caller exceeds the registration rate limit → rejected before the handler
  runs (per `docs/architecture/security-conventions.md` SC-3).
- Two requests for the same email race each other → at most one account exists
  afterwards, and the loser receives the same rejection as any duplicate (per
  `docs/product/business-rules.md` BR-001,
  `docs/architecture/persistence-conventions.md` PC-4).

## Functional Requirements

FR-1. `POST /api/v1/auth/register` accepts a JSON body containing an email and a
password, and is reachable without authentication (per AC-001; per
`docs/architecture/security-conventions.md` SC-4, which lists registration among
the public endpoints; per `docs/architecture/api-conventions.md` AC-3, which
names `register` as a permitted verb endpoint under `/api/v1/auth/`).

FR-2. On success the system creates exactly one `User` record for the submitted
email (per AC-001; per `docs/product/business-rules.md` BR-001, the per-email
uniqueness rule, which BR-003 restates at the level of the person).

FR-3. The created record carries the role `CUSTOMER` (per AC-001; per
`docs/product/business-rules.md` BR-006 and
`docs/architecture/security-conventions.md` SC-2, which define it as the default
and only role).

FR-4. The created account is in an enabled state (per
`docs/architecture/security-conventions.md` SC-2), and that state is represented
by the existence of the record rather than by a persisted column: this Story's
migration carries no account-state column (per OD-US-001-05). US-002 is
the Story that must reject a disabled account (`docs/product/business-rules.md`
BR-004) and it adds the column under the project-wide account-state decision;
choosing a boolean here would pre-empt that decision and cost a migration if it
resolves to an enum. Registration never reads or branches on account state.

FR-5. On success the system responds `201 Created` with the created resource
body and no `Location` header (per `docs/architecture/api-conventions.md` AC-4,
"Registration — decided", resolved by a human on 2026-09-01). That body carries
exactly four fields — `id`, `email`, `role` and `createdAt` — the non-sensitive
projection of the created record (per OD-US-001-02). `createdAt` is
serialized per `docs/architecture/api-conventions.md` AC-11, and `role` carries
the `CUSTOMER` value defined in
`docs/architecture/security-conventions.md` SC-2.

Two consequences bind later stages: the repository selects exactly these fields
rather than the whole record (`docs/architecture/persistence-conventions.md`
PC-8), and the response is built from an explicit DTO
(`docs/architecture/architecture.md` AD-4). US-003 must keep returning them.

FR-6. When an account already exists for the submitted email, the system rejects
the request, creates no account, and returns a response stating that the email is
already registered (per AC-002; per `docs/product/business-rules.md` BR-009, which
records registration as the deliberate exception to the non-disclosure rule and
the accepted risk behind it).

FR-7. On the duplicate-email path the submitted password is not hashed: the
request short-circuits (per `docs/architecture/security-conventions.md` SC-3,
which decides against equalizing timing for registration and forbids "hardening"
it into constant-time behavior without a new approved decision).

FR-8. When the submitted email fails format or length validation, the request is
rejected before any service or repository work (per AC-003; per
`docs/architecture/architecture.md` AD-5).

FR-9. When the submitted password fails the password policy, the request is
rejected before any service or repository work (per AC-004; per
`docs/architecture/architecture.md` AD-5).

FR-10. On success the password is persisted only as an Argon2id hash, and the
plaintext is never persisted (per AC-005; per
`docs/architecture/security-conventions.md` SC-1 and
`docs/product/business-rules.md` BR-005).

FR-11. The success response contains neither the password, nor the password hash,
nor any other sensitive internal field (per AC-006; per
`docs/architecture/architecture.md` AD-4, which requires an explicit response DTO
rather than a persistence model). The fields it does carry are the four FR-5
names, and no others; `password_hash` is not among them and is returned by no
endpoint (SR-4).

FR-12. On success the system emits a security-audit event for the registration,
distinct from general request logging and containing no password (per AC-007; per
`docs/architecture/security-conventions.md` SC-9, which names registration among
the security-relevant events that are logged for audit).

**What the event carries** is the three fields SC-9 decides: a stable `event`
name, the acting `userId`, and the `requestId` — for this Story
`{ event: "user.registered", userId, requestId }`. It carries **no personal
data**: not the email address, not the client IP. The `event` field is what makes
the line distinct from general request logging, and it is what a test asserts on;
the email stays recoverable from the database through `userId` when an
investigation needs it.

**When it is emitted** is after the database transaction commits, best-effort and
never transactional (per SC-9). A failed audit write is itself logged as an error
and does not fail the request, so a Customer does not lose a completed
registration because a log sink was unavailable. The consequence is accepted
explicitly: an account can exist with no audit line (EC-4).

FR-13. The registration endpoint is rate-limited to the register threshold
decided in `docs/architecture/security-conventions.md` SC-3, and a caller
exceeding it receives `429`. The threshold is defined there and is deliberately
not repeated in this document, for the same reason the password policy is not
(VR-6). SC-3 also specifies the shape — one `express-rate-limit` factory mounted
on `/api/v1/auth`, created by this Story — and leaves the numbers for `login`,
`refresh` and `logout` to the Stories that introduce those endpoints, so this
Story sets none of them.

FR-14. The application is configured with `helmet` enabled, `X-Powered-By`
disabled, an explicit CORS allow-list, an explicit `trust proxy` hop count, and
an explicit JSON body size limit of `10kb` (per
`docs/architecture/security-conventions.md` SC-5;
`docs/architecture/api-conventions.md` AC-2). The topology values are decided in
SC-5, "Environment topology — decided"; the `10kb` limit is decided in SC-5 as
well, and is a deliberate value rather than a library default — the largest body
any current endpoint accepts is a registration of two short fields, and a tight
limit is the cheapest reduction of denial-of-service surface on an
unauthenticated route.

FR-15. Every request carries a request id that appears in the response headers
and in every log line for that request (per
`docs/architecture/api-conventions.md` AC-9;
`docs/product/non-functional-requirements.md` NFR-010).

FR-16. The OpenAPI document is generated from the Zod schemas that validate this
endpoint, not hand-maintained (per `docs/architecture/api-conventions.md` AC-10).

FR-17. A successfully registered account is usable for authentication with no
intervening step: nothing must be confirmed, activated, or approved between
registration succeeding and the Customer being able to sign in (per AC-001,
whose fourth outcome is that the customer can authenticate later; email
verification is excluded by the Story's Out Of Scope and by
`docs/product/product-vision.md` Out of Scope). What this Story owes that
outcome is exactly FR-10 — a stored Argon2id hash that the authentication flow
introduced by US-002 can verify — and nothing more, because US-001 issues no
token and builds no sign-in path.

FR-18. `.env.example` lists every variable this Story requires, each with a safe
placeholder, and is updated in the same change that adds one (per
`docs/architecture/security-conventions.md` SC-7). For this Story that is
`NODE_ENV`, `PORT`, `LOG_LEVEL`, `DATABASE_URL`, `CORS_ALLOWED_ORIGINS` and
`TRUST_PROXY` — the last two carrying the values decided in SC-5 — plus the
test-database placeholder that
`docs/architecture/persistence-conventions.md` PC-1 pairs with `.env.test`
(FR-19).

The four JWT entries currently in the file — `JWT_ACCESS_SECRET`,
`JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL` — are removed by this
Story and re-added by the Story that first validates each. **That rests on SC-3,
not on SC-7.** SC-3 keeps the JWT variables out of `src/config/env.ts` until the
Story that needs each, so nothing this Story ships reads them, and a placeholder
for a variable no code validates tells a reader the application needs something
it does not. SC-7 is a floor: it requires every required variable to be listed
and does not by itself forbid listing more. So this is a choice the
specification makes on SC-3's basis, not a deduction — see Open Decisions, where
the alternative is left open for the gate.

FR-19. This Story creates the test-database setup that
`docs/architecture/persistence-conventions.md` PC-1 assigns to the first Story
needing database-backed tests, in full. PC-1's own list is the authority and is
not narrowed here: a `docker-compose.yml` with a `db` service on port 5433; the
`db:test:up` and `db:test:down` npm scripts, **both added to the `AGENTS.md`
command table** as PC-1 requires by name; `.env.test` with the test
`DATABASE_URL` and the matching placeholder line in `.env.example` (FR-18); a
Vitest `globalSetup` that runs `prisma migrate deploy` and, when the database is
unreachable, fails with the command to run rather than a raw connection error; a
truncation fixture under `tests/support/`; and a `services: postgres` block in
`.github/workflows/ci.yml`. None of it pre-exists.

PC-1's isolation decision has two halves and this Story implements both.
Truncation between tests is the half the fixture covers. The other is that
**integration tests run serially** — PC-1 names the mechanism, `tests/integration`
setting `fileParallelism: false`, and the reason: `vitest.config.ts` currently
shuffles files and runs them in parallel, which is correct for unit tests and
unsafe against one shared database, because a `TRUNCATE` in one file would delete
rows another file is mid-assertion on. Unit tests keep parallel execution and file
shuffling. A truncation fixture without serial execution satisfies neither PC-1 nor
NFR-005's requirement that tests be order-independent.

FR-20. `src/server.ts` becomes the process entry point: it calls `listen`, handles
`SIGTERM` and `SIGINT`, and shuts down gracefully including the Prisma disconnect
(per `docs/architecture/module-map.md`, which assigns exactly this to that file;
per `AGENTS.md` Errors & logging, which requires graceful shutdown on
`SIGTERM`/`SIGINT` with a Prisma disconnect). `src/app.ts` carries no `listen()`
(`docs/architecture/architecture.md` AD-9). It is currently a one-line placeholder
while `package.json` already points `dev` and `start` at it, so without this
requirement the Story delivers an application that cannot be started — and the
Prisma disconnect is what keeps a redeploy from leaking connections.

FR-21. This Story creates `src/lib/errors.ts`, because it is the first Story that
throws a domain error. `docs/architecture/architecture.md` AD-6 names US-001 as
that Story and names what it creates: the abstract `DomainError` base plus
`ConflictError`, `UnsupportedMediaTypeError`, `PayloadTooLargeError` and
`ValidationError` — the four subclasses this Story actually throws. Each has a
throw site here: `ConflictError` on the duplicate-email path (AD-6's own example
is `new ConflictError('EMAIL_ALREADY_REGISTERED')`, the exact throw FR-6
performs), `UnsupportedMediaTypeError` from the boundary `Content-Type` check,
`PayloadTooLargeError` from the body-size limit, and `ValidationError` wrapping
the malformed-JSON failure `express.json()` raises so it reaches the handler as a
domain error rather than as a library error.

`UnauthorizedError`, `ForbiddenError` and `NotFoundError` are **not** created:
they have no throw site in this Story, and AD-6 leaves each to the Story that
first throws it. A Zod schema failure is not a domain error either — the handler
maps the `ZodError` itself to `400` under AD-6's mapping.

FR-22. Boundary validation is applied by shared validation middleware in
`src/middleware/`, not by a controller or a route calling a schema directly (per
`docs/architecture/architecture.md` AD-5, which states that request-shape
validation is "applied by shared validation middleware in `src/middleware/`", and
that services receive already-validated, typed input; per
`docs/architecture/module-map.md`, which lists validation among the shared
middleware). **VR-1…VR-6 and VR-9 run there** — the request-shape rules AD-5
names: required fields, types, format, length, normalization and the rejection
of unknown properties. VR-7 and VR-8 are not among them and run nowhere in this
Story: VR-7 is an exclusion, deferring the breached-password check to US-009,
and VR-8 is a placement rule about where the password policy is written, owned
by the `auth.schemas.ts` row of Affected Components.

**VR-10 is split, and its `415` half runs here too.** `express.json()` enforces
only the size limit: it is content-type-conditional, so a request whose
`Content-Type` is not `application/json` is *skipped* rather than rejected, and
the request then fails schema validation as missing fields — a `400` where
`docs/architecture/api-conventions.md` AC-2 and this document's own Error
Handling table require a `415`. The boundary middleware therefore checks the
header itself and rejects a non-JSON body with `415` before any schema runs,
throwing the `UnsupportedMediaTypeError` FR-21 creates so the status reaches the
client through the centralized error middleware rather than as a generic `500`.
Revision 10 asserted the opposite, that a `415` was "structurally not producible"
at this layer; that was wrong — reading a request header is exactly what
middleware does. The `413` half stays with `express.json()`, which is the only
component that sees the body's size as it streams; its size error is translated
into the `PayloadTooLargeError` FR-21 creates, for the same reason.

**VR-11 does not run here.** It is not an input rule but a shape rule for the
error body, realized by the error middleware from the `ZodError` this middleware
surfaces. It is listed against `errorHandler.ts` in the Affected Components table
and nowhere else.

No convention fixes the file's
name, so `IMPLEMENTATION_PLANNING` may choose it; what is fixed is that it is one shared
middleware and that a controller calling `schema.parse()` inline is a layering
violation — one no lint rule catches, which is why it is stated as a requirement.

FR-23. The `express-rate-limit` factory FR-13 requires lives in `src/middleware/`
and is mounted on `/api/v1/auth` in `src/app.ts` (per
`docs/architecture/module-map.md`, which lists rate limiters among the shared
middleware; per `docs/architecture/security-conventions.md` SC-3, which places
the mount in `src/app.ts` and assigns its creation to this Story). FR-13 states
the behavior; this states where it lives.

FR-24. This Story creates the password-hashing helper in `src/lib/`, because it
is the first Story that hashes anything. `docs/architecture/module-map.md` lists
`src/lib/` as holding, alongside `errors.ts`, the "token/hash helpers" that are
"created by the Story that first needs them" — the same sentence FR-21 acts on
for the error taxonomy. The helper wraps `argon2` and applies the SC-1 cost
parameters from the configuration boundary on every call, so that no call site
can omit one; `auth.service.ts` calls it rather than importing `argon2` directly.
This placement is what `module-map.md` already permits: `src/lib/` may import
`src/config` and third-party libraries, and never imports a module. No convention
fixes the file's name, so `IMPLEMENTATION_PLANNING` may choose it — `API_DESIGN`
produces the HTTP contract (`stage-map.yaml` outputs `api_design`, `openapi`) and
does not name internal files. Token helpers are not created here — this Story issues no token (BR-4).

## Business Rules

Story-specific rules, numbered `BR-<n>`. They do not restate the global rules in
`docs/product/business-rules.md`, whose ids are `BR-00n`; where a global rule
governs, it is cited rather than copied.

BR-1. Email uniqueness is enforced in two places: a check in the service layer
and a database uniqueness constraint, so that a race cannot create a duplicate
(per `docs/product/business-rules.md` BR-001;
`docs/architecture/persistence-conventions.md` PC-4). Neither alone satisfies
this rule.

BR-2. The email is normalized before it is compared or stored — **trimmed of
leading and trailing whitespace, then lowercased** — and the normalized value is
what is persisted, so uniqueness is case-insensitive and insensitive to
surrounding whitespace (per `docs/product/business-rules.md` BR-002 for the
case-folding; per OD-US-001-10, for the trimming). Normalization
happens before format validation and before the uniqueness comparison. Accepting
the value as submitted would let two accounts differ by a single space, which
satisfies the `@unique` constraint while defeating BR-001 in substance.

BR-3. The duplicate-email rejection is the decided behavior and not an
enumeration defect. A review finding that asks for it to be genericized is
answered by `docs/product/business-rules.md` BR-009, and reopening it requires a
new approved decision.

BR-4. Registration issues no access token and sets no refresh cookie, so no JWT
variable enters the configuration boundary in this Story.
`docs/architecture/security-conventions.md` SC-3 states this directly for the two
lifetimes — "neither variable is added to `src/config/env.ts` before the Story
that needs it", where the two are `JWT_ACCESS_TTL` and `JWT_REFRESH_TTL` — and
adds "registration issues no token, so US-001 adds neither". The two signing
secrets, `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`, are governed by a
different SC-3 bullet, which requires startup to fail when they are missing; that
requirement binds the Story that first verifies a token, not this one, because
validating a secret US-001 never uses would make the application refuse to start
for no reason it can act on. FR-18 states what follows for `.env.example`.

BR-5. Account creation is a read-then-write guarded by a uniqueness rule and
therefore runs inside a transaction opened by the service that owns the record
(per `docs/architecture/persistence-conventions.md` PC-9;
`docs/architecture/architecture.md` AD-3). BR-6 says which service that is.

BR-6. The `User` record belongs to the `users` module, so every Prisma query
against it lives in `users.repository.ts`, and `auth` reaches it only through
`users.service.ts`. `docs/product/business-glossary.md` states the ownership —
"the module that owns it is `users`; `auth` owns the credential operations
performed against it" — and `docs/architecture/module-map.md` scopes a repository
to "this module's data" and requires a module to reach another module through its
**service**. Two consequences bind this Story: the uniqueness check and the
insert are one operation exposed by `users.service.ts`, which opens the
transaction BR-5 requires, because `auth` has no repository for a record it does
not own; and `auth.repository.ts` is therefore not part of this Story at all —
`auth` gains a repository when it first persists something of its own, which is
the refresh token in a later Story.

This is the rule `eslint.config.js` cannot enforce. Its `no-restricted-imports`
blocks express *layers*, so `auth.repository.ts` importing `src/lib/prisma.ts`
passes every mechanical check; what would be wrong is whose data it reads. The
violation is only visible to a reader, which is why it is written here as a rule
rather than left to the layering lint.

## Acceptance Criteria

| AC id | Criterion | Observable outcome |
|---|---|---|
| AC-001 | Successful registration with a valid email and password | An account exists that did not exist before, carrying role `CUSTOMER`; a success response is returned; the stored credential is sufficient for US-002 to authenticate the Customer later |
| AC-002 | An account already exists for the submitted email | The registration is rejected, no duplicate account exists afterwards, and the response states that the email is already registered (per BR-009) |
| AC-003 | The submitted email is not a valid email format | The request is rejected with a validation error |
| AC-004 | The submitted password does not meet the password policy | The request is rejected with a validation error |
| AC-005 | Registration succeeds | The password is stored only as an Argon2id hash; no plaintext is persisted anywhere |
| AC-006 | Registration succeeds | The response body contains neither the password, nor the password hash, nor any other sensitive internal field |
| AC-007 | Registration succeeds | A security-audit event `{ event: "user.registered", userId, requestId }` is recorded after the account is committed, distinct from general request logging by its `event` field, containing no password and no personal data |

## Validation Rules

All rules are enforced with Zod at the HTTP boundary, before any service call
(per `docs/architecture/architecture.md` AD-5;
`docs/product/non-functional-requirements.md` NFR-002). TypeScript types do not
substitute for any of them.

VR-1. `email` — required; must be present and a string (per AC-003).

VR-2. `email` — must be a valid email format; a value that is not is rejected
(per AC-003).

VR-3. `email` — maximum length is **254 characters**, the longest address SMTP
can carry (per OD-US-001-04). The same bound applies at the boundary
and as `@db.VarChar(254)` on the persisted column, so that a value the database
would reject fails as a `400` validation error rather than as a database error
(per `docs/architecture/persistence-conventions.md` PC-4;
`docs/architecture/architecture.md` AD-5). A longer address could never receive
mail, so an account created with one could not be recovered or confirmed later.

VR-4. `email` — trimmed of leading and trailing whitespace, then lowercased,
before format validation, before the uniqueness comparison, and before storage;
the normalized value is what is stored (per
`docs/product/business-rules.md` BR-002; per OD-US-001-10). BR-2 states
the rule and why the alternative was rejected.

VR-5. `password` — required; must be present and a string (per AC-004).

VR-6. `password` — must satisfy the password policy decided in
`docs/architecture/security-conventions.md` SC-1: the minimum and maximum length,
the character-class requirement, the acceptance of every printable character, and
the counting of length in Unicode code points are all defined there and are
deliberately not repeated in this document. Implement exactly that policy and
nothing beyond it (per AC-004; per the Story's AC-004 note).

VR-7. `password` — the breached-password check is **not** part of this Story; it
is deferred to US-009 (per `docs/architecture/security-conventions.md` SC-1; per
the Story's AC-004 note).

VR-8. The policy is expressed once, as the Zod schema for the password field in
the owning module's `<module>.schemas.ts`, and is not duplicated in the service
and not exposed as an environment variable (per
`docs/architecture/security-conventions.md` SC-1).

VR-9. The request body carries exactly two properties, `email` and `password`,
and an unknown property is rejected (per `AGENTS.md` Validation;
`docs/architecture/api-conventions.md` AC-5; per OD-US-001-03, which
settles that registration collects no field beyond these two — profile columns
arrive with US-003 / US-004 in their own migration).

VR-10. A request with a body and no `application/json` content type is rejected
with `415`; a body exceeding the `10kb` size limit is rejected with `413`
(per `docs/architecture/api-conventions.md` AC-2, AC-5; the limit is decided in
`docs/architecture/security-conventions.md` SC-5). The two halves are enforced in different places and FR-22 says
why: the `415` needs an explicit header check in the boundary middleware, because
`express.json()` skips a non-JSON request rather than rejecting it; the `413` is
`express.json()`'s own, since it is the only component that sees the body size as
it streams.

VR-11. Every validation failure populates `details.fieldErrors`, naming the
field that failed and — for a password failure — which password rule it broke
(per OD-US-001-09). This is the shape
`docs/architecture/api-conventions.md` AC-6 already documents, and a registration
form cannot show a per-field error without it. No `message` and no `details`
value ever echoes the submitted password (per
`docs/architecture/security-conventions.md` SC-1, SC-9): naming the rule that
failed is not the same as returning the value that failed it.

## Security Requirements

SR-1. The password is hashed with Argon2id using the parameters decided in
`docs/architecture/security-conventions.md` SC-1, passed explicitly on every
call rather than relying on the library defaults. The values are defined there
and are deliberately not repeated here (per AC-005).

SR-2. The Argon2id cost parameters are constants in the configuration boundary,
not environment variables, so no environment can weaken hashing (per
`docs/architecture/security-conventions.md` SC-1).

SR-3. The plaintext password exists only in the inbound request body. It is never
persisted, never logged, never returned, never placed on a response DTO, and
never included in an error `details` object (per AC-005, AC-006; per
`docs/architecture/security-conventions.md` SC-1, SC-9).

SR-4. The hash is stored in the `password_hash` column and is returned by no
endpoint (per AC-005, AC-006; per
`docs/architecture/persistence-conventions.md` PC-10).

SR-5. The response is built from an explicit DTO; a persistence model is never
returned directly, and the repository query selects only the fields the response
needs (per AC-006; per `docs/architecture/architecture.md` AD-4;
`docs/architecture/persistence-conventions.md` PC-8).

SR-6. What may never appear in a response body, an error `message`, an error
`details` object, or a log line is the single list in
`docs/architecture/security-conventions.md` SC-9 — including Prisma error text
and constraint names, which matters on the duplicate-email path. This document
does not restate that list.

SR-7. Logging is Pino only; `console.log` and `console.error` do not appear in
`src/`, and redaction is configured on the logger rather than left to discipline
at each call site (per `docs/architecture/security-conventions.md` SC-9).

SR-8. The endpoint is rate-limited per FR-13, and the client IP that the limit
counts is derived from the explicit `trust proxy` hop count decided in
`docs/architecture/security-conventions.md` SC-5. A blanket `trust proxy: true`
is forbidden, because it lets a caller spoof the IP the limit depends on.

SR-9. Secrets come only from environment variables, validated at startup; the
configuration boundary is the only place `process.env` is read; `.env.example` is
updated in the same change that adds a variable; no real `.env` is committed (per
`docs/architecture/security-conventions.md` SC-7;
`docs/architecture/architecture.md` AD-7).

SR-10. No new dependency is added without explicit human approval and a stated
reason (per `docs/architecture/security-conventions.md` SC-6).

## Error Handling

Error-to-HTTP mapping happens only in the centralized error middleware;
controllers do not build error bodies and routes never construct one (per
`docs/architecture/architecture.md` AD-6;
`docs/architecture/api-conventions.md` AC-12). Every response below uses the
single error body shape in `docs/architecture/api-conventions.md` AC-6.

**Three of these statuses reach the middleware through classes AD-6 gained at
this Story's gate** (per OD-US-001-12). The `415` is raised by the
boundary middleware, the `413` and the malformed-JSON `400` by `express.json()`;
none of the three is a `ZodError`, and until the amendment none was a
`DomainError` either, so an error middleware recognizing only those two
categories would have returned `500` for all three. AD-6 now declares
`UnsupportedMediaTypeError` and `PayloadTooLargeError`, maps `413`, and wraps the
malformed-JSON failure in a `ValidationError` at the boundary. FR-21 creates all
three alongside `ConflictError`. The gap was inside the convention rather than
inside this Story — any Story with a request body would have met it — which is
why the answer was written into AD-6 and not only into the registry.

`code` values are part of the contract and are assigned by `API_DESIGN`; a code
invented during implementation is a finding, because renaming one later is a
breaking change (per `docs/architecture/api-conventions.md` AC-6). Only the
duplicate-email code is already decided.

| Case | Status | Code | Notes |
|---|---|---|---|
| Email already registered | `409` | `EMAIL_ALREADY_REGISTERED` | Decided in `api-conventions.md` AC-6 and `business-rules.md` BR-009. The message states that the email is already registered. Carried by a typed domain error thrown in the service (AD-6) |
| Uniqueness violation raised by the database under a race | `409` | `EMAIL_ALREADY_REGISTERED` | Same response as the service-level check, so the two paths are indistinguishable to a client. No Prisma error text, error code, or constraint name reaches the body or a log line (SC-9) |
| Invalid email format or length | `400` | assigned by `API_DESIGN` | Zod failure at the boundary. `details.fieldErrors` names the field (VR-11). Length bound is 254 (VR-3) |
| Password fails the policy | `400` | assigned by `API_DESIGN` | `details.fieldErrors` names which password rule failed and never echoes the submitted password (VR-11, SC-1, SC-9) |
| Unknown body property | `400` | assigned by `API_DESIGN` | Per AC-5. Only `email` and `password` are accepted (VR-9) |
| Malformed JSON | `400` | assigned by `API_DESIGN` | Raised by `express.json()` and wrapped in a `ValidationError` at the boundary, per AD-6, so it reaches the handler as a domain error rather than a library error |
| A request **with a body** whose `Content-Type` is missing or not `application/json` | `415` | assigned by `API_DESIGN` | Scoped to a request with a body, per AC-2, which is the more specific of the two sources; AC-5's table row states it unqualified. A bodyless `POST` fails schema validation as missing fields and is a `400`. Carried by `UnsupportedMediaTypeError` (AD-6, FR-21) |
| Body exceeds the `10kb` size limit | `413` | assigned by `API_DESIGN` | Limit decided in SC-5. Carried by `PayloadTooLargeError` (AD-6, FR-21) |
| Rate limit exceeded | `429` | assigned by `API_DESIGN` | Per SC-3 |
| Anything unmapped | `500` | assigned by `API_DESIGN` | Generic body; diagnostics stay server-side (SC-9, AD-6) |

## Non-Functional Requirements

Only what applies to this Story, cited from
`docs/product/non-functional-requirements.md`.

- **NFR-001 Security — credentials.** Passwords stored only as an Argon2id hash.
  The token half of that requirement belongs to US-002; registration issues none.
- **NFR-002 Validation.** Every external input validated at runtime with Zod at
  the boundary.
- **NFR-003 API design.** `/api/v1` base path, the single error body shape, and
  an explicit status code per operation.
- **NFR-004 Persistence.** Explicit nullability, lengths, uniqueness constraints
  and indexes on the model; a committed migration ships with the schema change.
- **NFR-005 Testing.** Happy path, validation and negative paths, and security
  tests (sensitive data never returned). Deterministic, order-independent, and
  never against a shared or production database — which is what makes the PC-1
  test-database setup part of this Story.
- **NFR-006 Traceability.** Every Acceptance Criterion maps to at least one test
  in the AC test matrix.
- **NFR-007 Build stability.** Every applicable check in the `AGENTS.md` command
  table passes.
- **NFR-008 Architecture.** The `routes → controllers → services → repositories`
  layering.
- **NFR-009 Type safety.** No `any`, `@ts-ignore`, silencing non-null assertion,
  or forcing cast used to make the code compile.
- **NFR-010 Observability.** A request id in the response headers and on every
  log line.

**NFR-011 remains undecided** — expected load, uptime, latency budgets, and
regulatory scope. No requirement in this document assumes a target for any of
them. The audit-event content decided in SC-9 and stated by FR-12 was chosen so
that it does not depend on the compliance half of NFR-011: a log line holding
personal data would outlive the request under a retention policy nobody has set,
so the event carries none.

## Edge Cases

EC-1. The submitted email differs from an existing account's only by letter case
— relates to FR-6, BR-2. Normalization to lowercase happens before the
comparison, so the duplicate is detected.

EC-2. The submitted email carries leading or trailing whitespace — relates to
FR-6, FR-8, BR-2, VR-4. The whitespace is trimmed before format validation and
before the uniqueness comparison, so the value is accepted on its trimmed form
and a second account cannot differ from an existing one only by a space.

EC-3. Two registration requests for the same email are submitted concurrently —
relates to FR-6, BR-1, BR-5. At most one account exists afterwards; the loser
receives the same `409`, and no database error text escapes (SR-6).

EC-4. The audit event fails after the account row is committed — relates to
FR-2, FR-12. The account stands and the request still succeeds: the event is
emitted after the commit, best-effort, and a failed audit write is itself logged
as an error (per SC-9; per OD-US-001-11). The ordering cannot be
reversed, because the emit follows the commit. The accepted consequence is that
an account can exist with no audit line; a Customer does not lose a completed
registration because a log sink was unavailable.

EC-5. The `email` or `password` property is absent from the body entirely —
relates to FR-8, FR-9, VR-1, VR-5. Handled as any other boundary validation
failure, not as a separate case.

EC-6. A password is exactly at the policy's minimum or maximum length, or is
written in a script with no letter case — relates to FR-9, VR-6. The boundary
values and the known limitation of the character-class rule for caseless scripts
are both defined in `docs/architecture/security-conventions.md` SC-1; this Story
implements that policy without carving out an exception.

EC-7. A caller reaches the rate limit while sending an otherwise valid
registration — relates to FR-13. The `429` is returned before the handler runs,
so no account is created and no password is hashed.

EC-8. The submitted email is syntactically valid but longer than 254 characters
— relates to FR-8, VR-3. The boundary rejects it as a `400` before the database
sees it, because the Zod bound and `@db.VarChar(254)` are the same number; a
mismatch between them, or an unbounded column, would be a PC-4 violation.

## Affected Components

Most files named below are one-line placeholders or absent, so most rows are a
first implementation. Seven already carry real content and are **modified**, not
created: `src/lib/openapi.ts` (the shared registry the modules register into),
`vitest.config.ts`, `package.json`, `AGENTS.md`, `.github/workflows/ci.yml`,
`docs/api/openapi.json` (regenerated, never hand-edited), and `.env.example` —
which FR-18 edits rather than writes, since the four JWT entries it removes are
already there. Layering per
`docs/architecture/module-map.md`.

**Granularity follows this section's contract**, which is the spec template's: a
concrete path appears only when the file already exists in the tree, or when a
repository convention prescribes its name; otherwise the row names the layer and
its responsibility.

Below, that resolves to three groups. Files that already exist, placeholder or
not: everything under `src/`, `prisma/schema.prisma`, `vitest.config.ts`,
`package.json`, `AGENTS.md`, `.env.example`, `docs/api/openapi.json` and
`.github/workflows/ci.yml`. Files that do not exist but whose name a convention
supplies: `src/lib/errors.ts`, which
`docs/architecture/architecture.md` AD-6 names — and now assigns to this Story by
id — and `docker-compose.yml` and `.env.test`, both named literally in PC-1's
"What the implementing Story must build" list. That list is the citation: the
compose file's name is prescribed there, not inferred from PC-1's
`docker compose up`, which under Compose v2 would resolve to either
`compose.yaml` or `docker-compose.yml` and so could not settle a name on its own.

Everything else is a layer and a responsibility with no path — the boundary
validation middleware, the rate-limit factory, the password-hashing helper, the
Vitest `globalSetup` and the `tests/support/` truncation fixture. PC-1 requires
the last two by responsibility and names a directory for one of them, but
supplies a filename for neither, so this document does not invent one.

Pinning a filename this document has no authority to pick is what produced four
revisions of drift between a requirement and its row.

| Layer | Component | Why it is affected |
|---|---|---|
| routes | `src/modules/auth/auth.routes.ts` | Mounts `POST /api/v1/auth/register` and wires the boundary validation and the controller (FR-1) |
| controllers | `src/modules/auth/auth.controller.ts` | Translates the validated request into a service call and shapes the success response (FR-5, FR-11) |
| services | `src/modules/auth/auth.service.ts` | Registration orchestration: **calls** the `src/lib` hashing helper rather than importing `argon2` itself, calls the `users` service, emits the audit event, throws the typed domain errors. Holds no Prisma access and no hashing implementation (FR-6, FR-7, FR-10, FR-12, FR-24, BR-6) |
| services | `src/modules/users/users.service.ts` | Owns the `User` record's write path: the uniqueness check and the insert as one operation, inside the transaction BR-5 requires, raising the typed conflict error `auth` maps to `409` (FR-2, BR-1, BR-5, BR-6, PC-9) |
| repositories | `src/modules/users/users.repository.ts` | The only Prisma access to the `User` record: lookup by normalized email, insert, accepting an optional transactional client. Selects exactly the four fields FR-5 returns rather than the whole record, so `password_hash` never leaves the repository (BR-1, BR-6, FR-5, PC-9, PC-8) |
| repositories | `src/modules/auth/auth.repository.ts` | **Not touched by this Story.** `auth` persists nothing of its own until the refresh token, so it gains no repository here (BR-6) |
| schemas | `src/modules/auth/auth.schemas.ts` | **Defines** the Zod request and response schemas, the single definition of the password policy, and the OpenAPI registration. The shared middleware **applies** them (FR-22). Covers VR-1…VR-6, VR-8 and VR-9 — VR-8 is the rule that this file is where the policy is written. VR-7 is an exclusion with nothing to express. VR-10 and VR-11 are not schema rules — the `Content-Type` check and the body limit run before a schema is reached, and VR-11 shapes an error rather than validating input (FR-16, FR-22) |
| schemas | `src/modules/users/users.schemas.ts` | Not created by this Story unless the design needs it. `users` exposes no endpoint here, and its repository may take its types from the Prisma client, which `module-map.md` permits. Named so the design stage decides rather than discovers (BR-6) |
| persistence | `prisma/schema.prisma` + first migration | The project's first datasource, generator, and `User` model: `email` as `@db.VarChar(254)` and `@unique`, the `password_hash` column, the `CUSTOMER` role, and the audit timestamps. **No account-state column and no profile column** — FR-4 and VR-9 say why each is absent (FR-2, FR-4, BR-1, VR-3, VR-9, NFR-004) |
| middleware | `src/middleware/errorHandler.ts` | Maps the four domain-error classes FR-21 creates and the `ZodError` to the single error body; **sole owner of VR-11**, the populated `details.fieldErrors` shape; generic `500` for anything unmapped (Error Handling, VR-11, AD-6, AC-12) |
| middleware | `src/middleware/requestId.ts` | Request id on the response and on every log line (FR-15) |
| middleware | boundary validation, in `src/middleware/` | Rejects a non-JSON `Content-Type` with `415`, then applies the Zod schemas so services receive validated input. Covers VR-1…VR-6, VR-9 and VR-10's `415` half — the request-shape rules FR-22 scopes to this layer. Named as a layer and a responsibility, not a filename, because the file does not exist and no convention names it (FR-22, AD-5) |
| middleware | rate limiting, in `src/middleware/` | The `express-rate-limit` factory SC-3 assigns to this Story, mounted on `/api/v1/auth` by `app.ts`. Layer and responsibility, not a filename — same reason (FR-13, FR-23) |
| application | `src/app.ts` | helmet, CORS allow-list, `trust proxy`, the `express.json()` body limit set to `10kb` per SC-5, which produces VR-10's `413`, the rate-limit factory mounted on `/api/v1/auth`, router mounting, error middleware last (FR-13, FR-14) |
| configuration | `src/config/env.ts` | The only reader of `process.env`. Validates exactly `NODE_ENV`, `PORT`, `LOG_LEVEL`, `DATABASE_URL`, `CORS_ALLOWED_ORIGINS` and `TRUST_PROXY` at startup — the variables this Story's code actually consumes — and holds the Argon2id cost parameters as constants. No JWT variable (SR-2, SR-9, BR-4, FR-18) |
| shared | `src/lib/prisma.ts`, `src/lib/logger.ts` | The single Prisma client and the Pino logger with redaction (SR-7, PC-1) |
| shared | `src/lib/errors.ts` | Created by this Story, which AD-6 now names by id: the abstract `DomainError` base plus `ConflictError`, `UnsupportedMediaTypeError`, `PayloadTooLargeError` and `ValidationError` — the four it throws. The other three AD-6 subclasses are not created here. Nothing imports it before it exists (FR-21) |
| shared | password hashing, in `src/lib/` | Created by this Story: wraps `argon2` and applies the SC-1 cost parameters from `src/config/env.ts` on every call, so no call site can omit one. Layer and responsibility, not a filename — unlike `errors.ts`, which AD-6 names (FR-24, SR-1, SR-2) |
| shared | `src/lib/openapi.ts` | Already implemented; the two modules register their schemas into the existing shared registry rather than replacing it (FR-16) |
| process entry | `src/server.ts` | `listen`, `SIGTERM`/`SIGINT` handling, graceful shutdown including the Prisma disconnect. `dev` and `start` already point at this file and it is a placeholder, so nothing runs without it (FR-20) |
| tests | `tests/integration/`, unit tests beside the source | Acceptance-Criterion coverage, including the negative and security paths (NFR-005, NFR-006, AD-9) |
| test infrastructure | `docker-compose.yml`, `.env.test`, Vitest `globalSetup`, `tests/support/` truncation fixture, `.github/workflows/ci.yml` | The PC-1 test-database setup, assigned to the first Story needing database-backed tests and confirmed in scope by a human on 2026-09-01 (FR-19) |
| test configuration | `vitest.config.ts` | Serial execution for `tests/integration` (`fileParallelism: false`), which PC-1 decides alongside truncation. Unit tests keep parallel execution and file shuffling, which the current config sets globally (FR-19) |
| tooling | `package.json` | The `db:test:up` and `db:test:down` scripts PC-1 requires for that setup. No other script changes (FR-19) |
| project rules | `AGENTS.md` | The two new scripts added to the Build and Validation Commands table — PC-1 requires this by name, and `AGENTS.md` is the single definition of what each check runs (FR-19) |
| documentation | `.env.example`, `docs/api/openapi.json` | Every variable this Story requires, with placeholders, plus the PC-1 test-database line; the four JWT entries removed per FR-18; the generated contract committed and non-stale (SR-9, FR-16, FR-18) |

## Out of Scope

Carried from the Story:

- Login, refresh, and logout flows.
- Email verification or confirmation.
- Password recovery.
- Multi-factor authentication.
- Administrator registration or role assignment — no such role exists.

Excluded by this specification, each with its authority:

- The breached-password check, deferred to US-009
  (`docs/architecture/security-conventions.md` SC-1).
- Re-hashing a password on login, deferred to US-002 (SC-1).
- Rate-limit thresholds for `login`, `refresh`, and `logout` (SC-3).
- Any JWT configuration variable (SC-3, BR-4 above).
- Account lockout, password rotation, expiry, and password history (SC-1, SC-3).
- Any role beyond `CUSTOMER`, and any permission model (SC-2).
- Any profile field, and the profile endpoints themselves: registration collects
  email and password only, and profile columns arrive with US-003 / US-004 in
  their own migration (per OD-US-001-03; VR-9).
- Any account-state column, deferred to US-002 under the project-wide
  account-state decision (per OD-US-001-05; FR-4).
- The `products`, `orders`, and `support` modules (`AGENTS.md` Active Scope).
- Any pagination or list endpoint (`docs/architecture/api-conventions.md` AC-8).

## Open Decisions

`docs/decisions/US-001-open-decisions.md` is the source of truth for this
Story's decisions. This section is a pointer into it: the ids that block
something in this document, and what each blocks here. It does not restate how
many decisions the registry holds, which version it is at, what status each
carries, or the stage at which each was raised — those belong to the registry
and are correct only there. **No value is proposed for any open entry**, however
obvious it may look; that is the failure this stage exists to prevent.

A decision the registry holds that blocks nothing in this document is not listed
below. It is not dropped — the registry still carries it.

**No decision in the registry blocks anything in this document.** Each answer
this specification depends on is stated where the behavior belongs, rather than
referenced as a pending id: the response body in FR-5 and
FR-11, the request's field set in VR-9, the email bound in VR-3, normalization in
BR-2 and VR-4, the account-state column in FR-4, the audit event's content and
timing in FR-12, the body limit in FR-14 and VR-10, the error-body shape in
VR-11, and the carriers for `415`, `413` and the malformed-JSON `400` in FR-21
and the Error Handling table.

Three of those answers live canonically in a convention rather than in the
registry, because they bind more than this Story, and the requirement cites the
convention: `docs/architecture/security-conventions.md` SC-5 for the `10kb`
limit, SC-9 for the audit event, and `docs/architecture/architecture.md` AD-6 for
the two new error classes and the `413` mapping.

The heading is kept rather than deleted so a reader can tell a checked-and-clean
section from an unchecked one. The registry remains the source of truth; if an
entry there is reopened, this section is where it reappears.

Flagged for the gate, and not a registry entry because it is a choice this
document made rather than a question it could not answer:

- **`.env.example` and the four JWT variables.** FR-18 removes them on SC-3's
  basis: nothing this Story ships reads them, and a placeholder for a variable no
  code validates misdescribes what the application needs. This is a choice, not a
  deduction — SC-7 requires every required variable to be listed and does not
  forbid listing more, so it neither compels the removal nor forbids keeping
  them. Keeping them as forward-looking documentation is a legitimate
  alternative, and if the gate prefers it, FR-18's removal clause is what
  changes; the rest of FR-18 stands either way. **This item was carried to the
  gate at revision 13 and the gate's decision did not address it**, so it is
  carried again unchanged rather than treated as settled by silence.

One question flagged earlier is answered rather than carried forward, and is
recorded here so its absence is not read as a drop: whether `AGENTS.md`'s list
of security-relevant events was exhaustive.
`docs/architecture/security-conventions.md` SC-9 now names registration
explicitly among those events.

## Traceability

| AC id | Functional requirement(s) | Validation rule(s) | Security requirement(s) |
|---|---|---|---|
| AC-001 | FR-1, FR-2, FR-3, FR-4, FR-5, FR-10, FR-17 | VR-1, VR-2, VR-5 | SR-1, SR-2 |
| AC-002 | FR-6, FR-7 | VR-4 | SR-6 |
| AC-003 | FR-8 | VR-1, VR-2, VR-3 | SR-6 |
| AC-004 | FR-9 | VR-5, VR-6, VR-7, VR-8 | SR-3 |
| AC-005 | FR-10 | — (no boundary rule; enforced in the service and the model) | SR-1, SR-2, SR-3, SR-4 |
| AC-006 | FR-11 | — (no boundary rule; enforced by the response DTO) | SR-3, SR-4, SR-5, SR-6 |
| AC-007 | FR-12 | — (no boundary rule; enforced in the service and the logger) | SR-3, SR-6, SR-7 |

Three criteria have no Validation Rule because they constrain what the system
stores, returns, and logs rather than what it accepts — the dash records that the
row was checked, not that it was skipped. Every criterion maps to at least one
functional and one security requirement.

**Every criterion is now fully covered.** AC-007 was the exception through
revision 13: FR-12 stated that the audit event was distinct from request logging
without stating the mechanism, so no test could assert on it. FR-12 now names the
event's three fields and identifies the `event` name as what makes the line
distinct, which is what a test asserts against, and the emit's timing relative to
the commit is stated as well. No criterion is left conditionally covered.

AC-003's row lists only the rules whose failure is that criterion's own
condition — a malformed, missing, or over-long email. Normalization (VR-4) and
the rejection of an unknown body property (VR-9) are deliberately not in it:
neither is an email-format failure, and listing them would invite
`TEST_WRITING` to file an unknown-property test under AC-003. VR-9, VR-10 and
VR-11 belong to no single criterion; they govern the request envelope and the
error shape across all of them, and are traced through the Error Handling table
instead.

AC-004's row carries four rules, and they do not all work the same way. VR-5 and
VR-6 are what a test asserts against — the policy a submitted password must
satisfy. VR-7 bounds that policy by naming what it excludes, and VR-8 fixes
where the policy is written rather than what it accepts; neither runs as a
check, which is why FR-22 scopes the boundary middleware to VR-1…VR-6 and VR-9.
They are listed because they constrain the criterion's subject, not because a
test exercises them.

AC-001's fourth outcome, "the customer can authenticate later", is carried by
FR-17 and by FR-10, which FR-17 names as the whole of this Story's obligation
towards it.

SR-8, SR-9 and SR-10 map to no Acceptance Criterion either, for the same reason
and with the same authority: the rate limit's dependence on a trustworthy client
IP (SC-3, SC-5), the secrets and configuration boundary (SC-7, AD-7), and the
dependency-approval rule (SC-6). They constrain how this Story is built rather
than what a criterion observes.

FR-13…FR-16 and FR-18…FR-24 map to no Acceptance Criterion. They
are not additional scope: each is required by a project convention that this
Story is the first to satisfy — the rate-limit factory (SC-3), the hardening and
topology configuration (SC-5), the request-id correlation (AC-9), the generated
contract (AC-10), the currency of `.env.example` (SC-7), and the test-database
setup (PC-1), the process entry point (module-map.md), the domain-error taxonomy
(AD-6), the validation middleware (AD-5), the rate-limit factory's location
(module-map.md, FR-23) and the password-hashing helper (module-map.md, FR-24). FR-19 is the one that carries real weight: without it AC-002 and
AC-005 have no database to be tested against, so NFR-005 and NFR-006 cannot be
satisfied for this Story at all. They are recorded here so a reviewer can see
they were placed deliberately rather than smuggled in.
