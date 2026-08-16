import type { ReactNode } from 'react';
import { priorityLabel, sourceModeLabel } from '@/lib/format';

interface PageHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
}

export function PageHeading({ eyebrow, title, description, aside }: PageHeadingProps) {
  return (
    <header className="workspace-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {aside}
    </header>
  );
}

/**
 * States where a page's values came from. Every workspace route carries one so a reader never has
 * to guess whether a number is live, simulated, or replayed from the frozen fixture.
 */
export function ProvenanceNote({ children }: { children: ReactNode }) {
  return (
    <p className="provenance-note">
      <span aria-hidden="true">⌁</span>
      {children}
    </p>
  );
}

export function EvidenceChips({ ids, label }: { ids: string[]; label?: string }) {
  if (ids.length === 0) return null;
  return (
    <ul aria-label={label ?? 'Linked evidence'} className="evidence-chips">
      {ids.map((id) => (
        <li key={id}>{id}</li>
      ))}
    </ul>
  );
}

export function PriorityPill({ priority }: { priority: string }) {
  return (
    <span className={`priority-pill priority-pill--${priority.toLowerCase()}`}>
      {priorityLabel(priority)}
    </span>
  );
}

export function ModePill({ mode }: { mode: string }) {
  return (
    <span className={`mode-pill mode-pill--${mode.toLowerCase()}`}>{sourceModeLabel(mode)}</span>
  );
}

export function StatusPill({ status, label }: { status: string; label: string }) {
  return <span className={`status-pill status-pill--${status.toLowerCase()}`}>{label}</span>;
}
