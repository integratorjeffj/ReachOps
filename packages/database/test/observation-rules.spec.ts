import type { MetricComparison, MetricUnit } from '@reachops/contracts';
import { describe, expect, it } from 'vitest';
import { flagshipComparisons } from '../src/demo/fixtures';
import { INPUT_KEY_BY_EVIDENCE_ID } from '../src/demo/snapshot';
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
  'ga4.organic_bookings': { unit: 'COUNT' },
  'linkedin.impressions': { unit: 'COUNT' },
  'linkedin.engagement_rate': { unit: 'PERCENTAGE' },
  'linkedin.engagements': { unit: 'COUNT' },
};

const window = {
  start: '2026-07-27T06:00:00.000Z',
  end: '2026-08-03T05:59:59.999Z',
  timezone: 'America/Denver',
};

function comparisons(): Record<string, MetricComparison> {
  return Object.fromEntries(
    flagshipComparisons.flatMap(([evidenceId, stableKey, priorValue, currentValue, sourceKey]) => {
      const inputKey = INPUT_KEY_BY_EVIDENCE_ID[evidenceId];
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

function evaluationFor(result: ReturnType<typeof generateObservationCandidates>, ruleKey: string) {
  return result.evaluations.find((evaluation) => evaluation.ruleKey === ruleKey);
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
  it('reproduces the documented flagship observations with exact evidence sets', () => {
    const result = generateObservationCandidates(input());

    expect(result.candidates).toHaveLength(6);
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
        ruleKey: 'organic-demand-conversion-lag',
        priority: 'MEDIUM',
        evidenceIds: ['EV-102', 'EV-129'],
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
      {
        ruleKey: 'linkedin-exposure-engagement-dilution',
        priority: 'OPPORTUNITY',
        evidenceIds: ['EV-116', 'EV-126'],
      },
    ]);
    expect(result.evaluations.every(({ emitted }) => emitted)).toBe(true);
  });

  it('finds a conversion gap that neither growth figure shows on its own', () => {
    const candidate = generateObservationCandidates(input()).candidates.find(
      ({ ruleKey }) => ruleKey === 'organic-demand-conversion-lag',
    )!;
    const gap = candidate.severityFactors.find(({ key }) => key === 'growth-gap-points')!;

    // Sessions and bookings both rose. The finding is the distance between the two rates, which
    // neither figure reveals alone.
    expect(gap.observed).toBeGreaterThan(5);
    expect(candidate.causalClaim).toBe(false);
  });

  it('holds the dilution rule back when the engagement rate is not falling', () => {
    const result = generateObservationCandidates(
      input({
        comparisons: {
          ...comparisons(),
          linkedinEngagementRate: compareMetricPeriods({
            definition: {
              stableKey: 'linkedin.engagement_rate',
              unit: 'PERCENTAGE',
              lowerIsBetter: false,
            },
            prior: {
              evidenceId: 'EV-126-PRIOR',
              sourceMode: 'IMPORTED',
              value: 3.0,
              qualityStatus: 'COMPLETE',
              qualityFlags: [],
            },
            current: {
              evidenceId: 'EV-126',
              sourceMode: 'IMPORTED',
              value: 3.4,
              qualityStatus: 'COMPLETE',
              qualityFlags: [],
            },
          }),
        },
      }),
    );

    expect(evaluationFor(result, 'linkedin-exposure-engagement-dilution')).toMatchObject({
      emitted: false,
      blockedReasons: ['CONDITIONS_NOT_MET'],
    });
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
    // Every candidate carries its own key, so adding a rule cannot collide with an existing one.
    expect(new Set(first.candidates.map(({ idempotencyKey }) => idempotencyKey)).size).toBe(
      first.candidates.length,
    );
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
    expect(evaluationFor(result, 'ac-repair-demand-conversion-divergence')).toMatchObject({
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
    expect(evaluationFor(result, 'local-profile-cross-source-divergence')).toMatchObject({
      emitted: false,
      blockedReasons: [reason],
    });
  });

  it('blocks the review-theme rule when fewer than three permitted excerpts match', () => {
    const result = generateObservationCandidates(
      input({ schedulingTheme: { ...input().schedulingTheme, count: 2 } }),
    );

    expect(evaluationFor(result, 'new-review-scheduling-theme')).toMatchObject({
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
