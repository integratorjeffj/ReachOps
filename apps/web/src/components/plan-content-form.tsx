'use client';

import Link from 'next/link';
import { useState } from 'react';

const OWNERS = ['Jonah Brooks', 'Devon Patel', 'Maya Chen', 'Elena Ruiz'];

interface PlanContentFormProps {
  /** Pre-filled title. A person can rewrite it; nothing is generated for them. */
  defaultTitle: string;
  defaultOwner: string;
  defaultDate: string;
  submitLabel: string;
  /** Returns the identifier of the created item so the confirmation can name it. */
  onSubmit: (input: { title: string; plannedDate: string; ownerName: string }) => string;
  /** What the reader should understand this button does, and does not do. */
  note: string;
}

/**
 * Plans a piece of work from another workspace.
 *
 * Deliberately an inline form rather than a nested dialog: these live inside drawers, and stacking
 * a modal on a modal is both an accessibility problem and a hint that the flow is heavier than it
 * is. The whole action is naming something and giving it a date.
 */
export function PlanContentForm({
  defaultTitle,
  defaultOwner,
  defaultDate,
  submitLabel,
  onSubmit,
  note,
}: PlanContentFormProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [owner, setOwner] = useState(defaultOwner);
  const [date, setDate] = useState(defaultDate);
  const [createdId, setCreatedId] = useState<string | null>(null);

  if (createdId) {
    return (
      <div className="plan-confirmation" role="status">
        <strong>Planned as {createdId}</strong>
        <p>
          It is now in the <Link href="/content">Content pipeline</Link> as an early-stage item.
          Nothing has been sent to a provider.
        </p>
      </div>
    );
  }

  return (
    <form
      className="plan-form"
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = title.trim();
        if (!trimmed || !date) return;
        setCreatedId(onSubmit({ title: trimmed, plannedDate: date, ownerName: owner }));
      }}
    >
      <label>
        <span>Working title</span>
        <input onChange={(event) => setTitle(event.target.value)} type="text" value={title} />
      </label>
      <div className="plan-form__row">
        <label>
          <span>Owner</span>
          <select onChange={(event) => setOwner(event.target.value)} value={owner}>
            {OWNERS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Planned date</span>
          <input onChange={(event) => setDate(event.target.value)} type="date" value={date} />
        </label>
      </div>
      <button className="button button--primary" disabled={!title.trim() || !date} type="submit">
        {submitLabel}
      </button>
      <p className="evidence-caveat">{note}</p>
    </form>
  );
}
