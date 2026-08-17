/**
 * Editorial pipeline fixtures for Summit & Sage.
 *
 * Planned content is a different kind of object from the `ContentItem` records a provider reports.
 * A page, post or review is something that was observed; everything here is work a person intends
 * to do, which is why it carries owners, approvers, due dates and a pipeline status rather than
 * performance.
 *
 * Nothing is scheduled with a provider. ReachOps never writes to Instagram, LinkedIn or Google, so
 * the pipeline ends at PLANNED and `externallyScheduled` is false on every row. Calling the final
 * state "scheduled" would imply an integration that does not exist.
 *
 * Opportunities are referenced by rule key rather than by recommendation id. Recommendation ids are
 * positional and shift whenever a rule is added, so linking by id would silently repoint an article
 * at a different finding.
 */

export type PlannedContentStatus =
  'IDEA' | 'BRIEF' | 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PLANNED' | 'PUBLISHED';

export type PlannedContentType =
  'ARTICLE' | 'SERVICE_PAGE_UPDATE' | 'SEO_REFRESH' | 'SOCIAL_POST' | 'GBP_POST' | 'CAMPAIGN_ASSET';

export type PlannedContentChannel = 'WEBSITE' | 'INSTAGRAM' | 'FACEBOOK' | 'LINKEDIN' | 'GBP';

/** The pipeline a person moves work through. Deliberately ends at PLANNED. */
export const PLANNED_CONTENT_PIPELINE: PlannedContentStatus[] = [
  'IDEA',
  'BRIEF',
  'DRAFT',
  'REVIEW',
  'APPROVED',
  'PLANNED',
  'PUBLISHED',
];

/**
 * The date the demonstration treats as "today".
 *
 * Fixed to the day after the frozen reporting week so overdue and due-this-week counters say the
 * same thing every time the page is opened.
 */
export const CONTENT_REFERENCE_DATE = '2026-08-03';

export interface PlannedContentFixture {
  id: string;
  title: string;
  description: string;
  type: PlannedContentType;
  status: PlannedContentStatus;
  channel: PlannedContentChannel;
  ownerName: string;
  approverName: string | null;
  goalStableKey: string | null;
  campaignStableKey: string | null;
  /** Stable rule key of the originating opportunity, resolved to an id at build time. */
  sourceRuleKey: string | null;
  contentPillar: string;
  objective: string;
  funnelStage: 'AWARENESS' | 'CONSIDERATION' | 'DECISION' | 'RETENTION';
  audience: string;
  primaryTopic: string;
  secondaryTopics: string[];
  destinationPagePath: string | null;
  plannedDate: string | null;
  dueDate: string | null;
  publishedDate: string | null;
  /** The planned item this one repurposes, when it is part of a set. */
  repurposedFromId: string | null;
  /** What the published work became: a search page key or a social post id. */
  publishedRef: string | null;
  callToAction: string;
}

export const plannedContent: PlannedContentFixture[] = [
  // ---------------------------------------------------------------------------
  // Published work. Each points at the observed object it became, so the calendar
  // and the analytics workspaces describe the same thing.
  // ---------------------------------------------------------------------------
  {
    id: 'PC-01',
    title: 'Refresh the water-heater comparison guide',
    description:
      'Rewrote the repair-versus-replace comparison with current Denver pricing and a clearer decision table. The URL was preserved so the page kept its history.',
    type: 'SEO_REFRESH',
    status: 'PUBLISHED',
    channel: 'WEBSITE',
    ownerName: 'Jonah Brooks',
    approverName: 'Maya Chen',
    goalStableKey: 'G-02',
    campaignStableKey: 'CAM-03',
    sourceRuleKey: null,
    contentPillar: 'Home comfort education',
    objective: 'Recover organic clicks on a declining evergreen guide',
    funnelStage: 'CONSIDERATION',
    audience: 'Denver homeowners comparing repair against replacement',
    primaryTopic: 'repair or replace water heater',
    secondaryTopics: ['water heater replacement cost', 'water heater lifespan'],
    destinationPagePath: '/water-heaters/repair-or-replace',
    plannedDate: '2026-03-12',
    dueDate: '2026-03-09',
    publishedDate: '2026-03-14',
    repurposedFromId: null,
    publishedRef: 'WATER-HEATER-GUIDE',
    callToAction: 'Book a water-heater assessment',
  },
  {
    id: 'PC-02',
    title: 'Add an approved FAQ to the AC repair page',
    description:
      'Published a short FAQ answering same-day availability and after-hours pricing, using language approved by Customer Care.',
    type: 'SERVICE_PAGE_UPDATE',
    status: 'PUBLISHED',
    channel: 'WEBSITE',
    ownerName: 'Jonah Brooks',
    approverName: 'Maya Chen',
    goalStableKey: 'G-01',
    campaignStableKey: 'CAM-01',
    sourceRuleKey: null,
    contentPillar: 'Home comfort education',
    objective: 'Answer same-day repair questions on the page that receives the demand',
    funnelStage: 'DECISION',
    audience: 'Denver homeowners needing AC repair now',
    primaryTopic: '24 hour ac repair denver',
    secondaryTopics: ['emergency ac repair denver'],
    destinationPagePath: '/air-conditioning/repair',
    plannedDate: '2026-07-13',
    dueDate: '2026-07-10',
    publishedDate: '2026-07-15',
    repurposedFromId: null,
    publishedRef: 'AC-REPAIR',
    callToAction: 'Book same-day AC repair',
  },
  {
    id: 'PC-03',
    title: 'Technician Reel: diagnosing a failing capacitor',
    description:
      'Short technician-led video walking through a capacitor diagnosis on a Denver rooftop unit.',
    type: 'SOCIAL_POST',
    status: 'PUBLISHED',
    channel: 'INSTAGRAM',
    ownerName: 'Devon Patel',
    approverName: 'Maya Chen',
    goalStableKey: null,
    campaignStableKey: 'CAM-01',
    sourceRuleKey: null,
    contentPillar: 'Team and craft',
    objective: 'Show diagnostic competence rather than assert it',
    funnelStage: 'AWARENESS',
    audience: 'Denver homeowners deciding who to trust',
    primaryTopic: 'technician-led repair explainer',
    secondaryTopics: [],
    destinationPagePath: null,
    plannedDate: '2026-03-10',
    dueDate: '2026-03-06',
    publishedDate: '2026-03-10',
    repurposedFromId: null,
    publishedRef: 'IG-09',
    callToAction: 'Follow for more from the crew',
  },
  {
    id: 'PC-04',
    title: 'Technician Reel: a two-minute duct check',
    description:
      'Follow-up in the technician-led format, showing a quick duct inspection a homeowner can understand.',
    type: 'SOCIAL_POST',
    status: 'PUBLISHED',
    channel: 'INSTAGRAM',
    ownerName: 'Devon Patel',
    approverName: 'Maya Chen',
    goalStableKey: null,
    campaignStableKey: 'CAM-01',
    sourceRuleKey: null,
    contentPillar: 'Team and craft',
    objective: 'Repeat the format that has been reaching furthest',
    funnelStage: 'AWARENESS',
    audience: 'Denver homeowners deciding who to trust',
    primaryTopic: 'technician-led duct explainer',
    secondaryTopics: [],
    destinationPagePath: null,
    plannedDate: '2026-07-21',
    dueDate: '2026-07-17',
    publishedDate: '2026-07-21',
    repurposedFromId: 'PC-03',
    publishedRef: 'IG-20',
    callToAction: 'Follow for more from the crew',
  },

  // ---------------------------------------------------------------------------
  // Work in flight.
  // ---------------------------------------------------------------------------
  {
    id: 'PC-05',
    title: 'What happens after you book',
    description:
      'Explains arrival windows, dispatch updates and what to expect on the day. Written because three separate reviews raised scheduling uncertainty.',
    type: 'ARTICLE',
    status: 'DRAFT',
    channel: 'WEBSITE',
    ownerName: 'Devon Patel',
    approverName: 'Maya Chen',
    goalStableKey: 'G-03',
    campaignStableKey: null,
    sourceRuleKey: 'new-review-scheduling-theme',
    contentPillar: 'Service experience',
    objective: 'Reduce scheduling uncertainty before it becomes a review',
    funnelStage: 'RETENTION',
    audience: 'Customers who have just booked',
    primaryTopic: 'what happens after you book',
    secondaryTopics: ['arrival window', 'dispatch updates'],
    destinationPagePath: '/contact/book',
    plannedDate: '2026-08-10',
    dueDate: '2026-08-06',
    publishedDate: null,
    repurposedFromId: null,
    publishedRef: null,
    callToAction: 'See your booking details',
  },
  {
    id: 'PC-06',
    title: 'AC repair or replace: a Denver cost guide',
    description:
      'Long-form comparison for the repair-versus-replace decision, written against the query cluster that currently earns impressions without clicks.',
    type: 'ARTICLE',
    status: 'BRIEF',
    channel: 'WEBSITE',
    ownerName: 'Jonah Brooks',
    approverName: 'Maya Chen',
    goalStableKey: 'G-02',
    campaignStableKey: 'CAM-01',
    sourceRuleKey: 'organic-demand-conversion-lag',
    contentPillar: 'Home comfort education',
    objective: 'Capture a high-impression query cluster the site does not answer well',
    funnelStage: 'CONSIDERATION',
    audience: 'Denver homeowners with an ageing AC unit',
    primaryTopic: 'ac repair vs replace',
    secondaryTopics: [
      'what should an ac replacement cost in denver',
      'how long does an ac unit last',
    ],
    destinationPagePath: '/air-conditioning/replacement',
    plannedDate: '2026-08-13',
    dueDate: '2026-08-08',
    publishedDate: null,
    repurposedFromId: null,
    publishedRef: null,
    callToAction: 'Book a free replacement estimate',
  },
  {
    id: 'PC-07',
    title: 'Reel: the three questions before replacing an AC',
    description:
      'Technician-led short video repurposing the cost guide, using the format that has been reaching furthest this summer.',
    type: 'SOCIAL_POST',
    status: 'IDEA',
    channel: 'INSTAGRAM',
    ownerName: 'Devon Patel',
    approverName: null,
    goalStableKey: null,
    campaignStableKey: 'CAM-01',
    sourceRuleKey: 'organic-demand-conversion-lag',
    contentPillar: 'Team and craft',
    objective: 'Carry the cost-guide argument into the format that travels furthest',
    funnelStage: 'AWARENESS',
    audience: 'Denver homeowners with an ageing AC unit',
    primaryTopic: 'ac repair vs replace',
    secondaryTopics: [],
    destinationPagePath: null,
    plannedDate: '2026-08-14',
    dueDate: '2026-08-11',
    publishedDate: null,
    repurposedFromId: 'PC-06',
    publishedRef: null,
    callToAction: 'Read the full cost guide',
  },
  {
    id: 'PC-08',
    title: 'LinkedIn graphic: what a replacement actually costs',
    description:
      'Single-image breakdown of replacement cost ranges, repurposed from the cost guide for an employer-brand and homeowner audience.',
    type: 'SOCIAL_POST',
    status: 'IDEA',
    channel: 'LINKEDIN',
    ownerName: 'Elena Ruiz',
    approverName: null,
    goalStableKey: null,
    campaignStableKey: 'CAM-01',
    sourceRuleKey: 'organic-demand-conversion-lag',
    contentPillar: 'Home comfort education',
    objective: 'Reuse the research without rewriting it',
    funnelStage: 'AWARENESS',
    audience: 'Denver homeowners and local trade contacts',
    primaryTopic: 'ac replacement cost',
    secondaryTopics: [],
    destinationPagePath: null,
    plannedDate: '2026-08-14',
    dueDate: '2026-08-11',
    publishedDate: null,
    repurposedFromId: 'PC-06',
    publishedRef: null,
    callToAction: 'Read the full cost guide',
  },
  {
    id: 'PC-09',
    title: 'Business Profile post: repair or replace guidance',
    description:
      'Short Business Profile post pointing at the cost guide. Drafted in ReachOps; publishing happens in Google.',
    type: 'GBP_POST',
    status: 'IDEA',
    channel: 'GBP',
    ownerName: 'Devon Patel',
    approverName: null,
    goalStableKey: 'G-03',
    campaignStableKey: 'CAM-01',
    sourceRuleKey: 'organic-demand-conversion-lag',
    contentPillar: 'Home comfort education',
    objective: 'Put the guidance where local searchers already are',
    funnelStage: 'CONSIDERATION',
    audience: 'Local searchers on the Business Profile',
    primaryTopic: 'ac repair vs replace',
    secondaryTopics: [],
    destinationPagePath: '/air-conditioning/replacement',
    plannedDate: '2026-08-15',
    dueDate: '2026-08-12',
    publishedDate: null,
    repurposedFromId: 'PC-06',
    publishedRef: null,
    callToAction: 'Read the guide',
  },
  {
    id: 'PC-10',
    title: 'Reel: why your condenser needs clearance',
    description: 'Technician-led explainer on airflow clearance around outdoor units.',
    type: 'SOCIAL_POST',
    status: 'APPROVED',
    channel: 'INSTAGRAM',
    ownerName: 'Devon Patel',
    approverName: 'Maya Chen',
    goalStableKey: null,
    campaignStableKey: 'CAM-01',
    sourceRuleKey: null,
    contentPillar: 'Team and craft',
    objective: 'Keep the technician-led cadence going through the season',
    funnelStage: 'AWARENESS',
    audience: 'Denver homeowners running AC daily',
    primaryTopic: 'condenser clearance',
    secondaryTopics: [],
    destinationPagePath: null,
    plannedDate: '2026-08-11',
    dueDate: '2026-08-07',
    publishedDate: null,
    repurposedFromId: null,
    publishedRef: null,
    callToAction: 'Book a tune-up',
  },
  {
    id: 'PC-11',
    title: 'Summer Ready: same-day availability',
    description: 'Static promotional graphic announcing remaining same-day slots for the week.',
    type: 'SOCIAL_POST',
    status: 'REVIEW',
    channel: 'FACEBOOK',
    ownerName: 'Devon Patel',
    approverName: 'Maya Chen',
    goalStableKey: 'G-01',
    campaignStableKey: 'CAM-01',
    sourceRuleKey: null,
    contentPillar: 'Seasonal offer',
    objective: 'Convert existing local awareness into bookings',
    funnelStage: 'DECISION',
    audience: 'Existing Facebook audience',
    primaryTopic: 'same-day ac repair availability',
    secondaryTopics: [],
    destinationPagePath: '/contact/book',
    plannedDate: '2026-08-06',
    dueDate: '2026-08-04',
    publishedDate: null,
    repurposedFromId: null,
    publishedRef: null,
    callToAction: 'Book online',
  },
  {
    id: 'PC-12',
    title: 'Business Profile post: heat advisory availability',
    description: 'Business Profile post covering availability during the Denver heat advisory.',
    type: 'GBP_POST',
    status: 'PLANNED',
    channel: 'GBP',
    ownerName: 'Devon Patel',
    approverName: 'Maya Chen',
    goalStableKey: 'G-03',
    campaignStableKey: 'CAM-01',
    sourceRuleKey: null,
    contentPillar: 'Seasonal offer',
    objective: 'Be visible locally while demand spikes',
    funnelStage: 'DECISION',
    audience: 'Local searchers on the Business Profile',
    primaryTopic: 'heat advisory ac availability',
    secondaryTopics: [],
    destinationPagePath: '/air-conditioning/repair',
    plannedDate: '2026-08-07',
    dueDate: '2026-08-05',
    publishedDate: null,
    repurposedFromId: null,
    publishedRef: null,
    callToAction: 'Book same-day repair',
  },
  {
    id: 'PC-13',
    title: 'LinkedIn: why our technicians stay',
    description: 'Employer-brand post on retention and the apprenticeship path.',
    type: 'SOCIAL_POST',
    status: 'PLANNED',
    channel: 'LINKEDIN',
    ownerName: 'Elena Ruiz',
    approverName: 'Maya Chen',
    goalStableKey: null,
    campaignStableKey: null,
    sourceRuleKey: null,
    contentPillar: 'Recruiting',
    objective: 'Keep recruiting visible through the busy season',
    funnelStage: 'AWARENESS',
    audience: 'Denver trade professionals',
    primaryTopic: 'technician retention',
    secondaryTopics: [],
    destinationPagePath: null,
    plannedDate: '2026-08-04',
    dueDate: '2026-08-03',
    publishedDate: null,
    repurposedFromId: null,
    publishedRef: null,
    callToAction: 'See open roles',
  },
  {
    id: 'PC-14',
    title: 'Tankless water heater buyer guide',
    description:
      'Buyer guide for tankless conversion, covering sizing, rebates and the Denver hard-water caveat.',
    type: 'ARTICLE',
    status: 'DRAFT',
    channel: 'WEBSITE',
    ownerName: 'Jonah Brooks',
    approverName: 'Maya Chen',
    goalStableKey: 'G-02',
    campaignStableKey: null,
    sourceRuleKey: null,
    contentPillar: 'Home comfort education',
    objective: 'Improve capture on a page sitting outside the top ten',
    funnelStage: 'CONSIDERATION',
    audience: 'Denver homeowners considering tankless',
    primaryTopic: 'tankless water heater denver',
    secondaryTopics: ['tankless vs tank water heater'],
    destinationPagePath: '/water-heaters/tankless',
    plannedDate: '2026-08-12',
    // Missed its date. An editorial board where nothing ever slips is not a real one.
    dueDate: '2026-07-30',
    publishedDate: null,
    repurposedFromId: null,
    publishedRef: null,
    callToAction: 'Get a tankless quote',
  },
  {
    id: 'PC-15',
    title: 'Emergency AC repair during a Denver heat wave',
    description:
      'Idea only. Nothing is scheduled for the second half of August while the Summer Ready campaign is still running.',
    type: 'ARTICLE',
    status: 'IDEA',
    channel: 'WEBSITE',
    ownerName: 'Jonah Brooks',
    approverName: null,
    goalStableKey: 'G-01',
    campaignStableKey: 'CAM-01',
    sourceRuleKey: 'ac-repair-demand-conversion-divergence',
    contentPillar: 'Home comfort education',
    objective: 'Cover peak-demand intent while the season is still live',
    funnelStage: 'DECISION',
    audience: 'Denver homeowners during a heat advisory',
    primaryTopic: 'emergency ac repair denver',
    secondaryTopics: ['24 hour ac repair denver'],
    destinationPagePath: '/air-conditioning/repair',
    plannedDate: null,
    dueDate: null,
    publishedDate: null,
    repurposedFromId: null,
    publishedRef: null,
    callToAction: 'Book emergency repair',
  },
];
