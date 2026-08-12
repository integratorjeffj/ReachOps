import { z } from 'zod';
import {
  DataQualityFlagSchema,
  EvidenceIdSchema,
  QualityStatusSchema,
  SourceModeSchema,
} from './metrics';

const StableKeySchema = z.string().regex(/^[a-z][a-z0-9_.-]*$/);

export const ObservationPrioritySchema = z.enum(['HIGH', 'MEDIUM', 'OPPORTUNITY']);
export type ObservationPriority = z.infer<typeof ObservationPrioritySchema>;

export const ObservationCandidateSchema = z
  .object({
    id: z.string().regex(/^OC-[A-Z0-9-]+$/),
    idempotencyKey: z.string().min(1).max(240),
    ruleKey: StableKeySchema,
    ruleVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    window: z
      .object({
        start: z.iso.datetime({ offset: true }),
        end: z.iso.datetime({ offset: true }),
        timezone: z.string().min(1).max(80),
      })
      .strict(),
    priority: ObservationPrioritySchema,
    title: z.string().min(1).max(180),
    summary: z.string().min(1).max(500),
    evidenceIds: z.array(EvidenceIdSchema).min(1),
    sourceModes: z.array(SourceModeSchema).min(1),
    inputs: z
      .array(
        z
          .object({
            evidenceId: EvidenceIdSchema,
            metricStableKey: StableKeySchema,
            currentValue: z.number().finite(),
            priorValue: z.number().finite(),
            absoluteChange: z.number().finite(),
            percentageChange: z.number().finite().nullable(),
            percentagePointChange: z.number().finite().nullable(),
            displayChange: z.string().min(1),
          })
          .strict(),
      )
      .min(1),
    severityFactors: z
      .array(
        z
          .object({
            key: StableKeySchema,
            observed: z.number().finite(),
            operator: z.enum(['GTE', 'GT', 'LTE', 'LT', 'EQ']),
            threshold: z.number().finite(),
            passed: z.boolean(),
          })
          .strict(),
      )
      .min(1),
    quality: z
      .object({
        status: QualityStatusSchema,
        flags: z.array(DataQualityFlagSchema),
      })
      .strict(),
    causalClaim: z.literal(false),
  })
  .strict();
export type ObservationCandidate = z.infer<typeof ObservationCandidateSchema>;

export const ObservationRuleEvaluationSchema = z
  .object({
    ruleKey: StableKeySchema,
    ruleVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    emitted: z.boolean(),
    blockedReasons: z.array(
      z.enum([
        'MISSING_INPUT',
        'MINIMUM_VOLUME',
        'PARTIAL_SOURCE',
        'STALE_SOURCE',
        'INVALID_SOURCE',
        'CONDITIONS_NOT_MET',
      ]),
    ),
  })
  .strict();
export type ObservationRuleEvaluation = z.infer<typeof ObservationRuleEvaluationSchema>;

export const ObservationGenerationResultSchema = z
  .object({
    candidates: z.array(ObservationCandidateSchema),
    evaluations: z.array(ObservationRuleEvaluationSchema),
  })
  .strict();
export type ObservationGenerationResult = z.infer<typeof ObservationGenerationResultSchema>;
