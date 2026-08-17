import {
  DemoSocialSnapshotSchema,
  type DemoSocialInsight,
  type DemoSocialPost,
  type DemoSocialSnapshot,
  type DemoSocialWorkspace,
  type MetricDefinition,
} from '@reachops/contracts';
import { DEMO_DATASET_VERSION, sources } from './fixtures';
import { comparedMetric, definitionMap, weeklyFixtures, type WeeklyFixture } from './snapshot';
import { socialPlatforms, socialPosts, SOCIAL_RECENT_WINDOW_START } from './social-fixtures';

/**
 * Builds the social workspace from the committed post fixtures.
 *
 * Account-level evidence already lives in the core snapshot as EV-118 to EV-128, so nothing here
 * mints a second record for a number the Command Center can already cite.
 */

const SOCIAL_ACCOUNT_METRICS = [
  'meta.reach',
  'meta.impressions',
  'meta.engagements',
  'meta.engagement_rate',
  'meta.link_clicks',
  'meta.follower_growth',
  'linkedin.impressions',
  'linkedin.engagements',
  'linkedin.engagement_rate',
  'linkedin.clicks',
  'linkedin.follower_growth',
  'ga4.social_sessions',
  'ga4.social_bookings',
];

const MINIMUM_INSIGHT_SAMPLE = 3;

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

/** Rank within this account and platform only. Never a claim about anyone else's account. */
function percentileWithin(values: number[], value: number): number {
  if (values.length <= 1) return 50;
  const below = values.filter((candidate) => candidate < value).length;
  return Math.round((below / (values.length - 1)) * 100);
}

/**
 * Derives patterns the fixtures actually contain.
 *
 * Nothing here is asserted. The multiple is measured from the posts, and the insight is withheld
 * unless enough of them support it, so a fixture change that removes the pattern also removes the
 * claim rather than leaving a stale sentence behind.
 */
function buildSocialInsights(posts: DemoSocialPost[]): DemoSocialInsight[] {
  const insights: DemoSocialInsight[] = [];

  const recent = posts.filter(
    ({ publishedOn, platform }) =>
      publishedOn >= SOCIAL_RECENT_WINDOW_START && platform === 'INSTAGRAM',
  );
  const technicianReels = recent.filter(
    ({ technicianLed, format }) => technicianLed && format === 'REEL',
  );

  if (technicianReels.length >= MINIMUM_INSIGHT_SAMPLE && recent.length > technicianReels.length) {
    const reelMedian = median(technicianReels.map(({ reach }) => reach ?? 0));
    const allMedian = median(recent.map(({ reach }) => reach ?? 0));
    const multiple = allMedian > 0 ? Number((reelMedian / allMedian).toFixed(1)) : 0;

    if (multiple >= 1.2) {
      insights.push({
        key: 'technician-reel-reach',
        platform: 'INSTAGRAM',
        text: `Technician-led Reels reached ${multiple} times the median Instagram reach over the last eight weeks.`,
        multiple,
        metric: 'meta.reach',
        windowStart: SOCIAL_RECENT_WINDOW_START,
        sampleSize: technicianReels.length,
        comparisonSampleSize: recent.length,
        caveat: `Measured across ${technicianReels.length} technician-led Reels against ${recent.length} Instagram posts in the same window. A repeated pattern in a small sample is a reason to test it again, not evidence that the format caused the reach.`,
      });
    }
  }

  return insights;
}

export function buildSocialWorkspace(
  definitions: Map<string, MetricDefinition>,
  weekly: WeeklyFixture[],
): DemoSocialWorkspace {
  const platforms = socialPlatforms.map((platform) => {
    const source = sources.find(({ key }) => key === platform.connectionKey)!;
    return {
      platform: platform.platform,
      displayName: platform.displayName,
      connectionId: source.connectionId,
      sourceMode: source.mode,
      reportsReach: platform.reportsReach,
      engagementRateBasis: platform.engagementRateBasis,
      note: platform.note,
    };
  });
  const platformByKey = new Map(platforms.map((platform) => [platform.platform, platform]));

  const posts: DemoSocialPost[] = socialPosts.map((post) => {
    const platform = platformByKey.get(post.platform)!;
    // Engagement rate uses each platform's own denominator; the basis travels with the number.
    const basisValue =
      platform.engagementRateBasis === 'REACH' ? (post.reach ?? 0) : post.impressions;

    return {
      id: post.id,
      platform: post.platform,
      publishedOn: post.publishedOn,
      campaignStableKey: post.campaignStableKey,
      pillar: post.pillar,
      format: post.format,
      technicianLed: post.technicianLed,
      caption: post.caption,
      sourceMode: platform.sourceMode,
      reach: post.reach,
      impressions: post.impressions,
      engagements: post.engagements,
      linkClicks: post.linkClicks,
      siteSessions: post.siteSessions,
      engagementRate:
        basisValue > 0 ? Number(((post.engagements / basisValue) * 100).toFixed(2)) : 0,
      engagementRateBasis: platform.engagementRateBasis,
      performancePercentile: 50,
      percentileBasis: platform.reportsReach ? ('REACH' as const) : ('IMPRESSIONS' as const),
    };
  });

  // Percentiles are computed per platform, so a LinkedIn post is never ranked against Instagram.
  for (const platform of platforms) {
    const cohort = posts.filter(({ platform: key }) => key === platform.platform);
    const basisOf = (post: DemoSocialPost) =>
      platform.reportsReach ? (post.reach ?? 0) : post.impressions;
    const values = cohort.map(basisOf);
    for (const post of cohort) {
      post.performancePercentile = percentileWithin(values, basisOf(post));
    }
  }

  const accountTotals = weekly
    .filter(({ stableKey }) => SOCIAL_ACCOUNT_METRICS.includes(stableKey))
    .map((fixture) =>
      comparedMetric(
        {
          evidenceId: fixture.evidenceId,
          priorEvidenceId: `${fixture.evidenceId}-PRIOR`,
          metricStableKey: fixture.stableKey,
          sourceKey: fixture.sourceKey,
          dimensions: { scope: 'workspace' },
          contextLabel: 'workspace',
          current: fixture.currentValue,
          prior: fixture.priorValue,
          reused: true,
        },
        definitions,
      ),
    );

  return {
    platforms,
    posts,
    insights: buildSocialInsights(posts),
    accountTotals,
    recentWindowStart: SOCIAL_RECENT_WINDOW_START,
    reconciliationNote:
      'Account totals exceed the sum of posts published in the same week. Older posts keep being served and profile surfaces contribute, so post rows are a subset of account performance rather than a decomposition of it.',
  };
}

export function buildSocialSnapshot(): DemoSocialSnapshot {
  return DemoSocialSnapshotSchema.parse({
    snapshotVersion: 1,
    datasetVersion: DEMO_DATASET_VERSION,
    social: buildSocialWorkspace(definitionMap(), weeklyFixtures()),
  });
}
