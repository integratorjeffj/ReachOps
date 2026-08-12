# ReachOps

ReachOps is an evidence-linked Weekly Reach Review for a marketing manager at a growing small business. It is a portfolio application that demonstrates how fragmented digital-presence signals can become a trustworthy weekly decision and human-owned action.

> **Current release: M0 foundation plus RCH-006–010.** The independent repository, ReachOps domain baseline, responsive application shell, synthetic customer disclosure, shared metric/provenance contracts, ingestion persistence, versioned Summit & Sage seed/reset, simulated GBP/imported LinkedIn adapters, and the tenant-scoped executive overview API are implemented. The populated Overview UI, deterministic analysis, live Google connections, AI briefing, and action workflows remain later milestones and are not represented as complete.

## The five-minute story

ReachOps is designed around one operating loop:

```text
connect or inspect sources → synchronize → normalize → detect facts
→ generate an evidence-linked weekly brief → human approves a recommendation
→ assign action → inspect audit history
```

The demonstration uses **Summit & Sage Home Services**, a completely fictional Denver-area business. All people, metrics, campaigns, reviews, accounts, and actions are synthetic. The frozen fixture preview is clearly labeled and must never be confused with live customer data.

## Product boundaries

- Deterministic code owns arithmetic, quality gates, authorization, and state transitions.
- AI may later explain a minimized fact packet; it cannot invent metrics, approve work, or write externally.
- Every recommendation requires evidence and human approval before it becomes assigned work.
- Live, simulated, and imported sources remain distinct through every derived output.
- ReachOps is not a scheduler, social inbox, BI builder, CRM, attribution engine, or autonomous marketing agent.

## Architecture

The documented target is a TypeScript modular monolith:

- `apps/web` — Next.js 15 responsive interface.
- `apps/api` — NestJS 11 REST API foundation.
- `packages/contracts` — Shared Zod contracts for metric meaning, evidence, provenance, quality, and comparisons.
- `packages/database` — PostgreSQL/Prisma schema and migration discipline.
- Later milestones add shared contracts, integrations, a BullMQ worker, deterministic insight services, and the bounded AI provider layer.

The schema establishes workspace isolation, users/memberships, goals, campaigns, annotations, source resources, synchronization lineage, normalized observations, import provenance, server-only encrypted credential metadata, append-oriented audit events, and versioned demo metadata.

See the [architecture blueprint](docs/implementation/reachops-architecture-blueprint.md), [roadmap](docs/implementation/reachops-portfolio-roadmap.md), and [issue register](docs/implementation/github-issue-register.md).

## Local setup

Requirements:

- Node.js 24+
- pnpm 10.33.4
- Docker Desktop for PostgreSQL and Redis checks

```powershell
Copy-Item .env.example .env
pnpm install
docker compose up -d
$env:DATABASE_URL='postgresql://reachops:reachops@localhost:5440/reachops'
pnpm db:migrate
pnpm demo:seed
pnpm dev
```

Web: `http://localhost:3000`  
API health: `http://localhost:3001/api/v1/health`

Port `5440` is intentionally used for ReachOps PostgreSQL so the independent project does not conflict with the historical ProcessForge development database.

## Validation

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm db:validate
```

Use `pnpm demo:reset` to restore only the stable Summit & Sage records and frozen reporting window. The command verifies the exact workspace and dataset markers before deleting seeded records; separately identified live connections and other workspaces are preserved.

Tests cover API identity, metric/provenance contracts, schema invariants, PostgreSQL idempotency and lineage, exact synthetic values, scoped demo reset, navigation/current state, landing content, and an automated accessibility smoke check.

## Source and AI disclosure

- GA4 and Search Console are planned as read-only, live-capable adapters with explicit fixture fallback.
- GBP, Meta, and LinkedIn are simulated/imported in the approved portfolio scope unless legitimate access is later obtained and documented.
- No restricted API approval or real deployment is claimed.
- ReachOps was researched and developed with AI assistance. Product scope, architecture choices, source verification, security decisions, acceptance, and claims remain human-owned.

## Documentation authority

Repository authority and recovered state are defined in [CLAUDE.md](CLAUDE.md) and [HANDOFF.md](HANDOFF.md). ADR-002 establishes ReachOps as independent from ProcessForge and LaunchPath while retaining only explicitly approved architecture patterns.

## License

[MIT](LICENSE)
