import Link from 'next/link';
import type { OverviewResponse } from '@reachops/contracts';

const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const dateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'America/Denver',
});

function formatValue(value: number, unit: string): string {
  if (unit === 'PERCENTAGE') return `${value.toFixed(2)}%`;
  if (unit === 'RATING') return value.toFixed(2);
  return numberFormat.format(value);
}

function formatChange(kpi: OverviewResponse['kpis'][number]): string {
  if (!kpi.change) return 'No comparison';
  if (kpi.definition?.unit === 'PERCENTAGE') {
    const value = kpi.change.percentagePoints ?? 0;
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)} pp`;
  }
  const value = kpi.change.percentage;
  if (value === null) return 'Prior value was zero';
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function sourceModeLabel(mode: string): string {
  return mode === 'IMPORTED' ? 'Imported' : mode === 'LIVE' ? 'Live' : 'Simulated';
}

function TrendChart({ trends }: { trends: OverviewResponse['trends'] }) {
  if (trends.length === 0) return null;
  const sessions = trends.find(({ metricStableKey }) => metricStableKey === 'ga4.sessions');
  const bookings = trends.find(
    ({ metricStableKey }) => metricStableKey === 'ga4.confirmed_bookings',
  );
  if (!sessions || !bookings || sessions.points.length === 0) return null;
  const width = 760;
  const height = 210;
  const padding = 22;
  const points = sessions.points;
  const max = Math.max(...points.map(({ value }) => value));
  const min = Math.min(...points.map(({ value }) => value));
  const line = points
    .map(({ value }, index) => {
      const x = padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
      const y =
        height - padding - ((value - min) / Math.max(max - min, 1)) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <section className="trend-card" aria-labelledby="trend-title">
      <div className="trend-heading">
        <div>
          <span className="eyebrow">13-month operating context</span>
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
      <svg aria-hidden="true" className="trend-chart" viewBox={`0 0 ${width} ${height}`}>
        <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} />
        <polyline points={line} />
        <text x={padding} y={18}>
          31.8k sessions
        </text>
        <text textAnchor="end" x={width - padding} y={18}>
          42.3k sessions
        </text>
      </svg>
      <div className="annotation-row">
        <span>Campaign context</span>
        <strong>Summer Ready</strong>
        <span>Mobile booking deployment · Jul 30</span>
      </div>
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
                <th scope="row">{dateFormat.format(new Date(point.periodStart))}</th>
                <td>{numberFormat.format(point.value)}</td>
                <td>{numberFormat.format(bookings.points[index]?.value ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}

export function OverviewView({ overview }: { overview: OverviewResponse }) {
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

  return (
    <div className="executive-overview">
      <header className="overview-lead">
        <div>
          <span className="eyebrow">Executive overview · Week ending Aug 2</span>
          <h1>Demand is up; AC repair conversion needs attention.</h1>
          <p>
            Traffic grew 10.1%, while confirmed bookings rose 2.1%. The AC repair page needs the
            first look.
          </p>
        </div>
        <aside className="week-panel" aria-label="Current reporting window">
          <span>Current reporting window</span>
          <strong>Jul 27 — Aug 2</strong>
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
                  ? formatValue(kpi.current.value, kpi.definition.unit)
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
                    {kpi.current.evidenceId} · retrieved{' '}
                    {dateFormat.format(new Date(kpi.current.retrievedAt))}
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
              <span className="eyebrow">Next in sequence</span>
              <h2 id="priorities-title">Priority analysis</h2>
            </div>
            <span className="pending-chip">Pending M2</span>
          </div>
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
          <Link href="/weekly-review">Open weekly review structure →</Link>
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
                  <small>{source.resourceName}</small>
                </div>
                <div>
                  <span className={`mode-pill mode-pill--${source.mode.toLowerCase()}`}>
                    {sourceModeLabel(source.mode)}
                  </span>
                  <small>
                    {source.lastSyncedAt
                      ? `Synced ${dateFormat.format(new Date(source.lastSyncedAt))}`
                      : source.status}
                  </small>
                </div>
              </li>
            ))}
          </ul>
          <Link href="/connections">Inspect source health →</Link>
        </section>
      </div>

      <TrendChart trends={overview.trends} />
    </div>
  );
}
