import type { DemoEvidenceRecord } from '@reachops/contracts';
import { demoSnapshot } from './snapshot';

/**
 * Lookup for every evidence record the interface can currently open.
 *
 * The core snapshot's records are always present. Larger, route-specific sets — search pages and
 * queries today — register themselves when their module loads, which keeps one drawer serving every
 * surface without every surface paying for every record.
 */
const records = new Map<string, DemoEvidenceRecord>(
  demoSnapshot.evidence.map((record) => [record.evidenceId, record]),
);

export function registerEvidence(additional: readonly DemoEvidenceRecord[]): void {
  for (const record of additional) records.set(record.evidenceId, record);
}

export function findEvidence(evidenceId: string): DemoEvidenceRecord | undefined {
  return records.get(evidenceId);
}
