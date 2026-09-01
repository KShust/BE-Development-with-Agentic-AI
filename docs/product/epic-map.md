# Epic Map

Update this map as new epics emerge. Check it before starting a new module or
feature area. Story lifecycle status lives in `docs/catalog/stories.yaml`, never
here.

Every epic states its Goal, Modules, Candidate User Stories, and Depends on.
"Depends on: none" means it can start now; anything else must be resolved first.

Order: EPIC-1 → EPIC-2 → EPIC-3 → EPIC-4. It is a dependency order, not a
schedule — an epic may not start before the ones it depends on are delivered, but
nothing promises the next one starts immediately after.

## EPIC-1

Account Management

### Goal

Allow customers to create and manage their accounts.

### Modules

`auth`, `users`

### Candidate User Stories

- US-001 Customer Registration
- US-002 Customer Login
- US-003 View Customer Profile
- US-004 Update Customer Profile

### Depends on

Nothing. This is the entry epic and the only one startable today.

---

## EPIC-2

Session & Token Lifecycle

### Goal

Keep sessions secure over time: rotate refresh tokens, revoke them on logout,
and detect reuse.

### Modules

`auth`

### Candidate User Stories

- US-005 Refresh Access Token
- US-006 Logout and Token Revocation

### Depends on

EPIC-1 (an authenticated session must exist before it can be refreshed), and the
refresh-token revocation storage Open Decision in `AGENTS.md`.

---

## EPIC-3

Authorization

### Goal

Introduce more than one role, and make every protected operation check the
caller's role rather than only their identity. Today authorization is ownership
only: a customer may act on their own data (SC-4). This epic adds the second
axis.

### Modules

`auth`, `users`

### Candidate User Stories

- US-007 Role Model
- US-008 Administrative User Management

### Depends on

EPIC-1, and the "user roles beyond `CUSTOMER`" Open Decision in `AGENTS.md`.
**Blocked until that decision is resolved** — the goal above describes the shape
of the epic, not an approved requirement, and no Story may be derived from it
yet.

---

## EPIC-4

Security Hardening

### Goal

Improve the platform's security posture beyond the MVP baseline.

### Candidate User Stories

- US-009 Breached-Password Check
- US-010 Account Lockout
- US-011 Audit Logging

### Modules

`auth`, `users`

### Depends on

EPIC-1, plus an Open Decision for US-010 (lockout thresholds) and US-011
(audit-log retention). Resolve the decision before starting that Story.

US-009 no longer needs a decision on length or composition: the password policy
was decided on 2026-09-01 and lives in `docs/architecture/security-conventions.md`
SC-1. What was deliberately deferred to US-009 is the **breached-password
check** — the source (an online service such as HIBP k-anonymity, or a bundled
offline list), the behavior when that source is unreachable, and whether the
check runs at registration only or also on password change. That Story renamed
accordingly; it no longer blocks any part of US-001.
