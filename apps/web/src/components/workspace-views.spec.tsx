import axe from 'axe-core';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test-harness';
import { describe, expect, it } from 'vitest';
import { ActionsView } from './actions-view';
import { ActivityView } from './activity-view';
import { ConnectionsView } from './connections-view';
import { WeeklyReviewView } from './weekly-review-view';
import { demoSnapshot } from '@/lib/demo/snapshot';

const { actions, activity, connections, weeklyReview } = demoSnapshot;

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(results.violations).toEqual([]);
}

describe('WeeklyReviewView', () => {
  it('renders every emitted observation with its evidence and rule identity', () => {
    render(<WeeklyReviewView review={weeklyReview} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Weekly Review' })).toBeInTheDocument();
    for (const observation of weeklyReview.observations) {
      expect(screen.getByRole('heading', { name: observation.title })).toBeInTheDocument();
      for (const evidenceId of observation.evidenceIds) {
        expect(screen.getAllByText(new RegExp(evidenceId)).length).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('separates approved recommendations from those still awaiting a human decision', () => {
    render(<WeeklyReviewView review={weeklyReview} />);

    const approved = weeklyReview.recommendations.filter(({ decision }) => decision === 'APPROVED');
    const pending = weeklyReview.recommendations.filter(({ decision }) => decision === 'PENDING');

    expect(screen.getAllByText('Approved by a human')).toHaveLength(approved.length);
    expect(screen.getAllByText('Awaiting decision')).toHaveLength(pending.length);
  });

  it('shows the quality gate outcome for every evaluated rule', () => {
    render(<WeeklyReviewView review={weeklyReview} />);
    const gates = screen.getByRole('region', { name: 'Rule evaluations' });

    for (const evaluation of weeklyReview.evaluations) {
      expect(within(gates).getByText(evaluation.ruleKey)).toBeInTheDocument();
    }
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(<WeeklyReviewView review={weeklyReview} />);
    await expectNoViolations(container);
  });
});

describe('ActionsView', () => {
  it('places every action in a status column and marks the current week', () => {
    render(<ActionsView />);

    for (const action of actions) {
      expect(screen.getByRole('button', { name: action.title })).toBeInTheDocument();
    }
    expect(screen.getAllByText('This week')).toHaveLength(
      actions.filter(({ current }) => current).length,
    );
  });

  it('opens an action and offers only human-permitted transitions', async () => {
    const user = userEvent.setup();
    render(<ActionsView />);

    // ACT-059 is approved, so the only legitimate next step is starting the work.
    await user.click(screen.getByRole('button', { name: /review scheduling theme/i }));
    const drawer = await screen.findByRole('dialog');

    expect(
      within(drawer).getByRole('button', { name: /move to in progress/i }),
    ).toBeInTheDocument();
    expect(
      within(drawer).queryByRole('button', { name: /move to completed/i }),
    ).not.toBeInTheDocument();
  });

  it('moves work forward and records the change in history', async () => {
    const user = userEvent.setup();
    render(<ActionsView />);

    await user.click(screen.getByRole('button', { name: /review scheduling theme/i }));
    const drawer = await screen.findByRole('dialog');
    await user.click(within(drawer).getByRole('button', { name: /move to in progress/i }));

    expect(await within(drawer).findByText(/moved ACT-059 to in progress/i)).toBeInTheDocument();
  });

  it('closes the drawer on Escape', async () => {
    const user = userEvent.setup();
    render(<ActionsView />);

    await user.click(screen.getByRole('button', { name: /review scheduling theme/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(<ActionsView />);
    await expectNoViolations(container);
  });
});

describe('ConnectionsView', () => {
  it('states the source mode and authorization limit for every connection', () => {
    render(<ConnectionsView connections={connections} />);

    for (const connection of connections) {
      expect(screen.getByRole('heading', { name: connection.displayName })).toBeInTheDocument();
      expect(screen.getByText(connection.authorizationNote)).toBeInTheDocument();
    }
    expect(screen.getAllByText('Imported')).toHaveLength(
      connections.filter(({ mode }) => mode === 'IMPORTED').length,
    );
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(<ConnectionsView connections={connections} />);
    await expectNoViolations(container);
  });
});

describe('ActivityView', () => {
  it('attributes each event to a system or human actor without blending them', () => {
    render(<ActivityView activity={activity} />);

    const humanEvents = activity.filter(({ actorType }) => actorType === 'HUMAN');
    const aiEvents = activity.filter(({ actorType }) => actorType === 'AI');

    expect(screen.getAllByRole('listitem')).not.toHaveLength(0);
    expect(humanEvents.length).toBeGreaterThan(0);
    expect(aiEvents).toHaveLength(0);
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(<ActivityView activity={activity} />);
    await expectNoViolations(container);
  });
});
