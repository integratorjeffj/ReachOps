import { describe, expect, it } from 'vitest';
import { OverviewResponseSchema } from '../src';

describe('overview response contract', () => {
  it('requires exactly four KPIs and three explicit priority placeholders', () => {
    const result = OverviewResponseSchema.safeParse({
      state: 'EMPTY',
      workspace: {
        id: 'workspace-1',
        slug: 'workspace-1',
        name: 'Workspace',
        timezone: 'America/Denver',
        synthetic: false,
        datasetVersion: null,
      },
      activeWeek: {
        start: '2026-08-10T06:00:00.000Z',
        end: '2026-08-17T05:59:59.999Z',
        timezone: 'America/Denver',
      },
      goals: [],
      kpis: [],
      sourceCoverage: [],
      priorities: [],
      trends: [],
      annotations: [],
    });

    expect(result.success).toBe(false);
  });
});
