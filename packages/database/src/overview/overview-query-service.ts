import {
  DataQualityFlagSchema,
  OverviewResponseSchema,
  type OverviewMetricState,
  type OverviewResponse,
} from '@reachops/contracts';
import type { MetricDefinition, MetricObservation, PrismaClient } from '@prisma/client';
import { compareMetricPeriods } from '../metrics/period-comparison';

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
    pagePath: '/air-conditioning/repair',
  },
  {
    key: 'new-review-rating',
    label: 'New-review average rating',
    metric: 'gbp.new_review_average_rating',
    scope: 'workspace',
  },
] as const;

const TREND_METRICS = ['ga4.sessions', 'ga4.confirmed_bookings'] as const;

type ObservationWithDefinition = MetricObservation & { metricDefinition: MetricDefinition };

export class OverviewNotFoundError extends Error {
  constructor() {
    super('Overview workspace was not found for the current actor.');
    this.name = 'OverviewNotFoundError';
  }
}

function metricDefinition(definition: MetricDefinition) {
  return {
    stableKey: definition.stableKey,
    provider: definition.provider,
    nativeName: definition.nativeName,
    displayName: definition.displayName,
    family: definition.family,
    unit: definition.unit,
    aggregationBehavior: definition.aggregationBehavior,
    description: definition.description,
    comparabilityNotes: definition.comparabilityNotes,
    lowerIsBetter: definition.lowerIsBetter,
  };
}

function localDateParts(instant: Date, timezone: string): [number, number, number] {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const read = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value);
  return [read('year'), read('month'), read('day')];
}

function localMidnightUtc(year: number, month: number, day: number, timezone: string): Date {
  const localAsUtc = Date.UTC(year, month - 1, day);
  let candidate = localAsUtc;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const parts = formatter.formatToParts(new Date(candidate));
    const read = (type: Intl.DateTimeFormatPartTypes): number =>
      Number(parts.find((part) => part.type === type)?.value);
    const representedAsUtc = Date.UTC(
      read('year'),
      read('month') - 1,
      read('day'),
      read('hour'),
      read('minute'),
      read('second'),
    );
    candidate -= representedAsUtc - localAsUtc;
  }

  return new Date(candidate);
}

export function currentWorkspaceWeek(now: Date, timezone: string): { start: Date; end: Date } {
  const [year, month, day] = localDateParts(now, timezone);
  const localCalendar = new Date(Date.UTC(year, month - 1, day));
  const daysSinceMonday = (localCalendar.getUTCDay() + 6) % 7;
  localCalendar.setUTCDate(localCalendar.getUTCDate() - daysSinceMonday);
  const start = localMidnightUtc(
    localCalendar.getUTCFullYear(),
    localCalendar.getUTCMonth() + 1,
    localCalendar.getUTCDate(),
    timezone,
  );
  localCalendar.setUTCDate(localCalendar.getUTCDate() + 7);
  const nextStart = localMidnightUtc(
    localCalendar.getUTCFullYear(),
    localCalendar.getUTCMonth() + 1,
    localCalendar.getUTCDate(),
    timezone,
  );
  return { start, end: new Date(nextStart.getTime() - 1) };
}

function dimensionsMatch(
  observation: MetricObservation,
  spec: (typeof KPI_SPECS)[number],
): boolean {
  const dimensions = observation.dimensions as Record<string, unknown>;
  return 'pagePath' in spec
    ? dimensions.pagePath === spec.pagePath
    : dimensions.scope === spec.scope;
}

function overviewValue(observation: ObservationWithDefinition | undefined) {
  return observation
    ? {
        evidenceId: observation.evidenceId,
        value: observation.value.toNumber(),
        retrievedAt: observation.retrievedAt.toISOString(),
        qualityStatus: observation.qualityStatus,
        qualityFlags: observation.qualityFlags,
      }
    : null;
}

function kpiState(
  current: ObservationWithDefinition | undefined,
  prior: ObservationWithDefinition | undefined,
): OverviewMetricState {
  if (!current && !prior) return 'UNAVAILABLE';
  if (!current) return 'MISSING_CURRENT';
  if (!prior) return 'MISSING_PRIOR';
  return current.qualityStatus === 'COMPLETE' && prior.qualityStatus === 'COMPLETE'
    ? 'AVAILABLE'
    : 'PARTIAL';
}

function combinedCoverageNote(
  current: ObservationWithDefinition | undefined,
  prior: ObservationWithDefinition | undefined,
): string | null {
  const notes = [current?.coverageNote, prior?.coverageNote].filter((note): note is string =>
    Boolean(note),
  );
  return notes.length > 0 ? [...new Set(notes)].join(' ') : null;
}

export class OverviewQueryService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async getOverview(input: {
    workspaceSlug: string;
    actorUserId: string;
  }): Promise<OverviewResponse> {
    const membership = await this.prisma.membership.findFirst({
      where: {
        userId: input.actorUserId,
        workspace: { slug: input.workspaceSlug },
      },
      include: { workspace: { include: { demoDataset: true } } },
    });
    if (!membership) throw new OverviewNotFoundError();

    const { workspace } = membership;
    const activeWeek = workspace.demoDataset
      ? {
          start: workspace.demoDataset.frozenWeekStart,
          end: workspace.demoDataset.frozenWeekEnd,
        }
      : currentWorkspaceWeek(this.now(), workspace.timezone);
    const priorWeekStart = currentWorkspaceWeek(
      new Date(activeWeek.start.getTime() - 1),
      workspace.timezone,
    ).start;

    const [goals, connections, definitions, weekly, monthly, annotations] = await Promise.all([
      this.prisma.businessGoal.findMany({
        where: { workspaceId: workspace.id, status: 'ACTIVE' },
        orderBy: { stableKey: 'asc' },
      }),
      this.prisma.dataSourceConnection.findMany({
        where: { workspaceId: workspace.id },
        include: { resources: { orderBy: { displayName: 'asc' } } },
        orderBy: { displayName: 'asc' },
      }),
      this.prisma.metricDefinition.findMany({ where: { workspaceId: workspace.id } }),
      this.prisma.metricObservation.findMany({
        where: {
          workspaceId: workspace.id,
          grain: 'WEEK',
          periodStart: { gte: priorWeekStart, lte: activeWeek.start },
        },
        include: { metricDefinition: true },
      }),
      this.prisma.metricObservation.findMany({
        where: {
          workspaceId: workspace.id,
          grain: 'MONTH',
          periodStart: { lte: activeWeek.end },
        },
        include: { metricDefinition: true },
        orderBy: { periodStart: 'asc' },
      }),
      this.prisma.businessAnnotation.findMany({
        where: { workspaceId: workspace.id, startsAt: { lte: activeWeek.end } },
        orderBy: { startsAt: 'asc' },
      }),
    ]);

    const definitionsByKey = new Map(
      definitions.map((definition) => [definition.stableKey, definition]),
    );
    const kpis = KPI_SPECS.map((spec) => {
      const observations = weekly.filter(
        (observation) =>
          observation.metricDefinition.stableKey === spec.metric &&
          dimensionsMatch(observation, spec),
      );
      const current = observations.find(
        (observation) => observation.periodStart.getTime() === activeWeek.start.getTime(),
      );
      const prior = observations.find(
        (observation) => observation.periodStart.getTime() === priorWeekStart.getTime(),
      );
      const definition = definitionsByKey.get(spec.metric);
      const comparison =
        definition && (current || prior)
          ? compareMetricPeriods({
              definition: metricDefinition(definition),
              current: current
                ? {
                    evidenceId: current.evidenceId,
                    sourceMode: current.mode,
                    value: current.value.toNumber(),
                    qualityStatus: current.qualityStatus,
                    qualityFlags: DataQualityFlagSchema.array().parse(current.qualityFlags),
                  }
                : null,
              prior: prior
                ? {
                    evidenceId: prior.evidenceId,
                    sourceMode: prior.mode,
                    value: prior.value.toNumber(),
                    qualityStatus: prior.qualityStatus,
                    qualityFlags: DataQualityFlagSchema.array().parse(prior.qualityFlags),
                  }
                : null,
            })
          : null;
      const change =
        comparison?.absoluteChange === null || comparison?.absoluteChange === undefined
          ? null
          : {
              absolute: comparison.absoluteChange,
              percentage: comparison.percentageChange,
              percentagePoints: comparison.percentagePointChange,
              direction: comparison.direction as 'UP' | 'DOWN' | 'FLAT',
            };

      return {
        key: spec.key,
        label: spec.label,
        status: kpiState(current, prior),
        definition: definition ? metricDefinition(definition) : null,
        current: overviewValue(current),
        prior: overviewValue(prior),
        change,
        sourceModes: [...new Set(observations.map(({ mode }) => mode))],
        coverageNote: combinedCoverageNote(current, prior),
      };
    });

    const goalMetricByUnit: Record<string, string | undefined> = {
      CONFIRMED_BOOKINGS_PER_MONTH: 'ga4.confirmed_bookings',
      CUMULATIVE_RATING: 'gbp.cumulative_rating',
    };
    const goalResponses = goals.map((goal) => {
      const stableKey = goal.targetUnit ? goalMetricByUnit[goal.targetUnit] : undefined;
      const observation = stableKey
        ? [...monthly].reverse().find((item) => item.metricDefinition.stableKey === stableKey)
        : undefined;
      const targetValue = goal.targetValue?.toNumber() ?? null;
      const currentValue = observation?.value.toNumber() ?? null;
      const isPartial = observation && observation.qualityStatus !== 'COMPLETE';
      return {
        stableKey: goal.stableKey,
        title: goal.title,
        description: goal.description,
        targetValue,
        targetUnit: goal.targetUnit,
        targetDate: goal.targetDate?.toISOString() ?? null,
        status: observation
          ? isPartial
            ? ('PARTIAL' as const)
            : ('AVAILABLE' as const)
          : ('UNAVAILABLE' as const),
        currentValue,
        attainmentPercentage:
          currentValue === null || targetValue === null || targetValue === 0
            ? null
            : (currentValue / targetValue) * 100,
        definition: observation ? metricDefinition(observation.metricDefinition) : null,
        evidenceId: observation?.evidenceId ?? null,
        retrievedAt: observation?.retrievedAt.toISOString() ?? null,
        sourceMode: observation?.mode ?? null,
      };
    });

    const trends = TREND_METRICS.flatMap((stableKey) => {
      const definition = definitionsByKey.get(stableKey);
      if (!definition) return [];
      return [
        {
          metricStableKey: stableKey,
          definition: metricDefinition(definition),
          points: monthly
            .filter(
              (observation) =>
                observation.metricDefinition.stableKey === stableKey &&
                (observation.dimensions as Record<string, unknown>).scope === 'workspace',
            )
            .slice(-13)
            .map((observation) => ({
              periodStart: observation.periodStart.toISOString(),
              periodEnd: observation.periodEnd.toISOString(),
              value: observation.value.toNumber(),
              evidenceId: observation.evidenceId,
              retrievedAt: observation.retrievedAt.toISOString(),
              qualityStatus: observation.qualityStatus,
              sourceMode: observation.mode,
            })),
        },
      ];
    });

    const hasData = weekly.length > 0 || monthly.length > 0;
    const state = !hasData
      ? ('EMPTY' as const)
      : kpis.every(({ status }) => status === 'AVAILABLE') &&
          connections.every(({ status }) => status === 'CONNECTED') &&
          goalResponses.every(({ status }) => status !== 'PARTIAL') &&
          trends.every(({ points }) =>
            points.every(({ qualityStatus }) => qualityStatus === 'COMPLETE'),
          )
        ? ('AVAILABLE' as const)
        : ('PARTIAL' as const);

    return OverviewResponseSchema.parse({
      state,
      workspace: {
        id: workspace.id,
        slug: workspace.slug,
        name: workspace.name,
        timezone: workspace.timezone,
        synthetic: workspace.demoDataset !== null,
        datasetVersion: workspace.demoDataset?.version ?? null,
      },
      activeWeek: {
        start: activeWeek.start.toISOString(),
        end: activeWeek.end.toISOString(),
        timezone: workspace.timezone,
      },
      goals: goalResponses,
      kpis,
      sourceCoverage: connections.map((connection) => ({
        connectionId: connection.id,
        provider: connection.provider,
        displayName: connection.displayName,
        mode: connection.mode,
        status: connection.status,
        resourceName: connection.resources[0]?.displayName ?? null,
        lastSuccessAt: connection.lastSuccessAt?.toISOString() ?? null,
        lastSyncedAt: connection.resources[0]?.lastSyncedAt?.toISOString() ?? null,
      })),
      priorities: [1, 2, 3].map((position) => ({ position, status: 'PENDING_ANALYSIS' as const })),
      trends,
      annotations: annotations.map((annotation) => ({
        stableKey: annotation.stableKey,
        type: annotation.type,
        title: annotation.title,
        description: annotation.description,
        startsAt: annotation.startsAt.toISOString(),
        endsAt: annotation.endsAt?.toISOString() ?? null,
      })),
    });
  }
}
