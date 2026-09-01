# Product Vision

## Product Name

Customer Portal

---

# Vision

Customer Portal is a backend REST API that lets customers register accounts,
authenticate, and manage their personal information, and that later serves as
the foundation for the company's broader self-service portal.

The API is delivered through an artifact-driven workflow: every change is
traceable to a User Story, a Specification, and an approved design (see
`docs/workflow/stages.md`).

---

# Business Goal

Provide customers with a secure and convenient way to:

- create accounts;
- authenticate;
- manage personal information;
- access customer services.

---

# Target Users

Primary users:

- Customers (self-service, registered)

Future users:

- Customer Support Representatives
- Administrators

No admin/staff role distinction exists yet. Roles beyond `CUSTOMER` are an Open
Decision — see `AGENTS.md`. Do not design or scaffold for them speculatively.

---

# Success Criteria

**MVP Scope below says what gets built. This section says how we know it
worked.** Each criterion is observable from outside the system; none restates a
feature.

- A person with no prior account can go from "no account" to "authenticated
  request accepted" without any manual step by an operator.
- A session survives access-token expiry without the customer re-entering a
  password, and a stolen refresh token stops working once it has been rotated.
- A customer can see and correct their own personal data, and cannot reach
  anyone else's.
- No credential is recoverable from the database, from a log, from an API
  response, or from an error body.
- Every delivered endpoint is traceable to a User Story, an approved
  Specification, and at least one Acceptance-Criterion test (NFR-006).

Quantitative targets — how fast, how many, what uptime — are deliberately absent:
they are undecided (`non-functional-requirements.md` NFR-011). Do not invent one
to make a criterion measurable.

---

# MVP Scope

What is built to satisfy the criteria above. The initial MVP is the `auth` and
`users` modules only:

- Registration
- Login / refresh / logout
- Customer profile (view, update)
- Baseline security (Argon2id password hashing, JWT access tokens, rotated
  refresh cookies, rate limiting, Helmet, CORS allow-list)

---

# Out of Scope

Intentionally excluded from the MVP:

- Multi-factor authentication
- Social login
- Password recovery
- Email verification
- Customer Support Portal
- Billing
- Notifications
- Document management

# Future modules

`products`, `orders`, and `support` are named here only so the module boundary is
predictable. Do not scaffold, stub, or design for them until a Story requests
them.

# Non-functional requirements & compliance

Expected load, uptime/SLA targets, and regulatory scope (e.g. GDPR, given that
registration collects personal data) are not yet defined. See
`docs/product/non-functional-requirements.md` for what *is* decided and
`AGENTS.md` Open Decisions for what is not. Do not design against unstated
NFRs or compliance requirements.

# Epic map

Epics and their candidate Stories live in `docs/product/epic-map.md`. Check it
before starting a new module or feature area to see how the work fits the
product.
