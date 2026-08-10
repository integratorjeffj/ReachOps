import { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { toConnectionSummary } from '../src/to-connection-summary';

const workspaceScopedModels = [
  'Membership',
  'BusinessGoal',
  'DataSourceConnection',
  'OAuthCredential',
  'SourceResource',
  'SyncRun',
  'SyncCursor',
  'ImportBatch',
  'MetricDefinition',
  'MetricObservation',
  'ContentItem',
  'Campaign',
  'BusinessAnnotation',
  'AuditEvent',
  'DemoDataset',
];

describe('ReachOps schema invariants', () => {
  it.each(workspaceScopedModels)('%s is explicitly workspace scoped', (modelName) => {
    const model = Prisma.dmmf.datamodel.models.find(({ name }) => name === modelName);

    expect(model?.fields.some(({ name }) => name === 'workspaceId')).toBe(true);
  });

  it('keeps audit records append-oriented by omitting an updated timestamp', () => {
    const auditEvent = Prisma.dmmf.datamodel.models.find(({ name }) => name === 'AuditEvent');
    const fieldNames = auditEvent?.fields.map(({ name }) => name) ?? [];

    expect(fieldNames).toContain('createdAt');
    expect(fieldNames).not.toContain('updatedAt');
  });

  it('defines the complete idempotent observation identity', () => {
    const observation = Prisma.dmmf.datamodel.models.find(
      ({ name }) => name === 'MetricObservation',
    );

    expect(observation?.uniqueIndexes).toContainEqual({
      name: 'observationIdentity',
      fields: [
        'workspaceId',
        'connectionId',
        'resourceId',
        'metricDefinitionId',
        'grain',
        'periodStart',
        'dimensionHash',
      ],
    });
  });

  it('maps connection summaries without credential material', () => {
    const summary = toConnectionSummary({
      id: 'connection-1',
      workspaceId: 'workspace-1',
      provider: 'GA4',
      mode: 'SIMULATED',
      status: 'CONNECTED',
      displayName: 'Summit & Sage Web — GA4',
      selectedResourceId: 'DEMO-GA4-SSHS',
      scopes: ['analytics.readonly'],
      lastSuccessAt: new Date('2026-08-03T12:00:00.000Z'),
    });

    expect(summary).toEqual({
      id: 'connection-1',
      workspaceId: 'workspace-1',
      provider: 'GA4',
      mode: 'SIMULATED',
      status: 'CONNECTED',
      displayName: 'Summit & Sage Web — GA4',
      selectedResourceId: 'DEMO-GA4-SSHS',
      scopes: ['analytics.readonly'],
      lastSuccessAt: '2026-08-03T12:00:00.000Z',
    });
    expect(summary).not.toHaveProperty('ciphertext');
    expect(summary).not.toHaveProperty('credential');
  });
});
