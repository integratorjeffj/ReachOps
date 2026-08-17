'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { DemoAction, ObservationCandidate, OverviewResponse } from '@reachops/contracts';
import { PriorityPill } from './demo-primitives';
import { EvidenceChipList } from './evidence-drawer';
import { outcomeForAction } from './outcome-panel';
import { demoSnapshot } from '@/lib/demo/snapshot';
import { useDemoSession } from '@/lib/demo/session';
import {
  formatCalendarDate,
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
const CHART_HEIGHT = 220;
const CHART_PADDING = 26;

/**
 * Extra business context beyond the four contract KPIs.
 *
 * These read from committed evidence records rather than a second aggregation, so a reader can
 * open any of them and land on the same provenance the rest of the product cites.
 */
const SUPPORTING_SIGNALS = [
  { evidenceId: 'EV-108', label: 'Organic search clicks' },
  { evidenceId: 'EV-102', label: 'Organic sessions' },
  { evidenceId: 'EV-112', label: 'Profile website clicks' },
  { evidenceId: 'EV-113', label: 'Profile call clicks' },
];

const evidenceById = new Map(demoSnapshot.evidence.map((record) => [record.evidenceId, record]));

const TREND_RANGES = [
  { months: 6, label: '6 months' },
  { months: 13, label: '13 months' },
];

function changeToneFor(change: number | null, lowerIsBetter: boolean): string {
  if (change === null || change === 0) return 'flat';
  const improving = lowerIsBetter ? change < 0 : change > 0;
  return improving ? 'up' : 'down';
}

function formatChange(kpi: OverviewResponse['kpis'][number]): string {
  if (!kpi.change) return 'No comparison';
  if (kpi.definition?.unit === 'PERCENTAGE') {
    return formatSignedPoints(kpi.change.percentagePoints ?? 0);
  }
  return formatSignedPercentage(kpi.change.percentage);
}

function seriesPath(points: Array<{ value: number }>): string {
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

function OperatingTrend({
  trends,
  annotations,
}: {
  trends: OverviewResponse['trends'];
  annotations: OverviewResponse['annotations'];
}) {
  const [metricKey, setMetricKey] = useState(trends[0]?.metricStableKey ?? 'ga4.sessions');
  const [months, setMonths] = useState(13);

  const series = trends.find(({ metricStableKey }) => metricStableKey === metricKey) ?? trends[0];
  if (!series || series.points.length === 0) return null;

  const points = series.points.slice(-months);
  const first = points[0]!;
  const last = points.at(-1)!;
  const unit = series.definition.unit;
  const lowerIsBetter = series.definition.lowerIsBetter;

  // A full thirteen-month window puts the same month one year apart at both ends, which is the
  // only year-over-year comparison these fixtures genuinely support.
  const yearOverYear =
    points.length === 13 && first.value > 0
      ? ((last.value - first.value) / first.value) * 100
      : null;

  return (
    <section className="trend-card" aria-labelledby="trend-title">
      <div className="trend-heading">
        <div>
          <span className="eyebrow">Operating context</span>
          <h2 id="trend-title">{series.definition.displayName}</h2>
        </div>
        <div className="trend-controls">
          <label>
            <span>Metric</span>
            <select
              onChange={(event) => setMetricKey(event.target.value)}
              value={series.metricStableKey}
            >
              {trends.map((option) => (
                <option key={option.metricStableKey} value={option.metricStableKey}>
                  {option.definition.displayName}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Window</span>
            <select onChange={(event) => setMonths(Number(event.target.value))} value={months}>
              {TREND_RANGES.filter(({ months: value }) => value <= series.points.length).map(
                ({ months: value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>
      </div>

      <p className="chart-scale-note">
        {formatMonthYear(first.periodStart)} {formatMetricValue(first.value, unit)} →{' '}
        {formatMonthYear(last.periodStart)} {formatMetricValue(last.value, unit)}
        {yearOverYear !== null && (
          <>
            {' · '}
            <span
              className={`trend-delta trend-delta--${changeToneFor(yearOverYear, lowerIsBetter)}`}
            >
              {formatSignedPercentage(yearOverYear)} year over year
            </span>
          </>
        )}
      </p>

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
        <polyline className="trend-line--sessions" points={seriesPath(points)} />
        <text x={CHART_PADDING} y={CHART_HEIGHT - 6}>
          {formatMonthYear(first.periodStart)}
        </text>
        <text textAnchor="end" x={CHART_WIDTH - CHART_PADDING} y={CHART_HEIGHT - 6}>
          {formatMonthYear(last.periodStart)}
        </text>
      </svg>

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
          <caption>{series.definition.displayName} by month</caption>
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">{series.definition.displayName}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.evidenceId}>
                <th scope="row">{formatMonthYear(point.periodStart)}</th>
                <td>{formatMetricValue(point.value, unit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}

function WhatChanged({ overview }: { overview: OverviewResponse }) {
  const lines = overview.kpis
    .filter((kpi) => kpi.change && kpi.definition)
    .map((kpi) => {
      const lowerIsBetter = kpi.definition!.lowerIsBetter;
      const magnitude =
        kpi.definition!.unit === 'PERCENTAGE'
          ? (kpi.change!.percentagePoints ?? 0)
          : (kpi.change!.percentage ?? kpi.change!.absolute);
      return {
        key: kpi.key,
        label: kpi.label,
        tone: changeToneFor(magnitude, lowerIsBetter),
        change: formatChange(kpi),
        current: formatMetricValue(kpi.current!.value, kpi.definition!.unit),
        evidenceId: kpi.current!.evidenceId,
      };
    });

  return (
    <section aria-labelledby="what-changed-title" className="what-changed">
      <div className="section-heading compact-heading">
        <div>
          <span className="eyebrow">Compared with the prior week</span>
          <h2 id="what-changed-title">What changed</h2>
        </div>
      </div>
      <ul>
        {lines.map((line) => (
          <li key={line.key}>
            <span className={`change-dot change-dot--${line.tone}`} aria-hidden="true" />
            <div>
              <strong>
                {line.label} {line.current}
              </strong>
              <small>{line.change} versus the prior week</small>
            </div>
            <EvidenceChipList ids={[line.evidenceId]} label={`Evidence for ${line.label}`} />
          </li>
        ))}
      </ul>
      <p className="causal-note">
        These are measured differences between two reporting periods. Nothing here asserts why a
        number moved.
      </p>
    </section>
  );
}

function SupportingSignals() {
  const signals = SUPPORTING_SIGNALS.map((signal) => ({
    ...signal,
    record: evidenceById.get(signal.evidenceId),
  })).filter((signal) => signal.record);

  if (signals.length === 0) return null;

  return (
    <section aria-labelledby="signals-title" className="supporting-signals">
      <h2 className="visually-hidden" id="signals-title">
        Supporting business signals
      </h2>
      <ul>
        {signals.map(({ evidenceId, label, record }) => (
          <li key={evidenceId}>
            <span>{label}</span>
            <strong>{formatMetricValue(record!.value, record!.unit)}</strong>
            <EvidenceChipList ids={[evidenceId]} label={`Evidence for ${label}`} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ActiveGoals({ goals }: { goals: OverviewResponse['goals'] }) {
  if (goals.length === 0) return null;

  return (
    <section aria-labelledby="goals-title" className="goal-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Progress and gap</span>
          <h2 id="goals-title">Active goals</h2>
        </div>
      </div>
      <ul className="goal-list">
        {goals.map((goal) => {
          const attained = goal.attainmentPercentage;
          const measurable = goal.status !== 'UNAVAILABLE' && attained !== null;
          return (
            <li key={goal.stableKey}>
              <div className="goal-list__top">
                <strong>{goal.title}</strong>
                {measurable ? (
                  <span className={attained >= 100 ? 'threshold-met' : 'threshold-unmet'}>
                    {attained.toFixed(0)}%
                  </span>
                ) : (
                  <span className="goal-unmeasured">Not yet measured</span>
                )}
              </div>
              {measurable ? (
                <>
                  <div
                    aria-hidden="true"
                    className="goal-bar"
                    style={{ '--goal-fill': `${Math.min(attained, 100)}%` } as React.CSSProperties}
                  >
                    <i />
                  </div>
                  <small>
                    {formatNumber(goal.currentValue!)} of {formatNumber(goal.targetValue!)}{' '}
                    {goal.targetUnit?.replaceAll('_', ' ').toLowerCase()}
                  </small>
                </>
              ) : (
                <small>
                  No verified metric is mapped to this goal yet, so ReachOps shows no progress
                  rather than an estimate.
                </small>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function TopOpportunities({ observations }: { observations: ObservationCandidate[] }) {
  const { opportunities } = useDemoSession();
  const byObservation = new Map(opportunities.map((item) => [item.observationId, item]));

  return (
    <section className="priority-panel" aria-labelledby="priorities-title">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Deterministic rule output</span>
          <h2 id="priorities-title">What needs a look first</h2>
        </div>
      </div>
      {observations.length > 0 ? (
        <ol className="ranked-observations">
          {observations.slice(0, 3).map((observation, index) => {
            const opportunity = byObservation.get(observation.id);
            return (
              <li key={observation.id}>
                <span>0{index + 1}</span>
                <div>
                  <div className="ranked-observations__tags">
                    <PriorityPill priority={observation.priority} />
                    {opportunity && (
                      <>
                        <span className="meta-chip">Impact {opportunity.impact.toLowerCase()}</span>
                        <span className="meta-chip">Effort {opportunity.effort}</span>
                      </>
                    )}
                  </div>
                  <strong>{observation.title}</strong>
                  <small>{observation.summary}</small>
                  <EvidenceChipList ids={observation.evidenceIds} />
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <ol>
          {[1, 2, 3].map((position) => (
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
      <Link href="/opportunities">Open all opportunities →</Link>
    </section>
  );
}

function RecentOutcomes({ actions }: { actions: DemoAction[] }) {
  const completed = actions
    .filter(({ status }) => status === 'COMPLETED')
    .sort((left, right) => right.decidedOn.localeCompare(left.decidedOn))
    .slice(0, 4);

  if (completed.length === 0) return null;

  return (
    <section aria-labelledby="outcomes-title" className="outcomes-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Completed work and what followed</span>
          <h2 id="outcomes-title">Recent outcomes</h2>
        </div>
        <Link href="/actions">All work →</Link>
      </div>
      <ul className="outcome-list">
        {completed.map((action) => (
          <li key={action.id}>
            <div className="outcome-list__top">
              <strong>{action.title}</strong>
              <span>{formatCalendarDate(action.decidedOn)}</span>
            </div>
            <p>{action.note}</p>
            {(() => {
              const outcome = outcomeForAction(action.id);
              if (!outcome) return <small>Owner {action.owner} · No outcome recorded</small>;
              if (outcome.status !== 'MEASURED') {
                return <small>Owner {action.owner} · Outcome not measurable</small>;
              }
              return (
                <small>
                  Owner {action.owner} ·{' '}
                  <strong>
                    {outcome.relativeChangePercent! >= 0 ? '+' : ''}
                    {outcome.relativeChangePercent}%
                  </strong>{' '}
                  {outcome.metricLabel.toLowerCase()} after
                </small>
              );
            })()}
          </li>
        ))}
      </ul>
      <p className="causal-note">
        Subsequent performance is reported as an observation. ReachOps does not attribute a later
        change to completed work.
      </p>
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

interface CommandCenterViewProps {
  overview: OverviewResponse;
  observations?: ObservationCandidate[];
}

export function CommandCenterView({ overview, observations }: CommandCenterViewProps) {
  const { actions } = useDemoSession();
  const ranked = useMemo(() => observations ?? [], [observations]);
  const concern = ranked.find(({ priority }) => priority === 'HIGH');

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

  const { headline, detail } = leadCopy(overview, concern);

  return (
    <div className="executive-overview">
      <header className="overview-lead">
        <div>
          <span className="eyebrow">
            Command Center · Week ending {formatDay(overview.activeWeek.end)}
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
                    Retrieved {formatDay(kpi.current.retrievedAt)}
                    <EvidenceChipList ids={[kpi.current.evidenceId]} />
                  </p>
                )}
                {kpi.coverageNote && <p>{kpi.coverageNote}</p>}
              </details>
            </article>
          ))}
        </div>
      </section>

      <SupportingSignals />

      <WhatChanged overview={overview} />

      <div className="overview-columns">
        <TopOpportunities observations={ranked} />
        <ActiveGoals goals={overview.goals} />
      </div>

      <div className="overview-columns">
        <RecentOutcomes actions={actions} />
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
                  <small>{source.provider.replace(/_/g, ' ').toLowerCase()}</small>
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

      <OperatingTrend annotations={overview.annotations} trends={overview.trends} />
    </div>
  );
}
