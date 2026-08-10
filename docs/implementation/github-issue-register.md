# ReachOps GitHub Issue Register

This register is the source text for GitHub milestones and issues. Create issues in numeric order within each milestone. Dependency IDs refer to this register. No issue authorizes a commit, push, deployment, or destructive migration by itself.

> **Independent repository interpretation:** ADR-002 supersedes ADR-001's in-place ProcessForge conversion mechanics. RCH-002 establishes clean ReachOps identity directly, and RCH-003 introduces the first ReachOps schema baseline. Stable issue IDs, product outcomes, acceptance criteria, and downstream dependencies remain authoritative.

## Labels

Create these repository labels before importing issues:

- Type: `type:feature`, `type:chore`, `type:test`, `type:docs`, `type:security`
- Area: `area:web`, `area:api`, `area:data`, `area:integrations`, `area:ai`, `area:jobs`, `area:demo`, `area:platform`
- Priority: `priority:p0`, `priority:p1`, `priority:p2`
- State helpers: `blocked`, `needs-validation`, `demo-critical`

## Milestone M0 — ReachOps Foundation and Branded Shell

**Demo checkpoint:** Open ReachOps, see the Summit & Sage synthetic workspace, understand the product promise, and navigate the final information architecture without any ProcessForge UI leakage.

### RCH-001 — Record the ProcessForge-to-ReachOps conversion decision

- Labels: `type:docs`, `area:platform`, `priority:p0`, `demo-critical`
- Depends on: none
- Outcome: A reviewed ADR identifies reusable platform patterns, retired domain concepts, documentation authority, rollback/tag prerequisite, and conversion sequence.
- Acceptance criteria:
  - ADR explicitly preserves audit, authorization, AI provider, migration, test, and seed-safety patterns.
  - ADR explicitly retires knowledge library, Ask ProcessForge, SOP capture, and knowledge lifecycle from the visible product.
  - Exact pre-conversion tag/branch step is documented; no history is deleted.
  - ReachOps discovery, architecture, roadmap, issue register, and synthetic-customer docs are listed as authoritative.
- Suggested commit: `docs(architecture): record ReachOps repository conversion decision`

### RCH-002 — Establish ReachOps workspace and package identity

- Labels: `type:chore`, `area:platform`, `priority:p0`
- Depends on: RCH-001
- Outcome: In the independent repository, product/package names, metadata, environment examples, local database naming, scripts, and visible titles use ReachOps consistently from the first scaffold.
- Acceptance criteria:
  - `package.json`, workspace package names/imports, app metadata, env examples, Docker identifiers, and scripts are consistently renamed.
  - A repository-wide search finds no active runtime `ProcessForge` or `LaunchPath` branding; historical ADR provenance may retain those names.
  - No secrets or real credentials are introduced.
  - Build, lint, typecheck, tests, and formatting pass.
- Suggested commits:
  - `chore(repo): rename workspace packages for ReachOps`
  - `chore(config): align local environment with ReachOps`

### RCH-003 — Introduce the ReachOps domain foundation

- Labels: `type:feature`, `area:data`, `priority:p0`
- Depends on: RCH-001, RCH-002
- Outcome: The first Prisma schema establishes workspace, users/memberships, business goals, connections, encrypted-credential metadata, audit events, and demo dataset metadata.
- Acceptance criteria:
  - Migration is an explicit ReachOps initial baseline and does not import or imply compatibility with a ProcessForge database.
  - Every business table has a workspace boundary and useful indexes.
  - Token ciphertext fields are inaccessible from ordinary DTO mappings.
  - Audit events remain append-only by service convention and test.
  - Fresh migration and schema validation pass against PostgreSQL.
- Suggested commits:
  - `feat(data): introduce ReachOps identity and connection schema`
  - `test(data): verify workspace isolation and audit invariants`

### RCH-004 — Build the ReachOps application shell and navigation

- Labels: `type:feature`, `area:web`, `priority:p0`, `demo-critical`
- Depends on: RCH-002
- Outcome: Executive-quality responsive shell with Overview, Weekly Review, Actions, Connections, and Activity navigation.
- Acceptance criteria:
  - Desktop and narrow-screen layouts are usable without horizontal navigation overflow.
  - Current route, keyboard focus, hover, and disabled states are distinct.
  - Header contains ReachOps product identity, Summit & Sage workspace context, and persistent `Synthetic workspace` badge.
  - ProcessForge routes and navigation are absent.
  - Navigation tests cover visible items and role-sensitive Activity access.
- Suggested commit: `feat(web): create ReachOps application shell`

### RCH-005 — Add the portfolio landing state and demo disclosure

- Labels: `type:feature`, `area:web`, `area:demo`, `priority:p0`, `demo-critical`
- Depends on: RCH-004
- Outcome: The root page immediately communicates the business problem, active synthetic customer, reporting week, and next demo action.
- Acceptance criteria:
  - Landing state identifies Summit & Sage as fictional and links to About/Demo details.
  - A concise product promise appears above the fold.
  - Empty metric cards are styled as intentional preview states, not broken features.
  - The primary CTA leads to the future Weekly Review route.
  - Accessibility smoke test and visual snapshot pass.
- Suggested commit: `feat(demo): add ReachOps portfolio landing state`

## Milestone M1 — Synthetic Executive Overview

**Demo checkpoint:** Show a polished, populated overview for Summit & Sage with internally consistent historical metrics, goals, campaigns, source modes, and clear synthetic labeling.

### RCH-006 — Define shared metric and source contracts

- Labels: `type:feature`, `area:data`, `area:api`, `priority:p0`
- Depends on: RCH-003
- Outcome: Shared schemas define source mode, metric definition, observation grain, quality flags, dimensions, comparisons, and evidence IDs.
- Acceptance criteria:
  - Zod schemas and TypeScript types are shared through `packages/contracts`.
  - Rates, counts, currency, duration, average position, percentage and percentage-point displays are distinct.
  - `LIVE`, `SIMULATED`, and `IMPORTED` propagate through derived DTOs.
  - Invalid values, grains, source modes and dimension shapes have unit tests.
- Suggested commit: `feat(contracts): define ReachOps metric and provenance schemas`

### RCH-007 — Add ingestion and measurement persistence

- Labels: `type:feature`, `area:data`, `priority:p0`
- Depends on: RCH-006
- Outcome: Prisma supports source resources, sync runs/cursors, metric definitions/observations, content items, imports, annotations, and campaigns.
- Acceptance criteria:
  - Observation uniqueness supports idempotent overlapping syncs.
  - Sync runs retain safe error codes/summaries and inserted/updated/skipped counts.
  - Source lineage can be resolved from any observation.
  - Simulated/live data use distinct connection/resource IDs.
  - Migration, constraints, indexes, and integration tests pass.
- Suggested commits:
  - `feat(data): add ReachOps measurement and sync schema`
  - `test(data): cover observation idempotency and lineage`

### RCH-008 — Implement the versioned Summit & Sage seed/reset service

- Labels: `type:feature`, `area:demo`, `area:data`, `priority:p0`, `demo-critical`
- Depends on: RCH-007
- Outcome: An idempotent service seeds the complete synthetic customer baseline and restores the flagship demo state.
- Acceptance criteria:
  - Seed persists the customer specification’s roster, goals, campaigns, source catalog, 13-month baseline, flagship week and annotations using the schema available through RCH-007.
  - The versioned fixture catalog contains the documented reviews and actions without prematurely introducing the persistence or lifecycle behavior owned by RCH-009, RCH-014 and RCH-017.
  - Seed uses stable synthetic IDs/markers and normal services for workflow/audit records where practical.
  - Running seed twice produces no duplicate logical records.
  - Reset resolves exact targets and cannot delete outside the synthetic workspace.
  - Seed version and frozen reporting window are queryable.
  - RCH-009 extends the seed through the simulated GBP adapter for review persistence; RCH-014 and RCH-017 extend reset with recommendation, action, action-event and approval/audit state through their owning services.
- Suggested commits:
  - `feat(demo): seed Summit and Sage synthetic workspace`
  - `test(demo): verify idempotent seed and scoped reset`

### RCH-009 — Implement simulated GBP and imported LinkedIn adapters

- Labels: `type:feature`, `area:integrations`, `area:demo`, `priority:p1`
- Depends on: RCH-006, RCH-007, RCH-008
- Outcome: Non-Google-live data flows through the same adapter contract and ingestion service as future real adapters.
- Acceptance criteria:
  - Adapters declare capabilities and mode; they cannot report `LIVE`.
  - Outputs validate against `NormalizedBatch` and preserve source-native metric definitions.
  - LinkedIn import records batch provenance and validation results.
  - GBP synthetic reviews are treated as untrusted text.
  - Contract tests prove deterministic outputs and invalid-data rejection.
- Suggested commit: `feat(integrations): add simulated GBP and LinkedIn adapters`

### RCH-010 — Build the overview query service and API

- Labels: `type:feature`, `area:api`, `area:data`, `priority:p0`
- Depends on: RCH-007, RCH-008
- Outcome: A tenant-scoped endpoint returns the active week, goal progress, KPI comparisons, source coverage, priorities placeholder, and trend series.
- Acceptance criteria:
  - Endpoint never calculates values in the controller.
  - Date boundaries use workspace timezone.
  - DTO includes definitions, retrieval freshness and source mode.
  - Missing/partial data has stable response semantics.
  - Authorization, tenant isolation, seeded values and empty state have integration tests.
- Suggested commit: `feat(api): expose executive overview summary`

### RCH-011 — Build the populated executive Overview

- Labels: `type:feature`, `area:web`, `priority:p0`, `demo-critical`
- Depends on: RCH-004, RCH-005, RCH-010
- Outcome: A polished above-the-fold Overview presents the current story without overwhelming the viewer.
- Acceptance criteria:
  - Initial viewport contains one management headline, four KPI/goal cards, source coverage, and three priority placeholders.
  - Trend chart has direct labels, prior comparison, campaign/deployment annotations and accessible table alternative.
  - Source-mode, freshness, metric definition and synthetic disclosures are visible or one click away.
  - Percentage versus percentage-point formatting is correct.
  - Loading, empty and API-failure states are demonstrated and tested.
- Suggested commits:
  - `feat(web): build Summit and Sage executive overview`
  - `test(web): cover overview states and metric formatting`

## Milestone M2 — Deterministic Weekly Review

**Demo checkpoint:** Open the current review, show the AC repair conversion divergence, inspect exact evidence, make a human decision, create an action, and view the resulting audit trail—without AI yet.

### RCH-012 — Implement deterministic comparison calculations

- Labels: `type:feature`, `area:data`, `priority:p0`
- Depends on: RCH-006, RCH-007
- Outcome: Reusable tested functions calculate counts, rates, deltas, percentage change, percentage-point change, and direction-aware display.
- Acceptance criteria:
  - Zero denominators, missing periods, small denominators and negative values are explicitly handled.
  - Average position uses lower-is-better direction.
  - Calculations reproduce every EV-101 through EV-117 display value.
  - Calculation output contains raw values and display metadata; AI is not involved.
- Suggested commit: `feat(metrics): add deterministic period comparisons`

### RCH-013 — Add data-quality gates and observation rules

- Labels: `type:feature`, `area:api`, `area:data`, `priority:p0`
- Depends on: RCH-012
- Outcome: Versioned rules generate observation candidates from normalized data and block overconfident output when coverage is inadequate.
- Acceptance criteria:
  - Rules reproduce the four expected flagship observations.
  - Each candidate records rule version, inputs, severity factors, quality flags and evidence IDs.
  - Minimum-volume and stale/partial-source gates are tested.
  - Rerunning the same rule/window is idempotent.
  - Rules do not produce causal language.
- Suggested commits:
  - `feat(insights): generate deterministic observation candidates`
  - `test(insights): cover quality gates and flagship rules`

### RCH-014 — Persist weekly reviews, evidence and recommendation decisions

- Labels: `type:feature`, `area:data`, `priority:p0`
- Depends on: RCH-013
- Outcome: Schema supports weekly review snapshots, immutable evidence links, recommendation proposals/decisions, action items and action events.
- Acceptance criteria:
  - Review window and fact version are immutable after generation.
  - Recommendations require at least one evidence link.
  - Decision states reject invalid transitions.
  - Action items retain originating recommendation/evidence.
  - Migrations and lifecycle integration tests pass.
- Suggested commits:
  - `feat(data): add weekly review and action workflow schema`
  - `test(data): enforce evidence and workflow invariants`

### RCH-015 — Expose weekly review and evidence APIs

- Labels: `type:feature`, `area:api`, `priority:p0`
- Depends on: RCH-014
- Outcome: Authorized endpoints return the review, observations, evidence detail and deterministic recommendation proposals.
- Acceptance criteria:
  - Evidence endpoint returns source, native definition, dates, raw/display values, sync lineage and quality.
  - Review endpoint distinguishes deterministic observation from future AI interpretation.
  - Unknown/foreign-workspace evidence returns a safe not-found/forbidden response.
  - OpenAPI and integration tests cover success, partial and unauthorized cases.
- Suggested commit: `feat(api): expose weekly review evidence`

### RCH-016 — Build the Weekly Review and evidence drawer UI

- Labels: `type:feature`, `area:web`, `priority:p0`, `demo-critical`
- Depends on: RCH-015
- Outcome: Users can scan observations and inspect evidence without leaving the review flow.
- Acceptance criteria:
  - AC repair conversion issue is visually primary and readable within 20 seconds.
  - Evidence IDs open an accessible side panel with lineage, definition, comparison and annotation.
  - Deterministic, simulated/imported and partial-data labels are unambiguous.
  - Drawer supports keyboard close/focus return and narrow screens.
  - Page includes tested loading, empty, partial and error states.
- Suggested commit: `feat(web): build deterministic weekly review experience`

### RCH-017 — Implement human decision and action tracking services

- Labels: `type:feature`, `area:api`, `priority:p0`, `demo-critical`
- Depends on: RCH-014, RCH-015
- Outcome: Managers can approve/dismiss/monitor proposals and create assigned actions with due/review dates.
- Acceptance criteria:
  - Only authorized managers can approve/dismiss; contributors can update assigned-action status.
  - Approval and action creation are transactionally consistent or safely retryable.
  - Every transition emits an audit event and action event.
  - Duplicate requests use idempotency keys.
  - Invalid roles, states, dates and cross-workspace IDs are tested.
- Suggested commits:
  - `feat(actions): add human decision and assignment workflow`
  - `test(actions): cover authorization and state transitions`

### RCH-018 — Build Actions and Activity experiences

- Labels: `type:feature`, `area:web`, `priority:p0`, `demo-critical`
- Depends on: RCH-017
- Outcome: The demo can complete the deterministic loop from evidence to owned work and trace the decision.
- Acceptance criteria:
  - Approval dialog shows recommendation, evidence, owner, due date, expected signal and review date.
  - Actions page groups overdue/in-progress/monitoring/completed work without a generic Kanban clone.
  - Activity timeline distinguishes human, system and future AI actors.
  - Evidence links remain navigable from action and audit detail.
  - Role-restricted controls and UI states have tests.
- Suggested commit: `feat(web): add action tracking and activity timeline`

## Milestone M3 — Live Google Connections and Scheduled Sync

**Demo checkpoint:** Show a secured Google connection, selected GA4/GSC resources, live or fixture mode, last/next sync, manually trigger a sync, and recover from a safe simulated error.

### RCH-019 — Replace development identity with production-capable application authentication

- Labels: `type:security`, `area:api`, `area:web`, `priority:p0`
- Depends on: RCH-003, RCH-004
- Outcome: Google OIDC application sign-in establishes a secure session while controlled demo identity remains environment-gated.
- Acceptance criteria:
  - OIDC requests only `openid email profile`.
  - API independently resolves workspace membership and role.
  - Secure cookie/session, CSRF and redirect validation are implemented.
  - Demo auth cannot be enabled in production configuration.
  - Auth and authorization integration/E2E tests pass.
- Suggested commits:
  - `feat(auth): add Google OIDC application sign-in`
  - `test(auth): enforce production and demo authentication boundaries`

### RCH-020 — Implement the encrypted OAuth credential vault

- Labels: `type:security`, `area:integrations`, `priority:p0`
- Depends on: RCH-003
- Outcome: Refresh tokens are envelope-encrypted behind a server-only interface with key rotation metadata.
- Acceptance criteria:
  - Plaintext tokens are never persisted, returned by DTOs or logged.
  - Encrypt/decrypt access is restricted to connection/sync services.
  - Local key provider and deployed Key Vault/KMS provider share an interface.
  - Rotation/re-encryption and corrupted-ciphertext failure paths are tested.
- Suggested commits:
  - `feat(security): add encrypted OAuth credential vault`
  - `test(security): verify token redaction and vault failure handling`

### RCH-021 — Implement Google data-connection OAuth and resource selection

- Labels: `type:feature`, `type:security`, `area:integrations`, `priority:p0`, `demo-critical`
- Depends on: RCH-019, RCH-020
- Outcome: A user can grant read scopes, return safely, select authorized GA4/GSC resources, and disconnect.
- Acceptance criteria:
  - Authorization code flow uses state and PKCE and an exact callback allowlist.
  - Identity sign-in and data-consent scopes are separate.
  - Scopes and selected resources are visible without exposing credentials.
  - Denied consent, expired code, missing scope, revoke and reconnect have stable errors.
  - All connection changes produce audit events.
- Suggested commits:
  - `feat(integrations): add Google data OAuth flow`
  - `feat(web): add Google resource selection`

### RCH-022 — Implement and contract-test the GA4 adapter

- Labels: `type:feature`, `area:integrations`, `priority:p0`
- Depends on: RCH-006, RCH-021
- Outcome: GA4 reporting data maps into normalized daily metrics with quota-aware error handling.
- Acceptance criteria:
  - Adapter reads only selected property and approved metric/dimension combinations.
  - Pagination/limits, timezone, quota status, retries and incompatible query errors are handled.
  - Native definitions and property/resource IDs are retained.
  - HTTP fixture contract tests cover success, empty, threshold/quality, 401, 403, 429 and 5xx.
- Suggested commit: `feat(integrations): add GA4 reporting adapter`

### RCH-023 — Implement and contract-test the Search Console adapter

- Labels: `type:feature`, `area:integrations`, `priority:p0`
- Depends on: RCH-006, RCH-021
- Outcome: Search Analytics data maps into normalized totals and top-row query/page observations.
- Acceptance criteria:
  - Adapter reads only the selected verified property.
  - Top-row limitation and coverage metadata propagate to evidence and UI.
  - Date overlap accounts for late-arriving/revised data.
  - Contract tests cover success, empty, permission loss, throttling and provider failure.
- Suggested commit: `feat(integrations): add Search Console adapter`

### RCH-024 — Add BullMQ synchronization orchestration and worker

- Labels: `type:feature`, `area:jobs`, `area:platform`, `priority:p0`
- Depends on: RCH-007, RCH-022, RCH-023
- Outcome: Manual and scheduled syncs run outside request handling with locking, retries, idempotency and durable run history.
- Acceptance criteria:
  - `apps/worker` consumes typed jobs and invokes adapters through the application service.
  - One active sync per connection is enforced.
  - Daily schedule, three-day overlap, bounded retry/backoff and dead-letter outcome are configured.
  - Manual sync returns accepted job/run identity, not a long-running response.
  - Worker/job integration tests use real PostgreSQL and Redis test dependencies where practical.
- Suggested commits:
  - `feat(jobs): add ReachOps synchronization worker`
  - `test(jobs): verify idempotency retries and connection locking`

### RCH-025 — Build Connections and sync-history UI

- Labels: `type:feature`, `area:web`, `priority:p0`, `demo-critical`
- Depends on: RCH-021, RCH-024
- Outcome: Connection trust and operational health are visible and demoable.
- Acceptance criteria:
  - Each card shows provider, live/simulated/imported mode, scopes, resource, last attempt/success, next run and health.
  - User can connect, reconnect, disconnect, trigger sync and inspect run detail according to role.
  - 401/expired grant, 403/missing access, 429/rate limit, partial and 5xx states use actionable copy.
  - A safe seeded error scenario can be toggled/reset for demonstration.
  - Accessibility and UI-state tests pass.
- Suggested commit: `feat(web): build connection health and sync history`

## Milestone M4 — Trustworthy AI to Approved Action

**Demo checkpoint:** Generate an AI weekly brief from a minimized fact packet, inspect evidence on each claim, approve a recommendation, assign it, and see separate AI/human audit events.

### RCH-026 — Build the minimized weekly fact packet

- Labels: `type:feature`, `area:ai`, `area:api`, `priority:p0`
- Depends on: RCH-013, RCH-014
- Outcome: A deterministic service constructs and hashes the only facts/context permitted for weekly generation.
- Acceptance criteria:
  - Packet contains exact evidence IDs, display/raw values, goals, annotations, quality flags and metric definitions.
  - Review/comment content is minimized and delimited as untrusted data.
  - Packet construction is tenant-scoped, deterministic and snapshot-tested.
  - No OAuth credentials, unnecessary PII or full provider payloads are included.
- Suggested commit: `feat(ai): build evidence-bounded weekly fact packet`

### RCH-027 — Define weekly-summary prompt and structured output contract

- Labels: `type:feature`, `area:ai`, `priority:p0`
- Depends on: RCH-026
- Outcome: Provider-neutral schemas require claim-level evidence, recommendations, confidence and caveats.
- Acceptance criteria:
  - Prompt forbids new calculations, unsupported numbers, causality, external actions and instruction following from source text.
  - Output schema rejects unknown evidence IDs and unsupported recommendation categories.
  - Prompt/template version is explicit.
  - Deterministic fake provider returns the flagship brief through the same schema.
- Suggested commit: `feat(ai): define grounded weekly briefing contract`

### RCH-028 — Implement AI evidence validation and adversarial evaluation

- Labels: `type:test`, `area:ai`, `type:security`, `priority:p0`
- Depends on: RCH-027
- Outcome: Invalid, hallucinated or injected outputs fail safely before reaching users.
- Acceptance criteria:
  - Validator rejects numbers/IDs absent from packet and recommendations without evidence.
  - Evaluation set covers normal, partial, stale, small-denominator, contradictory, provider-error and prompt-injection cases.
  - Causal-claim and PII-leak checks are represented.
  - Results are machine-readable in CI and summarized in documentation.
- Suggested commits:
  - `feat(ai): validate evidence-linked weekly output`
  - `test(ai): add adversarial weekly briefing evaluation`

### RCH-029 — Persist and expose AI generation lifecycle

- Labels: `type:feature`, `area:ai`, `area:api`, `priority:p0`
- Depends on: RCH-027, RCH-028
- Outcome: Generation records provider/model/template, fact hash, latency/usage, validation result, safe errors and resulting draft.
- Acceptance criteria:
  - Live provider and fake provider are explicitly configured; no silent fallback occurs.
  - Repeated click uses an idempotency key or creates an intentional new version.
  - Invalid output triggers bounded repair/retry then safe failure.
  - AI generation and brief creation emit separate audit events.
  - API integration tests cover success, invalid output, timeout and configuration failure.
- Suggested commit: `feat(ai): add weekly brief generation lifecycle`

### RCH-030 — Build the evidence-linked AI brief UI

- Labels: `type:feature`, `area:web`, `area:ai`, `priority:p0`, `demo-critical`
- Depends on: RCH-016, RCH-029
- Outcome: AI improves comprehension without obscuring deterministic facts or uncertainty.
- Acceptance criteria:
  - AI section is labeled with provider mode, generation time and “draft” status.
  - Every numerical claim has a working evidence link.
  - Deterministic observation, AI interpretation and human decision have distinct visual treatments.
  - Partial data/caveats remain prominent.
  - Generation loading, timeout, validation failure and unavailable-provider states are polished.
- Suggested commit: `feat(web): add grounded AI weekly brief`

### RCH-031 — Complete AI recommendation approval to action

- Labels: `type:feature`, `area:api`, `area:web`, `priority:p0`, `demo-critical`
- Depends on: RCH-017, RCH-018, RCH-030
- Outcome: A manager can approve the AI proposal, edit allowed action fields, assign Jonah, and see the trace from evidence to audit.
- Acceptance criteria:
  - AI cannot self-approve, set permissions or execute an external write.
  - Human edits are distinguished from generated text.
  - Resulting action links to recommendation, generation, brief and evidence.
  - Approval, edit, assignment and status events appear in Activity with correct actors.
  - Flagship E2E test completes the flow.
- Suggested commit: `feat(workflow): connect AI recommendation to human-owned action`

## Milestone M5 — Operational Trust and Resilience

**Demo checkpoint:** Intentionally show a stale/rate-limited connection and an unavailable AI provider; ReachOps degrades safely, explains impact, and preserves useful deterministic workflow.

### RCH-032 — Standardize domain errors and polished recovery states

- Labels: `type:feature`, `area:api`, `area:web`, `priority:p0`, `demo-critical`
- Depends on: RCH-025, RCH-030
- Outcome: Auth, connection, sync, data-quality and AI failures have stable codes, safe logs and actionable UI.
- Acceptance criteria:
  - Error catalog covers expired grant, missing scope/resource, throttling, provider outage, partial sync, stale source, invalid import and AI unavailable/invalid.
  - User messages explain impact and next action without exposing internals.
  - Correlation IDs connect UI support detail to sanitized logs.
  - Deterministic observations remain usable when AI is unavailable.
  - Failure-state integration and UI tests pass.
- Suggested commit: `feat(resilience): standardize ReachOps recovery experiences`

### RCH-033 — Add structured observability and job health

- Labels: `type:feature`, `area:platform`, `area:jobs`, `priority:p1`
- Depends on: RCH-024, RCH-029
- Outcome: Requests, provider calls and jobs are traceable without leaking secrets or source content.
- Acceptance criteria:
  - Structured logs include environment, service, correlation/request/job/run IDs, workspace ID where permitted, duration and result.
  - Tokens, auth codes, review text and AI prompt bodies are redacted.
  - Health endpoints distinguish API, database, Redis and worker readiness.
  - Metrics cover sync success/failure/staleness and AI validation/failure/latency.
  - Redaction and health behavior have tests.
- Suggested commit: `feat(observability): trace ReachOps requests syncs and AI generations`

### RCH-034 — Complete security hardening and threat-focused tests

- Labels: `type:security`, `area:platform`, `priority:p0`
- Depends on: RCH-019, RCH-020, RCH-021, RCH-028, RCH-033
- Outcome: Portfolio deployment meets its documented security baseline.
- Acceptance criteria:
  - Workspace isolation tests cover every core resource.
  - CSP/Helmet, rate limits, secure cookies, CORS/redirect allowlists and input limits are configured.
  - OAuth secrets/tokens do not appear in build output, browser responses, logs or test snapshots.
  - AI has no external-write capability and prompt-injection regression tests pass.
  - Dependency, secret and container scanning run in CI with documented triage policy.
- Suggested commits:
  - `feat(security): harden ReachOps application boundaries`
  - `test(security): add tenant OAuth and AI threat regressions`

### RCH-035 — Add audit filters, action review, and executive export

- Labels: `type:feature`, `area:web`, `area:api`, `priority:p1`
- Depends on: RCH-018, RCH-031
- Outcome: The product closes the management loop and produces a concise, honest interview artifact.
- Acceptance criteria:
  - Activity filters by actor class, event type, entity and date.
  - Actions due for review show expected signal and subsequent observations without causal language.
  - Weekly brief exports to print-friendly/PDF-friendly HTML or Markdown with evidence and disclosure.
  - Export is not a generic report designer and contains no hidden unsupported data.
  - Authorization and snapshot tests pass.
- Suggested commit: `feat(reporting): add review outcomes audit filters and brief export`

## Milestone M6 — Five-Minute Portfolio Release

**Demo checkpoint:** A clean clone can be configured, seeded, validated, deployed, reset, and demonstrated in five minutes with a documented 90-second fallback.

### RCH-036 — Complete visual, responsive and accessibility polish

- Labels: `type:feature`, `area:web`, `priority:p0`, `demo-critical`
- Depends on: RCH-011, RCH-016, RCH-018, RCH-025, RCH-030, RCH-035
- Outcome: The entire flagship path looks and behaves like one executive product.
- Acceptance criteria:
  - Shared tokens/components cover typography, spacing, cards, statuses, evidence, dialogs, tables and charts.
  - No placeholder copy, layout shift, inconsistent mode badges or dead-end controls remain.
  - WCAG 2.2 AA-oriented automated checks and keyboard walkthrough pass on the flagship path.
  - Responsive checks cover common laptop interview viewport and narrow/mobile fallback.
  - A visual regression baseline exists for the six primary screens.
- Suggested commit: `feat(web): polish ReachOps executive demo experience`

### RCH-037 — Ship deterministic demo operations and end-to-end rehearsal

- Labels: `type:test`, `area:demo`, `area:platform`, `priority:p0`, `demo-critical`
- Depends on: RCH-008, RCH-025, RCH-031, RCH-032, RCH-036
- Outcome: Start, seed, reset, error-scenario, validate and stop workflows are repeatable before interviews.
- Acceptance criteria:
  - Scripts start dependencies/apps/worker, run migrations, seed/reset exact demo data, report health and stop safely.
  - E2E suite covers 5-minute flagship path, 90-second fallback, expired connection and AI-unavailable path.
  - Demo reset never requires manual database editing.
  - Rehearsal checklist includes pre-authorized Google connection fallback and fixture mode.
  - Three consecutive clean rehearsals meet the timing and produce identical synthetic state.
- Suggested commits:
  - `feat(demo): automate ReachOps demo lifecycle`
  - `test(e2e): verify flagship and resilience journeys`

### RCH-038 — Deploy and document the portfolio release

- Labels: `type:docs`, `area:platform`, `priority:p0`, `demo-critical`
- Depends on: RCH-033, RCH-034, RCH-037
- Outcome: A hiring manager can understand, run and evaluate the project, and the owner can demonstrate a real deployment without inflated claims.
- Acceptance criteria:
  - Azure infrastructure/deployment is reproducible and uses managed secrets/identity.
  - CI runs format, lint, typecheck, unit, integration, E2E, build, migration and security checks appropriate to the repository.
  - README leads with business problem, five-minute scenario, architecture, real-vs-simulated integrations, AI controls, setup and screenshots.
  - Architecture diagram, ADRs, API docs, threat model, test strategy, AI disclosure and limitations are linked.
  - Production smoke test and rollback/runbook are complete.
  - No claim of customers, results, uptime or restricted API approval appears without evidence.
- Suggested commits:
  - `feat(infra): deploy ReachOps portfolio environment`
  - `docs(portfolio): publish ReachOps architecture and demo guide`

## Issue creation guidance

- Copy each `RCH-*` section into one GitHub issue.
- Use the `RCH-*` identifier in the issue title until GitHub issue numbers exist; then preserve it in the body for stable dependencies.
- Create only the current and next milestone at first. Keep later milestones in this register until earlier architecture assumptions are proven.
- Close an issue only when its acceptance criteria, tests, documentation, and demo increment are complete.
- Do not combine unrelated issues merely to reduce issue count; the commit boundary should remain reviewable and reversible.
