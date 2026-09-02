---
artifact_type: findings_triage
story: US-001
version: 1
status: APPROVED
created_at: 2026-09-03T01:12:00Z
updated_at: 2026-09-03T01:12:00Z
produced_by: human:KShust
inputs:
  - path: docs/workflow/workflow-state.yaml
    version: null
supersedes: null
---

# US-001 — triage of the free-text findings

Decided by KShust on 2026-09-03. This is the human pass
`.claude/skills/story-orchestrator/SKILL.md` requires before the free-text
`non_blocking_findings` may be migrated: the conversion itself is mechanical and
must not judge whether an entry is still open, so the judgement is recorded here
instead.

`story-orchestrator` applies this on its next transition, in place of the
default `LEGACY:*` conversion. Findings not listed here are dropped.

**49 free-text entries collapse to 20 findings** — 11 open, 9 accepted. The rest
were either already closed, or were never findings.

## Three corrections found by execution, not by reading

Recorded because they are the reason this pass exists.

1. **`SPECIFICATION:FR-18` was recorded as done and is not done.** The entry
   reads "the four JWT variables *are removed* from `.env.example`", in the
   present tense. All four are still there — `.env.example` lines 16, 17, 19,
   20. It is an obligation on implementation, not a settled fact. A mechanical
   migration would have closed it and the Story would ship the four variables
   FR-18 says must go.
2. **The `CLARIFICATION` loop-back gap is closed.** The entry says
   `stage-map.yaml` routes no `loop_back` to `CLARIFICATION`; two exist, at
   lines 111 and 121 (`new_open_decision: CLARIFICATION`).
3. **The `spec-verifier` self-contradiction is closed.** The file now carries a
   single `artifact_status: DRAFT`, matching its own report template.

## Open — file as `RAISED`

| id | severity | due at | summary |
|---|---|---|---|
| `SPECIFICATION:FR-18` | MAJOR | IMPLEMENTATION | `.env.example` still declares JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, JWT_ACCESS_TTL and JWT_REFRESH_TTL; FR-18 requires their removal because nothing this Story ships reads them |
| `DESIGN_REVIEW:e-1` | MAJOR | IMPLEMENTATION_PLANNING | the Specification names four DomainError subclasses where AD-6 names five, **at four sites** — the revision preamble, FR-21, the errorHandler.ts component row, and the src/lib/errors.ts component row, which enumerates all four class names |
| `IMPACT_ANALYSIS:R-2` | MAJOR | IMPLEMENTATION_PLANNING | Prisma 7 requires a root prisma.config.ts, which breaks npm run lint unless tsconfig.typecheck.json's include gains it; its DATABASE_URL read must be reconciled with AD-7 |
| `IMPACT_ANALYSIS:R-3` | MAJOR | IMPLEMENTATION_PLANNING | .env.test is git-ignored by .gitignore:28, so the PC-1 test setup cannot be committed and CI would have no test DATABASE_URL |
| `IMPACT_ANALYSIS:R-4` | MAJOR | TEST_WRITING | Zod leaves details.fieldErrors empty for both the unknown-property and the non-object-body 400; both mappings are mandatory and minProperties must reach the generated document |
| `IMPACT_ANALYSIS:R-5` | MINOR | IMPLEMENTATION_PLANNING | the request-id middleware must mount ahead of the rate limiter or the 429 cannot carry its required X-Request-Id |
| `IMPACT_ANALYSIS:R-6` | MINOR | IMPLEMENTATION_PLANNING | express-rate-limit emits RateLimit-*/Retry-After headers the contract declares nowhere; settle standardHeaders/legacyHeaders with the custom handler |
| `IMPACT_ANALYSIS:R-7` | MINOR | PR_PREPARATION | the PR summary should cite the 2026-09-01 authorization and PC-1 so the breadth does not read as scope creep |
| `DESIGN_REVIEW:e-2` | MINOR | TEST_WRITING | three request shapes reach one 400 through two Zod paths; cover all three, not only the bodyless POST |
| `DESIGN_REVIEW:d-4` | MINOR | IMPLEMENTATION_VERIFICATION | email's declared format and bounds describe the normalized value, so the generated contract may differ in shape for that field; compare semantically |
| `DB_DESIGN:PC-1` | MINOR | human decision | persistence-conventions.md PC-1 predates Prisma 7 and describes neither the adapter object nor the separate migration config |

## Accepted — file as `ACCEPTED`

Real, deliberately not fixed, reason on record. Filed explicitly so they stop
being ambiguous.

| id | severity | why it is accepted |
|---|---|---|
| `SPEC_REVIEW:m-2` | MINOR | the revision-14 preamble miscounts its own changes; a defect in an artifact past its human gate, with no proportionate route back |
| `SPEC_REVIEW:m-3` | MINOR | FR-5 places an obligation on US-003 that nothing in this Story can satisfy or test; same reason |
| `SPEC_REVIEW:independence` | MINOR | specification v14 and review v11 came from one session turn under different Skills; the PASS is not an independent second opinion, and the gate is not reopened |
| `SPECIFICATION:history-gap` | MINOR | no SPEC_REVIEW to SPECIFICATION event was appended for review v8; history.jsonl is append-only |
| `SPECIFICATION:history-timestamps` | MINOR | attempts 3 and 4 carry hardcoded timestamps ahead of the real clock; same reason |
| `IMPACT_ANALYSIS:history-attempt` | MINOR | the DESIGN_REVIEW to IMPACT_ANALYSIS event carries attempt 2 where the to_stage rule gives 1; same reason |
| `DB_DESIGN:check-constraint` | MINOR | the normalization CHECK is deliberately unspecified — Prisma cannot express one while PC-2 makes schema.prisma the source of truth; endorsed twice |
| `IMPACT_ANALYSIS:e1-loopback` | MINOR | declining changes_required_specification for e-1 is accepted; the residual risk is e-1 itself, which stays open above |
| `DESIGN_REVIEW:d-5` | MINOR | minLength 1 on email is redundant beside format email; noted so no later reader takes it for a rule |

## Dropped

Everything not listed above, in two groups.

**Already closed** — m-1 and m-4, the CLARIFICATION and spec-verifier gaps
above, the driver adapter (`0339b4a`), d-1, d-2 and d-3, e-3 and its approval,
and the forward-edge staleness grading. Each closure is documented in the commit
that made it and in the review artifact that recorded it; a derived open set does
not need to carry them.

**Never findings** — eleven entries recording which stage ran, what it returned,
what it verified, and why an artifact is at the version it is. All of it is
already in `history.jsonl`, which is where it belongs. Filing run records as
findings is what turned the list into a log that only grew.
