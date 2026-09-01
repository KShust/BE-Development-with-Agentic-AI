---
id: US-002
epic: EPIC-1
title: Customer Login
slug: customer-login
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

As a **registered customer**

I want to **log in with my email and password**

So that **I can access my account and authenticated endpoints**.

---

# Business Value

Allow registered customers to reach protected functionality securely.

---

# Context

- Module: `auth`
- Endpoint: `POST /api/v1/auth/login`
- Depends on registration (`US-001`) already existing.

---

# Acceptance Criteria

## AC-001 Successful Login

Given a registered, enabled customer submits their correct email and password

When login is submitted

Then:

- authentication succeeds;
- an access token is returned;
- a refresh token is set as an `HttpOnly`, `Secure`, `SameSite=Strict` cookie.

---

## AC-002 Unknown Account

Given no account exists for the submitted email

When login is attempted

Then authentication fails with a generic invalid-credentials error that does not
reveal whether the email is registered.

---

## AC-003 Invalid Password

Given the submitted password does not match the account

When login is attempted

Then authentication fails with the same generic invalid-credentials error as
AC-002.

---

## AC-004 Disabled Account

Given the account is disabled

When login is attempted

Then authentication fails (per `docs/product/business-rules.md` BR-004).

---

## AC-005 Secure Authentication Response

Given authentication succeeds

When the response is returned

Then the body contains neither the password hash nor the refresh token value,
nor any other sensitive internal field.

---

## AC-006 Audit Logging

Given a login attempt occurs, successful or failed

When it is processed

Then the event is logged for security audit purposes, without logging the
password (per `docs/architecture/security-conventions.md` SC-9).

---

# Out Of Scope

- Registration, refresh, and logout flows (separate stories).
- Multi-factor authentication, OAuth, social login.
- Password recovery.
- Account lockout behavior beyond the general authentication rate limiting —
  the lockout policy is an unresolved Open Decision in `AGENTS.md`.
