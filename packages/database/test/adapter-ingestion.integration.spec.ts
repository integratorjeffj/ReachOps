import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { LinkedInImportAdapter, SimulatedGbpAdapter } from '@reachops/integrations';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { persistNormalizedBatch } from '../src/ingestion/persist-normalized-batch';

const databaseUrl = process.env.DATABASE_URL;
const describeDatabase = databaseUrl ? describe.sequential : describe.skip;

describeDatabase('RCH-009 adapter ingestion persistence', () => {
  const prisma = new PrismaClient();
  const testId = randomUUID();
  const workspaceId = `rch009-workspace-${testId}`;
  const gbp = {
    connectionId: `rch009-gbp-connection-${testId}`,
    resourceId: `rch009-gbp-resource-${testId}`,
    syncRunId: `rch009-gbp-sync-${testId}`,
  };
  const linkedin = {
    connectionId: `rch009-linkedin-connection-${testId}`,
    resourceId: `rch009-linkedin-resource-${testId}`,
    syncRunId: `rch009-linkedin-sync-${testId}`,
  };
  const request = {
    windowStart: '2026-07-27T00:00:00-06:00',
    windowEnd: '2026-08-02T23:59:59-06:00',
    timezone: 'America/Denver',
    retrievedAt: '2026-08-03T12:00:00.000Z',
  };

  beforeAll(async () => {
    await prisma.workspace.create({
      data: {
        id: workspaceId,
        slug: `rch009-${testId}`,
        name: 'RCH-009 integration workspace',
        timezone: 'America/Denver',
      },
    });

    await prisma.dataSourceConnection.createMany({
      data: [
        {
          id: gbp.connectionId,
          workspaceId,
          provider: 'GBP_SIMULATED',
          mode: 'SIMULATED',
          status: 'CONNECTED',
          displayName: `RCH-009 GBP ${testId}`,
          selectedResourceId: 'DEMO-GBP-SSHS',
          scopes: [],
        },
        {
          id: linkedin.connectionId,
          workspaceId,
          provider: 'LINKEDIN_IMPORT',
          mode: 'IMPORTED',
          status: 'CONNECTED',
          displayName: `RCH-009 LinkedIn ${testId}`,
          selectedResourceId: 'DEMO-LI-SSHS',
          scopes: [],
        },
      ],
    });
    await prisma.sourceResource.createMany({
      data: [
        {
          id: gbp.resourceId,
          workspaceId,
          connectionId: gbp.connectionId,
          nativeId: 'DEMO-GBP-SSHS',
          resourceType: 'GBP_LOCATION',
          displayName: 'RCH-009 simulated GBP',
          mode: 'SIMULATED',
          metadata: {},
        },
        {
          id: linkedin.resourceId,
          workspaceId,
          connectionId: linkedin.connectionId,
          nativeId: 'DEMO-LI-SSHS',
          resourceType: 'LINKEDIN_COMPANY_PAGE',
          displayName: 'RCH-009 imported LinkedIn',
          mode: 'IMPORTED',
          metadata: {},
        },
      ],
    });
    await prisma.syncRun.createMany({
      data: [
        {
          id: gbp.syncRunId,
          workspaceId,
          connectionId: gbp.connectionId,
          resourceId: gbp.resourceId,
          mode: 'SIMULATED',
          status: 'RUNNING',
          idempotencyKey: `rch009-gbp-${testId}`,
          correlationId: `rch009-${testId}`,
          windowStart: new Date(request.windowStart),
          windowEnd: new Date(request.windowEnd),
          warnings: [],
        },
        {
          id: linkedin.syncRunId,
          workspaceId,
          connectionId: linkedin.connectionId,
          resourceId: linkedin.resourceId,
          mode: 'IMPORTED',
          status: 'RUNNING',
          idempotencyKey: `rch009-linkedin-${testId}`,
          correlationId: `rch009-${testId}`,
          windowStart: new Date('2026-07-20T06:00:00.000Z'),
          windowEnd: new Date(request.windowEnd),
          warnings: [],
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.workspace.deleteMany({ where: { id: workspaceId } });
    await prisma.$disconnect();
  });

  it('persists simulated GBP metrics and review text as untrusted content', async () => {
    const batch = await new SimulatedGbpAdapter().sync({
      ...request,
      resourceNativeId: 'DEMO-GBP-SSHS',
    });
    const context = { workspaceId, ...gbp };

    await persistNormalizedBatch(prisma, context, batch);
    await persistNormalizedBatch(prisma, context, batch);

    const [observationCount, reviews, syncRun] = await Promise.all([
      prisma.metricObservation.count({
        where: { workspaceId, connectionId: gbp.connectionId },
      }),
      prisma.contentItem.findMany({
        where: { workspaceId, connectionId: gbp.connectionId, type: 'REVIEW' },
      }),
      prisma.syncRun.findUniqueOrThrow({ where: { id: gbp.syncRunId } }),
    ]);

    expect(observationCount).toBe(5);
    expect(reviews).toHaveLength(5);
    expect(
      reviews.every(
        ({ attributes }) => (attributes as Record<string, unknown>).trust === 'UNTRUSTED_EXTERNAL',
      ),
    ).toBe(true);
    expect(syncRun).toMatchObject({ status: 'SUCCEEDED', insertedCount: 10 });
  });

  it('persists LinkedIn file provenance and overlapping observations idempotently', async () => {
    const csv = [
      'date,impressions,engagements',
      '2026-07-20,9800,311',
      '2026-07-27,11600,352',
    ].join('\n');
    const batch = await new LinkedInImportAdapter('summit-and-sage-linkedin.csv', csv).sync({
      ...request,
      resourceNativeId: 'DEMO-LI-SSHS',
    });
    const context = { workspaceId, ...linkedin };

    const first = await persistNormalizedBatch(prisma, context, batch);
    const second = await persistNormalizedBatch(prisma, context, batch);
    const [imports, observations] = await Promise.all([
      prisma.importBatch.findMany({ where: { workspaceId, connectionId: linkedin.connectionId } }),
      prisma.metricObservation.findMany({
        where: { workspaceId, connectionId: linkedin.connectionId },
        include: { connection: true, resource: true, syncRun: true },
      }),
    ]);

    expect(second).toEqual(first);
    expect(imports).toHaveLength(1);
    expect(imports[0]).toMatchObject({
      mode: 'IMPORTED',
      status: 'IMPORTED',
      originalFileName: 'summit-and-sage-linkedin.csv',
      schemaVersion: 'linkedin-aggregate-v1',
      totalRowCount: 2,
      acceptedRowCount: 2,
      rejectedRowCount: 0,
    });
    expect(observations).toHaveLength(4);
    expect(
      observations.every(
        ({ mode, connection, resource, syncRun }) =>
          mode === 'IMPORTED' &&
          connection.mode === 'IMPORTED' &&
          resource.mode === 'IMPORTED' &&
          syncRun.mode === 'IMPORTED',
      ),
    ).toBe(true);
  });

  it('rejects a batch whose provider or mode does not match its persistence context', async () => {
    const batch = await new SimulatedGbpAdapter().sync({
      ...request,
      resourceNativeId: 'DEMO-GBP-SSHS',
    });

    await expect(
      persistNormalizedBatch(prisma, { workspaceId, ...linkedin }, batch),
    ).rejects.toThrow('does not match its authorized persistence context');
  });
});
