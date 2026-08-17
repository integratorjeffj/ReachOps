import axe from 'axe-core';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { render } from '@/test-harness';
import { SearchWorkspaceView } from './search-workspace-view';
import { demoSearch } from '@/lib/demo/search';

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(results.violations).toEqual([]);
}

async function openTab(user: ReturnType<typeof userEvent.setup>, name: RegExp) {
  await user.click(screen.getByRole('tab', { name }));
}

describe('SearchWorkspaceView', () => {
  it('states why row totals fall short of the property total', () => {
    render(<SearchWorkspaceView />);

    const callout = screen.getByRole('region', { name: /why rows do not add up/i });
    expect(callout).toHaveTextContent(/anonymised/i);
    expect(callout).toHaveTextContent(
      new RegExp(String(demoSearch.coverage.pageClickCoveragePercent)),
    );
  });

  it('labels the derived non-branded figure as a floor rather than a total', () => {
    render(<SearchWorkspaceView />);
    expect(screen.getByText(/floor rather than a total/i)).toBeInTheDocument();
  });

  it('lists every page and opens a detail drawer with a SERP preview', async () => {
    const user = userEvent.setup();
    render(<SearchWorkspaceView />);
    await openTab(user, /pages/i);

    // Scope to the table body: several column headers are also buttons, and page labels like
    // "Book" would otherwise collide with the "Bookings" sort control.
    const table = screen.getByRole('table');
    for (const page of demoSearch.pages) {
      expect(within(table).getByText(page.path)).toBeInTheDocument();
    }

    await user.click(within(table).getByText('/air-conditioning/repair'));
    const drawer = await screen.findByRole('dialog');
    expect(within(drawer).getByText(demoSearch.pages[0]!.title)).toBeInTheDocument();
    expect(within(drawer).getByText(/google rewrites titles/i)).toBeInTheDocument();
  });

  it('sorts a table column and keeps the header state accessible', async () => {
    const user = userEvent.setup();
    render(<SearchWorkspaceView />);
    await openTab(user, /pages/i);

    const header = screen.getByRole('button', { name: /organic clicks/i });
    // Defaults to descending on clicks; clicking the active column flips direction.
    expect(header.closest('th')).toHaveAttribute('aria-sort', 'descending');
    await user.click(header);
    expect(header.closest('th')).toHaveAttribute('aria-sort', 'ascending');
  });

  it('filters queries to high-exposure low-capture rows and back', async () => {
    const user = userEvent.setup();
    render(<SearchWorkspaceView />);
    await openTab(user, /queries/i);

    const all = screen.getAllByRole('row').length;
    const weak = screen.getByRole('button', { name: /high impressions, weak CTR/i });
    await user.click(weak);

    expect(weak).toHaveAttribute('aria-pressed', 'true');
    const filtered = screen.getAllByRole('row').length;
    expect(filtered).toBeLessThan(all);
    expect(screen.getByRole('button', { name: /ac repair vs replace/i })).toBeInTheDocument();

    await user.click(weak);
    expect(screen.getAllByRole('row').length).toBe(all);
  });

  it('explains a weak click-through pattern without asserting its cause', async () => {
    const user = userEvent.setup();
    render(<SearchWorkspaceView />);
    await openTab(user, /queries/i);

    await user.click(screen.getByRole('button', { name: /ac repair vs replace/i }));
    const drawer = await screen.findByRole('dialog');
    expect(within(drawer).getByText(/neither is established by the numbers alone/i)).toBeVisible();
  });

  it('keeps local interactions separate rather than one ambiguous total', async () => {
    const user = userEvent.setup();
    render(<SearchWorkspaceView />);
    await openTab(user, /local/i);

    for (const label of [/profile views/i, /website clicks/i, /call clicks/i]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText(/never drafts or sends a review response/i)).toBeInTheDocument();
  });

  it('has no automated accessibility violations across its tabs', async () => {
    const user = userEvent.setup();
    const { container } = render(<SearchWorkspaceView />);
    await expectNoViolations(container);

    await openTab(user, /pages/i);
    await expectNoViolations(container);

    await openTab(user, /queries/i);
    await expectNoViolations(container);
  });
});
