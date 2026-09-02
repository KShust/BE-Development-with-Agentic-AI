---
artifact_type: design_review
story: US-001
version: 1
status: APPROVED
created_at: 2026-09-02T17:06:05Z
updated_at: 2026-09-02T17:06:05Z
produced_by: design-reviewer
inputs:
  - path: docs/specifications/US-001-spec.md
    version: 14
  - path: docs/designs/api/US-001-api-design.md
    version: 1
  - path: docs/designs/api/US-001-openapi.yaml
    version: 1
  - path: docs/designs/database/US-001-db-design.md
    version: 1
  - path: docs/designs/database/US-001-entity-model.md
    version: 1
  - path: docs/decisions/US-001-open-decisions.md
    version: 7
  - path: docs/reviews/specifications/US-001-spec-review.md
    version: 11
  - path: docs/stories/US-001-register-customer.md
    version: null
supersedes: null
critical_findings: 0
major_findings: 2
minor_findings: 3
---

# Design Review: Customer Registration (US-001)

## Summary

Both designs were reviewed in one pass. The **database design is sound** and is
accepted as it stands: the model, its constraints, its indexes, its access paths,
its transaction and race behavior, and its sensitive-data rules all trace to a
requirement or a convention, and the one judgement it deliberately submitted for
disagreement is endorsed below.

The **API contract is materially complete but has two holes of the same family**,
and that family is the one this Story has already paid for once. `OD-US-001-12`
existed because a status the contract declares (`415`, `413`, the malformed-JSON
`400`) had no component that could produce it inside the architecture, so an
error middleware recognizing only `ZodError` and `DomainError` would have
returned `500`. The design closed that for three statuses and named the owner for
the translation — good work, and it is why `m-1` is genuinely discharged. The
same question was not asked of the **`429`**, and a second, narrower case of the
same shape survives in the **`400`**.

Neither is a defect of judgement. Both are cases where the contract states an
obligation that no approved artifact gives anything the power to meet, which
means the implementation must invent the answer — and `api-conventions.md` AC-6
says an invented code is a finding, precisely because renaming one later is a
breaking change.

Verdict: **CHANGES_REQUIRED**, loop-back to `API_DESIGN`. The database design
needs no revision and should be carried forward unchanged.

## Reviewed artifacts

| Artifact | Path | Version | Status |
|---|---|---|---|
| Specification | `docs/specifications/US-001-spec.md` | 14 | APPROVED |
| Specification review | `docs/reviews/specifications/US-001-spec-review.md` | 11 | APPROVED |
| API design | `docs/designs/api/US-001-api-design.md` | 1 | DRAFT |
| OpenAPI contract | `docs/designs/api/US-001-openapi.yaml` | 1 (`info.version: '1'`) | DRAFT (paired) |
| Database design | `docs/designs/database/US-001-db-design.md` | 1 | DRAFT |
| Entity model | `docs/designs/database/US-001-entity-model.md` | 1 | DRAFT |
| Open decisions | `docs/decisions/US-001-open-decisions.md` | 7 | DRAFT — all 12 entries `RESOLVED` |

Preconditions checked: the specification review verdict is `PASS`;
`HUMAN_SPEC_APPROVAL` was recorded on 2026-09-02 by `human:KShust`; neither
design area was marked `NOT_APPLICABLE`, so both were reviewed; no Open Decision
in the registry is open, and no `TODO`/`TBD`/`FIXME`/`???` marker appears in the
approved Specification.

Evidence gathered by running rather than by reading, because two findings turn on
what the installed libraries actually do:

- `node_modules/express-rate-limit/dist/index.cjs` — the default `handler`
  (line ~848) calls `response.send(message)` with the string
  `"Too many requests, please try again later."` and never calls `next`.
- `node_modules/body-parser/lib/types/json.js` — in `strict` mode (the default)
  a body is accepted when its first character is `{` **or `[`**, so a JSON array
  reaches the schema.
- `package.json` / `node_modules` — `@prisma/adapter-pg@7.10.0` is present, with
  `pg` as its own dependency rather than a peer.

## API design review

### What is correct

- **Operation.** `POST /api/v1/auth/register`, public, `application/json`
  required on a request with a body. AC-1 (URI versioning), AC-3 (the `/auth/`
  verb exception), AC-2 (media type). FR-1.
- **Success.** `201 Created`, created-resource body, no `Location` header —
  exactly AC-4's recorded "Registration — decided", carried without
  reinterpretation. FR-5.
- **Public with no security scheme at all.** SC-4 is deny-by-default and
  requires the approved API design to list a public endpoint explicitly; the
  operation table and the operation `description` are that listing. Declining to
  declare a bearer scheme document-wide is right: BR-4 puts tokens out of scope,
  and a JWT scheme in the contract of a Story that issues no JWT would be a
  speculative contract element.
- **Response DTO.** Exactly the four fields FR-5 names, `additionalProperties:
  false`, `role` as `const: CUSTOMER` (SC-2), `createdAt` as `date-time`
  (AC-11, PC-6), `id` as `string`/`format: uuid` (AC-11, PC-3). No credential
  field appears in any response schema, and `password` carries `writeOnly: true`
  — the contract form of SR-3. AC-006 is expressed as a contract obligation
  rather than as a promise about a mapper.
- **Error body.** Every error response is AC-6's single shape. Codes are assigned
  where the Specification left them to this stage, and `EMAIL_ALREADY_REGISTERED`
  is carried as already-decided rather than reassigned (AC-6, BR-009, BR-3).
- **The two-shape `400`.** `oneOf` over `ValidationErrorResponse` and
  `MalformedJsonErrorResponse`, made mutually exclusive by the `const` on `code`,
  with `details` omitted rather than sent empty on the malformed-JSON branch
  (AC-11). This is correct, and the reasoning for one `VALIDATION_FAILED` code
  across five schema-failure cases is sound: AD-6 maps them all through a single
  `ZodError` branch that offers no throw site at which a per-case code could be
  supplied, and `details.fieldErrors` is what a form actually needs.
- **`m-1` is discharged.** The application-level middleware chain immediately
  after the JSON body parser is named as the owner of translating the parser's
  errors, and the centralized error middleware is correctly ruled out — AD-6
  defines it as mapping `ZodError` and `DomainError`, and teaching it to sniff
  library error objects would give it a third category. The filename is left to
  `IMPLEMENTATION_PLANNING`, which is the correct line.
- **`m-4` is discharged.** `id` is stated as `string`/`format: uuid`, cited to
  AC-11 and PC-3.
- **The unknown-property `fieldErrors` note is a real catch.** Zod reports an
  unrecognized key at the object root, so default flattening leaves
  `fieldErrors` empty; the contract keys the case by the offending property name
  and the design says the implementation must map the issue's own key list.
  Without that note VR-11 would have been broken silently.
- **No `example` values.** Correct under AC-10: every example here would have to
  be mirrored in an `.openapi()` call to stay in agreement with the generated
  document, for no contract value.
- **Contract-source obligations.** Verified against
  `scripts/generate-openapi.ts`: it emits no `servers` entry and takes the full
  `/api/v1` path from the registration, uses `OpenApiGeneratorV31`, and reads
  `info.version` from `package.json` — so the design's statement that
  `info.version` differs by design is accurate, and the comparison of the two
  documents is semantic and belongs to this stage and to
  `IMPLEMENTATION_VERIFICATION`, as the design says.

### What is missing

Two declared responses have no producible body. Both are recorded as findings
`d-1` and `d-2`.

### One ordering obligation, recorded not filed as a finding

`X-Request-Id` is declared `required: true` on **every** response, the `429`
included. That is satisfiable, but only if the request-id middleware is mounted
ahead of the rate limiter in `src/app.ts`, because the limiter short-circuits.
The Specification already places both in the app assembly (FR-15, FR-23), so
nothing here is undecided — it is noted so `IMPLEMENTATION_PLANNING` orders them
deliberately rather than discovering the constraint from a failing test.

## Database design review

### Model, constraints, indexes

Accepted in full. Each column declares its type, its nullability and its
constraint explicitly; nothing is left to a Prisma or PostgreSQL default (PC-4).

- `email varchar(254) NOT NULL UNIQUE` — the same number as the boundary bound,
  which is what VR-3 requires so an over-long address fails as a `400` rather
  than as a database error (EC-8).
- `password_hash text NOT NULL`, deliberately unbounded — PC-10's named
  exemption, taken with its stated reason and no other exemption taken with it.
- `role` as a one-value `Role` enum defaulting to `CUSTOMER` — SC-2, BR-006, and
  no second value added on a later Story's behalf.
- `created_at` / `updated_at` as `timestamptz(3)` — the annotation is load-bearing,
  not decoration, because Prisma's default `DateTime` mapping on PostgreSQL is
  `timestamp(3)` *without* a zone, which would violate PC-6 while the schema
  still looked right. Millisecond precision matches AC-11's serialization to the
  digit.
- Indexes: the primary key and the unique index that comes with the `email`
  constraint, and nothing else. PC-7 is satisfied — `email` is the only filtered
  column and it already has an index — and the rule against adding a duplicate
  index over a `@unique` is respected.

`id` as a native `@db.Uuid` rather than an implicit `text` column is a deviation
from PC-3's literal wording and is **endorsed**: PC-3 fixes the *strategy*
(`String @id @default(uuid())`, which is unchanged and still surfaces to
application code as a string) and leaves the storage type open, while PC-4
requires an explicit type for every bounded text column. `@db.Uuid` is that
explicit type. The design's note that `@default(uuid())` generates client-side
and produces **no database-level default** is exactly the sort of thing a
migration file will not say, and it is right to have written it down.

### Access paths, transaction, and the race

This is the strongest part of either design. The two queries live in
`users.repository.ts` because `users` owns the record (BR-6, AD-2, module-map's
cross-module rule), both take an optional transactional client and neither opens
its own transaction (PC-9), and neither selects `password_hash` — so SR-4 is
structural rather than a promise about a downstream mapper (PC-8).

The design states plainly what a weaker one would have left implicit: under
READ COMMITTED the transaction does **not** prevent the duplicate race, which is
why BR-1 requires the constraint *and* the check, and why the `P2002` violation
must be caught where Prisma is visible and converted into the same
`ConflictError('EMAIL_ALREADY_REGISTERED')` the service check produces. It names
both failure modes of getting that wrong — a Prisma error reaching AD-6's
middleware as an unmapped `500`, and SC-9-listed text reaching a body or a log
line. Declining to raise the isolation level, with the reason, is the right call.

### Sensitive data

`password_hash` and `email` are both classified with handling rules. The
entity model's insistence that the email never enters an audit line matches
SC-9's decided event content and FR-12, and the recoverability argument
(`userId` reaches the address when an investigation needs it) is the reason the
choice does not depend on the undecided compliance scope in NFR-011.

### Migration intent

One additive migration: `CREATE TYPE`, `CREATE TABLE "user"` with the six
columns and their defaults, the primary key, and the unique constraint with its
index. Nothing dropped or narrowed, so PC-2's destructive-migration rule and
SC-8's recorded-decision requirement correctly do not apply. PC-2's requirement
that the model change and the migration intent agree is met — I checked them
against each other row by row.

### The CHECK constraint the design declined to specify — endorsed

The design invited disagreement on not specifying
`CHECK (email = lower(btrim(email)))`. **I agree with the judgement, and record
the agreement so the question is not reopened as a fresh idea downstream.**

PC-4's rule that a business invariant expressible as a database constraint is
expressed as one is real, but PC-2 makes `prisma/schema.prisma` the source of
truth for the data model, and Prisma's schema language cannot express a `CHECK`.
Adding one means raw SQL inside the migration that the schema does not describe
— so the next `prisma migrate dev` reconciles against a model that does not know
the constraint exists. That is a durable divergence traded for a defense against
a writer that does not exist: every write path in this Story goes through the
normalizing boundary, and a future raw-SQL writer is exactly the case a Story
would have to design for on its own terms. No requirement asks for it.

## Cross-model consistency

Checked in both directions.

**Contract against persistence:**

| Contract element | Persistence counterpart | Agrees |
|---|---|---|
| `RegisterRequest.email` `maxLength: 254` | `email varchar(254)` | Yes — the same number, which is the point of VR-3 |
| `RegisterRequest.password` | no column; reaches `password_hash` only as a digest | Yes (SR-3) |
| `RegisterResponse.id` `string`/`uuid` | `id uuid`, Prisma surfaces a string | Yes |
| `RegisterResponse.email` (normalized) | the stored value is the normalized one | Yes — the constraint compares what the application compared (BR-2, VR-4) |
| `RegisterResponse.role` `const: CUSTOMER` | enum `Role` with one member, default `CUSTOMER` | Yes |
| `RegisterResponse.createdAt` ISO 8601 UTC | `created_at timestamptz(3)` | Yes (PC-6, AC-11) |
| `409 EMAIL_ALREADY_REGISTERED` | unique constraint + service check, `P2002` translated to the same error | Yes — the two paths are indistinguishable to a client, as EC-3 requires |
| no field for `password_hash` | never selected on this path | Yes (PC-8, SR-4) |

**Persistence against contract:** every attribute is accounted for. `updatedAt`
is the only column with no contract surface, and the entity model says so
explicitly and names PC-6 as the reason it exists — the right way to carry a
convention-driven attribute.

Uniqueness is enforced at both levels required by BR-1, and normalization is
applied before both the comparison and the write, so the two levels agree about
what "the same email" means. No design introduces a business decision the
Specification does not carry: the four exclusions in the entity model's
"Deliberately absent" table each cite FR-4, VR-9, the Story's Out of Scope, or
BR-4.

## Security review of the designs

Against `security-conventions.md` only; the implementation review is
`security-reviewer`'s.

- **SC-1** — the policy is referenced, never re-encoded. The contract carries the
  two lengths because a client needs them to build a form, and deliberately does
  **not** encode the 3-of-4 class rule as a `pattern`. Correct: VR-8 places the
  single expression in the module's Zod schema, and a regular expression here
  would be a second authority that can drift, over a rule about Unicode code
  points that a `pattern` keyword expresses badly.
- **SC-2** — `CUSTOMER` only; no role and no permission model added.
- **SC-3** — the duplicate path short-circuits without hashing, and the contract
  states it. This is the decided behavior, not an oversight; equalizing timing
  here is forbidden without a new decision.
- **SC-4** — the public endpoint is explicitly listed in an approved design, as
  deny-by-default requires.
- **SC-9** — no response schema can carry anything from the authoritative list.
  The `409` description forbids Prisma text, error codes and constraint names by
  name; the `500` is generic; `message` is constrained rather than fixed, so it
  can change without a version bump. `writeOnly` on `password` and the closed
  response object are the two structural guarantees.
- **PC-10 / SR-4** — the hash is unreturnable by construction: it is not in any
  response schema and is not selected by either query.

No design element weakens a security convention, and none invents one.

## Findings

| id | Severity | Area | Summary |
|---|---|---|---|
| d-1 | Major | API | The declared `429` has no component that can produce its AC-6 body |
| d-2 | Major | API | A JSON array body produces a `400` whose `details.fieldErrors` cannot name a field |
| d-3 | Minor | database | The driver-adapter finding is stale — the dependency was approved and added |
| d-4 | Minor | API | The `email` constraints describe the normalized value; generator drift is unassessed |
| d-5 | Minor | API | `minLength: 1` on `email` is redundant beside `format: email` |

---

### d-1 — Major (API). The `429` has no carrier, and its default body violates AC-6

**Evidence.** `docs/designs/api/US-001-openapi.yaml` declares a `429` response
whose body is `RateLimitErrorResponse` with `code` `const: RATE_LIMIT_EXCEEDED`,
and `docs/designs/api/US-001-api-design.md` assigns that code in the "Assigned
codes" table. Nothing in either document, or in the Specification, names what
produces that body.

Three approved statements close the gap around it with nothing inside:

1. The Specification's Error Handling preamble: *"Error-to-HTTP mapping happens
   only in the centralized error middleware"* — and the `429` is a row in that
   table.
2. `architecture.md` AD-6 lists the taxonomy and the handler's mapping. Neither
   contains a "too many requests" semantic: the subclasses are `ValidationError`,
   `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`,
   `UnsupportedMediaTypeError`, `PayloadTooLargeError`, and the mapping list runs
   `400, 401, 403, 404, 409, 415, 413, 500`. FR-21 fixes the four classes US-001
   creates and states that the other three are not created.
3. `express-rate-limit` does not participate. Verified in the installed
   `8.x` build: the default `handler` sets the status and calls
   `response.send("Too many requests, please try again later.")`, and never calls
   `next`. So by default the endpoint answers a `429` with a plain string, which
   is not AC-6's body and does not carry `RATE_LIMIT_EXCEEDED`.

**Why this is the same defect `OD-US-001-12` was raised about.** That decision
existed because `415` and `413` were produced outside the two categories the
error middleware recognizes, so a class had to be added to carry each. The `429`
is produced outside them too — by a third-party middleware that writes the
response itself — and no class was added. The Specification's own Error Handling
note says an error middleware recognizing only `ZodError` and `DomainError`
"would have returned `500` for all three"; for the `429` the failure is quieter
but not smaller: the status is right and the **body is wrong**, which an
integration test asserting AC-6 will catch and an eyeball will not.

**Why it belongs to `API_DESIGN` and not to the implementer.** AC-6 states that a
code invented while coding is a finding. The code is already assigned here; what
is missing is the statement of what carries it — and this design has already
established that naming such an owner is within its remit, in the section that
closes `m-1`. Leaving it open asks `IMPLEMENTATION` to choose between two
options with different architectural consequences, which is not its choice to
make.

**Required correction.** State in `US-001-api-design.md` which component produces
the `429` body, in the same form as the `m-1` paragraph — a layer and an
obligation, not a filename. Two resolutions are available and the design must
pick one:

- **(a) The limiter's `handler` hands off to the centralized error middleware**
  by calling `next(...)` with a domain error. This keeps AD-6's "single place
  that maps errors to HTTP responses" intact, but it needs a carrier class with
  a "too many requests" semantic, which the AD-6 taxonomy does not have. Adding
  one is an **amendment to AD-6**, which `API_DESIGN` may not make: AD-6's list
  was last extended by a recorded human decision at this Story's specification
  gate. If (a) is chosen, record it as a finding for `HUMAN_PLAN_APPROVAL` and do
  not create the class in the contract.
- **(b) The rate-limit middleware emits the AC-6 body itself**, via a configured
  `handler`. No new class and no convention amendment: AC-12's prohibition names
  controllers and routes, and a limiter that short-circuits is not "mapping an
  error" so much as declining to run the stack. The cost is a second place in the
  codebase that constructs an error body, which the design should acknowledge in
  writing rather than leave for a reviewer to notice.

Either way the contract itself is unchanged — the `429`, its code and its body
are already declared correctly. What changes is one paragraph of the design
notes, plus a finding for the gate if (a) is chosen.

---

### d-2 — Major (API). A JSON array body yields a `400` that cannot satisfy VR-11

**Evidence.** `express.json()` in its default `strict` mode accepts a body whose
first character is `{` **or `[`** — verified in the installed
`body-parser/lib/types/json.js`. So a request with
`Content-Type: application/json` and a body of `[]` is parsed successfully and
reaches the Zod object schema, which fails it at the object root with an
`invalid_type` issue carrying an empty path.

That is the identical mechanism the design correctly identified for unknown
properties: an issue whose path is the root cannot key `details.fieldErrors`. But
here there is no offending property name to fall back on, so there is nothing to
key it by at all. The result is `"details": {"fieldErrors": {}}`, and:

- **VR-11** requires every validation failure to populate `details.fieldErrors`,
  "naming the field that failed" — no field can be named;
- the design's own text states that `ValidationErrorResponse`'s
  `details.fieldErrors` is *"always present and never empty"* — this response
  contradicts it;
- the JSON Schema, notably, **does** accept it: `FieldErrors` constrains
  `additionalProperties` but sets no `minProperties`, so an empty object
  validates. The contract and its prose disagree with each other, which is the
  worse failure of the two, because the schema will not catch it.

**Why it matters beyond the edge case.** The remedy is small, but leaving it
unstated means the implementation invents one — an empty `fieldErrors` that
breaks VR-11, a `formErrors` member that widens AC-6's error body, or a
`MALFORMED_JSON` code applied to a body that parsed perfectly well. The design
already rejected the `formErrors` option for the unknown-property case, on the
grounds that AC-6 documents `fieldErrors` and nothing else; that reasoning
applies here and should be applied here explicitly rather than by inference.

**Required correction.** State in `US-001-api-design.md` which of the declared
`400` branches covers a syntactically valid but non-object body, and how its
`details` is populated. Whatever is chosen, make the contract and the prose agree
— if `fieldErrors` may be absent or empty for this case, the schema and the
"always present and never empty" sentence must both say so.

---

### d-3 — Minor (database). The driver-adapter finding is stale and must not reach the gate as open

**Evidence.** `US-001-db-design.md` finding 1 states that `@prisma/adapter-pg`
and its `pg` driver are *"not in `package.json` and not in `node_modules`" —
verified*, calls the addition an unapproved new dependency under SC-6/SR-10, and
routes the decision to `HUMAN_PLAN_APPROVAL`, concluding that "US-001 cannot be
implemented until it is approved".

That was true when the design was written (committed in `f6d66e4`, 18:54 local).
It is no longer true. Commit `0339b4a` (18:58 local, author `KShust`) adds
`@prisma/adapter-pg` pinned to `7.10.0`, and its message records the SC-6
approval explicitly — the human, the date, the stated reason, the note that `pg`
and `@types/pg` arrive transitively because the adapter declares them as its own
dependencies rather than peers, and the checks that were run. I confirmed the
package is installed and that its dependency list matches that account.

The finding's **technical content remains correct and valuable** — Prisma 7's
`PrismaClientOptions` really is a two-shape union requiring an adapter, and
`src/lib/prisma.ts` really does depend on it. Only its status changed: it is a
resolved dependency decision, not an open one.

**Required correction: none, and deliberately none.** Correcting it means
revising and superseding a design whose model, constraints and access paths are
all sound, to restate a fact that one command confirms. It is recorded here
instead, and this review is the artifact `IMPACT_ANALYSIS` and
`IMPLEMENTATION_PLANNING` read alongside the design.

**What must happen instead:** `IMPLEMENTATION_PLANNING` must **not** carry the
adapter to `HUMAN_PLAN_APPROVAL` as an open decision. It is approved and
recorded in `0339b4a`. The plan should cite that commit as the approval.

The design's two companion notes stand unchanged and are still due:

- `prisma.config.ts` must carry the migration connection URL (Prisma 7 rejects
  `url` in the `datasource` block with P1012), and it has to read `DATABASE_URL`
  while AD-7's prose assigns that to `src/config/env.ts` alone and the ESLint
  rule enforcing it covers only `src/**`. `IMPLEMENTATION_PLANNING` must choose
  deliberately — narrow AD-7 to `src/`, or import the validated value — rather
  than let the lint's silence decide.
- PC-1 predates Prisma 7 and does not describe either the adapter object or the
  separate migration config file. Amending it is a convention change and belongs
  to whoever takes that decision, not to a design or planning stage acting alone.

---

### d-4 — Minor (API). The `email` constraints describe the normalized value

The contract puts `format: email`, `minLength: 1` and `maxLength: 254` on
`RegisterRequest.email`, while BR-2 and VR-4 normalize (trim, then lowercase)
*before* validation. So `"  Alice@Example.COM "` is accepted although it
satisfies neither `format: email` nor a literal reading of the declared
constraints. The design is aware of this and states the ordering in the operation
description, which is the right place for it.

Recorded for a second reason that is not documentation: AC-10 makes the contract
generated from the Zod schemas, and a Zod pipeline that transforms before it
validates does not necessarily render as a plain `string` with `format` and
bounds. If it renders as a composition, the generated `docs/api/openapi.json`
will not match this contract's shape for that field even though both describe the
same behavior. `IMPLEMENTATION_PLANNING` should expect that and
`IMPLEMENTATION_VERIFICATION` should compare semantically, as the design's own
"Contract-source obligations" section anticipates for `info.version`.

---

### d-5 — Minor (API). `minLength: 1` is redundant on `email`

`format: email` already excludes the empty string, and VR-1's "required and must
be a string" is carried by `required: [email, password]` and `type: string`. The
keyword is harmless and mildly defensive; it is noted only so that a later reader
does not take it for a rule with a requirement behind it. No correction needed.

## Open Decisions

None blocking. `docs/decisions/US-001-open-decisions.md` v7 holds twelve entries
and all twelve are `RESOLVED`. No finding in this review reopens one.

`d-1` resolution (a) would require an amendment to `architecture.md` AD-6, which
is a convention change and a human decision — not an Open Decision in this
Story's registry, and not something `API_DESIGN` may make on its own. If the
design chooses (a), that amendment is the item for `HUMAN_PLAN_APPROVAL`; if it
chooses (b), nothing is escalated.

The two questions `API_DESIGN` recorded for later stages are confirmed as
non-blocking and are left where the design put them: the undeclared
`RateLimit-*` / `Retry-After` headers (`IMPLEMENTATION_PLANNING` settles whether
to declare or disable them — note it interacts with `d-1`, since both concern the
limiter's response), and the absent `Location` header pending `/api/v1/users/me`
in US-003.

## Limitations

- No code exists to review; this stage checks designs against requirements and
  conventions only. Whether the implementation honors them is
  `IMPLEMENTATION_VERIFICATION`'s and `security-reviewer`'s.
- The library behavior behind `d-1` and `d-2` was read from the installed
  sources, not exercised against a running app. Both are small enough to be
  confirmed by an integration test once one exists, and both should get one.
- The database design's claim that `npx prisma validate` accepts the model on
  7.10.0 was not re-run: `prisma/schema.prisma` is still a placeholder, so there
  is nothing in the tree to validate. It is recorded as the design's evidence,
  not as this review's.
- This review does not re-open the Specification. `m-2` and `m-3` from
  specification review v11 remain open defects in an approved artifact, correctly
  identified by `API_DESIGN` as not addressable at a design stage.

## Verdict

**CHANGES_REQUIRED** — loop-back to `API_DESIGN` (`changes_required_api`).

Two Major findings, both in the API design, both discharged by adding a
paragraph: `d-1` names what produces the `429` body, `d-2` names which `400`
branch covers a non-object body and makes the schema and the prose agree. The
OpenAPI contract itself needs no structural change for either.

The **database design and entity model are accepted as they stand** and should be
carried forward unrevised. `d-3` is recorded against the database design but
explicitly requires no revision of it — it is a currency note whose only
obligation falls on `IMPLEMENTATION_PLANNING`.
