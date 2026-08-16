import {
  DemoSnapshotSchema,
  type DemoAction,
  type DemoActivityEvent,
  type DemoConnection,
  type DemoRecommendation,
  type DemoReview,
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
import { monthlyPeriod } from './periods';

/**
 * Builds the published demonstration snapshot from the committed Summit & Sage fixtures.
 *
 * This module performs no database access. It reuses the same deterministic comparison and
 * observation services the API depends on, so the static demonstration and the running
 * application derive their numbers from one implementation rather than two.
 */

const WORKSPACE_NAME = 'Summit & Sage Home Services';
const WORKSPACE_TIMEZONE = 'America/Denver';
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

const TREND_METRICS = ['ga4.sessions', 'ga4.confirmed_bookings'] as const;

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

const RECOMMENDATION_PLAN: Record<
  string,
  { title: string; rationale: string; actionId: string | null }
> = {
  'ac-repair-demand-conversion-divergence': {
    title: 'Investigate the AC repair mobile booking flow',
    rationale:
      'Sessions on the AC repair page rose while confirmed bookings and booking rate fell. A mobile booking-form layout change was deployed inside the same window; that is context, not proof of causation.',
    actionId: 'ACT-058',
  },
  'local-profile-cross-source-divergence': {
    title: 'Compare local-profile reporting before acting',
    rationale:
      'Organic sessions rose while profile views, website clicks, and call clicks fell. Cross-source divergence can reflect differing source definitions, so no action is proposed until the definitions are reconciled.',
    actionId: null,
  },
  'new-review-scheduling-theme': {
    title: 'Review the scheduling theme with Customer Care',
    rationale:
      'The average rating of new reviews declined and three permitted excerpts share a scheduling theme. ReachOps never drafts or sends a review response automatically.',
    actionId: 'ACT-059',
  },
  'search-visibility-opportunity': {
    title: 'Monitor organic search growth for one more week',
    rationale:
      'Impressions, clicks, click-through rate, and average position all improved together. One week is insufficient to treat the gain as durable.',
    actionId: 'ACT-060',
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
  const match = /(?:due|review)\s+(\d{4}-\d{2}-\d{2})/i.exec(note);
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
        observationCount: monthlyForSource.length + weeklyForSource.length * 2,
        metricKeys,
        liveCapable: source.provider === 'GA4' || source.provider === 'SEARCH_CONSOLE',
        authorizationNote: notes.note,
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
  });
}
