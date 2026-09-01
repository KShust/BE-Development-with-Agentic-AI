---
id: US-004
epic: EPIC-1
title: Update Customer Profile
slug: customer-profile-update
priority: MEDIUM
source:
  type: local_only
  repository: null
  issue_number: null
  issue_url: null
  last_synced_at: null
# Lifecycle status is owned by docs/catalog/stories.yaml (not this file).
---

# User Story

As an **authenticated customer**

I want to **update my profile information**

So that **my account details stay current**.

---

# Business Value

Keep customer data accurate without support involvement.

---

# Context

- Module: `users`
- Endpoint: `PATCH /api/v1/users/me`
- Depends on profile view (`US-003`) already existing.

---

# Acceptance Criteria

## AC-001 Successful Update

Given an authenticated customer submits a profile update with valid data

When the update is submitted

Then the profile is updated and the updated profile is returned.

---

## AC-002 Unauthenticated Access

Given an unauthenticated request

When the update endpoint is called

Then the request is rejected as unauthorized.

---

## AC-003 Validation

Given invalid data in the update request

When it is submitted

Then it is rejected with a validation error and nothing is persisted.

---

## AC-004 Ownership Enforcement

Given an authenticated customer

When the update endpoint is called

Then only the account identified by the access token can be modified
(per `docs/product/business-rules.md` BR-008).

---

## AC-005 Secure Response

Given the update succeeds

When the response is returned

Then it contains no sensitive internal field.

---

# Out Of Scope

- Changing email or password (a separate concern with its own security
  requirements).
- Account deletion or deactivation.

---

# Open Questions

- Which profile fields are editable through this endpoint is not enumerated in
  this Story and must be resolved during `CLARIFICATION`.
