---
id: US-001
epic: EPIC-1
title: Customer Registration
slug: register-customer
priority: HIGH
source:
  type: local_only
  repository: null
  issue_number: null
  issue_url: null
  last_synced_at: null
# Lifecycle status is owned by docs/catalog/stories.yaml (not this file).
---

# User Story

As a **prospective customer**

I want to **register an account with my email and password**

So that **I can access the Customer Portal as an authenticated user**.

---

# Business Value

Allow customers to self-register without administrator involvement.

---

# Context

- Module: `auth`
- Endpoint: `POST /api/v1/auth/register`
- Related NFRs and compliance scope (data retention, GDPR) are not yet defined —
  see Open Decisions in `AGENTS.md`. Do not design around them speculatively.

---

# Acceptance Criteria

## AC-001 Successful Registration

Given a prospective customer provides a valid email and a valid password

When registration is submitted

Then:

- a new account is created;
- the account receives role `CUSTOMER`;
- a success response is returned;
- the customer can authenticate later.

---

## AC-002 Unique Email

Given an account already exists for the submitted email

When registration is attempted

Then:

- the registration is rejected;
- no duplicate account is created;
- the response states that the email is already registered, per
  `docs/product/business-rules.md` BR-009.

> **Amended 2026-09-01 by human decision.** This criterion previously required
> the error *not* to reveal account existence. That was unachievable: a
> synchronous registration endpoint is an enumeration oracle whatever it
> returns, and the only design that closes it needs email verification, which is
> out of MVP scope. The disclosure is now the decided behavior, and BR-009
> carries the reasoning and the accepted risk. The rest of the criterion —
> rejection, and no duplicate account — is unchanged.

---

## AC-003 Email Validation

Given the submitted email is not a valid email format

When registration is attempted

Then the request is rejected with a validation error.

---

## AC-004 Password Validation

Given the submitted password does not meet the password policy

When registration is attempted

Then the request is rejected with a validation error.

> The password policy was decided on 2026-09-01. It is stated once, in
> `docs/architecture/security-conventions.md` SC-1 — read it there; the numbers
> are deliberately not repeated here. Implement exactly that policy: no invented
> threshold, and nothing beyond it. The breached-password check is deliberately
> **not** part of this criterion; it is US-009.

---

## AC-005 Password Storage

Given registration succeeds

When the account is persisted

Then the password is stored only as an Argon2id hash and never in plaintext.

---

## AC-006 Secure Response

Given registration succeeds

When the response is returned

Then it contains neither the password nor the password hash nor any other
sensitive internal field.

---

## AC-007 Audit Logging

Given registration succeeds

When the account is created

Then the event is logged for security audit purposes, distinct from general
request logging and without logging the password
(per `docs/architecture/security-conventions.md` SC-9).

---

# Out Of Scope

- Login, refresh, and logout flows (separate stories).
- Email verification / confirmation flow.
- Password recovery.
- Multi-factor authentication.
- Administrator registration or role assignment (no such role exists — see Open
  Decisions in `AGENTS.md`).
