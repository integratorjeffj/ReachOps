# ReachOps

ReachOps is an online reach management application for a marketing manager at a growing small business. It turns fragmented digital-presence signals into evidence-linked priorities, human-owned work, and a measured answer about whether that work helped.

**▶ [Open the live demonstration](https://integratorjeffj.github.io/ReachOps/)** — no signup, no setup.

The organising idea is that a reporting product earns trust by being explicit about what it does not know. Every number carries the record it came from. Every recommendation carries the rule that produced it. Where something cannot be measured, the interface says so and explains why, rather than substituting a figure that looks like an answer.

---

## Five-minute walkthrough

The demonstration contains one connected story. Following it end to end covers most of what the product does.

1. **[Command Center](https://integratorjeffj.github.io/ReachOps/)** — Four headline metrics. Sessions rose 10.1%, but the AC repair booking rate fell from 6.10% to 3.92%. Click any evidence chip to see the provider, definition, reporting period, and data quality behind the number.

2. **[Opportunities](https://integratorjeffj.github.io/ReachOps/opportunities/)** — The deterministic rule engine flagged that divergence. Open REC-001: it is the only opportunity carrying a suggested explanation, held at medium confidence and labelled a hypothesis. The other five say plainly that no explanation is supported.

3. **[Search & Website → Technical](https://integratorjeffj.github.io/ReachOps/search/)** — On the same page, mobile interaction delay crossed the 200ms threshold, 198ms to 247ms, while desktop held steady. The panel notes that the deployment landed four days before the field window closed, so the measured change is damped.

4. **[Search & Website → AI answers](https://integratorjeffj.github.io/ReachOps/search/)** — Read "What this cannot tell you" first. Then the cost prompt: cited in three consecutive Perplexity checks, absent on the fourth. On a panel this small that is variance, and the interface says so.

5. **[Competitors](https://integratorjeffj.github.io/ReachOps/competitors/)** — Two of three rivals publish price ranges. Summit & Sage does not. That is the same gap the cost prompt exposed, seen from a completely different direction.

6. **[Work](https://integratorjeffj.github.io/ReachOps/actions/)** — The investigation is assigned, owned, and carries a review date. Nothing became work without a person approving it.

7. **[Reports](https://integratorjeffj.github.io/ReachOps/reports/)** — What happened after earlier work. One outcome rose 23%. One rose 20.1% during a seasonal peak, and the confounder is named beside the number. One is marked not measurable, because the metric it would have needed was never recorded.

8. **[Briefing](https://integratorjeffj.github.io/ReachOps/briefing/)** — The week in writing, composed only from facts that passed published admission rules, with the ten things it could not stand behind listed alongside.

Two details worth noticing along the way: no figure appears without an evidence identifier, and no recommendation becomes assigned work without a named human approving it.

---

## The loop

```text
Measure → Explain → Prioritize → Plan → Execute → Measure Outcome
```

The demonstration uses **Summit & Sage Home Services**, a fictional Denver-area business. All people, metrics, campaigns, reviews, accounts, and competitors are synthetic and labelled as such.

## The workspaces

| Route                | What it shows                                                                                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Command Center**   | Four KPIs with source mode, definition, and evidence ID; goals with attainment where it can be stated and "not yet measured" where it cannot; a 13-month trend with the business annotations recorded in the same window. |
| **Search & Website** | Performance, pages, and queries with a published coverage shortfall; a simulated technical audit with Core Web Vitals against real thresholds; an AI answer panel; local presence.                                        |
| **Social**           | Reach and engagement per platform, with each platform's own engagement basis carried alongside the number so two are never silently compared.                                                                             |
| **Content**          | The editorial pipeline and calendar, linked to the opportunities that motivated each piece.                                                                                                                               |
| **Opportunities**    | Every observation the rule engine emitted, the metric inputs behind it, the thresholds it tested, and its categorical priority. Blocked rules state why they stayed silent.                                               |
| **Work**             | Approved recommendations as owned work, by state, each tracing back to the evidence that triggered it.                                                                                                                    |
| **Reports**          | Movement, interpretation, decision, and outcome kept as four distinct kinds of claim rather than blurred into a narrative.                                                                                                |
| **Competitors**      | What three invented rivals publish, compared on signals a person could confirm by looking, with modelled figures kept separate from observed ones.                                                                        |
| **Briefing**         | The fact packet rendered as prose, with its admission rules, its boundaries, and its exclusions published alongside.                                                                                                      |
| **Connections**      | Per-source mode, authorized scope, resource, freshness, and an explicit statement of what is _not_ authorized.                                                                                                            |
| **Audit & Activity** | An append-oriented timeline keeping system synchronization and human decisions visually distinct.                                                                                                                         |

---

## How to go live

Everything in the published demonstration runs on committed fixtures. This is the honest inventory of what each part would need to run against a real business, including the parts that are harder than they look.

### Foundation

Before any integration, the deployed shape differs from the static demo: PostgreSQL, the NestJS API, a job runner for scheduled syncs, encrypted credential storage, and OAuth redirect URIs registered per provider. Tokens need rotation handling, and each provider needs its own rate-limit and backfill policy. The static export exists so the portfolio demo can be public; it is not the production topology.

### Per workspace

| Workspace                                          | Primary integration                                       | What configuration actually involves                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Command Center**, goals, outcomes                | **Google Analytics Data API v1**                          | OAuth 2.0 with `analytics.readonly` and a property ID. The real work is upstream: `confirmed_booking` is a custom event that must be defined and firing in GA4 before any of this means anything. Without it there is a session count and no conversion.                                                                                                                                                                            |
| **Search & Website** — performance, pages, queries | **Google Search Console API**                             | `webmasters.readonly` on a verified property. Expect a two-to-three day lag, 16-month retention, and withheld anonymised queries — which is why the coverage note in the demo publishes a shortfall rather than implying complete data.                                                                                                                                                                                             |
| **Search & Website** — technical audit             | **Your own crawler**                                      | No third-party product is required and none is a drop-in. Fetching, parsing, honouring `robots.txt`, and rate-limiting against a client site is a build, not a connection.                                                                                                                                                                                                                                                          |
| **Search & Website** — Core Web Vitals             | **CrUX API** (field) and **PageSpeed Insights API** (lab) | Both take a free Google API key. The catch: CrUX only has field data where a URL or origin has enough traffic, and many small-business pages have none. That absence is why the demo keeps field and lab in separate columns instead of averaging them.                                                                                                                                                                             |
| **Search & Website** — local                       | **Google Business Profile API**                           | Requires an access request approved by Google, which is a real gate and not instant. Until then, profile data stays simulated.                                                                                                                                                                                                                                                                                                      |
| **Search & Website** — AI answers                  | **None exists**                                           | No assistant publishes a citation-reporting interface, and Search Console does not break out AI Overview impressions. The honest options are a manual panel or a scripted harness — and scripted runs may breach provider terms, so check them before automating. Referral sessions are the one measurable part and come from GA4's session source dimension.                                                                       |
| **Social**                                         | **Meta Graph API**, **LinkedIn Community Management API** | The heaviest lift in the product. Meta needs an app, Business verification, App Review for `instagram_basic` / `pages_read_engagement` / `read_insights`, and an Instagram Professional account linked to a Facebook Page; long-lived tokens expire around 60 days and must be refreshed. LinkedIn's engagement data sits behind partner-program approval that is genuinely restricted. Plan for both to take longer than the code. |
| **Content**                                        | **Optional CMS read access**                              | WordPress REST, Contentful, or similar, read-only, to detect publishing cadence. Planning works without any integration. ReachOps deliberately does not publish, so no write scope is needed.                                                                                                                                                                                                                                       |
| **Competitors**                                    | **Places API**, plus your own observation                 | Public rating and review count for a business you do not own are available through Places. Everything else in that workspace is a person opening a website and recording what they see — which is the point, and it does not become more automatable by paying for it.                                                                                                                                                              |
| **Briefing**                                       | **A model provider API**                                  | The fact packet is assembled deterministically and handed to the model as the prompt, with the instruction to write only from it. No retrieval infrastructure is needed because the packet _is_ the context. The demo renders that same packet through fixed templates, so the public build needs no key.                                                                                                                           |
| **Opportunities**, **Work**, **Reports**           | **None**                                                  | These run on persisted observations. Once metrics are flowing, the rule engine, prioritisation, approval flow, and outcome measurement work with no further external configuration.                                                                                                                                                                                                                                                 |

### Suggested order

Connect **GA4 and Search Console first**. They carry the Command Center, the search workspaces, the rule engine's inputs, and outcome measurement — most of the product becomes real on those two alone. **CrUX and PageSpeed** are cheap to add next and need only an API key. **Google Business Profile** and the **social platforms** are approval-gated, so start those applications early and expect to wait. **Competitors and AI answers** need no credentials at all, because they are manual observation by design.

### What stays honest either way

Live data does not remove the constraints the demo models. Search Console still withholds anonymised queries. CrUX still has no data for low-traffic pages. Assistant answers are still non-deterministic. Competitor traffic is still unobservable. The quality gates, coverage notes, and "what this cannot tell you" panels are not scaffolding standing in for missing integrations — they are how the product behaves when the integrations are real.

---

## How the published demonstration stays honest

The live site is a static export with no database and no API, but it is **not** hand-written mock markup.

`pnpm demo:snapshot` runs the real `compareMetricPeriods`, `generateObservationCandidates`, and workspace builders against the committed Summit & Sage fixtures, then writes the generated snapshots under `apps/web/src/lib/demo/`. The web application parses each through its shared Zod contract at build time, so a hand-edited or drifted snapshot fails the build rather than rendering quietly. CI regenerates the snapshots and fails if the committed copies differ.

The deployed numbers are therefore the genuine output of the same deterministic code the application runs. Snapshots are split per workspace so no route downloads evidence it never cites.

ReachOps builds in two shapes:

```powershell
pnpm dev
```

```powershell
$env:REACHOPS_DEMO_MODE='static'; $env:NEXT_PUBLIC_BASE_PATH='/ReachOps'; pnpm demo:build
```

## Product boundaries

- Deterministic code owns arithmetic, quality gates, authorization, and state transitions.
- The AI layer explains a bounded fact packet. It cannot invent metrics, approve work, or write externally.
- Every recommendation requires evidence and human approval before it becomes assigned work.
- Live, simulated, and imported sources stay distinct through every derived output.
- No composite scores. No fabricated confidence percentages. No claim that a recommendation caused a measured change.
- ReachOps is not a scheduler, social inbox, BI builder, CRM, attribution engine, or autonomous marketing agent.

## Architecture

A TypeScript modular monolith managed with Turborepo:

- `apps/web` — Next.js 15 interface, dual-mode (server-rendered or static export).
- `apps/api` — NestJS 11 REST API.
- `packages/contracts` — Shared Zod contracts for metric meaning, evidence, provenance, quality, comparisons, and every workspace snapshot.
- `packages/database` — PostgreSQL/Prisma schema, the deterministic demo builders, and the fixtures.
- `packages/integrations` — Source adapters and normalized batch contracts.

The schema establishes workspace isolation, users and memberships, goals, campaigns, annotations, source resources, synchronization lineage, normalized observations, import provenance, server-only encrypted credential metadata, append-oriented audit events, and versioned demo metadata.

See the [architecture blueprint](docs/implementation/reachops-architecture-blueprint.md), [roadmap](docs/implementation/reachops-portfolio-roadmap.md), and [issue register](docs/implementation/github-issue-register.md).

## Local setup

Requirements: Node.js 24+, pnpm 10.33.4, Docker Desktop.

```powershell
Copy-Item .env.example .env
pnpm install
docker compose up -d
$env:DATABASE_URL='postgresql://reachops:reachops@localhost:5440/reachops'
pnpm db:migrate
pnpm demo:seed
pnpm dev
```

Web: `http://localhost:3000` · API health: `http://localhost:3001/api/v1/health`

Port `5440` is used deliberately so this project does not conflict with other local PostgreSQL instances.

## Validation

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

371 tests pass without a database, plus PostgreSQL-gated integration specs: 131 in the web application, 215 in the database package, 19 in contracts, 5 in integrations, and the API identity suite.

Coverage includes metric and provenance contracts, schema invariants, PostgreSQL idempotency and lineage, exact synthetic values, scoped demo reset, the deterministic rule engine, every workspace view rendered from its committed snapshot, and automated accessibility checks on each one. Those accessibility checks have caught real defects — a broken heading order, a grid role on non-grid markup, and duplicate landmark names.

Run `pnpm demo:snapshot` after changing any fixture or deterministic service; the committed snapshots must be regenerated or CI will fail. Use `pnpm demo:reset` to restore the stable Summit & Sage records and frozen reporting window.

## Source and AI disclosure

- GA4 and Search Console are modelled as read-only, live-capable adapters with explicit fixture fallback. No live property is connected.
- GBP, Meta, and LinkedIn are simulated or imported within the approved portfolio scope.
- The three competitors are invented. No data was gathered about any real business.
- The AI answer panel records simulated checks. No assistant was queried.
- No restricted API approval or real deployment is claimed.
- ReachOps was researched and developed with AI assistance. Product scope, architecture choices, source verification, security decisions, acceptance, and claims remain human-owned.

## Documentation authority

Repository authority and recovered state are defined in [CLAUDE.md](CLAUDE.md) and [HANDOFF.md](HANDOFF.md). ADR-002 establishes ReachOps as independent from ProcessForge and LaunchPath while retaining only explicitly approved architecture patterns.

## License

[MIT](LICENSE)
