'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { DemoAction } from '@reachops/contracts';
import { PageHeading, ProvenanceNote } from './demo-primitives';
import { Drawer } from './drawer';
import { EvidenceChipList } from './evidence-drawer';
import { useDemoSession, type DemoActionStatus } from '@/lib/demo/session';
import { demoSnapshot } from '@/lib/demo/snapshot';
import { formatCalendarDate, formatTimestamp } from '@/lib/format';

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
    description: 'Deliberately waiting for more evidence before closing.',
  },
  {
    status: 'COMPLETED' as const,
    title: 'Completed',
    description: 'Closed with an outcome note and no causal claim.',
  },
];

const STATUS_LABEL: Record<DemoActionStatus, string> = {
  APPROVED: 'Approved',
  IN_PROGRESS: 'In progress',
  MONITORING: 'Monitoring',
  COMPLETED: 'Completed',
};

/**
 * Only a person moves work forward. These are the transitions a human may perform; nothing in
 * ReachOps advances an action on its own.
 */
const ALLOWED_TRANSITIONS: Record<DemoActionStatus, DemoActionStatus[]> = {
  APPROVED: ['IN_PROGRESS'],
  IN_PROGRESS: ['MONITORING', 'COMPLETED'],
  MONITORING: ['IN_PROGRESS', 'COMPLETED'],
  COMPLETED: [],
};

const OWNERS = ['Jonah Brooks', 'Devon Patel', 'Maya Chen', 'Elena Ruiz'];

function ActionCard({ action, onOpen }: { action: DemoAction; onOpen: () => void }) {
  return (
    <article className={`action-card ${action.current ? 'action-card--current' : ''}`}>
      <div className="action-card__top">
        <span className="action-id">{action.id}</span>
        {action.current && <span className="current-chip">This week</span>}
      </div>
      <h3>
        <button className="action-open" onClick={onOpen} type="button">
          {action.title}
        </button>
      </h3>
      <dl className="action-facts">
        <div>
          <dt>Owner</dt>
          <dd>{action.owner}</dd>
        </div>
        {action.dueOn && (
          <div>
            <dt>Due</dt>
            <dd>{formatCalendarDate(action.dueOn)}</dd>
          </div>
        )}
        {action.reviewOn && (
          <div>
            <dt>Review</dt>
            <dd>{formatCalendarDate(action.reviewOn)}</dd>
          </div>
        )}
      </dl>
      <EvidenceChipList ids={action.evidenceIds} label={`Evidence for ${action.id}`} />
      <p className="action-note">{action.note}</p>
    </article>
  );
}

function ActionDrawer({ action, onClose }: { action: DemoAction | null; onClose: () => void }) {
  const { setActionStatus, setActionOwner, setActionDates, addNote, notesFor, activity } =
    useDemoSession();
  const [draftNote, setDraftNote] = useState('');

  const opportunity = useMemo(
    () =>
      action
        ? demoSnapshot.weeklyReview.recommendations.find(
            ({ linkedActionId }) => linkedActionId === action.id,
          )
        : undefined,
    [action],
  );

  const history = useMemo(
    () => (action ? activity.filter((event) => event.entityId === action.id) : []),
    [action, activity],
  );

  if (!action) return null;
  const notes = notesFor(action.id);
  const transitions = ALLOWED_TRANSITIONS[action.status];

  return (
    <Drawer
      eyebrow={`${action.id} · ${STATUS_LABEL[action.status]}`}
      onClose={onClose}
      open
      title={action.title}
    >
      <div className="action-detail">
        {opportunity && (
          <section aria-labelledby="action-origin-title">
            <h3 id="action-origin-title">Why this exists</h3>
            <p className="evidence-prose">{opportunity.diagnosis}</p>
            <p className="action-origin-link">
              From <Link href="/opportunities">{opportunity.id}</Link> · {opportunity.title}
            </p>
          </section>
        )}

        <section aria-labelledby="action-evidence-title">
          <h3 id="action-evidence-title">Supporting evidence</h3>
          {action.evidenceIds.length > 0 ? (
            <EvidenceChipList ids={action.evidenceIds} label={`Evidence for ${action.id}`} />
          ) : (
            <p className="evidence-caveat">
              This action predates evidence linkage and records its trigger as prose:{' '}
              {action.trigger}
            </p>
          )}
        </section>

        <section aria-labelledby="action-state-title">
          <h3 id="action-state-title">State</h3>
          <div className="action-controls">
            <label>
              <span>Owner</span>
              <select
                onChange={(event) => setActionOwner(action.id, event.target.value)}
                value={action.owner}
              >
                {(OWNERS.includes(action.owner) ? OWNERS : [action.owner, ...OWNERS]).map(
                  (owner) => (
                    <option key={owner} value={owner}>
                      {owner}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label>
              <span>Due</span>
              <input
                onChange={(event) =>
                  setActionDates(action.id, { dueOn: event.target.value || null })
                }
                type="date"
                value={action.dueOn ?? ''}
              />
            </label>
            <label>
              <span>Review</span>
              <input
                onChange={(event) =>
                  setActionDates(action.id, { reviewOn: event.target.value || null })
                }
                type="date"
                value={action.reviewOn ?? ''}
              />
            </label>
          </div>

          <div className="action-transitions">
            <span className="tag-label">Move this work</span>
            {transitions.length > 0 ? (
              <div className="transition-buttons">
                {transitions.map((next) => (
                  <button
                    className="button button--primary"
                    key={next}
                    onClick={() => setActionStatus(action.id, next)}
                    type="button"
                  >
                    Move to {STATUS_LABEL[next].toLowerCase()}
                  </button>
                ))}
              </div>
            ) : (
              <p className="evidence-caveat">
                This action is complete. Completed work is not reopened in the demonstration.
              </p>
            )}
          </div>
        </section>

        <section aria-labelledby="action-notes-title">
          <h3 id="action-notes-title">Notes</h3>
          <p className="action-note">{action.note}</p>
          {notes.map((note) => (
            <div className="session-note" key={note.id}>
              <p>{note.body}</p>
              <small>
                {note.author} · {formatTimestamp(note.createdAt)}
              </small>
            </div>
          ))}
          <form
            className="note-form"
            onSubmit={(event) => {
              event.preventDefault();
              const body = draftNote.trim();
              if (!body) return;
              addNote(action.id, body);
              setDraftNote('');
            }}
          >
            <label htmlFor={`note-${action.id}`}>Add a note</label>
            <textarea
              id={`note-${action.id}`}
              onChange={(event) => setDraftNote(event.target.value)}
              placeholder="What did you find?"
              rows={3}
              value={draftNote}
            />
            <button className="button button--quiet" disabled={!draftNote.trim()} type="submit">
              Add note
            </button>
          </form>
        </section>

        <section aria-labelledby="action-history-title">
          <h3 id="action-history-title">History</h3>
          {history.length > 0 ? (
            <ol className="action-history">
              {history.map((event) => (
                <li key={event.id}>
                  <strong>{event.summary}</strong>
                  <small>
                    {event.actorName} · {formatTimestamp(event.occurredAt)}
                  </small>
                </li>
              ))}
            </ol>
          ) : (
            <p className="evidence-caveat">No recorded events for this action yet.</p>
          )}
        </section>
      </div>
    </Drawer>
  );
}

export function ActionsView() {
  const { actions } = useDemoSession();
  const [openId, setOpenId] = useState<string | null>(null);

  const currentCount = actions.filter(({ current }) => current).length;
  const ownerCount = new Set(actions.map(({ owner }) => owner)).size;
  const openAction = actions.find(({ id }) => id === openId) ?? null;

  return (
    <div className="actions-workspace">
      <PageHeading
        description="Every item here began as an approved recommendation with a named owner and a review date. ReachOps tracks follow-through; it never performs the work."
        eyebrow="Human-owned follow-through"
        title="Work"
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
        Baseline records come from the committed deterministic snapshot. Changes you make here stay
        in this browser for this demo session.
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
                  columnActions.map((action) => (
                    <ActionCard
                      action={action}
                      key={action.id}
                      onOpen={() => setOpenId(action.id)}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>

      <ActionDrawer action={openAction} onClose={() => setOpenId(null)} />
    </div>
  );
}
