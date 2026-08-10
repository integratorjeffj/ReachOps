# ADR-001: Convert the ProcessForge Repository to ReachOps

- **Status:** Accepted
- **Decision date:** 2026-08-10
- **Issue:** RCH-001
- **Decision owners:** ReachOps product owner and lead engineering role

## Context

The repository contains a working ProcessForge portfolio foundation built as a TypeScript monorepo. It includes a Next.js web application, NestJS API, PostgreSQL/Prisma persistence, tenant-scoped authorization patterns, an AI provider abstraction, append-oriented audit events, tests, Docker-based development support, and deterministic demo scripts.

The approved product is now ReachOps. ReachOps is not a rename of ProcessForge's knowledge-management experience. Its authoritative discovery, architecture, delivery plan, issue register, and synthetic-customer specification define a different domain and a deliberately narrow Weekly Reach Review workflow.

Allowing both domains to remain active would create misleading navigation, stale security assumptions, incompatible database concepts, confusing portfolio claims, and an application that cannot tell a coherent five-minute story.

## Decision

Convert this repository in place from the ProcessForge product domain to ReachOps while preserving useful engineering patterns and full Git history.

The conversion will:

1. preserve the final pre-conversion repository state through an annotated Git tag;
2. create a dedicated ReachOps implementation branch after the tag;
3. replace active product/package/environment identity in a controlled issue;
4. replace the ProcessForge domain schema through an explicit reviewed demo-domain reset rather than pretending schema compatibility;
5. remove ProcessForge routes and modules from the active build as ReachOps vertical slices replace them;
6. archive or retire conflicting ProcessForge product documentation without deleting Git history;
7. retain and adapt proven platform patterns listed below;
8. follow the ReachOps issue register sequentially, leaving the application working after every issue.

This is a portfolio application, not a production migration for existing customers. There is no represented ProcessForge customer data to migrate. Synthetic/local database contents may be recreated only through reviewed migrations and deterministic ReachOps seed/reset tooling.

## Authoritative ReachOps specifications

Implementation decisions must conform to these sources, in order:

1. `docs/discovery/reachops-discovery-report.md`
2. `docs/implementation/reachops-architecture-blueprint.md`
3. `docs/implementation/reachops-portfolio-roadmap.md`
4. `docs/implementation/github-issue-register.md`
5. `docs/demo/summit-and-sage-synthetic-customer.md`
6. `docs/discovery/reachops-source-register.md` for cited research provenance only

The ProcessForge manifest, master checklist, product charter, system design, product design, and platform documents under the numbered folders are predecessor documentation. They do not override ReachOps. RCH-002 will give them an explicit historical/archive state so repository readers do not mistake them for current guidance.

## Patterns retained and adapted

The conversion will retain the following architectural assets as patterns, modifying names and domain behavior as required:

- pnpm and Turborepo monorepo structure;
- Next.js web and NestJS REST API separation;
- PostgreSQL and Prisma as the system of record and migration mechanism;
- modular service/controller boundaries and stable domain-error mapping;
- server-side workspace/role authorization and cross-workspace denial tests;
- thin, provider-neutral AI interfaces with explicitly configured fake/live modes;
- structured AI output validation and safe no-result/no-answer behavior;
- append-oriented audit-event creation and authorized audit queries;
- deterministic, idempotent, narrowly scoped seed/reset scripts;
- frontend/backend unit and integration test foundations;
- Docker Compose development dependencies and scripted demo operations;
- secrets outside Git, environment examples, secure headers, and structured logging direction;
- Azure deployment direction, managed secrets, Azure OpenAI, and infrastructure-as-code intent.

Retaining a pattern does not retain ProcessForge domain models, names, prompts, routes, or content.

## Concepts retired from the active product

The following ProcessForge concepts will not remain visible or callable in the ReachOps runtime:

- Knowledge Library and knowledge-item lifecycle
- knowledge drafts, reviews, published versions, and source-file capture
- Ask ProcessForge and knowledge-grounded question answering
- SOP/process capture and draft generation
- knowledge search and retrieval routes
- ProcessForge-specific roles and development identities
- ProcessForge navigation, demo data, branding, environment names, package names, and API descriptions
- ProcessForge master-checklist generation as ReachOps delivery governance

Git history and an archive/reference copy may retain these concepts for provenance. They must not remain as dormant product features that can be mistaken for ReachOps scope.

## Pre-conversion preservation gate

RCH-002 is blocked until the following sequence is explicitly authorized and succeeds. The snapshot should include the accepted ReachOps planning documents and this ADR while the runtime is still the final ProcessForge implementation.

Run from the repository root after reviewing the RCH-001 diff. The first commit captures the repository-wide Prettier baseline repair and the single-worker Vitest configuration required for reliable Windows verification. The second commit records the approved ReachOps authority documents. Unrelated untracked discovery files are intentionally excluded.

```powershell
git status --short
git add -u
git commit -m "chore(repo): establish verified conversion baseline"
git add -- docs/discovery/reachops-discovery-report.md docs/discovery/reachops-source-register.md docs/implementation/reachops-architecture-blueprint.md docs/implementation/reachops-portfolio-roadmap.md docs/implementation/github-issue-register.md docs/demo/summit-and-sage-synthetic-customer.md docs/architecture/decisions/ADR-001-processforge-to-reachops-conversion.md
git commit -m "docs(reachops): establish implementation authority"
git tag -a processforge-final-before-reachops -m "Final ProcessForge runtime before ReachOps domain conversion"
git switch -c codex/reachops-portfolio
git status --short --untracked-files=no
git status --short -- docs/discovery/reachops-discovery-report.md docs/discovery/reachops-source-register.md docs/implementation docs/demo docs/architecture
```

Verification requirements:

```powershell
git show --stat --oneline processforge-final-before-reachops
git branch --show-current
git tag --list processforge-final-before-reachops
```

Expected results:

- the annotated tag resolves to the reviewed RCH-001 documentation commit;
- `codex/reachops-portfolio` is the current branch;
- no tracked or ReachOps-authority changes remain before RCH-002 begins;
- unrelated untracked discovery artifacts remain uncommitted and untouched;
- no force operation, deletion, reset, rebase, or history rewrite occurs.

These commands are documented, not self-authorizing. Repository Git safety requires explicit authorization before executing the commit, tag, or branch operations.

## Conversion sequence

1. **RCH-001:** Accept this decision and update repository authority.
2. **Preservation gate:** Commit the planning authority, tag the final ProcessForge runtime, and create the ReachOps branch.
3. **RCH-002:** Rename active workspace/package/environment/runtime identity and archive conflicting predecessor documentation.
4. **RCH-003:** Replace the domain schema with the ReachOps identity/connection foundation through reviewed migrations.
5. **RCH-004–005:** Replace the visible application shell and establish a working branded demo state.
6. Continue sequentially through the issue register, deleting predecessor runtime code only when the corresponding ReachOps slice is present and tested.

No conversion issue may leave a mixed visible product or claim that an unimplemented integration works.

## Database treatment

The ProcessForge schema is not evolved into ReachOps knowledge-by-knowledge. RCH-003 will introduce the ReachOps domain intentionally.

- Local and portfolio demo databases contain synthetic data and may be recreated.
- Schema changes still require Prisma migrations and fresh-database verification.
- The conversion must never target an unidentified or production customer database.
- Cleanup/reset commands must resolve exact database, workspace, and dataset targets before destructive action.
- Old migration history remains recoverable from the pre-conversion Git tag even if the active branch starts a documented ReachOps migration baseline.

## Consequences

### Positive

- The portfolio tells one coherent product and architecture story.
- Existing tested engineering patterns reduce implementation risk.
- Git history preserves evidence of prior work and conversion judgment.
- ReachOps avoids inheriting irrelevant knowledge-management scope.
- Each issue can replace a narrow slice and remain reviewable.

### Costs and risks

- Package, environment, module, migration, script, and documentation changes span much of the repository.
- A partially completed conversion can produce mixed naming or broken imports.
- Old tests may fail until their active domain slice is deliberately replaced.
- Database reset work is destructive if pointed at the wrong target.
- The current Git restrictions create a hard gate before runtime conversion.

Mitigations are the annotated snapshot, dedicated branch, sequential issues, repository-wide naming checks, fresh-database tests, exact-target safeguards, and milestone demo gates.

## Rejected alternatives

### Keep ProcessForge and add ReachOps beside it

Rejected. Two unrelated portfolio products in one active monorepo would dilute the five-minute demonstration, retain conflicting governance, and increase test/deployment complexity.

### Rename the UI while retaining the knowledge domain

Rejected. This would be a misleading cosmetic conversion and would not implement the approved ReachOps architecture or business workflow.

### Start a new empty repository immediately

Rejected for this conversion. The current repository contains reusable, tested architectural patterns. In-place conversion with a preservation tag demonstrates stronger engineering judgment while retaining recoverability.

### Rewrite history or delete predecessor artifacts

Rejected. It removes provenance and rollback capability without improving the product.

## Rollback

The immutable recovery reference is the annotated tag `processforge-final-before-reachops`. If conversion work must be abandoned, create a new recovery branch from that tag; do not reset or force-update shared history.

Example recovery command, requiring separate authorization when used:

```powershell
git switch -c recovery/processforge processforge-final-before-reachops
```

## Compliance check

RCH-001 is complete when:

- this ADR is accepted and present;
- repository instructions name ReachOps specifications as authoritative;
- retained patterns and retired concepts are explicit;
- the exact preservation/tag/branch sequence is documented;
- conversion ordering and database safeguards are explicit;
- no runtime feature, schema, API, or visible product behavior has been changed by this issue.
