'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { DemoRecommendation, OpportunityStatus } from '@reachops/contracts';
import { PageHeading, ProvenanceNote } from './demo-primitives';
import { Drawer } from './drawer';
import { EvidenceChipList } from './evidence-drawer';
import { WeeklyReviewView } from './weekly-review-view';
import { useDemoSession } from '@/lib/demo/session';
import { demoSnapshot } from '@/lib/demo/snapshot';
import { formatMetricValue, formatTimestamp } from '@/lib/format';

const TABS = [
  { key: 'board', label: 'Opportunities' },
  { key: 'briefing', label: 'Briefing' },
] as const;

type TabKey = (typeof TABS)[number]['key'];
type ViewKey = 'list' | 'goal' | 'category' | 'matrix';

const CATEGORY_LABEL: Record<string, string> = {
  SEARCH: 'Search',
  TECHNICAL_SEO: 'Technical SEO',
  CONTENT: 'Content',
  SOCIAL: 'Social',
  LOCAL: 'Local',
  AI_SEARCH: 'AI Search',
  CONVERSION: 'Conversion',
};

const STATUS_LABEL: Record<OpportunityStatus, string> = {
  PROPOSED: 'Proposed',
  ACCEPTED: 'Accepted',
  PLANNED: 'Planned',
  IN_PROGRESS: 'In progress',
  MONITORING: 'Monitoring',
  COMPLETED: 'Completed',
  DISMISSED: 'Dismissed',
};

const URGENCY_LABEL: Record<string, string> = {
  EVERGREEN: 'Evergreen',
  THIS_MONTH: 'This month',
  THIS_WEEK: 'This week',
  IMMEDIATE: 'Immediate',
};

// Ordinal weights used only for ordering. They are never combined into a single displayed score,
// because a reader cannot argue with a number whose derivation is hidden.
const IMPACT_RANK: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
const EFFORT_RANK: Record<string, number> = { XS: 1, S: 2, M: 3, L: 4 };
const CONFIDENCE_RANK: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 };
const URGENCY_RANK: Record<string, number> = {
  EVERGREEN: 1,
  THIS_MONTH: 2,
  THIS_WEEK: 3,
  IMMEDIATE: 4,
};

const EFFORT_OPTIONS: Array<DemoRecommendation['effort']> = ['XS', 'S', 'M', 'L'];

const SORTS = [
  {
    key: 'impact-effort',
    label: 'High impact, low effort',
    compare: (a: DemoRecommendation, b: DemoRecommendation) =>
      IMPACT_RANK[b.impact]! - IMPACT_RANK[a.impact]! ||
      EFFORT_RANK[a.effort]! - EFFORT_RANK[b.effort]!,
  },
  {
    key: 'urgency',
    label: 'Most urgent',
    compare: (a: DemoRecommendation, b: DemoRecommendation) =>
      URGENCY_RANK[b.urgency]! - URGENCY_RANK[a.urgency]!,
  },
  {
    key: 'confidence',
    label: 'Strongest evidence',
    compare: (a: DemoRecommendation, b: DemoRecommendation) =>
      CONFIDENCE_RANK[b.observationConfidence]! - CONFIDENCE_RANK[a.observationConfidence]!,
  },
  {
    key: 'waiting',
    label: 'Waiting for a decision',
    compare: (a: DemoRecommendation, b: DemoRecommendation) =>
      Number(b.status === 'PROPOSED') - Number(a.status === 'PROPOSED'),
  },
];

const goalByKey = new Map(demoSnapshot.overview.goals.map((goal) => [goal.stableKey, goal]));
const observationById = new Map(
  demoSnapshot.weeklyReview.observations.map((observation) => [observation.id, observation]),
);

function MetaChips({ opportunity }: { opportunity: DemoRecommendation }) {
  return (
    <div className="ranked-observations__tags">
      <span className={`status-pill status-pill--${opportunity.status.toLowerCase()}`}>
        {STATUS_LABEL[opportunity.status]}
      </span>
      <span className="meta-chip">{CATEGORY_LABEL[opportunity.category]}</span>
      <span className="meta-chip">Impact {opportunity.impact.toLowerCase()}</span>
      <span className="meta-chip">Effort {opportunity.effort}</span>
      <span className="meta-chip">{URGENCY_LABEL[opportunity.urgency]}</span>
    </div>
  );
}

function OpportunityCard({
  opportunity,
  onOpen,
}: {
  opportunity: DemoRecommendation;
  onOpen: () => void;
}) {
  return (
    <article className="opportunity-card">
      <MetaChips opportunity={opportunity} />
      <h3>
        <button className="action-open" onClick={onOpen} type="button">
          {opportunity.title}
        </button>
      </h3>
      <p>{opportunity.diagnosis}</p>
      <dl className="opportunity-card__facts">
        <div>
          <dt>Affects</dt>
          <dd>{opportunity.affectedEntity}</dd>
        </div>
        <div>
          <dt>Evidence confidence</dt>
          <dd>{opportunity.observationConfidence.toLowerCase()}</dd>
        </div>
      </dl>
      <EvidenceChipList ids={opportunity.evidenceIds} label={`Evidence for ${opportunity.id}`} />
    </article>
  );
}

/**
 * Impact against effort.
 *
 * Two dimensions a reader can argue with, placed on a grid rather than multiplied into a score.
 * Where an opportunity sits is always explainable by pointing at its two axes.
 */
function ImpactEffortMatrix({
  opportunities,
  onOpen,
}: {
  opportunities: DemoRecommendation[];
  onOpen: (opportunity: DemoRecommendation) => void;
}) {
  const impacts = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  return (
    <div className="matrix-scroll">
      <table className="matrix">
        <caption className="visually-hidden">Opportunities by impact and effort</caption>
        <thead>
          <tr>
            <th scope="col">Impact \ Effort</th>
            {EFFORT_OPTIONS.map((effort) => (
              <th key={effort} scope="col">
                {effort}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {impacts.map((impact) => (
            <tr key={impact}>
              <th scope="row">{impact.charAt(0) + impact.slice(1).toLowerCase()}</th>
              {EFFORT_OPTIONS.map((effort) => {
                const cell = opportunities.filter(
                  (item) => item.impact === impact && item.effort === effort,
                );
                return (
                  <td key={effort}>
                    {cell.map((item) => (
                      <button
                        className="matrix-chip"
                        key={item.id}
                        onClick={() => onOpen(item)}
                        type="button"
                      >
                        {item.title}
                      </button>
                    ))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OpportunityDrawer({
  opportunity,
  onClose,
}: {
  opportunity: DemoRecommendation | null;
  onClose: () => void;
}) {
  const {
    actions,
    activity,
    notesFor,
    baselineFor,
    setOpportunityStatus,
    setOpportunityEffort,
    createActionFromOpportunity,
    addNote,
  } = useDemoSession();
  const [draftNote, setDraftNote] = useState('');

  const observation = opportunity ? observationById.get(opportunity.observationId) : undefined;
  const goal = opportunity?.goalStableKey ? goalByKey.get(opportunity.goalStableKey) : undefined;
  const linkedAction = actions.find(
    (action) =>
      action.id === opportunity?.linkedActionId ||
      (opportunity && action.observationId === opportunity.observationId),
  );
  const baseline = opportunity ? baselineFor(opportunity.id) : undefined;
  const history = useMemo(
    () => (opportunity ? activity.filter((event) => event.entityId === opportunity.id) : []),
    [opportunity, activity],
  );

  if (!opportunity) return null;
  const notes = notesFor(opportunity.id);
  const decided = opportunity.status !== 'PROPOSED';

  return (
    <Drawer
      eyebrow={`${opportunity.id} · ${CATEGORY_LABEL[opportunity.category]}`}
      onClose={onClose}
      open
      title={opportunity.title}
    >
      <div className="action-detail opportunity-detail">
        <MetaChips opportunity={opportunity} />

        <section aria-labelledby="opp-what-title">
          <h3 id="opp-what-title">What was observed</h3>
          <p className="evidence-prose">{opportunity.diagnosis}</p>
          <EvidenceChipList
            ids={opportunity.evidenceIds}
            label={`Evidence for ${opportunity.id}`}
          />
          {observation && (
            <details className="rule-detail">
              <summary>Why this was flagged</summary>
              <p>
                Rule <code>{observation.ruleKey}</code> version {observation.ruleVersion}. Every
                condition below had to hold before the observation was emitted.
              </p>
              <ul>
                {observation.severityFactors.map((factor) => (
                  <li key={factor.key}>
                    <strong>{factor.key}</strong>
                    <span>
                      {factor.observed} {factor.operator.toLowerCase()} {factor.threshold} ·{' '}
                      {factor.passed ? 'met' : 'not met'}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>

        <section aria-labelledby="opp-confidence-title">
          <h3 id="opp-confidence-title">How much to trust it</h3>
          <dl className="drawer-metrics">
            <div>
              <dt>Observation confidence</dt>
              <dd>{opportunity.observationConfidence.toLowerCase()}</dd>
            </div>
            {opportunity.causalConfidence && (
              <div>
                <dt>Explanation confidence</dt>
                <dd>{opportunity.causalConfidence.toLowerCase()}</dd>
              </div>
            )}
          </dl>
          {opportunity.causalHypothesis ? (
            <p className="evidence-caveat">{opportunity.causalHypothesis}</p>
          ) : (
            <p className="evidence-caveat">
              No explanation is offered. The change is measured; its cause is not established.
            </p>
          )}
        </section>

        <section aria-labelledby="opp-do-title">
          <h3 id="opp-do-title">What to do</h3>
          <p className="evidence-prose">{opportunity.suggestedChange}</p>
          <dl className="drawer-metrics">
            <div>
              <dt>Expected outcome</dt>
              <dd>{opportunity.expectedOutcome}</dd>
            </div>
            {goal && (
              <div>
                <dt>Goal</dt>
                <dd>
                  {goal.title}
                  {goal.attainmentPercentage !== null &&
                    ` · ${goal.attainmentPercentage.toFixed(0)}% attained`}
                </dd>
              </div>
            )}
            {opportunity.campaignStableKey && (
              <div>
                <dt>Campaign</dt>
                <dd>{opportunity.campaignStableKey}</dd>
              </div>
            )}
          </dl>
        </section>

        <section aria-labelledby="opp-effort-title">
          <h3 id="opp-effort-title">Sizing</h3>
          <label className="effort-control">
            <span>Effort estimate</span>
            <select
              onChange={(event) =>
                setOpportunityEffort(
                  opportunity.id,
                  event.target.value as DemoRecommendation['effort'],
                )
              }
              value={opportunity.effort}
            >
              {EFFORT_OPTIONS.map((effort) => (
                <option key={effort} value={effort}>
                  {effort}
                </option>
              ))}
            </select>
          </label>
          <p className="evidence-caveat">
            Effort is a human estimate, not a measurement. Impact and confidence come from the
            evidence; this does not.
          </p>
        </section>

        <section aria-labelledby="opp-decision-title">
          <h3 id="opp-decision-title">Decision</h3>
          {linkedAction ? (
            <p className="evidence-prose">
              Accepted and assigned as <Link href="/actions">{linkedAction.id}</Link> to{' '}
              {linkedAction.owner}.
            </p>
          ) : decided ? (
            <p className="evidence-prose">
              A person set this to {STATUS_LABEL[opportunity.status].toLowerCase()} in this demo
              session.
            </p>
          ) : (
            <p className="evidence-prose">
              This opportunity is waiting for a human decision. ReachOps will not act on it by
              itself.
            </p>
          )}

          {!decided && (
            <div className="transition-buttons">
              <button
                className="button button--primary"
                onClick={() =>
                  createActionFromOpportunity(opportunity.id, {
                    title: opportunity.suggestedChange,
                    owner: 'Jonah Brooks',
                    dueOn: '2026-08-10',
                    reviewOn: '2026-08-17',
                  })
                }
                type="button"
              >
                Accept and create work
              </button>
              <button
                className="button button--quiet"
                onClick={() => setOpportunityStatus(opportunity.id, 'MONITORING')}
                type="button"
              >
                Monitor instead
              </button>
              <button
                className="button button--quiet"
                onClick={() => setOpportunityStatus(opportunity.id, 'DISMISSED')}
                type="button"
              >
                Dismiss
              </button>
            </div>
          )}
        </section>

        {baseline && (
          <section aria-labelledby="opp-baseline-title">
            <h3 id="opp-baseline-title">Frozen baseline</h3>
            <dl className="drawer-metrics">
              {baseline.entries.map((entry) => (
                <div key={entry.evidenceId}>
                  <dt>{entry.label}</dt>
                  <dd>{formatMetricValue(entry.value, entry.unit)}</dd>
                </div>
              ))}
            </dl>
            <p className="evidence-caveat">
              Captured {formatTimestamp(baseline.capturedAt)} when this work was accepted. It does
              not move when dashboard filters change, so any later comparison is against what was
              actually true beforehand.
            </p>
          </section>
        )}

        <section aria-labelledby="opp-notes-title">
          <h3 id="opp-notes-title">Notes</h3>
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
              addNote(opportunity.id, body);
              setDraftNote('');
            }}
          >
            <label htmlFor={`opp-note-${opportunity.id}`}>Add a note</label>
            <textarea
              id={`opp-note-${opportunity.id}`}
              onChange={(event) => setDraftNote(event.target.value)}
              rows={3}
              value={draftNote}
            />
            <button className="button button--quiet" disabled={!draftNote.trim()} type="submit">
              Add note
            </button>
          </form>
        </section>

        {history.length > 0 && (
          <section aria-labelledby="opp-history-title">
            <h3 id="opp-history-title">History</h3>
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
          </section>
        )}
      </div>
    </Drawer>
  );
}

function Board() {
  const { opportunities } = useDemoSession();
  const [view, setView] = useState<ViewKey>('list');
  const [sortKey, setSortKey] = useState(SORTS[0]!.key);
  const [category, setCategory] = useState<string>('ALL');
  const [status, setStatus] = useState<string>('ALL');
  // Held by id, not by object. Session edits rebuild the list, and a captured object would leave
  // the open drawer showing the values as they were before the edit.
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const sort = SORTS.find(({ key }) => key === sortKey)!;
    return opportunities
      .filter((item) => category === 'ALL' || item.category === category)
      .filter((item) => status === 'ALL' || item.status === status)
      .slice()
      .sort(sort.compare);
  }, [opportunities, sortKey, category, status]);

  const categories = [...new Set(opportunities.map((item) => item.category))];
  const statuses = [...new Set(opportunities.map((item) => item.status))];
  const awaiting = opportunities.filter((item) => item.status === 'PROPOSED').length;
  const openOpportunity = opportunities.find((item) => item.id === openId) ?? null;

  const groups = useMemo(() => {
    if (view === 'goal') {
      const keys = [...new Set(filtered.map((item) => item.goalStableKey ?? 'None'))];
      return keys.map((key) => ({
        key,
        label: key === 'None' ? 'No linked goal' : (goalByKey.get(key)?.title ?? key),
        items: filtered.filter((item) => (item.goalStableKey ?? 'None') === key),
      }));
    }
    if (view === 'category') {
      const keys = [...new Set(filtered.map((item) => item.category))];
      return keys.map((key) => ({
        key,
        label: CATEGORY_LABEL[key] ?? key,
        items: filtered.filter((item) => item.category === key),
      }));
    }
    return [{ key: 'all', label: '', items: filtered }];
  }, [filtered, view]);

  return (
    <div className="tab-panel-body">
      <div className="opportunity-summary">
        <span>
          <strong>{opportunities.length}</strong> open opportunities
        </span>
        <span>
          <strong>{awaiting}</strong> awaiting a decision
        </span>
      </div>

      <div className="opportunity-controls">
        <div className="segmented" role="group" aria-label="Grouping">
          {(
            [
              { key: 'list', label: 'List' },
              { key: 'goal', label: 'By goal' },
              { key: 'category', label: 'By channel' },
              { key: 'matrix', label: 'Impact × effort' },
            ] as Array<{ key: ViewKey; label: string }>
          ).map((option) => (
            <button
              aria-pressed={view === option.key}
              className={`segmented__button ${view === option.key ? 'segmented__button--active' : ''}`}
              key={option.key}
              onClick={() => setView(option.key)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="opportunity-selects">
          <label>
            <span>Sort</span>
            <select onChange={(event) => setSortKey(event.target.value)} value={sortKey}>
              {SORTS.map((sort) => (
                <option key={sort.key} value={sort.key}>
                  {sort.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Channel</span>
            <select onChange={(event) => setCategory(event.target.value)} value={category}>
              <option value="ALL">All channels</option>
              {categories.map((key) => (
                <option key={key} value={key}>
                  {CATEGORY_LABEL[key] ?? key}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Status</span>
            <select onChange={(event) => setStatus(event.target.value)} value={status}>
              <option value="ALL">Any status</option>
              {statuses.map((key) => (
                <option key={key} value={key}>
                  {STATUS_LABEL[key]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="table-empty">No opportunities match the current filters.</p>
      ) : view === 'matrix' ? (
        <ImpactEffortMatrix onOpen={(item) => setOpenId(item.id)} opportunities={filtered} />
      ) : (
        groups.map((group) => (
          <section
            aria-labelledby={`group-${group.key}`}
            className="opportunity-group"
            key={group.key}
          >
            {/* A heading always exists so the card h3s are never orphaned under the page h1. */}
            <h2
              className={
                group.label
                  ? 'opportunity-group__title'
                  : 'opportunity-group__title visually-hidden'
              }
              id={`group-${group.key}`}
            >
              {group.label || 'All opportunities'}
            </h2>
            <div className="opportunity-list">
              {group.items.map((item) => (
                <OpportunityCard
                  key={item.id}
                  onOpen={() => setOpenId(item.id)}
                  opportunity={item}
                />
              ))}
            </div>
          </section>
        ))
      )}

      <OpportunityDrawer onClose={() => setOpenId(null)} opportunity={openOpportunity} />
    </div>
  );
}

export function OpportunitiesView() {
  const [tab, setTab] = useState<TabKey>('board');

  return (
    <div className="opportunities-workspace">
      <PageHeading
        description="Evidence-backed findings, what they are worth, and whether a person has decided to act on them."
        eyebrow="Prioritised work"
        title="Opportunities"
      />

      <ProvenanceNote>
        Every opportunity originates from a deterministic rule over committed evidence. ReachOps
        proposes; a person decides.
      </ProvenanceNote>

      <div className="tab-strip" role="tablist" aria-label="Opportunities sections">
        {TABS.map(({ key, label }) => (
          <button
            aria-controls={`opp-panel-${key}`}
            aria-selected={tab === key}
            className={`tab-button ${tab === key ? 'tab-button--active' : ''}`}
            id={`opp-tab-${key}`}
            key={key}
            onClick={() => setTab(key)}
            role="tab"
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      <div aria-labelledby={`opp-tab-${tab}`} id={`opp-panel-${tab}`} role="tabpanel" tabIndex={0}>
        {tab === 'board' ? (
          <Board />
        ) : (
          <WeeklyReviewView review={demoSnapshot.weeklyReview} embedded />
        )}
      </div>
    </div>
  );
}
