---
artifact_type: specification_review
story: US-001
version: 11
status: APPROVED
created_at: 2026-08-26T00:00:00Z
updated_at: 2026-09-02T13:13:50Z
produced_by: spec-verifier
inputs:
  - path: docs/specifications/US-001-spec.md
    version: 14
  - path: docs/stories/US-001-register-customer.md
    version: null
  - path: docs/decisions/US-001-open-decisions.md
    version: 7
supersedes: null
critical_findings: 0
major_findings: 0
minor_findings: 4
---

# Specification Review: Customer Registration

> **Revision 11 — reviews specification version 14, the revision that consumed
> the decisions resolved at the gate.**
>
> `HUMAN_SPEC_APPROVAL` returned v13 with every registry entry answered. This
> review therefore checks something the previous ten could not: whether the
> answers were consumed faithfully. The question at each site is not "is a
> decision recorded as blocking this" but "does the requirement now state the
> answer the registry gives, and only that answer". Eleven sites were checked
> against the registry text one by one — FR-4, FR-5, FR-11, FR-12, FR-14, BR-2,
> VR-3, VR-4, VR-9, VR-10, VR-11 — plus the Error Handling table against the
> amended AD-6, and FR-21 against AD-6's named subclass list.
>
> The two Minors of review v10 are closed. v10 m-1 was closed by correcting the
> review rather than the specification: PC-1's "What the implementing Story must
> build" list names `docker-compose.yml` literally, so the finding's premise —
> that PC-1 names the file only through `docker compose up` — was wrong, and
> v14 now cites that list. v10 m-2 is marked superseded in place in the
> revision-12 note.
>
> Four new Minors are raised. Three are confined to self-describing or forward-
> looking text; one concerns an unnamed owner for a required translation, and is
> classified Minor because the behavior itself is required and stated. None
> changes what would be built or what the gate decides.

## Summary

- Verdict: `PASS`
- Traceability: 7/7 Acceptance Criteria actually covered by a requirement.
  AC-007's conditional coverage, carried since review v4, is now closed.
- Findings: 0 Critical, 0 Major, 4 Minor

## Reviewed Artifacts

| Artifact | Path | Version | Status |
|---|---|---|---|
| specification | `docs/specifications/US-001-spec.md` | 14 | `DRAFT` |
| story | `docs/stories/US-001-register-customer.md` | n/a | input artifact |
| open_decisions | `docs/decisions/US-001-open-decisions.md` | 7 | `DRAFT` |
| clarification_report | `docs/evidence/US-001-clarification-report.md` | 7 | `DRAFT` |

No input is `SUPERSEDED`. The specification's `inputs` front matter records
`clarification_report` at 7 and `open_decisions` at 7, which are the current
versions of both; the `story` carries no version, per the Story exception in
`docs/workflow/artifact-schema.md`. No `BLOCKED` condition.

Both inputs advanced from 6 to 7 while v14 was being written. That revision
corrected a stale count sentence in the registry's own preamble and changed no
entry, no option and no answer — verified here by re-reading all twelve
`Resolution` blocks against what v14 states. The specification's front matter
records the versions actually read.

## Completeness

Every template section is present and none is empty-without-saying-so.

| Section | Result |
|---|---|
| Business Goal | Present; cites the Story's business-value section. |
| Acceptance Criteria | All seven restated with the Story's ids; none added. AC-007's observable-outcome cell now names the event's fields and its timing. |
| Validation Rules | VR-1…VR-11, each citing a source. None now defers to an unanswered decision. |
| Security Requirements | SR-1…SR-10, each citing `security-conventions.md`, `architecture.md`, or an Acceptance Criterion. |
| Error Handling | Table present; nine rows. The three statuses that had no carrier at v13 now name the AD-6 class that carries each. |
| Out of Scope | Carried from the Story, plus ten exclusions each with its authority — two added at v14 for the profile fields and the account-state column. |
| NFRs | NFR-001…NFR-010 applied; NFR-011 recorded as undecided, with the audit-event answer explained as one that does not depend on it. |
| Open Decisions | Present and explicitly empty of blocking ids, with the heading kept rather than deleted. Correct handling under the template's empty-section rule. |

## Consistency

- **Story vs Specification.** Checked criterion by criterion. AC-002's
  2026-09-01 amendment is carried by FR-6, citing BR-009 rather than restating
  its reasoning. AC-007's Story text — distinct from request logging, no
  password — is now matched by a requirement that says what makes it distinct.
- **Registry vs Specification.** Each of the eleven consumption sites states the
  registry's answer and nothing beyond it. Spot-checked against the resolution
  text: `{ id, email, role, createdAt }` (FR-5), email and password only (VR-9),
  254 at both the boundary and the column (VR-3), no account-state column
  (FR-4), `{ event, userId, requestId }` with no personal data (FR-12), `10kb`
  (FR-14, VR-10), populate `details.fieldErrors` (VR-11), trim-then-lowercase
  (BR-2, VR-4), best-effort after the commit (FR-12, EC-4), extend the AD-6
  taxonomy (FR-21, Error Handling).
- **Conventions vs Specification.** The three amended sections were read
  directly. SC-5 carries `10kb`; SC-9 carries the three-field event and the
  best-effort-after-commit rule; AD-6 carries both new subclasses, the `413`
  mapping, and US-001 named as the Story that creates `src/lib/errors.ts` with
  four subclasses. FR-21's list matches AD-6's list exactly — four created,
  three deferred.
- **Cited section ids exist.** Every convention id the specification cites was
  resolved against the source file: AC-2, AC-3, AC-4, AC-5, AC-6, AC-9, AC-10,
  AC-11, AC-12; PC-1, PC-4, PC-8, PC-9, PC-10; AD-3, AD-4, AD-5, AD-6, AD-7,
  AD-9; SC-1…SC-7, SC-9. AC-11 does specify ISO-8601-with-offset timestamps, and
  AC-6 does document the `fieldErrors` shape, so FR-5's and VR-11's citations
  hold rather than merely pointing.
- **Internal.** FR-22's rule range, the `auth.schemas.ts` row and the boundary
  validation row still agree with each other and with VR-7's and VR-8's text —
  the seam that produced Majors at v6, v7 and v8. FR-4's "enabled state" and the
  persistence row's "no account-state column" are consistent: FR-4 defines the
  state as the existence of the row.

## Traceability

Re-derived from the requirement text at v14 rather than read off the matrix.

| AC id | Mapped to | Actually covered? | Note |
|---|---|---|---|
| AC-001 | FR-1, FR-2, FR-3, FR-4, FR-5, FR-10, FR-17 | Yes | All four outcomes: account created (FR-2), role `CUSTOMER` (FR-3), success response (FR-5, now with its field list), authenticate later (FR-17, naming FR-10 as the whole obligation). |
| AC-002 | FR-6, FR-7 | Yes | FR-6's text carries all three outcomes — rejected, no account created, states the email is registered. |
| AC-003 | FR-8 | Yes | Rejection before service or repository work; VR-1…VR-3 supply the conditions, VR-3 now with a stated bound. |
| AC-004 | FR-9 | Yes | VR-5 and VR-6 are the asserted policy; VR-7 and VR-8 bound and place it. |
| AC-005 | FR-10 | Yes | Argon2id only, plaintext never persisted. |
| AC-006 | FR-11 | Yes | FR-11 now names the four fields the response carries, so "no other sensitive internal field" is checkable against a closed list rather than an open one. |
| AC-007 | FR-12 | **Yes** | Closed. FR-12 names `{ event: "user.registered", userId, requestId }` and identifies the `event` field as what makes the line distinct — the assertion a test writes. Timing relative to the commit is stated. This row read "Conditionally" from review v4 through v10. |

Reverse coverage checked: FR-13…FR-16, FR-18…FR-24, SR-8, SR-9 and SR-10 map to
no criterion, and each traces to the convention the specification claims — SC-3,
SC-5, AC-9, AC-10, SC-7, PC-1, module-map.md, AD-6, AD-5, SC-6. The
justification paragraph is present and still accurate at v14.

## Security

Every security requirement cites `docs/architecture/security-conventions.md`, a
sibling convention, or an Acceptance Criterion. None is invented, and none
resolves an Open Decision — there is none left open to resolve.

Two v14 changes were checked specifically for a weakening:

- **VR-11 now returns more than v13 did.** `details.fieldErrors` is populated on
  every validation failure, including which password rule failed. VR-11's own
  text keeps the SC-1/SC-9 prohibition and draws the line explicitly — naming
  the rule that failed is not returning the value that failed it. No password
  material reaches the body. Not a weakening.
- **FR-12 now emits after the commit rather than inside the transaction.** This
  is SC-9's decided position and the specification states the accepted
  consequence rather than hiding it: an account can exist with no audit line.
  EC-4 carries the same statement. Correctly recorded as an accepted risk, not
  presented as a guarantee.

SR-1 and SR-2 still defer the Argon2id parameters to SC-1; SR-6 still defers the
never-log list to SC-9. SR-8 ties the rate limit to the explicit hop count and
forbids a blanket `trust proxy: true`.

## Open Decisions

The specification's Open Decisions section lists no blocking id, and that is
correct: no entry in the registry blocks a requirement here. Verified in both
directions.

- **No decision is answered inside the specification.** Every answer v14 states
  is attributed — to the registry entry by id, or to the convention the answer
  was written into (SC-5, SC-9, AD-6). Checked at all eleven consumption sites.
  A requirement stating an answer the registry has already given is consumption,
  not resolution.
- **No open question was dropped.** The registry holds no unanswered entry, and
  the two questions the Story and the clarification report flagged that never
  became registry entries are both still visible: the `.env.example` JWT choice
  is carried again under "Flagged for the gate", explicitly noted as unaddressed
  by the gate's decision rather than settled by silence; and the
  security-events-exhaustiveness question is still recorded as answered by SC-9.
- **The section does not restate registry state.** No count, no version, no
  per-entry status, no origin stage. v14 also removed the word "resolved" from
  its eleven decision citations, leaving the bare id — the citation without the
  status. That is the correct reading of the contract: a status transcribed into
  the specification is registry state, and would be stale the moment an entry
  were reopened.

## Testability

Each criterion is expressed as an observable outcome, and AC-007 is no longer
the exception. AC-005 and AC-006 are assertable against the stored row and the
response body — AC-006 now against a closed four-field list. AC-002 is
assertable against the response and the row count. AC-007 is assertable against
the emitted event's `event` name and its three fields, and against the ordering:
the event follows the commit.

The four error rows v14 changed are assertable as status-plus-carrier pairs:
`415` via `UnsupportedMediaTypeError`, `413` via `PayloadTooLargeError`, the
malformed-JSON `400` via `ValidationError`, and the unknown-property `400` via
the schema.

## Findings

### Critical

None found.

### Major

None found.

### Minor

m-1 (FR-22, Error Handling table, and FR-21) — the specification requires
`express.json()`'s errors to be translated into domain-error classes, but names
no owner for the translation. FR-22 states it in the passive ("its size error is
translated into the `PayloadTooLargeError`"), and the Error Handling table says
the malformed-JSON error "is wrapped in a `ValidationError` at the boundary",
which is AD-6's phrase rather than a component in this document's Affected
Components table. The `415` by contrast has a named owner: the boundary
middleware throws it. This matters more than a placement detail, because an
untranslated `express.json()` error reaching the centralized handler as a plain
library error is exactly the `500` regression OD-US-001-12 was raised about.
What would resolve it: name the layer that owns the translation, as FR-22
already does for the `415`. *Does this change what gets built, or what the gate
decides?* Neither: the translation is stated as required and the class and
status are fixed, so it cannot be silently omitted, and `IMPLEMENTATION_PLANNING`
selects the placement either way. Minor.

m-2 (the revision-14 note in the preamble) — the note miscounts and mislists its
own changes. It names FR-21 among the requirements that "named a decision id",
which FR-21 never did — it changed because AD-6 was amended, not because a
decision it cited was answered — and it omits BR-2, which did name
OD-US-001-10. It says "four Edge Cases" where three changed (EC-2, EC-4, EC-8),
and "three Affected Components rows" where five changed plus the granularity
paragraph. What would resolve it: correct the list and the two counts, or
describe the change without enumerating it. *Does this change what gets built,
or what the gate decides?* Neither — it is a description of the document, and
every section it describes is correct. Minor under the self-describing-section
calibration. Recorded pointedly because a wrong count in a self-describing
section is the exact class of defect that drove eight loop-backs in this chain.

m-3 (FR-5, closing sentence) — "US-003 must keep returning them" places an
obligation on a future Story. It is faithfully carried from the registry
resolution, but it is not a requirement of US-001: nothing this Story builds or
tests can satisfy or violate it. The registry already holds it. What would
resolve it: drop the sentence, or move it to Out of Scope as a note about a
downstream Story rather than a clause of a functional requirement. *Does this
change what gets built, or what the gate decides?* Neither. Minor.

m-4 (FR-5) — the response field list names `id` without saying how it is
represented, while citing AC-11 only for `createdAt`. AC-11 requires identifiers
to be strings, never numbers, and PC-3 carries the same rule; a reader could
take the citation's narrower scope as silence about `id`. What would resolve it:
cite AC-11 for the body rather than for one field, or state the representation
for `id` as it does for `createdAt`. *Does this change what gets built, or what
the gate decides?* Neither — AC-11 governs the document regardless, and
`API_DESIGN` assigns the concrete types. Minor.

## Limitations

- **Review independence.** The specification and its eleven reviews were
  produced in one session by the same model under different Skills, and v14 and
  this review were produced in the same session turn. Every finding here was
  reached from the Story, the registry, the convention documents and the
  repository rather than from the prior review's conclusions, but
  `HUMAN_SPEC_APPROVAL` should not treat this verdict as an independent second
  opinion. This limitation is stronger for v11 than it was for v10, and it is
  the main reason the four Minors are recorded in full rather than waved
  through.
- **The consumption check tests fidelity, not judgement.** This review verified
  that v14 states the answers the registry gives. Whether those answers are the
  right ones was decided by a human at the gate and is not re-litigated here.
- **Not checked.** Whether the values SC-1, SC-3 and SC-5 carry are the right
  values — this review checks that the specification defers to them, not that
  they are well chosen.
- **Unrepaired history, out of scope for this review.** `docs/workflow/history.jsonl`
  carries two hard-coded future timestamps and is missing the
  `SPEC_REVIEW → SPECIFICATION` event for review v8. The log is append-only
  under `docs/workflow/state-schema.md` and was not rewritten. Neither affects
  any requirement in the specification.

## Verdict Rationale

`PASS`. No Critical or Major finding survived verification. All seven Acceptance
Criteria are covered by requirement text that satisfies each criterion's own
condition and outcome, and AC-007 — conditionally covered from review v4 through
v10 — is now fully covered, because FR-12 names the field a test asserts on
rather than deferring it to a decision. Every requirement cites a source; every
answer the specification states is attributed to the registry entry or to the
convention the answer was written into; no decision is answered inside the
document, and no flagged question was dropped.

The four Minor findings travel in `non_blocking_findings` and do not block. A
`PASS` here is not human approval: the orchestrator advances to
`HUMAN_SPEC_APPROVAL`, where a person approves the specification. The decisions
that gate previously had to resolve are already resolved, so what remains for it
is the approval itself and the one item still flagged for it — FR-18's removal
of the four JWT variables from `.env.example`.
