import type { MetricDefinition, MetricUnit } from '@reachops/contracts';
import { describe, expect, it } from 'vitest';
import { calculateRate, compareMetricPeriods } from '../src/metrics/period-comparison';

const flagshipCases: Array<{
  evidenceId: string;
  stableKey: string;
  unit: MetricUnit;
  lowerIsBetter?: boolean;
  prior: number;
  current: number;
  displayChange: string;
}> = [
  {
    evidenceId: 'EV-101',
    stableKey: 'ga4.sessions',
    unit: 'COUNT',
    prior: 9480,
    current: 10440,
    displayChange: '+10.1%',
  },
  {
    evidenceId: 'EV-102',
    stableKey: 'ga4.organic_sessions',
    unit: 'COUNT',
    prior: 6310,
    current: 7020,
    displayChange: '+11.3%',
  },
  {
    evidenceId: 'EV-103',
    stableKey: 'ga4.confirmed_bookings',
    unit: 'COUNT',
    prior: 241,
    current: 246,
    displayChange: '+2.1%',
  },
  {
    evidenceId: 'EV-104',
    stableKey: 'ga4.sessions',
    unit: 'COUNT',
    prior: 1148,
    current: 1505,
    displayChange: '+31.1%',
  },
  {
    evidenceId: 'EV-105',
    stableKey: 'ga4.confirmed_bookings',
    unit: 'COUNT',
    prior: 70,
    current: 59,
    displayChange: '\u221215.7%',
  },
  {
    evidenceId: 'EV-106',
    stableKey: 'ga4.page_booking_rate',
    unit: 'PERCENTAGE',
    prior: 6.1,
    current: 3.92,
    displayChange: '\u22122.18 pp',
  },
  {
    evidenceId: 'EV-107',
    stableKey: 'gsc.impressions',
    unit: 'COUNT',
    prior: 197400,
    current: 213600,
    displayChange: '+8.2%',
  },
  {
    evidenceId: 'EV-108',
    stableKey: 'gsc.clicks',
    unit: 'COUNT',
    prior: 7380,
    current: 8160,
    displayChange: '+10.6%',
  },
  {
    evidenceId: 'EV-109',
    stableKey: 'gsc.ctr',
    unit: 'PERCENTAGE',
    prior: 3.74,
    current: 3.82,
    displayChange: '+0.08 pp',
  },
  {
    evidenceId: 'EV-110',
    stableKey: 'gsc.average_position',
    unit: 'AVERAGE_POSITION',
    lowerIsBetter: true,
    prior: 9.8,
    current: 9.4,
    displayChange: 'Improved 0.4',
  },
  {
    evidenceId: 'EV-111',
    stableKey: 'gbp.profile_views',
    unit: 'COUNT',
    prior: 14920,
    current: 14120,
    displayChange: '\u22125.4%',
  },
  {
    evidenceId: 'EV-112',
    stableKey: 'gbp.website_clicks',
    unit: 'COUNT',
    prior: 1162,
    current: 1050,
    displayChange: '\u22129.6%',
  },
  {
    evidenceId: 'EV-113',
    stableKey: 'gbp.call_clicks',
    unit: 'COUNT',
    prior: 738,
    current: 689,
    displayChange: '\u22126.6%',
  },
  {
    evidenceId: 'EV-114',
    stableKey: 'gbp.new_reviews',
    unit: 'COUNT',
    prior: 17,
    current: 19,
    displayChange: '+11.8%',
  },
  {
    evidenceId: 'EV-115',
    stableKey: 'gbp.new_review_average_rating',
    unit: 'RATING',
    prior: 4.65,
    current: 4.42,
    displayChange: '\u22120.23',
  },
  {
    evidenceId: 'EV-116',
    stableKey: 'linkedin.impressions',
    unit: 'COUNT',
    prior: 9800,
    current: 11600,
    displayChange: '+18.4%',
  },
  {
    evidenceId: 'EV-117',
    stableKey: 'linkedin.engagements',
    unit: 'COUNT',
    prior: 311,
    current: 352,
    displayChange: '+13.2%',
  },
];

function period(evidenceId: string, value: number) {
  return {
    evidenceId,
    sourceMode: 'SIMULATED' as const,
    value,
    qualityStatus: 'COMPLETE' as const,
    qualityFlags: [],
  };
}

function definition(
  stableKey: string,
  unit: MetricUnit,
  lowerIsBetter = false,
): Pick<MetricDefinition, 'stableKey' | 'unit' | 'lowerIsBetter'> {
  return { stableKey, unit, lowerIsBetter };
}

describe('deterministic period comparisons', () => {
  it.each(flagshipCases)('reproduces $evidenceId as $displayChange', (fixture) => {
    const comparison = compareMetricPeriods({
      definition: definition(fixture.stableKey, fixture.unit, fixture.lowerIsBetter),
      prior: period(`${fixture.evidenceId}-PRIOR`, fixture.prior),
      current: period(fixture.evidenceId, fixture.current),
    });

    expect(comparison.display.change).toBe(fixture.displayChange);
    expect(comparison.absoluteChange).toBeCloseTo(fixture.current - fixture.prior, 10);
    expect(comparison.currentValue).toBe(fixture.current);
    expect(comparison.priorValue).toBe(fixture.prior);
  });

  it('keeps full precision in raw calculations and rounds only display metadata', () => {
    const comparison = compareMetricPeriods({
      definition: definition('ga4.sessions', 'COUNT'),
      prior: period('EV-PRECISION-PRIOR', 9480),
      current: period('EV-PRECISION', 10440),
    });

    expect(comparison.percentageChange).toBeCloseTo(10.126582278481013, 12);
    expect(comparison.display.change).toBe('+10.1%');
  });

  it('reports missing periods without inventing zero values', () => {
    const comparison = compareMetricPeriods({
      definition: definition('ga4.sessions', 'COUNT'),
      prior: period('EV-MISSING-PRIOR', 100),
      current: null,
    });

    expect(comparison).toMatchObject({
      currentValue: null,
      absoluteChange: null,
      percentageChange: null,
      direction: 'UNAVAILABLE',
      unavailableReason: 'MISSING_CURRENT_PERIOD',
      qualityStatus: 'PARTIAL',
      qualityFlags: ['MISSING_DATES'],
      display: { currentValue: 'Not available', change: 'Not available' },
    });
  });

  it.each([
    { prior: 0, reason: 'ZERO_BASELINE' },
    { prior: -10, reason: 'NEGATIVE_BASELINE' },
  ] as const)('uses an absolute delta when the baseline is $prior', ({ prior, reason }) => {
    const comparison = compareMetricPeriods({
      definition: definition('ga4.sessions', 'COUNT'),
      prior: period('EV-BASELINE-PRIOR', prior),
      current: period('EV-BASELINE', 10),
    });

    expect(comparison.percentageChange).toBeNull();
    expect(comparison.unavailableReason).toBe(reason);
    expect(comparison.display.changeKind).toBe('ABSOLUTE');
    expect(comparison.display.change).toBe(prior === 0 ? '+10.0' : '+20.0');
  });

  it('marks a caller-defined small denominator while preserving the raw rate', () => {
    expect(calculateRate(1, 20, { smallDenominatorThreshold: 50 })).toEqual({
      value: 5,
      qualityFlags: ['SMALL_DENOMINATOR'],
      unavailableReason: null,
    });
  });

  it.each([
    [null, 20, 'MISSING_NUMERATOR'],
    [1, null, 'MISSING_DENOMINATOR'],
    [1, 0, 'ZERO_DENOMINATOR'],
    [-1, 20, 'NEGATIVE_NUMERATOR'],
    [1, -20, 'NEGATIVE_DENOMINATOR'],
  ] as const)('handles invalid rate inputs (%s / %s)', (numerator, denominator, reason) => {
    expect(calculateRate(numerator, denominator)).toMatchObject({
      value: null,
      unavailableReason: reason,
    });
  });
});
