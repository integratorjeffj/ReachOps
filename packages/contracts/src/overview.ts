import { z } from 'zod';
import {
  DataQualityFlagSchema,
  EvidenceIdSchema,
  MetricDefinitionSchema,
  QualityStatusSchema,
  SourceModeSchema,
  SourceProviderSchema,
} from './metrics';

const IdentifierSchema = z.string().trim().min(1).max(160);
const NullableInstantSchema = z.iso.datetime({ offset: true }).nullable();

export const OverviewStateSchema = z.enum(['AVAILABLE', 'PARTIAL', 'EMPTY']);
export type OverviewState = z.infer<typeof OverviewStateSchema>;

export const OverviewMetricStateSchema = z.enum([
  'AVAILABLE',
  'PARTIAL',
  'MISSING_CURRENT',
  'MISSING_PRIOR',
  'UNAVAILABLE',
]);
export type OverviewMetricState = z.infer<typeof OverviewMetricStateSchema>;

const OverviewValueSchema = z
  .object({
    evidenceId: EvidenceIdSchema,
    value: z.number().finite(),
    retrievedAt: z.iso.datetime({ offset: true }),
    qualityStatus: QualityStatusSchema,
    qualityFlags: z.array(DataQualityFlagSchema),
  })
  .strict();

const OverviewChangeSchema = z
  .object({
    absolute: z.number().finite(),
    percentage: z.number().finite().nullable(),
    percentagePoints: z.number().finite().nullable(),
    direction: z.enum(['UP', 'DOWN', 'FLAT']),
  })
  .strict();

export const OverviewKpiSchema = z
  .object({
    key: IdentifierSchema,
    label: z.string().trim().min(1).max(120),
    status: OverviewMetricStateSchema,
    definition: MetricDefinitionSchema.nullable(),
    current: OverviewValueSchema.nullable(),
    prior: OverviewValueSchema.nullable(),
    change: OverviewChangeSchema.nullable(),
    sourceModes: z.array(SourceModeSchema),
    coverageNote: z.string().trim().min(1).max(500).nullable(),
  })
  .strict();

export const OverviewGoalSchema = z
  .object({
    stableKey: IdentifierSchema,
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().min(1).max(1_000),
    targetValue: z.number().finite().nullable(),
    targetUnit: z.string().trim().min(1).max(80).nullable(),
    targetDate: NullableInstantSchema,
    status: z.enum(['AVAILABLE', 'PARTIAL', 'UNAVAILABLE']),
    currentValue: z.number().finite().nullable(),
    attainmentPercentage: z.number().finite().nullable(),
    definition: MetricDefinitionSchema.nullable(),
    evidenceId: EvidenceIdSchema.nullable(),
    retrievedAt: NullableInstantSchema,
    sourceMode: SourceModeSchema.nullable(),
  })
  .strict();

export const OverviewSourceCoverageSchema = z
  .object({
    connectionId: IdentifierSchema,
    provider: SourceProviderSchema,
    displayName: z.string().trim().min(1).max(160),
    mode: SourceModeSchema,
    status: z.enum(['DISCONNECTED', 'CONNECTED', 'STALE', 'PARTIAL', 'ERROR']),
    resourceName: z.string().trim().min(1).max(160).nullable(),
    lastSuccessAt: NullableInstantSchema,
    lastSyncedAt: NullableInstantSchema,
  })
  .strict();

const OverviewTrendPointSchema = z
  .object({
    periodStart: z.iso.datetime({ offset: true }),
    periodEnd: z.iso.datetime({ offset: true }),
    value: z.number().finite(),
    evidenceId: EvidenceIdSchema,
    retrievedAt: z.iso.datetime({ offset: true }),
    qualityStatus: QualityStatusSchema,
    sourceMode: SourceModeSchema,
  })
  .strict();

export const OverviewTrendSeriesSchema = z
  .object({
    metricStableKey: IdentifierSchema,
    definition: MetricDefinitionSchema,
    points: z.array(OverviewTrendPointSchema),
  })
  .strict();

const OverviewAnnotationSchema = z
  .object({
    stableKey: IdentifierSchema,
    type: z.enum(['CAMPAIGN', 'DEPLOYMENT', 'OUTAGE', 'WEATHER', 'BUSINESS_CONTEXT']),
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().min(1).max(1_000),
    startsAt: z.iso.datetime({ offset: true }),
    endsAt: NullableInstantSchema,
  })
  .strict();

export const OverviewResponseSchema = z
  .object({
    state: OverviewStateSchema,
    workspace: z
      .object({
        id: IdentifierSchema,
        slug: IdentifierSchema,
        name: z.string().trim().min(1).max(160),
        timezone: z.string().trim().min(1).max(80),
        synthetic: z.boolean(),
        datasetVersion: z.string().trim().min(1).max(80).nullable(),
      })
      .strict(),
    activeWeek: z
      .object({
        start: z.iso.datetime({ offset: true }),
        end: z.iso.datetime({ offset: true }),
        timezone: z.string().trim().min(1).max(80),
      })
      .strict(),
    goals: z.array(OverviewGoalSchema),
    kpis: z.array(OverviewKpiSchema).length(4),
    sourceCoverage: z.array(OverviewSourceCoverageSchema),
    priorities: z
      .array(
        z
          .object({
            position: z.number().int().min(1).max(3),
            status: z.literal('PENDING_ANALYSIS'),
          })
          .strict(),
      )
      .length(3),
    trends: z.array(OverviewTrendSeriesSchema),
    annotations: z.array(OverviewAnnotationSchema),
  })
  .strict();

export type OverviewResponse = z.infer<typeof OverviewResponseSchema>;
