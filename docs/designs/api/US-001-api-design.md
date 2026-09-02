---
artifact_type: api_design
story: US-001
version: 2
status: DRAFT
created_at: 2026-09-02T16:23:21Z
updated_at: 2026-09-02T17:41:30Z
produced_by: openapi-designer
inputs:
  - path: docs/specifications/US-001-spec.md
    version: 14
  - path: docs/reviews/specifications/US-001-spec-review.md
    version: 11
  - path: docs/reviews/designs/US-001-design-review.md
    version: 1
  - path: docs/decisions/US-001-open-decisions.md
    version: 7
  - path: docs/stories/US-001-register-customer.md
    version: null
supersedes: null
---

# API Design: Customer Registration

Paired contract: `docs/designs/api/US-001-openapi.yaml`. That file is the
contract; this document is its traceability anchor and carries the reasoning
behind every choice it makes.

> **Revision 2 — discharges the two Major findings of design review v1.**
> `DESIGN_REVIEW` returned `CHANGES_REQUIRED` with loop-back key
> `changes_required_api`, and named this document as the only artifact that had
> to change: the database design and entity model were accepted as they stand
> and are carried forward unrevised. Both findings are answered below by naming
> an owner, which is what the review asked for — `d-1` under "What produces the
> 429 body", `d-2` under "A body that is valid JSON but is not an object". The
> contract needed no structural change for either; it gained one constraint
> (`minProperties: 1` on `FieldErrors`), which encodes a rule this document
> already stated in prose and the review found the schema did not enforce.
> `info.version` moves to `'2'` with this artifact, per `artifact-schema.md`.

## Scope

One operation: `POST /api/v1/auth/register`. No other path, schema, parameter,
or security scheme is introduced. The Story issues no token and sets no cookie
(BR-4), serves no collection (AC-8's pagination decision stays untouched), and
adds no endpoint for the `users` module — `users` participates through its
service and repository only (BR-6), so it registers nothing into the OpenAPI
document.

## What this stage decided, and what it did not

`API_DESIGN` owns the HTTP contract (`stage-map.yaml` outputs `api_design`,
`openapi`). Three things the Specification explicitly left to it are decided
here:

1. the **error `code` values** for every status except `409`, which
   `api-conventions.md` AC-6 already decided (Error Model below);
2. the **wire representation** of every request and response field — the types,
   formats and bounds in the contract;
3. the **shape of the 400**, which carries two distinct codes with two distinct
   body shapes.

It does not choose file names, middleware ordering, or internal structure.
Where the Specification deferred a placement to `IMPLEMENTATION_PLANNING`
(FR-22, FR-23, FR-24), this document leaves it there. Where it does name a
layer, it is because a declared response had no component able to produce it and
a review said so: the body-parser error translation (specification review v11
`m-1`) and the `429` carrier (design review v1 `d-1`), both under Error Model.
In each case it names a layer and an obligation, never a filename.

## Operation

### `POST /api/v1/auth/register`

| Aspect | Decision | Source |
|---|---|---|
| Path | `/api/v1/auth/register` | FR-1; AC-1 (URI versioning), AC-3 (the `/auth/` verb exception) |
| Method | `POST` | FR-1 |
| Auth | **Public** — no scheme, no header, no cookie | FR-1; SC-4, which requires the approved API design to list a public endpoint explicitly; this is that listing |
| Request media type | `application/json`, required on any request with a body | AC-2, VR-10 |
| Success | `201 Created`, created resource body, **no `Location` header** | FR-5; AC-4 "Registration — decided" |
| Rate limit | The `/api/v1/auth` limiter runs before the handler | FR-13, SR-8, SC-3 |
| Idempotency | None. A repeat of a successful registration is a `409`, not a replay | FR-6, AC-002 |

**Why no security scheme is defined at all.** SC-4 is deny-by-default, so an
endpoint being public has to be recorded somewhere; that record is this table
and the operation's `description`. The alternative — declaring a bearer scheme
document-wide and setting `security: []` on this operation — would put a JWT
scheme into the contract of a Story that issues no JWT, which the Specification
places out of scope (BR-4, Out of Scope). The Story that introduces
authentication adds the scheme together with the first operation that requires
it.

**Why `201` with a body and no `Location`.** Carried unchanged from AC-4, which
records the human decision of 2026-09-01: `201` because a durable account was
created and a client needs to distinguish that from an accepted-but-inert `200`;
no `Location` because the only canonical URL for the account is
`/api/v1/users/me` (AC-3) and no Story serves it until US-003. Adding the header
later is not a breaking change (AC-1), so nothing is foreclosed.

## Request body

`RegisterRequest` — exactly two properties, `additionalProperties: false`.

| Field | Type | Constraints | Source |
|---|---|---|---|
| `email` | `string` | `format: email`, `minLength: 1`, `maxLength: 254` | VR-1, VR-2, VR-3 |
| `password` | `string`, `writeOnly` | `minLength: 12`, `maxLength: 128` | VR-5, VR-6; SC-1 |

**`additionalProperties: false` is the contract form of VR-9.** AD-5 rejects
unknown properties rather than stripping them, and the JSON Schema keyword says
exactly that. It is what makes the unknown-property `400` a contract obligation
rather than an implementation habit.

**The bounds apply to the normalized value.** BR-2 and VR-4 normalize before
format validation and before the uniqueness comparison: trim, then lowercase.
So `"  Alice@Example.COM "` is validated, stored, and returned as
`"alice@example.com"`, and a 254-character bound is a bound on the trimmed
string. The contract states the ordering in the operation description because a
client cannot otherwise predict which value the `409` compares against (EC-1,
EC-2).

**The password policy is referenced, never re-encoded.** The contract carries
the two lengths, because they are expressible as JSON Schema keywords and a
client needs them to build a form. The 3-of-4 character-class rule is
deliberately **not** written as a `pattern`: SC-1 is the single expression of
the policy and VR-8 places it in the module's Zod schema, so a regular
expression here would be a second definition that can drift from the first, and
a wrong one — a class test over Unicode code points is not what a `pattern`
keyword expresses well. The rule is stated in the field's `description`, which
documents it for a reader without creating a second authority. `writeOnly: true`
is the contract's statement of SR-3: the field is accepted on a request and
appears in no response.

**No `example` values anywhere in the contract.** The generated document
(`docs/api/openapi.json`) is built from the Zod schemas, and every example in
this file would have to be reproduced in a `.openapi()` call to keep the two in
agreement (AC-10). Examples carry no requirement, so the cost is drift risk for
no contract value. Descriptions carry the same information for a reader.

## Response body

`RegisterResponse` — exactly four fields, `additionalProperties: false`.

| Field | Type | Notes | Source |
|---|---|---|---|
| `id` | `string`, `format: uuid` | Opaque; a string, never a number | FR-5; AC-11, PC-3 |
| `email` | `string`, `format: email`, `maxLength: 254` | The stored, normalized value | FR-5, BR-2, VR-4 |
| `role` | `string`, `const: CUSTOMER` | The only role defined | FR-3; SC-2 |
| `createdAt` | `string`, `format: date-time` | ISO 8601 with explicit UTC offset | FR-5; AC-11, PC-6 |

**`id` is `string` / `format: uuid`** — this closes review v11's m-4, which
observed that FR-5 named `id` without stating its representation while citing
AC-11 only for `createdAt`. AC-11 requires identifiers to be strings and PC-3
fixes the generation strategy as `@default(uuid())`, so the representation was
never in doubt; the contract now states it rather than leaving a reader to
assemble it from two conventions. `format: uuid` is an annotation, not an
invitation to parse: clients treat the value as opaque (PC-3).

**`role` is a `const`, not a free `string`.** SC-2 defines `CUSTOMER` as the
default and only role and forbids adding another speculatively. A `const`
records that the contract currently admits exactly one value; the Story that
introduces a second role widens it, which is an additive change.

**`additionalProperties: false` is the contract form of AC-006.** FR-11 and SR-4
require that neither the password nor the hash nor any other internal field
appears. A closed response object states that as a contract obligation rather
than as a promise about how the DTO happens to be built, and gives
`implementation-verifier` something to assert against.

## Error model

Every error body is the single shape in AC-6. `code` is the contract; `message`
is human-readable text that may change without a version bump, so no message
string is fixed in the contract — only its constraints (safe to display, and
nothing from SC-9's list).

### Assigned codes

`409` was already decided. The other six are assigned here, and per AC-6 a code
invented during implementation is a finding.

| Status | Code | Case | Source |
|---|---|---|---|
| `400` | `VALIDATION_FAILED` | Missing/non-string field, bad email format, email over 254, password policy failure, unknown body property | VR-1…VR-3, VR-5, VR-6, VR-9; AC-5 |
| `400` | `MALFORMED_JSON` | Body is not parseable JSON | Error Handling; AD-6 |
| `409` | `EMAIL_ALREADY_REGISTERED` | **Already decided** — not assigned here | AC-6; BR-009 |
| `413` | `PAYLOAD_TOO_LARGE` | Body over the `10kb` limit | VR-10; SC-5 |
| `415` | `UNSUPPORTED_MEDIA_TYPE` | Request with a body and a missing or non-JSON `Content-Type` | VR-10; AC-2 |
| `429` | `RATE_LIMIT_EXCEEDED` | Register rate limit exceeded | FR-13; SC-3; AD-6 |
| `500` | `INTERNAL_ERROR` | Anything unmapped | AD-6; SC-9 |

**Why one code for five validation cases.** The Specification's Error Handling
table lists the bad email, the bad password and the unknown property as three
rows, each awaiting a code. They are one semantic — the request body did not
satisfy the schema — and AD-6 maps all of them through a single `ZodError`
branch that has no throw site at which a per-case code could be supplied. What
distinguishes them for a client is `details.fieldErrors`, which VR-11 already
requires, and which is more useful than a code: a form needs to know *which
field* failed, and a single request can fail on both fields at once. Three codes
would also be three stable contract elements to maintain, and renaming one later
is a breaking change (AC-6).

**Why `MALFORMED_JSON` is separate.** It is not a field failure. No field can be
named, so `details.fieldErrors` cannot be populated and VR-11 does not reach it;
a client that has just sent a broken request body needs to know it was the
syntax rather than the values. It reaches the handler as a `ValidationError`
carrying this code — AD-6's rule that the class decides the status and the code
tells the client *which* failure, the same relationship `ConflictError` has with
`EMAIL_ALREADY_REGISTERED`.

### The 400 has two body shapes

`ValidationErrorResponse` requires `details.fieldErrors` and never sends it
empty; `MalformedJsonErrorResponse` omits `details` entirely, per AC-11's rule
that an absent optional field is omitted rather than sent as `null`. The
contract expresses the `400` as a `oneOf` over the two, and the `const` on
`code` is what makes them mutually exclusive — a `oneOf` whose branches both
matched would be invalid schema, not merely untidy.

"Never empty" is now a keyword rather than a sentence: `FieldErrors` carries
`minProperties: 1`. Design review v1 `d-2` observed that the schema
accepted `{"fieldErrors": {}}` while this document said it never occurs, and a
disagreement between the contract and its prose is the one a schema check cannot
catch. VR-11 is the requirement behind the keyword; every case that reaches
`VALIDATION_FAILED` has at least one field to name, including the two the next
section is about.

### `fieldErrors` keys, including the unknown-property case

AC-6 fixes the shape as `{ "fieldErrors": { "<field>": ["<message>"] } }`, and
VR-11 requires the failing field to be named. Four of the five
`VALIDATION_FAILED` cases key on `email` or `password` and need no decision.
The fifth does: **an unknown body property is keyed by the offending property
name.**

This is a contract decision with an implementation consequence worth stating
here, because it is easy to miss and it would silently break VR-11. Zod reports
an unrecognized key as an issue whose path is the object root, not the offending
key, so the flattening helper that produces `fieldErrors` places it under form-
level errors and leaves `fieldErrors` empty. A response with
`"details": {"fieldErrors": {}}` satisfies neither VR-11 nor the contract's
`minItems: 1` on each message array. The implementation must map the
unrecognized-keys issue's own key list into `fieldErrors` rather than relying on
the default flattening. The alternative — adding a `formErrors` member to
`details` — was rejected: AC-6 documents `fieldErrors` and nothing else, and
widening the error body's shape for one case is a contract change that no
requirement asks for.

No key and no message ever echoes the submitted password (VR-11, SC-1, SC-9).
Naming the rule that failed is not returning the value that failed it.

### A body that is valid JSON but is not an object — closing review d-1's sibling, d-2

Design review v1 `d-2` found a `400` that no declared branch covered. The JSON
body parser runs in its default strict mode, which accepts a body whose first
non-whitespace character is `{` **or `[`** — verified in the installed
`body-parser` 2.3.0, `lib/types/json.js`: any other first character is a strict
violation and never reaches validation. So a JSON array parses successfully,
arrives at the object schema, and fails it at the object root with no field to
name, leaving `details.fieldErrors` empty and VR-11 unsatisfied.

**The branch is `VALIDATION_FAILED`, and `details.fieldErrors` names `email` and
`password`, both as not supplied.** A body that is not an object supplies
neither required field, so naming both is not a workaround — it is the accurate
answer to "which field failed", and it is the same answer the contract already
gives for a body of `{}` and for a bodyless POST. Those three requests differ in
what the client sent and not in what the server is missing, and a client
correcting any of them takes the identical action.

The alternatives were rejected on grounds this document has already used:

- **`MALFORMED_JSON`** describes a body that did not parse. This one parsed. A
  client told its JSON was malformed would look for a syntax error that is not
  there.
- **An empty `fieldErrors`, or a `formErrors` member beside it.** The first
  breaks VR-11 and is now rejected by the contract itself (`minProperties: 1`).
  The second widens AC-6's error body for one case — rejected above for the
  unknown-property case, and the reasoning is unchanged here.

**Implementation consequence, the same shape as the unknown-property one.** Zod
reports the non-object body as a single `invalid_type` issue whose path is the
object root (verified on the installed `zod` 4.5.4: `[]` yields
`{code: "invalid_type", expected: "object", path: []}`), so the default
flattening puts it in form-level errors and leaves `fieldErrors` empty. The
implementation must map that root-level issue onto the two required field keys,
just as it must map the unrecognized-keys issue onto the offending property
name. Neither mapping is optional decoration: without them the response fails
its own contract, and `minProperties: 1` is what makes that failure visible to a
contract test instead of only to a careful reader.

### What produces the 429 body — closing design review d-1

Design review v1 `d-1` found that the contract declared a `429` with
`RATE_LIMIT_EXCEEDED` while no approved artifact gave any component the power to
produce that body. `express-rate-limit`'s default handler sets the status, sends
its own plain-text payload and never calls `next` — verified in the installed
8.7.0 — so a limiter left at its defaults answers with a body that is not AC-6's
and that the centralized error middleware never sees. The status would be right
and the body wrong: caught by an integration test asserting AC-6, invisible to
an eyeball.

The review offered two resolutions and required this stage to pick one. **It is
resolution (a), and it was decided by a human, not by this document:** commit
`fa21f62` (author `KShust`, 2026-09-02) amends `architecture.md` AD-6 to add
`TooManyRequestsError` to the domain-error taxonomy, extends the handler mapping
with `429`, and names US-001 as the Story that creates the class. The commit
message records the approval and the reasoning. The amendment was the part
`API_DESIGN` may not make on its own; with it made, the design records the
consequence.

**The carrier is the rate limiter's own handler, which calls
`next(new TooManyRequestsError(...))`** and hands the response to the
centralized error middleware, where every other error body in this contract is
built. Two things follow, and both are contract-relevant:

- A custom handler is required either way. The default one never delegates, so
  "leave the limiter at its defaults" was never among the options; what the
  taxonomy decides is whether the custom handler *constructs a body* or *raises
  an error*. It raises one, which keeps AD-6's single construction site intact.
- Nothing is escalated to `HUMAN_PLAN_APPROVAL` for this. The review's
  instruction to record a finding for the gate was conditional on the amendment
  still being needed; it has been made. `IMPLEMENTATION_PLANNING` should carry
  the class, not the question.

The contract is unchanged in structure: the `429`, its code and its body were
already declared correctly. The `429` description now names the carrier, the way
the `413` and `415` descriptions already named theirs.

**One consequence this stage records and does not repair.** Specification FR-21
states that US-001 creates four `DomainError` subclasses and lists them; AD-6
now says five, `TooManyRequestsError` included. FR-21 restates AD-6 rather than
deciding it, so the convention is canonical and the Specification is stale on
this point. It is an `APPROVED` artifact past its human gate and only
`spec-writer` may revise it, so this is a finding carried forward, not an edit.
The gap is documentary: the class list an implementer needs is in AD-6, which is
authoritative, and the contract declares the `429` it carries.

### Who translates the body-parser's errors — closing review v11 m-1

Review v11 m-1 recorded that the Specification requires the JSON body parser's
errors to become `PayloadTooLargeError` and `ValidationError` but names no owner
for the translation, while the `415`'s owner is named. Left open, an untranslated
library error reaching the centralized handler is the `500` regression
OD-US-001-12 was raised about.

**The owner is the application-level middleware chain, immediately after the
JSON body parser** — the same chain that mounts it, which the Specification
places in `src/app.ts`. Two things fix it there and nowhere else:

- It is the only point that sees the parser's error before the centralized error
  middleware. AD-6 says the malformed-JSON failure is wrapped "at the boundary",
  which is this chain.
- It cannot be the error middleware itself. AD-6 defines that component as
  mapping `ZodError` and `DomainError` to statuses; teaching it to recognize the
  body parser's own error objects would give it a third category and put
  library-specific detection into the one place the architecture keeps generic.

What stays with `IMPLEMENTATION_PLANNING` is the file: whether this is a small
dedicated middleware, part of the boundary validation middleware FR-22 already
requires, or a wrapper around the parser mount. `API_DESIGN` names the layer and
the obligation, not the filename — the same line FR-22, FR-23 and FR-24 draw.

The contract's part of this is that `413` and the malformed-JSON `400` are
declared responses with assigned codes and the AC-6 body. A `500` in either case
is a contract violation an integration test can catch, which is what the
Specification wanted and what m-1 observed was not yet nailed down.

### The `415` is scoped to requests with a body

Carried from the Specification's Error Handling table, which resolves AC-2
against AC-5 in favour of AC-2 as the more specific source. A bodyless `POST`
is a `400` with `email` and `password` both missing, not a `415`. The contract
states this in both the `400` and the `415` descriptions, because it is the one
place where two conventions read differently and a client would otherwise have
to guess.

## Response headers

`X-Request-Id` is declared on every response, success and error alike (AC-9,
FR-15, NFR-010). AC-9 fixes the inbound header name and requires the id to be
returned in the response headers without naming the outbound header; this
contract names it `X-Request-Id`, mirroring the inbound name so that a client
that sent one reads its own value back under the same key.

**No rate-limit headers are declared** — see Questions recorded for later stages.

## Acceptance-Criterion map

| AC | Where the contract carries it |
|---|---|
| AC-001 | `201` + `RegisterResponse`; `role` `const: CUSTOMER`; public operation with no auth requirement. The "can authenticate later" outcome is not observable in this contract — US-001 owes it only the stored hash (FR-17) |
| AC-002 | `409` + `ConflictErrorResponse` with `EMAIL_ALREADY_REGISTERED`; identical for the service-check and race paths |
| AC-003 | `400` + `ValidationErrorResponse`; `email` `format: email`, `maxLength: 254`; `details.fieldErrors.email` |
| AC-004 | `400` + `ValidationErrorResponse`; `password` `minLength: 12` / `maxLength: 128` plus the SC-1 policy in its description; `details.fieldErrors.password` names the rule that failed |
| AC-005 | Not observable at the HTTP boundary — the hash never crosses it. The contract's contribution is `writeOnly` on `password` and its absence from every response |
| AC-006 | `RegisterResponse` with `additionalProperties: false` and exactly four fields; no credential field in any response schema |
| AC-007 | Not observable at the HTTP boundary — the audit event is a log line, not a response. No header, field, or status carries it |

Three criteria have no contract surface. That is recorded rather than left
blank: AC-005 and AC-007 constrain what the system stores and logs, and
`TEST_WRITING` covers them against the database and the logger, not against the
response.

## Contract-source obligations

The runtime document is generated, never hand-maintained (AC-10, FR-16). For
this contract that means the implementation must produce, from the Zod schemas
in `src/modules/auth/auth.schemas.ts` registered into `src/lib/openapi.ts`:

- the operation at the full path `/api/v1/auth/register` — the generator emits
  no `servers` entry, so the prefix belongs to the registered path;
- every response above, including the six error responses. A module that
  registers only the `201` produces a document that silently disagrees with this
  contract;
- `additionalProperties: false` on both closed objects — Zod's strict object
  mode, not the default;
- `writeOnly` on `password` and the `const` values on `role` and each `code`,
  which are carried through `.openapi()` metadata;
- `minProperties: 1` on `FieldErrors`. A Zod record does not emit that keyword
  on its own, so it has to be supplied as `.openapi()` metadata — and it is the
  one keyword in this contract whose absence from the generated document would
  silently re-admit the response `d-2` was raised about;
- the `X-Request-Id` response header, as a registered component header.

`npm run openapi:check` compares the generated document against the committed
`docs/api/openapi.json`; it does **not** compare either against this file.
Checking the generated document against this contract is a semantic review,
owned by `design-reviewer` here and by `implementation-verifier` after the code
exists. `info.version` differs by design: this artifact carries `'2'`, mirroring
its own version per `artifact-schema.md`, while the generated document carries
the `package.json` version.

Design review v1 `d-4` adds a second field to compare semantically rather than
literally. `RegisterRequest.email` declares `format: email` with bounds while
BR-2/VR-4 normalize before validating, so a Zod pipeline that transforms first
may not render as a plain `string` with `format` and bounds at all. The two
documents can describe identical behavior and still not match key for key there.
`IMPLEMENTATION_VERIFICATION` should expect it; `npm run openapi:check` will not
see it, because it compares the generated document against the committed
`docs/api/openapi.json` and neither against this file.

## Questions recorded for later stages

This is this stage's open-questions section. **Neither item is a blocking Open
Decision**: neither is an entry in `docs/decisions/US-001-open-decisions.md`
(all twelve of which are `RESOLVED` at v7), neither prevents `DB_DESIGN` or any
later stage from running, and the contract above is complete without either. They
are recorded so a later stage does not have to rediscover them.

1. **Rate-limit response headers.** `express-rate-limit` emits `RateLimit-*`
   headers by default, and returns `Retry-After` on a `429`. SC-3 decides the
   threshold and the mount point and says nothing about headers, and no
   requirement asks for them, so this contract declares none — declaring a
   response header the Specification does not require is exactly what this
   stage's checklist forbids. The consequence is that the implementation will
   emit headers the contract does not describe unless it disables them.
   `IMPLEMENTATION_PLANNING` should settle which way; either is defensible, and
   adding a declared header later is additive.


   `d-1` narrows this question without answering it. The limiter now needs a
   custom `handler` in any case, so the same configuration object that raises
   the `TooManyRequestsError` is where `standardHeaders` / `legacyHeaders` get
   set — one decision, one place, rather than two. What the headers should be is
   still unowned by any requirement, and this contract still declares none.

2. **No `Location` header, and the `/api/v1/users/me` that does not exist yet.**
   Carried from AC-4 as decided, and recorded here so US-003 sees it: once
   `/api/v1/users/me` is served, adding `Location` to this `201` is available
   and additive. Nothing in this Story depends on it.

## Findings carried forward

### Design review v1 (the loop-back that produced this revision)

- **d-1** (Major, API — the `429` had no carrier) — **addressed** under "What
  produces the 429 body": resolution (a), the limiter's handler raising a
  `TooManyRequestsError`, decided by the human amendment to AD-6 in `fa21f62`.
  **Nothing is escalated to `HUMAN_PLAN_APPROVAL`** — the review's instruction to
  escalate was conditional on that amendment still being needed.
- **d-2** (Major, API — a non-object JSON body produced an uncoverable `400`) —
  **addressed** under "A body that is valid JSON but is not an object": the
  branch is `VALIDATION_FAILED`, `details.fieldErrors` names `email` and
  `password`, and `FieldErrors` gained `minProperties: 1` so the schema and the
  prose now say the same thing.
- **d-3** (Minor, database — the stale driver-adapter finding) — **not this
  stage's**, and correctly so: it is addressed to `IMPLEMENTATION_PLANNING`,
  which must cite `0339b4a` as the approval rather than carry the adapter to the
  gate as an open decision. The database design and entity model are carried
  forward unrevised, as the review directed.
- **d-4** (Minor, API — `email` constraints describe the normalized value) — no
  correction required, and none made. Recorded under "Contract-source
  obligations", where its real consequence lives: the generated document may not
  match this contract key-for-key on that field, so the comparison is semantic.
- **d-5** (Minor, API — `minLength: 1` redundant beside `format: email`) — no
  correction required, and none made. The keyword stays: removing it would be a
  contract edit with no requirement behind it, which is the same objection that
  keeps it from being read as a rule.

**New finding raised by this revision, for whoever revises the Specification.**
FR-21 lists the four `DomainError` subclasses US-001 creates; AD-6, amended in
`fa21f62`, now names five. FR-21 restates AD-6 rather than deciding it, so the
Specification is stale on this point. It is `APPROVED` and past its human gate,
and only `spec-writer` may revise it — recorded, not repaired. Non-blocking: the
authoritative list is AD-6's, and the contract declares the `429` the fifth class
carries.

### Specification review v11

Review v11's four Minors were accepted at the gate as design inputs. Their
status after this stage:

- **m-1** (no owner for translating the body parser's errors) — **addressed**
  above: the layer is named, the filename stays with
  `IMPLEMENTATION_PLANNING`.
- **m-4** (`id` representation unstated in FR-5) — **addressed**: the contract
  states `string` / `format: uuid`, cited to AC-11 and PC-3.
- **m-2** (the Specification's revision-14 preamble miscounts its own changes) —
  **not addressed and not addressable here.** It is a defect in a
  self-describing section of an artifact this stage does not own, and correcting
  it means a Specification revision, which would supersede a document that has
  passed its human gate. Recorded as a non-blocking finding.
- **m-3** (FR-5's closing sentence places an obligation on US-003) — **not
  addressed here** for the same reason. This contract does not carry the
  obligation forward: the four response fields are stated as US-001's contract,
  and what US-003 must keep returning is the registry's business, not this
  file's.
