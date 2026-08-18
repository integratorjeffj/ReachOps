import { z } from 'zod';

/**
 * Competitor comparison.
 *
 * The shape enforces the workspace's central distinction: a signal is something a person could
 * confirm by looking, an estimate is something a model produced. They are separate types with
 * separate fields so no rendering path can accidentally present one as the other, and an estimate
 * has no place to put a point value — only a low, a high and the method that produced them.
 *
 * There is no market share, no competitive score and no overall placing, because none of those can
 * be computed from anything observable about a private company.
 */

const CalendarDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const EntityKeySchema = z.string().trim().min(1).max(40);

export const DemoPublicSignalSchema = z
  .object({
    key: EntityKeySchema,
    /** Phrased as a question a person could answer by opening the site. */
    question: z.string().trim().min(1).max(160),
    whyItMatters: z.string().trim().min(1).max(400),
    /** Keyed by competitor key, plus the subject's key. */
    values: z.record(EntityKeySchema, z.boolean()),
    /**
     * How many tracked competitors do this, carried with its denominator.
     *
     * Reported as a count rather than reduced to a "gap" flag, because two of three competitors
     * doing something is a different situation from all three doing it, and collapsing both into
     * one boolean throws away the part a reader needs to judge it.
     */
    competitorsDoingIt: z.number().int().min(0),
    competitorRatioLabel: z.string().regex(/^\d+ of \d+$/),
  })
  .strict();
export type DemoPublicSignal = z.infer<typeof DemoPublicSignalSchema>;

/**
 * A modelled figure.
 *
 * No point value exists on this type by design. A single number would be rendered somewhere as a
 * comparison, and the underlying model cannot support one.
 */
export const DemoCompetitorEstimateSchema = z
  .object({
    metric: z.string().trim().min(1).max(120),
    low: z.number().finite(),
    high: z.number().finite(),
    unit: z.string().trim().min(1).max(40),
    /** How the range was produced. Published so a reader can discount it appropriately. */
    method: z.string().trim().min(1).max(400),
    /** Rendered label, e.g. "1,800–3,900 clicks". Always a range. */
    rangeLabel: z.string().trim().min(1).max(80),
  })
  .strict();
export type DemoCompetitorEstimate = z.infer<typeof DemoCompetitorEstimateSchema>;

export const DemoCompetitorSchema = z
  .object({
    key: EntityKeySchema,
    name: z.string().trim().min(1).max(120),
    positioning: z.string().trim().min(1).max(400),
    reasonTracked: z.string().trim().min(1).max(400),
    publicRating: z.number().finite(),
    publicReviewCount: z.number().int().min(0),
    lastPublishedOn: CalendarDateSchema.nullable(),
    observedOn: CalendarDateSchema,
    /**
     * How many recorded AI checks named this company, counted from the AI panel rather than
     * authored here, so the two workspaces cannot drift apart.
     */
    aiMentionCount: z.number().int().min(0),
    aiMentionLabel: z.string().regex(/^\d+ of \d+ checks$/),
    /** Queries where this competitor appeared alongside the subject in the sampled results. */
    sharedQueries: z.array(z.string().trim().min(1).max(200)),
    estimates: z.array(DemoCompetitorEstimateSchema),
  })
  .strict();
export type DemoCompetitor = z.infer<typeof DemoCompetitorSchema>;

export const DemoCompetitorSubjectSchema = z
  .object({
    key: EntityKeySchema,
    name: z.string().trim().min(1).max(120),
    positioning: z.string().trim().min(1).max(400),
    publicRating: z.number().finite(),
    publicReviewCount: z.number().int().min(0),
    lastPublishedOn: CalendarDateSchema.nullable(),
    observedOn: CalendarDateSchema,
  })
  .strict();
export type DemoCompetitorSubject = z.infer<typeof DemoCompetitorSubjectSchema>;

export const DemoCompetitorUnavailableSchema = z
  .object({
    metric: z.string().trim().min(1).max(120),
    reason: z.string().trim().min(1).max(500),
  })
  .strict();

export const DemoCompetitorWorkspaceSchema = z
  .object({
    /** Everything here is authored. The companies are invented and the interface says so first. */
    mode: z.literal('SIMULATED'),
    /** That the companies do not exist, which is a separate disclosure from the data being fixture. */
    inventedNote: z.string().trim().min(1).max(500),
    /** Why the comparison is limited to publicly visible signals. */
    methodNote: z.string().trim().min(1).max(500),
    subject: DemoCompetitorSubjectSchema,
    competitors: z.array(DemoCompetitorSchema),
    signals: z.array(DemoPublicSignalSchema),
    overlapNote: z.string().trim().min(1).max(500),
    /** Queries sampled, including any where no tracked competitor appeared. */
    sampledQueries: z.array(z.string().trim().min(1).max(200)),
    unavailable: z.array(DemoCompetitorUnavailableSchema).min(1),
    /**
     * AI mentions belonging to companies that are not tracked peers, so the per-competitor counts
     * are not mistaken for the full set.
     */
    untrackedMentions: z.array(
      z
        .object({ name: z.string().trim().min(1).max(120), count: z.number().int().min(1) })
        .strict(),
    ),
    totals: z
      .object({
        competitorCount: z.number().int().min(0),
        signalCount: z.number().int().min(0),
        aiCheckCount: z.number().int().min(0),
        /** Signals where the subject does something no tracked competitor does. */
        subjectOnlyCount: z.number().int().min(0),
        /** Signals the subject does not do that at least one tracked competitor does. */
        subjectGapCount: z.number().int().min(0),
      })
      .strict(),
  })
  .strict();
export type DemoCompetitorWorkspace = z.infer<typeof DemoCompetitorWorkspaceSchema>;

export const DemoCompetitorSnapshotSchema = z
  .object({
    snapshotVersion: z.literal(1),
    datasetVersion: z.string().trim().min(1).max(80),
    competitors: DemoCompetitorWorkspaceSchema,
  })
  .strict();
export type DemoCompetitorSnapshot = z.infer<typeof DemoCompetitorSnapshotSchema>;
