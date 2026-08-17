'use client';

import type { DemoOutcomeMeasurement } from '@reachops/contracts';
import { EvidenceChipList } from './evidence-drawer';
import { demoSnapshot } from '@/lib/demo/snapshot';
import { formatCalendarDate, formatNumber } from '@/lib/format';

const outcomeByAction = new Map(
  demoSnapshot.outcomes.map((outcome) => [outcome.actionId, outcome]),
);

export function outcomeForAction(actionId: string): DemoOutcomeMeasurement | undefined {
  return outcomeByAction.get(actionId);
}

const STATUS_LABEL: Record<DemoOutcomeMeasurement['status'], string> = {
  MEASURED: 'Measured',
  GATHERING: 'Still gathering',
  NOT_MEASURABLE: 'Not measurable',
};

/**
 * What happened after the work.
 *
 * The two windows sit side by side with their own evidence, and the change between them is
 * reported as a difference rather than a result. Where something else could explain the movement
 * it is named directly under the number, because a confounder mentioned in a footnote is a
 * confounder nobody reads.
 */
export function OutcomePanel({ outcome }: { outcome: DemoOutcomeMeasurement }) {
  const measured = outcome.status === 'MEASURED' && outcome.baseline && outcome.followUp;

  return (
    <section aria-labelledby={`outcome-${outcome.id}`} className="outcome-panel">
      <div className="outcome-panel__head">
        <h3 id={`outcome-${outcome.id}`}>What happened afterwards</h3>
        <span className={`status-pill status-pill--${outcome.status.toLowerCase()}`}>
          {STATUS_LABEL[outcome.status]}
        </span>
      </div>

      <p className="evidence-prose">{outcome.assessment}</p>

      {measured ? (
        <>
          <div className="outcome-windows">
            <div>
              <span className="outcome-windows__label">Baseline</span>
              <strong>{formatNumber(outcome.baseline!.value)}</strong>
              <small>{outcome.baseline!.label}</small>
              <EvidenceChipList
                ids={outcome.baseline!.evidenceIds}
                label={`Baseline evidence for ${outcome.title}`}
              />
            </div>
            <span aria-hidden="true" className="outcome-windows__arrow">
              →
            </span>
            <div>
              <span className="outcome-windows__label">Follow-up</span>
              <strong>{formatNumber(outcome.followUp!.value)}</strong>
              <small>{outcome.followUp!.label}</small>
              <EvidenceChipList
                ids={outcome.followUp!.evidenceIds}
                label={`Follow-up evidence for ${outcome.title}`}
              />
            </div>
            <div className="outcome-windows__change">
              <span className="outcome-windows__label">Difference</span>
              <strong>
                {outcome.relativeChangePercent! >= 0 ? '+' : ''}
                {outcome.relativeChangePercent}%
              </strong>
              <small>
                {outcome.absoluteChange! >= 0 ? '+' : ''}
                {formatNumber(outcome.absoluteChange!)} {outcome.metricLabel.toLowerCase()}
              </small>
            </div>
          </div>

          <p className="outcome-frozen">
            Baseline frozen when monitoring began, on{' '}
            {formatCalendarDate(outcome.implementationDate)}. It does not move when a filter
            changes.
          </p>
        </>
      ) : (
        <p className="evidence-caveat">
          No before-and-after comparison is shown, because none can be made from what was recorded.
        </p>
      )}

      {outcome.confounders.length > 0 && (
        <div className="outcome-confounders">
          <span className="tag-label">What else could explain this</span>
          <ul>
            {outcome.confounders.map((confounder) => (
              <li key={confounder}>{confounder}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="causal-note">{outcome.caveat}</p>
    </section>
  );
}
