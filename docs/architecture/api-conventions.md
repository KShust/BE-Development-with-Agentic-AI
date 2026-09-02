# API Conventions

Explicit decisions for the HTTP API in this project. `openapi-designer` and
`design-reviewer` enforce these; `express-implementor` implements to them;
`implementation-verifier` and `security-reviewer` check against them.

## AC-1 Versioning

- URI-path versioning: every endpoint lives under `/api/v1/…`.
- A breaking change to an existing contract requires a new version prefix and an
  approved decision; it is never made in place.
- How v2 would coexist with v1 (parallel routers, deprecation window, sunset
  headers) is an Open Decision — see `AGENTS.md`.

## AC-2 Media type

- Request and response bodies are `application/json` (UTF-8).
- `Content-Type: application/json` is required on any request with a body;
  otherwise respond `415`.
- Request bodies have an explicit size limit (`express.json({ limit })`); an
  oversized body is rejected, never buffered without bound.
- No XML, form-encoded, or multipart support unless a Story's approved design
  adds it explicitly.

## AC-3 Resource naming

- Plural nouns: `/api/v1/users`, `/api/v1/users/{id}`.
- `me` is the canonical self-reference for the authenticated customer
  (`/api/v1/users/me`) — the server resolves identity from the access token and
  never trusts a client-supplied id for "my own" operations.
- kebab-case for multi-word path segments; `camelCase` for JSON field names.
- No verbs in paths, with one deliberate exception: the authentication actions
  under `/api/v1/auth/` (`register`, `login`, `refresh`, `logout`) are session
  operations, not CRUD resources. Any further verb endpoint needs an approved
  design decision.

## AC-4 HTTP methods & success codes

| Method | Use | Success |
|---|---|---|
| `POST /collection` | create | `201 Created`, `Location` header, created resource body |
| `POST /auth/<action>` | session action | `200 OK` (`204` when there is no body, e.g. logout) |
| `GET /collection` | list | `200 OK` |
| `GET /collection/{id}` | read one | `200 OK` |
| `PATCH /collection/{id}` | partial update | `200 OK` |
| `PUT /collection/{id}` | full replace | `200 OK` (or `204` with no body) |
| `DELETE /collection/{id}` | delete | `204 No Content` |

Every endpoint declares its success status explicitly; nothing defaults to `200`
by accident.

**Registration — decided.** `POST /api/v1/auth/register` matches two rows above:
it is a session action under `/auth/` by path and a resource creation by effect.
Resolved by a human on 2026-09-01: it returns **`201 Created` with the created
resource body and no `Location` header**.

The status is `201` because the call creates a durable account, which is what a
client needs to distinguish from an accepted-but-inert `200`. The `Location`
header is omitted because the only canonical URL for the created account is
`/api/v1/users/me` (AC-3), and no Story serves that endpoint until US-003 — a
header pointing at a `404` is worse than no header. A later Story may add it once
the target exists; adding a header is not a breaking change.

This is the single exception to the `POST /auth/<action>` row. `login`,
`refresh`, and `logout` create no resource and keep `200`/`204`.

## AC-5 Error status codes

| Status | When |
|---|---|
| `400 Bad Request` | Zod validation failure, malformed JSON, unknown body property |
| `401 Unauthorized` | authentication required, missing/expired/invalid token |
| `403 Forbidden` | authenticated but not permitted |
| `404 Not Found` | resource does not exist, or is not visible to the caller |
| `409 Conflict` | uniqueness or state conflict (e.g. duplicate email) |
| `413 Payload Too Large` | request body exceeds the configured limit |
| `415 Unsupported Media Type` | missing or wrong `Content-Type` |
| `429 Too Many Requests` | rate limit exceeded |
| `500 Internal Server Error` | unmapped error (must not leak internals) |

## AC-6 Error body

All error responses use exactly this JSON shape:

```json
{
  "error": {
    "code": "EMAIL_ALREADY_REGISTERED",
    "message": "An account with this email already exists.",
    "details": {}
  }
}
```

- `code` is stable, `SCREAMING_SNAKE_CASE`, and part of the contract — renaming
  one is a breaking change.
- The `EMAIL_ALREADY_REGISTERED` example above is the **decided** registration
  behavior, not an accident of the example: `docs/product/business-rules.md`
  BR-009 records why registration discloses and authentication does not. Do not
  genericize it as an enumeration fix.
- `code` is carried by the thrown `DomainError` and supplied at the throw site
  (`architecture.md` AD-6). Its value comes from the Story's approved API design;
  a code invented while coding is a finding, because renaming it later is a
  breaking change.
- `message` is safe for a client to display. What it must never contain is the
  single list in `security-conventions.md` SC-9 — that list is authoritative and
  is not restated here.
- `details` is optional. Validation failures may populate it with
  `{ "fieldErrors": { "<field>": ["<message>"] } }` derived from the Zod issue
  list. It must not expose internal implementation details.
- The request id is returned in a response header (see AC-9) so a client can
  quote it in a bug report; it is not part of the error body.

## AC-7 Authentication

- Stateless JWT access tokens, sent as `Authorization: Bearer <token>`,
  short-lived, signed with an explicitly allow-listed algorithm.
- Refresh tokens are never in a response body: they travel in an `HttpOnly`,
  `Secure`, `SameSite=Strict` cookie, and are rotated on every refresh.
- `POST /api/v1/auth/refresh` and `POST /api/v1/auth/logout` read that cookie;
  every other endpoint authenticates with the access token only.
- CSRF protection for the refresh cookie relies on `SameSite=Strict`; a separate
  CSRF-token mechanism is not added unless a Story's approved design requires it.
- Authentication failures return `401` with a generic message that does not
  reveal whether an account exists (see `security-conventions.md` SC-3).

## AC-8 Pagination

- Any endpoint returning a collection that can grow unbounded must be paginated
  from day one.
- The pagination strategy (cursor vs offset, parameter names, default and
  maximum page size, response envelope) is **not yet decided** — it is an Open
  Decision in `AGENTS.md`. A Story that introduces the first list endpoint must
  resolve that decision first; do not invent a scheme during design or
  implementation.

## AC-9 Correlation

- Every request receives a request id (`src/middleware/requestId.ts`), reuses an
  inbound `X-Request-Id` when present and trusted, and returns it in the
  response headers.
- The same id appears in every log line for that request
  (`security-conventions.md` SC-9).

## AC-10 Contract source of truth

- The OpenAPI document is **generated** from the Zod schemas in
  `<module>.schemas.ts` via `@asteasolutions/zod-to-openapi`. A hand-maintained
  spec file is forbidden.
- Modules register into the shared registry in `src/lib/openapi.ts`.
  `npm run openapi:generate` writes the document to `docs/api/openapi.json`;
  `npm run openapi:check` regenerates it and fails when the committed file is
  stale. Both run through `scripts/generate-openapi.ts`, which discovers
  `src/modules/*/*.schemas.ts` rather than reading a hand-maintained list.
  `openapi:check` runs in the Stop hook and in CI, so drift is a build failure,
  not a review comment.
- The generated document is JSON: it needs no YAML parser and serializes
  canonically, so any diff is a real contract change. The per-Story approved
  contract stays YAML.
- The per-Story `openapi` design artifact
  (`docs/designs/api/{story_id}-openapi.yaml`) is the approved contract for that
  Story's change; the generated document must match it once implemented.
- Any drift between generated OpenAPI and the approved design artifact is a
  finding, resolved by fixing the code or re-running the design stage — never by
  editing the generated document by hand.

## AC-11 Data representation in JSON

- Timestamps are serialized as ISO 8601 with an explicit UTC offset
  (`2026-09-01T08:15:30.000Z`). They are stored and compared in UTC
  (`persistence-conventions.md` PC-6, `docs/product/business-rules.md` BR-007).
  A client-supplied timestamp is parsed as ISO 8601; any other format is a `400`.
- Identifiers are strings, never numbers, so a client cannot infer ordering or
  volume from them (`persistence-conventions.md` PC-3).
- Monetary and decimal values, when the product introduces them, are strings —
  never IEEE floats. No such field exists today; a Story that adds one confirms
  this rule still holds.
- An absent optional field is omitted from the response body rather than sent as
  `null`, unless the approved contract states otherwise for that field.

## AC-12 Error-handling location

Error → HTTP mapping happens only in the centralized error middleware
(`architecture.md` AD-6). Controllers do not `try/catch` to build error
responses, and routes never construct an error body.
