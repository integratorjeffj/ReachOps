import { describe, expect, it } from 'vitest';
import { monthlyBaseline } from '../src/demo/fixtures';
import { pageMonthlyClicks } from '../src/demo/search-fixtures';
import { buildDemoSnapshot, buildSearchSnapshot } from '../src/demo/snapshot';

/**
 * Outcome measurement.
 *
 * The failure this guards against is a product that quietly turns "the number went up afterwards"
 * into "the work caused it". Every assertion here is about keeping the comparison honest: fixed
 * windows, real evidence, named competing explanations, and permission to say nothing was
 * measurable.
 */

const snapshot = buildDemoSnapshot();
const outcomes = snapshot.outcomes;
const evidenceIds = new Set(snapshot.evidence.map(({ evidenceId }) => evidenceId));

describe('the frozen baseline', () => {
  it('stores explicit window bounds rather than a derived selection', () => {
    for (const outcome of outcomes.filter(({ status }) => status === 'MEASURED')) {
      expect(outcome.baseline).not.toBeNull();
      expect(outcome.followUp).not.toBeNull();
      // Bounds are literal periods, so nothing a reader does later can reinterpret them.
      expect(outcome.baseline!.periodStart).toMatch(/^\d{4}-\d{2}$/);
      expect(outcome.followUp!.periodStart).toMatch(/^\d{4}-\d{2}$/);
    }
  });

  it('places the baseline before the follow-up in every measured outcome', () => {
    for (const outcome of outcomes.filter(({ status }) => status === 'MEASURED')) {
      expect(outcome.baseline!.periodStart < outcome.followUp!.periodStart).toBe(true);
    }
  });

  it('resolves both windows to evidence the core snapshot can open', () => {
    // Outcomes appear on Work and the Command Center, so their evidence cannot live only in the
    // search snapshot or the chips would fail to resolve there.
    for (const outcome of outcomes) {
      for (const id of [
        ...(outcome.baseline?.evidenceIds ?? []),
        ...(outcome.followUp?.evidenceIds ?? []),
      ]) {
        expect(evidenceIds.has(id)).toBe(true);
      }
    }
  });

  it('does not publish the same evidence twice across snapshots', () => {
    const search = new Set(buildSearchSnapshot().evidence.map(({ evidenceId }) => evidenceId));
    const overlap = [...evidenceIds].filter((id) => search.has(id));
    expect(overlap).toEqual([]);
  });

  it('takes its window values from the committed page history', () => {
    const waterHeater = outcomes.find(({ id }) => id === 'OM-01')!;
    const series = new Map(pageMonthlyClicks['WATER-HEATER-GUIDE']);

    expect(waterHeater.baseline!.value).toBe(series.get(waterHeater.baseline!.periodStart));
    expect(waterHeater.followUp!.value).toBe(series.get(waterHeater.followUp!.periodStart));
  });
});

describe('the arithmetic', () => {
  it('reports the water-heater refresh as the documented improvement', () => {
    const outcome = outcomes.find(({ id }) => id === 'OM-01')!;

    expect(outcome.absoluteChange).toBe(470);
    expect(outcome.relativeChangePercent).toBeCloseTo(23, 1);
  });

  it('computes change from the two stored windows and nothing else', () => {
    for (const outcome of outcomes.filter(({ status }) => status === 'MEASURED')) {
      const expected = outcome.followUp!.value - outcome.baseline!.value;
      expect(outcome.absoluteChange).toBe(expected);
      expect(outcome.relativeChangePercent).toBeCloseTo(
        (expected / outcome.baseline!.value) * 100,
        1,
      );
    }
  });
});

describe('refusing to claim a cause', () => {
  it('carries a caveat on every outcome', () => {
    for (const outcome of outcomes) {
      expect(outcome.caveat.length).toBeGreaterThan(0);
    }
  });

  it('states the causal disclaimer on the flagship improvement', () => {
    const outcome = outcomes.find(({ id }) => id === 'OM-01')!;
    expect(outcome.caveat).toMatch(/does not attribute causation/i);
  });

  it('names the seasonal explanation that competes with the FAQ result', () => {
    const outcome = outcomes.find(({ id }) => id === 'OM-02')!;

    // July is the cooling peak. The property moved without anyone touching those pages, so the
    // page-level rise cannot be read as the work succeeding.
    const june = monthlyBaseline.find(([month]) => month === '2026-06')![1];
    const july = monthlyBaseline.find(([month]) => month === '2026-07')![1];
    expect(july).toBeGreaterThan(june);

    expect(outcome.confounders.length).toBeGreaterThan(0);
    expect(outcome.confounders.join(' ')).toMatch(/peak cooling month/i);
    expect(outcome.caveat).toMatch(/not evidence the work caused it/i);
  });

  it('uses no causal verbs in any assessment', () => {
    const prose = outcomes.map(({ assessment }) => assessment).join(' ');
    expect(prose).not.toMatch(/\bcaused\b|\bdrove\b|\bresulted in\b|\bthanks to\b/i);
  });
});

describe('permission to report nothing', () => {
  it('records an unmeasurable outcome rather than substituting a nearby metric', () => {
    const outcome = outcomes.find(({ status }) => status === 'NOT_MEASURABLE')!;

    expect(outcome.baseline).toBeNull();
    expect(outcome.followUp).toBeNull();
    expect(outcome.absoluteChange).toBeNull();
    expect(outcome.caveat).toMatch(/more honest than substituting/i);
  });

  it('does not show every completed action as a success', () => {
    const measured = outcomes.filter(({ status }) => status === 'MEASURED');
    const clean = measured.filter(({ confounders }) => confounders.length === 0);

    // At least one measured outcome has a competing explanation attached. A board where every
    // finished task reports a clean win is not measuring anything.
    expect(clean.length).toBeLessThan(measured.length);
  });

  it('leaves completed work without an outcome record unclaimed', () => {
    const completed = snapshot.actions.filter(({ status }) => status === 'COMPLETED');
    const withOutcome = new Set(outcomes.map(({ actionId }) => actionId));

    expect(completed.length).toBeGreaterThan(outcomes.length);
    for (const outcome of outcomes) {
      expect(completed.some(({ id }) => id === outcome.actionId)).toBe(true);
    }
    expect(completed.some(({ id }) => !withOutcome.has(id))).toBe(true);
  });
});
