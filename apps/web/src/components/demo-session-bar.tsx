'use client';

import { useDemoSession } from '@/lib/demo/session';

/**
 * Standing disclosure for the published demonstration.
 *
 * Interactions here change nothing outside the visitor's own browser. Saying that plainly, next to
 * the control that undoes them, is what keeps the interactive demo honest.
 */
export function DemoSessionBar() {
  const { dirty, reset, hydrated } = useDemoSession();

  return (
    <div className="demo-session-bar" role="status">
      <span className="demo-session-bar__text">
        <strong>Interactive demo session</strong>
        <span>
          Changes are stored only in this browser for this demo session. Nothing is sent anywhere,
          and no connected provider is ever written to.
        </span>
      </span>
      <button
        className="button button--quiet"
        disabled={!hydrated || !dirty}
        onClick={reset}
        type="button"
      >
        {hydrated && dirty ? 'Reset demo' : 'Baseline state'}
      </button>
    </div>
  );
}
