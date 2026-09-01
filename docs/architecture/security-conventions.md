# Security Conventions

Explicit security decisions for this project. `security-reviewer` and
`design-reviewer` enforce these; `spec-writer` cites them; `express-implementor`
implements to them.

> **These are intentional project decisions, not inferred Express/Node
> defaults.** A Story may deviate only through a resolved Open Decision approved
> by a human.

## Project security policy

```yaml
authentication_model: stateless JWT access token + rotated refresh cookie
access_token:
  transport: Authorization: Bearer
  algorithm: explicitly configured allow-list (never taken from the token header)
  lifetime: short-lived (configured via JWT_ACCESS_TTL)
refresh_token:
  transport: HttpOnly + Secure + SameSite=Strict cookie
  rotation: required on every refresh
  revocation: required (storage mechanism is an Open Decision)
  storage: hashed at rest, never plaintext
password_hashing:
  algorithm: Argon2id
  cost_parameters:               # DECIDED 2026-09-01 (SC-1); constant, not env
    memory_cost: 19456           # KiB (19 MiB)
    time_cost: 2
    parallelism: 1
  rehash_on_login: deferred to US-002
password_policy:
  status: DECIDED 2026-09-01 (SC-1)
  min_length: 12                 # Unicode code points, not bytes
  max_length: 128
  composition: at least 3 of 4 classes (lowercase, uppercase, digit, other)
  alphabet: every printable character, spaces and non-ASCII included
  breached_password_check: out of scope - deferred to US-009
  rotation_expiry_history: not defined; do not infer one
rate_limiting:
  shape: one express-rate-limit factory on /api/v1/auth (created by US-001)
  register: 10 per hour per IP     # DECIDED 2026-09-01 (SC-3)
  login_refresh_logout: NOT DECIDED - set by the Story that adds the endpoint
csrf:
  refresh_cookie: SameSite=Strict (no separate CSRF token unless a Story requires it)
transport:
  production: HTTPS only
secrets:
  source: environment variables only
  committed_to_repository: forbidden
database_schema:
  allowed: prisma migrate dev (local), prisma migrate deploy (deployed)
  forbidden: prisma db push against a shared database; editing an applied migration
```

## SC-1 Passwords

- Hash with Argon2id (`argon2` package). A plaintext or reversible scheme is
  forbidden.
- **Cost parameters — decided** by a human on 2026-09-01:
  `memoryCost: 19456` (19 MiB), `timeCost: 2`, `parallelism: 1`. These are the
  balanced option from the OWASP Password Storage Cheat Sheet. The low
  per-hash memory is the point: an authentication endpoint may hash many
  passwords concurrently, and a 46 or 64 MiB setting turns a burst of logins into
  memory pressure.
  - They are a **constant in `src/config/env.ts`**, not environment variables.
    The same values run in every environment, and changing one is a commit and a
    review. An env var would let an ops mistake silently weaken hashing in
    production, where nothing would ever detect it.
  - The library's own defaults are deliberately not used. "The current default"
    is not a decision: it moves between releases, so two builds of the same code
    would hash differently and nothing would catch it. Pass all three explicitly
    on every call.
  - Raising them later is expected as hardware improves. Re-hashing an existing
    password on successful login (`argon2.needsRehash()`) is **deferred to
    US-002**, which owns login; the encoded hash carries its own parameters, so
    no schema column is needed for it.
- **Password policy — decided.** Resolved by a human on 2026-09-01; it is no
  longer an Open Decision. Validation code implements exactly this and nothing
  more:

  | Rule | Value |
  |---|---|
  | Minimum length | 12 characters |
  | Maximum length | 128 characters |
  | Composition | at least **3 of the 4** character classes below |
  | Breached-password check | **not in scope** — deferred to US-009 |

  The four classes, evaluated over the whole password:

  1. a lowercase letter (Unicode `Ll`);
  2. an uppercase letter (Unicode `Lu`);
  3. a digit `0-9`;
  4. anything else — punctuation, symbol, or space.

  Every printable character is accepted, including spaces and non-ASCII: the
  classes decide whether a password passes, they never restrict the alphabet.
  Length is counted in Unicode code points, not bytes, so a 12-character
  Cyrillic password is 12 — not 24.

  **Known limitation of the 3-of-4 rule:** a script without letter case (Chinese,
  Japanese, Korean, Hebrew, Arabic) can reach at most two classes, so a long
  password written only in one of them is rejected however strong it is. Nothing
  in current scope serves those users. If a Story ever needs to, that is a new
  Open Decision — do not quietly carve out an exception in validation code.

  The policy is defined once, as the Zod schema for the password field in the
  owning module's `<module>.schemas.ts`, and enforced at the HTTP boundary
  (`architecture.md` AD-5). It is not an environment variable: it is part of the
  API contract, not a deployment knob. A rejection is `400` with the standard
  error body (`api-conventions.md` AC-6); `details.fieldErrors.password` may name
  which rule failed, and never echoes the submitted password
  (`security-conventions.md` SC-9).

  Not decided here, and not to be inferred from it: password rotation or expiry,
  password history, and account lockout. No Story may add one without its own
  approved decision.
- Plaintext passwords are accepted only in the inbound request body: never
  persisted, never logged, never returned, never placed on a response DTO, never
  included in an error `details` object.
- The hash is stored in `password_hash` (see `persistence-conventions.md` PC-10)
  and is never returned by any endpoint.
- Password comparison uses the library's verify function; never a string
  equality check.

## SC-2 Roles

- `CUSTOMER` — the default role on registration, and the only role currently
  defined.
- Any additional role (administrator, support) is an **Open Decision** — see
  `AGENTS.md`. Do not add a role, a permission model, or role checks
  speculatively.
- Default account state on registration: enabled, unless a Story's approved
  design says otherwise.

## SC-3 Authentication

- Access tokens are verified on every protected request by shared auth
  middleware, using an explicitly allow-listed signing algorithm and verified
  issuer/audience where configured. The `alg` value in an inbound token is never
  trusted.
- Token secrets come from `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` via
  `src/config/env.ts`; startup fails when they are missing.
- Refresh tokens live only in the `HttpOnly`, `Secure`, `SameSite=Strict`
  cookie, are rotated on every use, and the previous token is revoked. Reuse of
  an already-rotated refresh token is treated as compromise: revoke the family
  and require re-authentication.
- Failed authentication returns `401` with the standard error body and a
  message that does not reveal whether the email exists (`business-rules.md`
  BR-009). Response timing for "unknown email" and "wrong password" must be
  comparable — no early return that skips the hash verification (see SC-1).
- **The timing rule above is scoped to authentication and recovery flows, and
  deliberately does not extend to registration.** A duplicate-email registration
  short-circuits: it returns `409` without hashing the submitted password.
  Decided by a human on 2026-09-01, together with BR-009's registration
  exception. Equalizing timing there would burn Argon2id CPU on every junk
  request to hide a fact the response states outright, and would widen the
  denial-of-service surface on an unauthenticated endpoint. Do not "harden" this
  into constant-time behavior without a new approved decision.
- **Rate limiting — decided** by a human on 2026-09-01.
  - **Shape**: one `express-rate-limit` factory, mounted as middleware on
    `/api/v1/auth` in `src/app.ts`, created by US-001. Every later auth Story
    inherits it instead of adding its own limiter — that is the point of putting
    it there rather than on a single route.
  - **Numbers are per endpoint, not one shared bucket.** A single bucket across
    `/auth/*` cannot work: `refresh` is called whenever an access token expires,
    several times an hour per active session and more behind NAT, while
    `register` is called once in a customer's lifetime. One limit would either
    break sessions or fail to limit registration.
  - **Decided so far**: `POST /auth/register` — **10 requests per hour per IP**.
    Chosen over a stricter 5-per-15-minutes because a real person registers once
    while an office or mobile-carrier NAT presents many people as one IP.
  - **Not yet decided**: the numbers for `login`, `refresh`, and `logout`. Each
    is set by the Story that introduces the endpoint, as an Open Decision raised
    at that time. US-001 must not invent them, and must not apply the register
    number to routes it does not create.
  - Exceeding a limit returns `429` with the standard error body
    (`api-conventions.md` AC-5).
- Account-lockout policy beyond rate limiting remains an Open Decision — do not
  invent thresholds.

## SC-4 Authorization

- Deny by default: every endpoint requires authentication unless the approved
  API design lists it as public (registration, login, refresh, health).
- Authentication and authorization are separate concerns: the auth middleware
  establishes identity; the service layer enforces what that identity may do.
- Ownership checks (a customer may act only on their own data) are enforced in
  the service layer from the token identity — never from a client-supplied id
  (see `api-conventions.md` AC-3, the `me` rule).

## SC-5 HTTP hardening

- `helmet` is enabled; Express `X-Powered-By` is disabled.
- CORS uses an explicit allow-list of origins from `CORS_ALLOWED_ORIGINS`.
  `origin: "*"` together with `credentials: true` is forbidden.
- `trust proxy` is configured explicitly for the real production proxy topology.
  Blanket `trust proxy: true` is forbidden — it lets a client spoof the client
  IP that rate limiting depends on.
- An explicit JSON body size limit is configured; unlimited payloads are not
  accepted.
- Production traffic is HTTPS only; the refresh cookie's `Secure` flag depends
  on it.

## SC-6 Dependencies

- New dependencies require explicit human approval, with a stated reason.
- Known vulnerabilities are checked by `npm run audit:check`, which runs in CI on
  every push and pull request and is a blocking step. It fails on any
  high/critical advisory that is not accepted by id in `.audit-allowlist.json`,
  and equally on a listed one that has since been fixed upstream, so the
  exception list cannot quietly rot.
- Accepting an advisory is a security decision, not a formality: the allowlist
  entry records why the risk is tolerable and when it is re-checked. Never add an
  entry to make the gate pass.
- `package-lock.json` is committed and updated only when a dependency actually
  changes.

## SC-7 Secrets & repository hygiene

- No credentials, tokens, private keys, or `.env` files are committed.
- All secrets come from environment variables, validated at startup in
  `src/config/env.ts`. `.env.example` lists every required variable with a safe
  placeholder and is updated in the same change that adds one.
- `.gitignore` covers `.env`, `node_modules/`, `dist/`, `coverage/`, and logs.

## SC-8 Schema safety

- Schema changes reach a database only through a committed Prisma migration
  (`persistence-conventions.md` PC-2). `prisma db push` against a shared
  database and edits to applied migrations are forbidden — both can silently
  destroy or diverge schema.
- A destructive migration needs an explicit recorded human decision.

## SC-9 Error & log hygiene

**The list below is the single authoritative one.** `api-conventions.md` AC-6,
`architecture.md` AD-6, and every Skill cite it; none of them restates it. Add an
item here, not in a copy.

Never present in a response body, an error `message`, an error `details` object,
or a log line:

- stack traces;
- SQL, and Prisma error text — including constraint names and error codes;
- database URLs or any connection string;
- internal module, file, or symbol paths;
- passwords, password hashes, tokens, cookies, `Authorization` headers;
- any other secret or credential;
- full credential-bearing request bodies.

- Error responses follow `api-conventions.md` AC-6. Unexpected errors return a
  generic `500` body; diagnostics stay server-side.
- Logging is Pino only; `console.log`/`console.error` must not appear in `src/`.
- Redaction is configured on the logger rather than left to discipline at each
  call site.
- Every log line carries the request id (`api-conventions.md` AC-9).
- Security-relevant events (registration, login success/failure, logout,
  password change, token rotation and revocation) are logged for audit,
  distinct from general request logging. Audit-log retention and storage
  location are an Open Decision.
