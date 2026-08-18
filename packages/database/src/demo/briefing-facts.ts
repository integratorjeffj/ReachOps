import {
  DemoFactPacketSchema,
  type DemoAction,
  type DemoBriefingExclusion,
  type DemoBriefingFact,
  type DemoBriefingSection,
  type DemoFactPacket,
  type DemoOutcomeMeasurement,
  type DemoRecommendation,
  type DemoSnapshot,
  type MetricUnit,
  type ObservationCandidate,
  type OverviewResponse,
} from '@reachops/contracts';
import { formatMetricValue } from '../metrics/period-comparison';

/**
 * Assembles the fact packet the written briefing is composed from.
 *
 * The input is the published snapshot rather than the fixtures behind it. That is deliberate and
 * structural: the packet can only cite what the product already shows somewhere else, so a briefing
 * sentence and the table a reader opens to check it are drawing on the same record. Reaching past
 * the snapshot into the fixtures would allow the narrative to know things no other surface does.
 *
 * Nothing here writes prose freely. Every statement comes from a fixed template applied to a value
 * that arrived with an evidence identifier, and every candidate that failed an admission rule is
 * kept with its reason rather than dropped.
 */

export const FACT_PACKET_RULE_VERSION = '1.0.0';

/** Rates computed on fewer than this many denominator events are not reported as movements. */
const VOLUME_FLOOR = 100;

const ADMISSION_RULES = [
  {
    key: 'evidence-required',
    title: 'Every measured value cites evidence',
    description:
      'Any fact stating a business measurement carries at least one evidence identifier that resolves to a record in the snapshot. The two exceptions are the reporting window and the source-coverage line, which describe the briefing itself rather than the business, and are substantiated by the connection list shown beside them.',
  },
  {
    key: 'prior-required-for-change',
    title: 'A change needs both periods',
    description:
      'Movement is stated only where a current and a prior value both exist. A single value is reported as a level, never as a trend.',
  },
  {
    key: 'quality-floor',
    title: 'Invalid and stale records are refused',
    description:
      'Records marked invalid or stale are excluded outright. Partial records may be used, but only with their coverage note carried into the briefing as a caveat.',
  },
  {
    key: 'volume-floor',
    title: 'Rates need a denominator worth dividing',
    description: `Percentages and rates built on fewer than ${VOLUME_FLOOR} denominator events are excluded, because the movement would be an artefact of the sample rather than a finding.`,
  },
  {
    key: 'explanation-is-labelled',
    title: 'Explanations travel as hypotheses',
    description:
      'A suggested explanation is admitted only where the underlying opportunity records one, and it is carried with the confidence held in it. Where no explanation is supported, the absence is recorded rather than filled in.',
  },
  {
    key: 'no-aggregate-verdict',
    title: 'No overall verdict',
    description:
      'The packet holds no fact summarising performance as a whole. There is no composite score, no overall grade, and no sentence that averages unlike metrics into a single direction.',
  },
] as const;

/**
 * Statements the renderer may not produce whatever the facts contain.
 *
 * Published with the packet rather than kept in a test, so a reader can see the constraint the
 * product placed on itself instead of inferring it from what happens to be absent.
 */
const BOUNDARIES = [
  'No sentence asserts that a recommendation caused a measured change. Work and movement are reported separately, and where both are shown the competing explanations are named.',
  'No sentence reports a figure that is not in the snapshot, and no figure appears without the evidence identifier it came from.',
  'No sentence grades overall performance, assigns a composite score, or states a confidence percentage in its own analysis.',
  'No sentence describes a movement as good or bad on the sign of the number alone; direction is derived from whether the metric is one the business wants lower.',
];

const SECTION_META: Record<
  DemoBriefingSection['key'],
  { title: string; purpose: string; emptyStatement: string }
> = {
  PERIOD: {
    title: 'What this covers',
    purpose: 'The window under review and which sources reported into it.',
    emptyStatement: 'No reporting window is established, so nothing below can be dated.',
  },
  MOVEMENT: {
    title: 'What moved',
    purpose: 'Headline metrics and goal attainment where both periods are available.',
    emptyStatement: 'No metric had both a current and a prior period, so no movement is reported.',
  },
  OBSERVATIONS: {
    title: 'What the rules flagged',
    purpose: 'Deterministic observations raised against this window, with no cause asserted.',
    emptyStatement: 'No rule met its conditions this week. That is a result, not a gap.',
  },
  PRIORITIES: {
    title: 'What is ranked for attention',
    purpose: 'Opportunities ordered by urgency, then impact, then effort. No composite score.',
    emptyStatement: 'Nothing is currently ranked for attention.',
  },
  WORK: {
    title: 'What is in flight',
    purpose: 'Approved and in-progress work, with an owner and a review date.',
    emptyStatement: 'No work is currently in flight.',
  },
  OUTCOMES: {
    title: 'What happened after earlier work',
    purpose: 'Measured differences following completed work, with confounders named.',
    emptyStatement: 'No completed work has a closed measurement window yet.',
  },
};

const URGENCY_RANK: Record<string, number> = {
  IMMEDIATE: 0,
  THIS_WEEK: 1,
  THIS_MONTH: 2,
  EVERGREEN: 3,
};
const IMPACT_RANK: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
const EFFORT_RANK: Record<string, number> = { XS: 0, S: 1, M: 2, L: 3 };

const URGENCY_PHRASE: Record<string, string> = {
  IMMEDIATE: 'immediate attention',
  THIS_WEEK: 'attention this week',
  THIS_MONTH: 'attention this month',
  EVERGREEN: 'attention when capacity allows',
};

const EFFORT_PHRASE: Record<string, string> = {
  XS: 'a very small change',
  S: 'a small change',
  M: 'a moderate change',
  L: 'a large change',
  XL: 'a very large change',
};

/**
 * Fact kinds that describe the briefing rather than the business.
 *
 * These two carry no evidence identifier because there is no measurement in them: one states the
 * window, the other counts the connections listed alongside it. Every other kind must cite.
 */
const STRUCTURAL_KINDS = new Set<DemoBriefingFact['kind']>(['WINDOW', 'SOURCE_COVERAGE']);

const ACTION_STATUS_PHRASE: Record<DemoAction['status'], string> = {
  COMPLETED: 'is complete',
  IN_PROGRESS: 'is in progress',
  APPROVED: 'is approved and not yet started',
  MONITORING: 'is being monitored',
};

/** Builds the packet from a published snapshot. */
export function buildFactPacket(snapshot: DemoSnapshot): DemoFactPacket {
  const evidenceIndex = new Set(snapshot.evidence.map(({ evidenceId }) => evidenceId));
  const factory = new PacketFactory(evidenceIndex);

  const sections: DemoBriefingSection[] = [
    buildPeriodSection(snapshot, factory),
    buildMovementSection(snapshot, factory),
    buildObservationsSection(snapshot, factory),
    buildPrioritiesSection(snapshot, factory),
    buildWorkSection(snapshot, factory),
    buildOutcomesSection(snapshot, factory),
  ];

  const facts = sections.flatMap(({ facts: sectionFacts }) => sectionFacts);
  const cited = new Set(facts.flatMap(({ evidenceIds }) => evidenceIds));

  return DemoFactPacketSchema.parse({
    packetVersion: 1,
    datasetVersion: snapshot.datasetVersion,
    packetRuleVersion: FACT_PACKET_RULE_VERSION,
    window: snapshot.weeklyReview.window,
    admissionRules: ADMISSION_RULES,
    sections,
    boundaries: BOUNDARIES,
    totals: {
      factCount: facts.length,
      exclusionCount: sections.reduce((sum, section) => sum + section.exclusions.length, 0),
      evidenceCitedCount: cited.size,
    },
  });
}

/**
 * Issues identifiers and enforces the one rule that cannot be left to the caller.
 *
 * An evidence identifier that does not resolve is a defect, not a data-quality state: it means the
 * packet is citing something the reader cannot open. Failing the build is the correct response.
 */
class PacketFactory {
  private factCount = 0;
  private exclusionCount = 0;

  constructor(private readonly evidenceIndex: Set<string>) {}

  fact(input: Omit<DemoBriefingFact, 'id'>): DemoBriefingFact {
    for (const evidenceId of input.evidenceIds) {
      if (!this.evidenceIndex.has(evidenceId)) {
        throw new Error(
          `Fact "${input.statement}" cites ${evidenceId}, which is not in the snapshot evidence set.`,
        );
      }
    }
    if (!STRUCTURAL_KINDS.has(input.kind) && input.evidenceIds.length === 0) {
      throw new Error(
        `Fact "${input.statement}" states a measurement with no evidence behind it. Either cite the record or record an exclusion.`,
      );
    }
    this.factCount += 1;
    return { ...input, id: `FACT-${String(this.factCount).padStart(3, '0')}` };
  }

  exclusion(input: Omit<DemoBriefingExclusion, 'id'>): DemoBriefingExclusion {
    this.exclusionCount += 1;
    return { ...input, id: `EXCL-${String(this.exclusionCount).padStart(3, '0')}` };
  }
}

function section(
  key: DemoBriefingSection['key'],
  facts: DemoBriefingFact[],
  exclusions: DemoBriefingExclusion[],
): DemoBriefingSection {
  return { key, ...SECTION_META[key], facts, exclusions };
}

function buildPeriodSection(snapshot: DemoSnapshot, factory: PacketFactory): DemoBriefingSection {
  const { window } = snapshot.weeklyReview;
  const facts: DemoBriefingFact[] = [
    factory.fact({
      kind: 'WINDOW',
      section: 'PERIOD',
      statement: `This briefing covers ${formatDay(window.start, window.timezone)} to ${formatDay(
        window.end,
        window.timezone,
      )}, reported in ${window.timezone}.`,
      direction: 'NOT_COMPARABLE',
      evidenceIds: [],
      sourceModes: [],
      qualityStatus: 'COMPLETE',
      qualityFlags: [],
      caveat: null,
      hypothesis: null,
      link: null,
    }),
  ];

  const exclusions: DemoBriefingExclusion[] = [];
  const reporting = snapshot.connections.filter(({ dataState }) => dataState === 'ACTIVE');
  const byMode = new Map<string, number>();
  for (const connection of reporting) {
    byMode.set(connection.mode, (byMode.get(connection.mode) ?? 0) + 1);
  }

  if (reporting.length > 0) {
    const breakdown = [...byMode.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([mode, count]) => `${count} ${mode.toLowerCase()}`)
      .join(', ');
    facts.push(
      factory.fact({
        kind: 'SOURCE_COVERAGE',
        section: 'PERIOD',
        statement: `${reporting.length} sources returned data for this window (${breakdown}). No source is authorized against a live account.`,
        direction: 'NOT_COMPARABLE',
        evidenceIds: [],
        sourceModes: [...new Set(reporting.map(({ mode }) => mode))],
        qualityStatus: 'COMPLETE',
        qualityFlags: [],
        caveat: null,
        hypothesis: null,
        link: null,
      }),
    );
  }

  for (const connection of snapshot.connections) {
    if (connection.dataState !== 'NO_HISTORY') continue;
    exclusions.push(
      factory.exclusion({
        section: 'PERIOD',
        subject: connection.displayName,
        reason: 'SOURCE_HAS_NO_HISTORY',
        detail: `${connection.displayName} is connected but has returned no observations, so nothing in this briefing draws on it.`,
      }),
    );
  }

  return section('PERIOD', facts, exclusions);
}

function buildMovementSection(snapshot: DemoSnapshot, factory: PacketFactory): DemoBriefingSection {
  const facts: DemoBriefingFact[] = [];
  const exclusions: DemoBriefingExclusion[] = [];

  for (const kpi of snapshot.overview.kpis) {
    const admitted = admitKpi(kpi);
    if (admitted !== null) {
      exclusions.push(factory.exclusion({ section: 'MOVEMENT', ...admitted }));
      continue;
    }

    const definition = kpi.definition!;
    const current = kpi.current!;
    const prior = kpi.prior!;
    const change = kpi.change!;
    const { unit } = definition;

    facts.push(
      factory.fact({
        kind: 'KPI_MOVEMENT',
        section: 'MOVEMENT',
        statement: `${kpi.label} ${movementVerb(change.direction)} from ${formatMetricValue(
          prior.value,
          unit,
        )} to ${formatMetricValue(current.value, unit)} (${formatChange(change, unit)}).`,
        direction: directionOf(change.direction, definition.lowerIsBetter),
        evidenceIds: [current.evidenceId, prior.evidenceId],
        sourceModes: kpi.sourceModes,
        qualityStatus: current.qualityStatus,
        qualityFlags: [...new Set([...current.qualityFlags, ...prior.qualityFlags])],
        caveat: kpi.coverageNote,
        hypothesis: null,
        link: { entityType: 'KPI', entityId: kpi.key },
      }),
    );
  }

  for (const goal of snapshot.overview.goals) {
    if (goal.status === 'UNAVAILABLE' || goal.evidenceId === null || goal.currentValue === null) {
      exclusions.push(
        factory.exclusion({
          section: 'MOVEMENT',
          subject: `${goal.stableKey} · ${goal.title}`,
          reason: 'NO_MEASUREMENT_ATTACHED',
          detail: `This goal is tracked in ${goalUnitPhrase(goal.targetUnit)}, which no connected source reports, so attainment cannot be stated. The target is on record; the progress towards it is not.`,
        }),
      );
      continue;
    }

    const unit = goal.definition?.unit ?? 'COUNT';
    // Attainment as a percentage only means something for a countable target. Expressing a 4.56
    // rating against a 4.60 target as "99% of target" makes a real shortfall sound like a rounding
    // error, so ratings and rates state the level and let the gap speak for itself.
    const attainment =
      goal.attainmentPercentage === null || unit !== 'COUNT'
        ? ''
        : ` That is ${goal.attainmentPercentage.toFixed(0)}% of target.`;
    facts.push(
      factory.fact({
        kind: 'GOAL_ATTAINMENT',
        section: 'MOVEMENT',
        statement: `${goal.title} stands at ${formatMetricValue(goal.currentValue, unit)} against a target of ${formatMetricValue(
          goal.targetValue,
          unit,
        )}.${attainment}`,
        direction: goalDirection(goal),
        evidenceIds: [goal.evidenceId],
        sourceModes: goal.sourceMode === null ? [] : [goal.sourceMode],
        qualityStatus: 'COMPLETE',
        qualityFlags: [],
        caveat: null,
        hypothesis: null,
        link: { entityType: 'GOAL', entityId: goal.stableKey },
      }),
    );
  }

  return section('MOVEMENT', facts, exclusions);
}

/** Returns an exclusion when a headline metric cannot carry a movement statement. */
function admitKpi(
  kpi: OverviewResponse['kpis'][number],
): Omit<DemoBriefingExclusion, 'id' | 'section'> | null {
  const subject = kpi.label;

  if (kpi.definition === null || kpi.current === null) {
    return {
      subject,
      reason: 'NO_PRIOR_PERIOD',
      detail: 'No current value is available for this window.',
    };
  }
  if (kpi.prior === null || kpi.change === null) {
    return {
      subject,
      reason: 'NO_PRIOR_PERIOD',
      detail: 'A current value exists but no prior period, so no movement can be stated.',
    };
  }
  if (kpi.current.qualityStatus === 'INVALID' || kpi.prior.qualityStatus === 'INVALID') {
    return {
      subject,
      reason: 'QUALITY_INVALID',
      detail: 'One of the two periods is marked invalid, so no comparison is reported.',
    };
  }
  if (kpi.current.qualityStatus === 'STALE' || kpi.prior.qualityStatus === 'STALE') {
    return {
      subject,
      reason: 'QUALITY_STALE',
      detail: 'One of the two periods has not refreshed within the window it claims to cover.',
    };
  }
  if (
    kpi.definition.unit === 'PERCENTAGE' &&
    [...kpi.current.qualityFlags, ...kpi.prior.qualityFlags].includes('SMALL_DENOMINATOR')
  ) {
    return {
      subject,
      reason: 'BELOW_VOLUME_FLOOR',
      detail: `This rate is computed on fewer than ${VOLUME_FLOOR} events, so the movement would describe the sample rather than the business.`,
    };
  }
  return null;
}

function buildObservationsSection(
  snapshot: DemoSnapshot,
  factory: PacketFactory,
): DemoBriefingSection {
  const facts = snapshot.weeklyReview.observations.map((observation: ObservationCandidate) =>
    factory.fact({
      kind: 'OBSERVATION',
      section: 'OBSERVATIONS',
      statement: observation.summary,
      direction: 'NOT_COMPARABLE',
      evidenceIds: observation.evidenceIds,
      sourceModes: observation.sourceModes,
      qualityStatus: observation.quality.status,
      qualityFlags: observation.quality.flags,
      caveat: null,
      hypothesis: null,
      link: { entityType: 'OBSERVATION', entityId: observation.id },
    }),
  );

  const exclusions = snapshot.weeklyReview.evaluations
    .filter(({ emitted }) => !emitted)
    .map((evaluation) =>
      factory.exclusion({
        section: 'OBSERVATIONS',
        subject: evaluation.ruleKey,
        reason: evaluation.blockedReasons.includes('CONDITIONS_NOT_MET')
          ? 'RULE_CONDITIONS_NOT_MET'
          : 'RULE_BLOCKED_BY_QUALITY',
        detail: evaluation.blockedReasons.includes('CONDITIONS_NOT_MET')
          ? 'The rule ran and its thresholds were not crossed. Nothing is wrong; nothing happened.'
          : `The rule was prevented from running by its own quality gate (${evaluation.blockedReasons.join(', ').toLowerCase()}).`,
      }),
    );

  return section('OBSERVATIONS', facts, exclusions);
}

function buildPrioritiesSection(
  snapshot: DemoSnapshot,
  factory: PacketFactory,
): DemoBriefingSection {
  const facts: DemoBriefingFact[] = [];
  const exclusions: DemoBriefingExclusion[] = [];

  // Dismissed and completed opportunities are not ranked for attention. They stay in the product;
  // they do not belong in a list of what to do next.
  const ranked = [...snapshot.weeklyReview.recommendations]
    .filter(({ status }) => status !== 'DISMISSED' && status !== 'COMPLETED')
    .sort(compareRecommendations);

  for (const recommendation of ranked) {
    const hypothesis =
      recommendation.causalHypothesis !== null && recommendation.causalConfidence !== null
        ? { text: recommendation.causalHypothesis, confidence: recommendation.causalConfidence }
        : null;

    if (hypothesis === null) {
      exclusions.push(
        factory.exclusion({
          section: 'PRIORITIES',
          // The opportunity itself is admitted; it is the explanation that is withheld. Naming the
          // subject as the explanation keeps the two apart, so this does not read as a
          // contradiction of the fact carrying the same identifier.
          subject: `Explanation for ${recommendation.id} · ${recommendation.title}`,
          reason: 'NO_SUPPORTED_EXPLANATION',
          detail:
            'The observation is well supported; no explanation for it is. It is ranked as something to look into rather than something already understood.',
        }),
      );
    }

    facts.push(
      factory.fact({
        kind: 'PRIORITY',
        section: 'PRIORITIES',
        statement: `${recommendation.title} is ranked for ${
          URGENCY_PHRASE[recommendation.urgency] ?? 'attention'
        }: ${recommendation.impact.toLowerCase()} expected impact, ${
          EFFORT_PHRASE[recommendation.effort] ?? 'an unsized change'
        }, and the observation behind it is held with ${recommendation.observationConfidence.toLowerCase()} confidence.`,
        direction: 'NOT_COMPARABLE',
        evidenceIds: recommendation.evidenceIds,
        sourceModes: [],
        qualityStatus: 'COMPLETE',
        qualityFlags: [],
        caveat: null,
        hypothesis,
        link: { entityType: 'OPPORTUNITY', entityId: recommendation.id },
      }),
    );
  }

  return section('PRIORITIES', facts, exclusions);
}

/** Categorical ordering, most urgent first. Ties break on impact, then on the cheaper change. */
function compareRecommendations(left: DemoRecommendation, right: DemoRecommendation): number {
  const byUrgency = (URGENCY_RANK[left.urgency] ?? 9) - (URGENCY_RANK[right.urgency] ?? 9);
  if (byUrgency !== 0) return byUrgency;
  const byImpact = (IMPACT_RANK[left.impact] ?? 9) - (IMPACT_RANK[right.impact] ?? 9);
  if (byImpact !== 0) return byImpact;
  const byEffort = (EFFORT_RANK[left.effort] ?? 9) - (EFFORT_RANK[right.effort] ?? 9);
  if (byEffort !== 0) return byEffort;
  return left.id.localeCompare(right.id);
}

function buildWorkSection(snapshot: DemoSnapshot, factory: PacketFactory): DemoBriefingSection {
  const facts = snapshot.actions
    .filter(({ current }) => current)
    .map((action) =>
      factory.fact({
        kind: 'WORK_IN_FLIGHT',
        section: 'WORK',
        statement: `${action.title} ${ACTION_STATUS_PHRASE[action.status]}, owned by ${action.owner}${
          action.reviewOn === null
            ? ''
            : `, with a review due ${formatCalendarDay(action.reviewOn)}`
        }.`,
        direction: 'NOT_COMPARABLE',
        evidenceIds: action.evidenceIds,
        sourceModes: [],
        qualityStatus: 'COMPLETE',
        qualityFlags: [],
        caveat: null,
        hypothesis: null,
        link: { entityType: 'ACTION', entityId: action.id },
      }),
    );

  return section('WORK', facts, []);
}

function buildOutcomesSection(snapshot: DemoSnapshot, factory: PacketFactory): DemoBriefingSection {
  const facts: DemoBriefingFact[] = [];
  const exclusions: DemoBriefingExclusion[] = [];

  for (const outcome of snapshot.outcomes) {
    if (outcome.status === 'NOT_MEASURABLE') {
      exclusions.push(
        factory.exclusion({
          section: 'OUTCOMES',
          subject: outcome.title,
          reason: 'NO_METRIC_PERSISTED',
          detail: `${outcome.assessment} No number is offered in place of the one that does not exist.`,
        }),
      );
      continue;
    }
    if (outcome.status === 'GATHERING' || outcome.baseline === null || outcome.followUp === null) {
      exclusions.push(
        factory.exclusion({
          section: 'OUTCOMES',
          subject: outcome.title,
          reason: 'NOT_YET_MEASURED',
          detail:
            'The follow-up window has not closed yet. Reporting a partial window would overstate what is known.',
        }),
      );
      continue;
    }

    facts.push(factory.fact(outcomeFact(outcome)));
  }

  const measured = new Set(snapshot.outcomes.map(({ actionId }) => actionId));
  for (const action of snapshot.actions) {
    if (measured.has(action.id)) continue;
    if (action.status === 'COMPLETED') {
      exclusions.push(
        factory.exclusion({
          section: 'OUTCOMES',
          subject: action.title,
          reason: 'NO_OUTCOME_RECORDED',
          detail: `${action.id} was completed and no measurement was ever opened against it, so whether it helped is unknown rather than neutral.`,
        }),
      );
    } else if (action.status === 'MONITORING') {
      exclusions.push(
        factory.exclusion({
          section: 'OUTCOMES',
          subject: action.title,
          reason: 'NOT_YET_MEASURED',
          detail: `${action.id} is still being monitored. Its measurement window is open, so no difference is reported yet.`,
        }),
      );
    }
  }

  return section('OUTCOMES', facts, exclusions);
}

function outcomeFact(outcome: DemoOutcomeMeasurement): Omit<DemoBriefingFact, 'id'> {
  const baseline = outcome.baseline!;
  const followUp = outcome.followUp!;
  const unit = outcome.unit as MetricUnit;
  const relative =
    outcome.relativeChangePercent === null ? '' : ` (${signed(outcome.relativeChangePercent, 1)}%)`;

  const confounders =
    outcome.confounders.length === 0
      ? outcome.caveat
      : `${outcome.caveat} Competing explanations on record: ${outcome.confounders.join(' ')}`;

  return {
    kind: 'OUTCOME',
    section: 'OUTCOMES',
    statement: `After ${outcome.title}, ${outcome.metricLabel} moved from ${formatMetricValue(
      baseline.value,
      unit,
    )} in ${baseline.label} to ${formatMetricValue(followUp.value, unit)} in ${followUp.label}${relative}.`,
    direction: 'NOT_COMPARABLE',
    evidenceIds: [...baseline.evidenceIds, ...followUp.evidenceIds],
    sourceModes: [],
    qualityStatus: 'COMPLETE',
    qualityFlags: [],
    caveat: confounders,
    hypothesis: null,
    link: { entityType: 'OUTCOME', entityId: outcome.id },
  };
}

/**
 * Whether a movement is the direction the business wants.
 *
 * Read from the metric definition rather than the sign of the change, so a rising average response
 * time is not congratulated for going up.
 */
function directionOf(
  direction: 'UP' | 'DOWN' | 'FLAT',
  lowerIsBetter: boolean,
): DemoBriefingFact['direction'] {
  if (direction === 'FLAT') return 'FLAT';
  const rising = direction === 'UP';
  return rising === lowerIsBetter ? 'WORSE' : 'BETTER';
}

/** Renders a goal's target unit as prose. Enum names leaking into a briefing read as a bug. */
function goalUnitPhrase(targetUnit: string | null): string {
  const phrases: Record<string, string> = {
    CONFIRMED_BOOKINGS_PER_MONTH: 'confirmed bookings per month',
    PERCENT_YEAR_OVER_YEAR: 'year-over-year percentage growth',
    CUMULATIVE_RATING: 'a cumulative rating',
    BUSINESS_DAYS: 'business days to resolution',
  };
  return targetUnit === null ? 'a unit' : (phrases[targetUnit] ?? targetUnit.toLowerCase());
}

function goalDirection(goal: OverviewResponse['goals'][number]): DemoBriefingFact['direction'] {
  if (goal.attainmentPercentage === null) return 'NOT_COMPARABLE';
  return goal.attainmentPercentage >= 100 ? 'BETTER' : 'WORSE';
}

function movementVerb(direction: 'UP' | 'DOWN' | 'FLAT'): string {
  if (direction === 'UP') return 'rose';
  if (direction === 'DOWN') return 'fell';
  return 'held level';
}

/**
 * Renders a change in the terms the metric is actually measured in.
 *
 * A rate moves in percentage points, not percent, so a booking rate going 6.10 to 3.92 is −2.18 pp
 * and never −35.7%. Ratings and average position move in their own units: a 4.65 rating falling to
 * 4.42 is −0.23, and calling that −4.9% invites a reader to compare it against a click change,
 * which is a different kind of quantity entirely.
 */
function formatChange(
  change: NonNullable<OverviewResponse['kpis'][number]['change']>,
  unit: MetricUnit,
): string {
  if (unit === 'PERCENTAGE' && change.percentagePoints !== null) {
    return `${signed(change.percentagePoints, 2)} pp`;
  }
  if (unit === 'RATING') return signed(change.absolute, 2);
  if (unit === 'AVERAGE_POSITION') return signed(change.absolute, 1);
  if (change.percentage !== null) return `${signed(change.percentage, 1)}%`;
  return signed(change.absolute, 0);
}

/** Uses a true minus sign for negatives, matching the comparison display the tables render. */
function signed(value: number, digits: number): string {
  if (value === 0) return value.toFixed(digits);
  return `${value > 0 ? '+' : '−'}${Math.abs(value).toFixed(digits)}`;
}

const dayFormatter = (timezone: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: timezone,
  });

function formatDay(instant: string, timezone: string): string {
  return dayFormatter(timezone).format(new Date(instant));
}

function formatCalendarDay(calendarDate: string): string {
  const [year, month, day] = calendarDate.split('-').map(Number);
  return dayFormatter('UTC').format(new Date(Date.UTC(year!, month! - 1, day)));
}
