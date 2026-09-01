---
id: US-003
epic: EPIC-1
title: View Customer Profile
slug: customer-profile-view
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

I want to **view my profile data**

So that **I can verify my information**.

---

# Business Value

Allow customers to self-service basic profile information.

---

# Context

- Module: `users`
- Endpoint: `GET /api/v1/users/me`
- Depends on login (`US-002`) already existing.

---

# Acceptance Criteria

## AC-001 View Own Profile

Given an authenticated customer

When profile information is requested

Then the profile of that customer is returned.

---

## AC-002 Ownership Enforcement

Given an authenticated customer

When the profile endpoint is called

Then the profile is resolved from the authenticated token identity only, and no
request parameter can cause another account to be returned
(per `docs/product/business-rules.md` BR-008).

---

## AC-003 Unauthenticated Access

Given an unauthenticated request

When the profile endpoint is called

Then the request is rejected as unauthorized.

---

## AC-004 Sensitive Data Exclusion

Given profile data is returned

When the response is generated

Then it contains neither the password nor the password hash nor any other
sensitive internal field.

---

## AC-005 Consistent Response

Given profile data is returned

Then the response follows `docs/architecture/api-conventions.md` (status code,
field naming, timestamp format).

---

# Out Of Scope

- Profile update (US-004).
- Role management and account administration.
- Reading another account's profile.
