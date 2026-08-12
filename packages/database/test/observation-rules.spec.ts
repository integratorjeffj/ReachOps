import type { MetricComparison, MetricUnit } from '@reachops/contracts';
import { describe, expect, it } from 'vitest';
import { flagshipComparisons } from '../src/demo/fixtures';
import {
  generateObservationCandidates,
  OBSERVATION_RULE_VERSION,
} from '../src/insights/observation-rules';
import { compareMetricPeriods } from '../src/metrics/period-comparison';

const metricUnits: Record<string, { unit: MetricUnit; lowerIsBetter?: boolean }> = {
  'ga4.sessions': { unit: 'COUNT' },
  'ga4.organic_sessions': { unit: 'COUNT' },
  'ga4.confirmed_bookings': { unit: 'COUNT' },
  'ga4.page_booking_rate': { unit: 'PERCENTAGE' },
  'gsc.impressions': { unit: 'COUNT' },
  'gsc.clicks': { unit: 'COUNT' },
  'gsc.ctr': { unit: 'PERCENTAGE' },
  'gsc.average_position': { unit: 'AVERAGE_POSITION', lowerIsBetter: true },
  'gbp.profile_views': { unit: 'COUNT' },
  'gbp.website_clicks': { unit: 'COUNT' },
  'gbp.call_clicks': { unit: 'COUNT' },
  'gbp.new_reviews': { unit: 'COUNT' },
  'gbp.new_review_average_rating': { unit: 'RATING' },
  'linkedin.impressions': { unit: 'COUNT' },
  'linkedin.engagements': { unit: 'COUNT' },
};

const window = {
  start: '2026-07-27T06:00:00.000Z',
  end: '2026-08-03T05:59:59.999Z',
  timezone: 'America/Denver',
};

const inputKeyByEvidenceId: Record<string, string> = {
  'EV-102': 'organicSessions',
  'EV-104': 'acRepairSessions',
  'EV-105': 'acRepairBookings',
  'EV-106': 'acRepairBookingRate',
  'EV-107': 'searchImpressions',
  'EV-108': 'searchClicks',
  'EV-109': 'searchCtr',
  'EV-110': 'searchAveragePosition',
  'EV-111': 'gbpProfileViews',
  'EV-112': 'gbpWebsiteClicks',
  'EV-113': 'gbpCallClicks',
  'EV-114': 'newReviews',
  'EV-115': 'newReviewAverageRating',
};

function comparisons(): Record<string, MetricComparison> {
  return Object.fromEntries(
    flagshipComparisons.flatMap(([evidenceId, stableKey, priorValue, currentValue, sourceKey]) => {
      const inputKey = inputKeyByEvidenceId[evidenceId];
      if (!inputKey) return [];
      const metric = metricUnits[stableKey]!;
      return [
        [
          inputKey,
          compareMetricPeriods({
            definition: {
              stableKey,
              unit: metric.unit,
              lowerIsBetter: metric.lowerIsBetter ?? false,
            },
            prior: {
              evidenceId: `${evidenceId}-PRIOR`,
              sourceMode: sourceKey === 'linkedin' ? 'IMPORTED' : 'SIMULATED',
              value: priorValue,
              qualityStatus: 'COMPLETE',
              qualityFlags: [],
            },
            current: {
              evidenceId,
              sourceMode: sourceKey === 'linkedin' ? 'IMPORTED' : 'SIMULATED',
              value: currentValue,
              qualityStatus: 'COMPLETE',
              qualityFlags: [],
            },
          }),
        ] as const,
      ];
    }),
  );
}

function input(overrides: Partial<Parameters<typeof generateObservationCandidates>[0]> = {}) {
  return {
    window,
    comparisons: comparisons(),
    schedulingTheme: {
      theme: 'Scheduling communication',
      count: 3,
      minimumCount: 3,
      qualityStatus: 'COMPLETE' as const,
      qualityFlags: [],
    },
    ...overrides,
  };
}

describe('deterministic observation rules', () => {
  it('reproduces the four documented flagship observations with exact evidence sets', () => {
    const result = generateObservationCandidates(input());

    expect(result.candidates).toHaveLength(4);
    expect(
      result.candidates.map(({ ruleKey, priority, evidenceIds }) => ({
        ruleKey,
        priority,
        evidenceIds,
      })),
    ).toEqual([
      {
        ruleKey: 'ac-repair-demand-conversion-divergence',
        priority: 'HIGH',
        evidenceIds: ['EV-104', 'EV-105', 'EV-106'],
      },
      {
        ruleKey: 'local-profile-cross-source-divergence',
        priority: 'MEDIUM',
        evidenceIds: ['EV-102', 'EV-111', 'EV-112', 'EV-113'],
      },
      {
        ruleKey: 'new-review-scheduling-theme',
        priority: 'MEDIUM',
        evidenceIds: ['EV-114', 'EV-115'],
      },
      {
        ruleKey: 'search-visibility-opportunity',
        priority: 'OPPORTUNITY',
        evidenceIds: ['EV-107', 'EV-108', 'EV-109', 'EV-110'],
      },
    ]);
    expect(result.evaluations.every(({ emitted }) => emitted)).toBe(true);
  });

  it('records rule version, raw inputs, display values, factors, quality, and source modes', () => {
    const candidate = generateObservationCandidates(input()).candidates[0]!;

    expect(candidate).toMatchObject({
      ruleVersion: OBSERVATION_RULE_VERSION,
      causalClaim: false,
      quality: { status: 'COMPLETE', flags: [] },
      sourceModes: ['SIMULATED'],
    });
    expect(candidate.inputs).toHaveLength(3);
    expect(candidate.inputs[2]).toMatchObject({
      evidenceId: 'EV-106',
      currentValue: 3.92,
      priorValue: 6.1,
      displayChange: '\u22122.18 pp',
    });
    expect(candidate.severityFactors.every(({ passed }) => passed)).toBe(true);
  });

  it('returns byte-equivalent stable candidates when the same rule window is rerun', () => {
    const first = generateObservationCandidates(input());
    const second = generateObservationCandidates(input());

    expect(second).toEqual(first);
    expect(new Set(first.candidates.map(({ idempotencyKey }) => idempotencyKey)).size).toBe(4);
  });

  it('blocks the AC repair rule below its minimum session volume', () => {
    const lowVolume = {
      ...comparisons(),
      acRepairSessions: compareMetricPeriods({
        definition: { stableKey: 'ga4.sessions', unit: 'COUNT', lowerIsBetter: false },
        prior: {
          evidenceId: 'EV-104-PRIOR',
          sourceMode: 'SIMULATED',
          value: 400,
          qualityStatus: 'COMPLETE',
          qualityFlags: [],
        },
        current: {
          evidenceId: 'EV-104',
          sourceMode: 'SIMULATED',
          value: 499,
          qualityStatus: 'COMPLETE',
          qualityFlags: ['SMALL_DENOMINATOR'],
        },
      }),
    };

    const result = generateObservationCandidates(input({ comparisons: lowVolume }));
    expect(result.evaluations[0]).toMatchObject({
      emitted: false,
      blockedReasons: ['MINIMUM_VOLUME'],
    });
    expect(result.candidates.some(({ evidenceIds }) => evidenceIds.includes('EV-104'))).toBe(false);
  });

  it.each([
    ['STALE', 'STALE_SOURCE'],
    ['PARTIAL', 'PARTIAL_SOURCE'],
  ] as const)('blocks a rule when a required source is %s', (qualityStatus, reason) => {
    const current = comparisons();
    const degraded = {
      ...current,
      gbpProfileViews: {
        ...current.gbpProfileViews!,
        qualityStatus,
        qualityFlags:
          qualityStatus === 'STALE' ? ['STALE_SOURCE' as const] : ['PARTIAL_SYNC' as const],
      },
    };

    const result = generateObservationCandidates(input({ comparisons: degraded }));
    expect(result.evaluations[1]).toMatchObject({ emitted: false, blockedReasons: [reason] });
  });

  it('blocks the review-theme rule when fewer than three permitted excerpts match', () => {
    const result = generateObservationCandidates(
      input({ schedulingTheme: { ...input().schedulingTheme, count: 2 } }),
    );

    expect(result.evaluations[2]).toMatchObject({
      emitted: false,
      blockedReasons: ['MINIMUM_VOLUME'],
    });
  });

  it('uses observational language without causal claims', () => {
    const rendered = generateObservationCandidates(input())
      .candidates.flatMap(({ title, summary }) => [title, summary])
      .join(' ');

    expect(rendered).not.toMatch(/caused?|because of|led to|resulted in|due to/i);
  });
});
