import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const databaseUrl = process.env.DATABASE_URL;
const describeDatabase = databaseUrl ? describe.sequential : describe.skip;

describeDatabase('RCH-007 ingestion and measurement persistence', () => {
  const prisma = new PrismaClient();
  const testId = randomUUID();
  const workspaceId = `rch007-workspace-${testId}`;
  const liveConnectionId = `rch007-live-connection-${testId}`;
  const simulatedConnectionId = `rch007-simulated-connection-${testId}`;
  const liveResourceId = `rch007-live-resource-${testId}`;
  const simulatedResourceId = `rch007-simulated-resource-${testId}`;
  const metricDefinitionId = `rch007-metric-${testId}`;
  const firstSyncRunId = `rch007-sync-1-${testId}`;
  const secondSyncRunId = `rch007-sync-2-${testId}`;
  const periodStart = new Date('2026-07-27T00:00:00.000Z');
  const periodEnd = new Date('2026-07-27T23:59:59.999Z');

  beforeAll(async () => {
    await prisma.workspace.create({
      data: {
        id: workspaceId,
        slug: `rch007-${testId}`,
        name: 'RCH-007 integration workspace',
        timezone: 'America/New_York',
        connections: {
          create: [
            {
              id: liveConnectionId,
              provider: 'GA4',
              mode: 'LIVE',
              status: 'CONNECTED',
              displayName: 'RCH-007 live GA4',
              selectedResourceId: 'ga4:live:property-1',
              scopes: ['analytics.readonly'],
            },
            {
              id: simulatedConnectionId,
              provider: 'GA4',
              mode: 'SIMULATED',
              status: 'CONNECTED',
              displayName: 'RCH-007 simulated GA4',
              selectedResourceId: 'ga4:simulated:property-1',
              scopes: [],
            },
          ],
        },
      },
    });

    await prisma.sourceResource.createMany({
      data: [
        {
          id: liveResourceId,
          workspaceId,
          connectionId: liveConnectionId,
          nativeId: 'ga4:live:property-1',
          resourceType: 'GA4_PROPERTY',
          displayName: 'Authorized GA4 property',
          mode: 'LIVE',
          metadata: {},
        },
        {
          id: simulatedResourceId,
          workspaceId,
          connectionId: simulatedConnectionId,
          nativeId: 'ga4:simulated:property-1',
          resourceType: 'GA4_PROPERTY',
          displayName: 'Summit & Sage fixture property',
          mode: 'SIMULATED',
          metadata: { fixtureVersion: 'test' },
        },
      ],
    });

    await prisma.metricDefinition.create({
      data: {
        id: metricDefinitionId,
        workspaceId,
        stableKey: 'ga4.sessions',
        provider: 'GA4',
        nativeName: 'sessions',
        displayName: 'Sessions',
        family: 'SITE_VISIT',
        unit: 'COUNT',
        aggregationBehavior: 'ADDITIVE',
        description: 'GA4 sessions.',
        comparabilityNotes: 'Comparable within the same configured property.',
      },
    });

    await prisma.syncRun.createMany({
      data: [
        {
          id: firstSyncRunId,
          workspaceId,
          connectionId: liveConnectionId,
          resourceId: liveResourceId,
          mode: 'LIVE',
          status: 'SUCCEEDED',
          idempotencyKey: `live:2026-07-25:2026-07-31:${testId}`,
          correlationId: `correlation-1-${testId}`,
          windowStart: new Date('2026-07-25T00:00:00.000Z'),
          windowEnd: new Date('2026-07-31T23:59:59.999Z'),
          completedAt: new Date('2026-08-01T01:00:00.000Z'),
          insertedCount: 1,
          warnings: [],
        },
        {
          id: secondSyncRunId,
          workspaceId,
          connectionId: liveConnectionId,
          resourceId: liveResourceId,
          mode: 'LIVE',
          status: 'SUCCEEDED',
          idempotencyKey: `live:2026-07-27:2026-08-02:${testId}`,
          correlationId: `correlation-2-${testId}`,
          windowStart: new Date('2026-07-27T00:00:00.000Z'),
          windowEnd: new Date('2026-08-02T23:59:59.999Z'),
          completedAt: new Date('2026-08-03T01:00:00.000Z'),
          updatedCount: 1,
          warnings: [],
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.workspace.deleteMany({ where: { id: workspaceId } });
    await prisma.$disconnect();
  });

  it('upserts overlapping observations without creating duplicates', async () => {
    const identity = {
      workspaceId,
      connectionId: liveConnectionId,
      resourceId: liveResourceId,
      metricDefinitionId,
      grain: 'DAY' as const,
      periodStart,
      dimensionHash: 'sha256:empty-dimensions',
    };

    const initialObservation = {
      id: `rch007-observation-${testId}`,
      evidenceId: 'EV-RCH007-LIVE-SESSIONS',
      ...identity,
      syncRunId: firstSyncRunId,
      mode: 'LIVE' as const,
      periodEnd,
      timezone: 'America/New_York',
      dimensions: {},
      value: 1148,
      retrievedAt: new Date('2026-08-01T01:00:00.000Z'),
      qualityStatus: 'COMPLETE' as const,
      qualityFlags: [],
    };

    await prisma.metricObservation.create({ data: initialObservation });
    await prisma.metricObservation.upsert({
      where: { observationIdentity: identity },
      create: initialObservation,
      update: {
        syncRunId: secondSyncRunId,
        value: 1152,
        retrievedAt: new Date('2026-08-03T01:00:00.000Z'),
        qualityFlags: ['LATE_REVISION_WINDOW'],
      },
    });

    const observations = await prisma.metricObservation.findMany({
      where: identity,
      include: {
        connection: true,
        resource: true,
        metricDefinition: true,
        syncRun: true,
      },
    });

    expect(observations).toHaveLength(1);
    expect(observations[0]).toMatchObject({
      evidenceId: 'EV-RCH007-LIVE-SESSIONS',
      mode: 'LIVE',
      syncRunId: secondSyncRunId,
      connection: { id: liveConnectionId, mode: 'LIVE' },
      resource: { id: liveResourceId, mode: 'LIVE' },
      metricDefinition: { nativeName: 'sessions' },
      syncRun: { correlationId: `correlation-2-${testId}` },
    });
    expect(observations[0]?.value.toNumber()).toBe(1152);
  });

  it('retains safe sync failures and ingestion counts', async () => {
    const failedRun = await prisma.syncRun.create({
      data: {
        workspaceId,
        connectionId: simulatedConnectionId,
        resourceId: simulatedResourceId,
        mode: 'SIMULATED',
        status: 'FAILED',
        idempotencyKey: `simulated:failed:${testId}`,
        correlationId: `correlation-failed-${testId}`,
        attempt: 3,
        windowStart: new Date('2026-07-28T00:00:00.000Z'),
        windowEnd: new Date('2026-08-02T23:59:59.999Z'),
        insertedCount: 4,
        updatedCount: 2,
        skippedCount: 1,
        errorCode: 'PROVIDER_RATE_LIMITED',
        errorSummary: 'The provider did not accept the bounded retry.',
        warnings: [{ code: 'PARTIAL_WINDOW' }],
      },
    });

    expect(failedRun).toMatchObject({
      status: 'FAILED',
      attempt: 3,
      insertedCount: 4,
      updatedCount: 2,
      skippedCount: 1,
      errorCode: 'PROVIDER_RATE_LIMITED',
      errorSummary: 'The provider did not accept the bounded retry.',
    });
  });

  it('keeps live and simulated connection and resource identities distinct', async () => {
    const [liveConnection, simulatedConnection, liveResource, simulatedResource] =
      await Promise.all([
        prisma.dataSourceConnection.findUniqueOrThrow({ where: { id: liveConnectionId } }),
        prisma.dataSourceConnection.findUniqueOrThrow({ where: { id: simulatedConnectionId } }),
        prisma.sourceResource.findUniqueOrThrow({ where: { id: liveResourceId } }),
        prisma.sourceResource.findUniqueOrThrow({ where: { id: simulatedResourceId } }),
      ]);

    expect(liveConnection.id).not.toBe(simulatedConnection.id);
    expect(liveConnection.selectedResourceId).not.toBe(simulatedConnection.selectedResourceId);
    expect(liveResource.id).not.toBe(simulatedResource.id);
    expect(liveResource.nativeId).not.toBe(simulatedResource.nativeId);
    expect([liveConnection.mode, simulatedConnection.mode]).toEqual(['LIVE', 'SIMULATED']);
    expect([liveResource.mode, simulatedResource.mode]).toEqual(['LIVE', 'SIMULATED']);
  });

  it('persists cursors, imports, content, campaigns, and annotations', async () => {
    const goal = await prisma.businessGoal.create({
      data: {
        workspaceId,
        stableKey: `goal-${testId}`,
        title: 'Protect booking conversion',
        description: 'Keep demand growth connected to confirmed bookings.',
      },
    });
    const campaign = await prisma.campaign.create({
      data: {
        workspaceId,
        goalId: goal.id,
        stableKey: `campaign-${testId}`,
        name: 'Summer AC campaign',
        channel: 'PAID_SEARCH',
        status: 'ACTIVE',
        startsAt: new Date('2026-07-01T00:00:00.000Z'),
        description: 'Synthetic campaign context for measurement.',
      },
    });

    const [cursor, importBatch, contentItem, annotation] = await Promise.all([
      prisma.syncCursor.create({
        data: {
          workspaceId,
          connectionId: liveConnectionId,
          resourceId: liveResourceId,
          cursorKey: 'daily-observations',
          cursorValue: { through: '2026-08-02' },
          overlapDays: 3,
        },
      }),
      prisma.importBatch.create({
        data: {
          workspaceId,
          connectionId: simulatedConnectionId,
          resourceId: simulatedResourceId,
          originalFileName: 'synthetic-ga4.csv',
          fileHash: `sha256:${testId}`,
          schemaVersion: '1',
          totalRowCount: 10,
          acceptedRowCount: 9,
          rejectedRowCount: 1,
          validationSummary: { valid: true },
        },
      }),
      prisma.contentItem.create({
        data: {
          workspaceId,
          connectionId: liveConnectionId,
          resourceId: liveResourceId,
          nativeId: '/services/ac-repair',
          mode: 'LIVE',
          type: 'PAGE',
          title: 'AC repair',
          canonicalUrl: 'https://summitandsage.example/services/ac-repair',
          attributes: {},
          firstSeenAt: periodStart,
          lastSeenAt: periodEnd,
        },
      }),
      prisma.businessAnnotation.create({
        data: {
          workspaceId,
          campaignId: campaign.id,
          stableKey: `annotation-${testId}`,
          type: 'CAMPAIGN',
          title: 'Summer AC campaign active',
          description: 'Context only; it does not establish causality.',
          startsAt: new Date('2026-07-01T00:00:00.000Z'),
        },
      }),
    ]);

    expect(cursor.overlapDays).toBe(3);
    expect(importBatch.mode).toBe('IMPORTED');
    expect(contentItem.nativeId).toBe('/services/ac-repair');
    expect(annotation.campaignId).toBe(campaign.id);
  });
});
