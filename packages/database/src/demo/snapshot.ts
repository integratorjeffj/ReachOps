import {
  DemoSearchSnapshotSchema,
  DemoSnapshotSchema,
  type DemoAction,
  type DemoActivityEvent,
  type DemoComparedMetric,
  type DemoConnection,
  type DemoEvidenceRecord,
  type DemoRecommendation,
  type DemoReview,
  type DemoSearchSnapshot,
  type DemoSearchWorkspace,
  type DemoSnapshot,
  type MetricComparison,
  type MetricDefinition,
  type ObservationCandidate,
  type OverviewResponse,
  type SourceMode,
} from '@reachops/contracts';
import {
  generateObservationCandidates,
  OBSERVATION_RULE_VERSION,
} from '../insights/observation-rules';
import { compareMetricPeriods } from '../metrics/period-comparison';
import {
  actionFixtures,
  annotations,
  DEMO_DATASET_VERSION,
  DEMO_FROZEN_WEEK_END,
  DEMO_FROZEN_WEEK_START,
  DEMO_RETRIEVED_AT,
  DEMO_WORKSPACE_ID,
  DEMO_WORKSPACE_SLUG,
  flagshipComparisons,
  goals,
  metricDefinitions,
  monthlyBaseline,
  reviewFixtures,
  sources,
} from './fixtures';
import { monthlyPeriod, PRIOR_WEEK_END, PRIOR_WEEK_START } from './periods';
import { pageMonthlyClicks, searchPages, searchQueries } from './search-fixtures';

/**
 * Builds the published demonstration snapshot from the committed Summit & Sage fixtures.
 *
 * This module performs no database access. It reuses the same deterministic comparison and
 * observation services the API depends on, so the static demonstration and the running
 * application derive their numbers from one implementation rather than two.
 */

const WORKSPACE_NAME = 'Summit & Sage Home Services';
const WORKSPACE_TIMEZONE = 'America/Denver';
const AC_REPAIR_PAGE_PATH = '/air-conditioning/repair';
const SEARCH_ROW_COVERAGE_NOTE =
  'Search Console withholds anonymised queries and thresholds low-volume rows, so this row is a subset of the property total.';
const SCHEDULING_THEMES = ['Scheduling communication', 'Arrival window'];
const SCHEDULING_THEME_MINIMUM = 3;
const HISTORICAL_REVIEW_STATE = 'Historical fixture';

const MONTHLY_METRICS = [
  ['ga4.sessions', 'ga4'],
  ['ga4.organic_sessions', 'ga4'],
  ['ga4.confirmed_bookings', 'ga4'],
  ['gsc.impressions', 'gsc'],
  ['gsc.clicks', 'gsc'],
  ['gbp.profile_views', 'gbp'],
  ['gbp.actions', 'gbp'],
  ['gbp.new_reviews', 'gbp'],
  ['gbp.cumulative_rating', 'gbp'],
] as const;

/** Mirrors OverviewQueryService.TREND_METRICS so the snapshot matches what the API returns. */
const TREND_METRICS = [
  'ga4.sessions',
  'ga4.organic_sessions',
  'ga4.confirmed_bookings',
  'gsc.impressions',
  'gsc.clicks',
  'gbp.profile_views',
  'gbp.actions',
  'gbp.new_reviews',
  'gbp.cumulative_rating',
] as const;

const KPI_SPECS = [
  { key: 'sessions', label: 'Website sessions', metric: 'ga4.sessions', scope: 'workspace' },
  {
    key: 'confirmed-bookings',
    label: 'Confirmed bookings',
    metric: 'ga4.confirmed_bookings',
    scope: 'workspace',
  },
  {
    key: 'ac-repair-booking-rate',
    label: 'AC repair booking rate',
    metric: 'ga4.page_booking_rate',
    scope: 'ac-repair-page',
  },
  {
    key: 'new-review-rating',
    label: 'New-review average rating',
    metric: 'gbp.new_review_average_rating',
    scope: 'workspace',
  },
] as const;

const INPUT_KEY_BY_EVIDENCE_ID: Record<string, string> = {
  'EV-102': 'organicSessions',
  'EV-104': 'acRepairSessions',
  'EV-105': 'acRepairBookings',
  'EV-106': 'acRepairBookingRate',
  'EV-107': 'searchImpressions',
  'EV-108': 'searchClicks',
  'EV-109': 'searchCtr',
  'EV-110': 'searchAveragePosition',
  'EV-111': 'gbpProfileViews',
  'EV-112': 'gbpWebsiteClicks',
  'EV-113': 'gbpCallClicks',
  'EV-114': 'newReviews',
  'EV-115': 'newReviewAverageRating',
};

const GOAL_METRIC_BY_UNIT: Record<string, string | undefined> = {
  CONFIRMED_BOOKINGS_PER_MONTH: 'ga4.confirmed_bookings',
  CUMULATIVE_RATING: 'gbp.cumulative_rating',
};

const CONNECTION_NOTES: Record<string, { capabilities: string[]; note: string }> = {
  ga4: {
    capabilities: ['METRICS'],
    note: 'Read-only analytics scope is modelled but not authorized; values come from the frozen fixture.',
  },
  gsc: {
    capabilities: ['METRICS'],
    note: 'Read-only Search Console scope is modelled but not authorized; values come from the frozen fixture.',
  },
  gbp: {
    capabilities: ['METRICS', 'CONTENT'],
    note: 'Simulated adapter. No Google Business Profile API approval is claimed or required.',
  },
  linkedin: {
    capabilities: ['IMPORT'],
    note: 'Imported from an operator-supplied export. Import provenance is retained on every value.',
  },
  meta: {
    capabilities: ['METRICS'],
    note: 'Simulated adapter reserved for later milestones. No Meta API approval is claimed.',
  },
};

interface RecommendationPlanEntry {
  title: string;
  rationale: string;
  actionId: string | null;
  category: DemoRecommendation['category'];
  affectedEntity: string;
  diagnosis: string;
  suggestedChange: string;
  expectedOutcome: string;
  impact: DemoRecommendation['impact'];
  effort: DemoRecommendation['effort'];
  observationConfidence: DemoRecommendation['observationConfidence'];
  causalConfidence: DemoRecommendation['causalConfidence'];
  causalHypothesis: string | null;
  urgency: DemoRecommendation['urgency'];
  goalStableKey: string | null;
  campaignStableKey: string | null;
}

const RECOMMENDATION_PLAN: Record<string, RecommendationPlanEntry> = {
  'ac-repair-demand-conversion-divergence': {
    title: 'Investigate the AC repair mobile booking flow',
    rationale:
      'Sessions on the AC repair page rose while confirmed bookings and booking rate fell. A mobile booking-form layout change was deployed inside the same window; that is context, not proof of causation.',
    actionId: 'ACT-058',
    category: 'CONVERSION',
    affectedEntity: AC_REPAIR_PAGE_PATH,
    diagnosis:
      'Traffic increased materially while conversion efficiency deteriorated. More people reached the page and fewer of them booked.',
    suggestedChange:
      'Inspect the AC repair booking flow on mobile and compare form completion and error behaviour before and after the July 30 layout change.',
    expectedOutcome:
      'Recover the booking rate toward its prior level without reducing qualified traffic.',
    impact: 'HIGH',
    effort: 'M',
    observationConfidence: 'HIGH',
    causalConfidence: 'MEDIUM',
    causalHypothesis:
      'A booking-form layout deployment occurred inside the same reporting window. This is a hypothesis-supporting context signal, not evidence of cause.',
    urgency: 'IMMEDIATE',
    goalStableKey: 'G-01',
    campaignStableKey: 'CAM-01',
  },
  'local-profile-cross-source-divergence': {
    title: 'Compare local-profile reporting before acting',
    rationale:
      'Organic sessions rose while profile views, website clicks, and call clicks fell. Cross-source divergence can reflect differing source definitions, so no action is proposed until the definitions are reconciled.',
    actionId: null,
    category: 'LOCAL',
    affectedEntity: 'Summit & Sage Service Area profile',
    diagnosis:
      'Website and local-profile signals moved in opposite directions. Divergence across sources frequently reflects differing metric definitions rather than a real change in demand.',
    suggestedChange:
      'Reconcile the Business Profile action definitions against site analytics before treating the decline as real.',
    expectedOutcome:
      'Either a corrected comparison, or a confirmed local visibility problem worth acting on.',
    impact: 'MEDIUM',
    effort: 'S',
    observationConfidence: 'MEDIUM',
    causalConfidence: null,
    causalHypothesis: null,
    urgency: 'THIS_MONTH',
    goalStableKey: 'G-03',
    campaignStableKey: null,
  },
  'new-review-scheduling-theme': {
    title: 'Review the scheduling theme with Customer Care',
    rationale:
      'The average rating of new reviews declined and three permitted excerpts share a scheduling theme. ReachOps never drafts or sends a review response automatically.',
    actionId: 'ACT-059',
    category: 'LOCAL',
    affectedEntity: 'New Google reviews, Jul 27 – Aug 2',
    diagnosis:
      'New-review rating fell while three separate excerpts independently raised arrival windows or scheduling updates.',
    suggestedChange:
      'Walk the dispatch notification process with Customer Care and identify where arrival-window changes stop reaching the customer.',
    expectedOutcome: 'Fewer scheduling-related themes in subsequent review periods.',
    impact: 'MEDIUM',
    effort: 'M',
    observationConfidence: 'HIGH',
    causalConfidence: null,
    causalHypothesis: null,
    urgency: 'THIS_WEEK',
    goalStableKey: 'G-03',
    campaignStableKey: null,
  },
  'search-visibility-opportunity': {
    title: 'Monitor organic search growth for one more week',
    rationale:
      'Impressions, clicks, click-through rate, and average position all improved together. One week is insufficient to treat the gain as durable.',
    actionId: 'ACT-060',
    category: 'SEARCH',
    affectedEntity: 'Non-branded organic search',
    diagnosis:
      'Every search signal improved in the same direction at once, which is encouraging but also consistent with normal seasonal variation.',
    suggestedChange:
      'Hold for one further reporting period before committing effort, then confirm whether the gain persists.',
    expectedOutcome: 'A durable non-branded organic gain, or a return to the prior baseline.',
    impact: 'MEDIUM',
    effort: 'XS',
    observationConfidence: 'HIGH',
    causalConfidence: null,
    causalHypothesis: null,
    urgency: 'EVERGREEN',
    goalStableKey: 'G-02',
    campaignStableKey: null,
  },
};

interface WeeklyFixture {
  evidenceId: string;
  stableKey: string;
  scope: string;
  sourceKey: string;
  priorValue: number;
  currentValue: number;
}

interface MonthlyFixture {
  evidenceId: string;
  stableKey: string;
  sourceKey: string;
  month: string;
  value: number;
  periodStart: string;
  periodEnd: string;
}

function isoOf(value: Date): string {
  return value.toISOString();
}

function byCodeUnit(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function definitionMap(): Map<string, MetricDefinition> {
  return new Map(
    metricDefinitions.map(
      ([
        stableKey,
        provider,
        nativeName,
        displayName,
        family,
        unit,
        aggregationBehavior,
        lowerIsBetter,
      ]) => [
        stableKey,
        {
          stableKey,
          provider,
          nativeName,
          displayName,
          family,
          unit,
          aggregationBehavior,
          description: `${displayName} as defined by the source-native fixture contract.`,
          comparabilityNotes:
            'Compare only within the same source, resource, grain and dimensions.',
          lowerIsBetter,
        },
      ],
    ),
  );
}

function sourceMode(sourceKey: string): SourceMode {
  return sources.find(({ key }) => key === sourceKey)!.mode;
}

function weeklyFixtures(): WeeklyFixture[] {
  return flagshipComparisons.map(
    ([evidenceId, stableKey, priorValue, currentValue, sourceKey, scope]) => ({
      evidenceId,
      stableKey,
      scope,
      sourceKey,
      priorValue,
      currentValue,
    }),
  );
}

function monthlyFixtures(): MonthlyFixture[] {
  return monthlyBaseline.flatMap((row) => {
    const [month, ...values] = row;
    const period = monthlyPeriod(month);
    return MONTHLY_METRICS.map(([stableKey, sourceKey], index) => ({
      evidenceId: `EV-MONTHLY-${month}-${stableKey.replace(/[^a-zA-Z0-9]+/g, '-').toUpperCase()}`,
      stableKey,
      sourceKey,
      month,
      value: values[index]!,
      periodStart: isoOf(period.start),
      periodEnd: isoOf(period.end),
    }));
  });
}

function comparisonFor(
  fixture: WeeklyFixture,
  definitions: Map<string, MetricDefinition>,
): MetricComparison {
  const definition = definitions.get(fixture.stableKey)!;
  const mode = sourceMode(fixture.sourceKey);
  return compareMetricPeriods({
    definition: {
      stableKey: definition.stableKey,
      unit: definition.unit,
      lowerIsBetter: definition.lowerIsBetter,
    },
    prior: {
      evidenceId: `${fixture.evidenceId}-PRIOR`,
      sourceMode: mode,
      value: fixture.priorValue,
      qualityStatus: 'COMPLETE',
      qualityFlags: [],
    },
    current: {
      evidenceId: fixture.evidenceId,
      sourceMode: mode,
      value: fixture.currentValue,
      qualityStatus: 'COMPLETE',
      qualityFlags: [],
    },
  });
}

function schedulingThemeCount(): number {
  const windowStart = '2026-07-27';
  const windowEnd = '2026-08-02';
  return reviewFixtures.filter(
    ({ date, theme, responseState }) =>
      responseState !== HISTORICAL_REVIEW_STATE &&
      SCHEDULING_THEMES.includes(theme) &&
      date >= windowStart &&
      date <= windowEnd,
  ).length;
}

function buildOverview(
  definitions: Map<string, MetricDefinition>,
  weekly: WeeklyFixture[],
  monthly: MonthlyFixture[],
  comparisons: Map<string, MetricComparison>,
): OverviewResponse {
  const kpis = KPI_SPECS.map((spec) => {
    const fixture = weekly.find(
      ({ stableKey, scope }) => stableKey === spec.metric && scope === spec.scope,
    )!;
    const definition = definitions.get(spec.metric)!;
    const comparison = comparisons.get(fixture.evidenceId)!;
    const mode = sourceMode(fixture.sourceKey);

    return {
      key: spec.key,
      label: spec.label,
      status: 'AVAILABLE' as const,
      definition,
      current: {
        evidenceId: fixture.evidenceId,
        value: fixture.currentValue,
        retrievedAt: isoOf(DEMO_RETRIEVED_AT),
        qualityStatus: 'COMPLETE' as const,
        qualityFlags: [],
      },
      prior: {
        evidenceId: `${fixture.evidenceId}-PRIOR`,
        value: fixture.priorValue,
        retrievedAt: isoOf(DEMO_RETRIEVED_AT),
        qualityStatus: 'COMPLETE' as const,
        qualityFlags: [],
      },
      change: {
        absolute: comparison.absoluteChange!,
        percentage: comparison.percentageChange,
        percentagePoints: comparison.percentagePointChange,
        direction: comparison.direction as 'UP' | 'DOWN' | 'FLAT',
      },
      sourceModes: [mode],
      coverageNote: null,
    };
  });

  const latestMonthly = (stableKey: string): MonthlyFixture | undefined =>
    [...monthly].reverse().find((item) => item.stableKey === stableKey);

  const goalResponses: OverviewResponse['goals'] = goals.map((goal) => {
    const stableKey = goal.targetUnit ? GOAL_METRIC_BY_UNIT[goal.targetUnit] : undefined;
    const observation = stableKey ? latestMonthly(stableKey) : undefined;
    const targetValue: number | null = goal.targetValue;
    const currentValue = observation?.value ?? null;
    return {
      stableKey: goal.stableKey,
      title: goal.title,
      description: goal.description,
      targetValue,
      targetUnit: goal.targetUnit,
      targetDate: goal.targetDate ? isoOf(goal.targetDate) : null,
      status: observation ? ('AVAILABLE' as const) : ('UNAVAILABLE' as const),
      currentValue,
      attainmentPercentage:
        currentValue === null || targetValue === null || targetValue === 0
          ? null
          : (currentValue / targetValue) * 100,
      definition: observation ? definitions.get(observation.stableKey)! : null,
      evidenceId: observation?.evidenceId ?? null,
      retrievedAt: observation ? isoOf(DEMO_RETRIEVED_AT) : null,
      sourceMode: observation ? sourceMode(observation.sourceKey) : null,
    };
  });

  const trends = TREND_METRICS.map((stableKey) => ({
    metricStableKey: stableKey,
    definition: definitions.get(stableKey)!,
    points: monthly
      .filter((item) => item.stableKey === stableKey)
      .slice(-13)
      .map((item) => ({
        periodStart: item.periodStart,
        periodEnd: item.periodEnd,
        value: item.value,
        evidenceId: item.evidenceId,
        retrievedAt: isoOf(DEMO_RETRIEVED_AT),
        qualityStatus: 'COMPLETE' as const,
        sourceMode: sourceMode(item.sourceKey),
      })),
  }));

  const sourceCoverage = [...sources]
    .sort((left, right) => byCodeUnit(left.displayName, right.displayName))
    .map((source) => ({
      connectionId: source.connectionId,
      provider: source.provider,
      displayName: source.displayName,
      mode: source.mode,
      status: 'CONNECTED' as const,
      resourceName: source.displayName,
      lastSuccessAt: isoOf(DEMO_RETRIEVED_AT),
      lastSyncedAt: isoOf(DEMO_RETRIEVED_AT),
    }));

  const state =
    kpis.every(({ status }) => status === 'AVAILABLE') &&
    sourceCoverage.every(({ status }) => status === 'CONNECTED') &&
    goalResponses.every(({ status }) => status !== 'PARTIAL') &&
    trends.every(({ points }) => points.every(({ qualityStatus }) => qualityStatus === 'COMPLETE'))
      ? ('AVAILABLE' as const)
      : ('PARTIAL' as const);

  return {
    state,
    workspace: {
      id: DEMO_WORKSPACE_ID,
      slug: DEMO_WORKSPACE_SLUG,
      name: WORKSPACE_NAME,
      timezone: WORKSPACE_TIMEZONE,
      synthetic: true,
      datasetVersion: DEMO_DATASET_VERSION,
    },
    activeWeek: {
      start: isoOf(DEMO_FROZEN_WEEK_START),
      end: isoOf(DEMO_FROZEN_WEEK_END),
      timezone: WORKSPACE_TIMEZONE,
    },
    goals: goalResponses,
    kpis,
    sourceCoverage,
    priorities: [1, 2, 3].map((position) => ({
      position,
      status: 'PENDING_ANALYSIS' as const,
    })),
    trends,
    annotations: [...annotations]
      .filter(({ startsAt }) => startsAt.getTime() <= DEMO_FROZEN_WEEK_END.getTime())
      .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime())
      .map((annotation) => ({
        stableKey: annotation.stableKey,
        type: annotation.type,
        title: annotation.title,
        description: annotation.description,
        startsAt: isoOf(annotation.startsAt),
        endsAt: annotation.endsAt ? isoOf(annotation.endsAt) : null,
      })),
  };
}

function evidenceIdsFromTrigger(trigger: string): string[] {
  const range = /^EV-(\d+)\s*[–—-]\s*EV-(\d+)$/.exec(trigger);
  if (range) {
    const from = Number(range[1]);
    const to = Number(range[2]);
    return Array.from({ length: to - from + 1 }, (_, index) => `EV-${from + index}`);
  }
  return [...trigger.matchAll(/EV-\d+/g)].map(([match]) => match);
}

function dueDateFromNote(note: string): string | null {
  const match = /\bdue\s+(\d{4}-\d{2}-\d{2})/i.exec(note);
  return match ? match[1]! : null;
}

function reviewDateFromNote(note: string): string | null {
  const match = /\breview\s+(\d{4}-\d{2}-\d{2})/i.exec(note);
  return match ? match[1]! : null;
}

function buildActions(observations: ObservationCandidate[]): DemoAction[] {
  const observationByEvidence = new Map<string, string>();
  for (const observation of observations) {
    for (const evidenceId of observation.evidenceIds) {
      observationByEvidence.set(evidenceId, observation.id);
    }
  }

  return actionFixtures.map(([id, decidedOn, trigger, title, owner, status, note]) => {
    const evidenceIds = evidenceIdsFromTrigger(trigger);
    const observationId =
      evidenceIds.map((evidenceId) => observationByEvidence.get(evidenceId)).find(Boolean) ?? null;
    return {
      id,
      decidedOn,
      trigger,
      title,
      owner,
      status,
      note,
      evidenceIds,
      observationId,
      dueOn: dueDateFromNote(note),
      reviewOn: reviewDateFromNote(note),
      current: decidedOn === '2026-08-03',
    };
  });
}

function buildRecommendations(observations: ObservationCandidate[]): DemoRecommendation[] {
  return observations.map((observation, index) => {
    const plan = RECOMMENDATION_PLAN[observation.ruleKey]!;
    const approved = plan.actionId !== null;
    return {
      id: `REC-${String(index + 1).padStart(3, '0')}`,
      observationId: observation.id,
      ruleKey: observation.ruleKey,
      title: plan.title,
      rationale: plan.rationale,
      evidenceIds: observation.evidenceIds,
      decision: approved ? ('APPROVED' as const) : ('PENDING' as const),
      decidedBy: approved ? 'Maya Chen' : null,
      decidedAt: approved ? '2026-08-03T18:00:00.000Z' : null,
      linkedActionId: plan.actionId,
      category: plan.category,
      status: approved ? ('ACCEPTED' as const) : ('PROPOSED' as const),
      affectedEntity: plan.affectedEntity,
      diagnosis: plan.diagnosis,
      suggestedChange: plan.suggestedChange,
      expectedOutcome: plan.expectedOutcome,
      impact: plan.impact,
      effort: plan.effort,
      observationConfidence: plan.observationConfidence,
      causalConfidence: plan.causalConfidence,
      causalHypothesis: plan.causalHypothesis,
      urgency: plan.urgency,
      goalStableKey: plan.goalStableKey,
      campaignStableKey: plan.campaignStableKey,
    };
  });
}

function buildConnections(monthly: MonthlyFixture[], weekly: WeeklyFixture[]): DemoConnection[] {
  return [...sources]
    .sort((left, right) => byCodeUnit(left.displayName, right.displayName))
    .map((source) => {
      const monthlyForSource = monthly.filter(({ sourceKey }) => sourceKey === source.key);
      const weeklyForSource = weekly.filter(({ sourceKey }) => sourceKey === source.key);
      const metricKeys = [
        ...new Set([
          ...monthlyForSource.map(({ stableKey }) => stableKey),
          ...weeklyForSource.map(({ stableKey }) => stableKey),
        ]),
      ].sort(byCodeUnit);
      const notes = CONNECTION_NOTES[source.key]!;
      const observationCount = monthlyForSource.length + weeklyForSource.length * 2;

      return {
        connectionId: source.connectionId,
        provider: source.provider,
        mode: source.mode,
        status: 'CONNECTED' as const,
        displayName: source.displayName,
        resourceName: source.displayName,
        resourceType: source.resourceType,
        nativeId: source.nativeId,
        scopes: [...source.scopes],
        capabilities: notes.capabilities as DemoConnection['capabilities'],
        lastSyncedAt: isoOf(DEMO_RETRIEVED_AT),
        syncWindow: {
          start: '2025-07-01T06:00:00.000Z',
          end: isoOf(DEMO_FROZEN_WEEK_END),
          timezone: WORKSPACE_TIMEZONE,
        },
        observationCount,
        metricKeys,
        liveCapable: source.provider === 'GA4' || source.provider === 'SEARCH_CONSOLE',
        authorizationNote: notes.note,
        dataState: observationCount > 0 ? ('ACTIVE' as const) : ('NO_HISTORY' as const),
        dataStateNote:
          observationCount > 0
            ? `${observationCount} observations across ${metricKeys.length} metric definitions in the frozen window.`
            : 'Authorized and reachable, but no performance history has been imported for this source. No metric on any ReachOps surface is derived from it.',
      };
    });
}

function buildActivity(
  observations: ObservationCandidate[],
  recommendations: DemoRecommendation[],
  actions: DemoAction[],
): DemoActivityEvent[] {
  const events: DemoActivityEvent[] = [];

  for (const source of [...sources].sort((left, right) =>
    byCodeUnit(left.displayName, right.displayName),
  )) {
    events.push({
      id: `ACTV-SYNC-${source.key.toUpperCase()}`,
      occurredAt: isoOf(DEMO_RETRIEVED_AT),
      actorType: 'SYSTEM',
      actorName: 'System Sync',
      eventType: 'SOURCE_SYNC_COMPLETED',
      entityType: 'DataSourceConnection',
      entityId: source.connectionId,
      summary: `${source.displayName} synchronized in ${source.mode.toLowerCase()} mode through the frozen reporting window.`,
      evidenceIds: [],
    });
  }

  events.push({
    id: 'ACTV-DATASET-SEEDED',
    occurredAt: isoOf(DEMO_RETRIEVED_AT),
    actorType: 'SYSTEM',
    actorName: 'System Sync',
    eventType: 'DEMO_DATASET_SEEDED',
    entityType: 'DemoDataset',
    entityId: DEMO_DATASET_VERSION,
    summary: `Synthetic dataset ${DEMO_DATASET_VERSION} seeded with a frozen reporting window.`,
    evidenceIds: [],
  });

  for (const observation of observations) {
    events.push({
      id: `ACTV-OBS-${observation.id}`,
      occurredAt: '2026-08-03T13:00:00.000Z',
      actorType: 'SYSTEM',
      actorName: 'Deterministic rule engine',
      eventType: 'OBSERVATION_CANDIDATE_GENERATED',
      entityType: 'ObservationCandidate',
      entityId: observation.id,
      summary: `Rule ${observation.ruleKey} v${observation.ruleVersion} emitted "${observation.title}".`,
      evidenceIds: observation.evidenceIds,
    });
  }

  for (const recommendation of recommendations) {
    if (recommendation.decision !== 'APPROVED') continue;
    events.push({
      id: `ACTV-REC-${recommendation.id}`,
      occurredAt: recommendation.decidedAt!,
      actorType: 'HUMAN',
      actorName: recommendation.decidedBy!,
      eventType: 'RECOMMENDATION_APPROVED',
      entityType: 'Recommendation',
      entityId: recommendation.id,
      summary: `Approved "${recommendation.title}" and assigned follow-through.`,
      evidenceIds: recommendation.evidenceIds,
    });
  }

  for (const action of actions) {
    events.push({
      id: `ACTV-ACT-${action.id}`,
      occurredAt: `${action.decidedOn}T18:00:00.000Z`,
      actorType: 'HUMAN',
      actorName: action.owner,
      eventType: action.status === 'COMPLETED' ? 'ACTION_COMPLETED' : 'ACTION_ASSIGNED',
      entityType: 'ActionItem',
      entityId: action.id,
      summary:
        action.status === 'COMPLETED'
          ? `Completed "${action.title}". ${action.note}`
          : `Assigned "${action.title}" to ${action.owner}.`,
      evidenceIds: action.evidenceIds,
    });
  }

  return events.sort(
    (left, right) =>
      Date.parse(left.occurredAt) - Date.parse(right.occurredAt) || byCodeUnit(left.id, right.id),
  );
}

const PROVIDER_LABEL: Record<string, string> = {
  GA4: 'GA4',
  SEARCH_CONSOLE: 'Search Console',
  GBP_SIMULATED: 'Business Profile',
  LINKEDIN_IMPORT: 'LinkedIn',
  META_SIMULATED: 'Meta',
};

const PAGE_LABEL: Record<string, string> = {
  [AC_REPAIR_PAGE_PATH]: 'AC repair page',
};

const chipDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: WORKSPACE_TIMEZONE,
});

function chipRange(startIso: string, endIso: string): string {
  return `${chipDateFormatter.format(new Date(startIso))}–${chipDateFormatter.format(
    new Date(endIso),
  )}`;
}

function chipLabelFor(
  provider: string,
  dimensions: Record<string, string>,
  periodStart: string,
  periodEnd: string,
): string {
  const providerLabel = PROVIDER_LABEL[provider] ?? provider;
  const pagePath = dimensions.pagePath;
  if (pagePath) return `${providerLabel} · ${PAGE_LABEL[pagePath] ?? pagePath}`;
  return `${providerLabel} · ${chipRange(periodStart, periodEnd)}`;
}

function annotationKeysOverlapping(startIso: string, endIso: string): string[] {
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  return annotations
    .filter((annotation) => {
      const annotationStart = annotation.startsAt.getTime();
      const annotationEnd = annotation.endsAt?.getTime() ?? annotationStart;
      return annotationStart <= end && annotationEnd >= start;
    })
    .map(({ stableKey }) => stableKey);
}

/**
 * Flattens every observation any surface can cite into inspectable records.
 *
 * The drawer reads only from here, so a chip rendered on the Command Center and the same chip on an
 * Opportunity resolve to identical provenance rather than to two separately assembled views.
 */
function buildEvidenceRecords(
  definitions: Map<string, MetricDefinition>,
  weekly: WeeklyFixture[],
  monthly: MonthlyFixture[],
  comparisons: Map<string, MetricComparison>,
): DemoEvidenceRecord[] {
  const records: DemoEvidenceRecord[] = [];

  const base = (stableKey: string, sourceKey: string) => {
    const definition = definitions.get(stableKey)!;
    const source = sources.find(({ key }) => key === sourceKey)!;
    return {
      provider: definition.provider,
      sourceMode: source.mode,
      connectionDisplayName: source.displayName,
      resourceName: source.displayName,
      resourceNativeId: source.nativeId,
      metricStableKey: definition.stableKey,
      metricDisplayName: definition.displayName,
      metricDescription: definition.description,
      comparabilityNotes: definition.comparabilityNotes,
      unit: definition.unit,
      family: definition.family,
      aggregationBehavior: definition.aggregationBehavior,
      lowerIsBetter: definition.lowerIsBetter,
      timezone: WORKSPACE_TIMEZONE,
      qualityStatus: 'COMPLETE' as const,
      qualityFlags: [] as string[],
      coverageNote: null,
      retrievedAt: isoOf(DEMO_RETRIEVED_AT),
      syncRunId: `demo-sync-seed-${sourceKey}-${DEMO_DATASET_VERSION}`,
    };
  };

  for (const fixture of weekly) {
    const dimensions: Record<string, string> =
      fixture.scope === 'ac-repair-page'
        ? { pagePath: AC_REPAIR_PAGE_PATH }
        : { scope: 'workspace' };
    const comparison = comparisons.get(fixture.evidenceId)!;
    const currentStart = isoOf(DEMO_FROZEN_WEEK_START);
    const currentEnd = isoOf(DEMO_FROZEN_WEEK_END);
    const priorStart = isoOf(PRIOR_WEEK_START);
    const priorEnd = isoOf(PRIOR_WEEK_END);
    const shared = base(fixture.stableKey, fixture.sourceKey);

    records.push({
      ...shared,
      evidenceId: fixture.evidenceId,
      grain: 'WEEK',
      periodStart: currentStart,
      periodEnd: currentEnd,
      value: fixture.currentValue,
      priorValue: fixture.priorValue,
      priorEvidenceId: `${fixture.evidenceId}-PRIOR`,
      displayChange: comparison.display.change,
      dimensions,
      chipLabel: chipLabelFor(shared.provider, dimensions, currentStart, currentEnd),
      relatedAnnotationKeys: annotationKeysOverlapping(currentStart, currentEnd),
    });

    records.push({
      ...shared,
      evidenceId: `${fixture.evidenceId}-PRIOR`,
      grain: 'WEEK',
      periodStart: priorStart,
      periodEnd: priorEnd,
      value: fixture.priorValue,
      priorValue: null,
      priorEvidenceId: null,
      displayChange: null,
      dimensions,
      chipLabel: chipLabelFor(shared.provider, dimensions, priorStart, priorEnd),
      relatedAnnotationKeys: annotationKeysOverlapping(priorStart, priorEnd),
    });
  }

  for (const fixture of monthly) {
    const dimensions: Record<string, string> = { scope: 'workspace' };
    const shared = base(fixture.stableKey, fixture.sourceKey);
    records.push({
      ...shared,
      evidenceId: fixture.evidenceId,
      grain: 'MONTH',
      periodStart: fixture.periodStart,
      periodEnd: fixture.periodEnd,
      value: fixture.value,
      priorValue: null,
      priorEvidenceId: null,
      displayChange: null,
      dimensions,
      chipLabel: chipLabelFor(shared.provider, dimensions, fixture.periodStart, fixture.periodEnd),
      relatedAnnotationKeys: annotationKeysOverlapping(fixture.periodStart, fixture.periodEnd),
    });
  }

  return records.sort((left, right) => byCodeUnit(left.evidenceId, right.evidenceId));
}

/**
 * Evidence for page- and query-level search rows.
 *
 * Observations flagged `reused` are skipped: the AC repair page's sessions, bookings, and booking
 * rate are already published as EV-104 to EV-106, and minting parallel records would let two
 * surfaces disagree about the same measurement.
 */
function buildSearchEvidenceRecords(
  definitions: Map<string, MetricDefinition>,
  observations: SearchObservation[],
): DemoEvidenceRecord[] {
  const records: DemoEvidenceRecord[] = [];
  const currentStart = isoOf(DEMO_FROZEN_WEEK_START);
  const currentEnd = isoOf(DEMO_FROZEN_WEEK_END);
  const priorStart = isoOf(PRIOR_WEEK_START);
  const priorEnd = isoOf(PRIOR_WEEK_END);

  for (const observation of observations) {
    if (observation.reused) continue;

    const definition = definitions.get(observation.metricStableKey)!;
    const source = sources.find(({ key }) => key === observation.sourceKey)!;
    const providerLabel = PROVIDER_LABEL[definition.provider] ?? definition.provider;
    const comparison = compareMetricPeriods({
      definition,
      current: {
        evidenceId: observation.evidenceId,
        sourceMode: source.mode,
        value: observation.current,
        qualityStatus: 'COMPLETE',
        qualityFlags: [],
      },
      prior: {
        evidenceId: observation.priorEvidenceId,
        sourceMode: source.mode,
        value: observation.prior,
        qualityStatus: 'COMPLETE',
        qualityFlags: [],
      },
    });

    const shared = {
      provider: definition.provider,
      sourceMode: source.mode,
      connectionDisplayName: source.displayName,
      resourceName: source.displayName,
      resourceNativeId: source.nativeId,
      metricStableKey: definition.stableKey,
      metricDisplayName: definition.displayName,
      metricDescription: definition.description,
      comparabilityNotes: definition.comparabilityNotes,
      unit: definition.unit,
      family: definition.family,
      aggregationBehavior: definition.aggregationBehavior,
      lowerIsBetter: definition.lowerIsBetter,
      grain: 'WEEK' as const,
      timezone: WORKSPACE_TIMEZONE,
      dimensions: observation.dimensions,
      qualityStatus: 'COMPLETE' as const,
      qualityFlags: [] as string[],
      // Row-level search data is a subset of the property total by design.
      coverageNote: observation.sourceKey === 'gsc' ? SEARCH_ROW_COVERAGE_NOTE : null,
      retrievedAt: isoOf(DEMO_RETRIEVED_AT),
      syncRunId: `demo-sync-seed-${observation.sourceKey}-${DEMO_DATASET_VERSION}`,
      chipLabel: `${providerLabel} · ${observation.contextLabel}`,
    };

    records.push({
      ...shared,
      evidenceId: observation.evidenceId,
      periodStart: currentStart,
      periodEnd: currentEnd,
      value: observation.current,
      priorValue: observation.prior,
      priorEvidenceId: observation.priorEvidenceId,
      displayChange: comparison.display.change,
      relatedAnnotationKeys: annotationKeysOverlapping(currentStart, currentEnd),
    });

    records.push({
      ...shared,
      evidenceId: observation.priorEvidenceId,
      periodStart: priorStart,
      periodEnd: priorEnd,
      value: observation.prior,
      priorValue: null,
      priorEvidenceId: null,
      displayChange: null,
      relatedAnnotationKeys: annotationKeysOverlapping(priorStart, priorEnd),
    });
  }

  // Month-grain clicks for the pages that carry a narrative.
  const gsc = sources.find(({ key }) => key === 'gsc')!;
  const clicksDefinition = definitions.get('gsc.clicks')!;
  for (const [pageKey, series] of Object.entries(pageMonthlyClicks)) {
    const page = searchPages.find(({ key }) => key === pageKey)!;
    for (const [period, value] of series) {
      const bounds = monthlyPeriod(period);
      const periodStart = isoOf(bounds.start);
      const periodEnd = isoOf(bounds.end);
      records.push({
        provider: clicksDefinition.provider,
        sourceMode: gsc.mode,
        connectionDisplayName: gsc.displayName,
        resourceName: gsc.displayName,
        resourceNativeId: gsc.nativeId,
        metricStableKey: clicksDefinition.stableKey,
        metricDisplayName: clicksDefinition.displayName,
        metricDescription: clicksDefinition.description,
        comparabilityNotes: clicksDefinition.comparabilityNotes,
        unit: clicksDefinition.unit,
        family: clicksDefinition.family,
        aggregationBehavior: clicksDefinition.aggregationBehavior,
        lowerIsBetter: clicksDefinition.lowerIsBetter,
        grain: 'MONTH',
        periodStart,
        periodEnd,
        timezone: WORKSPACE_TIMEZONE,
        value,
        priorValue: null,
        priorEvidenceId: null,
        displayChange: null,
        dimensions: { pagePath: page.path },
        qualityStatus: 'COMPLETE',
        qualityFlags: [],
        coverageNote: SEARCH_ROW_COVERAGE_NOTE,
        retrievedAt: isoOf(DEMO_RETRIEVED_AT),
        syncRunId: `demo-sync-seed-gsc-${DEMO_DATASET_VERSION}`,
        evidenceId: `EV-PAGEMONTH-${pageKey}-${period.replace('-', '')}`,
        chipLabel: `Search Console · ${shortLabelFor(pageKey)}`,
        relatedAnnotationKeys: annotationKeysOverlapping(periodStart, periodEnd),
      });
    }
  }

  return records.sort((left, right) => byCodeUnit(left.evidenceId, right.evidenceId));
}

interface SearchObservation {
  evidenceId: string;
  priorEvidenceId: string;
  metricStableKey: string;
  sourceKey: string;
  dimensions: Record<string, string>;
  contextLabel: string;
  current: number;
  prior: number;
  /**
   * True when the value is already published by `flagshipComparisons`. Those observations are
   * emitted once, by the weekly path, so a page row and the Command Center cite the same record
   * instead of two that merely agree.
   */
  reused: boolean;
}

function shortLabelFor(key: string): string {
  return key
    .split('-')
    .map((token, index) => {
      if (token.length <= 2) return token;
      const cased = token.charAt(0) + token.slice(1).toLowerCase();
      return index === 0 ? cased : cased.toLowerCase();
    })
    .join(' ');
}

function rate(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : Number(((numerator / denominator) * 100).toFixed(2));
}

/** Evidence identifiers already minted for the AC repair page by the flagship weekly comparisons. */
const AC_REPAIR_REUSED: Record<string, string> = {
  'ga4.sessions': 'EV-104',
  'ga4.confirmed_bookings': 'EV-105',
  'ga4.page_booking_rate': 'EV-106',
};

function searchObservations(): SearchObservation[] {
  const observations: SearchObservation[] = [];
  const flagshipByEvidenceId = new Map<string, { prior: number; current: number }>(
    flagshipComparisons.map(([evidenceId, , priorValue, currentValue]) => [
      String(evidenceId),
      { prior: Number(priorValue), current: Number(currentValue) },
    ]),
  );

  for (const page of searchPages) {
    const contextLabel = shortLabelFor(page.key);
    const dimensions = { pagePath: page.path };
    const add = (
      metricStableKey: string,
      sourceKey: string,
      suffix: string,
      prior: number,
      current: number,
    ) => {
      const reusedId = page.key === 'AC-REPAIR' ? AC_REPAIR_REUSED[metricStableKey] : undefined;
      const flagship = reusedId ? flagshipByEvidenceId.get(reusedId) : undefined;
      observations.push({
        evidenceId: reusedId ?? `EV-PAGE-${page.key}-${suffix}`,
        priorEvidenceId: reusedId ? `${reusedId}-PRIOR` : `EV-PAGE-${page.key}-${suffix}-PRIOR`,
        metricStableKey,
        sourceKey,
        dimensions,
        contextLabel,
        // Where a flagship record already exists, its published values win outright.
        prior: flagship?.prior ?? prior,
        current: flagship?.current ?? current,
        reused: Boolean(reusedId),
      });
    };

    add('gsc.clicks', 'gsc', 'CLICKS', page.priorClicks, page.currentClicks);
    add('gsc.impressions', 'gsc', 'IMPRESSIONS', page.priorImpressions, page.currentImpressions);
    add(
      'gsc.ctr',
      'gsc',
      'CTR',
      rate(page.priorClicks, page.priorImpressions),
      rate(page.currentClicks, page.currentImpressions),
    );
    add('gsc.average_position', 'gsc', 'POSITION', page.priorPosition, page.currentPosition);
    add('ga4.sessions', 'ga4', 'SESSIONS', page.priorSessions, page.currentSessions);
    add('ga4.confirmed_bookings', 'ga4', 'BOOKINGS', page.priorBookings, page.currentBookings);
    add(
      'ga4.page_booking_rate',
      'ga4',
      'BOOKINGRATE',
      rate(page.priorBookings, page.priorSessions),
      rate(page.currentBookings, page.currentSessions),
    );
  }

  for (const query of searchQueries) {
    const dimensions = { query: query.query };
    const contextLabel = `“${query.query}”`;
    const add = (metricStableKey: string, suffix: string, prior: number, current: number) => {
      observations.push({
        evidenceId: `EV-QUERY-${query.key}-${suffix}`,
        priorEvidenceId: `EV-QUERY-${query.key}-${suffix}-PRIOR`,
        metricStableKey,
        sourceKey: 'gsc',
        dimensions,
        contextLabel,
        prior,
        current,
        reused: false,
      });
    };

    add('gsc.clicks', 'CLICKS', query.priorClicks, query.currentClicks);
    add('gsc.impressions', 'IMPRESSIONS', query.priorImpressions, query.currentImpressions);
    add(
      'gsc.ctr',
      'CTR',
      rate(query.priorClicks, query.priorImpressions),
      rate(query.currentClicks, query.currentImpressions),
    );
    add('gsc.average_position', 'POSITION', query.priorPosition, query.currentPosition);
  }

  return observations;
}

function comparedMetric(
  observation: SearchObservation,
  definitions: Map<string, MetricDefinition>,
): DemoComparedMetric {
  const definition = definitions.get(observation.metricStableKey)!;
  const comparison = compareMetricPeriods({
    definition,
    current: {
      evidenceId: observation.evidenceId,
      sourceMode: sourceMode(observation.sourceKey),
      value: observation.current,
      qualityStatus: 'COMPLETE',
      qualityFlags: [],
    },
    prior: {
      evidenceId: observation.priorEvidenceId,
      sourceMode: sourceMode(observation.sourceKey),
      value: observation.prior,
      qualityStatus: 'COMPLETE',
      qualityFlags: [],
    },
  });

  return {
    metricStableKey: observation.metricStableKey,
    label: definition.displayName,
    unit: definition.unit,
    current: observation.current,
    prior: observation.prior,
    evidenceId: observation.evidenceId,
    priorEvidenceId: observation.priorEvidenceId,
    changeAbsolute: comparison.absoluteChange ?? 0,
    changePercent: comparison.percentageChange,
    display: comparison.display.change,
    lowerIsBetter: definition.lowerIsBetter,
  };
}

function buildSearchWorkspace(
  definitions: Map<string, MetricDefinition>,
  observations: SearchObservation[],
): DemoSearchWorkspace {
  const byPage = new Map<string, SearchObservation[]>();
  const byQuery = new Map<string, SearchObservation[]>();
  const pathToKey = new Map(searchPages.map((page) => [page.path, page.key]));
  const queryToKey = new Map(searchQueries.map((query) => [query.query, query.key]));

  for (const observation of observations) {
    const pagePath = observation.dimensions.pagePath;
    const queryText = observation.dimensions.query;
    if (pagePath) {
      const key = pathToKey.get(pagePath)!;
      byPage.set(key, [...(byPage.get(key) ?? []), observation]);
    } else if (queryText) {
      const key = queryToKey.get(queryText)!;
      byQuery.set(key, [...(byQuery.get(key) ?? []), observation]);
    }
  }

  const pages = searchPages.map((page) => ({
    key: page.key,
    path: page.path,
    shortLabel: shortLabelFor(page.key),
    title: page.title,
    metaDescription: page.metaDescription,
    serviceLine: page.serviceLine,
    metrics: (byPage.get(page.key) ?? []).map((observation) =>
      comparedMetric(observation, definitions),
    ),
    monthlyClicks:
      pageMonthlyClicks[page.key]?.map(([period, value]) => ({
        period,
        value,
        evidenceId: `EV-PAGEMONTH-${page.key}-${period.replace('-', '')}`,
      })) ?? null,
  }));

  const queryRows = searchQueries.map((query) => ({
    key: query.key,
    query: query.query,
    intent: query.intent,
    branded: query.branded,
    landingPageKey: query.landingPageKey,
    landingPagePath: searchPages.find(({ key }) => key === query.landingPageKey)!.path,
    metrics: (byQuery.get(query.key) ?? []).map((observation) =>
      comparedMetric(observation, definitions),
    ),
  }));

  const propertyClicks = flagshipComparisons.find(([id]) => id === 'EV-108')![3] as number;
  const propertyImpressions = flagshipComparisons.find(([id]) => id === 'EV-107')![3] as number;
  const pageClicks = searchPages.reduce((total, page) => total + page.currentClicks, 0);
  const pageImpressions = searchPages.reduce((total, page) => total + page.currentImpressions, 0);
  const queryClicks = searchQueries.reduce((total, query) => total + query.currentClicks, 0);
  const queryImpressions = searchQueries.reduce(
    (total, query) => total + query.currentImpressions,
    0,
  );

  return {
    pages,
    queries: queryRows,
    coverage: {
      propertyClicks,
      propertyImpressions,
      pageClicks,
      pageImpressions,
      queryClicks,
      queryImpressions,
      pageClickCoveragePercent: rate(pageClicks, propertyClicks),
      queryClickCoveragePercent: rate(queryClicks, propertyClicks),
      note: 'Search Console withholds anonymised queries and thresholds low-volume rows, so page and query totals do not sum to the property total. The shortfall is expected behaviour from the source, not missing ReachOps data.',
    },
  };
}

function buildReviews(): DemoReview[] {
  return reviewFixtures.map(({ id, date, rating, excerpt, theme, responseState }) => ({
    id,
    date,
    rating,
    excerpt,
    theme,
    responseState,
    documented: responseState !== HISTORICAL_REVIEW_STATE,
  }));
}

export function buildDemoSnapshot(): DemoSnapshot {
  const definitions = definitionMap();
  const weekly = weeklyFixtures();
  const monthly = monthlyFixtures();

  const comparisons = new Map<string, MetricComparison>(
    weekly.map((fixture) => [fixture.evidenceId, comparisonFor(fixture, definitions)]),
  );

  const ruleInputs: Record<string, MetricComparison> = {};
  for (const fixture of weekly) {
    const inputKey = INPUT_KEY_BY_EVIDENCE_ID[fixture.evidenceId];
    if (inputKey) ruleInputs[inputKey] = comparisons.get(fixture.evidenceId)!;
  }

  const themeCount = schedulingThemeCount();
  const window = {
    start: isoOf(DEMO_FROZEN_WEEK_START),
    end: isoOf(DEMO_FROZEN_WEEK_END),
    timezone: WORKSPACE_TIMEZONE,
  };

  const generation = generateObservationCandidates({
    window,
    comparisons: ruleInputs,
    schedulingTheme: {
      theme: 'Scheduling communication',
      count: themeCount,
      minimumCount: SCHEDULING_THEME_MINIMUM,
      qualityStatus: 'COMPLETE',
      qualityFlags: [],
    },
  });

  const recommendations = buildRecommendations(generation.candidates);
  const actions = buildActions(generation.candidates);

  return DemoSnapshotSchema.parse({
    snapshotVersion: 1,
    datasetVersion: DEMO_DATASET_VERSION,
    workspaceSlug: DEMO_WORKSPACE_SLUG,
    generatedFromFixtures: true,
    overview: buildOverview(definitions, weekly, monthly, comparisons),
    weeklyReview: {
      window,
      ruleVersion: OBSERVATION_RULE_VERSION,
      observations: generation.candidates,
      evaluations: generation.evaluations,
      recommendations,
      reviewThemes: [
        {
          theme: 'Scheduling communication',
          count: themeCount,
          minimumCount: SCHEDULING_THEME_MINIMUM,
          meetsThreshold: themeCount >= SCHEDULING_THEME_MINIMUM,
        },
      ],
    },
    actions,
    connections: buildConnections(monthly, weekly),
    activity: buildActivity(generation.candidates, recommendations, actions),
    reviews: buildReviews(),
    evidence: buildEvidenceRecords(definitions, weekly, monthly, comparisons),
  });
}

/** Builds the search workspace and the evidence only its rows cite. */
export function buildSearchSnapshot(): DemoSearchSnapshot {
  const definitions = definitionMap();
  const observations = searchObservations();

  return DemoSearchSnapshotSchema.parse({
    snapshotVersion: 1,
    datasetVersion: DEMO_DATASET_VERSION,
    search: buildSearchWorkspace(definitions, observations),
    evidence: buildSearchEvidenceRecords(definitions, observations),
  });
}
