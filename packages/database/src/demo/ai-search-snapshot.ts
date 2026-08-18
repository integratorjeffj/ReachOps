import type { DemoAiWorkspace } from '@reachops/contracts';
import {
  AI_PANEL_NOTE,
  AI_REFERRAL_WINDOW_SESSIONS,
  AI_UNAVAILABLE,
  aiChecks,
  aiPrompts,
  aiReferrals,
  assistants,
  type AiCheckFixture,
  type AssistantKey,
} from './ai-search-fixtures';

/**
 * Builds the AI answer workspace.
 *
 * The one derivation worth care is the citation rate. It is reported as a fraction with its
 * denominator attached — "cited in 3 of 4 checks" — and never converted into a percentage. A
 * percentage invites comparison with a conversion rate or a click-through rate, both of which rest
 * on thousands of events; this rests on four. Keeping the denominator visible is what stops the
 * number being read as something it is not.
 *
 * Nothing here is scored, ranked or aggregated into a visibility index. A single figure summarising
 * "AI visibility" would be the most confident claim in the entire product and the least supportable.
 */

/** Below this many checks a prompt's record is a handful of anecdotes, and the panel says so. */
const THIN_EVIDENCE_THRESHOLD = 3;

export function buildAiWorkspace(): DemoAiWorkspace {
  const checksByPrompt = new Map<string, AiCheckFixture[]>();
  for (const check of aiChecks) {
    const existing = checksByPrompt.get(check.promptKey) ?? [];
    existing.push(check);
    checksByPrompt.set(check.promptKey, existing);
  }

  const prompts = aiPrompts.map((prompt) => {
    const checks = [...(checksByPrompt.get(prompt.key) ?? [])].sort((left, right) =>
      left.checkedOn === right.checkedOn
        ? left.id.localeCompare(right.id)
        : left.checkedOn.localeCompare(right.checkedOn),
    );

    const citedCount = checks.filter(({ brandCited }) => brandCited).length;
    const mentionedCount = checks.filter(({ brandMentioned }) => brandMentioned).length;
    const latest = checks.at(-1) ?? null;

    const competitors = [
      ...new Set(checks.flatMap(({ competitorsNamed }) => competitorsNamed)),
    ].sort((left, right) => left.localeCompare(right));

    return {
      key: prompt.key,
      prompt: prompt.prompt,
      intent: prompt.intent,
      branded: prompt.branded,
      reasonTracked: prompt.reasonTracked,
      targetPath: prompt.targetPath,
      checkCount: checks.length,
      citedCount,
      mentionedCount,
      /** Stated as a fraction everywhere. See the note above on why this is never a percentage. */
      citationRatioLabel: `${citedCount} of ${checks.length}`,
      thinEvidence: checks.length < THIN_EVIDENCE_THRESHOLD,
      assistantsChecked: [...new Set(checks.map(({ assistant }) => assistant))].sort(
        (left, right) => left.localeCompare(right),
      ),
      competitorsNamed: competitors,
      lastCheckedOn: latest?.checkedOn ?? null,
      /**
       * Assistants whose newest check disagrees with their own previous one.
       *
       * Computed per assistant. Comparing only the globally newest check would hide a flip whenever
       * some other assistant happened to be run last, which is exactly the case this exists to
       * catch. Surfaced as a difference between two samples, never as a change in standing.
       */
      changedAssistants: changedAssistants(checks),
      checks: checks.map((check) => ({
        id: check.id,
        assistant: check.assistant,
        checkedOn: check.checkedOn,
        brandMentioned: check.brandMentioned,
        brandCited: check.brandCited,
        citedPath: check.citedPath,
        citationOrder: check.citationOrder,
        competitorsNamed: check.competitorsNamed,
        answerSummary: check.answerSummary,
      })),
    };
  });

  const referrals = aiReferrals.map((referral) => ({
    assistant: referral.assistant,
    sessions: referral.sessions,
    priorSessions: referral.priorSessions,
    /** Absolute change only. A percentage on a base of nine sessions is noise wearing a suit. */
    change: referral.sessions - referral.priorSessions,
  }));

  const referralTotal = referrals.reduce((sum, { sessions }) => sum + sessions, 0);

  return {
    mode: 'SIMULATED',
    panelNote: AI_PANEL_NOTE,
    assistants: assistants.map((assistant) => ({ ...assistant })),
    prompts,
    referrals,
    referralTotal,
    referralShareLabel: `${referralTotal} of ${AI_REFERRAL_WINDOW_SESSIONS.toLocaleString('en-US')} sessions`,
    referralNote:
      'Analytics can see a session whose referrer is an assistant domain. It cannot see a customer who read an answer and arrived some other way, and several assistants send no referrer at all. This figure undercounts by an unknown amount and is a floor, not a total.',
    unavailable: AI_UNAVAILABLE.map((entry) => ({ ...entry })),
    totals: {
      promptCount: prompts.length,
      checkCount: aiChecks.length,
      citedPromptCount: prompts.filter(({ citedCount }) => citedCount > 0).length,
      neverCitedPromptCount: prompts.filter(({ citedCount }) => citedCount === 0).length,
    },
  };
}

/**
 * Assistants whose two most recent checks disagree about whether the business was cited.
 *
 * Compared within an assistant rather than across the whole prompt, because ChatGPT not citing a
 * page Perplexity cited is two systems disagreeing, not a change over time. An assistant with a
 * single check cannot disagree with itself and is never listed.
 */
function changedAssistants(checks: AiCheckFixture[]): AssistantKey[] {
  const changed: AssistantKey[] = [];

  for (const assistant of new Set(checks.map(({ assistant: key }) => key))) {
    const history = checks.filter(({ assistant: key }) => key === assistant);
    const latest = history.at(-1);
    const previous = history.at(-2);
    if (latest && previous && latest.brandCited !== previous.brandCited) changed.push(assistant);
  }

  return changed.sort((left, right) => left.localeCompare(right));
}
