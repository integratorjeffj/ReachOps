'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { DemoSeoIssue, DemoVitalsRow } from '@reachops/contracts';
import { DataTable, FilterChips, type Column } from './data-table';
import { Drawer } from './drawer';
import { demoSearch } from '@/lib/demo/search';
import { formatCalendarDate, formatTimestamp } from '@/lib/format';

const SEVERITY_RANK: Record<DemoSeoIssue['severity'], number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const STATUS_LABEL: Record<DemoSeoIssue['status'], string> = {
  OPEN: 'Open',
  FIXED_PENDING_VALIDATION: 'Fixed, awaiting validation',
  VALIDATED: 'Validated',
  WONT_FIX: 'Reviewed, no change needed',
};

const RATING_LABEL: Record<string, string> = {
  GOOD: 'Good',
  NEEDS_IMPROVEMENT: 'Needs improvement',
  POOR: 'Poor',
};

const ISSUE_FILTERS = [
  {
    key: 'open',
    label: 'Open',
    match: (issue: DemoSeoIssue) => issue.status === 'OPEN',
  },
  {
    key: 'high',
    label: 'High or critical',
    match: (issue: DemoSeoIssue) => issue.severity === 'HIGH' || issue.severity === 'CRITICAL',
  },
  {
    key: 'performance',
    label: 'Performance',
    match: (issue: DemoSeoIssue) =>
      issue.type === 'CORE_WEB_VITALS' || issue.type === 'MOBILE_PERFORMANCE',
  },
  {
    key: 'crawlability',
    label: 'Crawl and indexing',
    match: (issue: DemoSeoIssue) =>
      [
        'INDEXABILITY',
        'CANONICAL',
        'ROBOTS',
        'SITEMAP',
        'REDIRECT_CHAIN',
        'STATUS_4XX',
        'STATUS_5XX',
      ].includes(issue.type),
  },
];

/**
 * One page's vitals for a given form factor, field beside lab.
 *
 * The two are never averaged. Field is what visitors experienced over four weeks; lab is a single
 * throttled run. Combining them would produce a number describing neither.
 */
function VitalsCard({ rows, label }: { rows: DemoVitalsRow[]; label: string }) {
  const field = rows.find(({ source }) => source === 'FIELD');
  const lab = rows.find(({ source }) => source === 'LAB');
  if (!field) return null;

  return (
    <article className="vitals-card">
      <div className="vitals-card__head">
        <h3>{label}</h3>
        <code className="table-path">{field.pagePath}</code>
      </div>
      <table className="vitals-table">
        <caption className="visually-hidden">Core Web Vitals for {label}</caption>
        <thead>
          <tr>
            <th scope="col">Metric</th>
            <th scope="col">Field</th>
            <th scope="col">Lab</th>
            <th scope="col">Good at or below</th>
          </tr>
        </thead>
        <tbody>
          {field.vitals.map((vital, index) => {
            const labVital = lab?.vitals[index];
            return (
              <tr key={vital.metric}>
                <th scope="row">
                  <strong>{vital.metric}</strong>
                  <small>{vital.label}</small>
                </th>
                <td>
                  <span className={`vital-value vital-value--${vital.rating.toLowerCase()}`}>
                    {vital.value}
                    {vital.unit}
                  </span>
                  <small>{RATING_LABEL[vital.rating]}</small>
                  {vital.priorValue !== null && (
                    <small className={vital.crossedThreshold ? 'vital-crossed' : undefined}>
                      {vital.crossedThreshold ? 'Crossed from ' : 'was '}
                      {vital.priorValue}
                      {vital.unit}
                    </small>
                  )}
                </td>
                <td>
                  {labVital ? (
                    <>
                      <span className={`vital-value vital-value--${labVital.rating.toLowerCase()}`}>
                        {labVital.value}
                        {labVital.unit}
                      </span>
                      <small>{RATING_LABEL[labVital.rating]}</small>
                    </>
                  ) : (
                    <span className="table-muted">—</span>
                  )}
                </td>
                <td className="is-numeric">
                  {vital.goodAtOrBelow}
                  {vital.unit}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </article>
  );
}

function IssueDrawer({ issue, onClose }: { issue: DemoSeoIssue | null; onClose: () => void }) {
  if (!issue) return null;

  return (
    <Drawer eyebrow={`${issue.id} · ${issue.typeLabel}`} onClose={onClose} open title={issue.title}>
      <div className="action-detail">
        <div className="ranked-observations__tags">
          <span className={`severity-pill severity-pill--${issue.severity.toLowerCase()}`}>
            {issue.severity.toLowerCase()}
          </span>
          <span className="meta-chip">{STATUS_LABEL[issue.status]}</span>
          <span className="meta-chip">Detected {formatCalendarDate(issue.detectedOn)}</span>
        </div>

        <section aria-labelledby="issue-detail-title">
          <h3 id="issue-detail-title">What was found</h3>
          <p className="evidence-prose">{issue.detail}</p>
          <dl className="drawer-metrics">
            <div>
              <dt>Affected</dt>
              <dd>
                {issue.affectedPaths.map((path) => (
                  <code className="table-path" key={path}>
                    {path}
                  </code>
                ))}
              </dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="issue-fix-title">
          <h3 id="issue-fix-title">Suggested fix</h3>
          <p className="evidence-prose">{issue.fixGuidance}</p>
          {issue.status === 'WONT_FIX' && (
            <p className="evidence-caveat">
              A person reviewed this and decided no change is warranted. It stays on the record so
              the same finding is not raised again at the next crawl.
            </p>
          )}
        </section>

        {issue.opportunityId && (
          <section aria-labelledby="issue-opportunity-title">
            <h3 id="issue-opportunity-title">Related opportunity</h3>
            <p className="evidence-prose">
              <Link href="/opportunities">{issue.opportunityId}</Link> · {issue.opportunityTitle}
            </p>
            <p className="evidence-caveat">
              A technical finding overlapping a business observation is a reason to look at both
              together. It does not establish that one produced the other.
            </p>
          </section>
        )}
      </div>
    </Drawer>
  );
}

export function TechnicalTab() {
  const { technical } = demoSearch;
  const [formFactor, setFormFactor] = useState<'MOBILE' | 'DESKTOP'>('MOBILE');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const vitalsByPage = useMemo(() => {
    const rows = technical.vitals.filter((row) => row.formFactor === formFactor);
    const keys = [...new Set(rows.map(({ pageKey }) => pageKey))];
    return keys.map((key) => ({
      key,
      label: rows.find((row) => row.pageKey === key)!.pageLabel,
      rows: rows.filter((row) => row.pageKey === key),
    }));
  }, [technical.vitals, formFactor]);

  const issues = useMemo(() => {
    const filter = ISSUE_FILTERS.find(({ key }) => key === activeFilter);
    return filter ? technical.issues.filter(filter.match) : technical.issues;
  }, [technical.issues, activeFilter]);

  const filters = ISSUE_FILTERS.map(({ key, label, match }) => ({
    key,
    label,
    count: technical.issues.filter(match).length,
  }));

  const openIssue = technical.issues.find(({ id }) => id === openId) ?? null;

  const columns: Array<Column<DemoSeoIssue>> = [
    {
      key: 'issue',
      header: 'Finding',
      sortValue: (issue) => issue.title,
      render: (issue) => (
        <button className="table-open" onClick={() => setOpenId(issue.id)} type="button">
          <strong>{issue.title}</strong>
          <small>{issue.typeLabel}</small>
        </button>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      sortValue: (issue) => SEVERITY_RANK[issue.severity],
      render: (issue) => (
        <span className={`severity-pill severity-pill--${issue.severity.toLowerCase()}`}>
          {issue.severity.toLowerCase()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (issue) => issue.status,
      render: (issue) => STATUS_LABEL[issue.status],
    },
    {
      key: 'pages',
      header: 'Pages',
      numeric: true,
      secondary: true,
      sortValue: (issue) => issue.affectedPaths.length,
      render: (issue) => issue.affectedPaths.length,
    },
    {
      key: 'detected',
      header: 'Detected',
      secondary: true,
      sortValue: (issue) => issue.detectedOn,
      render: (issue) => formatCalendarDate(issue.detectedOn),
    },
  ];

  return (
    <div className="tab-panel-body">
      <section aria-labelledby="audit-title" className="coverage-callout">
        <h2 id="audit-title">About this crawl</h2>
        <p>{technical.audit.provenanceNote}</p>
        <dl className="coverage-figures">
          <div>
            <dt>Crawl mode</dt>
            <dd>Simulated</dd>
          </div>
          <div>
            <dt>Pages</dt>
            <dd>{technical.audit.pagesCrawled}</dd>
          </div>
          <div>
            <dt>Checks run</dt>
            <dd>{technical.audit.checksRun}</dd>
          </div>
          <div>
            <dt>Completed</dt>
            <dd>{formatTimestamp(technical.audit.crawledAt)}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="vitals-title" className="vitals-section">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Core Web Vitals</span>
            <h2 id="vitals-title">How the pages actually behave</h2>
          </div>
          <div className="segmented" role="group" aria-label="Form factor">
            {(['MOBILE', 'DESKTOP'] as const).map((option) => (
              <button
                aria-pressed={formFactor === option}
                className={`segmented__button ${formFactor === option ? 'segmented__button--active' : ''}`}
                key={option}
                onClick={() => setFormFactor(option)}
                type="button"
              >
                {option === 'MOBILE' ? 'Mobile' : 'Desktop'}
              </button>
            ))}
          </div>
        </div>

        <div className="vitals-grid">
          {vitalsByPage.map((page) => (
            <VitalsCard key={page.key} label={page.label} rows={page.rows} />
          ))}
        </div>

        <div className="vitals-notes">
          <p className="evidence-caveat">
            <strong>Field</strong> · {technical.fieldWindow.start} to {technical.fieldWindow.end}.{' '}
            {technical.fieldWindow.note}
          </p>
          <p className="evidence-caveat">
            <strong>Lab</strong> · {technical.labNote}
          </p>
          <p className="causal-note">
            These three metrics are reported separately and against their published thresholds.
            ReachOps does not combine them into a single score, because a page can be fast to paint
            and slow to respond, and one number would hide which.
          </p>
        </div>
      </section>

      <section aria-labelledby="issues-title" className="posts-section">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">{technical.issues.length} findings</span>
            <h2 id="issues-title">What the crawl flagged</h2>
          </div>
        </div>
        <FilterChips active={activeFilter} filters={filters} onToggle={setActiveFilter} />
        <DataTable
          caption="Technical findings from the simulated crawl"
          columns={columns}
          initialSortKey="severity"
          rowKey={(issue) => issue.id}
          rows={issues}
        />
      </section>

      <IssueDrawer issue={openIssue} onClose={() => setOpenId(null)} />
    </div>
  );
}
