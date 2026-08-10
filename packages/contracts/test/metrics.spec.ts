import { describe, expect, it } from 'vitest';
import {
  EvidenceIdSchema,
  MetricComparisonSchema,
  MetricDefinitionSchema,
  MetricDimensionsSchema,
  MetricObservationSchema,
  MetricUnitSchema,
  ObservationGrainSchema,
  SourceModeSchema,
} from '../src';

const definition = {
  stableKey: 'ga4.sessions',
  provider: 'GA4',
  nativeName: 'sessions',
  displayName: 'Website sessions',
  family: 'SITE_VISIT',
  unit: 'COUNT',
  aggregationBehavior: 'ADDITIVE',
  description: 'Sessions reported by the selected GA4 property.',
  comparabilityNotes: 'Not equivalent to Search Console clicks.',
  lowerIsBetter: false,
} as const;

const observation = {
  evidenceId: 'EV-101',
  workspaceId: 'summit-and-sage-demo',
  connectionId: 'demo-ga4',
  resourceId: 'DEMO-GA4-SSHS',
  sourceMode: 'SIMULATED',
  definition,
  period: {
    start: '2026-07-27T00:00:00-06:00',
    end: '2026-08-02T23:59:59-06:00',
    timezone: 'America/Denver',
    grain: 'WEEK',
  },
  value: 10440,
  dimensions: { channel_group: 'All traffic' },
  retrievedAt: '2026-08-03T08:00:00-06:00',
  syncRunId: 'sync-demo-2026-08-03',
  quality: { status: 'COMPLETE', flags: [], coverageNote: null },
} as const;

describe('metric and provenance contracts', () => {
  it('accepts a complete normalized observation', () => {
    expect(MetricObservationSchema.parse(observation)).toMatchObject({
      evidenceId: 'EV-101',
      sourceMode: 'SIMULATED',
      value: 10440,
    });
  });

  it.each(['LIVE', 'SIMULATED', 'IMPORTED'])('accepts source mode %s', (mode) => {
    expect(SourceModeSchema.parse(mode)).toBe(mode);
  });

  it('rejects an invented source mode', () => {
    expect(SourceModeSchema.safeParse('FIXTURE_WITHOUT_LABEL').success).toBe(false);
  });

  it('rejects invalid grains', () => {
    expect(ObservationGrainSchema.safeParse('REALTIME').success).toBe(false);
  });

  it('preserves source-native review ratings as ratings', () => {
    expect(MetricUnitSchema.parse('RATING')).toBe('RATING');
  });

  it('rejects non-finite metric values', () => {
    expect(MetricObservationSchema.safeParse({ ...observation, value: Number.NaN }).success).toBe(
      false,
    );
  });

  it('rejects periods whose end precedes their start', () => {
    const result = MetricObservationSchema.safeParse({
      ...observation,
      period: { ...observation.period, end: '2026-07-26T23:59:59-06:00' },
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid dimension keys and values', () => {
    expect(MetricDimensionsSchema.safeParse({ 'Channel Group': 'Organic' }).success).toBe(false);
    expect(MetricDimensionsSchema.safeParse({ channel_group: '' }).success).toBe(false);
    expect(MetricDimensionsSchema.safeParse({ channel_group: 12 }).success).toBe(false);
  });

  it('rejects definitions with undeclared properties', () => {
    expect(
      MetricDefinitionSchema.safeParse({ ...definition, universalReachScore: 99 }).success,
    ).toBe(false);
  });

  it('requires EV-prefixed evidence identifiers', () => {
    expect(EvidenceIdSchema.safeParse('metric-101').success).toBe(false);
  });

  it('keeps source modes on derived comparisons', () => {
    const comparison = MetricComparisonSchema.parse({
      metricStableKey: 'ga4.sessions',
      unit: 'COUNT',
      currentEvidenceId: 'EV-101',
      priorEvidenceId: 'EV-101-PRIOR',
      sourceModes: ['SIMULATED'],
      currentValue: 10440,
      priorValue: 9480,
      absoluteChange: 960,
      percentageChange: 10.1,
      percentagePointChange: null,
      direction: 'UP',
      qualityStatus: 'COMPLETE',
      qualityFlags: [],
    });

    expect(comparison.sourceModes).toEqual(['SIMULATED']);
  });

  it('distinguishes percentage change from percentage-point change', () => {
    const rateComparison = {
      metricStableKey: 'ga4.booking_rate',
      unit: 'PERCENTAGE',
      currentEvidenceId: 'EV-106',
      priorEvidenceId: 'EV-106-PRIOR',
      sourceModes: ['SIMULATED'],
      currentValue: 3.92,
      priorValue: 6.1,
      absoluteChange: -2.18,
      percentageChange: -35.7,
      percentagePointChange: -2.18,
      direction: 'DOWN',
      qualityStatus: 'COMPLETE',
      qualityFlags: [],
    } as const;

    expect(MetricComparisonSchema.parse(rateComparison).percentagePointChange).toBe(-2.18);
    expect(
      MetricComparisonSchema.safeParse({ ...rateComparison, percentagePointChange: null }).success,
    ).toBe(false);
    expect(
      MetricComparisonSchema.safeParse({
        ...rateComparison,
        unit: 'COUNT',
        percentagePointChange: -2.18,
      }).success,
    ).toBe(false);
  });
});
