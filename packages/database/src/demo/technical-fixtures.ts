/**
 * Technical audit and Core Web Vitals fixtures for Summit & Sage.
 *
 * The crawl is simulated. ReachOps has never fetched summitandsage.example, and the site does not
 * exist; every finding here is authored to look like what a crawl of a thirteen-page home-services
 * site would surface. Claiming otherwise would be the single most dishonest thing this workspace
 * could do.
 *
 * Roughly twenty checks rather than hundreds. A list long enough to feel exhaustive is a list
 * nobody reads, and most of the entries in one are noise the team will never action.
 *
 * There is deliberately no composite score. Indexability, layout stability and a broken link are
 * not commensurable, and averaging them produces a number that moves for reasons a reader cannot
 * reconstruct.
 */

export type SeoIssueType =
  | 'INDEXABILITY'
  | 'CANONICAL'
  | 'ROBOTS'
  | 'SITEMAP'
  | 'STATUS_4XX'
  | 'STATUS_5XX'
  | 'REDIRECT_CHAIN'
  | 'MISSING_TITLE'
  | 'DUPLICATE_TITLE'
  | 'MISSING_META_DESCRIPTION'
  | 'DUPLICATE_META_DESCRIPTION'
  | 'HEADING_HIERARCHY'
  | 'BROKEN_INTERNAL_LINK'
  | 'WEAK_INTERNAL_LINKING'
  | 'STRUCTURED_DATA'
  | 'MOBILE_PERFORMANCE'
  | 'CORE_WEB_VITALS';

export type SeoSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

/** Where a finding sits in its life, so a board is not a permanent list of complaints. */
export type SeoValidationStatus = 'OPEN' | 'FIXED_PENDING_VALIDATION' | 'VALIDATED' | 'WONT_FIX';

export const SEO_AUDIT = {
  id: 'AUD-2026-08-02',
  siteLabel: 'summitandsage.example',
  crawlMode: 'SIMULATED' as const,
  crawledAt: '2026-08-02T09:00:00.000Z',
  status: 'COMPLETE' as const,
  pagesCrawled: 13,
  checksRun: 21,
  provenanceNote:
    'A simulated crawl of a fictional site. ReachOps holds no crawler and has never fetched this domain or any other. Findings are authored fixtures shaped like real crawl output.',
};

export interface SeoIssueFixture {
  id: string;
  type: SeoIssueType;
  severity: SeoSeverity;
  status: SeoValidationStatus;
  title: string;
  detail: string;
  affectedPaths: string[];
  detectedOn: string;
  fixGuidance: string;
  /** Stable rule key of a related opportunity, resolved to an id at build time. */
  relatedRuleKey: string | null;
}

export const seoIssues: SeoIssueFixture[] = [
  {
    id: 'SEO-01',
    type: 'CORE_WEB_VITALS',
    severity: 'HIGH',
    status: 'OPEN',
    title: 'Mobile interaction delay on the AC repair page crossed the good threshold',
    detail:
      'Field INP for mobile visitors moved from 198 ms to 247 ms, crossing the 200 ms boundary between good and needs-improvement. The booking form is the primary interactive element on the page.',
    affectedPaths: ['/air-conditioning/repair'],
    detectedOn: '2026-08-02',
    fixGuidance:
      'Profile the booking form on a mid-range Android device and measure input delay before and after the 30 July layout change. Compare against the desktop figure, which did not move.',
    relatedRuleKey: 'ac-repair-demand-conversion-divergence',
  },
  {
    id: 'SEO-02',
    type: 'MOBILE_PERFORMANCE',
    severity: 'MEDIUM',
    status: 'OPEN',
    title: 'Hero image on the replacement page is not sized for mobile',
    detail:
      'The same 2400px asset is served to every viewport, which is the largest contributor to a 3.1 s mobile LCP.',
    affectedPaths: ['/air-conditioning/replacement'],
    detectedOn: '2026-08-02',
    fixGuidance: 'Serve responsive sources and set explicit width and height to reserve the space.',
    relatedRuleKey: null,
  },
  {
    id: 'SEO-03',
    type: 'CORE_WEB_VITALS',
    severity: 'MEDIUM',
    status: 'OPEN',
    title: 'Layout shift on the water-heater guide from a late-loading table',
    detail:
      'The comparison table renders after first paint without reserved height, giving a mobile CLS of 0.18 against a 0.1 threshold.',
    affectedPaths: ['/water-heaters/repair-or-replace'],
    detectedOn: '2026-08-02',
    fixGuidance:
      'Reserve the table height in CSS so later content cannot displace what is above it.',
    relatedRuleKey: null,
  },
  {
    id: 'SEO-04',
    type: 'STATUS_4XX',
    severity: 'HIGH',
    status: 'OPEN',
    title: 'A retired promotion page still returns 404 while being linked',
    detail:
      'The spring promotion page was removed without a redirect and is still linked from two service pages.',
    affectedPaths: ['/promotions/spring-2026'],
    detectedOn: '2026-08-02',
    fixGuidance:
      'Redirect the retired URL to the relevant service page and remove the remaining internal links.',
    relatedRuleKey: null,
  },
  {
    id: 'SEO-05',
    type: 'BROKEN_INTERNAL_LINK',
    severity: 'HIGH',
    status: 'OPEN',
    title: 'Two service pages link to the retired promotion',
    detail: 'Both links resolve to a 404, which wastes crawl budget and strands readers.',
    affectedPaths: ['/air-conditioning/maintenance', '/membership/comfort-club'],
    detectedOn: '2026-08-02',
    fixGuidance: 'Point both links at the Comfort Club page or remove them.',
    relatedRuleKey: null,
  },
  {
    id: 'SEO-06',
    type: 'REDIRECT_CHAIN',
    severity: 'MEDIUM',
    status: 'OPEN',
    title: 'A legacy AC repair URL redirects through two hops',
    detail:
      'The historical short URL redirects to a trailing-slash variant before reaching the canonical page.',
    affectedPaths: ['/ac-repair'],
    detectedOn: '2026-08-02',
    fixGuidance: 'Collapse the chain to a single redirect straight to the canonical URL.',
    relatedRuleKey: null,
  },
  {
    id: 'SEO-07',
    type: 'DUPLICATE_META_DESCRIPTION',
    severity: 'MEDIUM',
    status: 'OPEN',
    title: 'Both water-heater pages share one meta description',
    detail:
      'The guide and the tankless page carry identical descriptions, so neither snippet distinguishes itself in results.',
    affectedPaths: ['/water-heaters/repair-or-replace', '/water-heaters/tankless'],
    detectedOn: '2026-08-02',
    fixGuidance:
      'Write a distinct description for each, matching the intent the page actually answers.',
    relatedRuleKey: null,
  },
  {
    id: 'SEO-08',
    type: 'MISSING_META_DESCRIPTION',
    severity: 'MEDIUM',
    status: 'OPEN',
    title: 'The service-area page has no meta description',
    detail: 'Google is generating its own snippet, which currently opens mid-sentence.',
    affectedPaths: ['/about/service-area'],
    detectedOn: '2026-08-02',
    fixGuidance: 'Add a description naming the metro and the typical response window.',
    relatedRuleKey: null,
  },
  {
    id: 'SEO-09',
    type: 'DUPLICATE_TITLE',
    severity: 'LOW',
    status: 'OPEN',
    title: 'Two plumbing pages carry near-identical titles',
    detail:
      'Drain cleaning and emergency plumbing differ only by a single word, which makes them hard to tell apart in a results page.',
    affectedPaths: ['/plumbing/drain-cleaning', '/plumbing/emergency'],
    detectedOn: '2026-08-02',
    fixGuidance: 'Differentiate on urgency and service type rather than brand suffix.',
    relatedRuleKey: null,
  },
  {
    id: 'SEO-10',
    type: 'SITEMAP',
    severity: 'MEDIUM',
    status: 'OPEN',
    title: 'The tankless page is missing from sitemap.xml',
    detail: 'It is linked internally and indexable, but absent from the submitted sitemap.',
    affectedPaths: ['/water-heaters/tankless'],
    detectedOn: '2026-08-02',
    fixGuidance: 'Regenerate the sitemap and confirm the entry appears.',
    relatedRuleKey: null,
  },
  {
    id: 'SEO-11',
    type: 'WEAK_INTERNAL_LINKING',
    severity: 'MEDIUM',
    status: 'OPEN',
    title: 'The EV charger page has a single internal inbound link',
    detail:
      'It sits three clicks from the homepage with one route in, which is thin for a page carrying commercial intent.',
    affectedPaths: ['/electrical/ev-charger'],
    detectedOn: '2026-08-02',
    fixGuidance:
      'Link it from the panel-upgrade page and the electrical section index, where the intent overlaps.',
    relatedRuleKey: null,
  },
  {
    id: 'SEO-12',
    type: 'STRUCTURED_DATA',
    severity: 'MEDIUM',
    status: 'OPEN',
    title: 'LocalBusiness markup omits opening hours',
    detail:
      'The markup validates, but without openingHours it cannot support the hours treatment in local results.',
    affectedPaths: ['/', '/about/service-area'],
    detectedOn: '2026-08-02',
    fixGuidance: 'Add openingHours and confirm it matches the Business Profile exactly.',
    relatedRuleKey: null,
  },
  {
    id: 'SEO-13',
    type: 'STRUCTURED_DATA',
    severity: 'LOW',
    status: 'OPEN',
    title: 'FAQ markup on the AC repair page has an unescaped character',
    detail: 'One answer contains a raw ampersand, which fails strict parsing.',
    affectedPaths: ['/air-conditioning/repair'],
    detectedOn: '2026-08-02',
    fixGuidance: 'Escape the entity in the FAQ source.',
    relatedRuleKey: null,
  },
  {
    id: 'SEO-14',
    type: 'HEADING_HIERARCHY',
    severity: 'LOW',
    status: 'OPEN',
    title: 'The EV charger page skips a heading level',
    detail: 'The document moves from h1 straight to h3, which breaks outline navigation.',
    affectedPaths: ['/electrical/ev-charger'],
    detectedOn: '2026-08-02',
    fixGuidance: 'Promote the section headings to h2.',
    relatedRuleKey: null,
  },
  {
    id: 'SEO-15',
    type: 'CANONICAL',
    severity: 'LOW',
    status: 'OPEN',
    title: 'The membership page declares no canonical',
    detail:
      'Behaviour is currently correct by default, but the absence leaves it exposed if parameters are ever added.',
    affectedPaths: ['/membership/comfort-club'],
    detectedOn: '2026-08-02',
    fixGuidance: 'Declare a self-referencing canonical.',
    relatedRuleKey: null,
  },
  {
    id: 'SEO-16',
    type: 'ROBOTS',
    severity: 'LOW',
    status: 'OPEN',
    title: 'A staging disallow rule is still present in robots.txt',
    detail:
      'The rule targets a path that no longer exists. Harmless today, misleading to the next person who reads the file.',
    affectedPaths: ['/robots.txt'],
    detectedOn: '2026-08-02',
    fixGuidance: 'Remove the stale rule.',
    relatedRuleKey: null,
  },
  {
    id: 'SEO-17',
    type: 'INDEXABILITY',
    severity: 'LOW',
    status: 'WONT_FIX',
    title: 'The booking confirmation step is set to noindex',
    detail:
      'Flagged by the crawler and reviewed by a person. A transactional confirmation page should not be indexed, so the directive is correct.',
    affectedPaths: ['/contact/book'],
    detectedOn: '2026-08-02',
    fixGuidance:
      'No change required. Recorded so the same finding is not re-raised at every crawl.',
    relatedRuleKey: null,
  },
  {
    id: 'SEO-18',
    type: 'STATUS_5XX',
    severity: 'CRITICAL',
    status: 'VALIDATED',
    title: 'Intermittent 500 responses on the booking endpoint',
    detail:
      'The booking submission returned server errors under load in June. A connection-pool limit was raised and the following crawl returned clean.',
    affectedPaths: ['/contact/book'],
    detectedOn: '2026-06-18',
    fixGuidance: 'Resolved. Retained so the history of the endpoint stays visible.',
    relatedRuleKey: null,
  },
  {
    id: 'SEO-19',
    type: 'MOBILE_PERFORMANCE',
    severity: 'MEDIUM',
    status: 'FIXED_PENDING_VALIDATION',
    title: 'Render-blocking script on the homepage',
    detail:
      'A third-party review widget loaded synchronously in the head. It was moved to a deferred load and is awaiting the next crawl.',
    affectedPaths: ['/'],
    detectedOn: '2026-07-20',
    fixGuidance: 'Confirm on the next crawl that the script no longer blocks first paint.',
    relatedRuleKey: null,
  },
];

export type FormFactor = 'MOBILE' | 'DESKTOP';

/**
 * Field data is what real visitors experienced; lab data is one throttled synthetic run. They
 * answer different questions and are never averaged together.
 */
export type VitalsSource = 'FIELD' | 'LAB';

export interface CoreWebVitalsFixture {
  pageKey: string;
  formFactor: FormFactor;
  source: VitalsSource;
  /** Largest Contentful Paint, seconds. Good at or below 2.5. */
  lcp: number;
  /** Interaction to Next Paint, milliseconds. Good at or below 200. */
  inp: number;
  /** Cumulative Layout Shift, unitless. Good at or below 0.1. */
  cls: number;
  priorLcp: number | null;
  priorInp: number | null;
  priorCls: number | null;
}

export const coreWebVitals: CoreWebVitalsFixture[] = [
  // The AC repair page carries the flagship story. Mobile interaction delay crossed the threshold
  // in the same window as the booking-form deployment; desktop did not move.
  {
    pageKey: 'AC-REPAIR',
    formFactor: 'MOBILE',
    source: 'FIELD',
    lcp: 2.8,
    inp: 247,
    cls: 0.08,
    priorLcp: 2.7,
    priorInp: 198,
    priorCls: 0.08,
  },
  {
    pageKey: 'AC-REPAIR',
    formFactor: 'MOBILE',
    source: 'LAB',
    lcp: 3.4,
    inp: 310,
    cls: 0.09,
    priorLcp: null,
    priorInp: null,
    priorCls: null,
  },
  {
    pageKey: 'AC-REPAIR',
    formFactor: 'DESKTOP',
    source: 'FIELD',
    lcp: 1.9,
    inp: 142,
    cls: 0.05,
    priorLcp: 1.9,
    priorInp: 138,
    priorCls: 0.05,
  },
  {
    pageKey: 'AC-REPAIR',
    formFactor: 'DESKTOP',
    source: 'LAB',
    lcp: 2.1,
    inp: 168,
    cls: 0.06,
    priorLcp: null,
    priorInp: null,
    priorCls: null,
  },

  {
    pageKey: 'AC-REPLACEMENT',
    formFactor: 'MOBILE',
    source: 'FIELD',
    lcp: 3.1,
    inp: 178,
    cls: 0.12,
    priorLcp: 3.0,
    priorInp: 175,
    priorCls: 0.12,
  },
  {
    pageKey: 'AC-REPLACEMENT',
    formFactor: 'MOBILE',
    source: 'LAB',
    lcp: 3.8,
    inp: 205,
    cls: 0.14,
    priorLcp: null,
    priorInp: null,
    priorCls: null,
  },
  {
    pageKey: 'AC-REPLACEMENT',
    formFactor: 'DESKTOP',
    source: 'FIELD',
    lcp: 2.2,
    inp: 118,
    cls: 0.06,
    priorLcp: 2.2,
    priorInp: 120,
    priorCls: 0.06,
  },
  {
    pageKey: 'AC-REPLACEMENT',
    formFactor: 'DESKTOP',
    source: 'LAB',
    lcp: 2.4,
    inp: 135,
    cls: 0.07,
    priorLcp: null,
    priorInp: null,
    priorCls: null,
  },

  {
    pageKey: 'WATER-HEATER-GUIDE',
    formFactor: 'MOBILE',
    source: 'FIELD',
    lcp: 2.4,
    inp: 165,
    cls: 0.18,
    priorLcp: 2.4,
    priorInp: 162,
    priorCls: 0.17,
  },
  {
    pageKey: 'WATER-HEATER-GUIDE',
    formFactor: 'MOBILE',
    source: 'LAB',
    lcp: 2.6,
    inp: 180,
    cls: 0.22,
    priorLcp: null,
    priorInp: null,
    priorCls: null,
  },
  {
    pageKey: 'WATER-HEATER-GUIDE',
    formFactor: 'DESKTOP',
    source: 'FIELD',
    lcp: 1.7,
    inp: 104,
    cls: 0.11,
    priorLcp: 1.7,
    priorInp: 106,
    priorCls: 0.1,
  },
  {
    pageKey: 'WATER-HEATER-GUIDE',
    formFactor: 'DESKTOP',
    source: 'LAB',
    lcp: 1.9,
    inp: 120,
    cls: 0.13,
    priorLcp: null,
    priorInp: null,
    priorCls: null,
  },

  {
    pageKey: 'HOME',
    formFactor: 'MOBILE',
    source: 'FIELD',
    lcp: 2.3,
    inp: 156,
    cls: 0.06,
    priorLcp: 2.6,
    priorInp: 158,
    priorCls: 0.06,
  },
  {
    pageKey: 'HOME',
    formFactor: 'MOBILE',
    source: 'LAB',
    lcp: 2.5,
    inp: 172,
    cls: 0.07,
    priorLcp: null,
    priorInp: null,
    priorCls: null,
  },
  {
    pageKey: 'HOME',
    formFactor: 'DESKTOP',
    source: 'FIELD',
    lcp: 1.5,
    inp: 98,
    cls: 0.04,
    priorLcp: 1.6,
    priorInp: 99,
    priorCls: 0.04,
  },
  {
    pageKey: 'HOME',
    formFactor: 'DESKTOP',
    source: 'LAB',
    lcp: 1.6,
    inp: 110,
    cls: 0.05,
    priorLcp: null,
    priorInp: null,
    priorCls: null,
  },
];

/**
 * Field measurement is a 28-day rolling window, so a change made near the end of it is barely
 * represented. The booking form changed on 30 July, four days before this window closes.
 */
export const FIELD_WINDOW = {
  start: '2026-07-06',
  end: '2026-08-02',
  days: 28,
  note: 'Field values are a 28-day rolling average of real visits. The 30 July booking-form change falls inside only the last four days of this window, so its effect on the field figure is damped. A follow-up window is required before the size of the change is known.',
};

export const LAB_NOTE =
  'Lab values come from a single simulated run on a throttled mid-range mobile profile. They are reproducible and diagnostic, but they describe one synthetic visit rather than what visitors experienced.';
