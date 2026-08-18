import { describe, expect, it } from 'vitest';
import type { DemoSnapshot } from '@reachops/contracts';
import { buildDemoSnapshot } from '../src/demo/snapshot';
import { buildFactPacket } from '../src/demo/briefing-facts';

/**
 * The fact packet.
 *
 * A narrative layer is the easiest place in a product like this to lose credibility, because prose
 * hides its own gaps: a sentence that skips an inconvenient metric reads exactly like a sentence
 * that had nothing to skip. These assertions hold the packet to the two properties that make the
 * difference — everything asserted is sourced, and everything withheld is on the record.
 */

const snapshot = buildDemoSnapshot();
const packet = buildFactPacket(snapshot);
const allFacts = packet.sections.flatMap(({ facts }) => facts);
const allExclusions = packet.sections.flatMap(({ exclusions }) => exclusions);

/** Deep clone so a mutation in one test cannot leak into another. */
function mutableSnapshot(): DemoSnapshot {
  return structuredClone(snapshot);
}

describe('what the packet may assert', () => {
  it('cites only evidence that exists in the snapshot it was built from', () => {
    const known = new Set(snapshot.evidence.map(({ evidenceId }) => evidenceId));
    for (const fact of allFacts) {
      for (const evidenceId of fact.evidenceIds) {
        expect(known, `${fact.id} cites ${evidenceId}`).toContain(evidenceId);
      }
    }
  });

  it('gives every measured statement at least one evidence identifier', () => {
    const measured = allFacts.filter(({ kind }) => kind !== 'WINDOW' && kind !== 'SOURCE_COVERAGE');
    expect(measured.length).toBeGreaterThan(0);
    for (const fact of measured) {
      expect(fact.evidenceIds.length, `${fact.id}: ${fact.statement}`).toBeGreaterThan(0);
    }
  });

  it('refuses to build when a fact cites evidence that is not published', () => {
    const broken = mutableSnapshot();
    // Remove the record the sessions KPI depends on while leaving the KPI itself in place.
    broken.evidence = broken.evidence.filter(({ evidenceId }) => evidenceId !== 'EV-101');

    expect(() => buildFactPacket(broken)).toThrow(/EV-101.*not in the snapshot evidence set/);
  });

  it('refuses to build a measured statement with no evidence at all', () => {
    const broken = mutableSnapshot();
    // Actions are the one place the contract permits an empty evidence list, so this is the path
    // where an unsourced sentence could actually reach the packet.
    const inFlight = broken.actions.find(({ current }) => current)!;
    inFlight.evidenceIds = [];

    expect(() => buildFactPacket(broken)).toThrow(/no evidence behind it/);
  });
});

describe('what the packet refuses to say', () => {
  it('publishes no composite score or overall verdict', () => {
    const prose = allFacts.map(({ statement }) => statement).join(' ');
    expect(prose).not.toMatch(/overall|composite|score|grade|health index/i);
  });

  it('states no confidence percentage in its own analysis', () => {
    const prose = allFacts.map(({ statement }) => statement).join(' ');
    // Catches both orderings: "97% confidence" and "AI confidence 97%".
    expect(prose).not.toMatch(/\d{1,3}\s*%[^.]{0,20}(confiden|certain|accura)/i);
    expect(prose).not.toMatch(/(confiden|certain|accura)[^.]{0,20}\d{1,3}\s*%/i);
  });

  it('never asserts that work caused a movement', () => {
    for (const fact of allFacts) {
      expect(fact.statement).not.toMatch(/\b(caused|because of|thanks to|drove|resulted in)\b/i);
    }
  });

  it('carries explanations as hypotheses with the confidence held in them', () => {
    const withHypothesis = allFacts.filter(({ hypothesis }) => hypothesis !== null);
    expect(withHypothesis.length).toBeGreaterThan(0);
    for (const fact of withHypothesis) {
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(fact.hypothesis!.confidence);
    }
  });

  it('records the absence of an explanation rather than inventing one', () => {
    const unexplained = allExclusions.filter(({ reason }) => reason === 'NO_SUPPORTED_EXPLANATION');
    expect(unexplained.length).toBeGreaterThan(0);
    // The opportunity is still ranked; it is the explanation that is withheld.
    for (const exclusion of unexplained) {
      expect(exclusion.subject).toMatch(/^Explanation for /);
    }
  });

  it('publishes the boundaries it holds itself to', () => {
    expect(packet.boundaries.length).toBeGreaterThanOrEqual(4);
    expect(packet.boundaries.join(' ')).toMatch(/caused/i);
  });
});

describe('direction', () => {
  it('reads direction from the metric definition, not the sign of the change', () => {
    const worse = allFacts.find(({ statement }) => statement.includes('AC repair booking rate'))!;
    expect(worse.direction).toBe('WORSE');

    const better = allFacts.find(({ statement }) => statement.includes('Website sessions'))!;
    expect(better.direction).toBe('BETTER');
  });

  it('calls a rise in a lower-is-better metric worse, not better', () => {
    const flipped = mutableSnapshot();
    const sessions = flipped.overview.kpis.find(({ key }) => key === 'sessions')!;
    sessions.definition!.lowerIsBetter = true;

    const rebuilt = buildFactPacket(flipped);
    const fact = rebuilt.sections
      .flatMap(({ facts }) => facts)
      .find(({ statement }) => statement.includes('Website sessions'))!;

    expect(fact.statement).toContain('rose');
    expect(fact.direction).toBe('WORSE');
  });

  it('keeps the verb neutral so the sentence survives the interpretation', () => {
    for (const fact of allFacts.filter(({ kind }) => kind === 'KPI_MOVEMENT')) {
      expect(fact.statement).toMatch(/\b(rose|fell|held level)\b/);
      expect(fact.statement).not.toMatch(/\b(improved|declined|deteriorated|surged|plunged)\b/);
    }
  });
});

describe('units', () => {
  it('reports a rate change in percentage points, never percent', () => {
    const rate = allFacts.find(({ statement }) => statement.includes('AC repair booking rate'))!;
    expect(rate.statement).toContain('pp');
    expect(rate.statement).not.toMatch(/\(\s*[+−-]\d+(\.\d+)?%\s*\)/);
  });

  it('reports a rating change in rating points, never percent', () => {
    const rating = allFacts.find(({ statement }) => statement.includes('average rating'))!;
    expect(rating.statement).toMatch(/−0\.23/);
    expect(rating.statement).not.toContain('%');
  });

  it('does not express a rating goal as a percentage of target', () => {
    const reputation = allFacts.find(({ statement }) => statement.includes('Local reputation'))!;
    expect(reputation.statement).toContain('4.56');
    expect(reputation.statement).not.toMatch(/% of target/);
  });
});

describe('the exclusion ledger', () => {
  it('records goals that no connected source can measure', () => {
    const unmeasured = allExclusions.filter(({ reason }) => reason === 'NO_MEASUREMENT_ATTACHED');
    expect(unmeasured.map(({ subject }) => subject)).toEqual([
      expect.stringContaining('G-02'),
      expect.stringContaining('G-04'),
    ]);
  });

  it('records completed work that was never measured', () => {
    const unmeasured = allExclusions.find(({ reason }) => reason === 'NO_OUTCOME_RECORDED')!;
    expect(unmeasured.detail).toMatch(/unknown rather than neutral/);
  });

  it('distinguishes work still being monitored from work never checked', () => {
    const reasons = new Set(allExclusions.map(({ reason }) => reason));
    expect(reasons).toContain('NOT_YET_MEASURED');
    expect(reasons).toContain('NO_OUTCOME_RECORDED');
  });

  it('records an outcome that cannot be computed rather than substituting a number', () => {
    const notMeasurable = allExclusions.find(({ reason }) => reason === 'NO_METRIC_PERSISTED')!;
    expect(notMeasurable.detail).toMatch(/No number is offered/);
  });

  it('excludes a metric whose prior period is missing', () => {
    const partial = mutableSnapshot();
    const sessions = partial.overview.kpis.find(({ key }) => key === 'sessions')!;
    sessions.prior = null;
    sessions.change = null;

    const rebuilt = buildFactPacket(partial);
    const movement = rebuilt.sections.find(({ key }) => key === 'MOVEMENT')!;

    expect(movement.facts.some(({ statement }) => statement.includes('Website sessions'))).toBe(
      false,
    );
    expect(movement.exclusions.find(({ subject }) => subject === 'Website sessions')!.reason).toBe(
      'NO_PRIOR_PERIOD',
    );
  });

  it('excludes a metric marked invalid', () => {
    const invalid = mutableSnapshot();
    invalid.overview.kpis.find(({ key }) => key === 'sessions')!.current!.qualityStatus = 'INVALID';

    const rebuilt = buildFactPacket(invalid);
    const movement = rebuilt.sections.find(({ key }) => key === 'MOVEMENT')!;

    expect(movement.exclusions.some(({ reason }) => reason === 'QUALITY_INVALID')).toBe(true);
  });

  it('excludes a rate built on too few events', () => {
    const thin = mutableSnapshot();
    const rate = thin.overview.kpis.find(({ key }) => key === 'ac-repair-booking-rate')!;
    rate.current!.qualityFlags = ['SMALL_DENOMINATOR'];

    const rebuilt = buildFactPacket(thin);
    const movement = rebuilt.sections.find(({ key }) => key === 'MOVEMENT')!;

    expect(movement.exclusions.some(({ reason }) => reason === 'BELOW_VOLUME_FLOOR')).toBe(true);
  });

  it('records a rule that ran and found nothing', () => {
    const quiet = mutableSnapshot();
    quiet.weeklyReview.evaluations[0]!.emitted = false;
    quiet.weeklyReview.evaluations[0]!.blockedReasons = ['CONDITIONS_NOT_MET'];

    const rebuilt = buildFactPacket(quiet);
    const observations = rebuilt.sections.find(({ key }) => key === 'OBSERVATIONS')!;
    const exclusion = observations.exclusions[0]!;

    expect(exclusion.reason).toBe('RULE_CONDITIONS_NOT_MET');
    expect(exclusion.detail).toMatch(/Nothing is wrong; nothing happened/);
  });

  it('separates a rule blocked by quality from a rule that simply did not fire', () => {
    const blocked = mutableSnapshot();
    blocked.weeklyReview.evaluations[0]!.emitted = false;
    blocked.weeklyReview.evaluations[0]!.blockedReasons = ['STALE_SOURCE'];

    const rebuilt = buildFactPacket(blocked);
    const observations = rebuilt.sections.find(({ key }) => key === 'OBSERVATIONS')!;

    expect(observations.exclusions[0]!.reason).toBe('RULE_BLOCKED_BY_QUALITY');
  });

  it('records a source that has never returned history', () => {
    const silent = mutableSnapshot();
    silent.connections[0]!.dataState = 'NO_HISTORY';

    const rebuilt = buildFactPacket(silent);
    const period = rebuilt.sections.find(({ key }) => key === 'PERIOD')!;

    expect(period.exclusions[0]!.reason).toBe('SOURCE_HAS_NO_HISTORY');
  });
});

describe('ordering and shape', () => {
  it('ranks priorities by urgency, then impact, then effort', () => {
    const priorities = packet.sections.find(({ key }) => key === 'PRIORITIES')!;
    const urgencyOrder = ['immediate attention', 'this week', 'this month', 'capacity allows'];

    const positions = priorities.facts.map(({ statement }) =>
      urgencyOrder.findIndex((phrase) => statement.includes(phrase)),
    );
    // A statement matching no phrase would sort to the front and hide a real ordering break.
    expect(positions).not.toContain(-1);
    expect(positions).toEqual([...positions].sort((left, right) => left - right));
  });

  it('keeps every section present even when it holds nothing to say', () => {
    const empty = mutableSnapshot();
    empty.actions = [];
    empty.outcomes = [];

    const rebuilt = buildFactPacket(empty);
    expect(rebuilt.sections).toHaveLength(6);

    const work = rebuilt.sections.find(({ key }) => key === 'WORK')!;
    expect(work.facts).toHaveLength(0);
    expect(work.emptyStatement).toMatch(/No work is currently in flight/);
  });

  it('publishes the admission rules rather than only applying them', () => {
    expect(packet.admissionRules.length).toBeGreaterThanOrEqual(6);
    expect(packet.admissionRules.map(({ key }) => key)).toContain('no-aggregate-verdict');
  });

  it('counts what it admitted and what it turned away', () => {
    expect(packet.totals.factCount).toBe(allFacts.length);
    expect(packet.totals.exclusionCount).toBe(allExclusions.length);
    expect(packet.totals.evidenceCitedCount).toBe(
      new Set(allFacts.flatMap(({ evidenceIds }) => evidenceIds)).size,
    );
  });

  it('turns away enough to be worth publishing', () => {
    // A ledger that is always empty is decoration. This dataset is clean and still withholds.
    expect(allExclusions.length).toBeGreaterThanOrEqual(8);
  });

  it('is deterministic across builds', () => {
    expect(JSON.stringify(buildFactPacket(buildDemoSnapshot()))).toBe(JSON.stringify(packet));
  });
});
