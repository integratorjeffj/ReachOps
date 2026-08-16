import { z } from 'zod';
import { ObservationCandidateSchema, ObservationRuleEvaluationSchema } from './insights';
import { AdapterCapabilitySchema } from './integrations';
import { EvidenceIdSchema, SourceModeSchema, SourceProviderSchema } from './metrics';
import { OverviewResponseSchema } from './overview';

/**
 * The demo snapshot is the build-time output of the same deterministic services the API uses.
 * It exists so the published static demonstration can render the full Summit & Sage workspace
 * without a database, while remaining byte-reproducible from the committed fixtures.
 */

const IdentifierSchema = z.string().trim().min(1).max(160);
const InstantSchema = z.iso.datetime({ offset: true });
const NullableInstantSchema = InstantSchema.nullable();

export const DemoWindowSchema = z
  .object({
    start: InstantSchema,
    end: InstantSchema,
    timezone: z.string().trim().min(1).max(80),
  })
  .strict();

export const DemoConnectionSchema = z
  .object({
    connectionId: IdentifierSchema,
    provider: SourceProviderSchema,
    mode: SourceModeSchema,
    status: z.enum(['DISCONNECTED', 'CONNECTED', 'STALE', 'PARTIAL', 'ERROR']),
    displayName: z.string().trim().min(1).max(160),
    resourceName: z.string().trim().min(1).max(160),
    resourceType: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
    nativeId: z.string().trim().min(1).max(250),
    scopes: z.array(z.string().trim().min(1).max(120)),
    capabilities: z.array(AdapterCapabilitySchema),
    lastSyncedAt: NullableInstantSchema,
    syncWindow: DemoWindowSchema,
    observationCount: z.number().int().min(0),
    metricKeys: z.array(z.string().trim().min(1).max(120)),
    liveCapable: z.boolean(),
    authorizationNote: z.string().trim().min(1).max(500),
  })
  .strict();
export type DemoConnection = z.infer<typeof DemoConnectionSchema>;

export const DemoReviewSchema = z
  .object({
    id: IdentifierSchema,
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    rating: z.number().min(1).max(5),
    excerpt: z.string().trim().min(1).max(1_000),
    theme: z.string().trim().min(1).max(120),
    responseState: z.string().trim().min(1).max(120),
    documented: z.boolean(),
  })
  .strict();
export type DemoReview = z.infer<typeof DemoReviewSchema>;

export const DemoRecommendationSchema = z
  .object({
    id: IdentifierSchema,
    observationId: IdentifierSchema,
    ruleKey: z.string().regex(/^[a-z][a-z0-9_.-]*$/),
    title: z.string().trim().min(1).max(200),
    rationale: z.string().trim().min(1).max(1_000),
    evidenceIds: z.array(EvidenceIdSchema).min(1),
    decision: z.enum(['PENDING', 'APPROVED', 'DECLINED']),
    decidedBy: z.string().trim().min(1).max(120).nullable(),
    decidedAt: NullableInstantSchema,
    linkedActionId: IdentifierSchema.nullable(),
  })
  .strict();
export type DemoRecommendation = z.infer<typeof DemoRecommendationSchema>;

export const DemoActionSchema = z
  .object({
    id: IdentifierSchema,
    decidedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    trigger: z.string().trim().min(1).max(300),
    title: z.string().trim().min(1).max(200),
    owner: z.string().trim().min(1).max(120),
    status: z.enum(['COMPLETED', 'IN_PROGRESS', 'APPROVED', 'MONITORING']),
    note: z.string().trim().min(1).max(500),
    evidenceIds: z.array(EvidenceIdSchema),
    observationId: IdentifierSchema.nullable(),
    dueOn: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable(),
    current: z.boolean(),
  })
  .strict();
export type DemoAction = z.infer<typeof DemoActionSchema>;

export const DemoActivityEventSchema = z
  .object({
    id: IdentifierSchema,
    occurredAt: InstantSchema,
    actorType: z.enum(['SYSTEM', 'HUMAN', 'AI']),
    actorName: z.string().trim().min(1).max(120),
    eventType: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
    entityType: z.string().trim().min(1).max(80),
    entityId: IdentifierSchema,
    summary: z.string().trim().min(1).max(500),
    evidenceIds: z.array(EvidenceIdSchema),
  })
  .strict();
export type DemoActivityEvent = z.infer<typeof DemoActivityEventSchema>;

export const DemoWeeklyReviewSchema = z
  .object({
    window: DemoWindowSchema,
    ruleVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    observations: z.array(ObservationCandidateSchema),
    evaluations: z.array(ObservationRuleEvaluationSchema),
    recommendations: z.array(DemoRecommendationSchema),
    reviewThemes: z.array(
      z
        .object({
          theme: z.string().trim().min(1).max(120),
          count: z.number().int().min(0),
          minimumCount: z.number().int().min(1),
          meetsThreshold: z.boolean(),
        })
        .strict(),
    ),
  })
  .strict();
export type DemoWeeklyReview = z.infer<typeof DemoWeeklyReviewSchema>;

export const DemoSnapshotSchema = z
  .object({
    snapshotVersion: z.literal(1),
    datasetVersion: z.string().trim().min(1).max(80),
    workspaceSlug: IdentifierSchema,
    generatedFromFixtures: z.literal(true),
    overview: OverviewResponseSchema,
    weeklyReview: DemoWeeklyReviewSchema,
    actions: z.array(DemoActionSchema),
    connections: z.array(DemoConnectionSchema),
    activity: z.array(DemoActivityEventSchema),
    reviews: z.array(DemoReviewSchema),
  })
  .strict();
export type DemoSnapshot = z.infer<typeof DemoSnapshotSchema>;
