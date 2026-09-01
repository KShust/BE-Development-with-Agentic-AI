# Non-Functional Requirements

Decided, project-wide quality requirements. Anything not listed here and not in
an architecture convention document is undecided — see `AGENTS.md` Open
Decisions, and do not design against an unstated requirement.

## NFR-001 Security — credentials

Passwords are stored only as an Argon2id hash. Access tokens are short-lived
JWTs; refresh tokens live in `HttpOnly`/`Secure`/`SameSite=Strict` cookies with
rotation and revocation.
(`docs/architecture/security-conventions.md`)

---

## NFR-002 Validation

Every external input — body, params, query, and relevant headers and cookies —
is validated at runtime with Zod at the HTTP boundary. TypeScript types are not
runtime validation.

---

## NFR-003 API design

The REST conventions in `docs/architecture/api-conventions.md` are mandatory:
`/api/v1` base path, resource-oriented URLs, the single error body shape, and
explicit status codes per operation.

---

## NFR-004 Persistence

Prisma models must declare explicit nullability, lengths, uniqueness
constraints, relations, and the indexes required by the queries that use them.
Every schema change ships with a committed migration.
(`docs/architecture/persistence-conventions.md`)

---

## NFR-005 Testing

New functionality includes:

- happy-path tests;
- validation and negative-path tests;
- security tests (sensitive data never returned, protected routes actually
  protected).

Tests are deterministic, independent of execution order, and never run against a
shared or production database.

---

## NFR-006 Traceability

Every implementation is traceable to a User Story, a Specification, and a test
in the Acceptance-Criteria test matrix
(`docs/tests/{story_id}-ac-test-matrix.md`).

---

## NFR-007 Build stability

Every check listed in `AGENTS.md` "Build and Validation Commands" that applies to
a change must pass before that change is considered complete. That table is the
single list; this document does not keep a copy of it, because a copy drifts and
a short copy is worse than none.

The same set runs three times over: `.claude/hooks/validate-full.py` at the end
of any turn that touched code, `.claude/skills/pre-commit-checklist/SKILL.md`
before a commit, and `.github/workflows/ci.yml` on every push and pull request.
The checklist additionally covers the steps that need a reader and have no
command.

---

## NFR-008 Architecture

The `routes → controllers → services → repositories` layering is mandatory, with
the dependency rules in `docs/architecture/module-map.md`.

---

## NFR-009 Type safety

`strict: true` and `noUncheckedIndexedAccess: true` stay on. `any`,
`@ts-ignore`, non-null assertions used to silence the compiler, and casts that
force a shape past type checking are not acceptable ways to make code compile.

---

## NFR-010 Observability

Every request carries a request id that appears in the response headers and in
every log line for that request. Logs are structured (Pino) and never contain
credentials or tokens.

---

## NFR-011 Undecided

Expected load, uptime/SLA targets, latency budgets, and regulatory scope
(GDPR or otherwise) are **not yet defined**. A Story that depends on one of them
must raise the Open Decision rather than assume a target.
