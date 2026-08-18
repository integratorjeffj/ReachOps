import axe from 'axe-core';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { render } from '@/test-harness';
import { CompetitorsView } from './competitors-view';
import { demoCompetitors } from '@/lib/demo/competitors';

describe('CompetitorsView', () => {
  it('says the companies are invented before showing anything about them', () => {
    render(<CompetitorsView />);

    const disclosure = screen.getByRole('region', { name: 'These companies do not exist' });
    const table = screen.getByRole('region', { name: 'What each business publishes' });

    expect(
      within(disclosure).getByText(/No data was gathered about any real business/i),
    ).toBeVisible();
    expect(disclosure.compareDocumentPosition(table)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('names what no source can provide about a competitor', () => {
    render(<CompetitorsView />);
    const unavailable = screen.getByRole('region', {
      name: 'What no source can tell you about a competitor',
    });

    expect(within(unavailable).getByText(/sessions, visitors or page views/i)).toBeVisible();
    expect(within(unavailable).getByText(/revenue or average job value/i)).toBeVisible();
    expect(within(unavailable).getByText(/advertising spend/i)).toBeVisible();
  });

  it('states each signal in words rather than by a mark alone', () => {
    render(<CompetitorsView />);
    const table = screen.getByRole('table', { name: /Publicly visible signals/i });

    // Four businesses across seven signals, each carrying a readable Yes or No.
    expect(within(table).getAllByText('Yes').length + within(table).getAllByText('No').length).toBe(
      demoCompetitors.signals.length * (demoCompetitors.competitors.length + 1) * 2,
    );
  });

  it('shows the pricing gap with how many rivals publish it', () => {
    render(<CompetitorsView />);
    const table = screen.getByRole('table', { name: /Publicly visible signals/i });
    const pricing = within(table).getByRole('row', { name: /Publishes price ranges/i });

    expect(within(pricing).getByText('2 of 3')).toBeVisible();
  });

  it('refuses to award an overall placing', () => {
    render(<CompetitorsView />);
    expect(screen.getByText(/do not add up to a placing/i)).toBeVisible();

    const table = screen.getByRole('table', { name: /Publicly visible signals/i });
    expect(within(table).queryByText(/winner|1st|#1|leader/i)).not.toBeInTheDocument();
  });

  it('keeps modelled estimates out of the observed table', () => {
    render(<CompetitorsView />);
    const table = screen.getByRole('table', { name: /Publicly visible signals/i });

    // A range in the observation table would read as something someone confirmed by looking.
    expect(within(table).queryByText(/–\s*\d/)).not.toBeInTheDocument();
    expect(within(table).queryByText(/estimated/i)).not.toBeInTheDocument();
  });

  it('shows an estimate only as a range with its method beside it', async () => {
    const user = userEvent.setup();
    render(<CompetitorsView />);

    await user.click(screen.getByRole('button', { name: /Mile High Mechanical/ }));
    const drawer = await screen.findByRole('dialog');

    expect(within(drawer).getByText('1,800–3,900 clicks')).toBeVisible();
    expect(within(drawer).getByText(/A model of a sample, not a measurement/i)).toBeVisible();
    expect(within(drawer).getByText('Estimated, not observed')).toBeVisible();
  });

  it('carries the AI mention count with its denominator', async () => {
    const user = userEvent.setup();
    render(<CompetitorsView />);

    await user.click(screen.getByRole('button', { name: /Mile High Mechanical/ }));
    const drawer = await screen.findByRole('dialog');

    expect(within(drawer).getByText(/9 of 21 checks/)).toBeVisible();
    expect(within(drawer).getByText(/answers differently each time/i)).toBeVisible();
  });

  it('shows a sampled query where no tracked competitor appeared', () => {
    render(<CompetitorsView />);
    const overlaps = screen.getByRole('region', { name: 'Where we appeared together' });

    expect(
      within(overlaps).getByText('No tracked competitor in the sampled results'),
    ).toBeVisible();
    expect(within(overlaps).getByText(/not a ranking report/i)).toBeVisible();
  });

  it('accounts for a company named in answers but not tracked as a peer', () => {
    render(<CompetitorsView />);
    const untracked = screen.getByRole('region', { name: 'Companies named but not tracked' });

    expect(within(untracked).getByText('Budget Rooter Denver')).toBeVisible();
    expect(within(untracked).getByText(/without appearing to be short/i)).toBeVisible();
  });

  it('reports no dated content rather than guessing a date', async () => {
    const user = userEvent.setup();
    render(<CompetitorsView />);

    await user.click(screen.getByRole('button', { name: /Cherry Creek Heating/ }));
    const drawer = await screen.findByRole('dialog');

    expect(within(drawer).getByText('No dated content found')).toBeVisible();
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(<CompetitorsView />);
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toEqual([]);
  });
});
