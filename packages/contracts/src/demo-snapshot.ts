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
    /**
     * Whether this connection actually carries performance history. A connection can be
     * authorized and reachable while holding no observations; saying so plainly is the point.
     */
    dataState: z.enum(['ACTIVE', 'NO_HISTORY']),
    dataStateNote: z.string().trim().min(1).max(300),
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

/**
 * A single inspectable evidence record.
 *
 * Business users read the chip; technical users open the drawer. Everything needed to audit a
 * number — its source-native definition, provenance, quality, and lineage — travels with it, so no
 * surface has to re-derive meaning from a bare identifier.
 */
export const DemoEvidenceRecordSchema = z
  .object({
    evidenceId: EvidenceIdSchema,
    provider: SourceProviderSchema,
    sourceMode: SourceModeSchema,
    connectionDisplayName: z.string().trim().min(1).max(160),
    resourceName: z.string().trim().min(1).max(160),
    resourceNativeId: z.string().trim().min(1).max(250),
    metricStableKey: z.string().trim().min(1).max(120),
    metricDisplayName: z.string().trim().min(1).max(120),
    metricDescription: z.string().trim().min(1).max(500),
    comparabilityNotes: z.string().trim().min(1).max(500),
    unit: z.string().trim().min(1).max(40),
    family: z.string().trim().min(1).max(40),
    aggregationBehavior: z.string().trim().min(1).max(40),
    lowerIsBetter: z.boolean(),
    grain: z.enum(['DAY', 'WEEK', 'MONTH']),
    periodStart: InstantSchema,
    periodEnd: InstantSchema,
    timezone: z.string().trim().min(1).max(80),
    value: z.number().finite(),
    priorValue: z.number().finite().nullable(),
    priorEvidenceId: EvidenceIdSchema.nullable(),
    displayChange: z.string().trim().min(1).max(80).nullable(),
    dimensions: z.record(z.string(), z.string()),
    qualityStatus: z.enum(['COMPLETE', 'PARTIAL', 'STALE', 'INVALID']),
    qualityFlags: z.array(z.string()),
    coverageNote: z.string().trim().min(1).max(500).nullable(),
    retrievedAt: InstantSchema,
    syncRunId: IdentifierSchema,
    /** Short human label used on the chip, e.g. "Search Console · Jul 27–Aug 2". */
    chipLabel: z.string().trim().min(1).max(120),
    relatedAnnotationKeys: z.array(IdentifierSchema),
  })
  .strict();
export type DemoEvidenceRecord = z.infer<typeof DemoEvidenceRecordSchema>;

export const OpportunityCategorySchema = z.enum([
  'SEARCH',
  'TECHNICAL_SEO',
  'CONTENT',
  'SOCIAL',
  'LOCAL',
  'AI_SEARCH',
  'CONVERSION',
]);
export type OpportunityCategory = z.infer<typeof OpportunityCategorySchema>;

export const OpportunityImpactSchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const OpportunityEffortSchema = z.enum(['XS', 'S', 'M', 'L']);
export const OpportunityConfidenceSchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);
export const OpportunityUrgencySchema = z.enum([
  'EVERGREEN',
  'THIS_MONTH',
  'THIS_WEEK',
  'IMMEDIATE',
]);
export const OpportunityStatusSchema = z.enum([
  'PROPOSED',
  'ACCEPTED',
  'PLANNED',
  'IN_PROGRESS',
  'MONITORING',
  'COMPLETED',
  'DISMISSED',
]);
export type OpportunityStatus = z.infer<typeof OpportunityStatusSchema>;

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

    // Opportunity fields. Prioritisation stays categorical and explainable; there is deliberately
    // no opaque composite score.
    category: OpportunityCategorySchema,
    status: OpportunityStatusSchema,
    affectedEntity: z.string().trim().min(1).max(200),
    diagnosis: z.string().trim().min(1).max(1_000),
    suggestedChange: z.string().trim().min(1).max(1_000),
    expectedOutcome: z.string().trim().min(1).max(500),
    impact: OpportunityImpactSchema,
    effort: OpportunityEffortSchema,
    /** How strongly the data supports the observation itself. */
    observationConfidence: OpportunityConfidenceSchema,
    /** Confidence in the suggested explanation, when one is offered. Never asserted as cause. */
    causalConfidence: OpportunityConfidenceSchema.nullable(),
    causalHypothesis: z.string().trim().min(1).max(500).nullable(),
    urgency: OpportunityUrgencySchema,
    goalStableKey: IdentifierSchema.nullable(),
    campaignStableKey: IdentifierSchema.nullable(),
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
    reviewOn: z
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
    /** Every evidence record any surface can open, keyed in the UI by evidenceId. */
    evidence: z.array(DemoEvidenceRecordSchema),
  })
  .strict();
export type DemoSnapshot = z.infer<typeof DemoSnapshotSchema>;
