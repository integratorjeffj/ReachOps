import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  actionFixtures,
  DEMO_DATASET_VERSION,
  DEMO_FROZEN_WEEK_END,
  DEMO_FROZEN_WEEK_START,
  DEMO_WORKSPACE_ID,
  DEMO_WORKSPACE_SLUG,
  reviewFixtures,
} from '../src/demo/fixtures';
import {
  DemoResetScopeError,
  getSummitAndSageDatasetInfo,
  resetSummitAndSage,
  seedSummitAndSage,
} from '../src/demo/seed-service';
import {
  OverviewNotFoundError,
  OverviewQueryService,
} from '../src/overview/overview-query-service';

const databaseUrl = process.env.DATABASE_URL;
const describeDatabase = databaseUrl ? describe.sequential : describe.skip;

describeDatabase('RCH-008 Summit & Sage seed and reset', () => {
  const prisma = new PrismaClient();
  const sentinelWorkspaceId = `rch008-sentinel-${randomUUID()}`;
  const liveConnectionId = `rch008-live-connection-${randomUUID()}`;

  beforeAll(async () => {
    await seedSummitAndSage(prisma);
    await prisma.workspace.upsert({
      where: { id: sentinelWorkspaceId },
      create: {
        id: sentinelWorkspaceId,
        slug: sentinelWorkspaceId,
        name: 'RCH-008 reset sentinel',
        timezone: 'UTC',
      },
      update: {},
    });
  });

  afterAll(async () => {
    await prisma.dataSourceConnection.deleteMany({ where: { id: liveConnectionId } });
    await prisma.workspace.deleteMany({ where: { id: sentinelWorkspaceId } });
    await prisma.$disconnect();
  });

  it('is idempotent and exposes the versioned frozen reporting window', async () => {
    const first = await seedSummitAndSage(prisma);
    const second = await seedSummitAndSage(prisma);
    const info = await getSummitAndSageDatasetInfo(prisma);

    expect(second).toEqual(first);
    expect(info).toMatchObject({
      workspaceId: DEMO_WORKSPACE_ID,
      workspaceSlug: DEMO_WORKSPACE_SLUG,
      datasetVersion: DEMO_DATASET_VERSION,
      frozenWeekStart: DEMO_FROZEN_WEEK_START,
      frozenWeekEnd: DEMO_FROZEN_WEEK_END,
      membershipCount: 4,
      connectionCount: 5,
      campaignCount: 5,
      annotationCount: 3,
      metricDefinitionCount: 29,
      observationCount: 175,
      persistedReviewCount: 36,
      reviewFixtureCount: 36,
      actionFixtureCount: 7,
    });

    expect(await prisma.businessGoal.count({ where: { workspaceId: DEMO_WORKSPACE_ID } })).toBe(4);
    expect(
      await prisma.metricObservation.count({ where: { workspaceId: DEMO_WORKSPACE_ID } }),
    ).toBe(175);

    const overview = await new OverviewQueryService(prisma).getOverview({
      workspaceSlug: DEMO_WORKSPACE_SLUG,
      actorUserId: 'demo-user-maya-chen',
    });
    expect(overview).toMatchObject({
      state: 'AVAILABLE',
      workspace: {
        id: DEMO_WORKSPACE_ID,
        timezone: 'America/Denver',
        synthetic: true,
        datasetVersion: DEMO_DATASET_VERSION,
      },
      activeWeek: {
        start: DEMO_FROZEN_WEEK_START.toISOString(),
        end: DEMO_FROZEN_WEEK_END.toISOString(),
        timezone: 'America/Denver',
      },
    });
    expect(overview.kpis.map(({ current }) => current?.value)).toEqual([10440, 246, 3.92, 4.42]);
    expect(overview.kpis.map(({ prior }) => prior?.value)).toEqual([9480, 241, 6.1, 4.65]);
    expect(overview.trends.every(({ points }) => points.length === 13)).toBe(true);
    expect(overview.sourceCoverage.map(({ mode }) => mode)).toEqual(
      expect.arrayContaining(['SIMULATED', 'IMPORTED']),
    );
  });

  it('enforces tenant membership without revealing whether another workspace exists', async () => {
    await expect(
      new OverviewQueryService(prisma).getOverview({
        workspaceSlug: DEMO_WORKSPACE_SLUG,
        actorUserId: 'rch010-non-member',
      }),
    ).rejects.toBeInstanceOf(OverviewNotFoundError);
  });

  it('reports partial quality explicitly instead of converting it to a complete KPI', async () => {
    await prisma.metricObservation.update({
      where: {
        workspaceId_evidenceId: { workspaceId: DEMO_WORKSPACE_ID, evidenceId: 'EV-101' },
      },
      data: {
        qualityStatus: 'PARTIAL',
        qualityFlags: ['PARTIAL_SYNC'],
        coverageNote: 'Current week is missing late-arriving sessions.',
      },
    });

    const overview = await new OverviewQueryService(prisma).getOverview({
      workspaceSlug: DEMO_WORKSPACE_SLUG,
      actorUserId: 'demo-user-maya-chen',
    });
    expect(overview.state).toBe('PARTIAL');
    expect(overview.kpis[0]).toMatchObject({
      status: 'PARTIAL',
      coverageNote: 'Current week is missing late-arriving sessions.',
      current: { qualityStatus: 'PARTIAL', qualityFlags: ['PARTIAL_SYNC'] },
    });

    await seedSummitAndSage(prisma);
  });

  it('reproduces the 13-month baseline and exact flagship evidence values', async () => {
    const evidence = await prisma.metricObservation.findMany({
      where: {
        workspaceId: DEMO_WORKSPACE_ID,
        evidenceId: {
          in: [
            'EV-MONTHLY-2025-07-GA4-SESSIONS',
            'EV-MONTHLY-2026-07-GA4-SESSIONS',
            'EV-104-PRIOR',
            'EV-104',
            'EV-105-PRIOR',
            'EV-105',
            'EV-106-PRIOR',
            'EV-106',
          ],
        },
      },
      orderBy: { evidenceId: 'asc' },
    });
    const values = Object.fromEntries(
      evidence.map(({ evidenceId, value }) => [evidenceId, value.toNumber()]),
    );

    expect(values).toMatchObject({
      'EV-MONTHLY-2025-07-GA4-SESSIONS': 31800,
      'EV-MONTHLY-2026-07-GA4-SESSIONS': 42300,
      'EV-104-PRIOR': 1148,
      'EV-104': 1505,
      'EV-105-PRIOR': 70,
      'EV-105': 59,
      'EV-106-PRIOR': 6.1,
      'EV-106': 3.92,
    });

    const monthlySessions = await prisma.metricObservation.count({
      where: {
        workspaceId: DEMO_WORKSPACE_ID,
        metricDefinitionId: 'demo-metric-ga4-sessions',
        grain: 'MONTH',
      },
    });
    expect(monthlySessions).toBe(13);
  });

  it('keeps the documented review and action catalogs versioned but deferred', () => {
    expect(reviewFixtures).toHaveLength(36);
    expect(reviewFixtures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'REV-260801-01', rating: 2 }),
        expect.objectContaining({ id: 'REV-260731-01', rating: 3 }),
      ]),
    );
    expect(actionFixtures.map(([id]) => id)).toEqual([
      'ACT-032',
      'ACT-041',
      'ACT-047',
      'ACT-052',
      'ACT-058',
      'ACT-059',
      'ACT-060',
    ]);
  });

  it('restores exact demo records without deleting live or foreign-workspace data', async () => {
    await prisma.dataSourceConnection.create({
      data: {
        id: liveConnectionId,
        workspaceId: DEMO_WORKSPACE_ID,
        provider: 'GA4',
        mode: 'LIVE',
        status: 'CONNECTED',
        displayName: `Authorized portfolio GA4 ${liveConnectionId}`,
        selectedResourceId: `properties/${liveConnectionId}`,
        scopes: ['analytics.readonly'],
      },
    });
    await prisma.dataSourceConnection.update({
      where: { id: 'demo-connection-simulated-ga4' },
      data: { status: 'ERROR' },
    });
    await prisma.metricObservation.update({
      where: {
        workspaceId_evidenceId: { workspaceId: DEMO_WORKSPACE_ID, evidenceId: 'EV-104' },
      },
      data: { value: 999 },
    });

    await resetSummitAndSage(prisma);

    const [simulated, live, flagship, sentinel] = await Promise.all([
      prisma.dataSourceConnection.findUniqueOrThrow({
        where: { id: 'demo-connection-simulated-ga4' },
      }),
      prisma.dataSourceConnection.findUniqueOrThrow({ where: { id: liveConnectionId } }),
      prisma.metricObservation.findUniqueOrThrow({
        where: {
          workspaceId_evidenceId: { workspaceId: DEMO_WORKSPACE_ID, evidenceId: 'EV-104' },
        },
      }),
      prisma.workspace.findUniqueOrThrow({ where: { id: sentinelWorkspaceId } }),
    ]);

    expect(simulated.status).toBe('CONNECTED');
    expect(simulated.mode).toBe('SIMULATED');
    expect(live.mode).toBe('LIVE');
    expect(flagship.value.toNumber()).toBe(1505);
    expect(sentinel.name).toBe('RCH-008 reset sentinel');
  });

  it('refuses reset when the exact dataset marker does not match', async () => {
    await prisma.demoDataset.update({
      where: { workspaceId: DEMO_WORKSPACE_ID },
      data: { version: 'tampered-version' },
    });

    await expect(resetSummitAndSage(prisma)).rejects.toBeInstanceOf(DemoResetScopeError);

    await prisma.demoDataset.update({
      where: { workspaceId: DEMO_WORKSPACE_ID },
      data: { version: DEMO_DATASET_VERSION },
    });
  });
});
