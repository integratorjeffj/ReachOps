import { describe, expect, it } from 'vitest';
import { buildAiWorkspace } from '../src/demo/ai-search-snapshot';
import { aiChecks, aiPrompts } from '../src/demo/ai-search-fixtures';

/**
 * AI answer visibility.
 *
 * This is the workspace where a competitor would happily publish a visibility score, a share of
 * voice and an impression count, none of which any source provides. These assertions hold the line
 * on the two things that make the panel honest: counts never lose their denominators, and the list
 * of what cannot be known stays published rather than quietly shrinking.
 */

const ai = buildAiWorkspace();

describe('what the panel claims to be', () => {
  it('never presents itself as a crawl or an integration', () => {
    expect(ai.mode).toBe('SIMULATED');
    expect(ai.panelNote).toMatch(/run by hand/i);
    for (const assistant of ai.assistants) {
      expect(assistant.method).toMatch(/by hand|clean browser profile/i);
    }
  });

  it('says answers are non-deterministic before showing any of them', () => {
    expect(ai.panelNote).toMatch(/non-deterministic|differ legitimately|two runs/i);
  });

  it('keeps the panel small and uneven rather than a filled grid', () => {
    const combinations = ai.prompts.length * ai.assistants.length;
    // A tidy grid would imply a systematic crawl nobody is running.
    expect(ai.totals.checkCount).toBeLessThan(combinations);

    const perPrompt = new Set(ai.prompts.map(({ checkCount }) => checkCount));
    expect(perPrompt.size).toBeGreaterThan(1);
  });

  it('states why every tracked prompt is on the panel', () => {
    for (const prompt of ai.prompts) {
      expect(prompt.reasonTracked.length).toBeGreaterThan(30);
    }
  });
});

describe('what it refuses to compute', () => {
  it('publishes no visibility score or share of voice', () => {
    const serialised = JSON.stringify({
      prompts: ai.prompts,
      referrals: ai.referrals,
      totals: ai.totals,
    });
    expect(serialised).not.toMatch(/"score"|visibilityScore|shareOfVoice|rank"|"ranking"/i);
  });

  it('reports citation counts as fractions, never percentages', () => {
    for (const prompt of ai.prompts) {
      expect(prompt.citationRatioLabel).toMatch(/^\d+ of \d+$/);
      expect(prompt.citationRatioLabel).not.toContain('%');
    }
  });

  it('keeps the denominator honest against the recorded checks', () => {
    for (const prompt of ai.prompts) {
      const [cited, total] = prompt.citationRatioLabel.split(' of ').map(Number);
      expect(cited).toBe(prompt.checks.filter(({ brandCited }) => brandCited).length);
      expect(total).toBe(prompt.checks.length);
    }
  });

  it('reports referral change in sessions rather than percent', () => {
    for (const referral of ai.referrals) {
      expect(referral.change).toBe(referral.sessions - referral.priorSessions);
    }
    // A percentage on a base of nine sessions would read as a trend.
    expect(JSON.stringify(ai.referrals)).not.toContain('%');
  });

  it('publishes what it cannot tell you as data', () => {
    const metrics = ai.unavailable.map(({ metric }) => metric.toLowerCase()).join(' | ');
    expect(metrics).toMatch(/how often/);
    expect(metrics).toMatch(/share of voice/);
    expect(metrics).toMatch(/ranking position/);
    expect(metrics).toMatch(/real customer/);
    expect(metrics).toMatch(/bookings/);
  });

  it('gives every unavailable metric a reason rather than a shrug', () => {
    for (const entry of ai.unavailable) {
      expect(entry.reason.length).toBeGreaterThan(60);
    }
  });
});

describe('citation and mention', () => {
  it('separates being named from being linked', () => {
    const mentionedNotCited = ai.prompts
      .flatMap(({ checks }) => checks)
      .filter(({ brandMentioned, brandCited }) => brandMentioned && !brandCited);

    // A mention with no link leaves no path back to the site, and the two are counted apart.
    expect(mentionedNotCited.length).toBeGreaterThan(0);
  });

  it('records a citation without a mention, which is equally real', () => {
    const citedNotMentioned = ai.prompts
      .flatMap(({ checks }) => checks)
      .filter(({ brandMentioned, brandCited }) => !brandMentioned && brandCited);

    expect(citedNotMentioned.length).toBeGreaterThan(0);
  });

  it('never records a citation order without a citation', () => {
    for (const check of ai.prompts.flatMap(({ checks }) => checks)) {
      if (check.citationOrder !== null) expect(check.brandCited).toBe(true);
      if (!check.brandCited) expect(check.citedPath).toBeNull();
    }
  });

  it('flags a prompt resting on too few checks', () => {
    const thin = ai.prompts.filter(({ thinEvidence }) => thinEvidence);
    expect(thin.length).toBeGreaterThan(0);
    for (const prompt of thin) expect(prompt.checkCount).toBeLessThan(3);
  });
});

describe('run-to-run difference', () => {
  it('detects a flip within one assistant on the cost prompt', () => {
    const cost = ai.prompts.find(({ key }) => key === 'AC-COST')!;
    expect(cost.changedAssistants).toEqual(['PERPLEXITY']);
  });

  it('does not call two assistants disagreeing a change over time', () => {
    // The water heater prompt is cited by Perplexity and Google and not by Claude. That is three
    // systems differing, not a movement, so nothing is flagged as changed.
    const guide = ai.prompts.find(({ key }) => key === 'WATER-HEATER-DECISION')!;
    expect(guide.assistantsChecked.length).toBeGreaterThan(1);
    expect(guide.changedAssistants).toEqual([]);
  });

  it('never flags an assistant that has only been checked once', () => {
    for (const prompt of ai.prompts) {
      for (const assistant of prompt.changedAssistants) {
        const history = prompt.checks.filter((check) => check.assistant === assistant);
        expect(history.length).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

describe('referrals', () => {
  it('keeps referral sessions in proportion to the window', () => {
    expect(ai.referralShareLabel).toMatch(/^\d+ of [\d,]+ sessions$/);
    expect(ai.referralTotal).toBe(ai.referrals.reduce((sum, { sessions }) => sum + sessions, 0));
  });

  it('states that the referral figure is a floor rather than a total', () => {
    expect(ai.referralNote).toMatch(/undercounts|floor, not a total/i);
  });

  it('records assistants that sent nothing rather than omitting them', () => {
    const silent = ai.referrals.filter(({ sessions }) => sessions === 0);
    expect(silent.length).toBeGreaterThan(0);
  });
});

describe('coverage of the fixture set', () => {
  it('carries every authored check into the workspace', () => {
    const built = ai.prompts.flatMap(({ checks }) => checks).length;
    expect(built).toBe(aiChecks.length);
    expect(ai.prompts).toHaveLength(aiPrompts.length);
  });

  it('does not report every prompt as a success', () => {
    expect(ai.totals.neverCitedPromptCount).toBeGreaterThan(0);
    expect(ai.totals.citedPromptCount).toBeGreaterThan(0);
  });

  it('tracks a prompt the business does not want to win', () => {
    const cheap = ai.prompts.find(({ key }) => key === 'PLUMBER-CHEAP')!;
    expect(cheap.citedCount).toBe(0);
    expect(cheap.reasonTracked).toMatch(/does not want to win/i);
  });

  it('orders checks oldest first so a reader follows the sequence', () => {
    for (const prompt of ai.prompts) {
      const dates = prompt.checks.map(({ checkedOn }) => checkedOn);
      expect(dates).toEqual([...dates].sort());
    }
  });
});
