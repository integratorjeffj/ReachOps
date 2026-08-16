import Link from 'next/link';
import type { ObservationCandidate, OverviewResponse } from '@reachops/contracts';
import { PriorityPill } from './demo-primitives';
import {
  formatDay,
  formatMetricValue,
  formatMonthYear,
  formatNumber,
  formatRange,
  formatSignedPercentage,
  formatSignedPoints,
  sourceModeLabel,
} from '@/lib/format';

const CHART_WIDTH = 760;
const CHART_HEIGHT = 210;
const CHART_PADDING = 22;

function formatChange(kpi: OverviewResponse['kpis'][number]): string {
  if (!kpi.change) return 'No comparison';
  if (kpi.definition?.unit === 'PERCENTAGE') {
    return formatSignedPoints(kpi.change.percentagePoints ?? 0);
  }
  return formatSignedPercentage(kpi.change.percentage);
}

/** Maps a series onto the chart box using its own minimum and maximum. */
function seriesPoints(points: Array<{ value: number }>): string {
  const values = points.map(({ value }) => value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  return points
    .map(({ value }, index) => {
      const x =
        CHART_PADDING +
        (index / Math.max(points.length - 1, 1)) * (CHART_WIDTH - CHART_PADDING * 2);
      const y =
        CHART_HEIGHT -
        CHART_PADDING -
        ((value - min) / Math.max(max - min, 1)) * (CHART_HEIGHT - CHART_PADDING * 2);
      return `${x},${y}`;
    })
    .join(' ');
}

function TrendChart({
  trends,
  annotations,
}: {
  trends: OverviewResponse['trends'];
  annotations: OverviewResponse['annotations'];
}) {
  const sessions = trends.find(({ metricStableKey }) => metricStableKey === 'ga4.sessions');
  const bookings = trends.find(
    ({ metricStableKey }) => metricStableKey === 'ga4.confirmed_bookings',
  );
  if (!sessions || !bookings || sessions.points.length === 0 || bookings.points.length === 0) {
    return null;
  }

  const firstPoint = sessions.points[0]!;
  const lastPoint = sessions.points.at(-1)!;
  const firstBooking = bookings.points[0]!;
  const lastBooking = bookings.points.at(-1)!;
  const monthSpan = sessions.points.length;

  return (
    <section className="trend-card" aria-labelledby="trend-title">
      <div className="trend-heading">
        <div>
          <span className="eyebrow">{monthSpan}-month operating context</span>
          <h2 id="trend-title">Demand and confirmed bookings</h2>
        </div>
        <div className="trend-legend" aria-label="Chart legend">
          <span>
            <i />
            Sessions
          </span>
          <span>
            <i />
            Bookings
          </span>
        </div>
      </div>

      <svg
        aria-hidden="true"
        className="trend-chart"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      >
        <line
          x1={CHART_PADDING}
          x2={CHART_WIDTH - CHART_PADDING}
          y1={CHART_HEIGHT - CHART_PADDING}
          y2={CHART_HEIGHT - CHART_PADDING}
        />
        <polyline className="trend-line--sessions" points={seriesPoints(sessions.points)} />
        <polyline className="trend-line--bookings" points={seriesPoints(bookings.points)} />
        <text x={CHART_PADDING} y={18}>
          {formatNumber(firstPoint.value)} sessions
        </text>
        <text textAnchor="end" x={CHART_WIDTH - CHART_PADDING} y={18}>
          {formatNumber(lastPoint.value)} sessions
        </text>
        <text x={CHART_PADDING} y={CHART_HEIGHT - 4}>
          {formatMonthYear(firstPoint.periodStart)}
        </text>
        <text textAnchor="end" x={CHART_WIDTH - CHART_PADDING} y={CHART_HEIGHT - 4}>
          {formatMonthYear(lastPoint.periodStart)}
        </text>
      </svg>

      <p className="chart-scale-note">
        Each series is scaled independently so shape can be compared. Bookings moved from{' '}
        {formatNumber(firstBooking.value)} to {formatNumber(lastBooking.value)} over the same span.
      </p>

      {annotations.length > 0 && (
        <ul className="annotation-row" aria-label="Business context in this window">
          {annotations.map((annotation) => (
            <li key={annotation.stableKey}>
              <span>{annotation.type.replace('_', ' ').toLowerCase()}</span>
              <strong>{annotation.title}</strong>
              <span>{formatDay(annotation.startsAt)}</span>
            </li>
          ))}
        </ul>
      )}

      <details className="trend-table">
        <summary>View accessible trend table</summary>
        <table>
          <caption>Monthly sessions and confirmed bookings</caption>
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">Sessions</th>
              <th scope="col">Bookings</th>
            </tr>
          </thead>
          <tbody>
            {sessions.points.map((point, index) => (
              <tr key={point.evidenceId}>
                <th scope="row">{formatMonthYear(point.periodStart)}</th>
                <td>{formatNumber(point.value)}</td>
                <td>{formatNumber(bookings.points[index]?.value ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}

function leadCopy(overview: OverviewResponse, concern: ObservationCandidate | undefined) {
  const sessions = overview.kpis.find(({ key }) => key === 'sessions');
  const bookings = overview.kpis.find(({ key }) => key === 'confirmed-bookings');

  const direction = sessions?.change?.direction;
  const headline =
    direction === 'UP'
      ? 'Demand is up.'
      : direction === 'DOWN'
        ? 'Demand is down.'
        : 'Demand is flat.';

  const clauses: string[] = [];
  if (sessions?.change?.percentage !== null && sessions?.change?.percentage !== undefined) {
    const verb = sessions.change.percentage >= 0 ? 'grew' : 'fell';
    clauses.push(`Traffic ${verb} ${Math.abs(sessions.change.percentage).toFixed(1)}%`);
  }
  if (bookings?.change?.percentage !== null && bookings?.change?.percentage !== undefined) {
    const verb = bookings.change.percentage >= 0 ? 'rose' : 'fell';
    clauses.push(`confirmed bookings ${verb} ${Math.abs(bookings.change.percentage).toFixed(1)}%`);
  }

  const measured = clauses.length > 0 ? `${clauses.join(' while ')}.` : '';
  return { headline, detail: concern ? `${measured} ${concern.title}.`.trim() : measured };
}

interface OverviewViewProps {
  overview: OverviewResponse;
  observations?: ObservationCandidate[];
}

export function OverviewView({ overview, observations }: OverviewViewProps) {
  if (overview.state === 'EMPTY') {
    return (
      <section className="overview-status" aria-labelledby="overview-empty-title">
        <span className="status-glyph status-glyph--empty" aria-hidden="true">
          ○
        </span>
        <span className="eyebrow">No verified observations</span>
        <h1 id="overview-empty-title">Connect or import a source to build this week’s overview.</h1>
        <p>
          ReachOps will show KPIs only after source-native definitions, lineage, and quality checks
          are available.
        </p>
        <Link className="button button--primary" href="/connections">
          Review connections
        </Link>
      </section>
    );
  }

  const ranked = [...(observations ?? [])].slice(0, 3);
  const concern = ranked.find(({ priority }) => priority === 'HIGH');
  const { headline, detail } = leadCopy(overview, concern);

  return (
    <div className="executive-overview">
      <header className="overview-lead">
        <div>
          <span className="eyebrow">
            Executive overview · Week ending {formatDay(overview.activeWeek.end)}
          </span>
          <h1>{headline}</h1>
          <p>{detail}</p>
        </div>
        <aside className="week-panel" aria-label="Current reporting window">
          <span>Current reporting window</span>
          <strong>{formatRange(overview.activeWeek.start, overview.activeWeek.end)}</strong>
          <small>
            {overview.workspace.timezone} · {overview.workspace.datasetVersion}
          </small>
        </aside>
      </header>

      {overview.state === 'PARTIAL' && (
        <div className="quality-notice" role="status">
          Some values have incomplete coverage. Each affected KPI retains its quality note.
        </div>
      )}

      <section aria-labelledby="kpi-title" className="overview-kpis">
        <div className="section-heading compact-heading">
          <div>
            <span className="eyebrow">Current week</span>
            <h2 id="kpi-title">Four signals that frame the decision</h2>
          </div>
        </div>
        <div className="kpi-grid">
          {overview.kpis.map((kpi) => (
            <article
              className={`kpi-card ${kpi.status === 'PARTIAL' ? 'kpi-card--partial' : ''}`}
              key={kpi.key}
            >
              <div className="kpi-card__top">
                <span>{kpi.label}</span>
                <span className="source-chip">
                  {kpi.sourceModes.map(sourceModeLabel).join(' + ') || 'Unavailable'}
                </span>
              </div>
              <strong>
                {kpi.current && kpi.definition
                  ? formatMetricValue(kpi.current.value, kpi.definition.unit)
                  : '—'}
              </strong>
              <div
                className={`kpi-change kpi-change--${kpi.change?.direction.toLowerCase() ?? 'none'}`}
              >
                <span>{formatChange(kpi)}</span>
                <small>vs prior week</small>
              </div>
              <details>
                <summary>Definition &amp; evidence</summary>
                <p>{kpi.definition?.description ?? 'No verified definition is available.'}</p>
                {kpi.current && (
                  <p>
                    {kpi.current.evidenceId} · retrieved {formatDay(kpi.current.retrievedAt)}
                  </p>
                )}
                {kpi.coverageNote && <p>{kpi.coverageNote}</p>}
              </details>
            </article>
          ))}
        </div>
      </section>

      <div className="overview-columns">
        <section className="priority-panel" aria-labelledby="priorities-title">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Deterministic rule output</span>
              <h2 id="priorities-title">What needs a look first</h2>
            </div>
            <span className="pending-chip">
              {ranked.length > 0 ? 'Ranking pending M2' : 'Pending M2'}
            </span>
          </div>
          {ranked.length > 0 ? (
            <ol className="ranked-observations">
              {ranked.map((observation, index) => (
                <li key={observation.id}>
                  <span>0{index + 1}</span>
                  <div>
                    <PriorityPill priority={observation.priority} />
                    <strong>{observation.title}</strong>
                    <small>{observation.summary}</small>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <ol>
              {overview.priorities.map(({ position }) => (
                <li key={position}>
                  <span>0{position}</span>
                  <div>
                    <strong>Deterministic priority reserved</strong>
                    <small>
                      Analysis rules arrive in the next milestone; no AI claim is shown early.
                    </small>
                  </div>
                </li>
              ))}
            </ol>
          )}
          <Link href="/weekly-review">Open the weekly review →</Link>
        </section>
        <section className="coverage-panel" aria-labelledby="coverage-title">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Evidence coverage</span>
              <h2 id="coverage-title">Sources</h2>
            </div>
            <strong>{overview.sourceCoverage.length} connected</strong>
          </div>
          <ul>
            {overview.sourceCoverage.map((source) => (
              <li key={source.connectionId}>
                <div>
                  <strong>{source.displayName}</strong>
                  <small>
                    {source.resourceName && source.resourceName !== source.displayName
                      ? source.resourceName
                      : source.provider.replace(/_/g, ' ').toLowerCase()}
                  </small>
                </div>
                <div>
                  <span className={`mode-pill mode-pill--${source.mode.toLowerCase()}`}>
                    {sourceModeLabel(source.mode)}
                  </span>
                  <small>
                    {source.lastSyncedAt
                      ? `Synced ${formatDay(source.lastSyncedAt)}`
                      : source.status}
                  </small>
                </div>
              </li>
            ))}
          </ul>
          <Link href="/connections">Inspect source health →</Link>
        </section>
      </div>

      <TrendChart annotations={overview.annotations} trends={overview.trends} />
    </div>
  );
}
