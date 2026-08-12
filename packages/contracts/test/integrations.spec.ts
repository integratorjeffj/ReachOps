import { describe, expect, it } from 'vitest';
import { NormalizedBatchSchema } from '../src';

const definition = {
  stableKey: 'linkedin.impressions',
  provider: 'LINKEDIN_IMPORT',
  nativeName: 'impressions',
  displayName: 'LinkedIn impressions',
  family: 'EXPOSURE',
  unit: 'COUNT',
  aggregationBehavior: 'ADDITIVE',
  description: 'Imported aggregate impressions.',
  comparabilityNotes: 'Not a live API result.',
  lowerIsBetter: false,
} as const;

const batch = {
  provider: 'LINKEDIN_IMPORT',
  mode: 'IMPORTED',
  resourceNativeId: 'DEMO-LI-SSHS',
  retrievedAt: '2026-08-03T12:00:00.000Z',
  capabilities: ['METRICS', 'IMPORT'],
  metricDefinitions: [definition],
  observations: [
    {
      evidenceId: 'EV-116',
      metricStableKey: definition.stableKey,
      period: {
        start: '2026-07-27T00:00:00-06:00',
        end: '2026-08-02T23:59:59-06:00',
        timezone: 'America/Denver',
        grain: 'WEEK',
      },
      value: 11600,
      dimensions: { scope: 'company_page' },
      retrievedAt: '2026-08-03T12:00:00.000Z',
      quality: { status: 'COMPLETE', flags: [], coverageNote: null },
    },
  ],
  contentItems: [],
  importProvenance: {
    originalFileName: 'linkedin.csv',
    fileHash: `sha256:${'a'.repeat(64)}`,
    schemaVersion: 'linkedin-aggregate-v1',
    totalRowCount: 1,
    acceptedRowCount: 1,
    rejectedRowCount: 0,
    validationSummary: { valid: true },
  },
  warnings: ['Imported fixture.'],
} as const;

describe('integration adapter contracts', () => {
  it('accepts a provenance-complete normalized import batch', () => {
    expect(NormalizedBatchSchema.parse(batch)).toMatchObject({
      provider: 'LINKEDIN_IMPORT',
      mode: 'IMPORTED',
    });
  });

  it('requires provenance for imported batches', () => {
    expect(NormalizedBatchSchema.safeParse({ ...batch, importProvenance: null }).success).toBe(
      false,
    );
  });

  it('rejects observations that reference undeclared metrics', () => {
    const invalid = {
      ...batch,
      observations: [{ ...batch.observations[0], metricStableKey: 'linkedin.unknown' }],
    };
    expect(NormalizedBatchSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects duplicate evidence IDs inside a batch', () => {
    expect(
      NormalizedBatchSchema.safeParse({
        ...batch,
        observations: [batch.observations[0], batch.observations[0]],
      }).success,
    ).toBe(false);
  });
});
