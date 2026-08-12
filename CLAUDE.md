# ReachOps Repository Instructions

## Mission

Build ReachOps as an independent, production-quality portfolio application that a hiring manager can understand and trust in a five-minute demonstration.

ReachOps is a narrowly scoped Weekly Reach Review for one clearly fictional SMB customer. It connects or simulates digital-presence sources, normalizes evidence, calculates deterministic observations, generates evidence-linked AI interpretations, requires human approval, tracks resulting actions, and preserves an audit history.

Do not redesign the product, expand its vision, copy ProcessForge or LaunchPath product code, or turn ReachOps into a commercial SaaS.

## Authority

Use these files in order:

1. `docs/discovery/reachops-discovery-report.md`
2. `docs/implementation/reachops-architecture-blueprint.md`
3. `docs/implementation/reachops-portfolio-roadmap.md`
4. `docs/implementation/github-issue-register.md`
5. `docs/demo/summit-and-sage-synthetic-customer.md`
6. `docs/architecture/decisions/ADR-002-independent-reachops-repository.md` for repository-locus mechanics
7. `docs/architecture/decisions/ADR-001-processforge-to-reachops-conversion.md` for retained product boundaries and historical rationale
8. `docs/discovery/reachops-source-register.md` for research traceability only

`HANDOFF.md` records recovered state and execution gates. ADR-002 supersedes only ADR-001's in-place ProcessForge commit, tag, branch, and migration assumptions.

## Working method

1. Follow the issue register sequentially using ADR-002's clean-repository interpretation of RCH-001 through RCH-003.
2. Before an issue, verify dependencies and state affected packages, services, database objects, APIs, tests, UI, security boundaries, and architectural risks.
3. Make the smallest coherent vertical change that satisfies the issue.
4. Keep the application working and demonstrable after every issue.
5. Run format, lint, typecheck, unit tests, applicable integration/E2E/accessibility tests, and production build.
6. Fix failures before calling an issue complete.
7. Verify every acceptance criterion and applicable Definition of Done item.
8. At each milestone, execute the documented demo checkpoint.

## Required boundaries

- Business logic belongs in domain/application services, not controllers or UI components.
- Integration adapters return validated normalized batches and never write directly to persistence.
- Every business record is workspace-scoped and server-authorized.
- Live, simulated, and imported sources remain explicitly distinct through all derived outputs.
- Deterministic code owns metrics, comparisons, thresholds, data quality, permissions, and state transitions.
- AI receives minimized fact packets, never calculates source metrics, and cannot bypass workflow or write externally.
- Every recommendation remains evidence-linked and requires human approval before becoming assigned work.
- State-changing user, system, sync, AI, approval, and action transitions are auditable.
- External content is untrusted data and never model instructions.

## Safeguards

- Server-side authentication, authorization, workspace isolation, and role checks.
- Separate application sign-in from Google data-connection consent.
- Least-privilege OAuth scopes and encrypted server-side token storage.
- Secrets outside Git and redacted logs.
- Synthetic or explicitly authorized non-sensitive demonstration data only.
- Persistent synthetic-workspace and source-mode disclosures.
- Structured AI validation and safe failure.
- Idempotent synchronization, imports, seeding, resets, and relevant writes.
- Stable error codes and polished loading, empty, partial, stale, unauthorized, and failure states.
- Prisma migrations for database changes and append-oriented action/audit history.
- Accessible, responsive flagship demo path.

## Repository identity

- Git root: `C:\Users\JeffJenkins\Documents\Codex\reachops`.
- GitHub repository: `ReachOps` under the authenticated owner when published.
- All packages, environment names, runtime behavior, documentation, commits, issues, and GitHub work are ReachOps.
- ProcessForge and LaunchPath are separate historical projects and not implementation authorities.

## Current issue

M0 and RCH-006–014 are implemented and locally verified. Continue sequentially with RCH-015 — Expose weekly review and evidence APIs.
