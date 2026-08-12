import { createHash } from 'node:crypto';
import {
  ObservationGenerationResultSchema,
  type DataQualityFlag,
  type MetricComparison,
  type ObservationCandidate,
  type ObservationGenerationResult,
  type ObservationPriority,
  type QualityStatus,
} from '@reachops/contracts';

export const OBSERVATION_RULE_VERSION = '1.0.0';

export interface ObservationWindow {
  start: string;
  end: string;
  timezone: string;
}

export interface ReviewThemeInput {
  theme: string;
  count: number;
  minimumCount: number;
  qualityStatus: QualityStatus;
  qualityFlags: DataQualityFlag[];
}

export interface GenerateObservationCandidatesInput {
  window: ObservationWindow;
  comparisons: Record<string, MetricComparison>;
  schedulingTheme: ReviewThemeInput;
}

type BlockedReason = ObservationGenerationResult['evaluations'][number]['blockedReasons'][number];

interface RuleDefinition {
  key: string;
  priority: ObservationPriority;
  inputKeys: string[];
  title: string;
  summary: string;
  evaluate: (context: RuleContext) => Factor[];
  extraGate?: (context: RuleContext) => BlockedReason[];
}

interface Factor {
  key: string;
  observed: number;
  operator: 'GTE' | 'GT' | 'LTE' | 'LT' | 'EQ';
  threshold: number;
  passed: boolean;
}

interface RuleContext {
  comparisons: Record<string, MetricComparison>;
  schedulingTheme: ReviewThemeInput;
}

const rules: RuleDefinition[] = [
  {
    key: 'ac-repair-demand-conversion-divergence',
    priority: 'HIGH',
    inputKeys: ['acRepairSessions', 'acRepairBookings', 'acRepairBookingRate'],
    title: 'AC repair demand rose while booking efficiency fell',
    summary:
      'AC repair page sessions increased while confirmed bookings and booking rate declined.',
    evaluate: ({ comparisons }) => [
      factor(
        'current-sessions',
        value(comparisons, 'acRepairSessions', 'currentValue'),
        'GTE',
        500,
      ),
      factor('session-growth', value(comparisons, 'acRepairSessions', 'percentageChange'), 'GT', 0),
      factor(
        'booking-count-change',
        value(comparisons, 'acRepairBookings', 'absoluteChange'),
        'LTE',
        0,
      ),
      factor(
        'booking-rate-change-pp',
        value(comparisons, 'acRepairBookingRate', 'percentagePointChange'),
        'LTE',
        -1,
      ),
    ],
    extraGate: ({ comparisons }) =>
      value(comparisons, 'acRepairSessions', 'currentValue') < 500 ? ['MINIMUM_VOLUME'] : [],
  },
  {
    key: 'local-profile-cross-source-divergence',
    priority: 'MEDIUM',
    inputKeys: ['organicSessions', 'gbpProfileViews', 'gbpWebsiteClicks', 'gbpCallClicks'],
    title: 'Local-profile actions declined as organic traffic rose',
    summary:
      'Organic sessions increased while GBP profile views, website clicks, and call clicks declined.',
    evaluate: ({ comparisons }) => [
      factor(
        'organic-session-growth',
        value(comparisons, 'organicSessions', 'percentageChange'),
        'GT',
        0,
      ),
      factor(
        'profile-view-change',
        value(comparisons, 'gbpProfileViews', 'percentageChange'),
        'LT',
        0,
      ),
      factor(
        'website-click-change',
        value(comparisons, 'gbpWebsiteClicks', 'percentageChange'),
        'LT',
        0,
      ),
      factor('call-click-change', value(comparisons, 'gbpCallClicks', 'percentageChange'), 'LT', 0),
    ],
  },
  {
    key: 'new-review-scheduling-theme',
    priority: 'MEDIUM',
    inputKeys: ['newReviews', 'newReviewAverageRating'],
    title: 'New-review rating declined alongside a scheduling theme',
    summary:
      'The average rating of new reviews declined and at least three permitted excerpts share a scheduling theme.',
    evaluate: ({ comparisons, schedulingTheme }) => [
      factor(
        'new-review-rating-change',
        value(comparisons, 'newReviewAverageRating', 'absoluteChange'),
        'LT',
        0,
      ),
      factor('scheduling-theme-count', schedulingTheme.count, 'GTE', schedulingTheme.minimumCount),
    ],
    extraGate: ({ schedulingTheme }) =>
      schedulingTheme.count < schedulingTheme.minimumCount ? ['MINIMUM_VOLUME'] : [],
  },
  {
    key: 'search-visibility-opportunity',
    priority: 'OPPORTUNITY',
    inputKeys: ['searchImpressions', 'searchClicks', 'searchCtr', 'searchAveragePosition'],
    title: 'Search visibility and clicks improved',
    summary:
      'Search impressions and clicks increased with a modest CTR gain and improved average position.',
    evaluate: ({ comparisons }) => [
      factor(
        'impression-growth',
        value(comparisons, 'searchImpressions', 'percentageChange'),
        'GT',
        0,
      ),
      factor('click-growth', value(comparisons, 'searchClicks', 'percentageChange'), 'GT', 0),
      factor('ctr-change-pp', value(comparisons, 'searchCtr', 'percentagePointChange'), 'GT', 0),
      factor(
        'average-position-change',
        value(comparisons, 'searchAveragePosition', 'absoluteChange'),
        'LT',
        0,
      ),
    ],
  },
];

export function generateObservationCandidates(
  input: GenerateObservationCandidatesInput,
): ObservationGenerationResult {
  const context = { comparisons: input.comparisons, schedulingTheme: input.schedulingTheme };
  const candidates: ObservationCandidate[] = [];
  const evaluations: ObservationGenerationResult['evaluations'] = [];

  for (const rule of rules) {
    const comparisons = rule.inputKeys.map((key) => input.comparisons[key]);
    const blockedReasons = gateReasons(comparisons);
    if (rule.key === 'new-review-scheduling-theme') {
      blockedReasons.push(
        ...qualityReasons(input.schedulingTheme.qualityStatus, input.schedulingTheme.qualityFlags),
      );
    }
    if (comparisons.every(Boolean)) blockedReasons.push(...(rule.extraGate?.(context) ?? []));

    const factors = comparisons.every(Boolean) ? rule.evaluate(context) : [];
    if (factors.some((item) => !item.passed) && !blockedReasons.includes('MINIMUM_VOLUME')) {
      blockedReasons.push('CONDITIONS_NOT_MET');
    }
    const uniqueBlockedReasons = [...new Set(blockedReasons)];
    const emitted = uniqueBlockedReasons.length === 0;

    if (emitted) {
      candidates.push(
        buildCandidate(
          rule,
          input.window,
          comparisons as MetricComparison[],
          factors,
          rule.key === 'new-review-scheduling-theme' ? input.schedulingTheme.qualityFlags : [],
        ),
      );
    }
    evaluations.push({
      ruleKey: rule.key,
      ruleVersion: OBSERVATION_RULE_VERSION,
      emitted,
      blockedReasons: uniqueBlockedReasons,
    });
  }

  return ObservationGenerationResultSchema.parse({ candidates, evaluations });
}

function buildCandidate(
  rule: RuleDefinition,
  window: ObservationWindow,
  comparisons: MetricComparison[],
  severityFactors: Factor[],
  additionalQualityFlags: DataQualityFlag[],
): ObservationCandidate {
  const idempotencyKey = `${rule.key}:${OBSERVATION_RULE_VERSION}:${window.start}:${window.end}`;
  const digest = createHash('sha256')
    .update(idempotencyKey)
    .digest('hex')
    .slice(0, 16)
    .toUpperCase();
  const flags = [
    ...new Set([
      ...comparisons.flatMap((comparison) => comparison.qualityFlags),
      ...additionalQualityFlags,
    ]),
  ];
  const sourceModes = [...new Set(comparisons.flatMap((comparison) => comparison.sourceModes))];

  return {
    id: `OC-${digest}`,
    idempotencyKey,
    ruleKey: rule.key,
    ruleVersion: OBSERVATION_RULE_VERSION,
    window,
    priority: rule.priority,
    title: rule.title,
    summary: rule.summary,
    evidenceIds: comparisons.map((comparison) => comparison.currentEvidenceId!),
    sourceModes,
    inputs: comparisons.map((comparison) => ({
      evidenceId: comparison.currentEvidenceId!,
      metricStableKey: comparison.metricStableKey,
      currentValue: comparison.currentValue!,
      priorValue: comparison.priorValue!,
      absoluteChange: comparison.absoluteChange!,
      percentageChange: comparison.percentageChange,
      percentagePointChange: comparison.percentagePointChange,
      displayChange: comparison.display.change,
    })),
    severityFactors,
    quality: { status: 'COMPLETE', flags },
    causalClaim: false,
  };
}

function gateReasons(comparisons: Array<MetricComparison | undefined>): BlockedReason[] {
  if (comparisons.some((comparison) => comparison === undefined)) return ['MISSING_INPUT'];
  return [
    ...new Set(
      comparisons.flatMap((comparison) =>
        comparison ? qualityReasons(comparison.qualityStatus, comparison.qualityFlags) : [],
      ),
    ),
  ];
}

function qualityReasons(status: QualityStatus, flags: DataQualityFlag[]): BlockedReason[] {
  const reasons: BlockedReason[] = [];
  if (
    status === 'PARTIAL' ||
    flags.includes('PARTIAL_SYNC') ||
    flags.includes('MISSING_DATES') ||
    flags.includes('TRACKING_CHANGE')
  ) {
    reasons.push('PARTIAL_SOURCE');
  }
  if (status === 'STALE' || flags.includes('STALE_SOURCE')) reasons.push('STALE_SOURCE');
  if (status === 'INVALID') reasons.push('INVALID_SOURCE');
  if (flags.includes('SMALL_DENOMINATOR')) reasons.push('MINIMUM_VOLUME');
  return reasons;
}

function value(
  comparisons: Record<string, MetricComparison>,
  inputKey: string,
  field: 'currentValue' | 'absoluteChange' | 'percentageChange' | 'percentagePointChange',
): number {
  const result = comparisons[inputKey]?.[field];
  if (result === null || result === undefined) return Number.NaN;
  return result;
}

function factor(
  key: string,
  observed: number,
  operator: Factor['operator'],
  threshold: number,
): Factor {
  const passed =
    operator === 'GTE'
      ? observed >= threshold
      : operator === 'GT'
        ? observed > threshold
        : operator === 'LTE'
          ? observed <= threshold
          : operator === 'LT'
            ? observed < threshold
            : observed === threshold;
  return { key, observed, operator, threshold, passed };
}
