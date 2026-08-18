'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { PageHeading } from './demo-primitives';
import { EvidenceChipList } from './evidence-drawer';
import { OutcomePanel } from './outcome-panel';
import { demoSnapshot } from '@/lib/demo/snapshot';
import { useDemoSession } from '@/lib/demo/session';
import {
  formatCalendarDate,
  formatDay,
  formatMetricValue,
  formatNumber,
  formatRange,
  formatYear,
} from '@/lib/format';

/**
 * The executive report.
 *
 * Organised by what a claim actually is, not by channel. A movement in a metric, an interpretation
 * of that movement, a decision a person took, and a later measurement are four different kinds of
 * statement, and a report that blurs them is how a dashboard turns into a story nobody can check.
 */
const KINDS = {
  OBSERVED: {
    label: 'Observed',
    description: 'A measured difference between two reporting periods.',
  },
  INTERPRETED: {
    label: 'Interpreted',
    description: 'ReachOps explaining why a movement may matter. Still not a cause.',
  },
  DECIDED: {
    label: 'Decided',
    description: 'A person accepted work and put their name to it.',
  },
  OUTCOME: {
    label: 'Outcome',
    description: 'What the metrics did afterwards. Causality is not established by sequence.',
  },
} as const;

type KindKey = keyof typeof KINDS;

function ReportSection({
  kind,
  title,
  id,
  children,
}: {
  kind: KindKey;
  title: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="report-section">
      <div className="report-section__head">
        <span className={`kind-pill kind-pill--${kind.toLowerCase()}`}>{KINDS[kind].label}</span>
        <h2 id={id}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

interface Movement {
  evidenceId: string;
  label: string;
  value: number;
  unit: string;
  priorValue: number;
  percent: number;
  improving: boolean;
  display: string;
}

/**
 * Ranks the week's workspace movements by magnitude.
 *
 * Direction is read through each metric's own semantics, so a falling average position counts as a
 * gain and a rising one as a loss. Ranking on the raw sign would have put the two in the wrong
 * columns.
 */
function useMovements(): { gains: Movement[]; losses: Movement[] } {
  return useMemo(() => {
    const movements = demoSnapshot.evidence
      .filter(
        (record) =>
          record.grain === 'WEEK' &&
          record.dimensions.scope === 'workspace' &&
          record.priorValue !== null &&
          record.priorValue !== 0 &&
          record.displayChange !== null,
      )
      .map((record) => {
        const percent = ((record.value - record.priorValue!) / record.priorValue!) * 100;
        return {
          evidenceId: record.evidenceId,
          label: record.metricDisplayName,
          value: record.value,
          unit: record.unit,
          priorValue: record.priorValue!,
          percent,
          improving: record.lowerIsBetter ? percent < 0 : percent > 0,
          display: record.displayChange!,
        };
      });

    const byMagnitude = (left: Movement, right: Movement) =>
      Math.abs(right.percent) - Math.abs(left.percent);

    return {
      gains: movements
        .filter(({ improving }) => improving)
        .sort(byMagnitude)
        .slice(0, 4),
      losses: movements
        .filter(({ improving }) => !improving)
        .sort(byMagnitude)
        .slice(0, 4),
    };
  }, []);
}

function MovementList({ movements, empty }: { movements: Movement[]; empty: string }) {
  if (movements.length === 0) return <p className="evidence-caveat">{empty}</p>;

  return (
    <ul className="movement-list">
      {movements.map((movement) => (
        <li key={movement.evidenceId}>
          <div>
            <strong>{movement.label}</strong>
            <small>
              {formatMetricValue(movement.priorValue, movement.unit)} →{' '}
              {formatMetricValue(movement.value, movement.unit)}
            </small>
          </div>
          <span className={`delta delta--${movement.improving ? 'up' : 'down'}`}>
            {movement.display}
          </span>
          <EvidenceChipList ids={[movement.evidenceId]} label={`Evidence for ${movement.label}`} />
        </li>
      ))}
    </ul>
  );
}

export function ReportsView() {
  const { opportunities, actions } = useDemoSession();
  const { overview, weeklyReview, connections, outcomes } = demoSnapshot;
  const { gains, losses } = useMovements();

  const period = `${formatRange(overview.activeWeek.start, overview.activeWeek.end)}, ${formatYear(
    overview.activeWeek.end,
  )}`;

  const sessions = overview.kpis.find(({ key }) => key === 'sessions');
  const bookings = overview.kpis.find(({ key }) => key === 'confirmed-bookings');
  const awaiting = opportunities.filter(({ status }) => status === 'PROPOSED');
  const decided = opportunities.filter(({ status }) => status !== 'PROPOSED');
  const completedWork = actions.filter(({ status }) => status === 'COMPLETED');
  const openWork = actions.filter(({ status }) => status !== 'COMPLETED');
  const noHistory = connections.filter(({ dataState }) => dataState === 'NO_HISTORY');

  return (
    <div className="reports-workspace">
      <div className="report-toolbar">
        <PageHeading
          description={`Weekly reach review for Summit & Sage Home Services, ${period}.`}
          eyebrow="Executive report"
          title="Report"
        />
        <button className="button button--primary" onClick={() => window.print()} type="button">
          Print or save as PDF
        </button>
      </div>

      <p className="report-period">
        Reporting period {period} · {overview.workspace.timezone} · dataset{' '}
        {overview.workspace.datasetVersion}. This period is fixed; the demonstration holds one
        frozen week, so no period selector is offered that could not change what it claims to.
      </p>

      <ReportSection id="report-summary" kind="OBSERVED" title="Executive summary">
        <p className="report-lead">
          Demand grew faster than booked work. Website sessions reached{' '}
          {formatMetricValue(sessions!.current!.value, sessions!.definition!.unit)} and confirmed
          bookings {formatMetricValue(bookings!.current!.value, bookings!.definition!.unit)}. The
          clearest divergence is the AC repair page, where traffic rose while its booking rate fell
          by more than two percentage points.
        </p>
        <p className="causal-note">
          A booking-form layout change was deployed inside the same window. ReachOps records that as
          context and does not conclude it caused the decline.
        </p>
      </ReportSection>

      <ReportSection id="report-goals" kind="OBSERVED" title="Goal progress">
        <ul className="report-goals">
          {overview.goals.map((goal) => (
            <li key={goal.stableKey}>
              <div>
                <strong>{goal.title}</strong>
                <small>{goal.description}</small>
              </div>
              {goal.attainmentPercentage !== null ? (
                <span
                  className={goal.attainmentPercentage >= 100 ? 'threshold-met' : 'threshold-unmet'}
                >
                  {goal.attainmentPercentage.toFixed(0)}%
                </span>
              ) : (
                <span className="goal-unmeasured">Not yet measured</span>
              )}
            </li>
          ))}
        </ul>
      </ReportSection>

      <div className="report-columns">
        <ReportSection id="report-gains" kind="OBSERVED" title="Strongest gains">
          <MovementList empty="Nothing improved materially this week." movements={gains} />
        </ReportSection>
        <ReportSection id="report-losses" kind="OBSERVED" title="Strongest losses">
          <MovementList empty="Nothing declined materially this week." movements={losses} />
        </ReportSection>
      </div>

      <ReportSection id="report-opportunities" kind="INTERPRETED" title="What ReachOps flagged">
        <p className="report-lead">
          {weeklyReview.observations.length} observations were emitted from{' '}
          {weeklyReview.evaluations.length} deterministic rules, producing {opportunities.length}{' '}
          opportunities. {awaiting.length} are still waiting for a decision.
        </p>
        <ul className="report-opportunities">
          {opportunities.map((opportunity) => (
            <li key={opportunity.id}>
              <div>
                <strong>{opportunity.title}</strong>
                <small>
                  Impact {opportunity.impact.toLowerCase()} · effort {opportunity.effort} ·
                  confidence {opportunity.observationConfidence.toLowerCase()}
                </small>
              </div>
              <span className={`status-pill status-pill--${opportunity.status.toLowerCase()}`}>
                {opportunity.status.replace('_', ' ').toLowerCase()}
              </span>
            </li>
          ))}
        </ul>
      </ReportSection>

      <ReportSection id="report-decisions" kind="DECIDED" title="Decisions and work in flight">
        <p className="report-lead">
          {decided.length} opportunities were acted on and {openWork.length} pieces of work are
          open. Every one carries a named owner; ReachOps does not assign work to itself.
        </p>
        <ul className="report-work">
          {openWork.map((action) => (
            <li key={action.id}>
              <div>
                <strong>{action.title}</strong>
                <small>
                  {action.owner}
                  {action.dueOn ? ` · due ${formatCalendarDate(action.dueOn)}` : ''}
                  {action.reviewOn ? ` · review ${formatCalendarDate(action.reviewOn)}` : ''}
                </small>
              </div>
              <span className="meta-chip">{action.status.replace('_', ' ').toLowerCase()}</span>
            </li>
          ))}
        </ul>
      </ReportSection>

      <ReportSection id="report-outcomes" kind="OUTCOME" title="What earlier work did afterwards">
        <p className="report-lead">
          {completedWork.length} pieces of work are complete and {outcomes.length} carry an outcome
          record. Where a competing explanation exists it is stated rather than omitted.
        </p>
        {outcomes.map((outcome) => (
          <OutcomePanel key={outcome.id} outcome={outcome} />
        ))}
      </ReportSection>

      <ReportSection id="report-sources" kind="OBSERVED" title="Source health">
        <ul className="report-sources">
          {connections.map((connection) => (
            <li key={connection.connectionId}>
              <div>
                <strong>{connection.displayName}</strong>
                <small>{connection.dataStateNote}</small>
              </div>
              <span className={`mode-pill mode-pill--${connection.mode.toLowerCase()}`}>
                {connection.mode === 'IMPORTED' ? 'Imported' : 'Simulated'}
              </span>
            </li>
          ))}
        </ul>
        {noHistory.length > 0 && (
          <p className="evidence-caveat">
            {noHistory.length} connected source
            {noHistory.length === 1 ? ' carries' : 's carry'} no performance history, so no metric
            in this report is derived from {noHistory.length === 1 ? 'it' : 'them'}.
          </p>
        )}
      </ReportSection>

      <section aria-labelledby="report-method" className="report-section report-appendix">
        <div className="report-section__head">
          <h2 id="report-method">Methodology and data status</h2>
        </div>
        <dl className="report-method">
          <div>
            <dt>Reporting window</dt>
            <dd>
              {formatDay(overview.activeWeek.start)} to {formatDay(overview.activeWeek.end)},{' '}
              {overview.workspace.timezone}
            </dd>
          </div>
          <div>
            <dt>Comparison basis</dt>
            <dd>The immediately preceding week, same weekday alignment</dd>
          </div>
          <div>
            <dt>Rule engine</dt>
            <dd>Version {weeklyReview.ruleVersion}</dd>
          </div>
          <div>
            <dt>Dataset</dt>
            <dd>{overview.workspace.datasetVersion}, synthetic throughout</dd>
          </div>
          <div>
            <dt>Evidence records</dt>
            <dd>{formatNumber(demoSnapshot.evidence.length)} inspectable observations</dd>
          </div>
        </dl>
        <p className="causal-note">
          Every figure here is synthetic and describes a fictional company. ReachOps holds no live
          provider authorization, publishes nothing, and does not attribute a later change to
          earlier work. Where a number could not be verified it is reported as unavailable rather
          than estimated.
        </p>
        <p className="evidence-caveat">
          Definitions and lineage for any figure are available from its evidence chip, or on the{' '}
          <Link href="/connections">Connections</Link> page.
        </p>
      </section>
    </div>
  );
}
