import { z } from 'zod';
import { DemoAiWorkspaceSchema } from './ai-search';
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

/**
 * A metric compared across the two reporting periods.
 *
 * Both evidence identifiers travel with the numbers so any surface rendering a page or query row
 * can open the same provenance the Command Center cites, rather than restating a value it cannot
 * substantiate.
 */
export const DemoComparedMetricSchema = z
  .object({
    metricStableKey: z.string().trim().min(1).max(120),
    label: z.string().trim().min(1).max(120),
    unit: z.string().trim().min(1).max(40),
    current: z.number().finite(),
    prior: z.number().finite(),
    evidenceId: EvidenceIdSchema,
    priorEvidenceId: EvidenceIdSchema,
    changeAbsolute: z.number().finite(),
    changePercent: z.number().finite().nullable(),
    display: z.string().trim().min(1).max(60),
    lowerIsBetter: z.boolean(),
  })
  .strict();
export type DemoComparedMetric = z.infer<typeof DemoComparedMetricSchema>;

const DemoMonthlyPointSchema = z
  .object({
    period: z.string().regex(/^\d{4}-\d{2}$/),
    value: z.number().finite(),
    evidenceId: EvidenceIdSchema,
  })
  .strict();

export const DemoSearchPageSchema = z
  .object({
    key: IdentifierSchema,
    path: z.string().trim().min(1).max(200),
    shortLabel: z.string().trim().min(1).max(80),
    title: z.string().trim().min(1).max(200),
    metaDescription: z.string().trim().min(1).max(400),
    serviceLine: z.enum(['AIR_CONDITIONING', 'WATER_HEATERS', 'PLUMBING', 'ELECTRICAL', 'COMPANY']),
    metrics: z.array(DemoComparedMetricSchema),
    /** Present only where a page carries a narrative worth charting. */
    monthlyClicks: z.array(DemoMonthlyPointSchema).nullable(),
  })
  .strict();
export type DemoSearchPage = z.infer<typeof DemoSearchPageSchema>;

export const DemoSearchQuerySchema = z
  .object({
    key: IdentifierSchema,
    query: z.string().trim().min(1).max(200),
    intent: z.enum(['INFORMATIONAL', 'COMMERCIAL', 'TRANSACTIONAL', 'NAVIGATIONAL']),
    branded: z.boolean(),
    landingPageKey: IdentifierSchema,
    landingPagePath: z.string().trim().min(1).max(200),
    metrics: z.array(DemoComparedMetricSchema),
  })
  .strict();
export type DemoSearchQuery = z.infer<typeof DemoSearchQuerySchema>;

/**
 * Search Console withholds anonymised queries and thresholds low-volume rows, so page and query
 * totals legitimately fall short of the property total. The shortfall is published rather than
 * hidden so a reader is never invited to add rows up and conclude data is missing.
 */
export const DemoSearchCoverageSchema = z
  .object({
    propertyClicks: z.number().finite(),
    propertyImpressions: z.number().finite(),
    pageClicks: z.number().finite(),
    pageImpressions: z.number().finite(),
    queryClicks: z.number().finite(),
    queryImpressions: z.number().finite(),
    pageClickCoveragePercent: z.number().finite(),
    queryClickCoveragePercent: z.number().finite(),
    note: z.string().trim().min(1).max(500),
  })
  .strict();
export type DemoSearchCoverage = z.infer<typeof DemoSearchCoverageSchema>;

export const DemoSeoIssueSchema = z
  .object({
    id: IdentifierSchema,
    type: z.enum([
      'INDEXABILITY',
      'CANONICAL',
      'ROBOTS',
      'SITEMAP',
      'STATUS_4XX',
      'STATUS_5XX',
      'REDIRECT_CHAIN',
      'MISSING_TITLE',
      'DUPLICATE_TITLE',
      'MISSING_META_DESCRIPTION',
      'DUPLICATE_META_DESCRIPTION',
      'HEADING_HIERARCHY',
      'BROKEN_INTERNAL_LINK',
      'WEAK_INTERNAL_LINKING',
      'STRUCTURED_DATA',
      'MOBILE_PERFORMANCE',
      'CORE_WEB_VITALS',
    ]),
    typeLabel: z.string().trim().min(1).max(80),
    severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
    status: z.enum(['OPEN', 'FIXED_PENDING_VALIDATION', 'VALIDATED', 'WONT_FIX']),
    title: z.string().trim().min(1).max(200),
    detail: z.string().trim().min(1).max(1_000),
    affectedPaths: z.array(z.string().trim().min(1).max(200)).min(1),
    detectedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    fixGuidance: z.string().trim().min(1).max(500),
    opportunityId: IdentifierSchema.nullable(),
    opportunityTitle: z.string().trim().min(1).max(200).nullable(),
  })
  .strict();
export type DemoSeoIssue = z.infer<typeof DemoSeoIssueSchema>;

/** One metric with the boundary it is judged against, so no rating is unexplainable. */
const DemoVitalSchema = z
  .object({
    metric: z.enum(['LCP', 'INP', 'CLS']),
    label: z.string().trim().min(1).max(80),
    value: z.number().finite(),
    priorValue: z.number().finite().nullable(),
    /** Empty for Cumulative Layout Shift, which is a ratio and genuinely carries no unit. */
    unit: z.string().trim().max(12),
    rating: z.enum(['GOOD', 'NEEDS_IMPROVEMENT', 'POOR']),
    goodAtOrBelow: z.number().finite(),
    poorAbove: z.number().finite(),
    crossedThreshold: z.boolean(),
  })
  .strict();

export const DemoVitalsRowSchema = z
  .object({
    pageKey: IdentifierSchema,
    pagePath: z.string().trim().min(1).max(200),
    pageLabel: z.string().trim().min(1).max(80),
    formFactor: z.enum(['MOBILE', 'DESKTOP']),
    source: z.enum(['FIELD', 'LAB']),
    vitals: z.array(DemoVitalSchema).length(3),
  })
  .strict();
export type DemoVitalsRow = z.infer<typeof DemoVitalsRowSchema>;

export const DemoTechnicalWorkspaceSchema = z
  .object({
    audit: z
      .object({
        id: IdentifierSchema,
        siteLabel: z.string().trim().min(1).max(160),
        crawlMode: z.literal('SIMULATED'),
        crawledAt: InstantSchema,
        status: z.literal('COMPLETE'),
        pagesCrawled: z.number().int().min(0),
        checksRun: z.number().int().min(0),
        provenanceNote: z.string().trim().min(1).max(500),
      })
      .strict(),
    issues: z.array(DemoSeoIssueSchema),
    vitals: z.array(DemoVitalsRowSchema),
    fieldWindow: z
      .object({
        start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        days: z.number().int().min(1),
        note: z.string().trim().min(1).max(600),
      })
      .strict(),
    labNote: z.string().trim().min(1).max(500),
  })
  .strict();
export type DemoTechnicalWorkspace = z.infer<typeof DemoTechnicalWorkspaceSchema>;

export const DemoSearchWorkspaceSchema = z
  .object({
    pages: z.array(DemoSearchPageSchema),
    queries: z.array(DemoSearchQuerySchema),
    coverage: DemoSearchCoverageSchema,
    technical: DemoTechnicalWorkspaceSchema,
    ai: DemoAiWorkspaceSchema,
  })
  .strict();
export type DemoSearchWorkspace = z.infer<typeof DemoSearchWorkspaceSchema>;

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

const DemoOutcomeWindowSchema = z
  .object({
    label: z.string().trim().min(1).max(80),
    periodStart: z.string().regex(/^\d{4}-\d{2}$/),
    periodEnd: z.string().regex(/^\d{4}-\d{2}$/),
    value: z.number().finite(),
    evidenceIds: z.array(EvidenceIdSchema).min(1),
  })
  .strict();

/**
 * What happened after a piece of work was completed.
 *
 * The baseline window is captured when monitoring begins and stored as explicit period bounds, so
 * no later filter change can move the line the work is judged against. A measured difference is
 * reported as a measured difference; nothing here promotes it to a cause, and where a competing
 * explanation exists it is named rather than omitted.
 */
export const DemoOutcomeMeasurementSchema = z
  .object({
    id: IdentifierSchema,
    actionId: IdentifierSchema,
    title: z.string().trim().min(1).max(200),
    plannedContentId: IdentifierSchema.nullable(),
    metricStableKey: z.string().trim().min(1).max(120),
    metricLabel: z.string().trim().min(1).max(120),
    unit: z.string().trim().min(1).max(40),
    /**
     * MEASURED has both windows. GATHERING is still waiting for the follow-up window to close.
     * NOT_MEASURABLE means no metric was ever persisted for what the work changed, which is a
     * more honest answer than a number that does not mean anything.
     */
    status: z.enum(['MEASURED', 'GATHERING', 'NOT_MEASURABLE']),
    implementationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    baseline: DemoOutcomeWindowSchema.nullable(),
    followUp: DemoOutcomeWindowSchema.nullable(),
    absoluteChange: z.number().finite().nullable(),
    relativeChangePercent: z.number().finite().nullable(),
    assessment: z.string().trim().min(1).max(400),
    /** Competing explanations that would survive even if the work had not happened. */
    confounders: z.array(z.string().trim().min(1).max(400)),
    caveat: z.string().trim().min(1).max(400),
  })
  .strict();
export type DemoOutcomeMeasurement = z.infer<typeof DemoOutcomeMeasurementSchema>;

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
    outcomes: z.array(DemoOutcomeMeasurementSchema),
  })
  .strict();
export type DemoSnapshot = z.infer<typeof DemoSnapshotSchema>;

/**
 * Page- and query-level search data, published separately from the core snapshot.
 *
 * Only the Search workspace needs these rows, and there are far more of them than everything else
 * combined. Keeping them in their own module means the Command Center and Work do not pay for
 * evidence they never cite.
 */
export const DemoSearchSnapshotSchema = z
  .object({
    snapshotVersion: z.literal(1),
    datasetVersion: z.string().trim().min(1).max(80),
    search: DemoSearchWorkspaceSchema,
    evidence: z.array(DemoEvidenceRecordSchema),
  })
  .strict();
export type DemoSearchSnapshot = z.infer<typeof DemoSearchSnapshotSchema>;

/**
 * Social platforms do not share a metric vocabulary.
 *
 * Instagram and Facebook report accounts reached; LinkedIn reports impressions and has no reach
 * concept, so its posts carry null rather than a substitute. Engagement rate is therefore computed
 * against a different denominator per platform, and the basis travels with the number so no
 * surface can quietly compare the two.
 */
export const DemoSocialPlatformSchema = z
  .object({
    platform: z.enum(['INSTAGRAM', 'FACEBOOK', 'LINKEDIN']),
    displayName: z.string().trim().min(1).max(80),
    connectionId: IdentifierSchema,
    sourceMode: SourceModeSchema,
    reportsReach: z.boolean(),
    engagementRateBasis: z.enum(['REACH', 'IMPRESSIONS']),
    note: z.string().trim().min(1).max(400),
  })
  .strict();
export type DemoSocialPlatform = z.infer<typeof DemoSocialPlatformSchema>;

export const DemoSocialPostSchema = z
  .object({
    id: IdentifierSchema,
    platform: z.enum(['INSTAGRAM', 'FACEBOOK', 'LINKEDIN']),
    publishedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    campaignStableKey: IdentifierSchema.nullable(),
    pillar: z.string().trim().min(1).max(80),
    format: z.enum(['REEL', 'STATIC', 'CAROUSEL', 'VIDEO', 'TEXT', 'LINK']),
    technicianLed: z.boolean(),
    caption: z.string().trim().min(1).max(300),
    sourceMode: SourceModeSchema,
    reach: z.number().finite().nullable(),
    impressions: z.number().finite(),
    engagements: z.number().finite(),
    linkClicks: z.number().finite(),
    siteSessions: z.number().finite(),
    engagementRate: z.number().finite(),
    engagementRateBasis: z.enum(['REACH', 'IMPRESSIONS']),
    /** Rank against this account's own history on the same platform, never a cross-account claim. */
    performancePercentile: z.number().int().min(0).max(100),
    percentileBasis: z.enum(['REACH', 'IMPRESSIONS']),
  })
  .strict();
export type DemoSocialPost = z.infer<typeof DemoSocialPostSchema>;

/**
 * A pattern the fixtures actually produce.
 *
 * The multiple is computed from the posts rather than asserted, and an insight is only published
 * when enough posts support it. If the data stops showing the pattern, the claim disappears.
 */
export const DemoSocialInsightSchema = z
  .object({
    key: IdentifierSchema,
    platform: z.enum(['INSTAGRAM', 'FACEBOOK', 'LINKEDIN']),
    text: z.string().trim().min(1).max(400),
    multiple: z.number().finite(),
    metric: z.string().trim().min(1).max(80),
    windowStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    sampleSize: z.number().int().min(0),
    comparisonSampleSize: z.number().int().min(0),
    caveat: z.string().trim().min(1).max(400),
  })
  .strict();
export type DemoSocialInsight = z.infer<typeof DemoSocialInsightSchema>;

export const DemoSocialWorkspaceSchema = z
  .object({
    platforms: z.array(DemoSocialPlatformSchema),
    posts: z.array(DemoSocialPostSchema),
    insights: z.array(DemoSocialInsightSchema),
    /** Account-level weekly comparisons, the inspectable evidence behind the workspace KPIs. */
    accountTotals: z.array(DemoComparedMetricSchema),
    recentWindowStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    reconciliationNote: z.string().trim().min(1).max(500),
  })
  .strict();
export type DemoSocialWorkspace = z.infer<typeof DemoSocialWorkspaceSchema>;

export const DemoSocialSnapshotSchema = z
  .object({
    snapshotVersion: z.literal(1),
    datasetVersion: z.string().trim().min(1).max(80),
    social: DemoSocialWorkspaceSchema,
  })
  .strict();
export type DemoSocialSnapshot = z.infer<typeof DemoSocialSnapshotSchema>;

/**
 * Editorial work a person intends to do.
 *
 * Distinct from `ContentItem`, which records what a provider observed. The pipeline ends at
 * PLANNED rather than "scheduled" because ReachOps never writes to a provider, and
 * `externallyScheduled` stays false for the same reason.
 */
export const DemoPlannedContentSchema = z
  .object({
    id: IdentifierSchema,
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().min(1).max(1_000),
    type: z.enum([
      'ARTICLE',
      'SERVICE_PAGE_UPDATE',
      'SEO_REFRESH',
      'SOCIAL_POST',
      'GBP_POST',
      'CAMPAIGN_ASSET',
    ]),
    status: z.enum(['IDEA', 'BRIEF', 'DRAFT', 'REVIEW', 'APPROVED', 'PLANNED', 'PUBLISHED']),
    channel: z.enum(['WEBSITE', 'INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'GBP']),
    ownerName: z.string().trim().min(1).max(120),
    approverName: z.string().trim().min(1).max(120).nullable(),
    goalStableKey: IdentifierSchema.nullable(),
    campaignStableKey: IdentifierSchema.nullable(),
    /** Resolved from the originating rule key, so it survives recommendations being renumbered. */
    opportunityId: IdentifierSchema.nullable(),
    opportunityTitle: z.string().trim().min(1).max(200).nullable(),
    contentPillar: z.string().trim().min(1).max(80),
    objective: z.string().trim().min(1).max(300),
    funnelStage: z.enum(['AWARENESS', 'CONSIDERATION', 'DECISION', 'RETENTION']),
    audience: z.string().trim().min(1).max(200),
    primaryTopic: z.string().trim().min(1).max(160),
    secondaryTopics: z.array(z.string().trim().min(1).max(160)),
    destinationPagePath: z.string().trim().min(1).max(200).nullable(),
    plannedDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable(),
    dueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable(),
    publishedDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable(),
    repurposedFromId: IdentifierSchema.nullable(),
    /** The observed object this became: a search page key or a social post id. */
    publishedRef: IdentifierSchema.nullable(),
    callToAction: z.string().trim().min(1).max(160),
    /** Always false. ReachOps holds no provider write scope of any kind. */
    externallyScheduled: z.literal(false),
    sourceMode: SourceModeSchema,
    /** Past its due date and not yet published, measured against the frozen reference date. */
    overdue: z.boolean(),
  })
  .strict();
export type DemoPlannedContent = z.infer<typeof DemoPlannedContentSchema>;

/**
 * A stretch of an active campaign with nothing planned in it.
 *
 * Derived by walking the remaining campaign window, not authored. If the calendar fills in, the
 * warning disappears on its own rather than needing to be retracted.
 */
export const DemoContentCoverageGapSchema = z
  .object({
    campaignStableKey: IdentifierSchema,
    campaignName: z.string().trim().min(1).max(160),
    gapStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    gapEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    days: z.number().int().min(1),
    campaignEnds: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    note: z.string().trim().min(1).max(400),
  })
  .strict();
export type DemoContentCoverageGap = z.infer<typeof DemoContentCoverageGapSchema>;

export const DemoContentWorkspaceSchema = z
  .object({
    referenceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    pipeline: z.array(
      z.object({
        status: z.enum(['IDEA', 'BRIEF', 'DRAFT', 'REVIEW', 'APPROVED', 'PLANNED', 'PUBLISHED']),
        label: z.string().trim().min(1).max(40),
        count: z.number().int().min(0),
      }),
    ),
    items: z.array(DemoPlannedContentSchema),
    counters: z
      .object({
        dueThisWeek: z.number().int().min(0),
        awaitingApproval: z.number().int().min(0),
        overdue: z.number().int().min(0),
        plannedAhead: z.number().int().min(0),
      })
      .strict(),
    coverageGaps: z.array(DemoContentCoverageGapSchema),
    publishingNote: z.string().trim().min(1).max(400),
  })
  .strict();
export type DemoContentWorkspace = z.infer<typeof DemoContentWorkspaceSchema>;

export const DemoContentSnapshotSchema = z
  .object({
    snapshotVersion: z.literal(1),
    datasetVersion: z.string().trim().min(1).max(80),
    content: DemoContentWorkspaceSchema,
  })
  .strict();
export type DemoContentSnapshot = z.infer<typeof DemoContentSnapshotSchema>;
