import axe from 'axe-core';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { render } from '@/test-harness';
import { TechnicalTab } from './technical-tab';
import { demoSearch } from '@/lib/demo/search';

describe('TechnicalTab', () => {
  it('says the crawl is simulated before showing anything it found', () => {
    render(<TechnicalTab />);

    const about = screen.getByRole('region', { name: 'About this crawl' });
    expect(within(about).getByText(/never fetched/i)).toBeVisible();
    expect(within(about).getByText('Simulated')).toBeInTheDocument();
  });

  it('shows each vital against its published threshold', () => {
    render(<TechnicalTab />);

    // 2.5s, 200ms and 0.1 are the real boundaries, shown rather than implied by colour.
    expect(screen.getAllByText('2.5s').length).toBeGreaterThan(0);
    expect(screen.getAllByText('200ms').length).toBeGreaterThan(0);
    expect(screen.getAllByText('0.1').length).toBeGreaterThan(0);
  });

  it('labels ratings in words so state never depends on colour alone', () => {
    render(<TechnicalTab />);

    expect(screen.getAllByText('Good').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Needs improvement').length).toBeGreaterThan(0);
  });

  it('keeps field and lab in separate columns', () => {
    render(<TechnicalTab />);

    const table = screen.getAllByRole('table')[0]!;
    expect(within(table).getByText('Field')).toBeInTheDocument();
    expect(within(table).getByText('Lab')).toBeInTheDocument();
    expect(screen.getByText(/single simulated run/i)).toBeVisible();
  });

  it('refuses to publish a single combined score', () => {
    render(<TechnicalTab />);
    expect(screen.getByText(/does not combine them into a single score/i)).toBeVisible();
  });

  it('switches form factor and reports desktop separately', async () => {
    const user = userEvent.setup();
    render(<TechnicalTab />);

    await user.click(screen.getByRole('button', { name: 'Desktop' }));
    expect(screen.getByRole('button', { name: 'Desktop' })).toHaveAttribute('aria-pressed', 'true');

    // The interaction delay is a mobile problem: desktop AC repair holds its ratings. Desktop is not
    // uniformly clean either — layout shift crossed on the water heater guide — so switching form
    // factor changes which page is worth attention rather than just rescaling the same story.
    const acRepair = screen.getByRole('table', { name: /Core Web Vitals for AC repair/i });
    expect(within(acRepair).queryByText(/Crossed from/i)).not.toBeInTheDocument();

    const waterHeater = screen.getByRole('table', {
      name: /Core Web Vitals for Water heater guide/i,
    });
    expect(within(waterHeater).getByText(/Crossed from/i)).toBeInTheDocument();
  });

  it('announces the mobile interaction crossing with its prior value', () => {
    render(<TechnicalTab />);
    const acRepair = screen.getByRole('table', { name: /Core Web Vitals for AC repair/i });
    expect(within(acRepair).getByText(/Crossed from\s*198ms/i)).toBeInTheDocument();
  });

  it('explains that the field window barely covers the change', () => {
    render(<TechnicalTab />);
    expect(screen.getByText(/last four days of this window/i)).toBeVisible();
  });

  it('filters findings and opens one with its fix guidance', async () => {
    const user = userEvent.setup();
    render(<TechnicalTab />);

    const findings = () => screen.getByRole('table', { name: /Technical findings/i });
    const all = within(findings()).getAllByRole('row').length;
    await user.click(screen.getByRole('button', { name: /high or critical/i }));
    expect(within(findings()).getAllByRole('row').length).toBeLessThan(all);

    await user.click(screen.getByRole('button', { name: /mobile interaction delay/i }));
    const drawer = await screen.findByRole('dialog');
    expect(within(drawer).getByText(/profile the booking form/i)).toBeVisible();
    expect(
      within(drawer).getByText(/does not establish that one produced the other/i),
    ).toBeVisible();
  });

  it('carries every finding from the audit into the table', () => {
    render(<TechnicalTab />);
    const findings = screen.getByRole('table', { name: /Technical findings/i });
    // Header row plus one per finding.
    expect(within(findings).getAllByRole('row').length).toBe(
      demoSearch.technical.issues.length + 1,
    );
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(<TechnicalTab />);
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toEqual([]);
  });
});
