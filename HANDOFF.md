# ReachOps Project Handoff

**Reconstructed:** 2026-08-10  
**Target workspace:** `C:\Users\JeffJenkins\Documents\Codex\reachops`  
**Status:** Approved; independent repository initialized and M0 implemented locally  
**Product:** ReachOps Weekly Reach Review  
**Repository identity:** Independent ReachOps repository; not ProcessForge and not LaunchPath

## 1. Purpose of this handoff

The original ReachOps implementation conversation was archived before a ReachOps handoff was produced. This document reconstructs project state from the surviving ReachOps planning corpus and a read-only inspection of the historical ProcessForge checkout.

This reconstruction originally paused all repository and implementation work. The product owner approved continuation on 2026-08-10. The execution update in Section 14 records the work performed after that approval.

### Evidence labels used here

- **Documented decision** — explicitly stated in an authoritative ReachOps document.
- **Observed state** — verified directly from the filesystem or Git on 2026-08-10.
- **Current user directive** — instruction supplied after the archived implementation conversation; it may supersede an older repository-locus decision.
- **Assumption / unresolved** — not established by the recovered documents and must not be treated as a requirement.

## 2. Recovered source corpus and authority

The active ReachOps workspace is empty except for this reconstructed handoff. The recovered source documents remain in the historical checkout at `C:\Users\JeffJenkins\Documents\ProcessForge`.

The recovered `CLAUDE.md` and ADR-001 define this implementation-authority order:

1. `docs/discovery/reachops-discovery-report.md`
2. `docs/implementation/reachops-architecture-blueprint.md`
3. `docs/implementation/reachops-portfolio-roadmap.md`
4. `docs/implementation/github-issue-register.md`
5. `docs/demo/summit-and-sage-synthetic-customer.md`
6. `docs/discovery/reachops-source-register.md` for research traceability only

Also recovered and read completely:

- `docs/architecture/decisions/ADR-001-processforge-to-reachops-conversion.md`
- `CLAUDE.md`

The `HANDOFF.md` found in ProcessForge and the copies under `Documents\Codex\LaunchPath` are LaunchPath artifacts with matching SHA-256 hashes. They are explicitly excluded from ReachOps authority.

Historical ProcessForge product documents and runtime code are predecessor material only. They do not define ReachOps product behavior. No ProcessForge or LaunchPath package, domain, synthetic data, branding, or history should be copied into a new ReachOps repository unless a ReachOps document explicitly identifies a reusable architectural pattern.

## 3. Project purpose

**Documented decision:** ReachOps is a production-quality portfolio application designed to be understood and trusted by a hiring manager during a five-minute demonstration. It is not a commercial SaaS product.

ReachOps addresses a weekly operating problem for a marketing manager or generalist at a growing, location-based SMB: digital-presence evidence is fragmented across website analytics, search, local presence, and imported channels, while existing reporting often fails to preserve source lineage, decision rationale, ownership, and follow-through.

The product is deliberately narrowed to a **Weekly Reach Review**. It should help a person answer:

1. What materially changed?
2. Why might it matter, with uncertainty visible?
3. What should a human review, assign, monitor, or do next?

## 4. Product vision and boundaries

### Documented product promise

> In 15 minutes, understand what changed in search and website performance, choose this week’s priorities, and leave with accountable next actions.

The flagship workflow is:

```text
connect or inspect sources → synchronize → normalize → detect facts
→ generate an evidence-linked weekly brief → human approves a recommendation
→ assign action → inspect audit history
```

### Primary user and portfolio positioning

- Primary user: marketing manager or marketing generalist at a growing local/regional service business.
- Supporting personas: contributor/coordinator and executive viewer.
- Intended portfolio identity: Operator + Integrator + Coach.
- The product should demonstrate API evaluation, OAuth, normalized data, deterministic analysis, bounded AI, human approval, auditability, security, testing, operations, and business translation.

### Documented MVP scope

- One synthetic Summit & Sage Home Services workspace.
- Google Analytics 4 and Google Search Console as live-capable, read-only integrations.
- Clearly labeled fixture fallback for Google sources.
- Simulated Google Business Profile and Meta sources.
- Imported/simulated LinkedIn data through an adapter rather than an asserted live API.
- Normalized daily metric observations with native definitions, source, scope, freshness, quality, and sync lineage.
- Deterministic comparisons, quality gates, observation candidates, evidence links, and exact calculation rules.
- Weekly review, human decision workflow, assigned actions, review dates, and append-oriented activity/audit history.
- Evidence-linked AI management brief added only after deterministic workflow works.
- Explicit source-mode, synthetic-data, model-mode, stale, partial, and error disclosures.
- A compact monthly/print-friendly derivative, not a generic report builder.

### Explicit non-goals

- Social publishing or scheduling.
- Social inbox/listening.
- Review auto-replies.
- General BI/dashboard builder.
- Rank crawler, backlink index, or keyword database.
- CRM or marketing automation.
- Ad management or automated attribution/ROI claims.
- Universal connector catalog.
- Agency white labeling, client billing, or commercial multi-tenant administration.
- Autonomous marketing actions or external account mutation.
- A universal cross-platform “reach score.”
- Claims of customers, outcomes, uptime, restricted API approval, or production readiness without evidence.

## 5. Synthetic demonstration contract

**Documented decision:** Summit & Sage Home Services is the sole MVP customer workspace and is entirely fictional. Its domain uses `.example`. Every relevant screen must retain a persistent `Synthetic workspace` disclosure, while each source independently displays `Live`, `Simulated`, `Imported`, `Stale`, `Partial`, or `Error` as applicable.

Key demo identities:

- Maya Chen — Workspace Manager; approves recommendations.
- Jonah Brooks — Contributor; receives and completes actions.
- Elena Ruiz — Executive Viewer.
- Devon Patel — Contributor; owns customer-care follow-up.
- System Sync — system actor.
- ReachOps AI — proposal-only actor; cannot approve or execute.

The frozen flagship review compares the week ending 2026-08-02 with the prior week. Its primary observation is the AC repair landing-page divergence:

- Sessions: 1,148 → 1,505 (+31.1%), EV-104.
- Confirmed bookings: 70 → 59 (−15.7%), EV-105.
- Booking rate: 6.10% → 3.92% (−2.18 percentage points), EV-106.
- A 2026-07-30 mobile booking-form deployment is context, not proof of causation.

The deterministic seed/reset contract is idempotent, versioned, exactly scoped to the synthetic workspace, and must restore the flagship week, action states, audit chronology, and connection states without wildcard deletion.

## 6. Architecture summary

### Documented architecture choice

Build a polished portfolio architecture with production-minded modular boundaries: a TypeScript modular monolith, PostgreSQL, explicit integration adapters, a background worker, server-only credential handling, and workspace scoping. Do not introduce microservices, Kafka, Kubernetes, a warehouse, GraphQL, a vector database, multi-region architecture, or multiple production AI providers without a measured need.

### Target runtime topology

```text
Next.js web app → NestJS REST API → PostgreSQL
                         ↓
                    Redis/BullMQ → sync worker → source adapters
                         ↓
                    AI provider gateway
```

### Target module boundaries

- `auth` — sessions, current actor, workspace membership.
- `connections` — Google data OAuth, resources, encrypted credentials, health.
- `sync` — job requests, cursors, retries, run history.
- `integrations` — provider calls and normalized mapping; never persistence.
- `metrics` — definitions, observations, comparisons, and data quality.
- `insights` — deterministic rules and evidence construction.
- `briefings` — minimized fact packets, AI generation, validation, brief lifecycle.
- `recommendations` — proposal and human decision states.
- `actions` — assignment, dates, status transitions, and action events.
- `audit` — append-only event capture and authorized query.
- `demo` — versioned synthetic seed/reset and disclosure metadata.

### Core domain model

- Identity: `Workspace`, `User`, `Membership`.
- Connections/ingestion: `DataSourceConnection`, `OAuthCredential`, `SyncRun`, `SyncCursor`, `ImportBatch`.
- Measurement: `MetricDefinition`, `MetricObservation`, `ContentItem`, `BusinessGoal`, `BusinessAnnotation`.
- Analysis/workflow: `ObservationCandidate`, `EvidenceLink`, `WeeklyBrief`, `Recommendation`, `ActionItem`, `ActionEvent`, `AiGeneration`, `AuditEvent`.

### Domain invariants

1. Every business record is workspace-scoped.
2. Every metric retains connection, native definition, grain, dates, and retrieval lineage.
3. A recommendation cannot be approved without evidence.
4. An action comes only from a human-approved recommendation or explicit human entry.
5. AI cannot mutate metrics, permissions, connections, or external systems.
6. Audit and action events are append-oriented through application services.
7. Simulated/imported mode propagates to every derived observation, recommendation, and brief.
8. A stale or failed required source prevents an unqualified complete brief.

### Integration contract

Adapters declare provider and mode, list available resources, validate connections, and return a validated normalized batch. Adapters never write directly to persistence. The synchronization application service performs authorization, validation, transactionally idempotent persistence, audit, and orchestration.

Observation uniqueness is based on workspace, connection, resource, native metric, grain/date, and dimension hash. Syncs overlap recent days, use stable idempotency keys, bounded backoff, one active job per connection, and visible final/dead-letter failure.

### Deterministic/AI boundary

Deterministic code owns arithmetic, metric definitions, comparisons, thresholds, quality gates, authorization, state transitions, and evidence IDs. AI receives only a minimized, permission-filtered fact packet. Structured output must cite known evidence, preserve caveats, and reject unknown numbers/IDs, unsupported causality, or injected instructions.

There is no silent fallback from live AI to fake AI. The deterministic fake provider follows the same contract and is visibly labeled. Human approval is always required before an AI recommendation becomes an action.

### Authentication and security

- Google OpenID Connect for application sign-in using only `openid email profile`.
- Application sign-in and Google marketing-data consent are separate trust decisions.
- Google data OAuth uses authorization code, PKCE/state, exact callback allowlists, least-privilege read scopes, resource selection, disconnect, and revoke/recovery paths.
- Refresh tokens remain server-side and application-encrypted through a credential-vault abstraction; deployed keys use Azure Key Vault/KMS-backed protection.
- Server-side role, workspace, object, and resource authorization is mandatory.
- Secrets stay outside Git and logs; tokens, authorization codes, external text, and prompt bodies are redacted.
- External review/import text is untrusted data, never instructions.
- Secure headers, CSP/Helmet, rate limits, input validation, secret/dependency/container scanning, and cross-workspace denial tests form the baseline.

## 7. Repository structure and technology stack

### Documented target structure

```text
apps/
  web/           Next.js UI and session boundary
  api/           NestJS modular REST API and OpenAPI
  worker/        BullMQ synchronization and briefing jobs
packages/
  database/      Prisma schema, client, and migrations
  contracts/     Shared Zod/request/response/AI schemas
  ai/            Provider abstraction, prompts, validation, fake/live providers
  integrations/  Adapter contracts and provider/simulated implementations
  ui/            Shared ReachOps UI components when warranted
docs/
  architecture/  ADRs, diagrams, threat model
  discovery/     Discovery report and research provenance
  implementation/Architecture blueprint, roadmap, issue register
  demo/          Synthetic customer and demo contract
```

### Documented stack

- TypeScript monorepo managed with pnpm and Turborepo.
- Next.js 15 web application.
- NestJS 11 REST API with OpenAPI.
- PostgreSQL and Prisma migrations.
- Redis and BullMQ for durable background work.
- Zod for shared runtime contracts.
- Google OIDC and Google OAuth for read-only GA4/Search Console access.
- Thin AI provider abstraction supporting Azure OpenAI and a deterministic fake provider.
- Docker Compose for local dependencies and deterministic demo operations.
- Vitest-based frontend/backend/package tests, plus integration and E2E coverage appropriate to risk.
- Azure Container Apps, Azure Database for PostgreSQL, Azure Cache for Redis, Azure Key Vault, Azure OpenAI, Application Insights, Bicep, and GitHub Actions as the documented deployment direction.

**Unresolved:** The recovered documents describe this stack as inherited from ProcessForge and selected for ReachOps. Because the current directive is to create an independent repository from scratch, exact dependency versions and scaffold mechanics must be reverified at implementation time; no package version should be invented from memory.

## 8. Decisions already made

### Documented decisions

- Narrow ReachOps to the Weekly Reach Review; do not build a broad digital-presence suite.
- Use one fictional Summit & Sage workspace for the portfolio demonstration.
- Build Option A with Option B boundaries: portfolio-sized modular monolith with production-minded isolation and controls.
- Preserve native metric meaning and lineage; normalize structure, not semantics.
- Use GA4 and Search Console as the real-capable API spine.
- Keep GBP optional/simulated unless legitimate API approval and policy review occur.
- Treat LinkedIn as import/simulation for MVP; no scraping or fabricated live access.
- Establish deterministic facts and workflow before AI.
- Require evidence on recommendations and human approval before assigned action.
- Keep AI proposal-only, permission-filtered, schema-validated, and unable to write externally.
- Keep source mode and synthetic disclosure visible through derived results.
- Use server-side workspace authorization, encrypted credentials, idempotency, safe errors, and append-oriented audits.
- Follow the issue register sequentially and keep every issue as a working vertical increment.
- Validate every issue with format, lint, typecheck, unit, applicable integration/E2E/accessibility tests, and production build.
- Use Conventional Commits and small reviewable boundaries.

### Current user directives that supersede repository-locus assumptions

- Build ReachOps, not LaunchPath.
- Use `C:\Users\JeffJenkins\Documents\Codex\reachops` as the active workspace.
- Create a brand-new independent ReachOps repository rather than converting the ProcessForge checkout.
- Do not initialize the repository or write implementation code until this reconstructed handoff is approved.

### Superseded/conflicting documented decision

ADR-001 accepted an **in-place ProcessForge-to-ReachOps conversion**, preservation tag `processforge-final-before-reachops`, and branch `codex/reachops-portfolio`. It explicitly rejected starting from an empty repository because it expected reusable code and history in the same checkout.

That repository-locus decision conflicts with the current user directive for a brand-new independent repository. The product, architecture, security, workflow, demo, and issue decisions remain useful, but the conversion mechanics, ProcessForge preservation tag, conversion branch, and assumptions about inherited files cannot be executed in the new repository without a replacement/superseding ADR and product-owner approval.

## 9. Open questions and validation gaps

These items are documented as unresolved; they are not implementation requirements that may be silently assumed:

1. Was the recommended two-week validation sprint completed? No recovered evidence shows interviews, prototype testing, or the go/no-go thresholds being satisfied.
2. Is the validation sprint waived, parallelized with the portfolio build, or still a gate?
3. Is a safe, authorized GA4 property and verified Search Console property available?
4. Is GBP access legitimate and approved, and how will its content-retention policy be handled? It is not an MVP dependency.
5. Does action tracking remain inside ReachOps or eventually create approved tasks in an existing work system?
6. Is AI valuable to target users beyond deterministic observations and actions? AI remains a later milestone regardless.
7. Which recommendation categories and uncertainty language are acceptable to users?
8. What exact Azure subscription, cost ceiling, domain, OAuth consent configuration, and deployment environment will be used?
9. What license and public-repository governance should the new independent repository use?
10. How should the issue register be adapted for a clean repository, given that M0/RCH-001–003 were written as an in-place ProcessForge conversion?
11. Which reusable patterns, if any, may be reimplemented from historical ProcessForge code without copying ProcessForge product/domain material or Git history?

## 10. Delivery milestones

### M0 — ReachOps Conversion and Branded Shell (RCH-001–005)

Documented outcome: a branded ReachOps shell with Summit & Sage disclosure and no active ProcessForge identity. For a new independent repository, “conversion” mechanics require an approved issue/ADR adjustment before execution.

### M1 — Synthetic Executive Overview (RCH-006–011)

Outcome: deterministic Summit & Sage seed/reset, 13-month history, goals, campaigns, source modes, normalized overview API, and polished executive Overview.

### M2 — Deterministic Weekly Review (RCH-012–018)

Outcome: exact comparisons, quality gates, observation rules, evidence, weekly review, human decision, action assignment, and activity/audit loop with AI disabled.

### M3 — Live Google Connections and Scheduled Sync (RCH-019–025)

Outcome: production-capable OIDC, encrypted credential vault, Google data OAuth, GA4/GSC adapters, BullMQ worker, connection health, and safe recovery states. At least one safe real connection is the documented exit target; fixtures remain explicit.

### M4 — Trustworthy AI to Approved Action (RCH-026–031)

Outcome: minimized fact packet, structured prompt/output contract, adversarial validation, generation lifecycle, evidence-linked AI UI, and human-owned approval-to-action workflow.

### M5 — Operational Trust and Resilience (RCH-032–035)

Outcome: stable errors, graceful degradation, observability, security hardening, audit filters, action review, and honest export.

### M6 — Five-Minute Portfolio Release (RCH-036–038)

Outcome: unified visual/accessibility polish, repeatable demo lifecycle and E2E rehearsals, reproducible Azure deployment, CI, README, architecture/security/AI disclosures, runbook, and rollback evidence.

## 11. Git and GitHub strategy

### Documented general strategy retained

- Use Conventional Commits.
- Keep issues/commits cohesive, reviewable, and reversible.
- Separate broad formatting, dependency upgrades, repository identity, migrations, and product features.
- Never commit secrets, tokens, real analytics exports, local generated data, or screenshots containing credentials.
- Validate before commit and push.
- Create GitHub issues in numeric order within milestones; initially activate only the current and next milestone.
- Do not close an issue until acceptance criteria, tests, documentation, and demo increment pass.
- No issue text alone authorizes destructive migration or deployment.

### Historical conversion strategy not applicable without a superseding ADR

The old plan proposed two baseline commits in ProcessForge, annotated tag `processforge-final-before-reachops`, and branch `codex/reachops-portfolio`. None occurred. Do not reproduce these operations in the independent repository as if a ProcessForge conversion happened.

### Proposed new-repository strategy — requires approval

This is a proposal derived from the current user directive, not an already documented decision:

1. Approve this handoff and resolve the validation-gate/repository-locus questions.
2. Copy only the recovered ReachOps authority documents into the empty ReachOps workspace, preserving content and provenance.
3. Add an ADR that supersedes only ADR-001’s in-place-conversion mechanics and records the clean independent repository decision.
4. Reconcile RCH-001–003/M0 wording for a clean scaffold without changing product scope or later dependencies.
5. Initialize Git only after reviewing the exact initial file set.
6. Establish an initial default branch and commit with documentation/governance only.
7. Create a public GitHub repository named `ReachOps` under the authenticated account only after secret/synthetic-data review, then push.
8. Implement the approved issue sequence with validation after each issue.

The owner, visibility, license, default branch name, initial commit breakdown, and GitHub issue/milestone creation remain approval items.

## 12. Current implementation status

### Active ReachOps workspace

**Observed state:** Before this handoff was written, `C:\Users\JeffJenkins\Documents\Codex\reachops` contained zero entries, was writable, and was not a Git repository. No ReachOps source code, package manifest, Git metadata, commit, tag, branch, remote, database, or deployment exists there.

### Historical ProcessForge checkout

**Observed state:** `C:\Users\JeffJenkins\Documents\ProcessForge` is a Git repository on branch `feature/first-user-wow-demo` at commit `c345689` (`feat: add AI process capture web workflow`). Its active runtime and package structure remain ProcessForge. It has a large pre-existing modified worktree and untracked `docs/` plus the accidental LaunchPath `HANDOFF.md`.

Recovered target/reusable structure in that checkout includes `apps/api`, `apps/web`, `packages/ai`, `packages/database`, `packages/storage`, pnpm/Turborepo configuration, Docker Compose, and tests. There is no `apps/worker`, `packages/contracts`, `packages/integrations`, or `packages/ui` target structure evidenced by the manifest inventory; those are planned ReachOps components, not completed ones.

### RCH-001 status

**Documented status:** The recovered `CLAUDE.md` states that RCH-001 implementation and verification were complete, with the preservation gate pending authorization. ADR-001 is marked Accepted and its compliance criteria appear in the recovered documents.

**Observed limitation:** The ReachOps documents and ADR are untracked under the historical ProcessForge checkout, `CLAUDE.md` is modified, the annotated tag does not exist, and the ReachOps branch was not created. Therefore RCH-001 planning content survived, but its historical preservation/commit gate was never executed.

**Effect of current directive:** Because ReachOps is now to be an independent repository, the old preservation gate is no longer the next executable operation. RCH-001’s product-authority result should be preserved, while its conversion mechanics require an explicit superseding ADR.

### Verification claims

The archived task context reported a repository-wide Prettier baseline, Windows single-worker Vitest adjustment, passing formatting/lint/typecheck/build, and 416 API/AI/web tests, with database-backed legacy tests skipped because PostgreSQL was unavailable. Those results concern the historical ProcessForge checkout and are not evidence that a ReachOps application exists. They must not be copied into the new repository’s status or README as ReachOps validation.

## 13. Prioritized next tasks

No task below is authorized until the product owner approves this handoff.

### Gate 0 — Product-owner decisions

1. Approve or correct this reconstructed handoff.
2. Decide whether the discovery validation sprint is waived, parallelized, or required before code.
3. Confirm the independent-repository decision supersedes ADR-001’s in-place conversion mechanics.
4. Confirm GitHub owner, repository visibility, license, and default branch.

### Gate 1 — Recover authority into the independent workspace

1. Copy only the eight recovered ReachOps authority/research files into their documented paths.
2. Add repository instructions that preserve the authority order and boundaries.
3. Create a superseding ADR for clean-repository initialization.
4. Reconcile M0/RCH-001–003 wording for an empty repository while preserving downstream IDs and dependencies.
5. Review the exact documentation-only initial commit proposal.

### Gate 2 — Initialize and publish only after explicit approval

1. Initialize Git in the exact ReachOps workspace.
2. Commit the approved documentation baseline.
3. Create GitHub repository `ReachOps` under the confirmed authenticated account.
4. Push the approved default branch.
5. Create current/next milestone labels and issues only as authorized.

### First implementation sequence after governance is resolved

The recovered issue register expects sequential M0 work. In a clean repository the functional order remains:

1. Establish ReachOps workspace/package/config identity with no ProcessForge runtime leakage (adapted RCH-002).
2. Establish the ReachOps identity, workspace, connection, audit, and demo-dataset schema foundation (RCH-003).
3. Build the ReachOps shell/navigation (RCH-004).
4. Add the Summit & Sage portfolio landing state and disclosure (RCH-005).
5. Continue sequentially through RCH-006 onward.

Before each issue, verify dependencies and state affected packages, services, schema/database objects, APIs, tests, UI components, security boundaries, and architectural risks. After each issue, run formatting, linting, type checking, unit tests, applicable integration/E2E/accessibility tests, and a production build. Fix failures before declaring completion.

## 14. Execution update after approval

The product owner approved this reconstruction and authorized continuation on 2026-08-10.

Completed locally:

- Recovered the ReachOps authority corpus into the independent workspace.
- Accepted ADR-002 and adapted M0 wording for a clean repository.
- Initialized independent Git history on `main`.
- Completed RCH-002 ReachOps package/configuration identity.
- Completed RCH-003 initial Prisma schema, migration, and invariants.
- Completed RCH-004 responsive shell and final navigation.
- Completed RCH-005 synthetic portfolio landing state and About disclosure.
- Added README, MIT license, security policy, and CI validation workflow.
- Passed formatting, lint, typecheck, 14 tests, Prisma validation/migration status, desktop/narrow visual QA, and production builds for API, database, and web.

The next sequential implementation issue is RCH-006 after the initial M0 commit and GitHub publication are complete.
