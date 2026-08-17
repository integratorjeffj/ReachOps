import {
  DemoContentSnapshotSchema,
  type DemoContentCoverageGap,
  type DemoContentSnapshot,
  type DemoContentWorkspace,
  type DemoPlannedContent,
} from '@reachops/contracts';
import { campaigns, DEMO_DATASET_VERSION } from './fixtures';
import {
  CONTENT_REFERENCE_DATE,
  PLANNED_CONTENT_PIPELINE,
  plannedContent,
  type PlannedContentStatus,
} from './content-fixtures';
import { buildDemoSnapshot } from './snapshot';

/**
 * Builds the editorial workspace from the committed planned-content fixtures.
 *
 * Counters and coverage gaps are derived here rather than authored, so a fixture edit that fills
 * the calendar removes the warning by itself instead of leaving a stale claim behind.
 */

const STATUS_LABEL: Record<PlannedContentStatus, string> = {
  IDEA: 'Idea',
  BRIEF: 'Brief',
  DRAFT: 'Draft',
  REVIEW: 'Review',
  APPROVED: 'Approved',
  PLANNED: 'Planned',
  PUBLISHED: 'Published',
};

/** Statuses that still need a person to approve them before anything can be planned. */
const AWAITING_APPROVAL: PlannedContentStatus[] = ['REVIEW'];

const MINIMUM_GAP_DAYS = 10;

function addDays(date: string, days: number): string {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  return Math.round(
    (Date.parse(`${to}T00:00:00.000Z`) - Date.parse(`${from}T00:00:00.000Z`)) / 86_400_000,
  );
}

const workspaceDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Denver',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * A campaign ending at 23:59 Denver time is the next calendar day in UTC. Reading it back in the
 * workspace timezone keeps "runs until August 31" from being reported as September.
 */
function workspaceDate(instant: Date): string {
  return workspaceDateFormatter.format(instant);
}

/**
 * Walks the remaining days of an active campaign looking for the longest unplanned stretch.
 *
 * A campaign that still has weeks to run and nothing scheduled into them is a coverage problem the
 * calendar can prove, which is different from an assistant guessing that more content would help.
 */
function findCoverageGaps(
  items: DemoPlannedContent[],
  referenceDate: string,
): DemoContentCoverageGap[] {
  const gaps: DemoContentCoverageGap[] = [];

  for (const campaign of campaigns) {
    if (campaign.status !== 'ACTIVE' || campaign.endsAt === null) continue;
    const campaignEnds = workspaceDate(campaign.endsAt);
    if (campaignEnds <= referenceDate) continue;

    const plannedDates = new Set(
      items
        .filter((item) => item.campaignStableKey === campaign.stableKey && item.plannedDate)
        .map((item) => item.plannedDate!),
    );

    let longestStart: string | null = null;
    let longestDays = 0;
    let runStart: string | null = null;

    for (let day = referenceDate; day <= campaignEnds; day = addDays(day, 1)) {
      if (plannedDates.has(day)) {
        runStart = null;
        continue;
      }
      runStart ??= day;
      const runDays = daysBetween(runStart, day) + 1;
      if (runDays > longestDays) {
        longestDays = runDays;
        longestStart = runStart;
      }
    }

    if (longestStart && longestDays >= MINIMUM_GAP_DAYS) {
      gaps.push({
        campaignStableKey: campaign.stableKey,
        campaignName: campaign.name,
        gapStart: longestStart,
        gapEnd: addDays(longestStart, longestDays - 1),
        days: longestDays,
        campaignEnds,
        note: `${campaign.name} runs until ${campaignEnds} and has nothing planned across these ${longestDays} days. This is a gap in the calendar, not a judgement about what should fill it.`,
      });
    }
  }

  return gaps;
}

export function buildContentWorkspace(): DemoContentWorkspace {
  const opportunityByRuleKey = new Map(
    buildDemoSnapshot().weeklyReview.recommendations.map((recommendation) => [
      recommendation.ruleKey,
      recommendation,
    ]),
  );
  const referenceDate = CONTENT_REFERENCE_DATE;
  const weekEnd = addDays(referenceDate, 6);

  const items: DemoPlannedContent[] = plannedContent.map((fixture) => {
    const opportunity = fixture.sourceRuleKey
      ? opportunityByRuleKey.get(fixture.sourceRuleKey)
      : undefined;

    return {
      id: fixture.id,
      title: fixture.title,
      description: fixture.description,
      type: fixture.type,
      status: fixture.status,
      channel: fixture.channel,
      ownerName: fixture.ownerName,
      approverName: fixture.approverName,
      goalStableKey: fixture.goalStableKey,
      campaignStableKey: fixture.campaignStableKey,
      opportunityId: opportunity?.id ?? null,
      opportunityTitle: opportunity?.title ?? null,
      contentPillar: fixture.contentPillar,
      objective: fixture.objective,
      funnelStage: fixture.funnelStage,
      audience: fixture.audience,
      primaryTopic: fixture.primaryTopic,
      secondaryTopics: [...fixture.secondaryTopics],
      destinationPagePath: fixture.destinationPagePath,
      plannedDate: fixture.plannedDate,
      dueDate: fixture.dueDate,
      publishedDate: fixture.publishedDate,
      repurposedFromId: fixture.repurposedFromId,
      publishedRef: fixture.publishedRef,
      callToAction: fixture.callToAction,
      externallyScheduled: false,
      sourceMode: 'SIMULATED',
      overdue:
        fixture.status !== 'PUBLISHED' &&
        fixture.dueDate !== null &&
        fixture.dueDate < referenceDate,
    };
  });

  const pipeline = PLANNED_CONTENT_PIPELINE.map((status) => ({
    status,
    label: STATUS_LABEL[status],
    count: items.filter((item) => item.status === status).length,
  }));

  return {
    referenceDate,
    pipeline,
    items,
    counters: {
      dueThisWeek: items.filter(
        (item) =>
          item.status !== 'PUBLISHED' &&
          item.dueDate !== null &&
          item.dueDate >= referenceDate &&
          item.dueDate <= weekEnd,
      ).length,
      awaitingApproval: items.filter((item) => AWAITING_APPROVAL.includes(item.status)).length,
      overdue: items.filter((item) => item.overdue).length,
      plannedAhead: items.filter((item) => item.status === 'PLANNED' || item.status === 'APPROVED')
        .length,
    },
    coverageGaps: findCoverageGaps(items, referenceDate),
    publishingNote:
      'ReachOps holds no publishing scope for any provider. The pipeline ends at planned, and going live happens in the provider or the CMS.',
  };
}

export function buildContentSnapshot(): DemoContentSnapshot {
  return DemoContentSnapshotSchema.parse({
    snapshotVersion: 1,
    datasetVersion: DEMO_DATASET_VERSION,
    content: buildContentWorkspace(),
  });
}
