'use client';

import { useMemo, useState } from 'react';
import type { DemoComparedMetric, DemoSearchPage, DemoSearchQuery } from '@reachops/contracts';
import { DataTable, FilterChips, type Column } from './data-table';
import { PageHeading, ProvenanceNote } from './demo-primitives';
import { Drawer } from './drawer';
import { EvidenceChipList } from './evidence-drawer';
import { TechnicalTab } from './technical-tab';
import { demoSearch } from '@/lib/demo/search';
import { demoSnapshot } from '@/lib/demo/snapshot';
import { formatMetricValue, formatMonthYear, formatNumber } from '@/lib/format';

const TABS = [
  { key: 'performance', label: 'Performance' },
  { key: 'pages', label: 'Pages' },
  { key: 'queries', label: 'Queries' },
  { key: 'technical', label: 'Technical' },
  { key: 'local', label: 'Local' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const INTENT_LABEL: Record<string, string> = {
  INFORMATIONAL: 'Informational',
  COMMERCIAL: 'Commercial',
  TRANSACTIONAL: 'Transactional',
  NAVIGATIONAL: 'Navigational',
};

const evidenceById = new Map(demoSnapshot.evidence.map((record) => [record.evidenceId, record]));

function metric(row: { metrics: DemoComparedMetric[] }, key: string): DemoComparedMetric {
  return row.metrics.find(({ metricStableKey }) => metricStableKey === key)!;
}

/** Direction is read through the metric's own semantics, so a falling position reads as a gain. */
function toneOf(value: number, lowerIsBetter: boolean): string {
  if (value === 0) return 'flat';
  const improving = lowerIsBetter ? value < 0 : value > 0;
  return improving ? 'up' : 'down';
}

function ChangeCell({ metric: compared }: { metric: DemoComparedMetric }) {
  return (
    <span className={`delta delta--${toneOf(compared.changeAbsolute, compared.lowerIsBetter)}`}>
      {compared.display}
    </span>
  );
}

function workspaceMetric(evidenceId: string) {
  return evidenceById.get(evidenceId)!;
}

function KpiRow() {
  // Non-branded clicks come from the query rows, which are a subset of the property total. The
  // caveat is stated rather than rounded away.
  const nonBranded = demoSearch.queries
    .filter(({ branded }) => !branded)
    .reduce((total, query) => total + metric(query, 'gsc.clicks').current, 0);

  const cards = [
    { id: 'EV-108', label: 'Organic clicks' },
    { id: 'EV-107', label: 'Impressions' },
    { id: 'EV-109', label: 'Click-through rate' },
    { id: 'EV-110', label: 'Average position' },
    { id: 'EV-129', label: 'Organic bookings' },
  ];

  return (
    <div className="kpi-grid kpi-grid--compact">
      {cards.map(({ id, label }) => {
        const record = workspaceMetric(id);
        return (
          <article className="kpi-card" key={id}>
            <div className="kpi-card__top">
              <span>{label}</span>
            </div>
            <strong>{formatMetricValue(record.value, record.unit)}</strong>
            <div
              className={`kpi-change kpi-change--${toneOf(
                record.value - (record.priorValue ?? record.value),
                record.lowerIsBetter,
              )}`}
            >
              <span>{record.displayChange}</span>
              <small>vs prior week</small>
            </div>
            <EvidenceChipList ids={[id]} label={`Evidence for ${label}`} />
          </article>
        );
      })}
      <article className="kpi-card kpi-card--derived">
        <div className="kpi-card__top">
          <span>Non-branded clicks</span>
        </div>
        <strong>{formatNumber(nonBranded)}</strong>
        <div className="kpi-change kpi-change--none">
          <small>Summed from query rows</small>
        </div>
        <p className="kpi-caveat">
          Query rows cover {demoSearch.coverage.queryClickCoveragePercent}% of property clicks, so
          this is a floor rather than a total.
        </p>
      </article>
    </div>
  );
}

function PerformanceTab() {
  const page = demoSearch.pages.find(({ key }) => key === 'WATER-HEATER-GUIDE')!;
  const acPage = demoSearch.pages.find(({ key }) => key === 'AC-REPAIR')!;

  return (
    <div className="tab-panel-body">
      <KpiRow />

      <section aria-labelledby="coverage-title" className="coverage-callout">
        <h2 id="coverage-title">Why rows do not add up to the total</h2>
        <p>{demoSearch.coverage.note}</p>
        <dl className="coverage-figures">
          <div>
            <dt>Property clicks</dt>
            <dd>{formatNumber(demoSearch.coverage.propertyClicks)}</dd>
          </div>
          <div>
            <dt>Across page rows</dt>
            <dd>
              {formatNumber(demoSearch.coverage.pageClicks)} (
              {demoSearch.coverage.pageClickCoveragePercent}%)
            </dd>
          </div>
          <div>
            <dt>Across query rows</dt>
            <dd>
              {formatNumber(demoSearch.coverage.queryClicks)} (
              {demoSearch.coverage.queryClickCoveragePercent}%)
            </dd>
          </div>
        </dl>
      </section>

      <div className="overview-columns">
        <PageTrendCard page={acPage} note="Cooling-season demand climbing into July." />
        <PageTrendCard
          page={page}
          note="Declined into March, refreshed on the 9th, and recovered afterwards."
        />
      </div>
    </div>
  );
}

function PageTrendCard({ page, note }: { page: DemoSearchPage; note: string }) {
  if (!page.monthlyClicks) return null;
  const points = page.monthlyClicks;
  const values = points.map(({ value }) => value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const width = 420;
  const height = 140;
  const padding = 18;
  const line = points
    .map(({ value }, index) => {
      const x = padding + (index / (points.length - 1)) * (width - padding * 2);
      const y =
        height - padding - ((value - min) / Math.max(max - min, 1)) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <section aria-labelledby={`trend-${page.key}`} className="trend-card trend-card--compact">
      <div className="trend-heading">
        <div>
          <span className="eyebrow">Monthly organic clicks</span>
          <h2 id={`trend-${page.key}`}>{page.shortLabel}</h2>
        </div>
      </div>
      <p className="chart-scale-note">
        {formatMonthYear(`${points[0]!.period}-01T00:00:00.000Z`)} {formatNumber(points[0]!.value)}{' '}
        → {formatMonthYear(`${points.at(-1)!.period}-01T00:00:00.000Z`)}{' '}
        {formatNumber(points.at(-1)!.value)}
      </p>
      <svg aria-hidden="true" className="trend-chart" viewBox={`0 0 ${width} ${height}`}>
        <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} />
        <polyline className="trend-line--sessions" points={line} />
      </svg>
      <p className="evidence-caveat">{note}</p>
      <EvidenceChipList
        ids={[points.at(-1)!.evidenceId]}
        label={`Latest monthly clicks for ${page.shortLabel}`}
      />
    </section>
  );
}

function PagesTab({ onOpen }: { onOpen: (page: DemoSearchPage) => void }) {
  const opportunityByEntity = new Map(
    demoSnapshot.weeklyReview.recommendations.map((item) => [item.affectedEntity, item]),
  );

  const columns: Array<Column<DemoSearchPage>> = [
    {
      key: 'page',
      header: 'Page',
      sortValue: (page) => page.shortLabel,
      render: (page) => (
        <button className="table-open" onClick={() => onOpen(page)} type="button">
          <strong>{page.shortLabel}</strong>
          <small>{page.path}</small>
        </button>
      ),
    },
    {
      key: 'clicks',
      header: 'Organic clicks',
      numeric: true,
      sortValue: (page) => metric(page, 'gsc.clicks').current,
      render: (page) => formatNumber(metric(page, 'gsc.clicks').current),
    },
    {
      key: 'impressions',
      header: 'Impressions',
      numeric: true,
      secondary: true,
      sortValue: (page) => metric(page, 'gsc.impressions').current,
      render: (page) => formatNumber(metric(page, 'gsc.impressions').current),
    },
    {
      key: 'ctr',
      header: 'CTR',
      numeric: true,
      sortValue: (page) => metric(page, 'gsc.ctr').current,
      render: (page) => `${metric(page, 'gsc.ctr').current.toFixed(2)}%`,
    },
    {
      key: 'position',
      header: 'Avg position',
      numeric: true,
      secondary: true,
      sortValue: (page) => metric(page, 'gsc.average_position').current,
      render: (page) => metric(page, 'gsc.average_position').current.toFixed(1),
    },
    {
      key: 'sessions',
      header: 'Sessions',
      numeric: true,
      secondary: true,
      sortValue: (page) => metric(page, 'ga4.sessions').current,
      render: (page) => formatNumber(metric(page, 'ga4.sessions').current),
    },
    {
      key: 'bookings',
      header: 'Bookings',
      numeric: true,
      sortValue: (page) => metric(page, 'ga4.confirmed_bookings').current,
      render: (page) => formatNumber(metric(page, 'ga4.confirmed_bookings').current),
    },
    {
      key: 'bookingRate',
      header: 'Booking rate',
      numeric: true,
      sortValue: (page) => metric(page, 'ga4.page_booking_rate').current,
      render: (page) => `${metric(page, 'ga4.page_booking_rate').current.toFixed(2)}%`,
    },
    {
      key: 'change',
      header: 'Clicks change',
      numeric: true,
      sortValue: (page) => metric(page, 'gsc.clicks').changePercent ?? 0,
      render: (page) => <ChangeCell metric={metric(page, 'gsc.clicks')} />,
    },
    {
      key: 'opportunity',
      header: 'Opportunity',
      sortValue: (page) => (opportunityByEntity.has(page.path) ? 1 : 0),
      render: (page) => {
        const opportunity = opportunityByEntity.get(page.path);
        return opportunity ? (
          <span className="meta-chip">{opportunity.impact.toLowerCase()} impact</span>
        ) : (
          <span className="table-muted">—</span>
        );
      },
    },
  ];

  return (
    <div className="tab-panel-body">
      <DataTable
        caption="Search performance by page"
        columns={columns}
        initialSortKey="clicks"
        rowKey={(page) => page.key}
        rows={demoSearch.pages}
      />
    </div>
  );
}

const QUERY_FILTERS = [
  {
    key: 'weak-ctr',
    label: 'High impressions, weak CTR',
    match: (query: DemoSearchQuery) =>
      metric(query, 'gsc.impressions').current > 4_000 && metric(query, 'gsc.ctr').current < 2.5,
  },
  {
    key: 'striking-distance',
    label: 'Position 4–15',
    match: (query: DemoSearchQuery) => {
      const position = metric(query, 'gsc.average_position').current;
      return position >= 4 && position <= 15;
    },
  },
  {
    key: 'declining',
    label: 'Declining clicks',
    match: (query: DemoSearchQuery) => metric(query, 'gsc.clicks').changeAbsolute < 0,
  },
  {
    key: 'service-intent',
    label: 'Non-branded service intent',
    match: (query: DemoSearchQuery) =>
      !query.branded && (query.intent === 'TRANSACTIONAL' || query.intent === 'COMMERCIAL'),
  },
];

function QueriesTab({ onOpen }: { onOpen: (query: DemoSearchQuery) => void }) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const rows = useMemo(() => {
    const filter = QUERY_FILTERS.find(({ key }) => key === activeFilter);
    return filter ? demoSearch.queries.filter(filter.match) : demoSearch.queries;
  }, [activeFilter]);

  const filters = QUERY_FILTERS.map(({ key, label, match }) => ({
    key,
    label,
    count: demoSearch.queries.filter(match).length,
  }));

  const columns: Array<Column<DemoSearchQuery>> = [
    {
      key: 'query',
      header: 'Query',
      sortValue: (query) => query.query,
      render: (query) => (
        <button className="table-open" onClick={() => onOpen(query)} type="button">
          <strong>{query.query}</strong>
          <small>
            {query.branded ? 'Branded' : 'Non-branded'} · {INTENT_LABEL[query.intent]}
          </small>
        </button>
      ),
    },
    {
      key: 'clicks',
      header: 'Clicks',
      numeric: true,
      sortValue: (query) => metric(query, 'gsc.clicks').current,
      render: (query) => formatNumber(metric(query, 'gsc.clicks').current),
    },
    {
      key: 'impressions',
      header: 'Impressions',
      numeric: true,
      sortValue: (query) => metric(query, 'gsc.impressions').current,
      render: (query) => formatNumber(metric(query, 'gsc.impressions').current),
    },
    {
      key: 'ctr',
      header: 'CTR',
      numeric: true,
      sortValue: (query) => metric(query, 'gsc.ctr').current,
      render: (query) => `${metric(query, 'gsc.ctr').current.toFixed(2)}%`,
    },
    {
      key: 'position',
      header: 'Avg position',
      numeric: true,
      sortValue: (query) => metric(query, 'gsc.average_position').current,
      render: (query) => metric(query, 'gsc.average_position').current.toFixed(1),
    },
    {
      key: 'landing',
      header: 'Landing page',
      secondary: true,
      sortValue: (query) => query.landingPagePath,
      render: (query) => <code className="table-path">{query.landingPagePath}</code>,
    },
    {
      key: 'change',
      header: 'Clicks change',
      numeric: true,
      sortValue: (query) => metric(query, 'gsc.clicks').changePercent ?? 0,
      render: (query) => <ChangeCell metric={metric(query, 'gsc.clicks')} />,
    },
  ];

  return (
    <div className="tab-panel-body">
      <FilterChips active={activeFilter} filters={filters} onToggle={setActiveFilter} />
      <DataTable
        caption="Search performance by query"
        columns={columns}
        initialSortKey="impressions"
        rowKey={(query) => query.key}
        rows={rows}
      />
    </div>
  );
}

function LocalTab() {
  // Local interactions are shown apart rather than collapsed into one ambiguous total, because a
  // call and a direction request are different customer actions.
  const cards = [
    { id: 'EV-111', label: 'Profile views' },
    { id: 'EV-112', label: 'Website clicks' },
    { id: 'EV-113', label: 'Call clicks' },
    { id: 'EV-114', label: 'New reviews' },
    { id: 'EV-115', label: 'New-review rating' },
  ];

  return (
    <div className="tab-panel-body">
      <div className="kpi-grid kpi-grid--compact">
        {cards.map(({ id, label }) => {
          const record = workspaceMetric(id);
          return (
            <article className="kpi-card" key={id}>
              <div className="kpi-card__top">
                <span>{label}</span>
                <span className="source-chip">Simulated</span>
              </div>
              <strong>{formatMetricValue(record.value, record.unit)}</strong>
              <div
                className={`kpi-change kpi-change--${toneOf(
                  record.value - (record.priorValue ?? record.value),
                  record.lowerIsBetter,
                )}`}
              >
                <span>{record.displayChange}</span>
                <small>vs prior week</small>
              </div>
              <EvidenceChipList ids={[id]} label={`Evidence for ${label}`} />
            </article>
          );
        })}
      </div>

      <section aria-labelledby="review-themes-title" className="coverage-callout">
        <h2 id="review-themes-title">Themes in this week&rsquo;s reviews</h2>
        <ul className="theme-list">
          {demoSnapshot.weeklyReview.reviewThemes.map((theme) => (
            <li key={theme.theme}>
              <strong>{theme.theme}</strong>
              <span>
                {theme.count} mentions · threshold {theme.minimumCount}
                {theme.meetsThreshold ? ' · met' : ' · not met'}
              </span>
            </li>
          ))}
        </ul>
        <p className="evidence-caveat">
          ReachOps never drafts or sends a review response. Themes are counted so a person can
          decide what to do about them.
        </p>
      </section>
    </div>
  );
}

function PageDrawer({ page, onClose }: { page: DemoSearchPage | null; onClose: () => void }) {
  const relatedQueries = useMemo(
    () =>
      page ? demoSearch.queries.filter(({ landingPageKey }) => landingPageKey === page.key) : [],
    [page],
  );
  const opportunity = demoSnapshot.weeklyReview.recommendations.find(
    ({ affectedEntity }) => affectedEntity === page?.path,
  );

  if (!page) return null;

  return (
    <Drawer eyebrow={page.path} onClose={onClose} open title={page.shortLabel}>
      <div className="action-detail">
        <section aria-labelledby="page-metrics-title">
          <h3 id="page-metrics-title">This week</h3>
          <dl className="drawer-metrics">
            {page.metrics.map((compared) => (
              <div key={compared.metricStableKey}>
                <dt>{compared.label}</dt>
                <dd>
                  {formatMetricValue(compared.current, compared.unit)}{' '}
                  <ChangeCell metric={compared} />
                </dd>
              </div>
            ))}
          </dl>
          <EvidenceChipList
            ids={page.metrics.map(({ evidenceId }) => evidenceId)}
            label={`Evidence for ${page.shortLabel}`}
          />
        </section>

        <section aria-labelledby="page-snippet-title">
          <h3 id="page-snippet-title">Search appearance</h3>
          <div className="serp-preview">
            <span className="serp-preview__url">summitandsage.example{page.path}</span>
            <span className="serp-preview__title">{page.title}</span>
            <span className="serp-preview__description">{page.metaDescription}</span>
          </div>
          <p className="evidence-caveat">
            An approximation of how the page may appear. Google rewrites titles and descriptions
            frequently, so this is not what every searcher sees.
          </p>
        </section>

        {relatedQueries.length > 0 && (
          <section aria-labelledby="page-queries-title">
            <h3 id="page-queries-title">Queries landing here</h3>
            <ul className="drawer-query-list">
              {relatedQueries.map((query) => (
                <li key={query.key}>
                  <strong>{query.query}</strong>
                  <span>
                    {formatNumber(metric(query, 'gsc.clicks').current)} clicks ·{' '}
                    {metric(query, 'gsc.ctr').current.toFixed(2)}% CTR · position{' '}
                    {metric(query, 'gsc.average_position').current.toFixed(1)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {opportunity && (
          <section aria-labelledby="page-opportunity-title">
            <h3 id="page-opportunity-title">Linked opportunity</h3>
            <strong>{opportunity.title}</strong>
            <p className="evidence-prose">{opportunity.diagnosis}</p>
            <div className="ranked-observations__tags">
              <span className="meta-chip">Impact {opportunity.impact.toLowerCase()}</span>
              <span className="meta-chip">Effort {opportunity.effort}</span>
              <span className="meta-chip">
                Observation confidence {opportunity.observationConfidence.toLowerCase()}
              </span>
            </div>
          </section>
        )}
      </div>
    </Drawer>
  );
}

function QueryDrawer({ query, onClose }: { query: DemoSearchQuery | null; onClose: () => void }) {
  if (!query) return null;
  const landing = demoSearch.pages.find(({ key }) => key === query.landingPageKey)!;
  const ctr = metric(query, 'gsc.ctr').current;
  const impressions = metric(query, 'gsc.impressions').current;

  return (
    <Drawer
      eyebrow={`${query.branded ? 'Branded' : 'Non-branded'} · ${INTENT_LABEL[query.intent]}`}
      onClose={onClose}
      open
      title={query.query}
    >
      <div className="action-detail">
        <section aria-labelledby="query-metrics-title">
          <h3 id="query-metrics-title">This week</h3>
          <dl className="drawer-metrics">
            {query.metrics.map((compared) => (
              <div key={compared.metricStableKey}>
                <dt>{compared.label}</dt>
                <dd>
                  {formatMetricValue(compared.current, compared.unit)}{' '}
                  <ChangeCell metric={compared} />
                </dd>
              </div>
            ))}
          </dl>
          <EvidenceChipList
            ids={query.metrics.map(({ evidenceId }) => evidenceId)}
            label={`Evidence for ${query.query}`}
          />
        </section>

        <section aria-labelledby="query-landing-title">
          <h3 id="query-landing-title">Where it lands</h3>
          <div className="serp-preview">
            <span className="serp-preview__url">summitandsage.example{landing.path}</span>
            <span className="serp-preview__title">{landing.title}</span>
            <span className="serp-preview__description">{landing.metaDescription}</span>
          </div>
          {impressions > 4_000 && ctr < 2.5 && (
            <p className="evidence-caveat">
              This query is seen often and clicked rarely. That pattern can mean the snippet does
              not answer the question, or that the intent is not served by this page. Neither is
              established by the numbers alone.
            </p>
          )}
        </section>
      </div>
    </Drawer>
  );
}

export function SearchWorkspaceView() {
  const [tab, setTab] = useState<TabKey>('performance');
  const [openPage, setOpenPage] = useState<DemoSearchPage | null>(null);
  const [openQuery, setOpenQuery] = useState<DemoSearchQuery | null>(null);

  return (
    <div className="search-workspace">
      <PageHeading
        description="Where discoverability and qualified search demand are moving, and which pages and queries deserve attention first."
        eyebrow="Search & website"
        title="Search"
      />

      <ProvenanceNote>
        Search Console and analytics values come from the committed Summit &amp; Sage fixture. No
        live property is connected and no site is crawled.
      </ProvenanceNote>

      <div className="tab-strip" role="tablist" aria-label="Search workspace sections">
        {TABS.map(({ key, label }) => (
          <button
            aria-controls={`tab-panel-${key}`}
            aria-selected={tab === key}
            className={`tab-button ${tab === key ? 'tab-button--active' : ''}`}
            id={`tab-${key}`}
            key={key}
            onClick={() => setTab(key)}
            role="tab"
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      <div aria-labelledby={`tab-${tab}`} id={`tab-panel-${tab}`} role="tabpanel" tabIndex={0}>
        {tab === 'performance' && <PerformanceTab />}
        {tab === 'pages' && <PagesTab onOpen={setOpenPage} />}
        {tab === 'queries' && <QueriesTab onOpen={setOpenQuery} />}
        {tab === 'technical' && <TechnicalTab />}
        {tab === 'local' && <LocalTab />}
      </div>

      <PageDrawer onClose={() => setOpenPage(null)} page={openPage} />
      <QueryDrawer onClose={() => setOpenQuery(null)} query={openQuery} />
    </div>
  );
}
