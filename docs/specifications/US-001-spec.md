---
artifact_type: specification
story: US-001
version: 1
status: SUPERSEDED
created_at: 2026-08-26T00:00:00Z
updated_at: 2026-08-31T00:00:00Z
produced_by: spec-writer
inputs:
  - path: docs/stories/US-001-register-customer.md
    version: null
supersedes: null
---

> **Status: `SUPERSEDED` — prior work, not a current input.** Written before the
> artifact registry existed, by the legacy `story-spec-writer` Skill.
> `CLARIFICATION` has not run for this Story, so this document has no
> `clarification_report` / `open_decisions` inputs and cannot be consistent with
> them. It is `SUPERSEDED` in the sense defined in
> `docs/workflow/artifact-lifecycle.md` §1: an artifact that predates the stage
> that owns it, which that stage must re-produce before anything consumes it.
>
> `spec-writer` at `SPECIFICATION` revises this file in place, raising `version`
> to 2 and `status` to `DRAFT`, using the clarification artifacts — not this
> text — as the authority. Its paired review recorded "needs revision (minor)".
> No downstream stage may read it while it is `SUPERSEDED`.

# Specification: Register User

Source story: `docs/stories/US-001-register-customer.md`

## Functional Requirements

FR-1. When a prospective customer submits a valid email and password to the register endpoint, the system creates a new user account and returns a success response. (per AC 1)

FR-2. When the submitted email already belongs to an existing account, the system rejects the registration request with an error that does not confirm or deny existing-account status in a way that enables account enumeration. (per AC 2)

FR-3. When the submitted email is not a valid email format, the system rejects the request with a validation error. (per AC 3; per `AGENTS.md` Validation — Zod at every boundary)

FR-4. When the submitted password does not meet the password policy, the system rejects the request with a validation error. (per AC 4)

FR-5. On successful account creation, the password is hashed with Argon2id before storage and is never stored or returned in plaintext. (per AC 5; per `AGENTS.md` Authentication, Security & Configuration)

FR-6. The success response for registration does not include the password hash or other sensitive internal fields. (per AC 6; per `AGENTS.md` "Never return raw Prisma entities when they contain internal or sensitive fields" / "Use DTOs for API responses")

FR-7. On successful registration, the system logs the event for security audit purposes, distinct from general request logging, without logging the password. (per AC 7; per `AGENTS.md` Errors & Logging — "Security-relevant events ... MUST be logged for audit purposes" and "NEVER log passwords, tokens, cookies, authorization headers, secrets, or other sensitive values")

> Note: `AGENTS.md`'s own example list of security-relevant events ("login, logout, password change, token revocation") does not name registration explicitly. FR-7 does not depend on that list being exhaustive — AC 7 independently and explicitly requires audit logging for registration, so FR-7 is fully sourced regardless of how that `AGENTS.md` list is read. The `AGENTS.md` citation here is illustrative support, not the sole basis for this requirement.

## Business Rules

BR-1. Passwords MUST be hashed with Argon2id and never stored in plaintext. (per `AGENTS.md` Authentication, Security & Configuration; AC 5)

BR-2. API errors use the standard shape `{ "error": { "code": "CODE", "message": "Message", "details": {} } }`. (per `AGENTS.md` REST API)

BR-3. All external input to the register endpoint (request body) MUST be validated at runtime with Zod. (per `AGENTS.md` Validation; AC 3, AC 4)

BR-4. Sensitive values (password, password hash, tokens, cookies, authorization headers) MUST NOT appear in any log output, including the audit log. (per `AGENTS.md` Errors & Logging; AC 7)

BR-5. Database access for checking and creating user accounts occurs only through the repository layer; routes and controllers MUST NOT access Prisma or contain business logic. (per `AGENTS.md` Architecture Rules)

## Edge Cases

EC-1. The submitted email matches an existing account but differs only in letter casing (e.g. `User@example.com` vs. `user@example.com`) — relates to FR-2. Whether uniqueness comparison is case-sensitive or case-insensitive is not defined by the story or `AGENTS.md` (see Open Questions).

EC-2. The request body omits the `email` or `password` field entirely — relates to FR-3/FR-4/BR-3, handled the same as any other Zod validation failure at the boundary.

EC-3. Two registration requests for the same email are submitted concurrently — relates to FR-2/BR-5. Whichever guarantee prevents two accounts being created for the same email under a race must be enforced at the repository/database layer, not only via an application-level pre-check.

EC-4. The audit-log write (FR-7) fails after the user account record has already been committed (FR-1), or the ordering is reversed — relates to FR-1, FR-7, BR-5. BR-5 fixes the transactional boundary only for checking/creating the user account at the repository layer; it says nothing about whether audit-log emission participates in that same transaction, is a separate best-effort side effect, or must itself be atomic with account creation. Behavior on partial failure (account created but audit log not written, or vice versa) is undefined by the story or `AGENTS.md` (see Open Questions).

## Validation Scenarios

VS-1. Given a valid email and a password meeting the (yet-to-be-defined) password policy, when the register endpoint is called, then a new account is created, the password is stored hashed (Argon2id), and a success response is returned without the password hash or other sensitive fields — relates to FR-1, FR-5, FR-6.

VS-2. Given an email that already belongs to an existing account, when registration is attempted, then the request is rejected with a non-revealing error in the standard error shape — relates to FR-2, BR-2.

VS-3. Given an email string that is not a valid email format, when registration is attempted, then the request is rejected with a validation error in the standard error shape — relates to FR-3, BR-2, BR-3.

VS-4. Given a password that fails the password policy (exact policy undefined — see Open Questions), when registration is attempted, then the request is rejected with a validation error in the standard error shape — relates to FR-4, BR-2, BR-3.

VS-5. Given a successful registration, when the audit log entry is written, then it does not contain the plaintext password or the password hash — relates to FR-7, BR-4.

## Affected Components

| Layer | Component | Why it's affected |
|---|---|---|
| routes | `src/modules/auth/auth.routes.ts` | Wires `POST /api/v1/auth/register` to the controller (FR-1) |
| controllers | `src/modules/auth/auth.controller.ts` | Translates the HTTP request into a service call and shapes the success/error response (FR-1, FR-6, BR-2) |
| services | `src/modules/auth/auth.service.ts` | Business logic: duplicate-email check, Argon2id hashing, account creation, audit-log emission (FR-1, FR-2, FR-5, FR-7) |
| repositories | `src/modules/auth/auth.repository.ts` | All Prisma access: look up existing user by email, persist new user record (FR-1, FR-2, BR-5) |
| validation | `src/modules/auth/auth.schemas.ts` | Zod schema for the register request body — email format and password policy checks (FR-3, FR-4, BR-3) |

## Traceability Matrix

| AC # | AC summary | Covered by |
|---|---|---|
| 1 | Valid email + password → account created, success response | FR-1, VS-1 |
| 2 | Duplicate email → rejected, non-revealing error | FR-2, VS-2 (exact error wording and email normalization for comparison: see Open Questions) |
| 3 | Invalid email format → validation error | FR-3, VS-3 (email normalization and max length boundary: see Open Questions) |
| 4 | Password fails policy → validation error | FR-4, VS-4 (exact policy: see Open Questions) |
| 5 | Password stored hashed (Argon2id), never plaintext | FR-5, VS-1 |
| 6 | Success response excludes password hash/sensitive fields | FR-6, VS-1 (exact DTO shape / which fields count as sensitive: see Open Questions) |
| 7 | Successful registration logged for security audit, without password | FR-7, VS-5, EC-4 (audit-log/account-creation atomicity: see Open Questions) |

## Open Questions

- Exact password policy (minimum length, complexity rules) is not defined in `AGENTS.md` — needed before FR-4/VS-4 can be implemented. (carried from source story)
- Whether email verification is required before the account is usable is not defined. (carried from source story)
- Exact wording/shape of the duplicate-account error, balancing UX clarity against account-enumeration risk, is not decided. (carried from source story)
- Whether and how the submitted email is normalized before either uniqueness comparison (FR-2) or format validation (FR-3) is not addressed by the story or `AGENTS.md`. This bundles three related, undecided points that should likely be resolved together as one "email normalization and validation" decision rather than piecemeal: (1) whether the uniqueness comparison is case-sensitive or case-insensitive (see EC-1); (2) whether leading/trailing whitespace is trimmed before either check (e.g. `"user@example.com "`); (3) whether a maximum email length is enforced — and if so what it is — versus accepting any string that is merely syntactically valid per the format check. All three affect FR-2's uniqueness check, FR-3's format validation, and the repository lookup/uniqueness constraint.
- FR-6 excludes "the password hash or other sensitive internal fields" from the registration success response, but neither AC 6 nor this spec defines the response DTO shape or enumerates which fields beyond the password hash count as sensitive/internal (e.g. internal IDs, internal-only timestamps, soft-delete flags). `AGENTS.md`'s cited principle ("Never return raw Prisma entities... Use DTOs for API responses") establishes that a DTO is required, but not its shape — a concrete DTO definition is needed before FR-6/AC 6 can be implemented or verified.
- Whether audit-log emission (FR-7) must be atomic with account creation (FR-1) — i.e. part of the same transactional guarantee — or is intentionally best-effort/decoupled logging is not defined by the story or `AGENTS.md`. BR-5 fixes the transactional boundary only for the user-account write at the repository layer, not for the audit-log write; this needs a decision before the service/repository layer's error-handling behavior on partial failure can be implemented (see EC-4).
- Rate-limit thresholds for the register endpoint are an open decision in `AGENTS.md` (auth endpoints MUST be rate-limited, but numeric limits are unset) — relevant since register is an authentication endpoint, though rate limiting itself is not in this story's acceptance criteria.
- Audit-log retention and storage strategy is an open decision in `AGENTS.md` — relevant to how FR-7's audit event is persisted long-term.
- Whether GDPR or other regulatory compliance regimes apply is an open decision in `AGENTS.md`, also flagged in the source story's Context section — could affect what account data is permissible to collect/store at registration.
