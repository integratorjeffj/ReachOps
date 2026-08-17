import { describe, expect, it } from 'vitest';
import { flagshipComparisons } from '../src/demo/fixtures';
import { socialPosts, SOCIAL_RECENT_WINDOW_START } from '../src/demo/social-fixtures';
import { buildSocialSnapshot } from '../src/demo/social-snapshot';
import { buildDemoSnapshot } from '../src/demo/snapshot';

/**
 * Social reconciliation.
 *
 * The failure this guards against is a workspace that quietly treats three providers as one. These
 * assertions hold the platform semantics apart, keep account totals and post rows in the right
 * relationship, and require the headline pattern to be something the fixtures actually produce.
 */

const flagship = new Map(
  flagshipComparisons.map(([evidenceId, , prior, current]) => [
    String(evidenceId),
    { prior: Number(prior), current: Number(current) },
  ]),
);

const workspace = buildSocialSnapshot().social;
const CURRENT_WEEK_START = '2026-07-27';
const CURRENT_WEEK_END = '2026-08-02';

const inCurrentWeek = socialPosts.filter(
  ({ publishedOn }) => publishedOn >= CURRENT_WEEK_START && publishedOn <= CURRENT_WEEK_END,
);
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

describe('platform semantics', () => {
  it('gives LinkedIn no reach, because LinkedIn does not report it', () => {
    const linkedIn = workspace.platforms.find(({ platform }) => platform === 'LINKEDIN')!;
    expect(linkedIn.reportsReach).toBe(false);

    for (const post of workspace.posts.filter(({ platform }) => platform === 'LINKEDIN')) {
      expect(post.reach).toBeNull();
    }
  });

  it('computes engagement rate against each platform own denominator', () => {
    const linkedIn = workspace.posts.find(({ platform }) => platform === 'LINKEDIN')!;
    const instagram = workspace.posts.find(({ platform }) => platform === 'INSTAGRAM')!;

    expect(linkedIn.engagementRateBasis).toBe('IMPRESSIONS');
    expect(instagram.engagementRateBasis).toBe('REACH');

    expect(linkedIn.engagementRate).toBeCloseTo(
      (linkedIn.engagements / linkedIn.impressions) * 100,
      2,
    );
    expect(instagram.engagementRate).toBeCloseTo(
      (instagram.engagements / instagram.reach!) * 100,
      2,
    );
  });

  it('ranks a post only against its own platform history', () => {
    for (const platform of workspace.platforms) {
      const cohort = workspace.posts.filter(({ platform: key }) => key === platform.platform);
      const best = cohort.reduce((top, post) =>
        post.performancePercentile > top.performancePercentile ? post : top,
      );
      expect(best.performancePercentile).toBe(100);
      expect(cohort.every((post) => post.percentileBasis === best.percentileBasis)).toBe(true);
    }
  });

  it('retains simulated and imported provenance on every post', () => {
    for (const post of workspace.posts) {
      const platform = workspace.platforms.find(({ platform: key }) => key === post.platform)!;
      expect(post.sourceMode).toBe(platform.sourceMode);
    }
    expect(workspace.platforms.find(({ platform }) => platform === 'LINKEDIN')!.sourceMode).toBe(
      'IMPORTED',
    );
  });
});

describe('account totals against post rows', () => {
  // Older posts keep being served and profile surfaces contribute, so post rows are a subset of
  // account performance rather than a decomposition of it.
  it('keeps posts published this week below the Meta account totals', () => {
    const meta = inCurrentWeek.filter(({ platform }) => platform !== 'LINKEDIN');
    expect(sum(meta.map(({ reach }) => reach ?? 0))).toBeLessThan(flagship.get('EV-118')!.current);
    expect(sum(meta.map(({ impressions }) => impressions))).toBeLessThan(
      flagship.get('EV-119')!.current,
    );
    expect(sum(meta.map(({ engagements }) => engagements))).toBeLessThan(
      flagship.get('EV-120')!.current,
    );
  });

  it('keeps posts published this week below the LinkedIn account totals', () => {
    const linkedIn = inCurrentWeek.filter(({ platform }) => platform === 'LINKEDIN');
    expect(sum(linkedIn.map(({ impressions }) => impressions))).toBeLessThan(
      flagship.get('EV-116')!.current,
    );
    expect(sum(linkedIn.map(({ engagements }) => engagements))).toBeLessThan(
      flagship.get('EV-117')!.current,
    );
  });

  it('keeps social site sessions within total website sessions', () => {
    expect(flagship.get('EV-127')!.current).toBeLessThan(flagship.get('EV-101')!.current);
    expect(sum(inCurrentWeek.map(({ siteSessions }) => siteSessions))).toBeLessThan(
      flagship.get('EV-127')!.current,
    );
  });

  it('never books more from social than the workspace booked in total', () => {
    expect(flagship.get('EV-128')!.current).toBeLessThan(flagship.get('EV-103')!.current);
  });

  it('cites real evidence for every account total', () => {
    const known = new Set(buildDemoSnapshot().evidence.map(({ evidenceId }) => evidenceId));
    for (const metric of workspace.accountTotals) {
      expect(known.has(metric.evidenceId)).toBe(true);
      expect(known.has(metric.priorEvidenceId)).toBe(true);
    }
  });

  it('publishes the reason account totals and post rows differ', () => {
    expect(workspace.reconciliationNote).toMatch(/subset|older posts/i);
  });
});

describe('derived insights', () => {
  it('only publishes a pattern the posts actually produce', () => {
    const insight = workspace.insights.find(({ key }) => key === 'technician-reel-reach');
    expect(insight).toBeDefined();

    const recent = workspace.posts.filter(
      ({ platform, publishedOn }) =>
        platform === 'INSTAGRAM' && publishedOn >= SOCIAL_RECENT_WINDOW_START,
    );
    const reels = recent.filter(({ technicianLed, format }) => technicianLed && format === 'REEL');

    expect(insight!.sampleSize).toBe(reels.length);
    expect(insight!.comparisonSampleSize).toBe(recent.length);
    expect(insight!.multiple).toBeGreaterThan(1.2);
  });

  it('states the sample it rests on and refuses a causal claim', () => {
    for (const insight of workspace.insights) {
      expect(insight.caveat).toMatch(/not evidence that|small sample/i);
      expect(insight.text).not.toMatch(/because|caused|drove/i);
    }
  });

  it('requires at least three supporting posts before making a claim', () => {
    for (const insight of workspace.insights) {
      expect(insight.sampleSize).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('the demo story', () => {
  it('seeds enough posts across enough months to support the analysis', () => {
    expect(workspace.posts.length).toBeGreaterThanOrEqual(30);
    const months = new Set(workspace.posts.map(({ publishedOn }) => publishedOn.slice(0, 7)));
    expect(months.size).toBeGreaterThanOrEqual(6);
  });

  it('shows Facebook converting reach into site visits less well than Instagram', () => {
    const perThousand = (platform: string) => {
      const cohort = workspace.posts.filter((post) => post.platform === platform);
      return (
        (sum(cohort.map(({ siteSessions }) => siteSessions)) /
          sum(cohort.map(({ reach }) => reach ?? 0))) *
        1_000
      );
    };
    expect(perThousand('FACEBOOK')).toBeLessThan(perThousand('INSTAGRAM'));
  });

  it('shows static promotion earning impressions but little onward traffic', () => {
    const byFormat = (format: string) => {
      const cohort = workspace.posts.filter(
        (post) => post.format === format && post.reach !== null,
      );
      return (
        (sum(cohort.map(({ siteSessions }) => siteSessions)) /
          sum(cohort.map(({ reach }) => reach ?? 0))) *
        1_000
      );
    };
    expect(byFormat('STATIC')).toBeLessThan(byFormat('REEL'));
  });

  it('uses LinkedIn mostly for recruiting and employer brand', () => {
    const linkedIn = workspace.posts.filter(({ platform }) => platform === 'LINKEDIN');
    const employerBrand = linkedIn.filter(
      ({ pillar }) => pillar === 'Recruiting' || pillar === 'Team and craft',
    );
    expect(employerBrand.length).toBe(linkedIn.length);
  });

  it('gives Meta a reporting history so no source claims health without data', () => {
    const meta = buildDemoSnapshot().connections.find(
      ({ provider }) => provider === 'META_SIMULATED',
    )!;
    expect(meta.dataState).toBe('ACTIVE');
    expect(meta.observationCount).toBeGreaterThan(0);
  });
});
