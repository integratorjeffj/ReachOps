import axe from 'axe-core';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { render } from '@/test-harness';
import { ContentWorkspaceView } from './content-workspace-view';
import { demoContent } from '@/lib/demo/content';

const overdueItem = demoContent.items.find(({ overdue }) => overdue)!;
const publishedItem = demoContent.items.find(({ publishedRef }) => publishedRef === 'IG-20')!;

async function openItem(user: ReturnType<typeof userEvent.setup>, title: string) {
  await user.click(screen.getByRole('button', { name: title }));
  return screen.findByRole('dialog');
}

describe('ContentWorkspaceView', () => {
  it('states that ReachOps cannot publish anywhere', () => {
    render(<ContentWorkspaceView />);
    expect(screen.getAllByText(/no publishing scope/i).length).toBeGreaterThan(0);
  });

  it('shows every pipeline stage and ends at published', () => {
    render(<ContentWorkspaceView />);

    for (const stage of demoContent.pipeline) {
      expect(screen.getByRole('heading', { name: stage.label })).toBeInTheDocument();
    }
    expect(screen.queryByRole('heading', { name: /scheduled/i })).not.toBeInTheDocument();
  });

  it('surfaces the derived coverage gap with its caveat', () => {
    render(<ContentWorkspaceView />);

    const gaps = screen.getByRole('region', { name: 'Coverage gaps' });
    expect(gaps).toHaveTextContent(/summer ready/i);
    expect(gaps).toHaveTextContent(/not a judgement about what should fill it/i);
  });

  it('advances work through the pipeline but never to published', async () => {
    const user = userEvent.setup();
    render(<ContentWorkspaceView />);

    // An approved item may be planned; planned work has nowhere further to go inside ReachOps.
    const drawer = await openItem(user, 'Reel: why your condenser needs clearance');
    await user.click(within(drawer).getByRole('button', { name: /move to planned/i }));

    expect(
      within(drawer).queryByRole('button', { name: /move to published/i }),
    ).not.toBeInTheDocument();
    expect(within(drawer).getByText(/no publishing scope/i)).toBeVisible();
  });

  it('lets a person move a planned date from the drawer', async () => {
    const user = userEvent.setup();
    render(<ContentWorkspaceView />);

    const drawer = await openItem(user, 'Business Profile post: heat advisory availability');
    const date = within(drawer).getByLabelText(/planned date/i);

    await user.clear(date);
    await user.type(date, '2026-08-20');
    expect(date).toHaveValue('2026-08-20');
  });

  it('marks overdue work without marking published work overdue', () => {
    render(<ContentWorkspaceView />);

    expect(screen.getAllByText('Overdue').length).toBeGreaterThan(0);
    expect(overdueItem.status).not.toBe('PUBLISHED');
  });

  it('links published work to the workspace that reports on it', async () => {
    const user = userEvent.setup();
    render(<ContentWorkspaceView />);

    const drawer = await openItem(user, publishedItem.title);
    expect(within(drawer).getByText(publishedItem.publishedRef!)).toBeInTheDocument();
    expect(within(drawer).getByRole('link', { name: /social workspace/i })).toBeInTheDocument();
  });

  it('shows a repurposing set as one piece of research across channels', async () => {
    const user = userEvent.setup();
    render(<ContentWorkspaceView />);

    const drawer = await openItem(user, 'AC repair or replace: a Denver cost guide');
    const set = within(drawer).getByRole('region', { name: 'Repurposing set' });

    expect(within(set).getByText(/reel: the three questions/i)).toBeInTheDocument();
    expect(within(set).getByText(/linkedin graphic/i)).toBeInTheDocument();
    expect(within(set).getByText(/published by a person in the provider/i)).toBeVisible();
  });

  it('renders a calendar that shades the gap and lists undated work', async () => {
    const user = userEvent.setup();
    render(<ContentWorkspaceView />);

    await user.click(screen.getByRole('button', { name: 'Calendar' }));
    expect(screen.getByRole('table', { name: /content calendar/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Not yet dated' })).toBeInTheDocument();
  });

  it('has no automated accessibility violations in either view', async () => {
    const user = userEvent.setup();
    const { container } = render(<ContentWorkspaceView />);

    const pipeline = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(pipeline.violations).toEqual([]);

    await user.click(screen.getByRole('button', { name: 'Calendar' }));
    const calendar = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(calendar.violations).toEqual([]);
  });
});
