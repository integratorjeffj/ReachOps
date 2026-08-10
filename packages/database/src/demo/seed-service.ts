import { createHash } from 'node:crypto';
import { SimulatedGbpAdapter } from '@reachops/integrations';
import type { Prisma, PrismaClient } from '@prisma/client';
import {
  actionFixtures,
  annotations,
  campaigns,
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
  people,
  reviewFixtures,
  serviceActors,
  sources,
} from './fixtures';
import { persistNormalizedBatch } from '../ingestion/persist-normalized-batch';

const DEMO_DATASET_ID = 'demo-dataset-summit-and-sage-v1';
const DEMO_GBP_ADAPTER_SYNC_RUN_ID = 'demo-sync-adapter-gbp-rch009';
const WORKSPACE_DIMENSIONS = { scope: 'workspace' };
const AC_REPAIR_DIMENSIONS = { pagePath: '/air-conditioning/repair' };
const PRIOR_WEEK_START = new Date('2026-07-20T06:00:00.000Z');
const PRIOR_WEEK_END = new Date('2026-07-27T05:59:59.999Z');

interface ObservationFixture {
  id: string;
  evidenceId: string;
  connectionId: string;
  resourceId: string;
  metricDefinitionId: string;
  syncRunId: string;
  mode: 'LIVE' | 'SIMULATED' | 'IMPORTED';
  grain: 'DAY' | 'WEEK' | 'MONTH';
  periodStart: Date;
  periodEnd: Date;
  timezone: string;
  dimensions: Prisma.InputJsonValue;
  dimensionHash: string;
  value: number;
  retrievedAt: Date;
  qualityStatus: 'COMPLETE' | 'PARTIAL' | 'STALE' | 'INVALID';
  qualityFlags: string[];
  coverageNote: string | null;
}

export interface DemoSeedSummary {
  workspaceId: string;
  workspaceSlug: string;
  datasetVersion: string;
  frozenWeekStart: Date;
  frozenWeekEnd: Date;
  membershipCount: number;
  connectionCount: number;
  campaignCount: number;
  annotationCount: number;
  metricDefinitionCount: number;
  observationCount: number;
  persistedReviewCount: number;
  reviewFixtureCount: number;
  actionFixtureCount: number;
}

export class DemoResetScopeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DemoResetScopeError';
  }
}

function metricId(stableKey: string): string {
  return `demo-metric-${stableKey.replaceAll('.', '-')}`;
}

function syncRunId(sourceKey: string): string {
  return `demo-sync-seed-${sourceKey}-${DEMO_DATASET_VERSION}`;
}

function dimensionHash(dimensions: Prisma.InputJsonValue): string {
  return `sha256:${createHash('sha256').update(JSON.stringify(dimensions)).digest('hex')}`;
}

function getSource(sourceKey: string) {
  const source = sources.find(({ key }) => key === sourceKey);
  if (!source) {
    throw new Error(`Unknown Summit & Sage source fixture: ${sourceKey}`);
  }
  return source;
}

function nextMonth(month: string): string {
  const [yearText, monthText] = month.split('-');
  const year = Number(yearText);
  const monthNumber = Number(monthText);
  const next = monthNumber === 12 ? [year + 1, 1] : [year, monthNumber + 1];
  return `${next[0]}-${String(next[1]).padStart(2, '0')}`;
}

function denverOffsetAtMonthStart(month: string): '-06:00' | '-07:00' {
  return ['2025-12', '2026-01', '2026-02', '2026-03'].includes(month) ? '-07:00' : '-06:00';
}

function monthlyPeriod(month: string): { start: Date; end: Date } {
  const followingMonth = nextMonth(month);
  const start = new Date(`${month}-01T00:00:00${denverOffsetAtMonthStart(month)}`);
  const nextStart = new Date(
    `${followingMonth}-01T00:00:00${denverOffsetAtMonthStart(followingMonth)}`,
  );
  return { start, end: new Date(nextStart.getTime() - 1) };
}

function observationId(evidenceId: string): string {
  return `demo-observation-${evidenceId.toLowerCase()}`;
}

function buildObservationFixtures(): ObservationFixture[] {
  const observations: ObservationFixture[] = [];
  const monthlyMetrics = [
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

  for (const row of monthlyBaseline) {
    const [month, ...values] = row;
    const period = monthlyPeriod(month);

    monthlyMetrics.forEach(([stableKey, sourceKey], index) => {
      const source = getSource(sourceKey);
      const evidenceMetricKey = stableKey.replace(/[^a-zA-Z0-9]+/g, '-').toUpperCase();
      const evidenceId = `EV-MONTHLY-${month}-${evidenceMetricKey}`;
      observations.push({
        id: observationId(evidenceId),
        evidenceId,
        connectionId: source.connectionId,
        resourceId: source.resourceId,
        metricDefinitionId: metricId(stableKey),
        syncRunId: syncRunId(source.key),
        mode: source.mode,
        grain: 'MONTH',
        periodStart: period.start,
        periodEnd: period.end,
        timezone: 'America/Denver',
        dimensions: WORKSPACE_DIMENSIONS,
        dimensionHash: dimensionHash(WORKSPACE_DIMENSIONS),
        value: values[index]!,
        retrievedAt: DEMO_RETRIEVED_AT,
        qualityStatus: 'COMPLETE',
        qualityFlags: [],
        coverageNote: null,
      });
    });
  }

  for (const [
    evidenceId,
    stableKey,
    priorValue,
    currentValue,
    sourceKey,
    scope,
  ] of flagshipComparisons) {
    const source = getSource(sourceKey);
    const dimensions = scope === 'ac-repair-page' ? AC_REPAIR_DIMENSIONS : WORKSPACE_DIMENSIONS;
    const shared = {
      connectionId: source.connectionId,
      resourceId: source.resourceId,
      metricDefinitionId: metricId(stableKey),
      syncRunId: syncRunId(source.key),
      mode: source.mode,
      grain: 'WEEK' as const,
      timezone: 'America/Denver',
      dimensions,
      dimensionHash: dimensionHash(dimensions),
      retrievedAt: DEMO_RETRIEVED_AT,
      qualityStatus: 'COMPLETE' as const,
      qualityFlags: [],
      coverageNote: null,
    };

    observations.push(
      {
        id: observationId(`${evidenceId}-PRIOR`),
        evidenceId: `${evidenceId}-PRIOR`,
        ...shared,
        periodStart: PRIOR_WEEK_START,
        periodEnd: PRIOR_WEEK_END,
        value: priorValue,
      },
      {
        id: observationId(evidenceId),
        evidenceId,
        ...shared,
        periodStart: DEMO_FROZEN_WEEK_START,
        periodEnd: DEMO_FROZEN_WEEK_END,
        value: currentValue,
      },
    );
  }

  return observations;
}

const observationFixtures = buildObservationFixtures();

async function readSummary(prisma: PrismaClient): Promise<DemoSeedSummary> {
  const dataset = await prisma.demoDataset.findUniqueOrThrow({
    where: { workspaceId: DEMO_WORKSPACE_ID },
  });
  const [
    membershipCount,
    connectionCount,
    campaignCount,
    annotationCount,
    metricDefinitionCount,
    observationCount,
    persistedReviewCount,
  ] = await Promise.all([
    prisma.membership.count({ where: { workspaceId: DEMO_WORKSPACE_ID } }),
    prisma.dataSourceConnection.count({ where: { workspaceId: DEMO_WORKSPACE_ID } }),
    prisma.campaign.count({ where: { workspaceId: DEMO_WORKSPACE_ID } }),
    prisma.businessAnnotation.count({ where: { workspaceId: DEMO_WORKSPACE_ID } }),
    prisma.metricDefinition.count({ where: { workspaceId: DEMO_WORKSPACE_ID } }),
    prisma.metricObservation.count({ where: { workspaceId: DEMO_WORKSPACE_ID } }),
    prisma.contentItem.count({
      where: {
        workspaceId: DEMO_WORKSPACE_ID,
        resourceId: 'demo-resource-simulated-gbp',
        type: 'REVIEW',
      },
    }),
  ]);

  return {
    workspaceId: DEMO_WORKSPACE_ID,
    workspaceSlug: DEMO_WORKSPACE_SLUG,
    datasetVersion: dataset.version,
    frozenWeekStart: dataset.frozenWeekStart,
    frozenWeekEnd: dataset.frozenWeekEnd,
    membershipCount,
    connectionCount,
    campaignCount,
    annotationCount,
    metricDefinitionCount,
    observationCount,
    persistedReviewCount,
    reviewFixtureCount: reviewFixtures.length,
    actionFixtureCount: actionFixtures.length,
  };
}

export async function seedSummitAndSage(prisma: PrismaClient): Promise<DemoSeedSummary> {
  const existingWorkspace = await prisma.workspace.findUnique({
    where: { slug: DEMO_WORKSPACE_SLUG },
    select: { id: true },
  });
  if (existingWorkspace && existingWorkspace.id !== DEMO_WORKSPACE_ID) {
    throw new DemoResetScopeError(
      `Refusing to seed slug ${DEMO_WORKSPACE_SLUG} because it is not the stable synthetic workspace ID.`,
    );
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.workspace.upsert({
        where: { id: DEMO_WORKSPACE_ID },
        create: {
          id: DEMO_WORKSPACE_ID,
          slug: DEMO_WORKSPACE_SLUG,
          name: 'Summit & Sage Home Services',
          timezone: 'America/Denver',
        },
        update: {
          slug: DEMO_WORKSPACE_SLUG,
          name: 'Summit & Sage Home Services',
          timezone: 'America/Denver',
        },
      });

      for (const person of [...people, ...serviceActors]) {
        await tx.user.upsert({
          where: { id: person.id },
          create: {
            id: person.id,
            email: person.email,
            displayName: person.displayName,
          },
          update: { email: person.email, displayName: person.displayName },
        });
      }

      for (const person of people) {
        await tx.membership.upsert({
          where: {
            workspaceId_userId: { workspaceId: DEMO_WORKSPACE_ID, userId: person.id },
          },
          create: {
            id: `demo-membership-${person.id.replace('demo-user-', '')}`,
            workspaceId: DEMO_WORKSPACE_ID,
            userId: person.id,
            role: person.role,
          },
          update: { role: person.role },
        });
      }

      for (const goal of goals) {
        await tx.businessGoal.upsert({
          where: {
            workspaceId_stableKey: { workspaceId: DEMO_WORKSPACE_ID, stableKey: goal.stableKey },
          },
          create: { ...goal, workspaceId: DEMO_WORKSPACE_ID },
          update: {
            title: goal.title,
            description: goal.description,
            status: 'ACTIVE',
            targetValue: goal.targetValue,
            targetUnit: goal.targetUnit,
            targetDate: goal.targetDate,
          },
        });
      }

      for (const campaign of campaigns) {
        await tx.campaign.upsert({
          where: {
            workspaceId_stableKey: {
              workspaceId: DEMO_WORKSPACE_ID,
              stableKey: campaign.stableKey,
            },
          },
          create: { ...campaign, workspaceId: DEMO_WORKSPACE_ID },
          update: {
            goalId: campaign.goalId,
            name: campaign.name,
            channel: campaign.channel,
            status: campaign.status,
            startsAt: campaign.startsAt,
            endsAt: campaign.endsAt,
            description: campaign.description,
          },
        });
      }

      for (const source of sources) {
        await tx.dataSourceConnection.upsert({
          where: { id: source.connectionId },
          create: {
            id: source.connectionId,
            workspaceId: DEMO_WORKSPACE_ID,
            provider: source.provider,
            mode: source.mode,
            status: 'CONNECTED',
            displayName: source.displayName,
            selectedResourceId: source.nativeId,
            scopes: [...source.scopes],
            lastSuccessAt: DEMO_RETRIEVED_AT,
          },
          update: {
            provider: source.provider,
            mode: source.mode,
            status: 'CONNECTED',
            displayName: source.displayName,
            selectedResourceId: source.nativeId,
            scopes: [...source.scopes],
            lastSuccessAt: DEMO_RETRIEVED_AT,
          },
        });
        await tx.sourceResource.upsert({
          where: { id: source.resourceId },
          create: {
            id: source.resourceId,
            workspaceId: DEMO_WORKSPACE_ID,
            connectionId: source.connectionId,
            nativeId: source.nativeId,
            resourceType: source.resourceType,
            displayName: source.displayName,
            mode: source.mode,
            metadata: { synthetic: true, datasetVersion: DEMO_DATASET_VERSION },
            lastSyncedAt: DEMO_RETRIEVED_AT,
          },
          update: {
            nativeId: source.nativeId,
            resourceType: source.resourceType,
            displayName: source.displayName,
            mode: source.mode,
            metadata: { synthetic: true, datasetVersion: DEMO_DATASET_VERSION },
            lastSyncedAt: DEMO_RETRIEVED_AT,
          },
        });
      }

      const gbpSource = getSource('gbp');
      await tx.syncRun.upsert({
        where: { id: DEMO_GBP_ADAPTER_SYNC_RUN_ID },
        create: {
          id: DEMO_GBP_ADAPTER_SYNC_RUN_ID,
          workspaceId: DEMO_WORKSPACE_ID,
          connectionId: gbpSource.connectionId,
          resourceId: gbpSource.resourceId,
          mode: gbpSource.mode,
          status: 'RUNNING',
          idempotencyKey: `${DEMO_DATASET_VERSION}:gbp:adapter`,
          correlationId: `demo-seed:${DEMO_DATASET_VERSION}`,
          windowStart: DEMO_FROZEN_WEEK_START,
          windowEnd: DEMO_FROZEN_WEEK_END,
          requestedAt: DEMO_RETRIEVED_AT,
          startedAt: DEMO_RETRIEVED_AT,
          warnings: [],
        },
        update: {
          status: 'RUNNING',
          startedAt: DEMO_RETRIEVED_AT,
          completedAt: null,
          insertedCount: 0,
          updatedCount: 0,
          skippedCount: 0,
          errorCode: null,
          errorSummary: null,
          warnings: [],
        },
      });

      for (const definition of metricDefinitions) {
        const [
          stableKey,
          provider,
          nativeName,
          displayName,
          family,
          unit,
          aggregationBehavior,
          lowerIsBetter,
        ] = definition;
        await tx.metricDefinition.upsert({
          where: { workspaceId_stableKey: { workspaceId: DEMO_WORKSPACE_ID, stableKey } },
          create: {
            id: metricId(stableKey),
            workspaceId: DEMO_WORKSPACE_ID,
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
          update: {
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
        });
      }

      const observationCounts = new Map<string, number>();
      for (const observation of observationFixtures) {
        observationCounts.set(
          observation.connectionId,
          (observationCounts.get(observation.connectionId) ?? 0) + 1,
        );
      }

      for (const source of sources) {
        await tx.syncRun.upsert({
          where: { id: syncRunId(source.key) },
          create: {
            id: syncRunId(source.key),
            workspaceId: DEMO_WORKSPACE_ID,
            connectionId: source.connectionId,
            resourceId: source.resourceId,
            mode: source.mode,
            status: 'SUCCEEDED',
            idempotencyKey: `${DEMO_DATASET_VERSION}:${source.key}:baseline`,
            correlationId: `demo-seed:${DEMO_DATASET_VERSION}`,
            windowStart: new Date('2025-07-01T06:00:00.000Z'),
            windowEnd: DEMO_FROZEN_WEEK_END,
            requestedAt: DEMO_RETRIEVED_AT,
            startedAt: DEMO_RETRIEVED_AT,
            completedAt: DEMO_RETRIEVED_AT,
            insertedCount: observationCounts.get(source.connectionId) ?? 0,
            warnings: [],
          },
          update: {
            mode: source.mode,
            status: 'SUCCEEDED',
            windowStart: new Date('2025-07-01T06:00:00.000Z'),
            windowEnd: DEMO_FROZEN_WEEK_END,
            completedAt: DEMO_RETRIEVED_AT,
            insertedCount: observationCounts.get(source.connectionId) ?? 0,
            updatedCount: 0,
            skippedCount: 0,
            errorCode: null,
            errorSummary: null,
            warnings: [],
          },
        });
      }

      for (const observation of observationFixtures) {
        const identity = {
          workspaceId: DEMO_WORKSPACE_ID,
          connectionId: observation.connectionId,
          resourceId: observation.resourceId,
          metricDefinitionId: observation.metricDefinitionId,
          grain: observation.grain,
          periodStart: observation.periodStart,
          dimensionHash: observation.dimensionHash,
        };
        await tx.metricObservation.upsert({
          where: { observationIdentity: identity },
          create: { ...observation, workspaceId: DEMO_WORKSPACE_ID },
          update: {
            evidenceId: observation.evidenceId,
            syncRunId: observation.syncRunId,
            mode: observation.mode,
            periodEnd: observation.periodEnd,
            timezone: observation.timezone,
            dimensions: observation.dimensions,
            value: observation.value,
            retrievedAt: observation.retrievedAt,
            qualityStatus: observation.qualityStatus,
            qualityFlags: observation.qualityFlags,
            coverageNote: observation.coverageNote,
          },
        });
      }

      for (const annotation of annotations) {
        await tx.businessAnnotation.upsert({
          where: {
            workspaceId_stableKey: {
              workspaceId: DEMO_WORKSPACE_ID,
              stableKey: annotation.stableKey,
            },
          },
          create: { ...annotation, workspaceId: DEMO_WORKSPACE_ID },
          update: {
            campaignId: annotation.campaignId,
            type: annotation.type,
            title: annotation.title,
            description: annotation.description,
            startsAt: annotation.startsAt,
            endsAt: annotation.endsAt,
          },
        });
      }

      await tx.demoDataset.upsert({
        where: { workspaceId: DEMO_WORKSPACE_ID },
        create: {
          id: DEMO_DATASET_ID,
          workspaceId: DEMO_WORKSPACE_ID,
          version: DEMO_DATASET_VERSION,
          frozenWeekStart: DEMO_FROZEN_WEEK_START,
          frozenWeekEnd: DEMO_FROZEN_WEEK_END,
          seededAt: DEMO_RETRIEVED_AT,
        },
        update: {
          version: DEMO_DATASET_VERSION,
          frozenWeekStart: DEMO_FROZEN_WEEK_START,
          frozenWeekEnd: DEMO_FROZEN_WEEK_END,
          seededAt: DEMO_RETRIEVED_AT,
        },
      });

      await tx.auditEvent.upsert({
        where: { id: 'demo-audit-dataset-seeded' },
        create: {
          id: 'demo-audit-dataset-seeded',
          workspaceId: DEMO_WORKSPACE_ID,
          actorId: 'demo-actor-system-sync',
          actorType: 'SYSTEM',
          eventType: 'DEMO_DATASET_SEEDED',
          entityType: 'DemoDataset',
          entityId: DEMO_DATASET_ID,
          correlationId: `demo-seed:${DEMO_DATASET_VERSION}`,
          metadata: {
            datasetVersion: DEMO_DATASET_VERSION,
            reviewFixtureCount: reviewFixtures.length,
            actionFixtureCount: actionFixtures.length,
            deferredPersistence: ['reviews:RCH-009', 'actions:RCH-014/RCH-017'],
          },
          createdAt: DEMO_RETRIEVED_AT,
        },
        update: {
          metadata: {
            datasetVersion: DEMO_DATASET_VERSION,
            reviewFixtureCount: reviewFixtures.length,
            actionFixtureCount: actionFixtures.length,
            deferredPersistence: ['reviews:RCH-009', 'actions:RCH-014/RCH-017'],
          },
        },
      });
    },
    { maxWait: 10_000, timeout: 30_000 },
  );

  const gbpSource = getSource('gbp');
  const reviewTuples = reviewFixtures.map(
    ({ id, date, rating, excerpt, theme, responseState }) =>
      [id, date, rating, excerpt, theme, responseState] as const,
  );
  const gbpBatch = await new SimulatedGbpAdapter(reviewTuples).sync({
    resourceNativeId: gbpSource.nativeId,
    windowStart: DEMO_FROZEN_WEEK_START.toISOString(),
    windowEnd: DEMO_FROZEN_WEEK_END.toISOString(),
    timezone: 'America/Denver',
    retrievedAt: DEMO_RETRIEVED_AT.toISOString(),
  });
  await persistNormalizedBatch(
    prisma,
    {
      workspaceId: DEMO_WORKSPACE_ID,
      connectionId: gbpSource.connectionId,
      resourceId: gbpSource.resourceId,
      syncRunId: DEMO_GBP_ADAPTER_SYNC_RUN_ID,
    },
    gbpBatch,
  );
  await prisma.syncRun.update({
    where: { id: syncRunId(gbpSource.key) },
    data: {
      insertedCount:
        observationFixtures.filter(({ connectionId }) => connectionId === gbpSource.connectionId)
          .length - gbpBatch.observations.length,
    },
  });

  return readSummary(prisma);
}

export async function resetSummitAndSage(prisma: PrismaClient): Promise<DemoSeedSummary> {
  const target = await prisma.workspace.findUnique({
    where: { slug: DEMO_WORKSPACE_SLUG },
    include: { demoDataset: true },
  });
  if (!target) {
    return seedSummitAndSage(prisma);
  }
  if (target.id !== DEMO_WORKSPACE_ID) {
    throw new DemoResetScopeError(
      'Refusing reset because the workspace ID is not the stable demo ID.',
    );
  }
  if (
    target.demoDataset?.id !== DEMO_DATASET_ID ||
    target.demoDataset.version !== DEMO_DATASET_VERSION
  ) {
    throw new DemoResetScopeError(
      'Refusing reset because the exact Summit & Sage dataset marker could not be resolved.',
    );
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.auditEvent.deleteMany({
        where: { workspaceId: DEMO_WORKSPACE_ID, id: { in: ['demo-audit-dataset-seeded'] } },
      });
      await tx.metricObservation.deleteMany({
        where: {
          workspaceId: DEMO_WORKSPACE_ID,
          id: { in: observationFixtures.map(({ id }) => id) },
        },
      });
      await tx.contentItem.deleteMany({
        where: {
          workspaceId: DEMO_WORKSPACE_ID,
          resourceId: 'demo-resource-simulated-gbp',
          nativeId: { in: reviewFixtures.map(({ id }) => id) },
        },
      });
      await tx.businessAnnotation.deleteMany({
        where: { workspaceId: DEMO_WORKSPACE_ID, id: { in: annotations.map(({ id }) => id) } },
      });
      await tx.campaign.deleteMany({
        where: { workspaceId: DEMO_WORKSPACE_ID, id: { in: campaigns.map(({ id }) => id) } },
      });
      await tx.businessGoal.deleteMany({
        where: { workspaceId: DEMO_WORKSPACE_ID, id: { in: goals.map(({ id }) => id) } },
      });
      await tx.syncRun.deleteMany({
        where: {
          workspaceId: DEMO_WORKSPACE_ID,
          id: {
            in: [
              ...sources.map(({ key }) => syncRunId(key)),
              DEMO_GBP_ADAPTER_SYNC_RUN_ID,
            ],
          },
        },
      });
      await tx.sourceResource.deleteMany({
        where: {
          workspaceId: DEMO_WORKSPACE_ID,
          id: { in: sources.map(({ resourceId }) => resourceId) },
        },
      });
      await tx.dataSourceConnection.deleteMany({
        where: {
          workspaceId: DEMO_WORKSPACE_ID,
          id: { in: sources.map(({ connectionId }) => connectionId) },
        },
      });
      await tx.metricDefinition.deleteMany({
        where: {
          workspaceId: DEMO_WORKSPACE_ID,
          id: { in: metricDefinitions.map(([stableKey]) => metricId(stableKey)) },
        },
      });
      await tx.membership.deleteMany({
        where: {
          workspaceId: DEMO_WORKSPACE_ID,
          id: {
            in: people.map(({ id }) => `demo-membership-${id.replace('demo-user-', '')}`),
          },
        },
      });
      await tx.demoDataset.delete({ where: { id: DEMO_DATASET_ID } });
      await tx.workspace.update({
        where: { id: DEMO_WORKSPACE_ID },
        data: {
          name: 'Summit & Sage Home Services',
          timezone: 'America/Denver',
        },
      });
    },
    { maxWait: 10_000, timeout: 30_000 },
  );

  return seedSummitAndSage(prisma);
}

export async function getSummitAndSageDatasetInfo(
  prisma: PrismaClient,
): Promise<DemoSeedSummary | null> {
  const dataset = await prisma.demoDataset.findUnique({
    where: { workspaceId: DEMO_WORKSPACE_ID },
    select: { id: true },
  });
  return dataset ? readSummary(prisma) : null;
}
