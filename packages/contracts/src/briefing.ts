import { z } from 'zod';
import { EvidenceIdSchema, QualityStatusSchema, SourceModeSchema } from './metrics';

/**
 * The fact packet.
 *
 * ReachOps composes its written briefing from this structure and from nothing else. The packet is
 * assembled first, by deterministic rules, and the prose is rendered from it afterwards. That order
 * is the whole point: a narrative layer that reaches back into the raw data while it writes can
 * always find one more number to mention, and no reader can tell which sentences were earned.
 *
 * Two properties make the packet worth publishing rather than hiding:
 *
 * Every fact carries the evidence identifiers that substantiate it. A sentence with no evidence
 * cannot be built, because there is no field in which to put it.
 *
 * Every candidate the admission rules turned away is recorded with the reason. A briefing that
 * silently omits what it could not stand behind reads exactly like a briefing with nothing to omit.
 * Publishing the exclusions is what separates the two.
 */

const IdentifierSchema = z.string().trim().min(1).max(160);

/**
 * Why a candidate fact did not make it into the briefing.
 *
 * These are refusals, not failures. Each one is a place where the product had something it could
 * have said and decided the support was not there.
 */
export const BriefingExclusionReasonSchema = z.enum([
  /** No prior period, so a change cannot be stated. The current value alone is not a movement. */
  'NO_PRIOR_PERIOD',
  /** The underlying record is marked invalid. Nothing is reported from it. */
  'QUALITY_INVALID',
  /** The record has not refreshed within the window it claims to cover. */
  'QUALITY_STALE',
  /** The denominator is too small for a rate or percentage to mean anything. */
  'BELOW_VOLUME_FLOOR',
  /** A deterministic rule ran and its conditions were not met. Nothing is wrong; nothing happened. */
  'RULE_CONDITIONS_NOT_MET',
  /** A rule was prevented from running by its own quality gate. */
  'RULE_BLOCKED_BY_QUALITY',
  /** Work is done but the follow-up window has not closed yet. */
  'NOT_YET_MEASURED',
  /** No metric was ever persisted for what this work changed, so no outcome can be computed. */
  'NO_METRIC_PERSISTED',
  /** Work was completed and no one ever opened a measurement against it. */
  'NO_OUTCOME_RECORDED',
  /**
   * An observation stands on its own with no explanation attached, because none is supported.
   * Recorded rather than passed over, so the absence of a cause is visible as a decision.
   */
  'NO_SUPPORTED_EXPLANATION',
  /** A goal has no measurement attached, so attainment cannot be stated. */
  'NO_MEASUREMENT_ATTACHED',
  /** A source has never returned history, so nothing derived from it can be reported. */
  'SOURCE_HAS_NO_HISTORY',
]);
export type BriefingExclusionReason = z.infer<typeof BriefingExclusionReasonSchema>;

export const BriefingSectionKeySchema = z.enum([
  'PERIOD',
  'MOVEMENT',
  'OBSERVATIONS',
  'PRIORITIES',
  'WORK',
  'OUTCOMES',
]);
export type BriefingSectionKey = z.infer<typeof BriefingSectionKeySchema>;

export const BriefingFactKindSchema = z.enum([
  'WINDOW',
  'SOURCE_COVERAGE',
  'KPI_MOVEMENT',
  'GOAL_ATTAINMENT',
  'OBSERVATION',
  'PRIORITY',
  'WORK_IN_FLIGHT',
  'OUTCOME',
]);
export type BriefingFactKind = z.infer<typeof BriefingFactKindSchema>;

/**
 * Whether a movement is the direction the business wants.
 *
 * Held separately from the statement rather than folded into its verb. "Average response time rose"
 * is a fact; that the rise is unwelcome is an interpretation, and it depends on `lowerIsBetter`
 * rather than on the sign of the number. Keeping them apart means a reader can check the fact
 * without having to accept the reading.
 */
export const BriefingDirectionSchema = z.enum(['BETTER', 'WORSE', 'FLAT', 'NOT_COMPARABLE']);
export type BriefingDirection = z.infer<typeof BriefingDirectionSchema>;

export const DemoBriefingFactSchema = z
  .object({
    id: z.string().regex(/^FACT-\d{3}$/),
    kind: BriefingFactKindSchema,
    section: BriefingSectionKeySchema,
    /**
     * The sentence the briefing may use, composed from a fixed template. Neutral about cause and
     * about whether the movement is welcome.
     */
    statement: z.string().trim().min(1).max(600),
    direction: BriefingDirectionSchema,
    evidenceIds: z.array(EvidenceIdSchema),
    sourceModes: z.array(SourceModeSchema),
    qualityStatus: QualityStatusSchema,
    qualityFlags: z.array(z.string()),
    /** Carried forward from the record, e.g. a partial-coverage note. Never dropped in rendering. */
    caveat: z.string().trim().min(1).max(500).nullable(),
    /**
     * A suggested explanation, where one exists, always marked as a hypothesis and always paired
     * with how strongly it is held. Never promoted to a cause by the renderer.
     */
    hypothesis: z
      .object({
        text: z.string().trim().min(1).max(500),
        confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
      })
      .strict()
      .nullable(),
    /** Where in the product this fact came from, so the briefing can link back to it. */
    link: z
      .object({
        entityType: z.enum([
          'KPI',
          'GOAL',
          'OBSERVATION',
          'OPPORTUNITY',
          'ACTION',
          'OUTCOME',
          'CONNECTION',
        ]),
        entityId: IdentifierSchema,
      })
      .strict()
      .nullable(),
  })
  .strict();
export type DemoBriefingFact = z.infer<typeof DemoBriefingFactSchema>;

export const DemoBriefingExclusionSchema = z
  .object({
    id: z.string().regex(/^EXCL-\d{3}$/),
    section: BriefingSectionKeySchema,
    /** What the briefing would have been talking about, named plainly. */
    subject: z.string().trim().min(1).max(200),
    reason: BriefingExclusionReasonSchema,
    /** The specific circumstance, not a restatement of the reason code. */
    detail: z.string().trim().min(1).max(400),
  })
  .strict();
export type DemoBriefingExclusion = z.infer<typeof DemoBriefingExclusionSchema>;

export const DemoBriefingSectionSchema = z
  .object({
    key: BriefingSectionKeySchema,
    title: z.string().trim().min(1).max(120),
    /** What this section is for, so an empty one is legible rather than mysterious. */
    purpose: z.string().trim().min(1).max(300),
    facts: z.array(DemoBriefingFactSchema),
    exclusions: z.array(DemoBriefingExclusionSchema),
    /**
     * What the section says when it holds no facts. Always present, because a section that
     * disappears when empty lets a reader assume it was covered and found nothing worth raising.
     */
    emptyStatement: z.string().trim().min(1).max(300),
  })
  .strict();
export type DemoBriefingSection = z.infer<typeof DemoBriefingSectionSchema>;

/**
 * An admission rule, published as data rather than only applied in code.
 *
 * A reader who wants to know why a number is absent should be able to read the rule that excluded
 * it, in the same interface, without taking anyone's word for it.
 */
export const DemoAdmissionRuleSchema = z
  .object({
    key: z.string().regex(/^[a-z][a-z0-9_.-]*$/),
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().min(1).max(400),
  })
  .strict();
export type DemoAdmissionRule = z.infer<typeof DemoAdmissionRuleSchema>;

export const DemoFactPacketSchema = z
  .object({
    packetVersion: z.literal(1),
    datasetVersion: z.string().trim().min(1).max(80),
    /** The rule set version that assembled this packet, so a stale briefing is identifiable. */
    packetRuleVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    window: z
      .object({
        start: z.iso.datetime({ offset: true }),
        end: z.iso.datetime({ offset: true }),
        timezone: z.string().trim().min(1).max(80),
      })
      .strict(),
    admissionRules: z.array(DemoAdmissionRuleSchema).min(1),
    sections: z.array(DemoBriefingSectionSchema).length(6),
    /**
     * Statements the renderer is forbidden to produce regardless of what the facts contain.
     * Published so the constraint is visible to a reader rather than only enforced in tests.
     */
    boundaries: z.array(z.string().trim().min(1).max(300)).min(1),
    totals: z
      .object({
        factCount: z.number().int().min(0),
        exclusionCount: z.number().int().min(0),
        evidenceCitedCount: z.number().int().min(0),
      })
      .strict(),
  })
  .strict();
export type DemoFactPacket = z.infer<typeof DemoFactPacketSchema>;
