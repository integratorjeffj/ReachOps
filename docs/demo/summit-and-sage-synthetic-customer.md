# Summit & Sage Home Services — Synthetic Demo Customer

> **SYNTHETIC DEMONSTRATION DATA**  
> Summit & Sage Home Services, its people, website, accounts, campaigns, analytics, reviews, and actions are fictional. They exist only to demonstrate ReachOps. The `.example` domain is reserved for documentation. No customer, revenue, deployment, or business outcome is being represented as real.

## 1. Customer profile

| Field                           | Synthetic value                                                                               |
| ------------------------------- | --------------------------------------------------------------------------------------------- |
| Legal/display name              | Summit & Sage Home Services                                                                   |
| Tagline                         | Comfort, handled.                                                                             |
| Founded                         | 2008                                                                                          |
| Market                          | Denver metropolitan area, Colorado                                                            |
| Services                        | Residential HVAC, plumbing, and electrical repair/installation                                |
| Operating model                 | One headquarters, two dispatch hubs, one service-area Google Business Profile                 |
| Employees                       | 86 total: 61 field technicians, 12 dispatch/customer care, 8 operations, 3 sales, 2 marketing |
| Approximate annual revenue band | $12–15 million; synthetic planning context, never shown as a measured ReachOps result         |
| Website                         | `https://summitandsage.example`                                                               |
| Primary conversion              | Confirmed service booking                                                                     |
| Secondary conversions           | Phone-call click, estimate request, Comfort Club enrollment                                   |
| ReachOps workspace              | `summit-and-sage-demo`                                                                        |
| Reporting timezone              | America/Denver                                                                                |
| Reporting week                  | Monday 00:00 through Sunday 23:59 local time                                                  |

## 2. Brand system

| Token              | Value                                                                                  | Use                                            |
| ------------------ | -------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Evergreen          | `#143D35`                                                                              | Primary navigation, headings, selected states  |
| Sage               | `#7E9C76`                                                                              | Secondary data series and supporting accents   |
| Sand               | `#F4EFE6`                                                                              | Warm application background                    |
| Copper             | `#C56A3D`                                                                              | Calls to action and priority highlights        |
| Ink                | `#16221F`                                                                              | Body text                                      |
| Mist               | `#E7EFEB`                                                                              | Cards, dividers, quiet success states          |
| Typeface direction | Inter or Geist for interface; restrained serif accent only in customer mark if desired | Executive, operational, credible               |
| Logo concept       | Simple mountain roofline plus a single sage leaf                                       | Must be created as an original synthetic asset |

ReachOps itself remains the product brand. Summit & Sage branding appears as the active customer workspace so the demo feels like a real operating environment without turning ReachOps into a white-label product.

## 3. Synthetic employee roster and permissions

| Person       | Role                      | ReachOps role       | Demo responsibility                                                     |
| ------------ | ------------------------- | ------------------- | ----------------------------------------------------------------------- |
| Maya Chen    | Marketing Manager         | Workspace Manager   | Runs weekly review, approves recommendations, owns marketing priorities |
| Jonah Brooks | Content & Web Coordinator | Contributor         | Investigates pages, drafts content, completes assigned actions          |
| Elena Ruiz   | Chief Operating Officer   | Executive Viewer    | Reads monthly summary and business-impact framing                       |
| Devon Patel  | Customer Care Manager     | Contributor         | Owns review-response and scheduling-experience follow-up                |
| System Sync  | Service principal         | System Actor        | Records scheduled ingestion and data-quality events                     |
| ReachOps AI  | Model actor               | Proposal-only Actor | Drafts summaries/recommendations; cannot approve or execute actions     |

Maya is the default demo identity. The UI may offer a clearly marked development identity switcher for Maya, Jonah, and Elena, but all server-side authorization must remain active.

## 4. Marketing goals

### Goal G-01 — Qualified demand

- Reach 1,000 confirmed website service bookings per month by Q4 2026.
- Maintain a website booking conversion rate of at least 2.4% across all sessions.
- Do not treat phone clicks as confirmed bookings.

### Goal G-02 — Organic visibility

- Increase non-branded organic clicks 15% year over year by December 2026.
- Prioritize service-intent queries and landing pages over raw impression growth.
- Treat Search Console detailed query rows as top-row data, not a complete ledger.

### Goal G-03 — Local reputation

- Maintain a cumulative Google rating of at least 4.60.
- Respond to new critical reviews within two business days.
- Track themes, but never auto-publish a response.

### Goal G-04 — Operational follow-through

- Resolve high-priority digital issues within five business days.
- Ensure every accepted recommendation has an owner and review date.

## 5. Campaign catalog

| ID     | Campaign                      | Window                   | Channels                                        | Goal                                | Notes                                                            |
| ------ | ----------------------------- | ------------------------ | ----------------------------------------------- | ----------------------------------- | ---------------------------------------------------------------- |
| CAM-01 | Summer Ready                  | 2026-03-15 to 2026-08-31 | Organic search, paid search, Meta, website      | AC repair and tune-up bookings      | Current seasonal campaign; Denver heat drives strong July demand |
| CAM-02 | Comfort Club                  | Evergreen                | Website, email, technician leave-behind, social | Maintenance-plan enrollments        | Secondary conversion; not included in confirmed service bookings |
| CAM-03 | Water Heater Without the Wait | 2026-01-08 to 2026-04-30 | Search, website, GBP posts                      | Water-heater estimates/bookings     | Historical comparison campaign                                   |
| CAM-04 | Cold Snap Ready               | 2025-10-01 to 2026-02-28 | Search, GBP, Meta, email                        | Furnace repair and tune-up bookings | Explains winter seasonality                                      |
| CAM-05 | Neighbor Referral Week        | 2026-05-11 to 2026-05-17 | Email, organic social, website                  | Referral form submissions           | Short burst campaign; annotated to prevent false anomaly claims  |

## 6. Source catalog

| Source                  | Connection label            | Demo mode                     | Account/resource                                           | Data boundary                                     |
| ----------------------- | --------------------------- | ----------------------------- | ---------------------------------------------------------- | ------------------------------------------------- |
| Google Analytics 4      | Summit & Sage Web — GA4     | Real-capable; seeded fallback | Property selected through OAuth or `DEMO-GA4-SSHS` fixture | Website behavior and configured key events        |
| Google Search Console   | Summit & Sage Domain        | Real-capable; seeded fallback | `sc-domain:summitandsage.example` fixture                  | Google organic search performance                 |
| Google Business Profile | Summit & Sage Service Area  | Simulated                     | `DEMO-GBP-SSHS`                                            | Performance metrics and synthetic review excerpts |
| LinkedIn Company Page   | Summit & Sage Home Services | Simulated CSV adapter         | `DEMO-LI-SSHS`                                             | Post and page aggregate metrics                   |
| Meta                    | Summit & Sage Home Services | Simulated                     | `DEMO-META-SSHS`                                           | Campaign/post aggregate metrics only              |

Every page that includes non-real data must show a persistent **Synthetic workspace** badge. Every source card must separately show `Live`, `Simulated`, `Imported`, `Stale`, `Partial`, or `Error`; a live Google source must never cause simulated sources to lose their labels.

## 7. Thirteen-month synthetic baseline

All metrics below are monthly totals except cumulative rating. Values are designed to reflect home-services seasonality: HVAC demand rises in very hot and cold periods, with softer shoulder seasons.

| Month   | Total sessions | Organic sessions | Confirmed bookings | GSC impressions | GSC clicks | GBP profile views | GBP actions | New reviews | Cumulative rating |
| ------- | -------------: | ---------------: | -----------------: | --------------: | ---------: | ----------------: | ----------: | ----------: | ----------------: |
| 2025-07 |         31,800 |           18,900 |                735 |         590,000 |     21,240 |            45,300 |       2,190 |          42 |              4.47 |
| 2025-08 |         29,600 |           17,500 |                681 |         560,000 |     20,160 |            42,000 |       2,010 |          38 |              4.46 |
| 2025-09 |         25,400 |           15,200 |                552 |         490,000 |     17,150 |            36,000 |       1,710 |          31 |              4.45 |
| 2025-10 |         24,900 |           15,100 |                568 |         500,000 |     17,500 |            37,400 |       1,800 |          35 |              4.46 |
| 2025-11 |         27,800 |           16,900 |                659 |         548,000 |     19,180 |            41,200 |       1,990 |          44 |              4.45 |
| 2025-12 |         30,200 |           18,200 |                742 |         590,000 |     21,830 |            46,000 |       2,290 |          49 |              4.44 |
| 2026-01 |         33,400 |           20,000 |                826 |         630,000 |     23,940 |            49,500 |       2,510 |          55 |              4.45 |
| 2026-02 |         28,700 |           17,700 |                702 |         575,000 |     21,275 |            44,000 |       2,180 |          41 |              4.47 |
| 2026-03 |         26,500 |           16,800 |                630 |         558,000 |     20,646 |            40,000 |       1,920 |          37 |              4.49 |
| 2026-04 |         28,900 |           18,400 |                689 |         600,000 |     22,800 |            43,000 |       2,070 |          40 |              4.51 |
| 2026-05 |         32,600 |           20,900 |                798 |         670,000 |     25,460 |            48,000 |       2,380 |          46 |              4.53 |
| 2026-06 |         37,800 |           24,400 |                936 |         760,000 |     28,880 |            57,000 |       2,890 |          61 |              4.55 |
| 2026-07 |         42,300 |           27,600 |              1,021 |         845,000 |     32,955 |            63,000 |       3,270 |          68 |              4.56 |

Consistency rules:

- Organic sessions are a subset of total sessions.
- Confirmed bookings are GA4 key events deduplicated by synthetic booking ID.
- GBP actions combine website clicks, call clicks, and direction requests; they are not bookings.
- The cumulative rating moves slowly because it is based on the full review corpus, not only the current month.
- GSC clicks and GA4 organic sessions are related but not expected to match because their measurement boundaries differ.

## 8. Flagship demo week

The primary demonstration is frozen to **week ending Sunday, 2026-08-02**, compared with the prior week. The data is intentionally constructed to show why prioritization matters: traffic increased strongly, but the most important landing page converted less efficiently.

| Evidence ID | Metric                                        | Prior week | Current week |       Change | Interpretation boundary                                     |
| ----------- | --------------------------------------------- | ---------: | -----------: | -----------: | ----------------------------------------------------------- |
| EV-101      | Total website sessions                        |      9,480 |       10,440 |       +10.1% | Traffic only; not business outcome                          |
| EV-102      | Organic sessions                              |      6,310 |        7,020 |       +11.3% | GA4 organic grouping                                        |
| EV-103      | Confirmed bookings                            |        241 |          246 |        +2.1% | Growth materially trails traffic growth                     |
| EV-104      | `/air-conditioning/repair` sessions           |      1,148 |        1,505 |       +31.1% | High seasonal demand                                        |
| EV-105      | `/air-conditioning/repair` confirmed bookings |         70 |           59 |       −15.7% | Count decreased despite more sessions                       |
| EV-106      | `/air-conditioning/repair` booking rate       |      6.10% |        3.92% |     −2.18 pp | Deterministic: bookings ÷ sessions                          |
| EV-107      | GSC impressions                               |    197,400 |      213,600 |        +8.2% | Search exposure                                             |
| EV-108      | GSC clicks                                    |      7,380 |        8,160 |       +10.6% | Search click, not GA4 session                               |
| EV-109      | GSC CTR                                       |      3.74% |        3.82% |     +0.08 pp | Rounded display value                                       |
| EV-110      | GSC average position                          |        9.8 |          9.4 | Improved 0.4 | Lower position value is better                              |
| EV-111      | GBP profile views                             |     14,920 |       14,120 |        −5.4% | Simulated source                                            |
| EV-112      | GBP website clicks                            |      1,162 |        1,050 |        −9.6% | Simulated; not website sessions                             |
| EV-113      | GBP call clicks                               |        738 |          689 |        −6.6% | Simulated; not confirmed calls/bookings                     |
| EV-114      | New GBP reviews                               |         17 |           19 |       +11.8% | Simulated review records                                    |
| EV-115      | Average rating of new reviews                 |       4.65 |         4.42 |        −0.23 | Not cumulative rating; 3 reviews mention arrival/scheduling |
| EV-116      | LinkedIn impressions                          |      9,800 |       11,600 |       +18.4% | Simulated/imported source                                   |
| EV-117      | LinkedIn engagements                          |        311 |          352 |       +13.2% | Simulated/imported source                                   |

### Synthetic operational annotations

- `2026-07-30 16:20 MDT` — Website deployment changed the mobile booking form layout on the AC repair page.
- `2026-07-31` and `2026-08-01` — Three synthetic customer reviews mention late arrival windows or unclear scheduling updates.
- `2026-08-01` — Denver heat advisory annotation; used as context, not as causal proof.

### Expected deterministic observations

1. **High priority:** AC repair page demand rose while its booking rate fell materially. Evidence: EV-104, EV-105, EV-106. Candidate rule: minimum 500 sessions, rate decline greater than 1.0 percentage point, and booking count not rising with traffic.
2. **Medium priority:** Local-profile actions declined while website/search traffic rose. Evidence: EV-102, EV-111, EV-112, EV-113. Mark as a cross-source divergence, not a diagnosis.
3. **Medium priority:** New-review rating declined and at least three permitted excerpts share the scheduling theme. Evidence: EV-114, EV-115. The model may summarize the theme but may not draft or publish a response without human action.
4. **Opportunity:** Search impressions and clicks grew with a modest CTR improvement. Evidence: EV-107 through EV-110. This is context, not the top priority.

### Expected AI brief

The AI should communicate, in substance:

> Demand increased, especially for AC repair, but confirmed bookings did not keep pace. The AC repair page’s booking rate fell from 6.10% to 3.92% while sessions rose 31.1% (EV-104–EV-106). Review the mobile booking path before investing more traffic. A July 30 deployment is relevant context, but the available data does not establish causation.

The exact prose may vary. The numbers, evidence IDs, uncertainty, and absence of a causal claim may not.

## 9. Synthetic review corpus

The complete seed should include at least 36 recent review records, but only short, fictional excerpts should be stored. Example current-week records:

| ID            | Date       | Rating | Excerpt                                                                                    | Theme                    | Response state               |
| ------------- | ---------- | -----: | ------------------------------------------------------------------------------------------ | ------------------------ | ---------------------------- |
| REV-260801-01 | 2026-08-01 |      2 | “The technician was excellent, but the arrival window changed twice and no one texted us.” | Scheduling communication | Needs review                 |
| REV-260801-02 | 2026-08-01 |      3 | “Good repair. I wish the dispatcher had called when the appointment moved.”                | Scheduling communication | Needs review                 |
| REV-260731-01 | 2026-07-31 |      3 | “The work was solid; the four-hour window made the day difficult.”                         | Arrival window           | Draft prepared, not approved |
| REV-260730-01 | 2026-07-30 |      5 | “Fast diagnosis and a clear explanation before any work started.”                          | Technician communication | No response required         |
| REV-260729-01 | 2026-07-29 |      5 | “Booked online in the morning and had cool air again by dinner.”                           | Booking/service speed    | Responded before demo period |

Review excerpts are untrusted external content. Seed at least one harmless prompt-injection test string in a non-default test fixture—not the executive demo dataset—to prove the AI boundary.

## 10. Action history

| Action ID | Created    | Source observation                          | Action                                                  | Owner | Status               | Review/result note                                                                     |
| --------- | ---------- | ------------------------------------------- | ------------------------------------------------------- | ----- | -------------------- | -------------------------------------------------------------------------------------- |
| ACT-032   | 2026-03-09 | Search clicks rising for comparison queries | Refresh water-heater comparison page                    | Jonah | Completed 2026-03-18 | Subsequent four-week organic clicks were 23% higher; ReachOps does not claim causation |
| ACT-041   | 2026-05-04 | Repeated “late arrival” review theme        | Review dispatch notification process with Customer Care | Devon | Completed 2026-05-14 | Theme frequency declined in June; causal impact unproven                               |
| ACT-047   | 2026-06-08 | Comfort Club page exit rate above threshold | Clarify membership CTA and pricing explanation          | Jonah | Completed 2026-06-12 | Marked for 30-day follow-up                                                            |
| ACT-052   | 2026-07-13 | Rising “same-day AC repair” query exposure  | Add approved FAQ to AC repair page                      | Jonah | Completed 2026-07-17 | FAQ published through existing CMS outside ReachOps                                    |
| ACT-058   | 2026-08-03 | EV-104–EV-106                               | Investigate mobile booking flow on AC repair page       | Jonah | In progress          | Approved by Maya; due 2026-08-05                                                       |
| ACT-059   | 2026-08-03 | EV-114–EV-115                               | Review scheduling theme with Customer Care              | Devon | Approved             | Due 2026-08-06; no automatic review response                                           |
| ACT-060   | 2026-08-03 | EV-107–EV-110                               | Monitor organic search growth for one more week         | Maya  | Monitoring           | Review 2026-08-10                                                                      |

## 11. Demo reset contract

The demo seed must be deterministic and idempotent.

- `seed` creates or updates only records bearing the workspace slug and synthetic dataset version.
- `reset` restores the exact flagship week, action statuses, audit chronology, and connection states.
- Cleanup resolves exact IDs/markers before deletion; it never performs an organization-wide wildcard delete.
- Seed generation uses normal domain services for actions, approvals, and audit events wherever feasible.
- The seed version appears in the About/Demo information panel.
- Switching a Google connection to live data must not overwrite the synthetic baseline; live records use distinct connection and sync-run IDs.

## 12. Required UI disclosures

Use all of the following:

1. Persistent header badge: **Synthetic workspace**.
2. Workspace menu description: “Fictional SMB created for the ReachOps portfolio demonstration.”
3. Source-level status chips: **Live**, **Simulated**, or **Imported**.
4. Brief footer: “AI-generated draft from listed evidence; approved decisions are human-owned.”
5. About panel with dataset version and frozen reporting week.
6. No fabricated customer logo testimonials, revenue results, production uptime, or partner badges.
