import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { render } from '@/test-harness';
import { ContentWorkspaceView } from './content-workspace-view';
import { OpportunitiesView } from './opportunities-view';
import { SocialWorkspaceView } from './social-workspace-view';

/**
 * The loop that makes ReachOps a product rather than a dashboard: a finding becomes planned work,
 * and that work appears where the calendar can see it.
 *
 * Each workspace renders separately here, exactly as it does in the application, so these also
 * prove the shared session survives leaving one surface and arriving at another.
 */

// The session persists through localStorage, which is what carries work between workspaces. Each
// test starts from the committed baseline so ordering cannot make one pass because of another.
beforeEach(() => window.localStorage.clear());

describe('planning content from an opportunity', () => {
  it('creates a pipeline item and says what it did not do', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<OpportunitiesView />);

    await user.click(
      screen.getByRole('button', { name: 'Find where organic demand stops converting' }),
    );
    const drawer = await screen.findByRole('dialog');
    const plan = within(drawer).getByRole('region', { name: 'Plan content for this' });

    // The suggested change pre-fills the title; a person can rewrite it before committing.
    const title = within(plan).getByLabelText<HTMLInputElement>(/working title/i);
    expect(title.value).toMatch(/booking rate/i);

    await user.click(within(plan).getByRole('button', { name: /add to content pipeline/i }));

    expect(await within(plan).findByText(/planned as PC-S/i)).toBeInTheDocument();
    expect(within(plan).getByText(/nothing has been sent to a provider/i)).toBeVisible();

    unmount();

    // The Content workspace is a separate mount and must still see the work.
    render(<ContentWorkspaceView />);
    expect(screen.getAllByText(/compare booking rate by landing page/i).length).toBeGreaterThan(0);
  });

  it('lets a person retitle the work before planning it', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<OpportunitiesView />);

    await user.click(
      screen.getByRole('button', { name: 'Find where organic demand stops converting' }),
    );
    const drawer = await screen.findByRole('dialog');
    const title = within(drawer).getByLabelText(/working title/i);

    await user.clear(title);
    await user.type(title, 'Denver AC cost guide');
    await user.click(within(drawer).getByRole('button', { name: /add to content pipeline/i }));

    unmount();
    render(<ContentWorkspaceView />);
    expect(screen.getByRole('button', { name: 'Denver AC cost guide' })).toBeInTheDocument();
  });
});

describe('repurposing a social pattern', () => {
  it('offers the pattern only where a post beat its own account history', async () => {
    const user = userEvent.setup();
    render(<SocialWorkspaceView />);

    // A top-quartile Reel earns the offer.
    await user.click(screen.getByRole('button', { name: /technician’s two-minute duct check/i }));
    const strong = await screen.findByRole('dialog');
    expect(within(strong).getByRole('region', { name: 'Reuse this pattern' })).toBeInTheDocument();
    await user.keyboard('{Escape}');

    // A modest early post does not.
    await user.click(screen.getByRole('button', { name: /a Wash Park furnace rescue/i }));
    const modest = await screen.findByRole('dialog');
    expect(
      within(modest).queryByRole('region', { name: 'Reuse this pattern' }),
    ).not.toBeInTheDocument();
  });

  it('copies the structure and says the script is not carried over', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<SocialWorkspaceView />);

    await user.click(screen.getByRole('button', { name: /technician’s two-minute duct check/i }));
    const drawer = await screen.findByRole('dialog');
    const panel = within(drawer).getByRole('region', { name: 'Reuse this pattern' });

    expect(within(panel).getByText(/copies the structure, not the script/i)).toBeVisible();
    await user.click(within(panel).getByRole('button', { name: /plan a post in this shape/i }));
    expect(await within(panel).findByText(/planned as PC-S/i)).toBeInTheDocument();

    unmount();

    render(<ContentWorkspaceView />);
    const created = screen.getByRole('button', {
      name: /electrical safety in older Denver homes/i,
    });
    await user.click(created);
    const contentDrawer = await screen.findByRole('dialog');
    expect(within(contentDrawer).getByText(/rather than its script/i)).toBeVisible();
  });
});
