import axe from 'axe-core';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { render } from '@/test-harness';
import { SocialWorkspaceView } from './social-workspace-view';
import { demoSocial } from '@/lib/demo/social';

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(results.violations).toEqual([]);
}

const linkedInPosts = demoSocial.posts.filter(({ platform }) => platform === 'LINKEDIN');

describe('SocialWorkspaceView', () => {
  it('publishes only the pattern the fixtures support, with its sample', () => {
    render(<SocialWorkspaceView />);

    const insights = screen.getByRole('region', { name: /patterns in this account/i });
    expect(insights).toHaveTextContent(/technician-led reels/i);
    expect(insights).toHaveTextContent(/not evidence that the format caused/i);
  });

  it('refuses to blend engagement rates across platforms', () => {
    render(<SocialWorkspaceView />);
    expect(screen.getByText(/a blended figure would not describe anything real/i)).toBeVisible();
  });

  it('shows no reach for LinkedIn, because LinkedIn does not report it', async () => {
    const user = userEvent.setup();
    render(<SocialWorkspaceView />);

    await user.click(screen.getByRole('button', { name: 'LinkedIn' }));
    const table = screen.getByRole('table');

    // One em dash per LinkedIn post in the reach column.
    const dashes = within(table)
      .getAllByTitle('LinkedIn does not report reach')
      .filter((node) => node.textContent?.includes('—'));
    expect(dashes).toHaveLength(linkedInPosts.length);
  });

  it('narrows account totals to the connection that reports them', async () => {
    const user = userEvent.setup();
    render(<SocialWorkspaceView />);

    await user.click(screen.getByRole('button', { name: 'LinkedIn' }));
    expect(screen.getByRole('region', { name: /linkedin account/i })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /meta account/i })).not.toBeInTheDocument();
  });

  it('says plainly that the Meta account covers both its platforms', async () => {
    const user = userEvent.setup();
    render(<SocialWorkspaceView />);

    await user.click(screen.getByRole('button', { name: 'Instagram' }));
    expect(screen.getByText(/covering Instagram and Facebook together/i)).toBeVisible();
  });

  it('filters posts and restores the full list', async () => {
    const user = userEvent.setup();
    render(<SocialWorkspaceView />);

    const all = screen.getAllByRole('row').length;
    const technician = screen.getByRole('button', { name: /technician-led/i });
    await user.click(technician);

    expect(technician).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByRole('row').length).toBeLessThan(all);

    await user.click(technician);
    expect(screen.getAllByRole('row').length).toBe(all);
  });

  it('ranks a post against its own account rather than an industry benchmark', async () => {
    const user = userEvent.setup();
    render(<SocialWorkspaceView />);

    await user.click(screen.getByRole('button', { name: /technician’s two-minute duct check/i }));
    const drawer = await screen.findByRole('dialog');

    expect(within(drawer).getByText(/100th percentile/)).toBeInTheDocument();
    expect(
      within(drawer).getByText(/not a comparison with any other account or an industry benchmark/i),
    ).toBeVisible();
  });

  it('labels each post with the provenance of its source', async () => {
    const user = userEvent.setup();
    render(<SocialWorkspaceView />);

    await user.click(screen.getByRole('button', { name: 'LinkedIn' }));
    await user.click(screen.getByRole('button', { name: /why our technicians stay/i }));
    const drawer = await screen.findByRole('dialog');

    expect(within(drawer).getByText('Imported')).toBeInTheDocument();
    expect(within(drawer).getByText(/reports impressions rather than reach/i)).toBeVisible();
  });

  it('has no automated accessibility violations across platform views', async () => {
    const user = userEvent.setup();
    const { container } = render(<SocialWorkspaceView />);
    await expectNoViolations(container);

    await user.click(screen.getByRole('button', { name: 'Instagram' }));
    await expectNoViolations(container);

    await user.click(screen.getByRole('button', { name: 'LinkedIn' }));
    await expectNoViolations(container);
  });
});
