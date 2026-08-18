/**
 * Competitor fixtures for Summit & Sage.
 *
 * Two disclosures govern this workspace, and they are different from each other.
 *
 * First, these companies do not exist. Front Range Comfort, Mile High Mechanical and Cherry Creek
 * Heating are invented for the demonstration. Nothing here was gathered about a real business, and
 * publishing a comparison table about named real competitors on a portfolio site would be a
 * different and worse thing to build.
 *
 * Second, and the part that would still apply against real rivals: almost nothing about a competitor
 * is measurable. You cannot see their sessions, their conversion rate, their bookings, their revenue
 * or their ad spend, and no third-party tool can either — those products sell models, not
 * measurements. What you genuinely can see is what they publish and what their public profile says.
 *
 * So the workspace is built around observation rather than estimation. The comparison table holds
 * only things a person could confirm by opening the competitor's website, which is also what makes
 * it the one part of this workspace that is directly actionable. The few estimates are carried as
 * ranges with their method named, and the metrics no source can provide are listed, not modelled.
 */

export type CompetitorKey = 'FRONT-RANGE' | 'MILE-HIGH' | 'CHERRY-CREEK';

export const SUBJECT_KEY = 'SUMMIT';

/**
 * Something a person could verify by opening the competitor's site.
 *
 * Deliberately boolean. The moment an observation becomes a number with a decimal point it has
 * usually stopped being an observation.
 */
export interface PublicSignalFixture {
  key: string;
  /** Phrased as a question a person could answer by looking. */
  question: string;
  /** Why this matters commercially, so the row is not trivia. */
  whyItMatters: string;
  /** Keyed by competitor, plus SUMMIT for the subject of comparison. */
  values: Record<string, boolean>;
}

export const publicSignals: PublicSignalFixture[] = [
  {
    key: 'PRICING',
    question: 'Publishes price ranges for common repairs',
    whyItMatters:
      'Pricing questions are where a customer decides whether to call anyone. A site that answers them can be cited by an assistant; a site that does not cannot.',
    values: { SUMMIT: false, 'FRONT-RANGE': true, 'MILE-HIGH': true, 'CHERRY-CREEK': false },
  },
  {
    key: 'DECISION-GUIDE',
    question: 'Publishes a repair-or-replace decision guide',
    whyItMatters:
      'The strongest organic page Summit & Sage owns. No tracked competitor publishes an equivalent.',
    values: { SUMMIT: true, 'FRONT-RANGE': false, 'MILE-HIGH': false, 'CHERRY-CREEK': false },
  },
  {
    key: 'EMERGENCY-STATED',
    question: 'States emergency availability on the homepage',
    whyItMatters:
      'The highest-intent visitors arrive already in trouble and leave if they cannot see whether anyone will come out tonight.',
    values: { SUMMIT: true, 'FRONT-RANGE': true, 'MILE-HIGH': true, 'CHERRY-CREEK': true },
  },
  {
    key: 'SERVICE-AREAS',
    question: 'Lists named service areas rather than a metro-wide claim',
    whyItMatters:
      'Named neighbourhoods are what a local query matches against and what an assistant repeats when asked for someone nearby.',
    values: { SUMMIT: true, 'FRONT-RANGE': false, 'MILE-HIGH': true, 'CHERRY-CREEK': false },
  },
  {
    key: 'CREDENTIALS',
    question: 'Publishes technician licensing and certification detail',
    whyItMatters:
      'Cited by assistants summarising trustworthiness, and one of the few claims a small business can make that a national aggregator cannot.',
    values: { SUMMIT: false, 'FRONT-RANGE': false, 'MILE-HIGH': true, 'CHERRY-CREEK': true },
  },
  {
    key: 'BOOKING-ONLINE',
    question: 'Offers online booking rather than phone only',
    whyItMatters:
      'Relevant to the booking-rate divergence on the AC repair page: a competitor with a shorter path to a confirmed appointment is a competing explanation worth ruling out.',
    values: { SUMMIT: true, 'FRONT-RANGE': false, 'MILE-HIGH': true, 'CHERRY-CREEK': false },
  },
  {
    key: 'BLOG-ACTIVE',
    question: 'Published anything in the last 90 days',
    whyItMatters:
      'Publishing cadence is visible from post dates and is the cheapest read available on whether anyone is actively working on the site.',
    values: { SUMMIT: true, 'FRONT-RANGE': false, 'MILE-HIGH': true, 'CHERRY-CREEK': false },
  },
];

export interface CompetitorFixture {
  key: CompetitorKey;
  name: string;
  /** How they position themselves, as published on their own site. */
  positioning: string;
  /** Why this business is tracked as a peer. A competitor list without reasons is a list of rivals. */
  reasonTracked: string;
  /** Visible on their public profile. Anyone can read these two numbers. */
  publicRating: number;
  publicReviewCount: number;
  /** Most recent published article, visible from the site. Null where nothing carries a date. */
  lastPublishedOn: string | null;
  observedOn: string;
}

export const competitors: CompetitorFixture[] = [
  {
    key: 'MILE-HIGH',
    name: 'Mile High Mechanical',
    positioning:
      'Positions on speed and coverage: same-day service, named neighbourhoods, licensing detail on every technician page.',
    reasonTracked:
      'Named in more recorded AI answers than any other Denver company, and publishes the pricing content Summit & Sage does not. The closest direct peer.',
    publicRating: 4.71,
    publicReviewCount: 638,
    lastPublishedOn: '2026-07-22',
    observedOn: '2026-08-03',
  },
  {
    key: 'FRONT-RANGE',
    name: 'Front Range Comfort',
    positioning:
      'Positions on price transparency: a published rate card and flat-fee diagnostics on the homepage.',
    reasonTracked:
      'The tracked competitor whose pricing page assistants cite when answering cost questions, which is the prompt Summit & Sage stopped appearing in.',
    publicRating: 4.38,
    publicReviewCount: 291,
    lastPublishedOn: '2026-02-11',
    observedOn: '2026-08-03',
  },
  {
    key: 'CHERRY-CREEK',
    name: 'Cherry Creek Heating',
    positioning:
      'Positions on premium installation and long warranties. Little service-repair content of any kind.',
    reasonTracked:
      'Overlaps on replacement work rather than repair. Tracked to watch whether that boundary holds, not because the two compete week to week.',
    publicRating: 4.82,
    publicReviewCount: 104,
    lastPublishedOn: null,
    observedOn: '2026-08-03',
  },
];

/**
 * The subject of comparison, so the table has something to compare against.
 *
 * The rating here must equal the `gbp.cumulative_rating` observation the rest of the product
 * publishes. A competitor screen that quietly restates the business's own rating from a second
 * source is how two pages end up disagreeing about the same number.
 */
export const subject = {
  key: SUBJECT_KEY,
  name: 'Summit & Sage Home Services',
  positioning:
    'Positions on diagnosis quality and honest advice. Strong decision-guide content, no published pricing.',
  publicRating: 4.56,
  publicReviewCount: 412,
  lastPublishedOn: '2026-07-28',
  observedOn: '2026-08-03',
};

/**
 * Figures that are modelled rather than observed.
 *
 * Each carries a range rather than a point value, and names the method that produced it. The ranges
 * are wide because honest ones are: a model built on observed positions and a published
 * click-through curve cannot distinguish 1,800 from 3,900 monthly clicks, and pretending otherwise
 * is the whole problem with this category of product.
 */
export interface CompetitorEstimateFixture {
  competitorKey: CompetitorKey;
  metric: string;
  low: number;
  high: number;
  unit: string;
  method: string;
}

export const competitorEstimates: CompetitorEstimateFixture[] = [
  {
    competitorKey: 'MILE-HIGH',
    metric: 'Monthly organic clicks',
    low: 1800,
    high: 3900,
    unit: 'clicks',
    method:
      'Modelled from positions observed on the 40 tracked queries multiplied by a published click-through curve. A model of a sample, not a measurement.',
  },
  {
    competitorKey: 'FRONT-RANGE',
    metric: 'Monthly organic clicks',
    low: 900,
    high: 2100,
    unit: 'clicks',
    method:
      'Modelled from positions observed on the 40 tracked queries multiplied by a published click-through curve. A model of a sample, not a measurement.',
  },
  {
    competitorKey: 'CHERRY-CREEK',
    metric: 'Monthly organic clicks',
    low: 300,
    high: 1100,
    unit: 'clicks',
    method:
      'Modelled from positions observed on the 40 tracked queries multiplied by a published click-through curve. The band is proportionally widest here because the site ranks for fewest of them.',
  },
];

/**
 * Queries where a tracked competitor was seen in the results alongside Summit & Sage.
 *
 * From the same manual sampling the AI panel uses, so it inherits the same limits: one operator, one
 * location, a handful of moments. Results are personalised and change through the day.
 */
export interface QueryOverlapFixture {
  query: string;
  competitorKeys: CompetitorKey[];
}

export const queryOverlaps: QueryOverlapFixture[] = [
  { query: 'ac repair denver', competitorKeys: ['MILE-HIGH', 'FRONT-RANGE'] },
  { query: 'emergency ac repair denver', competitorKeys: ['MILE-HIGH'] },
  { query: 'ac repair cost denver', competitorKeys: ['FRONT-RANGE', 'MILE-HIGH'] },
  { query: 'water heater repair or replace', competitorKeys: [] },
  { query: 'ac replacement denver', competitorKeys: ['CHERRY-CREEK', 'MILE-HIGH'] },
  { query: 'furnace tune up denver', competitorKeys: ['MILE-HIGH'] },
];

export const OVERLAP_SAMPLE_NOTE =
  'Observed by running each query by hand from a Denver location in a clean browser profile on 3 August 2026. Search results are personalised and change through the day, so this is a snapshot of six queries at one moment, not a ranking report.';

export const COMPETITOR_INVENTED_NOTE =
  'These three companies are invented for this demonstration. No data was gathered about any real business. Everything below is authored fixture content shaped like what genuine public observation would produce.';

export const COMPETITOR_METHOD_NOTE =
  'The comparison table holds only things a person could confirm by opening a competitor website. That is a deliberate limit rather than a shortcoming: it is also the part of this workspace that tells you something you can act on.';

/**
 * What no source can provide about a competitor.
 *
 * Every one of these is sold as a number by some tool in this category. None is a measurement, and
 * where a vendor supplies one it is a model whose inputs the buyer cannot inspect.
 */
export const COMPETITOR_UNAVAILABLE = [
  {
    metric: 'Their sessions, visitors or page views',
    reason:
      'Analytics data is private to whoever owns the property. Third-party traffic figures are models built from panel and clickstream sampling, and their error on a single small local business is large enough to reverse a comparison.',
  },
  {
    metric: 'Their conversion rate or booking count',
    reason:
      'A conversion is an event inside somebody elses analytics. Nothing observable from outside distinguishes a visitor who booked from one who left.',
  },
  {
    metric: 'Their revenue or average job value',
    reason:
      'Not published by a private company and not derivable from anything visible. A figure here would be invention with a currency symbol attached.',
  },
  {
    metric: 'Their advertising spend',
    reason:
      'Ad transparency tools show that ads ran, not what was paid. Spend estimates multiply guessed impressions by guessed rates.',
  },
  {
    metric: 'Their full keyword footprint',
    reason:
      'Only the queries on the tracked list were checked, by hand, once. A complete footprint would require continuous crawling at a scale nothing here does.',
  },
];
