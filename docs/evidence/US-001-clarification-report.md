---
artifact_type: clarification_report
story: US-001
version: 7
status: DRAFT
created_at: 2026-09-01T20:41:49Z
updated_at: 2026-09-02T13:06:49Z
produced_by: us-clarifier
inputs:
  - path: docs/stories/US-001-register-customer.md
    version: null
  - path: docs/decisions/US-001-open-decisions.md
    version: 7
supersedes: null
---

# US-001 Clarification Report

Input to `spec-writer` at the `SPECIFICATION` stage. It records what the Story
means, what it does not yet say, and what the Specification must cover. It is not
a Specification and defines no requirement of its own.

**Prior work not consumed.** `docs/specifications/US-001-spec.md` and
`docs/reviews/specifications/US-001-spec-review.md` exist and both carry
`status: SUPERSEDED`. They were written before `CLARIFICATION` ran and therefore
have no clarification inputs. This report was produced from the Story and the
product and architecture documents only. The `SPECIFICATION` stage revises that
file against this report; it does not read it as current.

---

## 1. Scope understanding

**Business intent.** A prospective customer creates their own account, with no
operator involvement, and can afterwards authenticate. This is the entry point of
EPIC-1 and the first Story of the product.

**Actor.** Customer (`docs/product/personas.md`) — the only persona in scope.
Administrator is a future persona and no part of this Story.

**Terminology.** The Story speaks of a *Customer* and an *account*; the code
persists one `User` row. Per `docs/product/business-glossary.md`, `Customer`,
`Account`, and `Profile` are three views of that single record. The Specification
uses "Customer" in requirements and `User` in schema and path names, and must not
introduce a second entity.

**Surface.** One endpoint: `POST /api/v1/auth/register`, public
(`security-conventions.md` SC-4 lists registration among the endpoints that do not
require authentication). Module `auth`, which owns credential operations against
the `users`-owned `User` model (`docs/architecture/module-map.md`).

**Position in the codebase.** Every module file under `src/modules/auth/` and
`src/modules/users/`, plus `src/app.ts` and `src/config/env.ts`, is currently a
one-line placeholder comment, and `prisma/schema.prisma` has no datasource,
generator, or model. US-001 is the Story that first makes them real. Naming what
this touches in detail is `IMPACT_ANALYSIS`, not this stage; it is recorded here
only because it changes what "in scope" means — see §5.

**Issues no token.** Registration creates an account; it does not authenticate.
No access token, no refresh cookie, and — per `security-conventions.md` SC-3 —
neither `JWT_ACCESS_TTL` nor `JWT_REFRESH_TTL` is added to `src/config/env.ts` by
this Story.

---

## 2. Already decided — do not re-open

Facts the Specification must cite rather than re-derive, and which a reviewer must
not treat as gaps. Each was decided by a human and is recorded in a canonical
document.

| Area | Decision | Source |
|---|---|---|
| Password policy | 12–128 code points, at least 3 of 4 character classes, every printable character accepted | `security-conventions.md` SC-1 |
| Breached-password check | out of scope, deferred to US-009 | SC-1, Story AC-004 |
| Argon2id parameters | `memoryCost 19456`, `timeCost 2`, `parallelism 1`, as constants in `src/config/env.ts`, passed explicitly on every call | SC-1 |
| Rehash on login | deferred to US-002 | SC-1 |
| Duplicate email discloses | `409` with code `EMAIL_ALREADY_REGISTERED`; registration is the deliberate exception to BR-009 | `business-rules.md` BR-009, `api-conventions.md` AC-6, Story AC-002 amendment |
| No timing equalization on duplicate | duplicate registration short-circuits without hashing the submitted password | SC-3 |
| Register rate limit | 10 requests per hour per IP, via one `express-rate-limit` factory mounted on `/api/v1/auth` and created by this Story | SC-3 |
| Rate limits for other auth routes | not decided, and not to be invented or inherited by US-001 | SC-3 |
| Email uniqueness | service check **and** a database `@unique` constraint | BR-001, PC-4 |
| Email comparison | case-insensitive; normalized to lowercase before storing or comparing | BR-002 |
| Role on registration | `CUSTOMER`, the only defined role | BR-006, SC-2 |
| Password storage | Argon2id hash only, in `password_hash`, `String` with no length bound | BR-005, PC-10 |
| Identifier strategy | `String` `@id @default(uuid())`, exposed as a string | PC-3, AC-11 |
| Timestamps | `createdAt` / `updatedAt`, `timestamptz` UTC, ISO 8601 in JSON | PC-6, BR-007, AC-11 |
| Test database | disposable PostgreSQL on port 5433 locally, GitHub Actions `services: postgres` in CI, schema via `prisma migrate deploy`, serial integration tests with `TRUNCATE` between them | PC-1 |

A review that re-raises one of these as a finding is wrong; the Specification
should cite the source so it cannot be re-litigated downstream.

---

## 3. Ambiguities and contradictions found

Every item is either answered from an existing approved document, or raised as an
Open Decision. Nothing here is answered by this Skill.

### 3.1 Raised as Open Decisions

| # | Gap | Decision | Status |
|---|---|---|---|
| 1 | AC-4 gives registration two conflicting success rows (`201`+`Location` for a create, `200` for `/auth/<action>`) | [OD-US-001-01](../decisions/US-001-open-decisions.md) | **RESOLVED** |
| 2 | AC-006 says what the response body must **not** contain; nothing says what it does | OD-US-001-02 | RESOLVED |
| 3 | Whether registration accepts profile fields, and so whether the first migration carries them | OD-US-001-03 | RESOLVED |
| 4 | No maximum email length exists, yet PC-4 requires an explicit `@db.VarChar(n)` and AD-5 requires the same bound at the boundary | OD-US-001-04 | RESOLVED |
| 5 | Whether the first `User` migration includes an account-state column at all | OD-US-001-05 | RESOLVED |
| 6 | What the AC-007 audit event contains, and what makes it "distinct" | OD-US-001-06 | RESOLVED |
| 7 | No value is defined for the mandatory JSON body size limit | OD-US-001-07 | RESOLVED |
| 8 | Per-IP rate limiting depends on a `trust proxy` topology that is a project-wide Open Decision | OD-US-001-08 | **RESOLVED** |
| 9 | `details.fieldErrors` is described as optional in both AC-6 and SC-1; a contract needs a yes or no | OD-US-001-09 | RESOLVED |

**Two were resolved by a human on 2026-09-01**, after this report's first
revision, and both answers now live in a canonical convention document rather
than in the decision entry:

- registration returns `201 Created` with the created resource body and no
  `Location` header — `api-conventions.md` AC-4;
- two environments, production behind one reverse proxy (`TRUST_PROXY=1`, `0`
  locally and in CI), CORS allow-list carrying the local origin only —
  `security-conventions.md` SC-5, which also closed the project-wide
  environment-topology Open Decision in `AGENTS.md`.

The second one mattered most: until it was answered, the AC-002 rate limit could
be defeated by a spoofed `X-Forwarded-For` header, because a per-IP limit is only
as real as the hop count that produces the IP.

**Two gaps this report missed** were found afterwards by `SPECIFICATION`, which
carried them forward from the version 1 specification review: email whitespace
trimming (OD-US-001-10) and the atomicity of the audit event relative to account
creation (OD-US-001-11). They are recorded in the decision registry and indexed
in §6.

The registry has since been revised again: at v4 it marks OD-US-001-02's
empty-body option foreclosed by the already-resolved OD-US-001-01, which both
specification reviews reported as an option list wider than what was actually
available. This report tracks the registry version so the staleness contract in
`docs/workflow/artifact-schema.md` stays satisfied; §3 and §4 are unchanged in
substance from revision 2.

### 3.2 Resolved from existing artifacts — no decision needed

| Question | Answer, and where it comes from |
|---|---|
| Is the endpoint public? | Yes. SC-4 names registration among the public endpoints. |
| Is the email stored as submitted? | No. Lowercased before storing and comparing (BR-002). |
| What if two identical registrations race? | The service check plus the `@unique` constraint (BR-001, PC-4), with the write inside a transaction where PC-9 applies. The database violation maps to the same `409 EMAIL_ALREADY_REGISTERED`, and no Prisma error text or constraint name reaches the response or a log line (SC-9). |
| Should the duplicate response be genericized to prevent enumeration? | No — explicitly decided against (BR-009). A finding to that effect is wrong by rule. |
| Should duplicate-registration timing be equalized? | No — explicitly decided against (SC-3). |
| Which role value? | `CUSTOMER` (BR-006, SC-2). Only one role exists; no permission model is built. |
| Does the account need an "enabled" value to satisfy SC-2? | SC-2 requires the account to be enabled; whether that is represented by a column is OD-US-001-05. Registration never branches on state, so BR-004 does not block this Story. |
| Where does the password policy live? | Once, as the Zod schema for the password field in the owning module's `<module>.schemas.ts` (SC-1). Not duplicated in the service, and not an environment variable. |
| Is a CSRF token needed? | No. Registration sets no cookie; the refresh cookie and its `SameSite=Strict` reliance belong to later Stories (AC-7). |
| Is the OpenAPI file hand-written? | No. Generated from the Zod schemas (AC-10); `docs/api/openapi.json` is regenerated, never edited. |
| Does an unknown body property pass? | No. Unknown properties are rejected with `400` (AGENTS.md Validation, AC-5). |
| Where is the error mapped to HTTP? | Only in the centralized error middleware (AD-6, AC-12). Controllers do not build error bodies. |

---

## 4. What the Specification must cover

One row per Acceptance Criterion in the Story, plus the cross-cutting items the
Story implies but does not enumerate. `spec-writer` must address every row or
state why it does not apply.

### 4.1 Per Acceptance Criterion

| AC | The Specification must define |
|---|---|
| **AC-001** Successful registration | The request contract (fields, types, bounds — OD-US-001-03, OD-US-001-04); the success status (OD-US-001-01) and body (OD-US-001-02); that the persisted record carries role `CUSTOMER` (BR-006) and is enabled (SC-2, with OD-US-001-05 deciding the representation); and what "can authenticate later" requires of this Story — a stored Argon2id hash US-002 can verify, and nothing more, since US-001 issues no token. |
| **AC-002** Unique email | Both enforcement points (service check and `@unique`, BR-001/PC-4); lowercase normalization before the check (BR-002); the `409` with code `EMAIL_ALREADY_REGISTERED` and its message (AC-5, AC-6, BR-009); the short-circuit without hashing (SC-3); the race outcome mapping to the same response with no Prisma text leaking (SC-9); and an explicit statement that the disclosure is the decided behavior, citing BR-009 so review does not re-open it. |
| **AC-003** Email validation | That validation is Zod at the HTTP boundary (AD-5, NFR-002); the accepted format; the length bound (OD-US-001-04); `400` with the standard error body (AC-5, AC-6) and whether `fieldErrors` is populated (OD-US-001-09); and that a rejected email never reaches the service. |
| **AC-004** Password validation | The policy exactly as SC-1 states it — 12–128 code points, 3 of 4 classes, no alphabet restriction — cited, not restated with new numbers; that length is counted in code points; that the breached-password check is **not** implemented here; the `400` shape; and that no error message or `details` value ever echoes the submitted password (SC-9). |
| **AC-005** Password storage | Argon2id with the SC-1 constants passed explicitly; the `password_hash` column as `String` with no length bound (PC-10) and non-null; that no plaintext is persisted anywhere, including logs; and that hashing happens in the service, never in a controller or repository (AD-2). |
| **AC-006** Secure response | The explicit response DTO (AD-4) and the fields it contains (OD-US-001-02); that the repository query selects only those fields (PC-8); and that `passwordHash` cannot appear in the success body, in an error body, or in `details`. |
| **AC-007** Audit logging | The event's trigger point (after the account is committed), its content and its distinctness mechanism (OD-US-001-06); that it is Pino only with the request id (SC-9, AC-9); that the password never appears; and that audit retention and storage remain the project-wide Open Decision, so this Story writes a log line and builds no audit store. |

### 4.2 Cross-cutting, implied by the Story but not enumerated in it

| Area | The Specification must define |
|---|---|
| Rate limiting | The `express-rate-limit` factory mounted on `/api/v1/auth` with the decided 10-per-hour-per-IP for register; `429` with the standard error body (AC-5); that no limit is set for routes this Story does not create (SC-3); and the dependency on OD-US-001-08 for the client IP to be trustworthy. |
| HTTP hardening | `helmet` on, `X-Powered-By` off, the CORS allow-list and `TRUST_PROXY` values now decided in SC-5 ("Environment topology — decided"), and an explicit JSON body limit (SC-5, AC-2) with its value from OD-US-001-07; the `413` and `415` responses (AC-5). |
| Configuration | Which variables `src/config/env.ts` validates at startup for this Story — `DATABASE_URL` and `CORS_ALLOWED_ORIGINS` at minimum — that the Argon2 parameters are constants there rather than variables (SC-1), that no JWT variable is added (SC-3), and that `.env.example` is updated in the same change (SC-7). |
| Error handling | The centralized error middleware, the typed domain error carrying the `EMAIL_ALREADY_REGISTERED` code from the throw site (AD-6, AC-6), and the generic `500` for anything unmapped. |
| Observability | Request id on every log line and returned in a response header (AC-9, NFR-010); Pino only, no `console.log` in `src/`; redaction configured on the logger rather than per call site (SC-9). |
| Persistence | The `User` model with the PC-4 explicit constraints, PC-5 naming (`@@map("user")`, `@map("password_hash")`), PC-6 timestamps, and the `@unique` index on email — with the note that a `@unique` already provides an index and PC-7 forbids a duplicate one; plus a committed migration (PC-2). |
| Test infrastructure | That US-001 is the Story PC-1 names as the creator of the test-database setup, and therefore owns it — see §5. |
| Traceability | Every Acceptance Criterion mapped to at least one test in the AC test matrix (NFR-006, NFR-005), including the negative and security paths. |

---

## 5. Scope confirmed by a human decision

Raised in revision 1 as a finding about size. **Confirmed by a human on
2026-09-01: the test infrastructure stays in US-001** — it is not split into a
separate infrastructure Story. `spec-writer` scopes all of it here.

`persistence-conventions.md` PC-1 defers the entire test-database setup to "the
first Story that needs database-backed tests", and lists five deliverables:
a `docker-compose.yml` with a `db` service on port 5433 plus `db:test:up` /
`db:test:down` npm scripts added to the `AGENTS.md` command table; `.env.test`
with a matching `.env.example` placeholder; a Vitest `globalSetup` that runs
`prisma migrate deploy` and fails with the command to run when the database is
unreachable; a truncation fixture under `tests/support/`; and a
`services: postgres` block in `.github/workflows/ci.yml`.

US-001 is that Story — AC-002 and AC-005 cannot be tested without a database. So
the Specification carries, on top of the endpoint itself, the project's first
Prisma datasource and model, its first migration, the application bootstrap in
`src/app.ts`, the configuration boundary in `src/config/env.ts`, and this test
infrastructure. `spec-writer` scopes it explicitly rather than letting it surface
during implementation, and `implementation-planner` should expect a plan larger
than the endpoint suggests.

The alternative — a preceding infrastructure Story — was considered and rejected
by the same decision. A `PASS` on this Story's Acceptance Criteria is meaningless
without a database to test against, so the infrastructure would have been built
to satisfy US-001 either way, one workflow pass earlier.

---

## 6. Open Decision index

All twelve entries are `RESOLVED` — the ten that were still open were answered
by a human at `HUMAN_SPEC_APPROVAL` on 2026-09-02, and each entry names where its
answer lives canonically. Full text:
[docs/decisions/US-001-open-decisions.md](../decisions/US-001-open-decisions.md)
(v7).

| Id | Subject | First stage that needs it | Status |
|---|---|---|---|
| OD-US-001-01 | Registration success status code | `API_DESIGN` | RESOLVED — `api-conventions.md` AC-4 |
| OD-US-001-02 | Registration response body | `API_DESIGN` | RESOLVED |
| OD-US-001-03 | Fields beyond email and password | `API_DESIGN` | RESOLVED |
| OD-US-001-04 | Maximum email length | `API_DESIGN` | RESOLVED |
| OD-US-001-05 | Account-state column in the first migration | `DB_DESIGN` | RESOLVED |
| OD-US-001-06 | Registration audit event content | `SPECIFICATION` | RESOLVED |
| OD-US-001-07 | JSON body size limit | `IMPLEMENTATION` | RESOLVED |
| OD-US-001-08 | `trust proxy` topology and CORS allow-list | `IMPLEMENTATION` | RESOLVED — `security-conventions.md` SC-5 |
| OD-US-001-09 | `details.fieldErrors` in validation errors | `API_DESIGN` | RESOLVED |
| OD-US-001-10 | Email whitespace trimming | `API_DESIGN` | RESOLVED — raised at `SPECIFICATION` |
| OD-US-001-11 | Audit-event atomicity with account creation | `IMPLEMENTATION_PLANNING` | RESOLVED — raised at `SPECIFICATION` |
| OD-US-001-12 | What carries `415`, `413` and a malformed-JSON `400` to the error middleware | `API_DESIGN` | RESOLVED — raised at `SPEC_REVIEW` |

They were answered at the specification gate, which is where the workflow places
them. Three of the answers were written into convention documents rather than
into the registry entry alone, because they bind more than this Story:
`security-conventions.md` SC-5 (the body-size limit), SC-9 (what an audit event
carries, and that audit writes are best-effort) and `architecture.md` AD-6 (two
new domain-error subclasses). `OD-US-001-06` was needed one stage earlier, by `SPECIFICATION` itself:
the Specification must state what the AC-007 audit line contains, and since the
decision was still open when that stage ran, it recorded the gap rather than
choosing a field list.

The last two rows are the reason the registry file carries a revision written
outside a stage run. `docs/workflow/stage-map.yaml` routes no `loop_back` to
`CLARIFICATION`, and `us-clarifier` is the only permitted writer of the registry —
so a decision discovered after this stage has no path back into the file through
the workflow. That is a gap in the harness, not in this Story, and it is worth
raising once US-001 clears its gate.
