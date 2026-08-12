import { z } from 'zod';
import {
  DataQualityFlagSchema,
  EvidenceIdSchema,
  MetricDefinitionSchema,
  MetricDimensionsSchema,
  ObservationPeriodSchema,
  QualityStatusSchema,
  SourceModeSchema,
  SourceProviderSchema,
} from './metrics';

export const AdapterCapabilitySchema = z.enum(['METRICS', 'CONTENT', 'IMPORT']);
export type AdapterCapability = z.infer<typeof AdapterCapabilitySchema>;

export const SourceResourceSchema = z
  .object({
    nativeId: z.string().trim().min(1).max(250),
    displayName: z.string().trim().min(1).max(160),
    resourceType: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
  })
  .strict();
export type SourceResource = z.infer<typeof SourceResourceSchema>;

export const ConnectionHealthSchema = z
  .object({
    status: z.enum(['CONNECTED', 'STALE', 'PARTIAL', 'ERROR']),
    checkedAt: z.iso.datetime({ offset: true }),
    safeMessage: z.string().trim().min(1).max(500),
  })
  .strict();
export type ConnectionHealth = z.infer<typeof ConnectionHealthSchema>;

export const SyncRequestSchema = z
  .object({
    resourceNativeId: z.string().trim().min(1).max(250),
    windowStart: z.iso.datetime({ offset: true }),
    windowEnd: z.iso.datetime({ offset: true }),
    timezone: z.string().trim().min(1).max(80),
    retrievedAt: z.iso.datetime({ offset: true }),
  })
  .strict()
  .superRefine((request, context) => {
    if (Date.parse(request.windowEnd) < Date.parse(request.windowStart)) {
      context.addIssue({
        code: 'custom',
        message: 'Sync window end must not precede its start.',
        path: ['windowEnd'],
      });
    }
  });
export type SyncRequest = z.infer<typeof SyncRequestSchema>;

export const NormalizedObservationSchema = z
  .object({
    evidenceId: EvidenceIdSchema,
    metricStableKey: z.string().regex(/^[a-z][a-z0-9_.-]*$/),
    period: ObservationPeriodSchema,
    value: z.number().finite(),
    dimensions: MetricDimensionsSchema,
    retrievedAt: z.iso.datetime({ offset: true }),
    quality: z
      .object({
        status: QualityStatusSchema,
        flags: z.array(DataQualityFlagSchema),
        coverageNote: z.string().trim().min(1).max(500).nullable(),
      })
      .strict(),
  })
  .strict();
export type NormalizedObservation = z.infer<typeof NormalizedObservationSchema>;

export const NormalizedContentItemSchema = z
  .object({
    nativeId: z.string().trim().min(1).max(250),
    type: z.enum(['PAGE', 'QUERY', 'POST', 'PROFILE', 'REVIEW', 'OTHER']),
    title: z.string().trim().min(1).max(250),
    canonicalUrl: z.url().nullable(),
    text: z.string().max(1_000).nullable(),
    trust: z.enum(['SOURCE_METADATA', 'UNTRUSTED_EXTERNAL']),
    attributes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
    firstSeenAt: z.iso.datetime({ offset: true }),
    lastSeenAt: z.iso.datetime({ offset: true }),
  })
  .strict();
export type NormalizedContentItem = z.infer<typeof NormalizedContentItemSchema>;

export const ImportProvenanceSchema = z
  .object({
    originalFileName: z.string().trim().min(1).max(250),
    fileHash: z.string().regex(/^sha256:[a-f0-9]{64}$/),
    schemaVersion: z.string().trim().min(1).max(40),
    totalRowCount: z.number().int().nonnegative(),
    acceptedRowCount: z.number().int().nonnegative(),
    rejectedRowCount: z.number().int().nonnegative(),
    validationSummary: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  })
  .strict()
  .refine(
    ({ acceptedRowCount, rejectedRowCount, totalRowCount }) =>
      acceptedRowCount + rejectedRowCount <= totalRowCount,
    { message: 'Accepted and rejected rows cannot exceed total rows.' },
  );
export type ImportProvenance = z.infer<typeof ImportProvenanceSchema>;

export const NormalizedBatchSchema = z
  .object({
    provider: SourceProviderSchema,
    mode: SourceModeSchema,
    resourceNativeId: z.string().trim().min(1).max(250),
    retrievedAt: z.iso.datetime({ offset: true }),
    capabilities: z.array(AdapterCapabilitySchema).min(1),
    metricDefinitions: z.array(MetricDefinitionSchema),
    observations: z.array(NormalizedObservationSchema),
    contentItems: z.array(NormalizedContentItemSchema),
    importProvenance: ImportProvenanceSchema.nullable(),
    warnings: z.array(z.string().trim().min(1).max(500)),
  })
  .strict()
  .superRefine((batch, context) => {
    if (batch.mode === 'IMPORTED' && batch.importProvenance === null) {
      context.addIssue({
        code: 'custom',
        message: 'Imported batches require import provenance.',
        path: ['importProvenance'],
      });
    }
    if (batch.mode !== 'IMPORTED' && batch.importProvenance !== null) {
      context.addIssue({
        code: 'custom',
        message: 'Only imported batches may contain import provenance.',
        path: ['importProvenance'],
      });
    }

    const definitionKeys = new Set(batch.metricDefinitions.map(({ stableKey }) => stableKey));
    if (definitionKeys.size !== batch.metricDefinitions.length) {
      context.addIssue({
        code: 'custom',
        message: 'Metric definition stable keys must be unique within a batch.',
        path: ['metricDefinitions'],
      });
    }
    batch.observations.forEach((observation, index) => {
      if (!definitionKeys.has(observation.metricStableKey)) {
        context.addIssue({
          code: 'custom',
          message: 'Observation references an unknown metric definition.',
          path: ['observations', index, 'metricStableKey'],
        });
      }
    });

    const evidenceIds = new Set(batch.observations.map(({ evidenceId }) => evidenceId));
    if (evidenceIds.size !== batch.observations.length) {
      context.addIssue({
        code: 'custom',
        message: 'Observation evidence IDs must be unique within a batch.',
        path: ['observations'],
      });
    }
  });
export type NormalizedBatch = z.infer<typeof NormalizedBatchSchema>;
