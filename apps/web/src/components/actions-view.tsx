import Link from 'next/link';
import type { DemoAction } from '@reachops/contracts';
import { EvidenceChips, PageHeading, ProvenanceNote } from './demo-primitives';
import { formatCalendarDate } from '@/lib/format';

const COLUMNS = [
  {
    status: 'APPROVED' as const,
    title: 'Approved',
    description: 'A human accepted the recommendation and named an owner.',
  },
  {
    status: 'IN_PROGRESS' as const,
    title: 'In progress',
    description: 'Work is underway outside ReachOps.',
  },
  {
    status: 'MONITORING' as const,
    title: 'Monitoring',
    description: 'Deliberately waiting for more evidence before acting.',
  },
  {
    status: 'COMPLETED' as const,
    title: 'Completed',
    description: 'Closed with an outcome note and no causal claim.',
  },
];

function ActionCard({ action }: { action: DemoAction }) {
  return (
    <article className={`action-card ${action.current ? 'action-card--current' : ''}`}>
      <div className="action-card__top">
        <span className="action-id">{action.id}</span>
        {action.current && <span className="current-chip">This week</span>}
      </div>
      <h3>{action.title}</h3>
      <dl className="action-facts">
        <div>
          <dt>Owner</dt>
          <dd>{action.owner}</dd>
        </div>
        <div>
          <dt>Decided</dt>
          <dd>{formatCalendarDate(action.decidedOn)}</dd>
        </div>
        {action.dueOn && (
          <div>
            <dt>{action.status === 'MONITORING' ? 'Review on' : 'Due'}</dt>
            <dd>{formatCalendarDate(action.dueOn)}</dd>
          </div>
        )}
      </dl>
      <p className="action-trigger">
        <span>Triggered by</span>
        {action.evidenceIds.length > 0 ? (
          <EvidenceChips ids={action.evidenceIds} label={`Evidence for ${action.id}`} />
        ) : (
          <em>{action.trigger}</em>
        )}
      </p>
      <p className="action-note">{action.note}</p>
      {action.observationId && (
        <Link className="action-link" href="/weekly-review">
          View the observation that produced this →
        </Link>
      )}
    </article>
  );
}

export function ActionsView({ actions }: { actions: DemoAction[] }) {
  const currentCount = actions.filter(({ current }) => current).length;
  const ownerCount = new Set(actions.map(({ owner }) => owner)).size;

  return (
    <div className="actions-workspace">
      <PageHeading
        description="Every item here began as an approved recommendation with a named owner and a review date. ReachOps tracks follow-through; it never performs the work."
        eyebrow="Human-owned follow-through"
        title="Actions"
        aside={
          <aside className="week-panel" aria-label="Action summary">
            <span>Assigned this week</span>
            <strong>{currentCount}</strong>
            <small>
              {actions.length} total · {ownerCount} owners
            </small>
          </aside>
        }
      />

      <ProvenanceNote>
        Rendered from the committed deterministic snapshot. Action records are synthetic and belong
        to the fictional Summit &amp; Sage workspace.
      </ProvenanceNote>

      <div className="action-board">
        {COLUMNS.map((column) => {
          const columnActions = actions.filter(({ status }) => status === column.status);
          return (
            <section
              aria-labelledby={`column-${column.status}`}
              className="action-column"
              key={column.status}
            >
              <div className="action-column__head">
                <h2 id={`column-${column.status}`}>{column.title}</h2>
                <span className="count-chip">{columnActions.length}</span>
              </div>
              <p className="action-column__hint">{column.description}</p>
              <div className="action-column__body">
                {columnActions.length === 0 ? (
                  <p className="column-empty">Nothing in this state.</p>
                ) : (
                  columnActions.map((action) => <ActionCard action={action} key={action.id} />)
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
