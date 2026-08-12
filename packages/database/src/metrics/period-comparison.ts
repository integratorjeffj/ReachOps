import {
  MetricComparisonSchema,
  type DataQualityFlag,
  type MetricComparison,
  type MetricDefinition,
  type QualityStatus,
  type SourceMode,
} from '@reachops/contracts';

export interface ComparisonPeriodValue {
  evidenceId: string;
  sourceMode: SourceMode;
  value: number;
  qualityStatus: QualityStatus;
  qualityFlags: DataQualityFlag[];
}

export interface CompareMetricPeriodsInput {
  definition: Pick<MetricDefinition, 'stableKey' | 'unit' | 'lowerIsBetter'>;
  current: ComparisonPeriodValue | null;
  prior: ComparisonPeriodValue | null;
}

export type RateUnavailableReason =
  | 'MISSING_NUMERATOR'
  | 'MISSING_DENOMINATOR'
  | 'ZERO_DENOMINATOR'
  | 'NEGATIVE_NUMERATOR'
  | 'NEGATIVE_DENOMINATOR';

export interface RateCalculation {
  value: number | null;
  qualityFlags: DataQualityFlag[];
  unavailableReason: RateUnavailableReason | null;
}

const qualityRank: Record<QualityStatus, number> = {
  COMPLETE: 0,
  PARTIAL: 1,
  STALE: 2,
  INVALID: 3,
};

const unavailable = 'Not available';

export function calculateRate(
  numerator: number | null,
  denominator: number | null,
  options: { smallDenominatorThreshold?: number } = {},
): RateCalculation {
  if (numerator === null) {
    return { value: null, qualityFlags: ['MISSING_DATES'], unavailableReason: 'MISSING_NUMERATOR' };
  }
  if (denominator === null) {
    return {
      value: null,
      qualityFlags: ['MISSING_DATES'],
      unavailableReason: 'MISSING_DENOMINATOR',
    };
  }
  if (denominator === 0) {
    return { value: null, qualityFlags: [], unavailableReason: 'ZERO_DENOMINATOR' };
  }
  if (numerator < 0) {
    return { value: null, qualityFlags: [], unavailableReason: 'NEGATIVE_NUMERATOR' };
  }
  if (denominator < 0) {
    return { value: null, qualityFlags: [], unavailableReason: 'NEGATIVE_DENOMINATOR' };
  }

  const threshold = options.smallDenominatorThreshold;
  const qualityFlags: DataQualityFlag[] =
    threshold !== undefined && denominator < threshold ? ['SMALL_DENOMINATOR'] : [];

  return { value: (numerator / denominator) * 100, qualityFlags, unavailableReason: null };
}

export function compareMetricPeriods(input: CompareMetricPeriodsInput): MetricComparison {
  if (input.current === null && input.prior === null) {
    throw new Error('At least one comparison period is required.');
  }

  const currentValue = input.current?.value ?? null;
  const priorValue = input.prior?.value ?? null;
  const hasBothPeriods = currentValue !== null && priorValue !== null;
  const absoluteChange = hasBothPeriods ? currentValue - priorValue : null;
  const direction =
    absoluteChange === null
      ? 'UNAVAILABLE'
      : absoluteChange > 0
        ? 'UP'
        : absoluteChange < 0
          ? 'DOWN'
          : 'FLAT';
  const percentageChange =
    absoluteChange === null || priorValue === null || priorValue <= 0
      ? null
      : (absoluteChange / priorValue) * 100;
  const percentagePointChange =
    input.definition.unit === 'PERCENTAGE' && absoluteChange !== null ? absoluteChange : null;
  const unavailableReason =
    input.current === null
      ? 'MISSING_CURRENT_PERIOD'
      : input.prior === null
        ? 'MISSING_PRIOR_PERIOD'
        : priorValue === 0
          ? 'ZERO_BASELINE'
          : priorValue !== null && priorValue < 0
            ? 'NEGATIVE_BASELINE'
            : null;
  const periods = [input.current, input.prior].filter(
    (period): period is ComparisonPeriodValue => period !== null,
  );
  const qualityFlags = [...new Set(periods.flatMap((period) => period.qualityFlags))];
  if (!hasBothPeriods && !qualityFlags.includes('MISSING_DATES')) {
    qualityFlags.push('MISSING_DATES');
  }
  const qualityStatus = periods.reduce<QualityStatus>(
    (worst, period) =>
      qualityRank[period.qualityStatus] > qualityRank[worst] ? period.qualityStatus : worst,
    hasBothPeriods ? 'COMPLETE' : 'PARTIAL',
  );

  return MetricComparisonSchema.parse({
    metricStableKey: input.definition.stableKey,
    unit: input.definition.unit,
    currentEvidenceId: input.current?.evidenceId ?? null,
    priorEvidenceId: input.prior?.evidenceId ?? null,
    sourceModes: [...new Set(periods.map((period) => period.sourceMode))],
    currentValue,
    priorValue,
    absoluteChange,
    percentageChange,
    percentagePointChange,
    direction,
    unavailableReason,
    qualityStatus,
    qualityFlags,
    display: buildDisplay(
      input.definition,
      currentValue,
      priorValue,
      absoluteChange,
      percentageChange,
    ),
  });
}

function buildDisplay(
  definition: CompareMetricPeriodsInput['definition'],
  currentValue: number | null,
  priorValue: number | null,
  absoluteChange: number | null,
  percentageChange: number | null,
) {
  if (absoluteChange === null) {
    return {
      currentValue: formatValue(currentValue, definition.unit),
      priorValue: formatValue(priorValue, definition.unit),
      change: unavailable,
      changeKind: 'UNAVAILABLE' as const,
      directionLabel: unavailable,
    };
  }

  const numericDirection =
    absoluteChange > 0 ? 'Increased' : absoluteChange < 0 ? 'Decreased' : 'Unchanged';
  const directionLabel =
    definition.lowerIsBetter && absoluteChange !== 0
      ? absoluteChange < 0
        ? 'Improved'
        : 'Declined'
      : numericDirection;

  if (definition.unit === 'PERCENTAGE') {
    return {
      currentValue: formatValue(currentValue, definition.unit),
      priorValue: formatValue(priorValue, definition.unit),
      change: `${formatSigned(absoluteChange, 2)} pp`,
      changeKind: 'PERCENTAGE_POINT' as const,
      directionLabel,
    };
  }

  if (definition.unit === 'AVERAGE_POSITION') {
    return {
      currentValue: formatValue(currentValue, definition.unit),
      priorValue: formatValue(priorValue, definition.unit),
      change:
        absoluteChange === 0 ? '0.0' : `${directionLabel} ${Math.abs(absoluteChange).toFixed(1)}`,
      changeKind: 'ABSOLUTE' as const,
      directionLabel,
    };
  }

  if (definition.unit === 'RATING' || percentageChange === null) {
    return {
      currentValue: formatValue(currentValue, definition.unit),
      priorValue: formatValue(priorValue, definition.unit),
      change: formatSigned(absoluteChange, definition.unit === 'RATING' ? 2 : 1),
      changeKind: 'ABSOLUTE' as const,
      directionLabel,
    };
  }

  return {
    currentValue: formatValue(currentValue, definition.unit),
    priorValue: formatValue(priorValue, definition.unit),
    change: `${formatSigned(percentageChange, 1)}%`,
    changeKind: 'PERCENTAGE' as const,
    directionLabel,
  };
}

function formatValue(value: number | null, unit: MetricDefinition['unit']): string {
  if (value === null) return unavailable;
  if (unit === 'COUNT')
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
  if (unit === 'PERCENTAGE') return `${value.toFixed(2)}%`;
  if (unit === 'AVERAGE_POSITION') return value.toFixed(1);
  if (unit === 'RATING') return value.toFixed(2);
  if (unit === 'DURATION_SECONDS') return `${value.toFixed(1)} s`;
  if (unit === 'PERCENTAGE_POINT') return `${value.toFixed(2)} pp`;
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
}

function formatSigned(value: number, digits: number): string {
  if (value === 0) return value.toFixed(digits);
  return `${value > 0 ? '+' : '\u2212'}${Math.abs(value).toFixed(digits)}`;
}
