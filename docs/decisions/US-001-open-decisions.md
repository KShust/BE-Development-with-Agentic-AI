---
artifact_type: open_decisions
story: US-001
version: 7
status: DRAFT
created_at: 2026-09-01T20:41:49Z
updated_at: 2026-09-02T13:06:49Z
produced_by: us-clarifier
inputs:
  - path: docs/stories/US-001-register-customer.md
    version: null
supersedes: null
---

# US-001 Open Decisions

Decisions a human must make before the affected stage can proceed without
inventing an answer. This Skill records them; it does not resolve them. They are
resolved at `HUMAN_SPEC_APPROVAL` (`docs/workflow/stage-map.yaml`), or earlier by
an explicit recorded human decision.

`status` values: `OPEN` | `RESOLVED`. A `RESOLVED` entry names the artifact or
recorded decision that answers it. `recommended` is advisory only and carries no
authority — an unresolved decision stays unresolved even when a recommendation
is stated.

Project-wide decisions (roles, lockout policy, account-state model, refresh-token
revocation storage, compliance scope) live in `AGENTS.md`. The entries below
reference them where US-001 collides with one; they do not restate or narrow
them.

**Revision history.** Nothing has ever been removed from this file and no id has
changed.

- **Revision 2 (2026-09-01).** OD-US-001-01 and OD-US-001-08 were resolved by a
  human decision taken in session; each names where the answer now lives
  canonically.
- **Revision 3 (2026-09-01).** OD-US-001-10 and OD-US-001-11 were added. Both
  were carried forward by `SPECIFICATION` from the version 1 specification
  review, and neither was covered by the clarification report.
- **Revision 4 (2026-09-02).** OD-US-001-02's first option was marked foreclosed
  by the already-resolved OD-US-001-01, which settles that a response body
  exists. Nothing was resolved: the entry stays `OPEN` between its two remaining
  options. Both specification reviews reported that a reader of this file saw an
  option list one entry wider than what was actually available.
- **Revision 7 (2026-09-02).** The preamble still closed with "two `RESOLVED`,
  ten `OPEN`", contradicting revision 6 four lines above it. Corrected; no entry
  changed.
- **Revision 6 (2026-09-02).** All ten remaining entries were resolved by a
  human at `HUMAN_SPEC_APPROVAL`. Every entry now carries its answer and, where
  the answer belongs to a convention rather than to this Story, the document it
  was written into. All twelve entries are `RESOLVED`; none was removed.
- **Revision 5 (2026-09-02).** OD-US-001-12 was added, raised by `SPEC_REVIEW`
  against specification v11. Like revisions 3 and 4 it was written outside a
  stage run, for the reason recorded below.

**Why revision 3 was written outside a stage run.** `docs/workflow/stage-map.yaml`
routes no `loop_back` to `CLARIFICATION` — the stage appears only in
`stage_order` and as `BACKLOG_SYNC.next`. So once the workflow leaves it, no
stage can add an entry to this file, and this Skill is its only permitted writer.
The two entries were therefore added by the owning Skill directly, as an artifact
repair rather than a stage transition; no workflow-state transition was recorded
for it. Revisions 4 and 5 were written the same way and for the same reason. Revision 6
was not: the resolutions it records were made by a human at
`HUMAN_SPEC_APPROVAL`, which is the stage the workflow designates for exactly
that. Twelve entries now exist, and all twelve are `RESOLVED`.

---

## OD-US-001-01 — Registration success status code

**Question.** Does `POST /api/v1/auth/register` return `201 Created` with a
`Location` header, or `200 OK`?

**Context.** `docs/architecture/api-conventions.md` AC-4 gives two rows that both
match this endpoint and disagree: `POST /collection` → `201 Created` with a
`Location` header and the created resource body, and `POST /auth/<action>` →
`200 OK`. Registration is literally both — a session action under `/auth/` by
path (AC-3 names `register` as one of the deliberate verb exceptions) and a
resource creation by effect. AC-4 also requires every endpoint to declare its
success status explicitly, so this cannot be left to whichever row is read first.
A `Location` header additionally implies a canonical URL for the created account;
the only candidate today is `/api/v1/users/me` (AC-3), which no Story has built
yet.

**Affects.** `API_DESIGN`, `IMPLEMENTATION`, `TEST_WRITING`,
`IMPLEMENTATION_VERIFICATION`.

**Options.**

1. `201 Created` with `Location: /api/v1/users/me` — treats registration as
   creation; points at an endpoint that does not exist until US-003.
2. `201 Created` with no `Location` header — creation semantics without
   promising a URL that is not yet served.
3. `200 OK` — follows the `/auth/<action>` row; loses the "something was
   created" signal.

**Resolution.** Option 2 — **`201 Created` with the created resource body and no
`Location` header.** Decided by a human on 2026-09-01.

Recorded canonically in `docs/architecture/api-conventions.md` AC-4, which now
names registration as the single exception to the `POST /auth/<action>` row and
carries the reasoning: `201` because a durable account is created, no `Location`
because `/api/v1/users/me` is not served until US-003 and a header pointing at a
`404` is worse than no header. `API_DESIGN` implements that section, not this
entry.

**Status.** RESOLVED

---

## OD-US-001-02 — Registration response body

**Question.** What does the success response body contain?

**Context.** AC-001 requires only "a success response is returned". AC-006
constrains the body negatively (no password, no hash, no other sensitive internal
field) but nothing states what it *does* carry. `architecture.md` AD-4 requires an
explicit response DTO rather than a persistence model leaking outward, so the
field list is part of the contract and must be decided before `API_DESIGN`, not
discovered while coding. `persistence-conventions.md` PC-8 also requires the
repository query to select only the fields the caller needs, so this choice
reaches the database layer. Any field chosen here is also a field US-003 must
keep returning.

**Affects.** `API_DESIGN`, `DB_DESIGN`, `IMPLEMENTATION`, `TEST_WRITING`.

**Constrained by a decision already taken.** OD-US-001-01 was resolved on
2026-09-01: `201 Created` **with the created resource body**
(`docs/architecture/api-conventions.md` AC-4). That settles that a body exists.
Only its field list is still open here, and an option that returns no body is no
longer available — choosing one would mean reopening OD-US-001-01, which needs a
new approved decision.

**Options.**

1. ~~Empty body.~~ **Foreclosed** by the resolution of OD-US-001-01. Kept in the
   list, struck through rather than deleted, so that the option set stays a
   record of what was considered.
2. `{ id }` only.
3. `{ id, email, role, createdAt }` — the non-sensitive projection of the
   created record.

**Recommended (non-binding).** Option 3, with `createdAt` serialized per AC-11
and `role` carrying the `CUSTOMER` value from `security-conventions.md` SC-2.

**Resolution.** Option 3 — **`{ id, email, role, createdAt }`**, the non-sensitive projection of the created record. Decided by a human on 2026-09-02 at
`HUMAN_SPEC_APPROVAL`.

`createdAt` is serialized per `api-conventions.md` AC-11 and `role` carries the `CUSTOMER` value from `security-conventions.md` SC-2. The repository selects exactly these fields (PC-8) and the response is built from an explicit DTO (AD-4). US-003 must keep returning them.

**Status.** RESOLVED

---

## OD-US-001-03 — Whether registration collects any field beyond email and password

**Question.** Does the registration request accept profile fields (for example a
name), and therefore does the `User` model carry them from its first migration?

**Context.** The Story says "register an account with my email and password" and
lists no other field, but the glossary defines `Profile` as an aspect of the same
`User` record, and US-003 / US-004 read and update it. US-001 creates the first
migration for `User`; whichever columns it omits, a later Story adds by its own
migration (`persistence-conventions.md` PC-2 — an applied migration is never
edited). This is not a question about registration's input alone: it decides the
initial shape of the table.

**Affects.** `API_DESIGN`, `DB_DESIGN`, `IMPLEMENTATION`, `TEST_WRITING`.

**Options.**

1. Email and password only. Profile columns arrive with US-003 / US-004 in their
   own migration.
2. Email, password, plus named profile fields collected at registration — each
   would need its own validation rules, which no approved document defines today.

**Recommended (non-binding).** Option 1 — `AGENTS.md` prohibits implementing
speculative features, and no approved artifact defines any profile field or its
validation.

**Resolution.** Option 1 — **email and password only**. Decided by a human on 2026-09-02 at
`HUMAN_SPEC_APPROVAL`.

Profile columns arrive with US-003 / US-004 in their own migration. No approved artifact defines a profile field or its validation, and `AGENTS.md` prohibits implementing speculative features.

**Status.** RESOLVED

---

## OD-US-001-04 — Maximum email length

**Question.** What is the maximum accepted email length?

**Context.** `persistence-conventions.md` PC-4 requires an explicit
`@db.VarChar(n)` on every bounded text column, and names `password_hash` (PC-10)
as the single exemption — so the email column must carry a number. The same bound
belongs in the Zod schema at the HTTP boundary (`architecture.md` AD-5), because a
value the database would reject must fail as a `400` validation error rather than
as a database error mapped to `500`. No project document states a length, and the
number is not derivable: it is a product choice about which addresses are
acceptable, not a fact about the stack.

**Affects.** `API_DESIGN`, `DB_DESIGN`, `IMPLEMENTATION`, `TEST_WRITING`.

**Options.**

1. `254` — the longest address SMTP can carry.
2. `320` — the theoretical local-part plus domain maximum.
3. A shorter product-chosen bound.

**Resolution.** Option 1 — **254**. Decided by a human on 2026-09-02 at
`HUMAN_SPEC_APPROVAL`.

The longest address SMTP can carry. A longer value could never receive mail, so an account created with one could not be recovered or confirmed later. The same bound applies at the Zod boundary and as `@db.VarChar(254)` on the column, so an over-long value fails as a `400` rather than as a database error.

**Status.** RESOLVED

---

## OD-US-001-05 — Whether US-001 persists an account-state column

**Question.** Does the first `User` migration include an account-state column
(and if so, of what type), or does it omit state entirely until a Story reads it?

**Context.** `docs/product/business-rules.md` BR-004 records that the set of
account states is undecided and instructs a Story that reads, sets, or branches
on state to raise the decision rather than invent an enum in a Prisma model.
`security-conventions.md` SC-2 sets the default on registration to enabled.
Registration never reads state, so BR-004 does not block US-001 — but US-001
still writes the first migration, and "create an enabled account" can be
satisfied either by a column set to enabled or by the absence of any state column
at all. Choosing a boolean now would pre-empt the project-wide account-state
decision in `AGENTS.md`; omitting it makes US-002 add the column.

**Affects.** `DB_DESIGN`, `IMPLEMENTATION`.

**Options.**

1. No state column in US-001. Existence of the row is the whole account state;
   US-002 — which must reject disabled accounts (BR-004) — adds the column under
   the resolved project-wide decision.
2. A non-null boolean defaulting to enabled, accepted as provisional and migrated
   if the project-wide decision later chooses an enum.

**Note.** Option 2 narrows the project-wide decision in `AGENTS.md`, so it needs
that decision resolved or an explicit human statement that a boolean now is
acceptable.

**Resolution.** Option 1 — **no account-state column in this Story's migration**. Decided by a human on 2026-09-02 at
`HUMAN_SPEC_APPROVAL`.

The existence of the row is the whole account state for registration. US-002, which must reject disabled accounts (BR-004), adds the column under the resolved project-wide account-state decision. Choosing a boolean now would pre-empt that decision and cost a migration if it resolves to an enum.

**Status.** RESOLVED

---

## OD-US-001-06 — Content of the registration audit event

**Question.** Which fields does the AC-007 audit event carry, and what makes it
"distinct from general request logging"?

**Context.** AC-007 requires a successful registration to be logged for security
audit, distinct from request logging, without the password.
`security-conventions.md` SC-9 confirms registration is a security-relevant event
and gives the authoritative list of what may never appear in a log line — but it
does not say what a registration audit line must contain, and it records audit
retention and storage location as a project-wide Open Decision. Two candidate
fields are personal data: the email address and the client IP. Regulatory scope
(GDPR or otherwise) is explicitly undecided
(`docs/product/non-functional-requirements.md` NFR-011), so neither can be
included on the assumption that it is fine, nor excluded on the assumption that it
is not. "Distinct" also needs a mechanism: a dedicated `event` field on the Pino
line, a separate child logger, or a separate destination.

**Affects.** `SPECIFICATION`, `IMPLEMENTATION`, `SECURITY_REVIEW`,
`TEST_WRITING`.

**Options.**

1. `{ event: "user.registered", userId, requestId }` — no personal data; the
   email stays recoverable from the database via `userId`.
2. As above, plus `email`.
3. As above, plus `email` and client IP.

**Recommended (non-binding).** Option 1, the only choice that does not depend on
the unresolved compliance scope.

**Resolution.** Option 1 — **no personal data**: `{ event: "user.registered", userId, requestId }`. Decided by a human on 2026-09-02 at
`HUMAN_SPEC_APPROVAL`.

Neither the email address nor the client IP is logged. The email stays recoverable from the database via `userId` when an investigation needs it, and the `event` field is what makes the line distinct from general request logging. This is the only option that does not depend on the compliance scope, which `non-functional-requirements.md` NFR-011 leaves undecided. Recorded canonically in `docs/architecture/security-conventions.md` SC-9.

**Status.** RESOLVED

---

## OD-US-001-07 — JSON request body size limit

**Question.** What byte limit is configured on `express.json()`?

**Context.** `api-conventions.md` AC-2 requires an explicit request body size
limit and a `413` when it is exceeded; `security-conventions.md` SC-5 repeats that
unlimited payloads are not accepted. Neither states the value, and the library
default is not a decision — SC-1 makes exactly that argument about library
defaults for the Argon2 parameters. US-001 creates `src/app.ts`, so it is the
Story that must set the value, and the value applies to every later endpoint.

**Affects.** `API_DESIGN` (documenting `413`), `IMPLEMENTATION`, `TEST_WRITING`.

**Options.**

1. A small explicit limit sized to the registration body (for example `10kb`).
2. A larger project-wide limit chosen in anticipation of later endpoints.

**Resolution.** Option 1 — **`10kb`**. Decided by a human on 2026-09-02 at
`HUMAN_SPEC_APPROVAL`.

The registration body is two short fields. A tight limit is the cheapest reduction of denial-of-service surface on an unauthenticated endpoint, and raising it later is easier than lowering one clients already rely on. Recorded canonically in `docs/architecture/security-conventions.md` SC-5.

**Status.** RESOLVED

---

## OD-US-001-08 — `trust proxy` topology and CORS allow-list for US-001

**Question.** What `trust proxy` value does the application run with, and which
origins does `CORS_ALLOWED_ORIGINS` contain?

**Context.** The register rate limit is per IP (`security-conventions.md` SC-3,
decided: 10 per hour per IP). Behind a proxy, the client IP `express-rate-limit`
sees comes from `trust proxy`, and SC-5 forbids a blanket `trust proxy: true`
precisely because it lets a client spoof that IP and defeat the limit. So the
protection AC-002 depends on cannot be implemented correctly without knowing the
real proxy topology — and `AGENTS.md` records environment topology, including how
`trust proxy` and the CORS allow-list differ per environment, as an unresolved
project-wide Open Decision. US-001 creates `src/app.ts` and is therefore the first
Story that must configure both.

**Affects.** `IMPLEMENTATION`, `SECURITY_REVIEW`, `IMPLEMENTATION_VERIFICATION`.

**Options.**

1. Resolve the project-wide environment-topology decision first, then implement
   the configured value.
2. Record an explicit interim topology for US-001 only — for example: no proxy in
   front of the application, `trust proxy` left disabled — to be revisited when
   the project-wide decision lands.

**Resolution.** Option 1 — the project-wide decision was taken rather than
deferred. Decided by a human on 2026-09-01: two environments (local and
production, no staging); production behind exactly one reverse proxy, so
`TRUST_PROXY=1` there and `0` locally and in CI; `CORS_ALLOWED_ORIGINS` holds the
local origin only, because no browser client exists yet, and the Story that first
connects one adds the real origins.

Recorded canonically in `docs/architecture/security-conventions.md` SC-5
("Environment topology — decided"), with the reasoning for a hop count rather
than `trust proxy: true`. The corresponding entry was removed from the `AGENTS.md`
Open Decisions list, and `.env.example` now states both values. `IMPLEMENTATION`
reads SC-5, not this entry.

**Status.** RESOLVED

---

## OD-US-001-09 — Whether validation errors return `details.fieldErrors`

**Question.** Does a `400` from registration populate
`details.fieldErrors.<field>`, or return an empty `details` object?

**Context.** `api-conventions.md` AC-6 makes `details` optional and describes the
`fieldErrors` shape as something a validation failure "may" populate;
`security-conventions.md` SC-1 likewise says `details.fieldErrors.password` "may"
name which rule failed. "May" is not a contract: the OpenAPI document generated
from the Zod schemas (AC-10) either describes this shape or it does not, and the
AC-003 / AC-004 tests assert on whichever is chosen. A field-level message for the
password must also never echo the submitted value (SC-9).

**Affects.** `API_DESIGN`, `IMPLEMENTATION`, `TEST_WRITING`.

**Options.**

1. Populate `details.fieldErrors` for every validation failure, password rules
   included, never echoing the submitted value.
2. Return an empty `details` object and carry the whole explanation in `message`.

**Recommended (non-binding).** Option 1 — the shape AC-6 already documents, and a
registration form cannot show a per-field error without it.

**Resolution.** Option 1 — **populate `details.fieldErrors`** on every validation failure. Decided by a human on 2026-09-02 at
`HUMAN_SPEC_APPROVAL`.

Including which password rule failed, and never echoing the submitted value (SC-1, SC-9). This is the shape `api-conventions.md` AC-6 already documents, and a registration form cannot show a per-field error without it.

**Status.** RESOLVED

---

## OD-US-001-10 — Whether the submitted email is trimmed of surrounding whitespace

**Question.** Is leading and trailing whitespace stripped from the submitted
email before format validation and before the uniqueness comparison?

**Context.** `docs/product/business-rules.md` BR-002 decides one half of email
normalization — lowercasing before storing or comparing — and is silent on the
other half. The two halves are not separable in effect: if `"user@example.com "`
is neither trimmed nor rejected, it either fails format validation for a reason a
customer cannot see, or is stored as a distinct value, and a second account then
exists differing from the first by one space. That would defeat BR-001 without
violating it, because the uniqueness constraint would see two different strings.

Raised at `SPECIFICATION`, not at `CLARIFICATION`: it is carried forward from
finding MEC-2 of the version 1 specification review, which the clarification
report did not cover. Recorded here by its owning Skill so the registry and the
specification agree — no stage after `CLARIFICATION` can add an entry, since
`docs/workflow/stage-map.yaml` routes no loop-back to that stage.

**Affects.** `API_DESIGN`, `DB_DESIGN`, `IMPLEMENTATION`, `TEST_WRITING`.

**Options.**

1. Trim, then lowercase, before both format validation and the uniqueness
   comparison — the stored value is the normalized one.
2. Reject any email carrying surrounding whitespace as a validation error, so
   normalization never has to be reasoned about downstream.
3. Neither: accept the value as submitted. This is the option that allows two
   accounts to differ by a space; it is listed for completeness, not as a
   candidate.

**Resolution.** Option 1 — **trim, then lowercase**, before format validation and before the uniqueness comparison; the normalized value is what is stored. Decided by a human on 2026-09-02 at
`HUMAN_SPEC_APPROVAL`.

Accepting the value as submitted would let two accounts differ by a single space, satisfying the `@unique` constraint while defeating BR-001 in substance.

**Status.** RESOLVED

---

## OD-US-001-11 — Atomicity of the audit event relative to account creation

**Question.** Does the registration audit event participate in the same
transaction as the account write, is it best-effort after the commit, or must it
be atomic with it — and what is the behavior when it fails after the account row
already exists?

**Context.** AC-007 requires the event; nothing states its relationship to the
account write. `docs/architecture/persistence-conventions.md` PC-9 fixes the
transaction boundary for the account write itself and says nothing about a log
line, which is not a database write at all. The two failure directions are not
symmetric: an account created with no audit trail is a security-record gap, while
an audit line for an account that was never created is a false record. Whether
either is tolerable is a policy question, and audit retention and storage are
themselves an unresolved project-wide Open Decision in `AGENTS.md`.

Raised at `SPECIFICATION`, carried forward from finding MEC-1 of the version 1
specification review. Same recording note as OD-US-001-10.

**Affects.** `IMPLEMENTATION_PLANNING`, `IMPLEMENTATION`, `SECURITY_REVIEW`,
`TEST_WRITING`.

**Options.**

1. Best-effort after the commit: the account is created, and a failed audit write
   is itself logged as an error but does not fail the request.
2. Emitted inside the transaction boundary, so a failed audit write rolls the
   account back and the customer is told registration failed.
3. Account creation and audit write both required, with a documented
   reconciliation path when they diverge.

**Resolution.** Option 1 — **best-effort after the commit**. Decided by a human on 2026-09-02 at
`HUMAN_SPEC_APPROVAL`.

The account is created, the event is emitted after the transaction commits, and a failed audit write is itself logged as an error without failing the request. A customer does not lose a registration because a log sink was unavailable. Recorded canonically in `docs/architecture/security-conventions.md` SC-9.

**Status.** RESOLVED

---

## OD-US-001-12 — What carries `415`, `413` and a malformed-JSON `400` to the error middleware

**Question.** The centralized error middleware is the only place errors become
HTTP responses. Three of this Story's statuses are produced by neither of the two
things that middleware is specified to recognize. What carries them?

**Context.** `docs/architecture/architecture.md` AD-6 decided the domain-error
taxonomy on 2026-09-01: an abstract `DomainError` plus `ValidationError`,
`UnauthorizedError`, `ForbiddenError`, `NotFoundError` and `ConflictError`. Its
handler mapping names "unsupported media type → `415`" but **no class in the
taxonomy carries that semantic**, and `413` is not mentioned in AD-6 at all.
Meanwhile the `415` is raised by the boundary middleware's `Content-Type` check
(specification FR-22), and the `413` and the malformed-JSON `400` are raised by
`express.json()` as its own library errors. None of the three is a `ZodError` or
a `DomainError`, so an error middleware that maps only those two returns a
generic `500` for all three — the specification would require three statuses and
describe a component that cannot produce them.

This is not a question the specification may answer. AD-6 states that "a new
subclass requires a new failure semantic the table below does not already
cover", and the taxonomy itself was a recorded human decision; adding to it is
another one.

**Affects.** `API_DESIGN`, `IMPLEMENTATION`, `TEST_WRITING`,
`IMPLEMENTATION_VERIFICATION`, `SECURITY_REVIEW`.

**Options.**

1. Extend the AD-6 taxonomy with the missing semantics — an
   `UnsupportedMediaTypeError` and a `PayloadTooLargeError` — thrown by the
   boundary middleware and by a wrapper around `express.json()`. Consistent with
   AD-6's "one subclass per failure semantic", and it changes a convention
   document.
2. Have the error middleware additionally recognize `express.json()`'s own
   errors by their `type`/`status` properties, and have the boundary middleware
   throw an existing class. No new subclass, but the middleware then recognizes a
   third category AD-6 does not describe.
3. Something else the team prefers; whichever is chosen, AD-6's mapping list and
   the taxonomy must end up agreeing, since today they do not.

**Note.** This entry exists because AD-6 has an internal gap, not because the
Story is unusual: any Story with a request body meets it. Resolving it likely
means amending AD-6 rather than only answering for US-001.

**Resolution.** Option 1 — **extend the AD-6 taxonomy** with `UnsupportedMediaTypeError` and `PayloadTooLargeError`. Decided by a human on 2026-09-02 at
`HUMAN_SPEC_APPROVAL`.

Both are new failure semantics the existing five subclasses do not cover, which is exactly the condition AD-6 sets for adding one. It also closes AD-6's own internal gap: its handler mapping already named `415` with no class to carry it, and never mentioned `413` at all. Recorded canonically in `docs/architecture/architecture.md` AD-6, whose taxonomy and mapping table both change.

**Status.** RESOLVED
