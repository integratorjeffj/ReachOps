'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { DemoPlannedContent } from '@reachops/contracts';
import { PageHeading, ProvenanceNote } from './demo-primitives';
import { Drawer } from './drawer';
import { useDemoSession } from '@/lib/demo/session';
import { demoContent } from '@/lib/demo/content';
import { formatCalendarDate } from '@/lib/format';

type ViewKey = 'pipeline' | 'calendar';

const STATUS_LABEL: Record<DemoPlannedContent['status'], string> = {
  IDEA: 'Idea',
  BRIEF: 'Brief',
  DRAFT: 'Draft',
  REVIEW: 'Review',
  APPROVED: 'Approved',
  PLANNED: 'Planned',
  PUBLISHED: 'Published',
};

const CHANNEL_LABEL: Record<DemoPlannedContent['channel'], string> = {
  WEBSITE: 'Website',
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  LINKEDIN: 'LinkedIn',
  GBP: 'Business Profile',
};

const TYPE_LABEL: Record<DemoPlannedContent['type'], string> = {
  ARTICLE: 'Article',
  SERVICE_PAGE_UPDATE: 'Service page update',
  SEO_REFRESH: 'SEO refresh',
  SOCIAL_POST: 'Social post',
  GBP_POST: 'Business Profile post',
  CAMPAIGN_ASSET: 'Campaign asset',
};

const PIPELINE = demoContent.pipeline.map(({ status }) => status);

/**
 * Publishing is the one transition ReachOps cannot make.
 *
 * Everything up to PLANNED is editorial state a person owns here. Going live happens in the CMS or
 * the provider, so the board offers no control that would claim otherwise.
 */
const ADVANCEABLE: Array<DemoPlannedContent['status']> = PIPELINE.filter(
  (status) => status !== 'PUBLISHED',
);

function nextStatus(status: DemoPlannedContent['status']): DemoPlannedContent['status'] | null {
  const index = ADVANCEABLE.indexOf(status);
  if (index === -1 || index === ADVANCEABLE.length - 1) return null;
  return ADVANCEABLE[index + 1]!;
}

function addDays(date: string, days: number): string {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

function monthGrid(month: string): string[] {
  const first = new Date(`${month}-01T00:00:00.000Z`);
  const start = addDays(first.toISOString().slice(0, 10), -((first.getUTCDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

function useMergedContent(): DemoPlannedContent[] {
  const { contentOverrides, createdContent } = useDemoSession();

  return useMemo(
    () =>
      [...demoContent.items, ...createdContent].map((item) => {
        const override = contentOverrides[item.id];
        if (!override) return item;
        const merged = { ...item, ...override };
        // Overdue is derived, so moving work on has to recompute it rather than carry it forward.
        return {
          ...merged,
          overdue:
            merged.status !== 'PUBLISHED' &&
            merged.dueDate !== null &&
            merged.dueDate < demoContent.referenceDate,
        };
      }),
    [contentOverrides, createdContent],
  );
}

function Counters({ items }: { items: DemoPlannedContent[] }) {
  const weekEnd = addDays(demoContent.referenceDate, 6);
  const counters = [
    {
      label: 'Due this week',
      value: items.filter(
        (item) =>
          item.status !== 'PUBLISHED' &&
          item.dueDate !== null &&
          item.dueDate >= demoContent.referenceDate &&
          item.dueDate <= weekEnd,
      ).length,
    },
    {
      label: 'Awaiting approval',
      value: items.filter((item) => item.status === 'REVIEW').length,
    },
    { label: 'Overdue', value: items.filter((item) => item.overdue).length },
    {
      label: 'Planned ahead',
      value: items.filter((item) => item.status === 'PLANNED' || item.status === 'APPROVED').length,
    },
  ];

  return (
    <div className="opportunity-summary">
      {counters.map(({ label, value }) => (
        <span key={label}>
          <strong>{value}</strong>
          {label}
        </span>
      ))}
    </div>
  );
}

function CoverageGaps() {
  if (demoContent.coverageGaps.length === 0) return null;

  return (
    <section aria-labelledby="coverage-gap-title" className="coverage-callout">
      <h2 id="coverage-gap-title">Coverage gaps</h2>
      {demoContent.coverageGaps.map((gap) => (
        <div className="social-insight" key={gap.campaignStableKey}>
          <strong>
            {gap.campaignName}: nothing planned {formatCalendarDate(gap.gapStart)} to{' '}
            {formatCalendarDate(gap.gapEnd)}
          </strong>
          <p>{gap.note}</p>
        </div>
      ))}
    </section>
  );
}

function ContentCard({
  item,
  onOpen,
  draggable = false,
}: {
  item: DemoPlannedContent;
  onOpen: () => void;
  draggable?: boolean;
}) {
  return (
    <article
      className={`content-card ${item.overdue ? 'content-card--overdue' : ''}`}
      draggable={draggable}
      onDragStart={(event) => event.dataTransfer.setData('text/plain', item.id)}
    >
      <div className="content-card__top">
        <span className="meta-chip">{CHANNEL_LABEL[item.channel]}</span>
        {item.overdue && <span className="status-pill status-pill--proposed">Overdue</span>}
      </div>
      <h3>
        <button className="action-open" onClick={onOpen} type="button">
          {item.title}
        </button>
      </h3>
      <small>
        {item.ownerName}
        {item.plannedDate ? ` · ${formatCalendarDate(item.plannedDate)}` : ' · No date yet'}
      </small>
    </article>
  );
}

function PipelineBoard({
  items,
  onOpen,
}: {
  items: DemoPlannedContent[];
  onOpen: (item: DemoPlannedContent) => void;
}) {
  return (
    <div className="pipeline-board">
      {PIPELINE.map((status) => {
        const column = items.filter((item) => item.status === status);
        return (
          <section aria-labelledby={`pipeline-${status}`} className="pipeline-column" key={status}>
            <div className="action-column__head">
              <h2 id={`pipeline-${status}`}>{STATUS_LABEL[status]}</h2>
              <span className="count-chip">{column.length}</span>
            </div>
            <div className="pipeline-column__body">
              {column.length === 0 ? (
                <p className="column-empty">Nothing here.</p>
              ) : (
                column.map((item) => (
                  <ContentCard item={item} key={item.id} onOpen={() => onOpen(item)} />
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function CalendarMonth({
  items,
  onOpen,
}: {
  items: DemoPlannedContent[];
  onOpen: (item: DemoPlannedContent) => void;
}) {
  const { setContentPlannedDate } = useDemoSession();
  const [month, setMonth] = useState('2026-08');
  const [dragOver, setDragOver] = useState<string | null>(null);

  const days = monthGrid(month);
  const gap = demoContent.coverageGaps[0];

  const byDate = useMemo(() => {
    const map = new Map<string, DemoPlannedContent[]>();
    for (const item of items) {
      if (!item.plannedDate) continue;
      map.set(item.plannedDate, [...(map.get(item.plannedDate) ?? []), item]);
    }
    return map;
  }, [items]);

  const unscheduled = items.filter((item) => !item.plannedDate);

  return (
    <div className="calendar">
      <div className="calendar__controls">
        <label>
          <span>Month</span>
          <select onChange={(event) => setMonth(event.target.value)} value={month}>
            <option value="2026-07">July 2026</option>
            <option value="2026-08">August 2026</option>
            <option value="2026-09">September 2026</option>
          </select>
        </label>
        <p className="evidence-caveat">
          Drag an item to another day, or open it and change its planned date. Both do the same
          thing; neither tells a provider anything.
        </p>
      </div>

      {/*
        A month is genuinely tabular: seven weekday columns by six week rows. A real table gives
        screen readers row and column context for free, which role="grid" on flat divs does not.
      */}
      <table className="calendar__grid">
        <caption className="visually-hidden">Content calendar for {month}</caption>
        <thead>
          <tr>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <th className="calendar__weekday" key={day} scope="col">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }, (_, week) => (
            <tr key={week}>
              {days.slice(week * 7, week * 7 + 7).map((day) => {
                const inMonth = day.startsWith(month);
                const inGap = gap && day >= gap.gapStart && day <= gap.gapEnd;
                const dayItems = byDate.get(day) ?? [];
                return (
                  <td
                    className={[
                      'calendar__day',
                      inMonth ? '' : 'calendar__day--muted',
                      inGap ? 'calendar__day--gap' : '',
                      dragOver === day ? 'calendar__day--over' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    key={day}
                    onDragLeave={() => setDragOver(null)}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragOver(day);
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      setDragOver(null);
                      const id = event.dataTransfer.getData('text/plain');
                      if (id) setContentPlannedDate(id, day);
                    }}
                  >
                    <span className="calendar__date">{Number(day.slice(8))}</span>
                    {inGap && dayItems.length === 0 && (
                      <span className="visually-hidden">No content planned</span>
                    )}
                    {dayItems.map((item) => (
                      <button
                        className="calendar__item"
                        draggable
                        key={item.id}
                        onClick={() => onOpen(item)}
                        onDragStart={(event) => event.dataTransfer.setData('text/plain', item.id)}
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

      {unscheduled.length > 0 && (
        <section aria-labelledby="unscheduled-title" className="calendar__unscheduled">
          <h2 id="unscheduled-title">Not yet dated</h2>
          <div className="pipeline-column__body">
            {unscheduled.map((item) => (
              <ContentCard draggable item={item} key={item.id} onOpen={() => onOpen(item)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ContentDrawer({
  item,
  onClose,
  items,
}: {
  item: DemoPlannedContent | null;
  onClose: () => void;
  items: DemoPlannedContent[];
}) {
  const { setContentStatus, setContentPlannedDate } = useDemoSession();
  if (!item) return null;

  const parent = item.repurposedFromId
    ? items.find(({ id }) => id === item.repurposedFromId)
    : undefined;
  const children = items.filter(({ repurposedFromId }) => repurposedFromId === item.id);
  const advance = nextStatus(item.status);

  return (
    <Drawer
      eyebrow={`${item.id} · ${TYPE_LABEL[item.type]}`}
      onClose={onClose}
      open
      title={item.title}
    >
      <div className="action-detail">
        <div className="ranked-observations__tags">
          <span className="status-pill status-pill--planned">{STATUS_LABEL[item.status]}</span>
          <span className="meta-chip">{CHANNEL_LABEL[item.channel]}</span>
          <span className="meta-chip">{item.contentPillar}</span>
          {item.overdue && <span className="status-pill status-pill--proposed">Overdue</span>}
        </div>

        <section aria-labelledby="content-why-title">
          <h3 id="content-why-title">Why this exists</h3>
          <p className="evidence-prose">{item.description}</p>
          <dl className="drawer-metrics">
            <div>
              <dt>Objective</dt>
              <dd>{item.objective}</dd>
            </div>
            <div>
              <dt>Audience</dt>
              <dd>{item.audience}</dd>
            </div>
            <div>
              <dt>Funnel stage</dt>
              <dd>{item.funnelStage.toLowerCase()}</dd>
            </div>
            <div>
              <dt>Primary topic</dt>
              <dd>{item.primaryTopic}</dd>
            </div>
          </dl>
          {item.opportunityId && (
            <p className="action-origin-link">
              From <Link href="/opportunities">{item.opportunityId}</Link> · {item.opportunityTitle}
            </p>
          )}
        </section>

        <section aria-labelledby="content-plan-title">
          <h3 id="content-plan-title">Plan</h3>
          <div className="action-controls">
            <label>
              <span>Planned date</span>
              <input
                onChange={(event) => setContentPlannedDate(item.id, event.target.value || null)}
                type="date"
                value={item.plannedDate ?? ''}
              />
            </label>
          </div>
          <dl className="drawer-metrics">
            <div>
              <dt>Owner</dt>
              <dd>{item.ownerName}</dd>
            </div>
            <div>
              <dt>Approver</dt>
              <dd>{item.approverName ?? 'Not assigned'}</dd>
            </div>
            <div>
              <dt>Due</dt>
              <dd>{item.dueDate ? formatCalendarDate(item.dueDate) : 'No due date'}</dd>
            </div>
            {item.destinationPagePath && (
              <div>
                <dt>Destination</dt>
                <dd>
                  <code className="table-path">{item.destinationPagePath}</code>
                </dd>
              </div>
            )}
            <div>
              <dt>Call to action</dt>
              <dd>{item.callToAction}</dd>
            </div>
          </dl>

          {advance ? (
            <div className="transition-buttons">
              <button
                className="button button--primary"
                onClick={() => setContentStatus(item.id, advance)}
                type="button"
              >
                Move to {STATUS_LABEL[advance].toLowerCase()}
              </button>
            </div>
          ) : item.status === 'PUBLISHED' ? (
            <p className="evidence-caveat">
              Published on {formatCalendarDate(item.publishedDate!)}. Performance for this work
              lives with the page or post it became.
            </p>
          ) : (
            <p className="evidence-caveat">{demoContent.publishingNote}</p>
          )}
        </section>

        {(parent || children.length > 0) && (
          <section aria-labelledby="content-set-title">
            <h3 id="content-set-title">Repurposing set</h3>
            {parent && (
              <p className="evidence-prose">
                Repurposed from <strong>{parent.title}</strong>.
              </p>
            )}
            {children.length > 0 && (
              <ul className="drawer-query-list">
                {children.map((child) => (
                  <li key={child.id}>
                    <strong>{child.title}</strong>
                    <span>
                      {CHANNEL_LABEL[child.channel]} · {STATUS_LABEL[child.status]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="evidence-caveat">
              A set carries one piece of research across channels. Each item is still drafted and
              published by a person in the provider.
            </p>
          </section>
        )}

        {item.publishedRef && (
          <section aria-labelledby="content-published-title">
            <h3 id="content-published-title">What it became</h3>
            <p className="evidence-prose">
              Published as <code>{item.publishedRef}</code>, which the{' '}
              {item.channel === 'WEBSITE' ? (
                <Link href="/search">Search workspace</Link>
              ) : (
                <Link href="/social">Social workspace</Link>
              )}{' '}
              reports on.
            </p>
          </section>
        )}
      </div>
    </Drawer>
  );
}

export function ContentWorkspaceView() {
  const items = useMergedContent();
  const [view, setView] = useState<ViewKey>('pipeline');
  const [campaign, setCampaign] = useState('ALL');
  const [openId, setOpenId] = useState<string | null>(null);

  const campaigns = [
    ...new Set(items.map((item) => item.campaignStableKey).filter(Boolean)),
  ] as string[];

  const filtered = useMemo(
    () =>
      campaign === 'ALL' ? items : items.filter((item) => item.campaignStableKey === campaign),
    [items, campaign],
  );

  const openItem = items.find((item) => item.id === openId) ?? null;

  return (
    <div className="content-workspace">
      <PageHeading
        description="What is being created, why, who owns it, and when it goes live."
        eyebrow="Editorial pipeline"
        title="Content"
      />

      <ProvenanceNote>{demoContent.publishingNote}</ProvenanceNote>

      <Counters items={items} />
      <CoverageGaps />

      <div className="opportunity-controls">
        <div className="segmented" role="group" aria-label="View">
          {(
            [
              { key: 'pipeline', label: 'Pipeline' },
              { key: 'calendar', label: 'Calendar' },
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
            <span>Campaign</span>
            <select onChange={(event) => setCampaign(event.target.value)} value={campaign}>
              <option value="ALL">All campaigns</option>
              {campaigns.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {view === 'pipeline' ? (
        <PipelineBoard items={filtered} onOpen={(item) => setOpenId(item.id)} />
      ) : (
        <CalendarMonth items={filtered} onOpen={(item) => setOpenId(item.id)} />
      )}

      <ContentDrawer item={openItem} items={items} onClose={() => setOpenId(null)} />
    </div>
  );
}
