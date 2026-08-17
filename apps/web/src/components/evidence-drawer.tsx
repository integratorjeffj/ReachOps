'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { DemoEvidenceRecord } from '@reachops/contracts';
import { Drawer } from './drawer';
import { demoSnapshot } from '@/lib/demo/snapshot';
import { findEvidence } from '@/lib/demo/evidence-registry';
import { formatMetricValue, formatNumber, formatRange, formatTimestamp } from '@/lib/format';

const annotationByKey = new Map(
  demoSnapshot.overview.annotations.map((annotation) => [annotation.stableKey, annotation]),
);

const QUALITY_LABEL: Record<string, string> = {
  COMPLETE: 'Complete',
  PARTIAL: 'Partial coverage',
  STALE: 'Stale',
  INVALID: 'Invalid',
};

const MODE_LABEL: Record<string, string> = {
  LIVE: 'Live',
  SIMULATED: 'Simulated',
  IMPORTED: 'Imported',
};

interface EvidenceContextValue {
  open: (evidenceId: string) => void;
}

const EvidenceContext = createContext<EvidenceContextValue | null>(null);

export function useEvidence(): EvidenceContextValue {
  const value = useContext(EvidenceContext);
  if (!value) throw new Error('useEvidence must be used inside EvidenceProvider.');
  return value;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="evidence-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function EvidenceBody({ record }: { record: DemoEvidenceRecord }) {
  const annotations = record.relatedAnnotationKeys
    .map((key) => annotationByKey.get(key))
    .filter((annotation): annotation is NonNullable<typeof annotation> => Boolean(annotation));

  return (
    <div className="evidence-detail">
      <div className="evidence-headline">
        <span className="eyebrow">{record.metricDisplayName}</span>
        <strong>{formatMetricValue(record.value, record.unit)}</strong>
        {record.priorValue !== null && record.displayChange && (
          <span className="evidence-change">
            {record.displayChange} vs {formatMetricValue(record.priorValue, record.unit)} prior
          </span>
        )}
      </div>

      <section aria-labelledby="evidence-source-title">
        <h3 id="evidence-source-title">Where this came from</h3>
        <dl>
          <Row label="Source">{record.connectionDisplayName}</Row>
          <Row label="Source mode">
            <span className={`mode-pill mode-pill--${record.sourceMode.toLowerCase()}`}>
              {MODE_LABEL[record.sourceMode]}
            </span>
          </Row>
          <Row label="Resource">{record.resourceNativeId}</Row>
          <Row label="Reporting period">
            {formatRange(record.periodStart, record.periodEnd)} · {record.grain.toLowerCase()}
          </Row>
          <Row label="Timezone">{record.timezone}</Row>
          <Row label="Dimensions">
            {Object.entries(record.dimensions)
              .map(([key, value]) => `${key}: ${value}`)
              .join(' · ')}
          </Row>
        </dl>
      </section>

      <section aria-labelledby="evidence-definition-title">
        <h3 id="evidence-definition-title">What it measures</h3>
        <p className="evidence-prose">{record.metricDescription}</p>
        <dl>
          <Row label="Metric key">
            <code>{record.metricStableKey}</code>
          </Row>
          <Row label="Unit">{record.unit}</Row>
          <Row label="Family">{record.family}</Row>
          <Row label="Aggregation">{record.aggregationBehavior}</Row>
          <Row label="Direction">
            {record.lowerIsBetter ? 'Lower is better' : 'Higher is better'}
          </Row>
        </dl>
        <p className="evidence-caveat">{record.comparabilityNotes}</p>
      </section>

      <section aria-labelledby="evidence-quality-title">
        <h3 id="evidence-quality-title">Quality and lineage</h3>
        <dl>
          <Row label="Data quality">{QUALITY_LABEL[record.qualityStatus]}</Row>
          <Row label="Quality flags">
            {record.qualityFlags.length > 0 ? record.qualityFlags.join(', ') : 'None'}
          </Row>
          {record.coverageNote && <Row label="Coverage note">{record.coverageNote}</Row>}
          <Row label="Retrieved">{formatTimestamp(record.retrievedAt)}</Row>
          <Row label="Sync run">
            <code>{record.syncRunId}</code>
          </Row>
          <Row label="Evidence ID">
            <code>{record.evidenceId}</code>
          </Row>
          {record.priorEvidenceId && (
            <Row label="Compared against">
              <code>{record.priorEvidenceId}</code>
            </Row>
          )}
        </dl>
      </section>

      {annotations.length > 0 && (
        <section aria-labelledby="evidence-context-title">
          <h3 id="evidence-context-title">Business context in this window</h3>
          <ul className="evidence-annotations">
            {annotations.map((annotation) => (
              <li key={annotation.stableKey}>
                <strong>{annotation.title}</strong>
                <small>{annotation.description}</small>
              </li>
            ))}
          </ul>
          <p className="evidence-caveat">
            Context is recorded so a reader can weigh it. ReachOps does not treat an overlapping
            event as a cause.
          </p>
        </section>
      )}
    </div>
  );
}

export function EvidenceProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const open = useCallback((evidenceId: string) => setActiveId(evidenceId), []);
  const close = useCallback(() => setActiveId(null), []);
  const value = useMemo(() => ({ open }), [open]);

  const record = activeId ? findEvidence(activeId) : undefined;

  return (
    <EvidenceContext.Provider value={value}>
      {children}
      <Drawer
        eyebrow="Evidence"
        onClose={close}
        open={Boolean(record)}
        title={record ? record.chipLabel : 'Evidence'}
      >
        {record ? (
          <EvidenceBody record={record} />
        ) : (
          <p>This evidence record is not present in the committed snapshot.</p>
        )}
      </Drawer>
    </EvidenceContext.Provider>
  );
}

/**
 * Renders evidence as readable chips. The identifier remains available inside the drawer for
 * anyone who wants to audit it, but it is no longer the first thing a business reader meets.
 */
export function EvidenceChipList({ ids, label }: { ids: string[]; label?: string }) {
  const { open } = useEvidence();
  if (ids.length === 0) return null;

  return (
    <ul aria-label={label ?? 'Supporting evidence'} className="evidence-chips">
      {ids.map((id) => {
        const record = findEvidence(id);
        return (
          <li key={id}>
            <button className="evidence-chip" onClick={() => open(id)} type="button">
              <span>{record ? record.chipLabel : id}</span>
              {record && (
                <small>
                  {formatMetricValue(record.value, record.unit)}
                  {record.displayChange ? ` · ${record.displayChange}` : ''}
                </small>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Compact summary used where a full chip list would crowd the surface. */
export function EvidenceSummaryChip({ ids }: { ids: string[] }) {
  const { open } = useEvidence();
  if (ids.length === 0) return null;
  const first = ids[0]!;
  return (
    <button
      className="evidence-chip evidence-chip--summary"
      onClick={() => open(first)}
      type="button"
    >
      {formatNumber(ids.length)} evidence {ids.length === 1 ? 'record' : 'records'}
    </button>
  );
}
