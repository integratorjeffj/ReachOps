import axe from 'axe-core';
import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@/test-harness';
import { ReportsView } from './reports-view';
import { demoSnapshot } from '@/lib/demo/snapshot';

describe('ReportsView', () => {
  it('labels every claim with the kind of statement it is', () => {
    render(<ReportsView />);

    for (const label of ['Observed', 'Interpreted', 'Decided', 'Outcome']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });

  it('separates gains from losses by metric semantics, not raw sign', () => {
    render(<ReportsView />);

    const gains = screen.getByRole('region', { name: 'Strongest gains' });
    const losses = screen.getByRole('region', { name: 'Strongest losses' });

    // Average position falls when it improves, so it must never be filed as a loss.
    expect(within(losses).queryByText(/GSC average position/i)).not.toBeInTheDocument();
    expect(within(gains).getAllByRole('listitem').length).toBeGreaterThan(0);
    expect(within(losses).getAllByRole('listitem').length).toBeGreaterThan(0);
  });

  it('reports goal progress and admits where none is measurable', () => {
    render(<ReportsView />);

    const goals = screen.getByRole('region', { name: 'Goal progress' });
    const unmeasured = demoSnapshot.overview.goals.filter(({ status }) => status === 'UNAVAILABLE');

    expect(within(goals).getAllByText('Not yet measured')).toHaveLength(unmeasured.length);
    expect(within(goals).getByText('102%')).toBeInTheDocument();
  });

  it('states the causal boundary in the summary and the appendix', () => {
    render(<ReportsView />);

    expect(screen.getByText(/does not conclude it caused the decline/i)).toBeVisible();
    expect(screen.getByText(/does not attribute a later change to earlier work/i)).toBeVisible();
  });

  it('carries every outcome through with its caveat', () => {
    render(<ReportsView />);

    const outcomes = screen.getByRole('region', { name: /what earlier work did afterwards/i });
    for (const outcome of demoSnapshot.outcomes) {
      expect(within(outcomes).getByText(outcome.assessment)).toBeInTheDocument();
    }
    expect(within(outcomes).getByText(/not evidence the work caused it/i)).toBeVisible();
  });

  it('reports the data state of every connected source', () => {
    render(<ReportsView />);

    const sources = screen.getByRole('region', { name: 'Source health' });
    for (const connection of demoSnapshot.connections) {
      expect(within(sources).getByText(connection.displayName)).toBeInTheDocument();
      expect(within(sources).getByText(connection.dataStateNote)).toBeInTheDocument();
    }

    // Every source carries history once Meta was seeded, so the shortfall warning must not appear.
    expect(demoSnapshot.connections.every(({ dataState }) => dataState === 'ACTIVE')).toBe(true);
    expect(within(sources).queryByText(/carries no performance history/i)).not.toBeInTheDocument();
  });

  it('offers no period selector it could not honour', () => {
    render(<ReportsView />);

    expect(screen.getByText(/this period is fixed/i)).toBeVisible();
    expect(screen.queryByLabelText(/reporting period/i)).not.toBeInTheDocument();
  });

  it('prints through the browser rather than a fake export', async () => {
    const print = vi.fn();
    vi.stubGlobal('print', print);

    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(<ReportsView />);

    await user.click(screen.getByRole('button', { name: /print or save as PDF/i }));
    expect(print).toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(<ReportsView />);
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toEqual([]);
  });
});
