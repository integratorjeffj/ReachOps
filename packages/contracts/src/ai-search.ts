import { z } from 'zod';

/**
 * AI answer visibility.
 *
 * The shape of this contract is mostly a set of refusals. There is no impression count, no share of
 * voice, no ranking and no composite visibility figure, because no source publishes the first two,
 * the third does not exist in prose answers, and the fourth would be the most confident claim in
 * the product resting on the least evidence.
 *
 * What is here instead is a panel: a handful of prompts run by hand on a weekly cadence, each check
 * recorded with what came back. Counts travel with their denominators so a reader can see how few
 * observations a statement rests on.
 */

const CalendarDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const AiAssistantKeySchema = z.enum([
  'CHATGPT',
  'PERPLEXITY',
  'GOOGLE_AI_OVERVIEW',
  'CLAUDE',
]);
export type AiAssistantKey = z.infer<typeof AiAssistantKeySchema>;

export const DemoAiAssistantSchema = z
  .object({
    key: AiAssistantKeySchema,
    displayName: z.string().trim().min(1).max(80),
    /** How a check was performed. None of these is an API integration and the copy never implies one. */
    method: z.string().trim().min(1).max(300),
    showsSources: z.boolean(),
    limitation: z.string().trim().min(1).max(400),
  })
  .strict();
export type DemoAiAssistant = z.infer<typeof DemoAiAssistantSchema>;

export const DemoAiCheckSchema = z
  .object({
    id: z.string().regex(/^AI-\d{3}$/),
    assistant: AiAssistantKeySchema,
    checkedOn: CalendarDateSchema,
    /** Named in the answer text. */
    brandMentioned: z.boolean(),
    /** Linked in the sources. A mention with no link leaves no path back to the site. */
    brandCited: z.boolean(),
    citedPath: z.string().trim().min(1).max(200).nullable(),
    /** Assembly order within the source list. Recorded because observed; never treated as a rank. */
    citationOrder: z.number().int().min(1).max(20).nullable(),
    competitorsNamed: z.array(z.string().trim().min(1).max(120)),
    answerSummary: z.string().trim().min(1).max(400),
  })
  .strict();
export type DemoAiCheck = z.infer<typeof DemoAiCheckSchema>;

export const DemoAiPromptSchema = z
  .object({
    key: z.string().trim().min(1).max(60),
    prompt: z.string().trim().min(1).max(300),
    intent: z.enum(['INFORMATIONAL', 'COMMERCIAL', 'TRANSACTIONAL', 'NAVIGATIONAL']),
    branded: z.boolean(),
    /** Why this prompt is tracked. A panel without stated reasons is a list of guesses. */
    reasonTracked: z.string().trim().min(1).max(400),
    targetPath: z.string().trim().min(1).max(200).nullable(),
    checkCount: z.number().int().min(0),
    citedCount: z.number().int().min(0),
    mentionedCount: z.number().int().min(0),
    /** Always a fraction, e.g. "3 of 4". Never a percentage — see the module note. */
    citationRatioLabel: z.string().regex(/^\d+ of \d+$/),
    thinEvidence: z.boolean(),
    assistantsChecked: z.array(AiAssistantKeySchema),
    competitorsNamed: z.array(z.string().trim().min(1).max(120)),
    lastCheckedOn: CalendarDateSchema.nullable(),
    /** Assistants whose newest check disagrees with their own previous one on this prompt. */
    changedAssistants: z.array(AiAssistantKeySchema),
    checks: z.array(DemoAiCheckSchema),
  })
  .strict();
export type DemoAiPrompt = z.infer<typeof DemoAiPromptSchema>;

export const DemoAiReferralSchema = z
  .object({
    assistant: AiAssistantKeySchema,
    sessions: z.number().int().min(0),
    priorSessions: z.number().int().min(0),
    /** Absolute only. A percentage change on a base of nine sessions would be noise. */
    change: z.number().int(),
  })
  .strict();
export type DemoAiReferral = z.infer<typeof DemoAiReferralSchema>;

export const DemoAiUnavailableSchema = z
  .object({
    metric: z.string().trim().min(1).max(120),
    reason: z.string().trim().min(1).max(500),
  })
  .strict();

export const DemoAiWorkspaceSchema = z
  .object({
    /** The panel is authored, not crawled. This is the first thing the interface says. */
    mode: z.literal('SIMULATED'),
    panelNote: z.string().trim().min(1).max(600),
    assistants: z.array(DemoAiAssistantSchema).min(1),
    prompts: z.array(DemoAiPromptSchema),
    referrals: z.array(DemoAiReferralSchema),
    referralTotal: z.number().int().min(0),
    /** Referrals kept in proportion to the window's total sessions rather than shown alone. */
    referralShareLabel: z.string().trim().min(1).max(120),
    referralNote: z.string().trim().min(1).max(500),
    /** What this workspace cannot tell you, published as data rather than buried in prose. */
    unavailable: z.array(DemoAiUnavailableSchema).min(1),
    totals: z
      .object({
        promptCount: z.number().int().min(0),
        checkCount: z.number().int().min(0),
        citedPromptCount: z.number().int().min(0),
        neverCitedPromptCount: z.number().int().min(0),
      })
      .strict(),
  })
  .strict();
export type DemoAiWorkspace = z.infer<typeof DemoAiWorkspaceSchema>;
