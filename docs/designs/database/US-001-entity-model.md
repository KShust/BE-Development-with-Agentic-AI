---
artifact_type: entity_model
story: US-001
version: 1
status: APPROVED
created_at: 2026-09-02T16:44:33Z
updated_at: 2026-09-02T18:32:49Z
produced_by: db-designer
inputs:
  - path: docs/specifications/US-001-spec.md
    version: 14
  - path: docs/designs/api/US-001-api-design.md
    version: 1
    assessed_version: 2
    assessment: >
      Revision 2 of the API design answers design review d-1 and d-2, both of
      which live entirely in the error model: a carrier for the 429 (the rate
      limiter's handler raising a TooManyRequestsError under the AD-6 amendment
      in commit fa21f62), and the assignment of a valid-JSON non-object body to
      the VALIDATION_FAILED branch, with a minimum of one property added to the
      FieldErrors schema. This document maps entities and attributes to the
      request and response objects and to the business language; it maps
      nothing to an error body, and no error response names a persisted
      attribute. Both request and response objects are byte identical between
      v1 and v2, so every row of the mapping table below still cites an
      unchanged declaration. Content is therefore unrevised and the version is
      unchanged.
  - path: docs/designs/api/US-001-openapi.yaml
    version: 1
    assessed_version: 2
    assessment: >
      The whole v1-to-v2 diff of the contract is the info version, two response
      descriptions (400 and 429), and a minimum of one property on the
      FieldErrors schema. The RegisterRequest and RegisterResponse objects,
      which are the only schemas this document maps attributes to, are
      identical in both versions - including the email bound, the uuid format
      on id, the constant role and the date-time createdAt that four rows of
      the mapping table depend on.
  - path: docs/reviews/designs/US-001-design-review.md
    version: 1
  - path: docs/decisions/US-001-open-decisions.md
    version: 7
supersedes: null
---

# Entity Model: Customer Registration

The entity/attribute model for US-001 and its mapping to the business language
and to the API contract. The constraints, indexes, migration intent and
sensitive-data handling are in the paired
`docs/designs/database/US-001-db-design.md`; this document is the conceptual
half and does not restate them.

## Entities in scope

**One: `User`.** Nothing else is persisted by this Story.

`docs/product/business-glossary.md` settles this and is not re-litigated here:
Customer, Account and Profile are three views of one record, and BR-003 — a
customer may own only one account — is what makes that true. The glossary
requires a design that splits them to say so explicitly and record the reason.
This design does not split them, so there is one table.

| Business term | Entity | Why it is not its own entity |
|---|---|---|
| Customer | `User` | A business actor, not a stored thing. What is persisted for a Customer is a `User` row (glossary, *Customer*) |
| Account | `User` | The credential aspect of the same row: email, password hash, role (glossary, *Account*) |
| Profile | `User` | The personal-data aspect of the same row. This Story persists no profile attribute — see Deliberately absent |
| Role | `User.role` | An attribute of the row, not a related entity. The glossary types it as an enum with only `CUSTOMER` defined |
| Session | — | `RefreshToken`, planned. Registration issues no token and sets no cookie (BR-4), so no session entity exists yet |

## Attributes

| Attribute | Business meaning | Source |
|---|---|---|
| `id` | The account's opaque identifier, safe to place in an API path | PC-3; AC-11 |
| `email` | The address the Customer registers with, and the natural key uniqueness is enforced on | FR-1, FR-2, BR-1, BR-002 |
| `passwordHash` | The Argon2id hash of the submitted password. The plaintext is never an attribute of anything persisted | FR-10, SR-1, SR-4; SC-1, PC-10 |
| `role` | The permission group. `CUSTOMER` on registration, the only value defined | FR-3; SC-2, BR-006 |
| `createdAt` | When the account came into existence. Returned to the client on registration | FR-5; PC-6, AC-11 |
| `updatedAt` | When the row last changed. Not returned by any endpoint this Story serves | PC-6 |

`updatedAt` is carried because PC-6 requires it on every model, not because a
requirement in this Story reads it. That is recorded rather than left implicit:
it is the one attribute here with no functional requirement behind it, and a
reviewer should see it was placed by convention.

## Relationships

**None.** `User` has no foreign key, no relation field, and no dependent entity
in this Story. There is nothing else in the schema to relate to: this is the
project's first model (`prisma/schema.prisma` currently holds a two-line
placeholder and no datasource).

The next relation to arrive is `User` ↔ `RefreshToken`, when the Story that
introduces refresh tokens adds them. It is named here only so that its absence
now is visibly a consequence of scope rather than an omission; this design
declares nothing on its behalf.

## Identity and cardinality

- One `User` row per registered Customer. BR-003 makes the relationship
  Customer-to-Account one-to-one, and `email` unique is what enforces it, since
  a Customer is identified by the address they register with (BR-001, BR-1).
- `id` is a surrogate key; `email` is a natural key with a uniqueness constraint
  rather than a primary key (PC-3).
- The uniqueness comparison is over the **normalized** email — trimmed of
  leading and trailing whitespace, then lowercased (BR-2, VR-4). The normalized
  value is the value stored, so the constraint compares exactly what the
  application compared. EC-1 and EC-2 are the two cases this makes work: a
  duplicate differing only in letter case, and one differing only by a
  surrounding space.

## Mapping to the API contract

`docs/designs/api/US-001-openapi.yaml` is the contract. Every field it declares
resolves to an attribute above, and every attribute is accounted for in one
direction or the other.

| API field | Direction | Attribute | Notes |
|---|---|---|---|
| `RegisterRequest.email` | in | `email` | Normalized at the boundary before it reaches the service; the 254 bound is the same number on both sides (VR-3) |
| `RegisterRequest.password` | in | — | Never persisted. It reaches `passwordHash` only as an Argon2id digest, and exists nowhere else (SR-3) |
| `RegisterResponse.id` | out | `id` | Contract says `string` / `format: uuid`; the column is a native `uuid` and Prisma surfaces it as a string |
| `RegisterResponse.email` | out | `email` | The stored, normalized value — which is why the contract warns it may differ from what was submitted |
| `RegisterResponse.role` | out | `role` | Contract says `const: CUSTOMER`; the enum has exactly that one value today |
| `RegisterResponse.createdAt` | out | `createdAt` | Contract says ISO 8601 with an explicit UTC offset; the column is `timestamptz` and PC-6 requires UTC end to end |
| — | — | `passwordHash` | **Returned by no endpoint** (SR-4, PC-10). The repository does not select it on the registration path at all |
| — | — | `updatedAt` | Not in the contract. This Story exposes it nowhere |

The response DTO is exactly the four fields FR-5 names, and the repository
selects exactly those four on the write path (PC-8), so `passwordHash` never
leaves the repository on this route rather than being dropped later by a mapper.

## Deliberately absent

Each of these was decided, not overlooked. A reviewer checking the model against
the Specification will find each named as excluded.

| Not persisted | Why | Source |
|---|---|---|
| Account-state column | Registration needs only "enabled", and that is represented by the row existing. Whether the state model is a boolean or an enum is a project-wide Open Decision that US-002 resolves when it first has to reject a disabled account; choosing here would pre-empt it and cost a migration if it resolves the other way | FR-4; OD-US-001-05; BR-004 |
| Any profile column (name, phone, address, …) | Registration collects email and password only. Profile columns arrive with US-003 / US-004 in their own migration | VR-9; OD-US-001-03 |
| Email-verified flag or confirmation token | Email verification is out of scope for the Story and for the product vision, and is a project-wide Open Decision | Specification, Out of Scope |
| Any token, session, or refresh-token entity | Registration issues no token and sets no cookie | BR-4; SC-3 |
| Last-login, login-attempt counter, lockout fields | Account lockout is an undecided project-wide policy and nothing here may infer one | SC-1; `AGENTS.md` Open Decisions |
| A separate `Customer`, `Account`, or `Profile` table | The glossary defines all three as views of one row and requires an explicit recorded reason to split them. There is none | Business glossary |

## Open questions

None. Every attribute, constraint and exclusion above traces to a requirement,
a resolved decision, or a convention. The two findings this stage recorded are
about the Prisma 7 connection mechanism and are carried in the paired
`US-001-db-design.md`; neither changes the entity model.
