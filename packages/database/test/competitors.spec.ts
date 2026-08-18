import { describe, expect, it } from 'vitest';
import { buildCompetitorWorkspace } from '../src/demo/competitor-snapshot';
import { aiChecks } from '../src/demo/ai-search-fixtures';
import { SUBJECT_KEY, competitors, publicSignals } from '../src/demo/competitor-fixtures';
import { buildDemoSnapshot } from '../src/demo/snapshot';

/**
 * Competitor comparison.
 *
 * The category norm is to sell modelled traffic figures as if they were measurements. These
 * assertions hold the two lines that keep this workspace honest: an observation and an estimate
 * stay structurally distinct, and the estimates never collapse to a point value.
 */

const rivals = buildCompetitorWorkspace();

describe('what this workspace claims to be', () => {
  it('says the companies are invented before saying anything about them', () => {
    expect(rivals.mode).toBe('SIMULATED');
    expect(rivals.inventedNote).toMatch(/invented|do not exist/i);
    expect(rivals.inventedNote).toMatch(/no data was gathered about any real business/i);
  });

  it('explains why the comparison is limited to publicly visible signals', () => {
    expect(rivals.methodNote).toMatch(/confirm by opening/i);
  });

  it('states why each competitor is tracked', () => {
    for (const competitor of rivals.competitors) {
      expect(competitor.reasonTracked.length).toBeGreaterThan(40);
    }
  });
});

describe('observation versus estimate', () => {
  it('gives every estimate a range and a method rather than a single number', () => {
    const estimates = rivals.competitors.flatMap(({ estimates: rows }) => rows);
    expect(estimates.length).toBeGreaterThan(0);

    for (const estimate of estimates) {
      expect(estimate.high).toBeGreaterThan(estimate.low);
      expect(estimate.rangeLabel).toContain('–');
      expect(estimate.method.length).toBeGreaterThan(60);
      expect(estimate.method).toMatch(/model|modelled/i);
    }
  });

  it('has nowhere to put a point value on an estimate', () => {
    const estimate = rivals.competitors[0]!.estimates[0]!;
    // The absence is the safeguard: no rendering path can reach for a single number.
    expect(Object.keys(estimate).sort()).toEqual([
      'high',
      'low',
      'method',
      'metric',
      'rangeLabel',
      'unit',
    ]);
  });

  it('keeps public signals boolean so they stay checkable by looking', () => {
    for (const signal of rivals.signals) {
      for (const value of Object.values(signal.values)) {
        expect(typeof value).toBe('boolean');
      }
      expect(signal.whyItMatters.length).toBeGreaterThan(40);
    }
  });
});

describe('what it refuses to compute', () => {
  it('publishes no market share, competitive score or placing', () => {
    const serialised = JSON.stringify(rivals);
    expect(serialised).not.toMatch(/marketShare|"share"|competitiveScore|"score"|"rank"|placing/i);
  });

  it('publishes the metrics no source can provide, with reasons', () => {
    const metrics = rivals.unavailable.map(({ metric }) => metric.toLowerCase()).join(' | ');
    expect(metrics).toMatch(/sessions/);
    expect(metrics).toMatch(/conversion rate/);
    expect(metrics).toMatch(/revenue/);
    expect(metrics).toMatch(/advertising spend/);

    for (const entry of rivals.unavailable) {
      expect(entry.reason.length).toBeGreaterThan(60);
    }
  });

  it('says the search sampling is a snapshot rather than a ranking report', () => {
    expect(rivals.overlapNote).toMatch(/not a ranking report/i);
    expect(rivals.overlapNote).toMatch(/personalised|by hand/i);
  });
});

describe('the AI cross-reference', () => {
  it('counts mentions from the recorded checks rather than a second authored copy', () => {
    for (const competitor of rivals.competitors) {
      const expected = aiChecks.filter(({ competitorsNamed }) =>
        competitorsNamed.includes(competitor.name),
      ).length;
      expect(competitor.aiMentionCount).toBe(expected);
    }
  });

  it('carries the denominator on every mention count', () => {
    for (const competitor of rivals.competitors) {
      expect(competitor.aiMentionLabel).toBe(
        `${competitor.aiMentionCount} of ${aiChecks.length} checks`,
      );
    }
  });

  it('accounts for mentions belonging to companies that are not tracked peers', () => {
    const tracked = rivals.competitors.reduce((sum, { aiMentionCount }) => sum + aiMentionCount, 0);
    const untracked = rivals.untrackedMentions.reduce((sum, { count }) => sum + count, 0);
    const total = aiChecks.reduce((sum, { competitorsNamed }) => sum + competitorsNamed.length, 0);

    // A reader who adds the per-competitor counts and finds them short can see exactly what is
    // missing rather than assuming a defect.
    expect(tracked + untracked).toBe(total);
    expect(rivals.untrackedMentions.length).toBeGreaterThan(0);
  });
});

describe('the comparison itself', () => {
  it('reconciles the subject rating with the observation the rest of the product publishes', () => {
    const snapshot = buildDemoSnapshot();
    const rating = snapshot.overview.goals.find(
      ({ targetUnit }) => targetUnit === 'CUMULATIVE_RATING',
    )!;

    // Two surfaces restating the same rating from different sources is how they end up disagreeing.
    expect(rivals.subject.publicRating).toBe(rating.currentValue);
  });

  it('counts how many competitors do each thing rather than flagging a bare gap', () => {
    for (const signal of rivals.signals) {
      const doing = competitors.filter(({ key }) => signal.values[key]).length;
      expect(signal.competitorsDoingIt).toBe(doing);
      expect(signal.competitorRatioLabel).toBe(`${doing} of ${competitors.length}`);
    }
  });

  it('surfaces the pricing gap that only some competitors expose', () => {
    const pricing = rivals.signals.find(({ key }) => key === 'PRICING')!;
    expect(pricing.values[SUBJECT_KEY]).toBe(false);
    expect(pricing.competitorsDoingIt).toBe(2);

    // Requiring unanimity would report zero gaps here and hide the finding entirely.
    expect(rivals.totals.subjectGapCount).toBeGreaterThan(0);
  });

  it('records what the subject does that no competitor does', () => {
    const guide = rivals.signals.find(({ key }) => key === 'DECISION-GUIDE')!;
    expect(guide.values[SUBJECT_KEY]).toBe(true);
    expect(guide.competitorsDoingIt).toBe(0);
    expect(rivals.totals.subjectOnlyCount).toBe(1);
  });

  it('does not report the subject as ahead on everything', () => {
    const behind = rivals.signals.filter(
      (signal) => !signal.values[SUBJECT_KEY] && signal.competitorsDoingIt > 0,
    );
    const ahead = rivals.signals.filter(
      (signal) => signal.values[SUBJECT_KEY] && signal.competitorsDoingIt < competitors.length,
    );
    expect(behind.length).toBeGreaterThan(0);
    expect(ahead.length).toBeGreaterThan(0);
  });

  it('keeps a sampled query that turned up no tracked competitor', () => {
    const covered = new Set(rivals.competitors.flatMap(({ sharedQueries }) => sharedQueries));
    const empty = rivals.sampledQueries.filter((query) => !covered.has(query));
    // Dropping it would make the sample look more crowded than it was.
    expect(empty.length).toBeGreaterThan(0);
  });

  it('gives a competitor with no dated content a null rather than a guess', () => {
    const undated = rivals.competitors.filter(({ lastPublishedOn }) => lastPublishedOn === null);
    expect(undated.length).toBeGreaterThan(0);
  });

  it('carries every authored signal into the workspace', () => {
    expect(rivals.signals).toHaveLength(publicSignals.length);
    expect(rivals.competitors).toHaveLength(competitors.length);
  });
});
