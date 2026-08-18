/**
 * AI answer visibility fixtures for Summit & Sage.
 *
 * This is the workspace where it is easiest to invent a number nobody can contradict, so almost
 * everything here is about what cannot be known.
 *
 * No assistant publishes an analytics interface that reports how often a business is cited, and
 * Search Console does not break out AI Overview appearances. The only honest observation available
 * is a panel: someone runs a prompt on a schedule and records what came back. That is a sample of
 * one asker at one moment, not a measurement of how a market sees a business, and answers are
 * non-deterministic and personalised, so two runs of the same prompt legitimately differ.
 *
 * Every check below is therefore an authored record of a simulated run. The panel is deliberately
 * small and uneven — not every prompt is checked on every assistant — because a tidy grid of
 * results would imply a systematic crawl that does not exist.
 */

export type AssistantKey = 'CHATGPT' | 'PERPLEXITY' | 'GOOGLE_AI_OVERVIEW' | 'CLAUDE';

export interface AssistantFixture {
  key: AssistantKey;
  displayName: string;
  /** How a check is performed. None of these is an API integration, and the copy says so. */
  method: string;
  /** Whether the assistant shows source links a business could be cited in. */
  showsSources: boolean;
  /** What this assistant specifically cannot tell you, beyond the shared limits. */
  limitation: string;
}

export const assistants: AssistantFixture[] = [
  {
    key: 'CHATGPT',
    displayName: 'ChatGPT',
    method: 'Prompt run by hand in a signed-out session and the answer recorded.',
    showsSources: true,
    limitation:
      'Answers vary with account history and memory. A signed-out run avoids personalisation but is not what a logged-in customer would see.',
  },
  {
    key: 'PERPLEXITY',
    displayName: 'Perplexity',
    method: 'Prompt run by hand and the numbered source list recorded.',
    showsSources: true,
    limitation:
      'Citation order reflects how the answer was assembled. It is not a ranking and does not behave like one.',
  },
  {
    key: 'GOOGLE_AI_OVERVIEW',
    displayName: 'Google AI Overview',
    method:
      'Query run in a clean browser profile and the overview panel recorded when one appeared.',
    showsSources: true,
    limitation:
      'An overview does not appear for every query or every user. Search Console reports these impressions inside the ordinary web totals, so they cannot be separated out.',
  },
  {
    key: 'CLAUDE',
    displayName: 'Claude',
    method: 'Prompt run by hand and the answer recorded.',
    showsSources: false,
    limitation:
      'Without web search enabled the answer carries no source links, so a mention cannot be traced to a page and no click can follow it.',
  },
];

export interface AiPromptFixture {
  key: string;
  prompt: string;
  intent: 'INFORMATIONAL' | 'COMMERCIAL' | 'TRANSACTIONAL' | 'NAVIGATIONAL';
  branded: boolean;
  /** Why this prompt is on the panel at all. A tracked prompt with no reason is decoration. */
  reasonTracked: string;
  /** The page the business would want cited, where one exists. */
  targetPath: string | null;
}

export const aiPrompts: AiPromptFixture[] = [
  {
    key: 'AC-COST',
    prompt: 'How much does AC repair cost in Denver?',
    intent: 'COMMERCIAL',
    branded: false,
    reasonTracked:
      'Pricing questions are where a customer decides whether to call anyone at all. The cost guide is the page most likely to be cited if one is.',
    targetPath: '/air-conditioning/repair',
  },
  {
    key: 'AC-EMERGENCY',
    prompt: 'Who should I call for emergency AC repair in Denver?',
    intent: 'TRANSACTIONAL',
    branded: false,
    reasonTracked:
      'The highest-intent phrasing in the service line. If an assistant names companies at all, it names them here.',
    targetPath: '/air-conditioning/repair',
  },
  {
    key: 'BEST-HVAC',
    prompt: 'What is the best HVAC company in Denver for same-day service?',
    intent: 'COMMERCIAL',
    branded: false,
    reasonTracked:
      'A superlative prompt. Tracked to see who gets named, not because being named is a goal that can be pursued directly.',
    targetPath: null,
  },
  {
    key: 'WATER-HEATER-DECISION',
    prompt: 'Should I repair or replace my water heater?',
    intent: 'INFORMATIONAL',
    branded: false,
    reasonTracked:
      'The comparison guide is the strongest organic page on the site. This checks whether that strength carries into answer engines.',
    targetPath: '/water-heaters/repair-or-replace',
  },
  {
    key: 'COMPRESSOR-FAILING',
    prompt: 'How do I know if my AC compressor is failing?',
    intent: 'INFORMATIONAL',
    branded: false,
    reasonTracked:
      'A diagnostic question that precedes a service call by days. Tracked to see whether informational content earns a citation.',
    targetPath: '/air-conditioning/repair',
  },
  {
    key: 'BRAND-REVIEWS',
    prompt: 'What do people say about Summit & Sage Home Services?',
    intent: 'NAVIGATIONAL',
    branded: true,
    reasonTracked:
      'Branded prompts reveal which third-party sources an assistant trusts to describe the business, which the business does not control.',
    targetPath: '/about',
  },
  {
    key: 'FURNACE-SIZE',
    prompt: 'What size furnace do I need for an 1,800 square foot house in Colorado?',
    intent: 'INFORMATIONAL',
    branded: false,
    reasonTracked:
      'A technical question with a defensible answer. Tracked as a candidate for content that does not exist yet.',
    targetPath: null,
  },
  {
    key: 'PLUMBER-CHEAP',
    prompt: 'Who is the cheapest emergency plumber in Denver?',
    intent: 'COMMERCIAL',
    branded: false,
    reasonTracked:
      'Tracked deliberately as a prompt the business does not want to win. Watching it is how you notice if positioning drifts.',
    targetPath: null,
  },
];

export interface AiCheckFixture {
  id: string;
  promptKey: string;
  assistant: AssistantKey;
  checkedOn: string;
  /** Whether the business was named in the answer text at all. */
  brandMentioned: boolean;
  /** Whether a link to the business appeared in the sources. Mention without citation is common. */
  brandCited: boolean;
  citedPath: string | null;
  /**
   * Where the citation sat in the source list. Recorded because it was observed, and labelled
   * everywhere it appears as an assembly order rather than a rank.
   */
  citationOrder: number | null;
  competitorsNamed: string[];
  /** What the answer said, in our own record. Short, and never presented as a verbatim transcript. */
  answerSummary: string;
}

/**
 * The panel.
 *
 * Uneven on purpose. Some prompts are checked on three assistants, some on one, and the cadence is
 * weekly at best. Filling the grid would suggest a systematic crawl nobody is running.
 */
export const aiChecks: AiCheckFixture[] = [
  // AC-COST — the flagship. Cited three times, then absent on the most recent Perplexity run.
  {
    id: 'AI-001',
    promptKey: 'AC-COST',
    assistant: 'PERPLEXITY',
    checkedOn: '2026-07-13',
    brandMentioned: true,
    brandCited: true,
    citedPath: '/air-conditioning/repair',
    citationOrder: 2,
    competitorsNamed: ['Front Range Comfort', 'Mile High Mechanical'],
    answerSummary:
      'Gave a $150–$650 range for common repairs and cited the Summit & Sage repair page among five sources.',
  },
  {
    id: 'AI-002',
    promptKey: 'AC-COST',
    assistant: 'PERPLEXITY',
    checkedOn: '2026-07-20',
    brandMentioned: true,
    brandCited: true,
    citedPath: '/air-conditioning/repair',
    citationOrder: 3,
    competitorsNamed: ['Front Range Comfort'],
    answerSummary:
      'Similar range with a seasonal caveat. Summit & Sage cited third of four sources.',
  },
  {
    id: 'AI-003',
    promptKey: 'AC-COST',
    assistant: 'PERPLEXITY',
    checkedOn: '2026-07-27',
    brandMentioned: true,
    brandCited: true,
    citedPath: '/air-conditioning/repair',
    citationOrder: 2,
    competitorsNamed: ['Mile High Mechanical', 'Cherry Creek Heating'],
    answerSummary: 'Broke the answer into diagnostic fee and parts. Summit & Sage cited second.',
  },
  {
    id: 'AI-004',
    promptKey: 'AC-COST',
    assistant: 'PERPLEXITY',
    checkedOn: '2026-08-03',
    brandMentioned: false,
    brandCited: false,
    citedPath: null,
    citationOrder: null,
    competitorsNamed: ['Front Range Comfort', 'Mile High Mechanical', 'Cherry Creek Heating'],
    answerSummary:
      'Answered from three aggregator pages and a national price index. No Denver company page cited.',
  },
  {
    id: 'AI-005',
    promptKey: 'AC-COST',
    assistant: 'CHATGPT',
    checkedOn: '2026-07-27',
    brandMentioned: false,
    brandCited: false,
    citedPath: null,
    citationOrder: null,
    competitorsNamed: [],
    answerSummary:
      'Gave a national range and advised getting three quotes. Named no Denver companies at all.',
  },
  {
    id: 'AI-006',
    promptKey: 'AC-COST',
    assistant: 'GOOGLE_AI_OVERVIEW',
    checkedOn: '2026-08-03',
    brandMentioned: false,
    brandCited: false,
    citedPath: null,
    citationOrder: null,
    competitorsNamed: ['Front Range Comfort'],
    answerSummary: 'Overview shown. Sourced two aggregators and one competitor service page.',
  },

  // AC-EMERGENCY — cited consistently. The one clearly positive story on the panel.
  {
    id: 'AI-007',
    promptKey: 'AC-EMERGENCY',
    assistant: 'PERPLEXITY',
    checkedOn: '2026-07-20',
    brandMentioned: true,
    brandCited: true,
    citedPath: '/air-conditioning/repair',
    citationOrder: 1,
    competitorsNamed: ['Mile High Mechanical'],
    answerSummary:
      'Listed four Denver companies with same-day claims. Summit & Sage first, citing the repair page.',
  },
  {
    id: 'AI-008',
    promptKey: 'AC-EMERGENCY',
    assistant: 'PERPLEXITY',
    checkedOn: '2026-08-03',
    brandMentioned: true,
    brandCited: true,
    citedPath: '/air-conditioning/repair',
    citationOrder: 1,
    competitorsNamed: ['Mile High Mechanical', 'Front Range Comfort'],
    answerSummary: 'Same shape of answer. Summit & Sage cited first again.',
  },
  {
    id: 'AI-009',
    promptKey: 'AC-EMERGENCY',
    assistant: 'CHATGPT',
    checkedOn: '2026-08-03',
    brandMentioned: true,
    brandCited: false,
    citedPath: null,
    citationOrder: null,
    competitorsNamed: ['Mile High Mechanical'],
    answerSummary:
      'Named Summit & Sage in the answer text but linked nothing. A mention with no path back to the site.',
  },

  // WATER-HEATER-DECISION — the strongest organic page, cited on two of three assistants.
  {
    id: 'AI-010',
    promptKey: 'WATER-HEATER-DECISION',
    assistant: 'PERPLEXITY',
    checkedOn: '2026-07-27',
    brandMentioned: true,
    brandCited: true,
    citedPath: '/water-heaters/repair-or-replace',
    citationOrder: 1,
    competitorsNamed: [],
    answerSummary:
      'Used the eight-year age threshold framing and cited the comparison guide as its first source.',
  },
  {
    id: 'AI-011',
    promptKey: 'WATER-HEATER-DECISION',
    assistant: 'GOOGLE_AI_OVERVIEW',
    checkedOn: '2026-08-03',
    brandMentioned: false,
    brandCited: true,
    citedPath: '/water-heaters/repair-or-replace',
    citationOrder: 3,
    competitorsNamed: [],
    answerSummary:
      'Overview cited the comparison guide as a source without naming the business in the text.',
  },
  {
    id: 'AI-012',
    promptKey: 'WATER-HEATER-DECISION',
    assistant: 'CLAUDE',
    checkedOn: '2026-07-27',
    brandMentioned: false,
    brandCited: false,
    citedPath: null,
    citationOrder: null,
    competitorsNamed: [],
    answerSummary:
      'Gave general repair-or-replace guidance with no companies and no links, as expected without web search.',
  },

  // BEST-HVAC — never cited across the panel. Competitors consistently named.
  {
    id: 'AI-013',
    promptKey: 'BEST-HVAC',
    assistant: 'PERPLEXITY',
    checkedOn: '2026-07-20',
    brandMentioned: false,
    brandCited: false,
    citedPath: null,
    citationOrder: null,
    competitorsNamed: ['Mile High Mechanical', 'Front Range Comfort', 'Cherry Creek Heating'],
    answerSummary: 'Built a shortlist from two directory pages and a local news round-up.',
  },
  {
    id: 'AI-014',
    promptKey: 'BEST-HVAC',
    assistant: 'CHATGPT',
    checkedOn: '2026-07-27',
    brandMentioned: false,
    brandCited: false,
    citedPath: null,
    citationOrder: null,
    competitorsNamed: ['Mile High Mechanical', 'Cherry Creek Heating'],
    answerSummary: 'Declined to rank, then named two companies as commonly recommended.',
  },
  {
    id: 'AI-015',
    promptKey: 'BEST-HVAC',
    assistant: 'GOOGLE_AI_OVERVIEW',
    checkedOn: '2026-08-03',
    brandMentioned: false,
    brandCited: false,
    citedPath: null,
    citationOrder: null,
    competitorsNamed: ['Mile High Mechanical', 'Front Range Comfort'],
    answerSummary: 'Overview assembled from directory listings and review aggregate pages.',
  },

  // BRAND-REVIEWS — the business is described entirely through third-party sources.
  {
    id: 'AI-016',
    promptKey: 'BRAND-REVIEWS',
    assistant: 'PERPLEXITY',
    checkedOn: '2026-08-03',
    brandMentioned: true,
    brandCited: false,
    citedPath: null,
    citationOrder: null,
    competitorsNamed: [],
    answerSummary:
      'Summarised sentiment from three review aggregators. Cited none of the company’s own pages.',
  },
  {
    id: 'AI-017',
    promptKey: 'BRAND-REVIEWS',
    assistant: 'CHATGPT',
    checkedOn: '2026-08-03',
    brandMentioned: true,
    brandCited: false,
    citedPath: null,
    citationOrder: null,
    competitorsNamed: [],
    answerSummary:
      'Described the business as well reviewed with occasional scheduling complaints, sourced from aggregators.',
  },

  // COMPRESSOR-FAILING — informational, no citation. A content gap rather than a ranking problem.
  {
    id: 'AI-018',
    promptKey: 'COMPRESSOR-FAILING',
    assistant: 'PERPLEXITY',
    checkedOn: '2026-07-27',
    brandMentioned: false,
    brandCited: false,
    citedPath: null,
    citationOrder: null,
    competitorsNamed: ['Cherry Creek Heating'],
    answerSummary:
      'Listed six symptoms sourced from two manufacturer pages and a competitor blog post.',
  },
  {
    id: 'AI-019',
    promptKey: 'COMPRESSOR-FAILING',
    assistant: 'CLAUDE',
    checkedOn: '2026-08-03',
    brandMentioned: false,
    brandCited: false,
    citedPath: null,
    citationOrder: null,
    competitorsNamed: [],
    answerSummary: 'Listed symptoms and advised a professional diagnostic. No sources shown.',
  },

  // FURNACE-SIZE — nothing to cite, because the page does not exist.
  {
    id: 'AI-020',
    promptKey: 'FURNACE-SIZE',
    assistant: 'PERPLEXITY',
    checkedOn: '2026-08-03',
    brandMentioned: false,
    brandCited: false,
    citedPath: null,
    citationOrder: null,
    competitorsNamed: ['Front Range Comfort'],
    answerSummary:
      'Worked through a BTU calculation citing two manufacturer sizing guides and one competitor page.',
  },

  // PLUMBER-CHEAP — tracked as a prompt the business does not want to win.
  {
    id: 'AI-021',
    promptKey: 'PLUMBER-CHEAP',
    assistant: 'PERPLEXITY',
    checkedOn: '2026-08-03',
    brandMentioned: false,
    brandCited: false,
    citedPath: null,
    citationOrder: null,
    competitorsNamed: ['Budget Rooter Denver'],
    answerSummary:
      'Named two discount operators and warned about call-out fees. Summit & Sage absent, as intended.',
  },
];

/**
 * Sessions arriving from assistant referrer domains.
 *
 * This is the one genuinely measured quantity in the workspace: analytics can see a session whose
 * referrer is an assistant domain. It is also the narrowest. It counts clicks, not citations, so a
 * customer who read an answer and typed the address in later is invisible, and several assistants
 * strip the referrer entirely. The undercount is real and its size is unknown.
 */
export interface AiReferralFixture {
  assistant: AssistantKey;
  sessions: number;
  priorSessions: number;
}

export const aiReferrals: AiReferralFixture[] = [
  { assistant: 'CHATGPT', sessions: 18, priorSessions: 11 },
  { assistant: 'PERPLEXITY', sessions: 7, priorSessions: 9 },
  { assistant: 'GOOGLE_AI_OVERVIEW', sessions: 0, priorSessions: 0 },
  { assistant: 'CLAUDE', sessions: 0, priorSessions: 0 },
];

/** Total workspace sessions for the same window, so the referral figure can be kept in proportion. */
export const AI_REFERRAL_WINDOW_SESSIONS = 10_440;

export const AI_PANEL_NOTE =
  'Every figure in this workspace comes from a small panel of prompts run by hand on a weekly cadence. Assistant answers are non-deterministic and personalised, so two runs of the same prompt differ legitimately. Treat a single check as an anecdote and a run of checks as weak evidence.';

/**
 * What this workspace cannot tell you.
 *
 * Published as data rather than buried in prose, because every one of these is something a
 * competing product will happily show as a number.
 */
export const AI_UNAVAILABLE = [
  {
    metric: 'How often this prompt is actually asked',
    reason:
      'No assistant publishes prompt volume. There is no equivalent of search impressions, and any figure claiming to be one is modelled from something else.',
  },
  {
    metric: 'Share of voice across AI answers',
    reason:
      'A share requires a census. This is a sample of a few runs per week by one operator, which cannot be scaled into a percentage of a market.',
  },
  {
    metric: 'Ranking position within an answer',
    reason:
      'Answers are prose, not ranked lists. Where a citation order was visible it is recorded, but it reflects how the answer was assembled and does not behave like a search position.',
  },
  {
    metric: 'Whether a real customer saw any of this',
    reason:
      'These checks were run by ReachOps, not observed from customer sessions. Nothing here establishes that a single person received these answers.',
  },
  {
    metric: 'Bookings produced by an AI answer',
    reason:
      'No attribution path exists between an assistant answer and a booking. Referral sessions are the closest signal and they capture only the clicks that keep a referrer.',
  },
];
