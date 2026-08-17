'use client';

import { useMemo, useState } from 'react';
import type { DemoSocialPost } from '@reachops/contracts';
import { DataTable, FilterChips, type Column } from './data-table';
import { PageHeading, ProvenanceNote } from './demo-primitives';
import { Drawer } from './drawer';
import { EvidenceChipList } from './evidence-drawer';
import { PlanContentForm } from './plan-content-form';
import { useDemoSession } from '@/lib/demo/session';
import { demoSocial } from '@/lib/demo/social';
import { demoSnapshot } from '@/lib/demo/snapshot';
import { formatCalendarDate, formatMetricValue, formatNumber } from '@/lib/format';

type PlatformFilter = 'ALL' | 'INSTAGRAM' | 'FACEBOOK' | 'LINKEDIN';

const PLATFORM_OPTIONS: Array<{ key: PlatformFilter; label: string }> = [
  { key: 'ALL', label: 'All platforms' },
  { key: 'INSTAGRAM', label: 'Instagram' },
  { key: 'FACEBOOK', label: 'Facebook' },
  { key: 'LINKEDIN', label: 'LinkedIn' },
];

/**
 * Account-level metrics grouped by the connection that reports them.
 *
 * The Meta connection covers Instagram and Facebook together, so selecting one of those platforms
 * cannot narrow these numbers. Saying that is better than implying an Instagram-only account total
 * the source never provided.
 */
const ACCOUNT_GROUPS = [
  {
    key: 'meta',
    label: 'Meta account',
    covers: ['INSTAGRAM', 'FACEBOOK'] as const,
    note: 'Reported for the Meta business account as a whole, covering Instagram and Facebook together.',
    metrics: ['meta.reach', 'meta.impressions', 'meta.engagement_rate', 'meta.follower_growth'],
  },
  {
    key: 'linkedin',
    label: 'LinkedIn account',
    covers: ['LINKEDIN'] as const,
    note: 'LinkedIn reports impressions rather than reach, so no reach figure exists for this account.',
    metrics: [
      'linkedin.impressions',
      'linkedin.engagements',
      'linkedin.engagement_rate',
      'linkedin.follower_growth',
    ],
  },
];

const FORMAT_LABEL: Record<string, string> = {
  REEL: 'Reel',
  STATIC: 'Static',
  CAROUSEL: 'Carousel',
  VIDEO: 'Video',
  TEXT: 'Text',
  LINK: 'Link',
};

const campaignByKey = new Map(
  demoSnapshot.overview.annotations.map((annotation) => [annotation.stableKey, annotation.title]),
);

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

/** Downstream efficiency normalised against whatever the platform actually reports. */
function sessionsPerThousand(post: DemoSocialPost): number {
  const basis = post.reach ?? post.impressions;
  return basis > 0 ? (post.siteSessions / basis) * 1_000 : 0;
}

function PlatformSelector({
  value,
  onChange,
}: {
  value: PlatformFilter;
  onChange: (next: PlatformFilter) => void;
}) {
  return (
    <div className="segmented" role="group" aria-label="Platform">
      {PLATFORM_OPTIONS.map((option) => (
        <button
          aria-pressed={value === option.key}
          className={`segmented__button ${value === option.key ? 'segmented__button--active' : ''}`}
          key={option.key}
          onClick={() => onChange(option.key)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function AccountTotals({ platform }: { platform: PlatformFilter }) {
  const groups = ACCOUNT_GROUPS.filter(
    (group) => platform === 'ALL' || group.covers.includes(platform as never),
  );

  return (
    <div className="account-groups">
      {groups.map((group) => (
        <section aria-labelledby={`account-${group.key}`} className="account-group" key={group.key}>
          <div className="panel-heading">
            <div>
              <span className="eyebrow">This week</span>
              <h2 id={`account-${group.key}`}>{group.label}</h2>
            </div>
          </div>
          <div className="kpi-grid kpi-grid--compact">
            {group.metrics.map((key) => {
              const compared = demoSocial.accountTotals.find(
                ({ metricStableKey }) => metricStableKey === key,
              );
              if (!compared) return null;
              const improving = compared.lowerIsBetter
                ? compared.changeAbsolute < 0
                : compared.changeAbsolute > 0;
              const tone = compared.changeAbsolute === 0 ? 'flat' : improving ? 'up' : 'down';
              return (
                <article className="kpi-card" key={key}>
                  <div className="kpi-card__top">
                    <span>{compared.label}</span>
                  </div>
                  <strong>{formatMetricValue(compared.current, compared.unit)}</strong>
                  <div className={`kpi-change kpi-change--${tone}`}>
                    <span>{compared.display}</span>
                    <small>vs prior week</small>
                  </div>
                  <EvidenceChipList
                    ids={[compared.evidenceId]}
                    label={`Evidence for ${compared.label}`}
                  />
                </article>
              );
            })}
          </div>
          <p className="evidence-caveat">{group.note}</p>
        </section>
      ))}
    </div>
  );
}

function InsightPanel({ platform }: { platform: PlatformFilter }) {
  const insights = demoSocial.insights.filter(
    (insight) => platform === 'ALL' || insight.platform === platform,
  );
  if (insights.length === 0) return null;

  return (
    <section aria-labelledby="social-insights-title" className="coverage-callout">
      <h2 id="social-insights-title">Patterns in this account</h2>
      {insights.map((insight) => (
        <div className="social-insight" key={insight.key}>
          <strong>{insight.text}</strong>
          <p>{insight.caveat}</p>
        </div>
      ))}
    </section>
  );
}

/**
 * Format and pillar comparison.
 *
 * Grouped strictly within one platform. Blending an impressions-based engagement rate with a
 * reach-based one would produce a number that means nothing, so the mixed view compares platforms
 * to each other instead of averaging across them.
 */
function PatternPanel({ posts, platform }: { posts: DemoSocialPost[]; platform: PlatformFilter }) {
  const rows = useMemo(() => {
    if (platform === 'ALL') {
      return demoSocial.platforms.map((entry) => {
        const cohort = posts.filter(({ platform: key }) => key === entry.platform);
        return {
          key: entry.platform,
          label: entry.displayName,
          detail: entry.reportsReach ? 'Reach basis' : 'Impressions basis',
          count: cohort.length,
          medianExposure: median(cohort.map((post) => post.reach ?? post.impressions)),
          medianEngagementRate: median(cohort.map((post) => post.engagementRate)),
          medianSessions: median(cohort.map(sessionsPerThousand)),
        };
      });
    }

    const formats = [...new Set(posts.map(({ format }) => format))];
    return formats.map((format) => {
      const cohort = posts.filter((post) => post.format === format);
      return {
        key: format,
        label: FORMAT_LABEL[format] ?? format,
        detail: `${cohort.length} post${cohort.length === 1 ? '' : 's'}`,
        count: cohort.length,
        medianExposure: median(cohort.map((post) => post.reach ?? post.impressions)),
        medianEngagementRate: median(cohort.map((post) => post.engagementRate)),
        medianSessions: median(cohort.map(sessionsPerThousand)),
      };
    });
  }, [posts, platform]);

  const peak = Math.max(...rows.map(({ medianExposure }) => medianExposure), 1);
  const exposureLabel = platform === 'LINKEDIN' ? 'Median impressions' : 'Median exposure';

  return (
    <section aria-labelledby="pattern-title" className="pattern-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">{platform === 'ALL' ? 'Across platforms' : 'By format'}</span>
          <h2 id="pattern-title">What is working</h2>
        </div>
      </div>
      <ul className="pattern-list">
        {rows.map((row) => (
          <li key={row.key}>
            <div className="pattern-list__label">
              <strong>{row.label}</strong>
              <small>{row.detail}</small>
            </div>
            <div
              aria-hidden="true"
              className="pattern-bar"
              style={
                { '--pattern-fill': `${(row.medianExposure / peak) * 100}%` } as React.CSSProperties
              }
            >
              <i />
            </div>
            <dl className="pattern-figures">
              <div>
                <dt>{exposureLabel}</dt>
                <dd>{formatNumber(Math.round(row.medianExposure))}</dd>
              </div>
              <div>
                <dt>Median engagement rate</dt>
                <dd>{row.medianEngagementRate.toFixed(2)}%</dd>
              </div>
              <div>
                <dt>Sessions per 1k</dt>
                <dd>{row.medianSessions.toFixed(2)}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
      {platform === 'ALL' && (
        <p className="evidence-caveat">
          Platforms are compared side by side rather than averaged. LinkedIn engagement rate is
          calculated against impressions and Meta&rsquo;s against reach, so a blended figure would
          not describe anything real.
        </p>
      )}
    </section>
  );
}

function PostDrawer({ post, onClose }: { post: DemoSocialPost | null; onClose: () => void }) {
  const { repurposeFromSocialPost } = useDemoSession();
  if (!post) return null;
  const platform = demoSocial.platforms.find(({ platform: key }) => key === post.platform)!;

  return (
    <Drawer
      eyebrow={`${platform.displayName} · ${formatCalendarDate(post.publishedOn)}`}
      onClose={onClose}
      open
      title={post.caption}
    >
      <div className="action-detail">
        <section aria-labelledby="post-metrics-title">
          <h3 id="post-metrics-title">Performance</h3>
          <dl className="drawer-metrics">
            {platform.reportsReach && (
              <div>
                <dt>Accounts reached</dt>
                <dd>{formatNumber(post.reach ?? 0)}</dd>
              </div>
            )}
            <div>
              <dt>Impressions</dt>
              <dd>{formatNumber(post.impressions)}</dd>
            </div>
            <div>
              <dt>Engagements</dt>
              <dd>{formatNumber(post.engagements)}</dd>
            </div>
            <div>
              <dt>Engagement rate</dt>
              <dd>
                {post.engagementRate.toFixed(2)}%{' '}
                <span className="table-muted">
                  ({post.engagementRateBasis === 'REACH' ? 'of reach' : 'of impressions'})
                </span>
              </dd>
            </div>
            <div>
              <dt>Link clicks</dt>
              <dd>{formatNumber(post.linkClicks)}</dd>
            </div>
            <div>
              <dt>Site sessions</dt>
              <dd>{formatNumber(post.siteSessions)}</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="post-rank-title">
          <h3 id="post-rank-title">Rank within this account</h3>
          <p className="evidence-headline">
            <strong>{post.performancePercentile}th percentile</strong>
          </p>
          <p className="evidence-caveat">
            Ranked against Summit &amp; Sage&rsquo;s own {platform.displayName} history on{' '}
            {post.percentileBasis === 'REACH' ? 'reach' : 'impressions'}. This is not a comparison
            with any other account or an industry benchmark.
          </p>
        </section>

        {post.performancePercentile >= 75 && (
          <section aria-labelledby="post-repurpose-title">
            <h3 id="post-repurpose-title">Reuse this pattern</h3>
            <p className="evidence-prose">
              This post is in the top quartile of its own {platform.displayName} history. Planning
              another in the same shape tests whether the pattern repeats.
            </p>
            <PlanContentForm
              defaultDate="2026-08-25"
              defaultOwner="Devon Patel"
              defaultTitle="Technician-led explainer: electrical safety in older Denver homes"
              note="Copies the structure, not the script. The new piece needs its own subject, filming and approval, and is scheduled with nobody."
              onSubmit={(input) =>
                repurposeFromSocialPost(post.id, {
                  ...input,
                  channel:
                    post.platform === 'LINKEDIN'
                      ? 'LINKEDIN'
                      : post.platform === 'FACEBOOK'
                        ? 'FACEBOOK'
                        : 'INSTAGRAM',
                })
              }
              submitLabel="Plan a post in this shape"
            />
          </section>
        )}

        <section aria-labelledby="post-context-title">
          <h3 id="post-context-title">Context</h3>
          <dl className="drawer-metrics">
            <div>
              <dt>Format</dt>
              <dd>{FORMAT_LABEL[post.format] ?? post.format}</dd>
            </div>
            <div>
              <dt>Content pillar</dt>
              <dd>{post.pillar}</dd>
            </div>
            <div>
              <dt>Campaign</dt>
              <dd>{post.campaignStableKey ?? 'None'}</dd>
            </div>
            <div>
              <dt>Technician-led</dt>
              <dd>{post.technicianLed ? 'Yes' : 'No'}</dd>
            </div>
            <div>
              <dt>Source mode</dt>
              <dd>
                <span className={`mode-pill mode-pill--${post.sourceMode.toLowerCase()}`}>
                  {post.sourceMode === 'IMPORTED' ? 'Imported' : 'Simulated'}
                </span>
              </dd>
            </div>
          </dl>
          <p className="evidence-caveat">{platform.note}</p>
        </section>
      </div>
    </Drawer>
  );
}

const POST_FILTERS = [
  {
    key: 'technician',
    label: 'Technician-led',
    match: (post: DemoSocialPost) => post.technicianLed,
  },
  {
    key: 'summer-ready',
    label: 'Summer Ready campaign',
    match: (post: DemoSocialPost) => post.campaignStableKey === 'CAM-01',
  },
  {
    key: 'top-quartile',
    label: 'Top quartile',
    match: (post: DemoSocialPost) => post.performancePercentile >= 75,
  },
  {
    key: 'weak-downstream',
    label: 'Weak onward traffic',
    match: (post: DemoSocialPost) => sessionsPerThousand(post) < 2,
  },
];

export function SocialWorkspaceView() {
  const [platform, setPlatform] = useState<PlatformFilter>('ALL');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [openPost, setOpenPost] = useState<DemoSocialPost | null>(null);

  const platformPosts = useMemo(
    () =>
      platform === 'ALL'
        ? demoSocial.posts
        : demoSocial.posts.filter((post) => post.platform === platform),
    [platform],
  );

  const rows = useMemo(() => {
    const filter = POST_FILTERS.find(({ key }) => key === activeFilter);
    return filter ? platformPosts.filter(filter.match) : platformPosts;
  }, [platformPosts, activeFilter]);

  const filters = POST_FILTERS.map(({ key, label, match }) => ({
    key,
    label,
    count: platformPosts.filter(match).length,
  }));

  const columns: Array<Column<DemoSocialPost>> = [
    {
      key: 'post',
      header: 'Post',
      sortValue: (post) => post.publishedOn,
      render: (post) => (
        <button className="table-open" onClick={() => setOpenPost(post)} type="button">
          <strong>{post.caption}</strong>
          <small>
            {formatCalendarDate(post.publishedOn)} · {post.pillar}
          </small>
        </button>
      ),
    },
    {
      key: 'platform',
      header: 'Platform',
      sortValue: (post) => post.platform,
      render: (post) =>
        demoSocial.platforms.find(({ platform: key }) => key === post.platform)!.displayName,
    },
    {
      key: 'format',
      header: 'Format',
      secondary: true,
      sortValue: (post) => post.format,
      render: (post) => FORMAT_LABEL[post.format] ?? post.format,
    },
    {
      key: 'campaign',
      header: 'Campaign',
      secondary: true,
      sortValue: (post) => post.campaignStableKey ?? '',
      render: (post) =>
        post.campaignStableKey ? (
          <span title={campaignByKey.get(post.campaignStableKey) ?? undefined}>
            {post.campaignStableKey}
          </span>
        ) : (
          <span className="table-muted">—</span>
        ),
    },
    {
      key: 'reach',
      header: 'Reach',
      numeric: true,
      sortValue: (post) => post.reach ?? -1,
      render: (post) =>
        post.reach === null ? (
          <span className="table-muted" title="LinkedIn does not report reach">
            —
          </span>
        ) : (
          formatNumber(post.reach)
        ),
    },
    {
      key: 'impressions',
      header: 'Impressions',
      numeric: true,
      secondary: true,
      sortValue: (post) => post.impressions,
      render: (post) => formatNumber(post.impressions),
    },
    {
      key: 'engagementRate',
      header: 'Engagement rate',
      numeric: true,
      sortValue: (post) => post.engagementRate,
      render: (post) => (
        <>
          {post.engagementRate.toFixed(2)}%
          <small className="table-basis">
            {post.engagementRateBasis === 'REACH' ? 'reach' : 'impr'}
          </small>
        </>
      ),
    },
    {
      key: 'clicks',
      header: 'Link clicks',
      numeric: true,
      secondary: true,
      sortValue: (post) => post.linkClicks,
      render: (post) => formatNumber(post.linkClicks),
    },
    {
      key: 'sessions',
      header: 'Site sessions',
      numeric: true,
      sortValue: (post) => post.siteSessions,
      render: (post) => formatNumber(post.siteSessions),
    },
    {
      key: 'efficiency',
      header: 'Sessions / 1k',
      numeric: true,
      sortValue: (post) => sessionsPerThousand(post),
      render: (post) => sessionsPerThousand(post).toFixed(2),
    },
    {
      key: 'percentile',
      header: 'Percentile',
      numeric: true,
      sortValue: (post) => post.performancePercentile,
      render: (post) => `${post.performancePercentile}`,
    },
  ];

  return (
    <div className="social-workspace">
      <PageHeading
        description="Which content and publishing patterns are increasing useful social reach, and what that reach does once it arrives."
        eyebrow="Social performance"
        title="Social"
      />

      <ProvenanceNote>
        Meta values are simulated and LinkedIn values are imported from an operator-supplied export.
        Nothing is published to any provider from ReachOps.
      </ProvenanceNote>

      <PlatformSelector onChange={setPlatform} value={platform} />

      <div className="tab-panel-body">
        <AccountTotals platform={platform} />
        <InsightPanel platform={platform} />
        <PatternPanel platform={platform} posts={platformPosts} />

        <section aria-labelledby="posts-title" className="posts-section">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Post level</span>
              <h2 id="posts-title">Published posts</h2>
            </div>
          </div>
          <FilterChips active={activeFilter} filters={filters} onToggle={setActiveFilter} />
          <DataTable
            caption="Social posts and their performance"
            columns={columns}
            emptyMessage="No posts match the current platform and filter."
            initialSortKey="post"
            rowKey={(post) => post.id}
            rows={rows}
          />
          <p className="evidence-caveat">{demoSocial.reconciliationNote}</p>
        </section>
      </div>

      <PostDrawer onClose={() => setOpenPost(null)} post={openPost} />
    </div>
  );
}
