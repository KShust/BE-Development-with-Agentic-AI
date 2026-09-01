---
name: pre-commit-checklist
description: Standard pre-commit sequence for this repo — format, lint, type-check, tests, circular-dependency and layering checks, migration and OpenAPI drift, diff review. Run before considering any change done.
---

# Pre-commit checklist

Run in order; fix failures before proceeding to the next step. Record the actual
command and exit status — a step that was not executed is not a passing step.

1. **Format** — `npm run format` for the files you changed, then
   `npm run format:check`. Never reformat files the change did not touch.
2. **Lint** — `npm run lint`, including the layering rule.
3. **Harness** — `npm run validate:harness`, whenever the change touched
   `docs/workflow/`, `docs/catalog/`, `docs/stories/`, `.claude/skills/`, or
   `.claude/commands/`. It checks stage routing, the artifact registry, Skill
   wiring, and the workflow state files against each other.
4. **Type-check** — `npm run typecheck`. Never reach for `any`, `@ts-ignore`,
   `!`, or a forcing `as` to make this pass.
5. **Layering** — `npm run lint` enforces this mechanically; the rules exist so
   a violation is a build failure, not a review comment:
   - no route, controller, or middleware imports Prisma;
   - no service imports `express` types, cookies, or headers;
   - no module imports another module's repository;
   - `process.env` appears only in `src/config/env.ts`;
   - no `console.log` / `console.error` under `src/`.
   Rules: `docs/architecture/module-map.md`.
6. **Circular dependencies** — `npm run check:cycles`. ESLint enforces the
   layering but cannot see a cycle: it judges one file at a time, so a loop
   between two modules' services is invisible to it. `dpdm` walks the whole
   graph and fails on any cycle.
7. **Tests** — `npm run test`. Add or update unit tests for business logic and
   integration tests for every endpoint the change touches. Never weaken, skip,
   or delete a test to get a pass.
8. **Build** — `npm run build`. A type-check is not a build: `tsc -p
   tsconfig.json` emits, uses a different `rootDir`, and so catches what
   only emission catches — a `src` file reaching outside it, for one.
9. **Migrations** — if `prisma/schema.prisma` changed, confirm a migration was
   created (`npm run prisma:migrate`), committed with the change, and that
   `npx prisma migrate status` reports nothing pending. Never edit an applied
   migration.
10. **OpenAPI drift** — `npm run openapi:check`. It regenerates the document from
   the Zod schemas and fails when `docs/api/openapi.json` is stale; fix it with
   `npm run openapi:generate` and commit the result. Never edit the generated
   document by hand — change the schemas. Separately confirm the regenerated
   contract still matches the approved
   `docs/designs/api/{story_id}-openapi.yaml`; that comparison is semantic and
   remains a review step (`design-reviewer`, `implementation-verifier`).
11. **Configuration** — if a new environment variable was introduced, confirm it
   is validated in `src/config/env.ts` and mirrored in `.env.example`.
12. **Dependencies** — if `package.json` changed, confirm the addition was
    approved and that `package-lock.json` is committed with it, then run
    `npm run audit:check`. It fails on any high/critical advisory not accepted
    by id in `.audit-allowlist.json`. Accepting one is a security decision:
    record why the risk is tolerable, never add an entry just to get a pass.
13. **Diff review** — re-read the whole diff for: secrets or `.env` content,
    debug code, build output (`dist/`), unrelated changes, and scope creep
    beyond the requested change. See `AGENTS.md` "Prohibited" and "Definition of
    Done".
14. **Commit message** — Conventional Commits, module as the scope
    (`feat(auth): ...`).

Relationship to CI and to the Stop hook:

- `.github/workflows/ci.yml` runs every step of this list that is a command, and
  only those — it cannot carry out steps 6, 9, 11, 12, 13, or 14, which need a
  reader. Its order differs (it runs the harness checks first, being cheapest).
  The set is what matters, not the sequence.
- `.claude/hooks/validate-full.py` enforces the code commands at the end of any
  turn that touched code, so steps 1, 2, 4, 7, 8, 10 — and step 3 when the change
  touched the harness — are not optional in practice.
- Therefore: every command here passing means CI passes. The reverse does not
  hold. CI going green says nothing about the steps only a person or an agent can
  carry out.
