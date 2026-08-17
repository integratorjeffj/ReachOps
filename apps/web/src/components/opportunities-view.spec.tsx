import axe from 'axe-core';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { render } from '@/test-harness';
import { OpportunitiesView } from './opportunities-view';
import { demoSnapshot } from '@/lib/demo/snapshot';

const opportunities = demoSnapshot.weeklyReview.recommendations;
const proposed = opportunities.find(({ decision }) => decision === 'PENDING')!;

async function open(user: ReturnType<typeof userEvent.setup>, title: string) {
  render(<OpportunitiesView />);
  await user.click(screen.getByRole('button', { name: title }));
  return screen.findByRole('dialog');
}

describe('OpportunitiesView', () => {
  it('lists every opportunity with dimensions rather than a composite score', () => {
    render(<OpportunitiesView />);

    for (const opportunity of opportunities) {
      expect(screen.getByRole('button', { name: opportunity.title })).toBeInTheDocument();
    }
    // Impact, effort and urgency are shown separately; nothing multiplies them together.
    expect(screen.getAllByText(/impact (low|medium|high|critical)/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/opportunity score/i)).not.toBeInTheDocument();
  });

  it('separates observation confidence from confidence in the explanation', async () => {
    const user = userEvent.setup();
    const drawer = await open(user, 'Investigate the AC repair mobile booking flow');

    expect(within(drawer).getByText('Observation confidence')).toBeInTheDocument();
    expect(within(drawer).getByText('Explanation confidence')).toBeInTheDocument();
    expect(within(drawer).getByText(/not evidence of cause/i)).toBeVisible();
  });

  it('says plainly when no explanation is offered', async () => {
    const user = userEvent.setup();
    const drawer = await open(user, proposed.title);

    expect(
      within(drawer).getByText(/the change is measured; its cause is not established/i),
    ).toBeVisible();
  });

  it('exposes the rule and thresholds behind an observation', async () => {
    const user = userEvent.setup();
    const drawer = await open(user, 'Investigate the AC repair mobile booking flow');

    await user.click(within(drawer).getByText(/why this was flagged/i));
    expect(within(drawer).getByText('ac-repair-demand-conversion-divergence')).toBeInTheDocument();
    expect(within(drawer).getByText(/current-sessions/)).toBeInTheDocument();
  });

  it('offers a decision only where a human has not made one', async () => {
    const user = userEvent.setup();
    render(<OpportunitiesView />);

    await user.click(screen.getByRole('button', { name: proposed.title }));
    const undecided = await screen.findByRole('dialog');
    expect(
      within(undecided).getByRole('button', { name: /accept and create work/i }),
    ).toBeVisible();
    await user.keyboard('{Escape}');

    // The AC opportunity was already accepted by a person, so no decision is offered again.
    await user.click(
      screen.getByRole('button', { name: 'Investigate the AC repair mobile booking flow' }),
    );
    const decided = await screen.findByRole('dialog');
    expect(
      within(decided).queryByRole('button', { name: /accept and create work/i }),
    ).not.toBeInTheDocument();
  });

  it('freezes a baseline when work is accepted', async () => {
    const user = userEvent.setup();
    const drawer = await open(user, proposed.title);

    await user.click(within(drawer).getByRole('button', { name: /accept and create work/i }));

    expect(await within(drawer).findByText(/frozen baseline/i)).toBeInTheDocument();
    expect(within(drawer).getByText(/does not move when dashboard filters change/i)).toBeVisible();
  });

  it('lets a person resize effort but not impact or confidence', async () => {
    const user = userEvent.setup();
    const drawer = await open(user, proposed.title);

    const effort = within(drawer).getByLabelText(/effort estimate/i);
    await user.selectOptions(effort, 'L');
    expect(effort).toHaveValue('L');
    expect(
      within(drawer).getByText(/effort is a human estimate, not a measurement/i),
    ).toBeVisible();
  });

  it('regroups by goal and by channel', async () => {
    const user = userEvent.setup();
    render(<OpportunitiesView />);

    await user.click(screen.getByRole('button', { name: 'By goal' }));
    expect(screen.getByRole('region', { name: /qualified demand/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'By channel' }));
    expect(screen.getByRole('region', { name: 'Conversion' })).toBeInTheDocument();
  });

  it('places opportunities on an impact and effort grid', async () => {
    const user = userEvent.setup();
    render(<OpportunitiesView />);

    await user.click(screen.getByRole('button', { name: /impact × effort/i }));
    const matrix = screen.getByRole('table');
    expect(
      within(matrix).getByRole('button', { name: /investigate the AC repair/i }),
    ).toBeInTheDocument();
  });

  it('keeps the deterministic briefing available as a tab', async () => {
    const user = userEvent.setup();
    render(<OpportunitiesView />);

    await user.click(screen.getByRole('tab', { name: 'Briefing' }));
    expect(screen.getByRole('region', { name: 'Rule evaluations' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('has no automated accessibility violations', async () => {
    const user = userEvent.setup();
    const { container } = render(<OpportunitiesView />);
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toEqual([]);

    await user.click(screen.getByRole('button', { name: /impact × effort/i }));
    const matrixResults = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(matrixResults.violations).toEqual([]);
  });
});
