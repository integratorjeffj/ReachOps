import axe from 'axe-core';
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { render } from '@/test-harness';
import AboutPage from './page';
import { getNavigationForRole } from '@/lib/navigation';

/**
 * The demonstration's front door.
 *
 * The walkthrough is the reason this page exists: the product now holds more than a reviewer will
 * find unaided, and a route that points at a page which has been renamed or removed is worse than
 * no route at all. These assertions keep every step reachable.
 */

describe('AboutPage', () => {
  it('offers a guided route through the product', () => {
    render(<AboutPage />);

    const walkthrough = screen.getByRole('region', { name: 'Start here' });
    const steps = within(walkthrough).getAllByRole('listitem');
    expect(steps.length).toBeGreaterThanOrEqual(8);
  });

  it('points every step at a route that exists', () => {
    render(<AboutPage />);

    const walkthrough = screen.getByRole('region', { name: 'Start here' });
    const known = new Set(getNavigationForRole('MANAGER').map(({ href }) => href));

    for (const link of within(walkthrough).getAllByRole('link')) {
      expect(known).toContain(link.getAttribute('href'));
    }
  });

  it('keeps the story in order rather than as a grid to sample', () => {
    render(<AboutPage />);
    const walkthrough = screen.getByRole('region', { name: 'Start here' });

    const labels = within(walkthrough)
      .getAllByRole('link')
      .map((link) => link.textContent ?? '');

    expect(labels[0]).toContain('Command Center');
    expect(labels.at(-1)).toContain('Briefing');
  });

  it('still carries the disclosures the demonstration depends on', () => {
    render(<AboutPage />);

    expect(screen.getByText(/No live source is connected/i)).toBeVisible();
    expect(screen.getByText('Synthetic by default')).toBeVisible();
    expect(screen.getByText(/cannot reach past it/i)).toBeVisible();
    expect(screen.getByText(/without an explicit human decision/i)).toBeVisible();
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(<AboutPage />);
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toEqual([]);
  });
});
