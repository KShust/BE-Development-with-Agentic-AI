# Business Glossary

The ubiquitous language of this product. Where a business word and a code name
differ, the mapping is stated here — a term whose code name is not recorded is
not yet defined.

## Term to model map

| Business term | In the code | Notes |
|---|---|---|
| Customer | — | a person, not a stored entity |
| Account | `User` | the credential aspect of the same record |
| Profile | `User` | the personal-data aspect of the same record |
| Session | `RefreshToken` (planned) | created by the Story that adds refresh |
| Role | `User.role` | enum; only `CUSTOMER` defined today |

`Customer`, `Account`, and `Profile` are three views of **one** persisted
record, not three tables — BR-003 ("a customer may own only one account") is
what makes that true. `db-designer` owns the actual model: a Story whose
approved database design needs to split them must say so explicitly and record
the reason. Until such a design is approved, assume one `User` row.

---

## Customer

A person who owns an account in the Customer Portal. The only user type the MVP
serves. A business actor, not a stored entity: what is persisted for a Customer
is a `User` record.

---

## User

**The persisted model.** Prisma model `User`, table `user`
(`persistence-conventions.md` PC-5), exposed under `/api/v1/users`. It is the
single record that carries everything a Customer has: identity (`id`, `email`),
credentials (`password_hash`), account state, role, and audit timestamps.

The module that owns it is `users`; `auth` owns the credential operations
performed against it.

Use **`User`** when writing code, schema, or an API path. Use **Customer** when
writing a requirement, an Acceptance Criterion, or a business rule. They refer to
the same subject at different layers; neither is a synonym for the other in its
own layer.

---

## Account

The **credential aspect** of a `User`: email, Argon2id password hash, account
state, and role. Not a separate entity and not a separate table — "the customer's
account" and "the customer's `User` record" name the same row.

The allowed account states are **not yet defined**: BR-004 refers to a disabled
account and `security-conventions.md` SC-2 sets the default to enabled, but no
enumeration exists. A Story that reads or changes account state raises an Open
Decision rather than inventing the set.

---

## Registration

The process of creating a new customer account
(`POST /api/v1/auth/register`).

---

## Authentication

The process of verifying customer identity and issuing an access token plus a
refresh cookie (`POST /api/v1/auth/login`).

---

## Access token

A short-lived JWT sent by the client as `Authorization: Bearer <token>`. Proves
identity for a single request. Never stored server-side.

---

## Refresh token

A long-lived credential delivered only in an `HttpOnly`, `Secure`,
`SameSite=Strict` cookie, rotated on every use and revocable. Never returned in
a response body.

---

## Session

The pairing of a valid refresh token with the account it belongs to. Ends on
logout, on revocation, or when the refresh token expires.

---

## Authorization

The process of determining what actions an authenticated customer may perform.
Separate from authentication.

---

## Profile

The **personal-data aspect** of a `User` — the fields a customer may read and
change about themselves, exposed through `/api/v1/users/me`. A projection of the
same record, never a separate entity; credential fields are excluded from it by
`architecture.md` AD-4.

---

## Role

A permission group assigned to an account.

Currently defined:

- `CUSTOMER` — default on registration.

Any further role (for example an administrator role) is an Open Decision in
`AGENTS.md` and does not exist in the system today.

---

## Administrator

An internal user responsible for platform administration. A future persona: no
administrator role, endpoint, or permission exists in the current scope. Defined
here only so the word has one meaning if it appears; see `personas.md`.
