import {
  DemoCompetitorSnapshotSchema,
  type DemoCompetitorSnapshot,
  type DemoCompetitorWorkspace,
} from '@reachops/contracts';
import { DEMO_DATASET_VERSION } from './fixtures';
import { aiChecks } from './ai-search-fixtures';
import {
  COMPETITOR_INVENTED_NOTE,
  COMPETITOR_METHOD_NOTE,
  COMPETITOR_UNAVAILABLE,
  OVERLAP_SAMPLE_NOTE,
  SUBJECT_KEY,
  competitorEstimates,
  competitors,
  publicSignals,
  queryOverlaps,
  subject,
} from './competitor-fixtures';

/**
 * Builds the competitor workspace.
 *
 * The AI mention counts are computed from the recorded checks rather than authored here. That is
 * the point of doing it this way: the AI panel and the competitor screen are describing the same
 * twenty-one observations, and a second authored copy of those counts would eventually disagree
 * with the first.
 *
 * Mentions belonging to companies that are not tracked peers are carried separately rather than
 * dropped, so a reader who adds the per-competitor counts and finds them short of the total can see
 * exactly what is missing instead of assuming a bug.
 */

const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

export function buildCompetitorWorkspace(): DemoCompetitorWorkspace {
  const mentionCounts = countAiMentions();
  const trackedNames = new Set(competitors.map(({ name }) => name));

  const untrackedMentions = [...mentionCounts.entries()]
    .filter(([name]) => !trackedNames.has(name))
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));

  const built = competitors.map((competitor) => {
    const mentionCount = mentionCounts.get(competitor.name) ?? 0;

    return {
      key: competitor.key,
      name: competitor.name,
      positioning: competitor.positioning,
      reasonTracked: competitor.reasonTracked,
      publicRating: competitor.publicRating,
      publicReviewCount: competitor.publicReviewCount,
      lastPublishedOn: competitor.lastPublishedOn,
      observedOn: competitor.observedOn,
      aiMentionCount: mentionCount,
      // Carries its denominator for the same reason the AI panel's citation ratios do.
      aiMentionLabel: `${mentionCount} of ${aiChecks.length} checks`,
      sharedQueries: queryOverlaps
        .filter(({ competitorKeys }) => competitorKeys.includes(competitor.key))
        .map(({ query }) => query),
      estimates: competitorEstimates
        .filter(({ competitorKey }) => competitorKey === competitor.key)
        .map((estimate) => ({
          metric: estimate.metric,
          low: estimate.low,
          high: estimate.high,
          unit: estimate.unit,
          method: estimate.method,
          rangeLabel: `${numberFormatter.format(estimate.low)}–${numberFormatter.format(
            estimate.high,
          )} ${estimate.unit}`,
        })),
    };
  });

  return {
    mode: 'SIMULATED',
    inventedNote: COMPETITOR_INVENTED_NOTE,
    methodNote: COMPETITOR_METHOD_NOTE,
    subject: { ...subject },
    competitors: built,
    signals: publicSignals.map((signal) => {
      const doing = competitors.filter(({ key }) => signal.values[key]).length;
      return {
        ...signal,
        values: { ...signal.values },
        competitorsDoingIt: doing,
        competitorRatioLabel: `${doing} of ${competitors.length}`,
      };
    }),
    overlapNote: OVERLAP_SAMPLE_NOTE,
    sampledQueries: queryOverlaps.map(({ query }) => query),
    unavailable: COMPETITOR_UNAVAILABLE.map((entry) => ({ ...entry })),
    untrackedMentions,
    totals: {
      competitorCount: built.length,
      signalCount: publicSignals.length,
      aiCheckCount: aiChecks.length,
      subjectOnlyCount: publicSignals.filter(subjectOnly).length,
      subjectGapCount: publicSignals.filter(subjectGap).length,
    },
  };
}

export function buildCompetitorSnapshot(): DemoCompetitorSnapshot {
  return DemoCompetitorSnapshotSchema.parse({
    snapshotVersion: 1,
    datasetVersion: DEMO_DATASET_VERSION,
    competitors: buildCompetitorWorkspace(),
  });
}

/** Counts how many recorded AI checks named each company. Computed, never authored twice. */
function countAiMentions(): Map<string, number> {
  const counts = new Map<string, number>();
  for (const check of aiChecks) {
    for (const name of check.competitorsNamed) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  return counts;
}

/** The subject does this and no tracked competitor does. A position worth defending. */
function subjectOnly(signal: { values: Record<string, boolean> }): boolean {
  if (!signal.values[SUBJECT_KEY]) return false;
  return competitors.every(({ key }) => !signal.values[key]);
}

/**
 * The subject does not do this and at least one tracked competitor does.
 *
 * Deliberately not "every competitor". Requiring unanimity would report zero gaps on this data
 * while two of three rivals publish the pricing content the subject does not — which is the finding
 * the whole workspace exists to surface. The per-signal count carries the nuance a boolean loses.
 */
function subjectGap(signal: { values: Record<string, boolean> }): boolean {
  if (signal.values[SUBJECT_KEY]) return false;
  return competitors.some(({ key }) => signal.values[key]);
}
