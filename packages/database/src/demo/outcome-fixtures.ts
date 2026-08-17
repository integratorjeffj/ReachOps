/**
 * Outcome measurements for completed work.
 *
 * Each entry names the metric the work was meant to move, the two windows it is judged across, and
 * anything else that could explain the difference. The windows are written down rather than
 * derived from a current selection, which is what makes the baseline immutable: no later filter
 * change can move the line the work is compared against.
 *
 * Deliberately not three successes. One outcome has a competing seasonal explanation strong enough
 * that attributing the gain to the work would be wrong, and one has no persisted metric at all. A
 * product where every completed task shows a green number is not measuring anything.
 */

export type OutcomeStatus = 'MEASURED' | 'GATHERING' | 'NOT_MEASURABLE';

export interface OutcomeFixture {
  id: string;
  actionId: string;
  title: string;
  plannedContentId: string | null;
  metricStableKey: string;
  status: OutcomeStatus;
  implementationDate: string;
  /** Page key whose month-grain history supplies both windows, when one applies. */
  pageKey: string | null;
  baselineMonth: string | null;
  followUpMonth: string | null;
  assessment: string;
  confounders: string[];
  caveat: string;
}

export const outcomeFixtures: OutcomeFixture[] = [
  {
    id: 'OM-01',
    actionId: 'ACT-032',
    title: 'Water-heater comparison guide refresh',
    plannedContentId: 'PC-01',
    metricStableKey: 'gsc.clicks',
    status: 'MEASURED',
    implementationDate: '2026-03-14',
    pageKey: 'WATER-HEATER-GUIDE',
    baselineMonth: '2026-03',
    followUpMonth: '2026-04',
    assessment:
      'Organic clicks to the guide were higher in the month after the refresh than in the month of it, reversing a decline that had run since January.',
    confounders: [
      'The refresh published on 14 March, so the baseline month contains roughly two weeks of post-refresh traffic. That makes the measured improvement conservative rather than inflated.',
    ],
    caveat:
      'Subsequent performance improvement. ReachOps does not attribute causation from this observation alone.',
  },
  {
    id: 'OM-02',
    actionId: 'ACT-052',
    title: 'AC repair page FAQ',
    plannedContentId: 'PC-02',
    metricStableKey: 'gsc.clicks',
    status: 'MEASURED',
    implementationDate: '2026-07-15',
    pageKey: 'AC-REPAIR',
    baselineMonth: '2026-06',
    followUpMonth: '2026-07',
    assessment:
      'Organic clicks to the AC repair page rose after the FAQ was published, but the whole property rose in the same window, so most of this movement is seasonal.',
    confounders: [
      'July is the peak cooling month in Denver. Website sessions across the entire property rose 11.9% over the same two months without any change to those pages.',
      'The FAQ published on 15 July, leaving only half the follow-up month exposed to it.',
    ],
    caveat:
      'A rise that coincides with a seasonal peak is not evidence the work caused it. Treat this as unresolved rather than successful.',
  },
  {
    id: 'OM-03',
    actionId: 'ACT-041',
    title: 'Dispatch notification process review',
    plannedContentId: null,
    metricStableKey: 'gbp.new_review_average_rating',
    status: 'NOT_MEASURABLE',
    implementationDate: '2026-05-04',
    pageKey: null,
    baselineMonth: null,
    followUpMonth: null,
    assessment:
      'The work targeted how often reviews mention scheduling, and review-theme frequency was never persisted as a metric. No before-and-after comparison exists.',
    confounders: [],
    caveat:
      'Recording this as unmeasured is more honest than substituting the cumulative rating, which moves for reasons that have nothing to do with dispatch notifications.',
  },
];
