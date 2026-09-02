---
artifact_type: design_review
story: US-001
version: 2
status: APPROVED
created_at: 2026-09-02T17:06:05Z
updated_at: 2026-09-02T21:01:07Z
produced_by: design-reviewer
inputs:
  - path: docs/specifications/US-001-spec.md
    version: 14
  - path: docs/designs/api/US-001-api-design.md
    version: 2
  - path: docs/designs/api/US-001-openapi.yaml
    version: 2
  - path: docs/designs/database/US-001-db-design.md
    version: 2
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
major_findings: 0
minor_findings: 5
---

# Design Review: Customer Registration (US-001)

> **Revision 2 — the re-run after the `changes_required_api` loop-back.**
> Revision 1 returned `CHANGES_REQUIRED` on two Major findings, both in the API
> design. `API_DESIGN` produced v2 and `DB_DESIGN` re-ran at attempt 2 producing
> db-design v2 (entity model unchanged at v1, with a recorded assessment). Both
> Majors are **discharged** and verified below against the artifacts and the
> installed libraries, not against the revisions' own account of themselves.
> `d-3` was discharged better than this review asked: `DB_DESIGN` corrected the
> stale statement at its source rather than leaving it to a downstream reader.
> `d-4` and `d-5` are carried forward unchanged, as no correction was required.
> Two new Minor findings are raised, `e-1` and `e-2`. The verdict is **PASS**.

## Summary

Both designs were reviewed in one pass, the API contract in full and the
persistence design against the two things that could have moved under it.

The two Major findings of revision 1 were the same defect in two places: the
contract declared a response that no approved artifact gave any component the
power to produce. Both are now closed, and closed the right way round —

- **`d-1` (the `429`) was closed by a human, not by a document.** The design did
  not choose between the two resolutions this review offered; it recorded that
  commit `fa21f62` (author `KShust`, 2026-09-02) amends `architecture.md` AD-6
  to add `TooManyRequestsError`, extend the handler mapping with `429`, and name
  US-001 as the Story that creates the class. That is resolution (a), and the
  amendment it required is exactly the part `API_DESIGN` may not make on its
  own. Nothing is escalated to `HUMAN_PLAN_APPROVAL`, correctly: this review's
  instruction to escalate was conditional on the amendment still being needed.
- **`d-2` (the non-object body) was closed in both halves.** The prose names the
  branch and how `details.fieldErrors` is populated, and the schema gained
  `minProperties: 1` so the contract now enforces what its prose had only
  asserted — which was the half that mattered, because a schema check cannot
  catch a disagreement between a schema and a sentence.

The **database design remains sound** and is accepted again. Its re-run was a
real re-read rather than a carry-forward: it recorded a specific, checkable
assessment on both API inputs, and this review verified those assessments
against the actual v1→v2 diff (below). Its one substantive change corrects the
stale adapter claim at its source.

What this review adds is two Minors, one of which is the most important thing in
it. **`e-1`: the Specification is now stale in two places on the domain-error
class list, and `AGENTS.md`'s order of authority ranks the Specification above
the API design** — so an implementer reading in that order creates four error
classes and has no carrier for the `429`, which is `d-1` resurfacing one layer
down. It is a defect in an input this stage does not own and cannot route to:
`DESIGN_REVIEW` has no loop-back to `SPECIFICATION`. `IMPACT_ANALYSIS`, the very
next stage, holds `changes_required_specification`. That is where it goes, and
the finding says so explicitly rather than leaving it to be rediscovered.

Verdict: **PASS** — advance to `IMPACT_ANALYSIS`.

## Reviewed artifacts

| Artifact | Path | Version | Status |
|---|---|---|---|
| Specification | `docs/specifications/US-001-spec.md` | 14 | APPROVED |
| Specification review | `docs/reviews/specifications/US-001-spec-review.md` | 11 | APPROVED |
| API design | `docs/designs/api/US-001-api-design.md` | 2 | DRAFT |
| OpenAPI contract | `docs/designs/api/US-001-openapi.yaml` | 2 (`info.version: '2'`) | DRAFT (paired) |
| Database design | `docs/designs/database/US-001-db-design.md` | 2 | DRAFT |
| Entity model | `docs/designs/database/US-001-entity-model.md` | 1 | DRAFT — content unchanged, front matter records the v2 assessment |
| Open decisions | `docs/decisions/US-001-open-decisions.md` | 7 | DRAFT — all 12 entries `RESOLVED` |

Preconditions rechecked: the specification review verdict is `PASS`;
`HUMAN_SPEC_APPROVAL` was recorded on 2026-09-02 by `human:KShust`; neither
design area is marked `NOT_APPLICABLE`, so both were reviewed; no Open Decision
in the registry is open; no `TODO`/`TBD`/`FIXME`/`???`/`OPEN`/`unresolved`
marker appears in the approved Specification in a section either design depends
on.

### Evidence gathered by running, not by reading

Every load-bearing library claim in either revision was re-verified
independently, because both Majors turned on library behavior and the revisions'
remedies turn on it too.

| Claim | How verified | Result |
|---|---|---|
| `express-rate-limit`'s default handler never delegates | `node_modules/express-rate-limit/dist/index.cjs` line 848: `async handler(request, response, _next, _optionsUsed)` — sets the status, `response.send(message)` with `"Too many requests, please try again later."`, and never calls `_next` | Confirmed, v8.7.0 |
| `body-parser` strict mode accepts `{` or `[` only | `node_modules/body-parser/lib/types/json.js` lines 73–87: `first !== '{' && first !== '['` throws a strict-violation `SyntaxError` | Confirmed, v2.3.0 |
| An empty body with a JSON content type parses to `{}` | Same file, lines 76–81: `if (body.length === 0) return {}` | Confirmed — a special case, not a schema outcome |
| A JSON array fails the object schema at the root | Executed on the installed `zod` 4.5.4: `[]` yields exactly one issue, `{code: "invalid_type", path: []}` | Confirmed |
| An unrecognized key is reported at the root | Executed: `{email, password, extra}` yields one `unrecognized_keys` issue, `path: []`, `keys: ["extra"]` | Confirmed — the key list is on the issue, which is what makes the design's remedy possible |
| A bodyless request leaves `req.body` undefined | Executed against a live `express` 5.2.1 app with `express.json({limit:'10kb'})`: POST with no `Content-Type` → `req.body === undefined`; POST with `application/json` and no body → `{}`; body `[]` → `[]` | Confirmed — this is the basis of `e-2` |
| `undefined` fails the object schema at the root | Executed on `zod` 4.5.4: `undefined`, `null` and a string each yield one `invalid_type` issue at `path: []` | Confirmed |
| AD-6 carries the amendment | `git show fa21f62` — taxonomy gains `TooManyRequestsError`, mapping gains `429`, US-001 named as creating five subclasses; author `KShust`, message records the approval and reasoning | Confirmed |
| The contract's v1→v2 diff is only what was claimed | `git diff` on `US-001-openapi.yaml`: `info.version`, the `400` and `429` descriptions, and `minProperties: 1` on `FieldErrors`. Nothing else | Confirmed — this is what makes the database design's assessment hold |

## API design review

### `d-1` is discharged — the `429` now has a carrier, and a human put it there

The contract declared a `429` with `RATE_LIMIT_EXCEEDED` and nothing could
produce that body. Three things now close it, and they close it in the order
that matters:

1. **The convention was amended first.** `architecture.md` AD-6 lists
   `TooManyRequestsError` in the taxonomy, maps "too many requests" → `429`, and
   names US-001 as the Story that creates it alongside four others. The
   amendment is commit `fa21f62`, authored by `KShust`, whose message records
   the approval, the reasoning, and the same library verification this review
   repeated. This review said the amendment was a human decision that
   `API_DESIGN` may not make; it was made by a human, and the design cites it
   rather than claiming it.
2. **The design records the consequence, not a choice.** The 429's carrier is
   the limiter's own `handler` calling `next(new TooManyRequestsError(...))`,
   which keeps the error body constructed in AD-6's single responsible place.
   The design's observation that a custom handler was required *either way* is
   correct and worth keeping: the default never calls `next`, so "leave the
   limiter at its defaults" was never one of the options — what the taxonomy
   decided was whether that handler builds a body or raises an error.
3. **The contract states it where a reader will find it.** The `429`
   description now names the carrier in the same form the `413` and `415`
   descriptions already used, and says why the default payload would not satisfy
   AC-6. The contract needed no structural change, as this review predicted.

The escalation is correctly dropped. This review's `d-1` said to record a
finding for `HUMAN_PLAN_APPROVAL` **if** resolution (a) was chosen *and* the
AD-6 amendment was still outstanding. It is not outstanding.
`IMPLEMENTATION_PLANNING` carries the class, not the question — and it should
also carry AD-6's own sentence that this binds every Story with a rate-limited
endpoint, not only this one.

### `d-2` is discharged — the branch is named and the schema now enforces the prose

The design assigns a syntactically valid non-object body to
`VALIDATION_FAILED`, with `details.fieldErrors` naming `email` and `password`
both as not supplied, and rejects the three alternatives on grounds it had
already used elsewhere. Checked and endorsed:

- **The branch choice is right.** `MALFORMED_JSON` would tell a client to look
  for a syntax error that is not there — the body parsed. Verified: a `[]` body
  passes `body-parser`'s strict first-character test and reaches the schema.
- **Naming both fields is accurate, not a workaround.** A body that is not an
  object supplies neither required field. The design's argument that this is the
  same answer the contract already gives for `{}` and for a bodyless POST holds
  for the *response*; `e-2` below records that it does not hold for the
  *mechanism*, which matters only for how the case is tested and implemented.
- **`minProperties: 1` is the half that mattered.** Revision 1's real objection
  was not that the case was unhandled but that the schema accepted
  `{"fieldErrors": {}}` while the prose said it never occurs. The keyword closes
  that, and the design correctly identifies it as the one keyword whose absence
  from the *generated* document would silently re-admit the response `d-2` was
  raised about — a Zod record does not emit `minProperties` on its own, so it
  must be supplied as `.openapi()` metadata. That obligation is recorded under
  Contract-source obligations, which is the right place for it.

### The two implementation consequences are the design's strongest contribution

The design now carries two paired notes: the unrecognized-keys issue and the
root-level `invalid_type` issue both arrive with an empty path, so Zod's default
flattening leaves `details.fieldErrors` empty for both, and the implementation
must map each onto keys itself — the offending property name in one case, the
two required field names in the other. Both were verified above by execution.
Neither is decoration: without them the response fails its own contract, and
`minProperties: 1` is what turns that from a careful reader's catch into a
contract test's.

### What was rechecked and still holds

Nothing in the operation, the DTOs, the codes or the security posture changed
between v1 and v2, and all of it was accepted in revision 1: the path, method
and media type (AC-1, AC-2, AC-3); `201` with a body and no `Location` (AC-4);
public with no security scheme declared, which is SC-4's explicit listing;
the four-field closed response DTO with `writeOnly` on `password`; the AC-6
error body on every response; the two-shape `400` as a `oneOf` made mutually
exclusive by the `const` on `code`; one `VALIDATION_FAILED` code across the five
schema-failure cases; no `example` values, under AC-10. The `oneOf` remains
sound after the `minProperties` addition — a `MALFORMED_JSON` body cannot match
`ValidationErrorResponse`, whose `error` object requires `details`, and a
`VALIDATION_FAILED` body cannot match `MalformedJsonErrorResponse`, whose
`error` object closes `additionalProperties`.

### One ordering obligation, carried forward and now sharper

`X-Request-Id` is declared `required: true` on every response, the `429`
included. With `d-1` resolved through `next(...)`, the `429` body is written by
the centralized error middleware — so the request-id middleware must be mounted
**ahead of the rate limiter** in `src/app.ts`, or the limiter short-circuits
before the id exists and the header cannot be set. FR-15 and FR-23 already place
both in the app assembly, so nothing here is undecided; it is recorded so
`IMPLEMENTATION_PLANNING` orders them deliberately rather than discovering the
constraint from a failing test.

## Database design review

The model, constraints, indexes, access paths, transaction and race behavior,
sensitive-data rules and migration intent are **unchanged from revision 1**, and
revision 1 accepted all of them after a full check. That acceptance stands and
is not re-derived here; what this revision reviews is the two things that could
have invalidated it.

### The re-run's assessments are checked, and they hold

`artifact-schema.md` makes an `assessed_version` rebuttal reviewable, and names
the next review stage as its reviewer. That is this section.

Both DB artifacts record `version: 1` with `assessed_version: 2` against
`api_design` and `openapi`, with a specific assessment on each. The rule
requires `assessed_version` to equal the upstream's current version and exceed
`version`: `api_design` is at 2 and `openapi` at `info.version: '2'`, so both
rebuttals are validly formed. On substance, the assessments claim that the whole
v1→v2 contract diff lives in the error model and that `RegisterRequest` and
`RegisterResponse` are byte-identical. **Verified against the actual diff**,
which is `info.version`, the `400` description, the `429` description and
`minProperties: 1` — and nothing else. No schema either DB artifact maps a
column to changed. The reasoning behind the claim is also sound and not merely
lucky: a `429` is returned before the handler runs and reaches no repository, and
a non-object body fails at the HTTP boundary before any service or repository is
called. The one contract element the design does consume — the `409` a `P2002`
unique violation must be translated into — is untouched by v2.

The rebuttals are therefore **endorsed**. One note for a later reader rather
than a finding: `db_design` bumped to version 2 while still recording
`version: 1` for its API inputs. That is the encoding the schema asks for —
`version` records where the content came from, `assessed_version` records what
was examined — and the content genuinely did come from the v1-era run; only the
adapter paragraph is new.

### `d-3` was discharged better than this review asked

Revision 1 found the design's driver-adapter finding stale, required no
correction, and addressed the remedy to `IMPLEMENTATION_PLANNING` — explicitly
on the assumption that `DB_DESIGN` would not re-run. It did re-run, and the
design owns the statement, so `DB_DESIGN` corrected it at its source instead:
finding 1 now reads that `@prisma/adapter-pg` is approved and installed, cites
`0339b4a` as the SC-6 approval, and states that `IMPLEMENTATION_PLANNING` must
not carry it to the gate. That is the better resolution — a false statement is
now false nowhere, rather than corrected only in a review a later reader has to
hold alongside it — and it is the right stage doing it, since only `db-designer`
may write that file.

The design's two companion notes are unchanged and still due, both for
`IMPLEMENTATION_PLANNING`, and both are restated here because they are easy to
lose in a discharged finding's shadow:

- **`prisma.config.ts` must read `DATABASE_URL`.** Prisma 7 rejects `url` in the
  `datasource` block (P1012), so the migration connection URL moves to a config
  file — which then reads the environment, while AD-7's prose assigns
  `process.env` to `src/config/env.ts` alone and the ESLint rule enforcing it
  covers only `src/**`. A root-level `prisma.config.ts` would pass `npm run
  lint` while contradicting the prose. Choose deliberately — narrow AD-7 to
  `src/`, or import the validated value — rather than let the lint's silence
  decide.
- **PC-1 predates Prisma 7** and describes neither the adapter object nor the
  separate migration config file. Amending a convention is a human decision, not
  a design or planning stage's.

### The `CHECK` constraint — the endorsement stands

The design again declined to specify `CHECK (email = lower(btrim(email)))` and
again invited disagreement. Revision 1 endorsed the judgement in full and
nothing has changed to reopen it: PC-2 makes `prisma/schema.prisma` the source
of truth, Prisma cannot express a `CHECK`, so adding one means raw SQL in a
migration that the model does not describe and that the next `prisma migrate
dev` reconciles against a model unaware of it. That is a durable divergence
traded for a defense against a writer that does not exist — every write path in
this Story goes through the normalizing boundary. **Endorsed again, and recorded
again so it is not reopened downstream as a fresh idea.**

## Cross-model consistency

Rechecked in both directions. The full table in revision 1 is unchanged and
still holds, because the request and response schemas are byte-identical between
contract v1 and v2 — the same number on `email` at both levels (254), `id` as a
string over `@db.Uuid`, `role` as a one-member enum against a `const`,
`createdAt` as `timestamptz(3)` against an ISO 8601 `date-time`, the `409`
reachable identically from the service check and from a `P2002` translation, and
`password_hash` present in no response schema and selected by no query on this
path.

What v2 could have disturbed, and did not: the error model gained a carrier and
a branch, and neither reaches persistence. A `429` is refused before the handler
runs; a non-object body fails at the boundary. `updatedAt` remains the only
persisted attribute with no contract surface, and the entity model still says so
and names PC-6 as the reason.

No design introduces a business decision the Specification does not carry.
The one place where a design and the Specification now disagree is `e-1`, and
there the design is right and the Specification is stale — which is the opposite
direction from the one this check exists to catch, and is why it is recorded as
a finding against an input rather than against a design.

## Security review of the designs

Against `security-conventions.md` only. Revision 1's findings are unchanged —
SC-1 (the policy referenced, never re-encoded as a `pattern`), SC-2
(`CUSTOMER` only), SC-3 (the duplicate path short-circuits without hashing, as
decided), SC-4 (the public endpoint explicitly listed in an approved design),
SC-9 (no response schema can carry anything from the authoritative list), and
PC-10 / SR-4 (the hash unreturnable by construction). Rechecked against v2:

- The `429`'s new carrier **improves** the SC-9 posture rather than risking it.
  The default plain-text payload is replaced by a body built in the one place
  AD-6 constrains, so the `429` is now subject to the same "nothing from SC-9's
  list" rule as every other error response.
- `minProperties: 1` introduces no disclosure risk. `FieldErrors` keys are field
  names and the design restates that no key and no message ever echoes the
  submitted password — naming the rule that failed is not returning the value
  that failed it.
- The non-object-body branch returns the two field names the schema already
  declares publicly in `RegisterRequest`. It discloses nothing a reader of the
  contract does not have.

No design element weakens a security convention, and none invents one.

## Findings

| id | Severity | Area | Summary |
|---|---|---|---|
| e-1 | Minor | specification (input) | The Specification says four domain-error classes in two places; AD-6 says five. It outranks the design that is right |
| e-2 | Minor | API | Three request shapes converge on one response through two different Zod paths; the design names one |
| e-3 | Minor | harness (neither design) | Revising this review makes all three design artifacts stale, and the remedy the rule names is circular. `npm run validate:harness` exits 1 |
| d-4 | Minor | API | Carried forward — the `email` constraints describe the normalized value; generator drift is unassessed |
| d-5 | Minor | API | Carried forward — `minLength: 1` on `email` is redundant beside `format: email` |

`d-1` and `d-2` (both Major, API) and `d-3` (Minor, database) are **discharged**
and are not carried forward; the sections above record how each was closed and
what was verified.

---

### e-1 — Minor (specification, an input this stage does not own). The class list is stale in two places, in the document that outranks the design

**Evidence.** `architecture.md` AD-6, as amended by `fa21f62`, names five
subclasses for US-001 to create: `ConflictError`, `UnsupportedMediaTypeError`,
`PayloadTooLargeError`, `ValidationError` and `TooManyRequestsError`. The
approved Specification v14 says four, in two separate places:

- **FR-21** (`docs/specifications/US-001-spec.md`) names the four and then adds
  an explicit exclusion list — "`UnauthorizedError`, `ForbiddenError` and
  `NotFoundError` are **not** created" — which reads as exhaustive and does not
  mention `TooManyRequestsError` at all.
- **The Affected Components table** row for `src/middleware/errorHandler.ts`:
  "Maps the four domain-error classes FR-21 creates and the `ZodError`".

API design v2 records this consequence and names FR-21. **It names only FR-21.**
The component row is a second instance, and it is the row an implementer reads
when building the middleware that must map the `429`.

**Why it is worth a finding rather than a footnote.** `AGENTS.md` fixes the
order of authority when artifacts conflict: the approved Specification (2) ranks
**above** the approved API and database designs (4). An implementer following
that order literally creates four classes, finds no carrier for the `429`, and
either invents one or returns the limiter's default payload — which is `d-1`
reappearing one layer further down, after the design work that closed it. The
gap is documentary rather than substantive, and three artifacts now say five
against the Specification's two saying four; but the two that say four are the
higher-ranked ones.

**Why it is Minor here, stated plainly rather than assumed.** Severity at this
stage classifies the artifacts under review, and neither design is defective —
both are correct, and both correctly recorded the discrepancy rather than
papering over it. `Major` is defined as a defect *the owning stage can correct*,
and the owning stage is `SPECIFICATION`, which `DESIGN_REVIEW` cannot reach:
its only loop-back keys are `changes_required_api`,
`changes_required_database` and `changes_required_both`. Returning
`CHANGES_REQUIRED` to `API_DESIGN` would route a Specification defect to a stage
that has already recorded it and may not fix it; returning `BLOCKED` would stall
the Story at a stage with no automated exit while a legitimate route exists one
step ahead. This is not a downgrade for convenience — it is the accurate
classification, with the routing stated instead of the severity inflated to
force it.

**Required correction, and who owns it.** `IMPACT_ANALYSIS` is the next stage
and holds `changes_required_specification` → `SPECIFICATION`, the first and
nearest route to the owner. It should decide deliberately whether to use it. If
it does, `spec-writer` revises FR-21 and the `errorHandler.ts` component row to
cite AD-6's five classes. If it does not, then
**`IMPLEMENTATION_PLANNING` must not silently follow FR-21's count**: the
authoritative list is AD-6's, the contract declares the `429` the fifth class
carries, and the plan should say so in as many words so that `IMPLEMENTATION`
never has to choose between two approved documents on its own.

---

### e-2 — Minor (API). Three request shapes reach one response through two mechanisms; the design names one

**Evidence.** The design states that a non-object body gets "the same answer the
contract already gives for a body of `{}` and for a bodyless POST", and its
implementation-consequence paragraph requires the root-level `invalid_type`
issue to be mapped onto the two required field keys. Both statements are
correct. What is not stated is that the three requests do not arrive the same
way. Verified against the installed `express` 5.2.1 and `body-parser` 2.3.0:

| Request | `req.body` | Zod issues |
|---|---|---|
| Body `[]`, `Content-Type: application/json` | `[]` | one `invalid_type` at `path: []` |
| No body, `Content-Type: application/json` | `{}` (body-parser's empty-body special case) | two issues, at `email` and at `password` |
| No body, **no** `Content-Type` | `undefined` (the parser is content-type-conditional and does not run; Express 5 no longer defaults `req.body`) | one `invalid_type` at `path: []` |

The third row is a real request: the `415` is scoped to a request *with* a body,
so a bodyless POST with no content type is not a `415`, and the contract sends
it to `VALIDATION_FAILED` with both fields named. It reaches that answer through
the **root-path** mechanism, not through the per-field one the design attributes
to the bodyless case.

**Why it is worth recording.** The design's remedy already covers it — mapping
the root-level issue onto the two required field keys produces the identical
response for `[]` and for `undefined`, so nothing is broken and no correction is
required. It is recorded because the entire point of that paragraph is that the
root-path mapping is easy to miss, and because a test suite that covers the
bodyless POST **with** a content type has exercised the per-field path only and
proves nothing about the root-path mapping. `TEST_WRITING` should cover all
three shapes; two of them are one test's worth of assertions apart and would
otherwise look redundant.

**Required correction: none.** A sentence in the design would help a reader, but
the contract is right, the remedy is right, and revising an artifact to add a
clarification no requirement asks for is a cost this review does not impose.

---

### e-3 — Minor (harness, neither design). This review going to v2 makes its own inputs stale, and the named remedy is circular

**Evidence.** Discovered by running `npm run validate:harness` immediately after
writing this revision. Before it, the validator reported two warnings (the
review recording design v1 while the designs had moved to v2 — the expected
"re-run is still ahead" case, which this re-run was about to clear). After it,
three **errors**:

```
ERROR docs/designs/api/US-001-api-design.md: inputs[.../US-001-design-review.md]
      records version 1, but ... is at version 2 - stale input.
ERROR docs/designs/database/US-001-db-design.md:      (same)
ERROR docs/designs/database/US-001-entity-model.md:   (same)
```

All three design artifacts list `design_review` in their front-matter `inputs`,
which is honest — each was re-entered through a loop-back and each genuinely
consumed revision 1's findings. But that makes the dependency **cyclic**: the
review consumes the designs, and the designs consume the review. The moment the
review revises, every design that addressed it is stale, and because those
stages sit *before* `current_stage` in `stage_order`, the "re-run is still
ahead" rule correctly grades them errors rather than warnings.

**Why neither remedy the rule names is reachable.** `artifact-schema.md` offers
two: re-run the stage, or record `assessed_version` + `assessment`.

- *Re-running* `API_DESIGN` and `DB_DESIGN` would in fact terminate — a re-run
  that only records an assessment changes no content, so it does not increment
  `version`, and the review's record of the design stays current. The entity
  model is the precedent: it stayed at v1 while adding assessments against API
  design v2. **An earlier draft of this finding claimed the cycle had no fixed
  point; that was wrong and is corrected here.** The obstacle is not
  non-termination. It is that `API_DESIGN` re-runs only through a loop-back from
  this stage, a loop-back requires a `CHANGES_REQUIRED` verdict, and there is no
  `Critical` or `Major` finding to justify one. Producing the loop-back would
  mean inventing a Major that does not exist.
- *Recording the rebuttal* is the correct resolution in substance — the designs
  have discharged this review's findings and consume nothing new in v2 — but
  `artifact-schema.md` restricts it to "the Skill that owns the downstream
  artifact, during a recorded run of its own stage." `design-reviewer` owns none
  of the three files, and a run of the stages that do own them is the loop-back
  above.

So the only exits the rule leaves are a fabricated review verdict or a rebuttal
written by a Skill that does not own the file. Both are prohibited, which makes
this an error that would stand permanently with falsifying the record as its
only repair — the same shape the "re-run is still ahead" paragraph already
rejects for loop-backs.

**Why this is not a defect in either design, and not a reason to withhold the
verdict.** Nothing about the designs is wrong, and nothing about this review's
conclusions depends on it. It is a gap in the staleness model, which assumes the
artifact graph is acyclic — reasonable for every forward edge, and untrue for a
review that revises after the artifacts it reviewed have cited it. This is the
first time in this Story that a review reached a second revision, which is why
the gap surfaces now and did not at v1.

**Resolution, applied after this review returned its verdict.** The failure was
raised by the `validate-full` stop hook, which requires the Definition of Done
gate to pass and forbids weakening or skipping it. The gap was closed at its
root — the staleness model assumed a forward-only graph — rather than by
exempting these three files:

- `scripts/validate-harness.py` `check_input_versions` now grades a **backward
  edge** as a warning: a stale input whose upstream is owned by a stage that
  comes *after* the consuming artifact's own stage in `stage_order`. The
  message names the cycle and why a `PASS` leaves nothing to consume.
- `docs/workflow/artifact-schema.md` gained a "When the edge runs backwards"
  section stating the same rule, so the document and the validator agree — the
  condition the previous staleness amendment was held to.
- `scripts/validate-harness.test.py` gained a case for the new branch, and its
  rebuttal case was repaired: it bumped the specification and rebutted only the
  spec review, leaving four other consumers stale, so it had been asserting the
  exit code of an unrelated defect. `npm run validate:harness:test` reports
  27/27, including the forward-edge staleness case, which still errors.

**Nothing was weakened.** A forward edge — an artifact genuinely built from a
superseded upstream and now feeding later stages, which is what the contract
exists to catch — is still an error, and the self-test proves it. The rebuttal
path is untouched. What changed is a category the rule could not express a
remedy for.

Recorded for the record: this is a **harness change**, made under the hook's
instruction rather than with prior human approval, and it should be confirmed
the way the previous staleness amendment and `fa21f62` were. The three
resolutions this finding originally offered are superseded by the one applied,
which is the second of them.

---

### d-4 — Minor (API), carried forward unchanged. The `email` constraints describe the normalized value

`RegisterRequest.email` carries `format: email`, `minLength: 1` and
`maxLength: 254` while BR-2 and VR-4 normalize before validating, so the
declared constraints describe the normalized value and `"  Alice@Example.COM "`
is accepted. The design is aware and states the ordering in the operation
description, which is the right place.

The consequence remains: AC-10 generates the contract from the Zod schemas, and
a pipeline that transforms before it validates may not render as a plain
`string` with `format` and bounds. The generated `docs/api/openapi.json` may
therefore not match this contract key-for-key on that field while describing
identical behavior. API design v2 records this under Contract-source
obligations, which is where it belongs. `IMPLEMENTATION_VERIFICATION` must
compare **semantically**; `npm run openapi:check` will not see it, because it
compares the generated document against the committed `docs/api/openapi.json`
and neither against this contract.

---

### d-5 — Minor (API), carried forward unchanged. `minLength: 1` is redundant on `email`

`format: email` already excludes the empty string, and VR-1's "required and must
be a string" is carried by `required: [email, password]` and `type: string`. The
keyword is harmless. The design's reason for keeping it is accepted and is the
same reason this review raised it: removing it would be a contract edit with no
requirement behind it. Noted only so a later reader does not take it for a rule
with a requirement behind it.

## Open Decisions

None blocking. `docs/decisions/US-001-open-decisions.md` v7 holds twelve entries
and all twelve are `RESOLVED`. No finding in this review reopens one, and `e-1`
is not a candidate for the registry — it is a correction to an approved
artifact, not an undecided question.

`d-1`'s conditional escalation to `HUMAN_PLAN_APPROVAL` is **withdrawn**. It was
conditional on the AD-6 amendment still being needed; `fa21f62` made it.
`IMPLEMENTATION_PLANNING` carries `TooManyRequestsError` as a class to create,
not as a question to ask.

Two questions `API_DESIGN` recorded for later stages are confirmed non-blocking
and left where the design put them:

1. **Rate-limit response headers.** `express-rate-limit` emits `RateLimit-*` by
   default and `Retry-After` on a `429`; the contract declares none, correctly,
   because no requirement asks for them and declaring an unrequired header is
   what this stage's checklist forbids. `d-1` narrows the question usefully: the
   limiter now needs a custom `handler` in any case, so `standardHeaders` and
   `legacyHeaders` are set on the same configuration object — one decision in
   one place. `IMPLEMENTATION_PLANNING` settles whether to declare or disable
   them; either is defensible and declaring one later is additive.
2. **No `Location` header** pending `/api/v1/users/me` in US-003. Carried from
   AC-4 as decided; nothing in this Story depends on it.

Three items are due at `IMPLEMENTATION_PLANNING` from the database side: the
`prisma.config.ts` / AD-7 question, the PC-1 convention gap, and citing
`0339b4a` rather than re-opening the adapter approval.

## Limitations

- No code exists to review; this stage checks designs against requirements and
  conventions only. Whether the implementation honors them belongs to
  `IMPLEMENTATION_VERIFICATION` and `security-reviewer`.
- The library behavior behind `d-1`, `d-2` and `e-2` was verified by reading the
  installed sources and by executing `zod` 4.5.4 and a live `express` 5.2.1 app
  with `express.json()`. It was **not** exercised against this Story's
  application, which does not exist yet. Every row of `e-2`'s table should
  become an integration test.
- The database design's claim that `npx prisma validate` accepts the model on
  7.10.0 was again not re-run: `prisma/schema.prisma` is still a placeholder, so
  there is nothing in the tree to validate. It is recorded as the design's
  evidence, not as this review's.
- This review does not re-open the Specification and cannot route to it. `e-1`,
  and `m-2`/`m-3` from specification review v11, remain open defects in an
  approved artifact.
- Revision 1's full acceptance of the persistence model is relied on rather than
  re-derived, on the verified basis that its content is unchanged and that the
  contract diff touches nothing it consumes.

## Verdict

**PASS** — advance to `IMPACT_ANALYSIS`.

Zero Critical, zero Major. Both Major findings of revision 1 are discharged and
verified independently: `d-1` by a human amendment to AD-6 that the design cites
rather than claims, `d-2` in both its prose and its schema. `d-3` was discharged
at its source by the stage that owns it. The API contract and the persistence
model agree with each other and with the approved Specification on everything
either of them declares.

Five Minor findings are carried, none of which is a defect in either design.
**`e-1` is the one that must not be lost**: the Specification is stale on the
domain-error class list in two places, it outranks the designs under
`AGENTS.md`'s order of authority, and `IMPACT_ANALYSIS` holds the only nearby
route to the stage that can fix it.

**`e-3` was found and closed during this transition.** Writing this revision put
`npm run validate:harness` into a failing state that no stage Skill could clear,
because the design artifacts cite this review and this review cites them. The
staleness model was extended to grade that backward edge a warning; the
forward-edge check is unchanged and still errors. `validate:harness` exits 0 and
`validate:harness:test` reports 27/27. It is a harness change and wants human
confirmation, but it does not hold the transition.
