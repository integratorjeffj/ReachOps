# ReachOps Discovery Report

**Research date:** 2026-08-10  
**Phase:** Discovery and research only — no application implementation  
**Decision:** **Worth narrowing; conditional portfolio go**

> This report evaluates public product information and current platform documentation. It does not claim that ReachOps is deployed, that any restricted API access has been granted, or that any business outcome has occurred. Source IDs refer to the companion [source register](reachops-source-register.md).

## 1. Executive Summary

ReachOps is strong enough to become a portfolio project **only after a deliberate narrowing**. The broad idea—one place to manage digital presence—is already served by mature social suites, agency dashboards, SEO platforms, reputation tools, connector products, and enterprise marketing-intelligence systems. A broad “all your marketing in one dashboard” product would look derivative and would create an integration-maintenance burden that obscures the professional story the project is meant to tell.

The defensible version is narrower:

> **ReachOps turns trusted website, search, local-presence, and imported channel signals into a weekly, evidence-linked priority queue for the person responsible for a growing small business’s digital presence.**

That framing changes the product from a reporting warehouse or scheduler into an operating workflow. It answers three questions:

1. What materially changed?
2. Why might it matter, with uncertainty made visible?
3. What should a human review, assign, or do next?

The recommended first user is a **marketing manager or marketing generalist at a growing, location-based small or midsize business**. This user owns results across several channels but lacks specialist analysts and cannot spend each Monday reconciling dashboards. Agency account managers are a credible future segment, but choosing agencies first would pull the MVP toward multi-client administration, white labeling, report templating, and billing—the center of gravity of AgencyAnalytics and similar products rather than ReachOps’s intended differentiation.

The recommended MVP is a **read-only Weekly Reach Review** with:

- real OAuth and REST integrations for Google Analytics 4 and Google Search Console;
- a normalized daily metric store with source, scope, freshness, and quality metadata;
- deterministic period comparisons, anomaly candidates, and data-quality checks;
- an evidence-linked AI management brief that can explain but cannot invent or recalculate metrics;
- a human-controlled priority queue with owner, status, due date, rationale, and audit history;
- CSV import for one gated or unsupported channel, proving adapter design without pretending API access;
- an optional Google Business Profile adapter only if legitimate access is approved; otherwise a clearly labeled fixture/import adapter;
- transparent error, stale-token, missing-data, and partial-sync states.

The MVP should **not** include social publishing, a universal inbox, social listening, rank crawling, ad optimization, automatic review replies, or autonomous actions. Those features are crowded, high-risk, or access-dependent. Excluding them is part of the product strategy, not a lack of ambition.

### Portfolio verdict

| Decision                                  | Assessment                                                                                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Strong enough as originally broad concept | No                                                                                                                                          |
| Worth abandoning                          | No                                                                                                                                          |
| Worth modifying                           | Yes                                                                                                                                         |
| Worth narrowing                           | **Yes — recommended**                                                                                                                       |
| Recommended investment posture            | Build only after validating the weekly-prioritization problem with 5–8 target users and confirming at least one real GA4 + GSC test account |

If built with honest documentation, this project can visibly demonstrate API evaluation, OAuth, data normalization, deterministic analytics, appropriate AI boundaries, workflow design, security controls, testing, and business translation. That evidence fits an **Operator + Integrator + Coach** profile better than a feature-heavy social-media clone.

## 2. Business Problem

### 2.1 Problem statement

Digital-presence data is fragmented by vendor and professional discipline. GA4 describes on-site behavior; Search Console describes Google organic-search exposure; Google Business Profile describes local discovery and reviews; social platforms describe reach and engagement inside their own ecosystems; ad platforms describe paid delivery; SEO tools add competitive or rank data. Each product uses different identities, date handling, attribution rules, metric definitions, retention periods, and authorization models.

The operational failure is not merely “too many dashboards.” It is the absence of a repeatable management loop:

```text
observe trustworthy signals → detect meaningful change → explain context
→ choose a priority → assign action → revisit the result
```

Typical workarounds—spreadsheets, screenshot decks, emailed PDFs, and verbal status updates—can report numbers but rarely preserve lineage, reasoning, ownership, and follow-through together.

### 2.2 Why the problem matters

- Channel owners optimize locally. A strong social post may not produce useful website behavior; rising site traffic may hide declining search visibility; review deterioration may be invisible in an executive traffic report.
- Metrics create false comparability. An “impression,” “engagement,” or “conversion” does not have a universal definition across platforms.
- Small teams face attention scarcity. The relevant management output is not twenty charts; it is a defensible choice about where to spend the next hour or week.
- Data quality is operational risk. Expired OAuth grants, missing dates, API thresholding, revised platform metrics, and partial syncs can produce confident but wrong narratives.
- Reports are often terminal artifacts. They describe last month but do not create accountable work or record whether advice was accepted.

### 2.3 Product thesis

ReachOps should compete on the workflow between analytics and action:

- **Visibility:** a compact cross-channel health view with freshness and source lineage.
- **Analysis:** deterministic comparisons and anomaly candidates before any AI narrative.
- **Prioritization:** ranked, explainable issues/opportunities with confidence and impact framing.
- **Workflow:** human triage, assignment, status, notes, and revisit dates.
- **Action:** proposed next steps and draft artifacts, never silent external execution.

### 2.4 Non-goals

ReachOps is not initially:

- a social scheduler;
- a social inbox or listening product;
- an SEO crawler or keyword database;
- a CRM or marketing-automation platform;
- a general-purpose business-intelligence builder;
- an attribution system claiming cross-channel causality;
- an autonomous marketing agent.

## 3. Target Users

### 3.1 Persona evaluation

| User                              | Core need                                                               | Fit with ReachOps                                              | MVP concerns                                                                            | Priority           |
| --------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------ |
| Small-business owner              | Know whether digital activity is helping and what needs attention       | High pain, values plain language                               | Often lacks time, data maturity, clean configuration, or direct platform administration | Secondary          |
| Marketing manager/generalist      | Reconcile channels, explain results, choose priorities, coordinate work | **Best combination of pain, repeated workflow, and authority** | Needs trust, drill-down evidence, and configurable goals                                | **Primary**        |
| Marketing coordinator             | Pull reports and execute content/tasks                                  | Strong daily user and beneficiary                              | May not own prioritization or budget decisions                                          | Secondary/operator |
| Agency account manager            | Monitor many clients and prepare reports/actions                        | Strong recurring need                                          | Quickly requires tenancy, white label, templates, permissions, and client economics     | Later segment      |
| Executive                         | Receive concise outcomes, risks, and asks                               | Strong consumer of a monthly brief                             | Usually not the configuring or daily operating user                                     | Viewer persona     |
| Sales/business-development leader | Understand reach, demand signals, and campaign support                  | Partial fit when CRM/conversion data exists                    | Marketing platform metrics alone cannot prove pipeline or revenue                       | Later stakeholder  |

### 3.2 Recommended primary persona

**Morgan — Marketing Manager/Generalist at a growing local or regional service business**

- Company: 20–250 employees, one to ten locations, meaningful website and Google presence.
- Team: Morgan plus zero to three internal contributors and perhaps a freelancer or agency.
- Channels: GA4, Search Console, Google Business Profile, Facebook/Instagram, LinkedIn, occasional paid media.
- Accountability: website demand, organic visibility, content performance, local reputation, and executive reporting.
- Constraint: no dedicated marketing analyst; limited time and uneven access to specialist tools.

### 3.3 Jobs to be done

When Morgan starts the week, help them:

1. confirm that data sources are connected and current;
2. see which changes exceed ordinary variation or a business-defined threshold;
3. understand the evidence and limitations behind each observation;
4. distinguish “monitor” from “investigate now”;
5. convert selected observations into owned actions;
6. explain priorities to an executive without rebuilding a slide deck;
7. revisit previous actions and see whether the relevant signal moved.

### 3.4 Frustrations

- Logging into many products and manually aligning dates.
- Copying metrics into a spreadsheet only to explain why totals do not match.
- Receiving generic AI advice detached from actual business context.
- Discovering too late that a token expired or a source stopped syncing.
- Treating channel engagement as business impact without conversion evidence.
- Repeating the same report-production work with no durable action history.

### 3.5 Decisions and information needs

| Decision                          | Information needed                                                     | Necessary caution                                                            |
| --------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Investigate a traffic change?     | Comparable periods, channel/landing-page breakdown, event completeness | Seasonality and tracking changes can mimic performance changes               |
| Create or update content?         | Query/page movement, existing page engagement, past content themes     | Search exposure does not prove intent or conversion value                    |
| Respond to a review trend?        | Rating/review counts, recent themes, response status                   | Review text is untrusted external content; preserve privacy and human review |
| Shift attention between channels? | Goal-aligned trends, data freshness, effort/context supplied by user   | Cross-platform reach metrics are not directly interchangeable                |
| Escalate to leadership?           | Materiality, duration, business goal, clear ask                        | Avoid causal or ROI claims without cost and outcome data                     |

### 3.6 Desired outcomes

- Reduce manual preparation for the weekly review.
- Make important changes harder to miss.
- Make recommendations traceable to source facts.
- Improve consistency of follow-through.
- Communicate uncertainty rather than hide it.
- Create a lightweight operating history of decisions and results.

## 4. Competitive Landscape

The following “solves poorly” statements are **structural gaps relative to ReachOps’s target workflow**, not claims that a vendor is defective. Many products could be configured or extended to address parts of the gap.

### 4.1 Category assessment

| Category and representatives                                                   | Primary segment                                                   | Solves well                                                                          | Structural gap for ReachOps’s user                                                                           | Common pricing pattern                                                                                                        | ReachOps differentiation                                                                         | Clone features to avoid                                                |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Social media management — Sprout Social, Hootsuite, Buffer, Metricool          | Creators/SMBs at low end; teams, agencies, enterprise at high end | Publishing calendars, engagement inboxes, approvals, social analytics, listening     | Website/search/local signals are secondary; action queues center on social production and engagement         | Freemium or trial; per channel/brand/user; advanced analytics/listening add-ons ([S01–S04, S06](reachops-source-register.md)) | Cross-domain operational priority review, not publishing throughput                              | Scheduler, unified inbox, listening firehose, influencer suite         |
| Social/content planning — Later, Buffer, Planable-style products               | Creators, social teams, agencies                                  | Visual calendar, content preview, approvals, media workflow                          | Planning usually begins with content to publish, not cross-channel evidence about business priorities        | Social sets/accounts, users, posts, AI credits ([S03, S05](reachops-source-register.md))                                      | Evidence-to-action loop can create a content opportunity without becoming the calendar of record | Drag-and-drop calendar, asset library, auto-posting parity race        |
| Social analytics — Sprout, Metricool, platform-native analytics                | Professional social teams, agencies                               | Post-level metrics, benchmarks, audience and engagement reporting                    | Often remains within channel taxonomies; normalized “one score” can conceal meaning                          | Bundled by tier; premium history/reports/benchmarks ([S01, S06](reachops-source-register.md))                                 | Preserve native definitions, show comparable trends only, attach decisions and owners            | Invented universal engagement score, vanity-metric leaderboard         |
| SEO platforms — Semrush, Ahrefs-class tools                                    | SEO practitioners, agencies, larger SMBs                          | Keyword research, rank tracking, competitive intelligence, backlink and site audit   | Expensive and specialist-heavy for a generalist; workflow centers on SEO, not whole presence                 | Project/keyword/crawl limits; user fees; API in high tiers or usage units ([S07, S54](reachops-source-register.md))           | Use first-party Search Console evidence to prioritize understandable work                        | Build a crawler, backlink index, or keyword database                   |
| Local SEO/GBP — BrightLocal, Semrush Local                                     | Local businesses, agencies, multi-location teams                  | Local rank tracking, citations, GBP audits, listing management                       | Specialized local-search view; not a complete website/content operating loop                                 | Per location, keyword/grid credits, managed-service upsells ([S08](reachops-source-register.md))                              | Combine first-party local, search, and site signals into a weekly decision                       | Citation network, geo-grid rank tracker, listing distribution          |
| Reputation management — Birdeye, ReviewTrackers/Podium-class tools             | Multi-location businesses, regulated/local services               | Review requests, monitoring, response workflows, listings, sentiment at scale        | Often sales/experience-centric and priced/packaged for locations; limited first-party search/site diagnosis  | Custom quote based on locations/modules/messages ([S09](reachops-source-register.md))                                         | Treat reviews as one risk/opportunity signal with safe AI theme extraction and approval          | Review solicitation, auto-reply agent, omnichannel messaging           |
| Agency reporting — AgencyAnalytics, DashThis-class tools                       | Agencies and consultants                                          | Client dashboards, white-label reports, scheduled delivery, many connectors          | Reporting artifact is primary; action follow-through and client operating decisions are less central         | Per client/campaign/integration/user; white label at higher tiers ([S10, S11](reachops-source-register.md))                   | Single-business operational review with evidence-to-action audit trail                           | White-label report builder, client billing/admin, template marketplace |
| Executive/KPI dashboards — Databox, Looker Studio                              | SMB leadership, analysts, agencies                                | Flexible visualization, scorecards, broad connectors, shareable dashboards           | Requires users to define metrics and interpret them; dashboards do not inherently create a decision workflow | Free/base tier plus sources/users/data volume; third-party connector fees ([S12–S14](reachops-source-register.md))            | Opinionated digital-reach schema, health checks, priority queue, plain-language evidence         | General BI canvas or arbitrary dashboard builder                       |
| Marketing data pipelines — Supermetrics, Funnel-class tools                    | Agencies, analysts, data teams                                    | Reliable extraction to spreadsheets, BI, and warehouses; broad connector maintenance | Moves data but does not own management interpretation or action                                              | Destination + data sources + accounts + users/volume ([S15, S16](reachops-source-register.md))                                | Small curated connector set plus operational semantics and workflow                              | Promise hundreds of connectors or become ETL infrastructure            |
| Marketing automation/intelligence — HubSpot, Salesforce Marketing Intelligence | Growing firms to enterprise                                       | CRM-linked campaigns, automation, attribution/reporting, governance at scale         | Cost, implementation, and data-model complexity exceed an SMB generalist’s weekly need                       | Contacts, seats, editions, usage/rows, onboarding, custom quote ([S17, S18](reachops-source-register.md))                     | Lightweight complement that makes no CRM replacement or causal attribution claim                 | CRM, journey builder, campaign orchestration, enterprise attribution   |

### 4.2 Common feature patterns

Across categories, common features are dashboards, scheduled reports, exports, alerting, templates, AI summaries, account grouping, role-based access, and progressively longer historical retention. In social products, publishing, calendars, inboxes, approvals, link-in-bio, and AI caption generation recur. In agency products, white labeling and multi-client management recur. In SEO/local tools, tracked entities—domains, keywords, locations, grids, citations—drive both product limits and pricing.

ReachOps should not adopt those features by default. Each feature must strengthen the target operating loop. For example, a scheduled weekly brief is relevant; a generic scheduled PDF designer is not. A proposed content action is relevant; a full publishing calendar is not.

### 4.3 Market gap and defensibility

There is no credible claim that competitors cannot combine data or generate summaries. ReachOps’s defensibility must instead be the coherence of its workflow and trust model:

- metric lineage and native definitions visible beside every observation;
- data freshness and partial-sync states treated as first-class product information;
- deterministic change detection separated from AI interpretation;
- recommendations explicitly linked to evidence, business goals, confidence, and counter-evidence;
- human triage and action ownership;
- outcomes revisited without claiming causal proof;
- a small-business vocabulary rather than analytics jargon.

That is a plausible portfolio distinction. It is not yet a proven commercial moat.

## 5. Integration/API Feasibility Matrix

### 5.1 Feasibility scale

- **Green:** realistic real API for an individual portfolio project with an owned/authorized account.
- **Amber:** technically feasible but access review, business verification, policy, account prerequisites, or product cost create material uncertainty.
- **Red:** unsuitable as an MVP dependency; use a documented import/fixture adapter or defer.

### 5.2 Required and major platforms

| Source                             | API/authentication                                                                                                                                                | Read capability                                                                                                                                   | Write capability                                                                                                 | Permissions, approval, and material limits                                                                                                                                                                                                                                                                                                                                       | SMB / portfolio realism                                                                                                         | MVP treatment                                                                                                                                                   |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Google Analytics 4**             | Google Analytics Data API; OAuth 2.0 delegated user or service account with property access; prefer `analytics.readonly` ([S19–S21](reachops-source-register.md)) | Reports across dimensions/metrics, date ranges, realtime where needed                                                                             | Data API is reporting-oriented; Admin API is separate and unnecessary                                            | OAuth consent configuration; quota uses token buckets by property/project, plus concurrency and error limits; query complexity matters ([S20](reachops-source-register.md))                                                                                                                                                                                                      | **Green.** Common SMB property; actual read-only demo is realistic with an authorized property                                  | **Core real connector**. Daily aggregate sync; no admin/write scope                                                                                             |
| **Google Search Console**          | Search Console API; OAuth 2.0 ([S22](reachops-source-register.md))                                                                                                | Search Analytics clicks, impressions, CTR, position by date/query/page/country/device; site/sitemap metadata                                      | Sitemap submission and site operations exist but are out of scope                                                | User must have property access; API returns top rows rather than guaranteeing every row, so totals and detailed rows require careful labeling ([S23](reachops-source-register.md))                                                                                                                                                                                               | **Green.** Use an owned/verified portfolio or business site                                                                     | **Core real connector**. Read-only, with explicit top-row/privacy limitation                                                                                    |
| **Google Business Profile**        | Multiple GBP APIs; OAuth 2.0 `business.manage`; Google project and GBP API access approval ([S24–S26](reachops-source-register.md))                               | Performance time series, search keywords, location data, verified-location reviews and aggregate rating ([S27, S28](reachops-source-register.md)) | Location/profile management and review replies exist                                                             | No sandbox; valid business reason, website, organization account and verified listing expected; non-zero quota signals approval. Policies restrict third-party automated use, require specific consent for actions, and restrict storage of GBP “Content,” including a 30-day temporary-storage rule in the cited policy ([S25, S29, S30](reachops-source-register.md))          | **Amber.** Valuable for target persona but unsuitable as a guaranteed portfolio dependency                                      | Optional real adapter only after written approval/policy check; otherwise labeled fixture/CSV. Keep MVP read-only and design short retention for review content |
| **Google Ads**                     | Google Ads API; OAuth plus developer token from a manager account ([S31–S33](reachops-source-register.md))                                                        | Campaign/account reporting and performance queries                                                                                                | Campaign/ad/keyword management if permissible use grants it                                                      | Token access levels: test, Explorer, Basic, Standard; daily operation limits and application review; permissible use may be reporting-only ([S32](reachops-source-register.md))                                                                                                                                                                                                  | **Amber-green for a test account; amber for production SMB accounts.** An individual may apply using a credible online presence | Defer from core. A reporting-only test-account adapter is a later portfolio enhancement                                                                         |
| **Facebook Pages**                 | Meta Graph/Pages APIs; Facebook Login for Business; user and Page access tokens                                                                                   | Managed Page metadata, posts, engagement and Page insights when permissions/access allow                                                          | Page publishing, comments and other management with additional permissions                                       | Common scopes include `pages_show_list`, `pages_read_engagement`, `read_insights`; writes require permissions such as `pages_manage_posts`. Serving assets not owned/managed by the developer requires App Review/advanced access. Rate limits are usage- and business-context-dependent; implement header-aware backoff. Confirm exact scopes in the current Meta App Dashboard | **Amber.** Owned Page testing is plausible; a general SMB SaaS claim is not credible without review                             | Optional owned-asset proof after GA4/GSC. Otherwise import adapter. No writes in MVP                                                                            |
| **Instagram professional account** | Instagram API with Instagram Login or Facebook Login; OAuth access token ([S34](reachops-source-register.md))                                                     | Professional account/media insights, owned media, comments; metrics include reach/engagement depending on login model                             | Content publishing and comment management with separate scopes                                                   | Business/Creator only, not personal accounts; scopes include `instagram_business_basic` + `instagram_business_manage_insights` or Facebook-login equivalents; Advanced Access for accounts the app does not own/manage; some metrics unavailable below 100 followers; user metric data stored up to 90 days ([S34](reachops-source-register.md))                                 | **Amber.** Owned professional account can support a demo; external-customer access requires review                              | Optional owned-account read adapter or CSV. Avoid making Instagram access a completion criterion                                                                |
| **LinkedIn company pages**         | LinkedIn Marketing Community Management APIs; three-legged OAuth ([S35](reachops-source-register.md))                                                             | Organization posts and organization share/page/follower statistics, subject to scopes and admin role ([S38](reachops-source-register.md))         | Organization posting/comment/like via Posts API and `w_organization_social` ([S37](reachops-source-register.md)) | Mandatory Community Management access request; verified organization, website/domain, business email and associated Page; tier review. Access tokens default to 60 days; programmatic refresh tokens require approved MDP-partner capability ([S36, S39](reachops-source-register.md))                                                                                           | **Red for MVP dependency.** Technical API exists, but portfolio approval and durable scheduled access are uncertain             | CSV/manual import or fixture adapter. Re-evaluate only after app review approval; no scrape workaround                                                          |

### 5.3 Other candidate sources

| Source                        | Feasibility and limitations                                                                                                                                                                                                                                                                                   | Read/write                                                                             | Portfolio recommendation                                                                                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **YouTube**                   | OAuth-authorized Analytics API exposes views, watch time, engagement, subscriber and other channel/video reports ([S40](reachops-source-register.md))                                                                                                                                                         | Rich read; group management exists; upload/write belongs to other APIs/scopes          | **Green.** Good later read-only connector if target interviews show video matters. Not needed for MVP                                                                      |
| **TikTok**                    | Display API returns profile/recent owned-video metadata and public counts; deeper Business Organic/Marketing APIs exist but production apps are reviewed. Apps cannot be personal-only for approval; posting needs approved scope and unaudited posts remain private ([S41–S44](reachops-source-register.md)) | Limited useful read through Display API; posting possible but review/audit constrained | **Amber/red.** Use import for MVP. A sandbox demo does not justify claiming production integration                                                                         |
| **Microsoft Advertising**     | OAuth (Entra or newly documented Google option) plus developer token; production and sandbox available. Microsoft announced transition of new features to REST beginning 2026-10-01 and SOAP deprecation on 2027-01-31 ([S45, S46](reachops-source-register.md))                                              | Reporting and campaign management                                                      | **Amber-green**, but adds little to initial persona evidence unless interviews identify meaningful spend. Later reporting-only adapter; choose REST-current design         |
| **Yelp**                      | Public Places API uses an app API key and plan-based QPS/daily limits, but owned-business insights, claimed locations and review replies are partner/setup gated; review monitoring is not equivalent to public place lookup ([S51–S53](reachops-source-register.md))                                         | Public business details; partner-only insights/owner actions                           | **Red for MVP review monitoring.** Do not scrape. Use CSV/export or omit                                                                                                   |
| **WordPress**                 | Core JSON REST API supports posts/pages/comments/media. Remote access can use revocable application passwords over HTTPS; OAuth/JWT may require plugins ([S48, S49](reachops-source-register.md))                                                                                                             | Strong read/write CMS access, bounded by user capabilities                             | **Green technically**, but content inventory is more relevant than site analytics. Consider later for evidence-backed draft-to-CMS handoff; require human publish approval |
| **Squarespace**               | Public developer APIs emphasize commerce. The documented Analytics API returns commerce transaction summaries by contact, not general traffic/content performance ([S50](reachops-source-register.md))                                                                                                        | Commerce read; product/order/profile writes in other APIs                              | **Red for general reach analytics.** Rely on GA4/Search Console installed on the site; do not promise Squarespace analytics integration                                    |
| **Bing Webmaster Tools**      | OAuth 2.0 is recommended; a per-user API key is also supported; site must be verified ([S47](reachops-source-register.md))                                                                                                                                                                                    | Search/site data and webmaster operations                                              | **Green/amber.** Plausible second search engine, but lower MVP priority; read-only later connector                                                                         |
| **Third-party SEO providers** | Semrush has APIs, but Standard API requires SEO Business plus separately purchased units; access and unit economics are material ([S54](reachops-source-register.md))                                                                                                                                         | Rich competitive/search data, generally read                                           | **Red for MVP economics.** Use GSC first-party data. Add provider interface and fixture only if needed to show extensibility                                               |
| **CSV/manual imports**        | No approval dependency. Requires schema validation, source labeling, secure upload, row-level errors, idempotency, and provenance                                                                                                                                                                             | Read/import only                                                                       | **Green and recommended.** It is an honest adapter for LinkedIn/social snapshots and enables the workflow without fabricated API access                                    |

### 5.4 Integration conclusions

1. **The actual API spine should be Google-first:** one OAuth provider can authorize GA4 and Search Console while still requiring separate scopes and resource selection. This provides real integration depth without a connector zoo.
2. **GBP is strategically important but operationally unsafe as a promise.** It should be a gated experiment, not the critical path. The cited storage policy also conflicts with an unrestricted historical review warehouse.
3. **Meta can be demonstrated on owned assets, not generalized into a customer-ready claim.** App Review must be treated as a product dependency with a fallback adapter.
4. **LinkedIn should be imported for the MVP.** The API’s existence does not neutralize organization verification, app review, admin-role, token-refresh, and versioning constraints.
5. **Imports are a product capability, not an embarrassment.** A well-designed import adapter demonstrates validation, normalization, provenance, and error handling while keeping claims honest.

### 5.5 Normalization principles

Do not collapse all platforms into a synthetic “reach score.” Normalize structure, not meaning.

Each stored observation should retain:

- tenant/workspace and connection identity;
- source platform, source account/property, and source metric name;
- canonical metric family such as `exposure`, `engagement`, `site_visit`, `conversion_event`, `review`, or `cost`;
- value, unit, grain, timezone, and inclusive date boundaries;
- source definition/version and retrieval timestamp;
- adapter version and sync-run identifier;
- completeness/thresholding flags and data-quality status;
- optional dimensions such as page, query, device, channel, content item, or location;
- whether the value is additive, unique, estimated, sampled/thresholded, or non-comparable.

## 6. Candidate Workflows

### 6.1 Workflow assessment

| Cadence | Workflow                         | User value                                       | Portfolio evidence                                | MVP?                                                   |
| ------- | -------------------------------- | ------------------------------------------------ | ------------------------------------------------- | ------------------------------------------------------ |
| Daily   | Connection/data health           | Prevent silent reporting failure                 | OAuth lifecycle, jobs, observability, error UX    | Yes, as system behavior                                |
| Daily   | Digital health overview          | Rapid awareness                                  | Aggregation and dashboard UX                      | Limited summary only                                   |
| Daily   | Alerts/anomaly candidates        | Catch severe problems quickly                    | Deterministic rules, notification controls        | Only high-confidence conditions; no noisy alert center |
| Daily   | Review monitoring                | Reputation response                              | External text handling, classification, approvals | Only if legitimate GBP access; otherwise fixture demo  |
| Weekly  | Cross-channel performance review | Align attention across search/site/social inputs | Multi-source normalization and comparison         | **Yes — primary**                                      |
| Weekly  | Recommended priorities           | Convert data into work                           | AI boundaries, explainability, human approval     | **Yes — differentiator**                               |
| Weekly  | Content opportunity review       | Turn search/page evidence into a proposed action | Joined reasoning across GSC + GA4                 | **Yes, constrained**                                   |
| Weekly  | Action review                    | Close loop on accepted recommendations           | Workflow state, audit history                     | **Yes**                                                |
| Monthly | Executive performance brief      | Communicate outcomes, risks, asks                | Plain-language synthesis and export               | Yes, lightweight derivative                            |
| Monthly | Channel ROI                      | Allocate budget                                  | Cost + conversion + attribution model required    | No until data sufficiency is proven                    |
| Monthly | Campaign comparison              | Learn across initiatives                         | Campaign taxonomy and cost/outcome data           | Later                                                  |

### 6.2 Recommended flagship workflow: Weekly Reach Review

1. **Sync and qualify data.** Scheduled jobs retrieve recent windows and overlap prior days to account for late updates. Connection cards show last success, next run, scope, and stale/partial state.
2. **Compute deterministic facts.** Calculate period-over-period and year-over-year changes where data suffices; flag missing dates, small denominators, tracking changes, and incompatible comparisons.
3. **Generate observation candidates.** Rules identify material movement, persistent movement, broken tracking, content/search opportunities, and unresolved prior issues.
4. **Rank without pretending certainty.** A transparent priority heuristic can combine business-goal relevance, magnitude, persistence, confidence, and user-supplied urgency. The component values remain visible.
5. **Generate AI explanation.** The model receives a bounded fact packet, glossary, business context, and strict instruction to cite observation IDs, state uncertainty, and avoid causality.
6. **Human triage.** Morgan marks each candidate `dismiss`, `monitor`, `investigate`, or `act`, with optional rationale.
7. **Create owned work.** Accepted actions receive an owner, due date, expected signal, and review date. No external account is modified.
8. **Revisit.** The next review shows action status and subsequent metrics without claiming the action caused the movement.

### 6.3 Strongest portfolio evidence

The weekly workflow is strongest because it forces the project to integrate business and technical concerns in one coherent path: OAuth, scheduled jobs, JSON parsing, schema normalization, deterministic computations, AI grounding, human approval, auditability, UX error states, and management communication. A dashboard alone would show frontend skill; the operating loop shows solution architecture and adoption thinking.

## 7. AI vs Deterministic Decision Matrix

### 7.1 Design rule

Use deterministic code for facts, permissions, state transitions, and repeatable thresholds. Use AI for language, qualitative synthesis, and option generation when the input can be bounded and the output can be reviewed. Every AI output is a proposal, not a source of record.

| Capability                           | Deterministic system                                                         | AI role                                                          | Human role                      | Guardrail/output contract                                                   |
| ------------------------------------ | ---------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------- |
| API authentication and authorization | **Owns** OAuth state, scopes, tenant/resource checks                         | None                                                             | Grants/revokes access           | Least privilege, CSRF/PKCE, encrypted tokens                                |
| Metric retrieval and storage         | **Owns** requests, parsing, validation, lineage                              | None                                                             | Selects resources               | Schema validation; idempotent upserts                                       |
| Aggregation and arithmetic           | **Owns** sums, rates, deltas, comparisons                                    | None                                                             | Reviews definitions             | Tested formulas; denominator and timezone displayed                         |
| Data-quality checks                  | **Owns** missing dates, stale sync, negative/impossible values, partial data | May explain impact in plain language                             | Resolves configuration          | AI receives quality flags and cannot override them                          |
| Threshold alert                      | **Owns** configured rule evaluation                                          | May rewrite notification text                                    | Sets/snoozes threshold          | Store rule version and triggering facts                                     |
| Anomaly candidate                    | **Owns** statistical/rule candidate generation                               | Explains possible interpretations                                | Decides whether meaningful      | Label “candidate”; minimum-volume and persistence checks                    |
| Cross-channel summary                | Supplies exact fact packet                                                   | **Drafts** concise narrative and cites observation IDs           | Approves/edits                  | Structured output; no unreferenced numbers                                  |
| Review/comment themes                | Filters/redacts and selects permitted text                                   | **Classifies/summarizes** themes and sentiment                   | Validates sensitive conclusions | Treat text as untrusted; no instruction execution; minimum sample size      |
| Content opportunity                  | Supplies query/page/post evidence                                            | **Suggests** topics, angles, and questions                       | Chooses and adds brand/context  | Suggestions cite evidence; no SEO guarantee                                 |
| Draft content                        | Supplies approved brief and constraints                                      | **Drafts** copy                                                  | Edits and explicitly approves   | Never auto-publish; disclose AI assistance internally                       |
| Priority ordering                    | Computes transparent baseline score                                          | May offer a separately labeled rationale or alternative ordering | Owns final order                | Never hide formula; log accepted/rejected recommendation                    |
| ROI/attribution                      | Computes only from defined cost/outcome model                                | Explains the defined result                                      | Confirms assumptions            | No AI-created attribution or causal claim                                   |
| Permission enforcement               | **Owns** RBAC and resource checks                                            | None                                                             | Admin configures roles          | Deny by default; server-side checks                                         |
| External write action                | Validates permission, state, payload, idempotency                            | May draft proposed payload                                       | **Must approve**                | Separate write scope, confirmation, preview, audit, rollback where possible |
| Historical record/audit              | **Owns** immutable event record                                              | None                                                             | Reviews/export                  | AI output version, prompt/template ID, fact IDs, editor recorded            |

### 7.2 AI should not be used for

- calculating totals, rates, deltas, ranks, or statistical thresholds;
- deciding whether a user is authorized;
- storing history or acting as the only audit trail;
- refreshing OAuth tokens or choosing scopes;
- silently resolving metric-definition conflicts;
- automatically replying to reviews or publishing content;
- claiming why a metric changed when only correlation is available;
- inventing benchmarks, goals, customer facts, or missing data;
- reading unrestricted raw tenant data when a minimized fact packet will do;
- interpreting external content as instructions.

### 7.3 Evaluation requirements

Before AI summaries are trusted, build a fixed evaluation set containing normal periods, genuine changes, small-denominator traps, missing data, contradictory signals, stale connectors, malicious text embedded in review/comment content, and zero-result periods. Score factual consistency, evidence citation, uncertainty, actionability, prohibited causality, privacy leakage, and prompt-injection resistance. A deterministic validator should reject any number or observation ID not present in the fact packet.

## 8. Architecture Options

### 8.1 Option A — Polished portfolio demonstration

**Purpose:** Prove the end-to-end concept with real read-only APIs and minimal operational burden.

| Layer                | Recommendation                                                                                                              |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Frontend             | Next.js/TypeScript responsive web UI; server-rendered dashboard and review workflow                                         |
| Backend              | Next.js server routes/actions or a small TypeScript API in the same repository; modular boundaries by domain                |
| Database             | Managed PostgreSQL (for example, Supabase/Neon class) with migrations; optional provider auth                               |
| Integration layer    | Adapter interface with `ga4`, `search-console`, and `csv`; fixture adapters explicitly marked non-live                      |
| Authentication       | Managed user authentication; one demo workspace; server-side resource authorization                                         |
| OAuth/token handling | Google authorization-code flow, exact read scopes, encrypted refresh tokens stored server-side, disconnect/revoke path      |
| Scheduled jobs       | Managed cron invoking idempotent sync endpoints; retry with bounded exponential backoff                                     |
| AI services          | One model provider behind a service interface; structured fact packet and schema-constrained output                         |
| Analytics processing | SQL views/materialized summaries plus tested TypeScript calculations; small anomaly rule set                                |
| Logging              | Structured application/sync logs with correlation IDs; redact tokens and sensitive payloads                                 |
| Secrets              | Host secret store/environment variables; never client bundle or repository                                                  |
| Deployment           | One managed web service plus managed Postgres; preview deployment may use fixtures, production demo uses authorized sources |

**Tradeoffs:** Fastest and clearest portfolio path; lowest cost. It demonstrates good boundaries without distributed systems. Limitations include basic scheduling, one-region assumptions, modest job isolation, and a narrower tenancy story. Those limitations should be documented rather than disguised.

### 8.2 Option B — Production-minded SMB application

**Purpose:** Support several real customer workspaces reliably while retaining a small-team-operable architecture.

| Layer                 | Recommendation                                                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend              | Next.js/TypeScript application with workspace/resource selection, accessibility, error-state UX                                                               |
| Backend               | TypeScript modular monolith (for example, NestJS/Fastify class) with explicit modules for identity, connections, ingestion, metrics, insights, actions, audit |
| Database              | Managed PostgreSQL; tenant ID on every business row, row-level controls where appropriate; object storage for temporary imports                               |
| Integration layer     | Versioned adapters, normalized contracts, provider-specific rate-limit and cursor logic, connection capability registry                                       |
| Authentication        | Managed OIDC; workspace RBAC (`owner`, `manager`, `contributor`, `viewer`)                                                                                    |
| OAuth/token handling  | Envelope-encrypted token vault, separate connection records, scope inventory, refresh locking, revocation/webhook handling                                    |
| Scheduled jobs        | Managed durable queue/workflow service; per-connection jobs, retries, dead-letter handling, overlap windows and idempotency keys                              |
| AI services           | Provider abstraction, minimized prompts, template/version registry, output validation, cost and latency budgets                                               |
| Analytics processing  | SQL transformations or lightweight transformation framework; daily facts, comparison service, explicit metric catalog                                         |
| Logging/observability | Centralized logs, metrics, traces, sync SLOs, alerts on failure/staleness, tenant-safe diagnostics                                                            |
| Secrets               | Cloud secrets manager and KMS; key rotation and restricted service identities                                                                                 |
| Deployment            | Containerized app/API and worker on a managed platform; managed Postgres; infrastructure as code for repeatability                                            |

**Tradeoffs:** Best balance if ReachOps progresses beyond a portfolio demonstration. It creates credible multi-workspace, job, security, and support capabilities without prematurely adopting microservices. More expensive and slower than Option A; requires operational discipline and privacy documentation.

### 8.3 Option C — Scalable multi-tenant SaaS

**Purpose:** Serve many tenants, higher data volume, regional requirements, and a growing connector team.

| Layer                | Recommendation                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend             | CDN-served web application with BFF/API gateway and tenant-aware feature/capability controls                                                                        |
| Backend              | Domain services or well-defined service modules for identity, connection control plane, ingestion, metrics, insight generation, workflow, notifications, audit      |
| Database             | PostgreSQL for control/workflow data; analytical warehouse/lakehouse for high-volume facts; object storage for raw, encrypted, retention-governed landing data      |
| Integration layer    | Connector runtime separated from control plane; per-provider queues, schema registry, contract tests, canary rollouts                                               |
| Authentication       | Enterprise-capable OIDC/SAML, SCIM later, granular RBAC/ABAC, tenant isolation testing                                                                              |
| OAuth/token handling | Dedicated token broker/vault backed by KMS/HSM; workload identity; rotation and compromise response                                                                 |
| Scheduled jobs       | Durable workflow orchestration, event bus/queues, per-tenant fairness, replay, dead-letter and backfill controls                                                    |
| AI services          | Tenant-isolated AI gateway, retrieval/prompt policy, PII redaction, model routing, evaluation/monitoring, provider opt-out controls                                 |
| Analytics processing | Incremental warehouse models, quality tests, semantic metric layer, lineage/catalog, cost controls                                                                  |
| Logging              | Central SIEM-compatible audit, metrics/traces, tenant access logs, incident response and SLO reporting                                                              |
| Secrets              | Central secrets manager, short-lived credentials, automated rotation, separation of duties                                                                          |
| Deployment           | Multi-environment cloud infrastructure, containers/serverless workers, infrastructure as code, blue/green or canary deployment; regionalization only when justified |

**Tradeoffs:** Supports scale and organizational separation but is the wrong starting point. It adds distributed failure modes, duplicated schemas, operational cost, and security surface before product validation. Presenting it as a future evolution demonstrates architecture judgment; implementing it now would weaken the portfolio by substituting complexity for learning.

### 8.4 Recommendation

Build **Option A with Option B boundaries**. Use a modular monolith, Postgres, explicit adapters, background-job abstraction, server-only token service, and tenant IDs even if the demo has one workspace. Do not add a warehouse, event bus, microservices, Kubernetes, or multi-region deployment until measured load or compliance requires them.

## 9. Security Considerations

### 9.1 Trust boundaries

ReachOps would sit between users, platform identity providers, external APIs, stored marketing data, an AI provider, and future write destinations. The integration is itself a high-value target because a refresh token may provide persistent access even when ReachOps stores no user password.

### 9.2 Read and write separation

| Control         | Read operation                                     | Write operation                                                                             |
| --------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| OAuth scope     | Request narrow read scope where offered            | Separate opt-in connection or incremental consent for write scope                           |
| Product default | Enabled only after resource selection              | Disabled by default and absent from MVP                                                     |
| Authorization   | Workspace role + connection/resource check         | Stronger role, recent authentication where appropriate, resource check                      |
| User experience | Show source, freshness, and retrieved coverage     | Show exact payload/target, preview, irreversible effects, explicit confirmation             |
| AI              | May summarize permitted read facts                 | May draft payload only; cannot execute                                                      |
| Job behavior    | Scheduled incremental reads allowed                | No unattended publishing/account mutation without a separately designed approval policy     |
| Audit           | Log access/sync metadata and configuration changes | Log proposer, approver, payload hash, target, result, provider ID, and error/rollback state |

### 9.3 Risk register and controls

| Risk                                 | Impact                                      | Required controls                                                                                                                                              |
| ------------------------------------ | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OAuth refresh-token theft            | Persistent external-account access          | Encrypt at application layer with KMS-managed key; never log; server-only access; rotate/revoke; least scopes; incident runbook                                |
| API key/client-secret exposure       | Unauthorized calls and quota/cost abuse     | Secrets manager; repository scanning; environment separation; rotation; no client-side secrets                                                                 |
| Cross-tenant authorization failure   | Customer data disclosure or external action | Tenant ID on every resource; deny-by-default server checks; database policies; automated isolation tests                                                       |
| Excessive account permissions        | Larger blast radius                         | Incremental consent; capability inventory; explain each scope; separate read/write connections when platform permits                                           |
| PII in reviews/comments              | Privacy breach, inappropriate AI use        | Data minimization, short retention, redaction, access controls, deletion/export workflow, platform-policy check                                                |
| Prompt injection in external content | Model follows malicious review/comment text | Delimit content as data; system rule forbids instruction following; allowlist fact schema; no tools/write permissions in summarization call; adversarial tests |
| Accidental publishing                | Brand/reputation damage                     | No writes in MVP; later preview + explicit approval + target confirmation + idempotency + audit                                                                |
| AI hallucination/causal claim        | Bad management decision                     | Deterministic fact packet; citation IDs; output validator; uncertainty labels; human approval; eval set                                                        |
| Account takeover                     | External data/action compromise             | MFA-compatible auth, session security, risk-based reauthentication for sensitive operations, alerts, revoke-all sessions                                       |
| Data retention/policy violation      | Platform access loss or legal exposure      | Per-source retention rules, deletion jobs, policy register, storage minimization; especially review GBP content policy ([S29](reachops-source-register.md))    |
| Incomplete/late data                 | Misleading report                           | Freshness badge, partial-sync state, coverage window, no AI summary when required inputs fail quality gates                                                    |
| Formula/definition drift             | Incorrect comparison                        | Versioned metric catalog, source definition links, adapter contract tests, migration/change review                                                             |
| Audit-history tampering              | Loss of accountability                      | Append-oriented events, restricted mutation, integrity checks, separate operational log retention                                                              |

### 9.4 Privacy posture

- Store aggregate metrics whenever person-level data is unnecessary.
- Avoid ingesting commenter/reviewer profile details unless the workflow requires them.
- Do not use customer data to train models by default; document the selected model provider’s retention settings.
- Provide source disconnect, token revocation, workspace deletion, and data export/deletion workflows.
- Document controller/processor roles, subprocessors, retention periods, and cross-border handling before real customer use.
- Label imported datasets with uploader, source, collection date, intended purpose, and retention.

## 10. MVP Recommendation

### 10.1 Product definition

**Name:** ReachOps Weekly Reach Review  
**Promise:** “In 15 minutes, understand what changed in search and website performance, choose this week’s priorities, and leave with accountable next actions.”

### 10.2 In scope

1. **Workspace and goal setup**
   - One business/workspace.
   - Select up to three goals such as qualified inquiries, organic visibility, local discovery, or content engagement.
   - Configure timezone and week boundaries.

2. **Real connections**
   - Google OAuth authorization-code flow.
   - GA4 property selection with read-only scope.
   - Search Console property selection with read-only access.
   - Connection health, last successful sync, scope and disconnect.

3. **Import adapter**
   - One documented CSV format for weekly channel/content metrics.
   - Dry-run validation, row errors, duplicate detection, idempotent import, provenance.
   - Sample LinkedIn or social dataset labeled synthetic or user-provided—not represented as live API data.

4. **Normalized metrics**
   - Daily GA4: sessions/users (chosen consistently), engaged sessions/engagement rate, selected key events, top landing pages, source/medium grouping.
   - Daily GSC: clicks, impressions, CTR, position; top queries/pages with documented top-row limitation.
   - Imported channel: content-level views/impressions/engagement fields retaining platform name and definition.

5. **Deterministic analysis**
   - Current vs prior comparable period.
   - Optional year-over-year only with sufficient data.
   - Minimum-volume safeguards and zero-denominator handling.
   - Five to eight transparent candidate rules, including tracking/data failure.

6. **Weekly brief and evidence**
   - “What changed,” “why it may matter,” “what to inspect,” and “data caveats.”
   - Every numerical sentence references a fact/observation card.
   - AI output editable and regenerable, with version and timestamp.

7. **Priority/action workflow**
   - Triage: dismiss, monitor, investigate, act.
   - Owner, due date, note, expected signal, and review date.
   - Status history and rationale.

8. **Monthly view/export**
   - Compact trend and action summary derived from the same facts.
   - Markdown/print-friendly export; not a generic report designer.

9. **Operational quality**
   - Loading, empty, unauthorized, expired grant, rate-limited, stale, partial, malformed-import and AI-unavailable states.
   - Structured logs and sync-run history.
   - Unit, integration, adapter contract, authorization and AI-evaluation tests.

### 10.3 Explicitly out of scope

- social publishing or scheduling;
- content calendar and asset library;
- review replies or account/profile mutation;
- social inbox/listening;
- Google/Meta/LinkedIn Ads management;
- direct LinkedIn API dependency;
- GBP dependency before approval;
- universal connectors;
- rank crawling/backlink intelligence;
- automated ROI attribution;
- autonomous action execution;
- agency white labeling and client billing;
- native mobile application.

### 10.4 Optional stretch, in order

1. Read-only GBP performance and reviews **only after approved access and policy review**.
2. YouTube Analytics read connector if interview evidence supports video.
3. Owned Instagram professional account read-only proof if Meta access succeeds.
4. WordPress draft handoff with a mandatory human approval gate; never direct publish by default.

### 10.5 Success criteria for the portfolio build

The MVP is complete when it can demonstrate, without staged claims:

- a user authorizes at least one real Google account and selects authorized resources;
- two real source adapters retrieve and normalize data;
- a failed/expired connection is visible and recoverable;
- comparisons reproduce known fixture calculations exactly;
- an AI brief contains no metric absent from its fact packet across the evaluation set;
- a user can turn an observation into an owned action and later revisit it;
- all imported or mocked data is visibly labeled;
- the architecture decision record explains why gated platforms were deferred;
- secrets and tokens are absent from repository, browser payloads, and logs;
- a hiring manager can follow one end-to-end scenario in under five minutes.

### 10.6 What to measure in user validation

- Current weekly review preparation time and tools used.
- Which decisions are delayed or missed.
- Whether “priority queue” is more valuable than “dashboard.”
- Trust requirements: evidence, definitions, drill-down, confidence, approvals.
- Which third source matters most after GA4/GSC: GBP, Meta, LinkedIn, Ads, or manual spreadsheet.
- Willingness to connect accounts versus upload exports.
- Whether task assignment belongs in ReachOps or should link to an existing work-management tool.
- Words users use for “reach,” “engagement,” “lead,” “conversion,” and “healthy.”

## 11. Portfolio Evidence

### 11.1 Evidence by target role

| Hiring lens                      | Visible evidence in the project                                                                                                                      |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| AI Integrator                    | Bounded fact packets, structured outputs, evidence citations, hallucination validation, prompt-injection tests, human approval, cost/latency logging |
| AI Adoption Leader               | Persona research, workflow fit, trust/approval design, change-management notes, AI disclosure, user validation and success criteria                  |
| Business Systems Manager         | OAuth lifecycle, role/resource authorization, scheduled jobs, error recovery, data retention, audit trail, operational runbook                       |
| Solutions Consultant             | Problem framing, market alternatives, API feasibility, architecture options, tradeoff explanation, phased recommendation                             |
| AI Solutions Architect           | AI/deterministic separation, data flow, threat model, model gateway, evaluation plan, graceful degradation                                           |
| Workflow Automation professional | Trigger → qualify → prioritize → approve → assign → revisit state machine, idempotency, retries, exception handling                                  |

### 11.2 Competencies converted from claims into proof

- **API evaluation:** a dated capability matrix distinguishes API existence, permissions, approval, policy, quota, and realistic demo access.
- **Integration:** real OAuth and REST calls, resource selection, refresh/revocation, pagination, retry and normalized contracts.
- **Data architecture:** source lineage, semantic metric catalog, daily grain, quality flags and controlled comparisons.
- **AI judgment:** AI only handles work suited to probabilistic language models; deterministic logic owns facts and permissions.
- **Security:** encrypted tokens, least privilege, tenant-safe authorization, audit records, PII minimization and prompt-injection controls.
- **Operations:** scheduled syncs, health states, troubleshooting, logs, rate-limit handling, and runbooks.
- **Product judgment:** explicit non-goals and a narrowed workflow rather than feature imitation.
- **Communication/coaching:** plain-language metric explanations, uncertainty, decision briefs and architecture decision records.
- **Testing:** formula fixtures, adapter contracts, OAuth/authorization tests, failure injection and AI evaluation cases.

### 11.3 Honest AI-assisted development disclosure

The repository should include a short statement similar to:

> ReachOps was researched and developed with AI assistance for ideation, documentation, code generation, test generation, and review. I remained responsible for product scope, architecture choices, source verification, security decisions, implementation acceptance, and all claims. Restricted API access, deployments, and results are documented only when actually obtained or observed.

Retain decision records showing what was accepted, changed, or rejected. That turns AI assistance into evidence of responsible adoption rather than a hidden dependency.

## 12. Risks and Unknowns

| Risk/unknown                                               | Likelihood | Impact | Discovery response                                                                                                        |
| ---------------------------------------------------------- | ---------: | -----: | ------------------------------------------------------------------------------------------------------------------------- |
| Users prefer existing dashboards plus task manager         |     Medium |   High | Test priority-queue prototype against current workflow before build                                                       |
| Cross-channel prioritization feels arbitrary               |       High |   High | Use transparent factors; let users set goals; compare with their own weekly choices                                       |
| GA4/GSC data quality is too inconsistent for simple advice |     Medium |   High | Surface configuration/quality; block summaries when minimum quality fails                                                 |
| GBP approval denied or policy prevents desired history     |     Medium |   High | Keep out of critical path; use fixtures/import; obtain policy interpretation before storage                               |
| Meta/LinkedIn reviews delay integrations                   |       High | Medium | Do not make them MVP dependencies; publish honest capability status                                                       |
| SMBs lack enough data volume                               |     Medium | Medium | Use minimum-volume gates and “insufficient data”; target businesses with established presence                             |
| AI summaries become generic                                |       High | Medium | Require cited evidence, business context, constrained output and evaluation; make deterministic observations useful alone |
| Recommendations duplicate agency/expert work               |     Medium | Medium | Position as review/coordination support, not specialist replacement                                                       |
| Platform metric/version changes break adapters             |       High | Medium | Metric catalog, adapter versioning, contract tests, deprecation monitoring                                                |
| Supporting many connectors dominates maintenance           |       High |   High | Commit to two real connectors plus import; require validation before each new adapter                                     |
| “ROI” expectations exceed available attribution            |       High |   High | Avoid ROI language unless cost and outcome model is explicit and complete                                                 |
| Action queue duplicates users’ work system                 |     Medium | Medium | Validate whether simple internal actions or outbound integration is preferred                                             |
| Portfolio scope expands into production SaaS               |       High | Medium | Freeze MVP acceptance criteria and keep Options B/C architectural only                                                    |

## 13. Questions Requiring Validation

### Problem and persona

1. Who actually performs the weekly reconciliation today: manager, coordinator, owner, or agency?
2. What was the last meaningful issue or opportunity they discovered late?
3. Which decision recurs weekly and carries enough consequence to justify a tool?
4. Is a location-based business the right wedge, or does GBP dependency make a non-local B2B service firm easier?
5. How much evidence must accompany an automated observation before the user trusts it?

### Workflow

6. Do users want ReachOps to hold actions, or should it create approved tasks in their existing system?
7. Which four triage states match real language?
8. Is Monday-morning review the natural cadence, and what date/week definition is expected?
9. What makes an executive brief useful: trend, goal, explanation, ask, or forecast?
10. Which notifications are urgent enough for daily delivery without causing alert fatigue?

### Data and integrations

11. Can the project owner supply an authorized GA4 property and verified Search Console property with meaningful, non-sensitive history?
12. Is there a legitimate verified GBP and business reason suitable for an API application?
13. Which social platform export is easiest for target users to obtain consistently?
14. What key events/conversions are configured in GA4, and are they trustworthy?
15. How should branded search, seasonality, campaigns, site releases, and tracking changes be annotated?
16. Are users comfortable connecting read-only accounts to a portfolio-stage product?

### AI and trust

17. Do users value an AI narrative, or only the deterministic observations and action workflow?
18. Which recommendation categories are welcome, and which feel presumptuous?
19. What uncertainty language is understandable without becoming evasive?
20. Should review/comment text ever leave the application for model processing?

### Commercial/product direction

21. Is the stronger future buyer a single-business marketing manager or a fractional marketer with several clients?
22. Would customers pay for prioritization if Looker Studio/agency reports already provide visibility?
23. Is the product a standalone application, an operational layer on existing dashboards, or a demonstrable consulting accelerator?
24. Which proof matters most to hiring managers: integration depth, AI controls, workflow adoption, or deployment operations?

## 14. Recommended Next Step

Run a **two-week validation sprint before implementation**:

1. Interview five to eight marketing managers/generalists at growing SMBs, including at least three location-based businesses.
2. Ask each person to walk through their last real weekly/monthly review using actual tools and artifacts; do not begin with a ReachOps pitch.
3. Test a low-fidelity prototype of three screens: connection/data health, weekly observations, and priority/action review.
4. Rank requested integrations by decision value, not popularity.
5. Confirm access to one real GA4 property and one real Search Console property.
6. Separately investigate GBP application eligibility; do not delay the core validation sprint for approval.
7. Write a one-page validation memo with evidence for or against the core assumption: **“The missing value is prioritized follow-through, not another dashboard.”**
8. Only then write the MVP product requirements and architecture decision records.

### Go/no-go rule after validation

Proceed if at least four target users describe a repeated cross-dashboard review, at least three can name a consequential prioritization/follow-through failure, and the prototype’s priority workflow is preferred to a dashboard-only view. Narrow again or stop if users mainly want automated reports, scheduling, or agency white labeling; those needs are well served and would pull ReachOps into a clone market.

**Final recommendation:** ReachOps is **worth narrowing and validating**, not abandoning. Its portfolio value comes from demonstrating disciplined integration and responsible operational AI. The project becomes weak if it tries to win by connector count or social publishing breadth; it becomes strong if it proves that trustworthy signals can be converted into human-owned action with clear controls.
