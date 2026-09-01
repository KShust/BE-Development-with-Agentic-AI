# Global Business Rules

Rules that hold across the whole product. A Story may not contradict one; it may
only extend it through an approved decision.

## BR-001

Customer email must be unique across accounts.

Enforced both in the service layer and by a database `@unique` constraint
(`docs/architecture/persistence-conventions.md` PC-4), so a race cannot create a
duplicate.

---

## BR-002

Customer email comparison is case-insensitive. Email is normalized to lowercase
before it is stored or compared.

---

## BR-003

A customer may own only one account.

In the current model this adds nothing to BR-001 and is enforced by it: a
Customer is identified **solely by their email address**, so "one account per
customer" and "one account per email" are the same statement, and the `@unique`
constraint is the whole enforcement.

It is kept as a separate rule because it says something BR-001 does not — that
the product intends one account per *person*. Nothing today can tell that two
email addresses belong to one person. A Story that needs to (identity merging,
verified alternate addresses, "you already have an account" across addresses)
must raise an Open Decision; it may not infer a stronger identity notion from
this rule.

---

## BR-004

A disabled customer account cannot be authenticated.

**The set of account states is not yet defined.** Only two facts are settled:
registration creates an account that is enabled
(`docs/architecture/security-conventions.md` SC-2), and whatever "disabled"
turns out to mean, it blocks authentication. Whether the field is a boolean or
an enum, and what other states exist (pending verification, locked, closed),
is an Open Decision in `AGENTS.md`.

A Story that only creates enabled accounts — registration is one — is not
blocked by this. A Story that reads, sets, or branches on account state raises
the decision first, and does not invent the enum in a Prisma model.

---

## BR-005

Passwords are never stored in plain text. They are stored only as an Argon2id
hash (`docs/architecture/security-conventions.md` SC-1) and are never returned
by any endpoint.

---

## BR-006

The default role after registration is `CUSTOMER`. It is currently the only
defined role; any additional role is an Open Decision in `AGENTS.md`.

---

## BR-007

System timestamps are stored and compared in UTC, and serialized as ISO 8601
(`docs/architecture/persistence-conventions.md` PC-6).

---

## BR-008

A customer may read and modify only their own data. Identity comes from the
authenticated access token, never from a client-supplied identifier
(`docs/architecture/security-conventions.md` SC-4).

---

## BR-009

**Where it applies.** Any flow in which a person submits an email address they
already believe is theirs, and receives no new account: authentication
(`login`, `refresh`) and account recovery (password reset, and any later
"resend"-style flow). In those flows the response must not reveal whether the
email is registered — the same generic failure is returned for an unknown
account and for a wrong password.

**Where it deliberately does not apply: registration.** A duplicate-email
registration returns `409` with the explicit code `EMAIL_ALREADY_REGISTERED`
(`docs/architecture/api-conventions.md` AC-5, AC-6). Decided by a human on
2026-09-01.

The reasoning, recorded so nobody later "fixes" it as a leak:

- A synchronous registration endpoint cannot be made non-disclosing. Any
  immediate answer to "may I have this address" is an oracle — a different
  status code, a different latency, or simply the account existing afterwards.
- The one design that closes it is: always return the same accepted response,
  and tell the truth by email — welcome-and-confirm to a new address, or
  "someone tried to register with your address" to an existing one. That
  requires email verification and outbound mail, both of which are out of MVP
  scope (`docs/product/product-vision.md`, and US-001's own Out Of Scope).
- Returning a generic `409` without email verification costs a user the ability
  to understand why registration failed while leaving the status-code oracle
  fully intact. It buys nothing.

So the risk is accepted rather than half-mitigated. Registration stays
rate-limited (`docs/architecture/security-conventions.md` SC-3), which bounds
bulk scraping without pretending the oracle is closed.

**This is a decision, not an oversight.** A review that flags the explicit
duplicate-email response as an enumeration finding is wrong; cite this rule.
Reopening it requires a new approved decision, and realistically requires email
verification to land first.
