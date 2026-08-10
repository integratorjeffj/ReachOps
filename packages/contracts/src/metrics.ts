import { z } from 'zod';

export const SourceModeSchema = z.enum(['LIVE', 'SIMULATED', 'IMPORTED']);
export type SourceMode = z.infer<typeof SourceModeSchema>;

export const SourceProviderSchema = z.enum([
  'GA4',
  'SEARCH_CONSOLE',
  'GBP_SIMULATED',
  'LINKEDIN_IMPORT',
  'META_SIMULATED',
]);
export type SourceProvider = z.infer<typeof SourceProviderSchema>;

export const MetricFamilySchema = z.enum([
  'EXPOSURE',
  'ENGAGEMENT',
  'SITE_VISIT',
  'CONVERSION_EVENT',
  'REVIEW',
  'COST',
]);
export type MetricFamily = z.infer<typeof MetricFamilySchema>;

export const MetricUnitSchema = z.enum([
  'COUNT',
  'PERCENTAGE',
  'PERCENTAGE_POINT',
  'CURRENCY',
  'DURATION_SECONDS',
  'AVERAGE_POSITION',
]);
export type MetricUnit = z.infer<typeof MetricUnitSchema>;

export const AggregationBehaviorSchema = z.enum([
  'ADDITIVE',
  'NON_ADDITIVE',
  'RATE',
  'AVERAGE',
  'CUMULATIVE',
]);
export type AggregationBehavior = z.infer<typeof AggregationBehaviorSchema>;

export const ObservationGrainSchema = z.enum(['DAY', 'WEEK', 'MONTH']);
export type ObservationGrain = z.infer<typeof ObservationGrainSchema>;

export const QualityStatusSchema = z.enum(['COMPLETE', 'PARTIAL', 'STALE', 'INVALID']);
export type QualityStatus = z.infer<typeof QualityStatusSchema>;

export const DataQualityFlagSchema = z.enum([
  'MISSING_DATES',
  'SMALL_DENOMINATOR',
  'THRESHOLDED',
  'TOP_ROWS_ONLY',
  'LATE_REVISION_WINDOW',
  'TRACKING_CHANGE',
  'STALE_SOURCE',
  'PARTIAL_SYNC',
]);
export type DataQualityFlag = z.infer<typeof DataQualityFlagSchema>;

export const EvidenceIdSchema = z
  .string()
  .regex(/^EV-[A-Z0-9][A-Z0-9-]*$/, 'Evidence IDs must use the EV-* namespace.');
export type EvidenceId = z.infer<typeof EvidenceIdSchema>;

const StableIdSchema = z.string().trim().min(1).max(120);
const NativeMetricNameSchema = z.string().trim().min(1).max(180);

export const MetricDefinitionSchema = z
  .object({
    stableKey: StableIdSchema.regex(/^[a-z][a-z0-9_.-]*$/),
    provider: SourceProviderSchema,
    nativeName: NativeMetricNameSchema,
    displayName: z.string().trim().min(1).max(120),
    family: MetricFamilySchema,
    unit: MetricUnitSchema,
    aggregationBehavior: AggregationBehaviorSchema,
    description: z.string().trim().min(1).max(500),
    comparabilityNotes: z.string().trim().min(1).max(500),
    lowerIsBetter: z.boolean().default(false),
  })
  .strict();
export type MetricDefinition = z.infer<typeof MetricDefinitionSchema>;

export const MetricDimensionsSchema = z.record(
  z.string().regex(/^[a-z][a-z0-9_]*$/),
  z.string().trim().min(1).max(250),
);
export type MetricDimensions = z.infer<typeof MetricDimensionsSchema>;

export const ObservationPeriodSchema = z
  .object({
    start: z.iso.datetime({ offset: true }),
    end: z.iso.datetime({ offset: true }),
    timezone: z.string().trim().min(1).max(80),
    grain: ObservationGrainSchema,
  })
  .strict()
  .superRefine((period, context) => {
    if (Date.parse(period.end) < Date.parse(period.start)) {
      context.addIssue({
        code: 'custom',
        message: 'Observation period end must not precede start.',
        path: ['end'],
      });
    }
  });
export type ObservationPeriod = z.infer<typeof ObservationPeriodSchema>;

export const MetricObservationSchema = z
  .object({
    evidenceId: EvidenceIdSchema,
    workspaceId: StableIdSchema,
    connectionId: StableIdSchema,
    resourceId: StableIdSchema,
    sourceMode: SourceModeSchema,
    definition: MetricDefinitionSchema,
    period: ObservationPeriodSchema,
    value: z.number().finite(),
    dimensions: MetricDimensionsSchema,
    retrievedAt: z.iso.datetime({ offset: true }),
    syncRunId: StableIdSchema,
    quality: z
      .object({
        status: QualityStatusSchema,
        flags: z.array(DataQualityFlagSchema),
        coverageNote: z.string().trim().min(1).max(500).nullable(),
      })
      .strict(),
  })
  .strict();
export type MetricObservation = z.infer<typeof MetricObservationSchema>;

export const ComparisonDirectionSchema = z.enum(['UP', 'DOWN', 'FLAT', 'UNAVAILABLE']);
export type ComparisonDirection = z.infer<typeof ComparisonDirectionSchema>;

export const MetricComparisonSchema = z
  .object({
    metricStableKey: StableIdSchema,
    unit: MetricUnitSchema,
    currentEvidenceId: EvidenceIdSchema,
    priorEvidenceId: EvidenceIdSchema,
    sourceModes: z.array(SourceModeSchema).min(1),
    currentValue: z.number().finite(),
    priorValue: z.number().finite(),
    absoluteChange: z.number().finite(),
    percentageChange: z.number().finite().nullable(),
    percentagePointChange: z.number().finite().nullable(),
    direction: ComparisonDirectionSchema,
    qualityStatus: QualityStatusSchema,
    qualityFlags: z.array(DataQualityFlagSchema),
  })
  .strict()
  .superRefine((comparison, context) => {
    const isRate = comparison.unit === 'PERCENTAGE';
    if (isRate && comparison.percentagePointChange === null) {
      context.addIssue({
        code: 'custom',
        message: 'Percentage metrics require an explicit percentage-point change.',
        path: ['percentagePointChange'],
      });
    }
    if (!isRate && comparison.percentagePointChange !== null) {
      context.addIssue({
        code: 'custom',
        message: 'Only percentage metrics may report percentage-point change.',
        path: ['percentagePointChange'],
      });
    }
  });
export type MetricComparison = z.infer<typeof MetricComparisonSchema>;
