import axe from 'axe-core';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { render } from '@/test-harness';
import { AiAnswersTab } from './ai-answers-tab';
import { demoSearch } from '@/lib/demo/search';

describe('AiAnswersTab', () => {
  it('says the panel is run by hand before showing what it found', () => {
    render(<AiAnswersTab />);

    const about = screen.getByRole('region', { name: 'About this panel' });
    expect(within(about).getByText(/run by hand/i)).toBeVisible();
    expect(within(about).getByText('Simulated')).toBeInTheDocument();
  });

  it('puts what cannot be known above the findings', () => {
    render(<AiAnswersTab />);

    const unavailable = screen.getByRole('region', { name: 'What this cannot tell you' });
    const prompts = screen.getByRole('region', { name: 'Tracked prompts' });

    // The absent metrics are what a reader expects and what a competing product would invent, so
    // they come first in document order.
    expect(unavailable.compareDocumentPosition(prompts)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('names every metric it refuses to publish', () => {
    render(<AiAnswersTab />);
    const unavailable = screen.getByRole('region', { name: 'What this cannot tell you' });

    expect(within(unavailable).getByText(/Share of voice/i)).toBeVisible();
    expect(within(unavailable).getByText(/Ranking position within an answer/i)).toBeVisible();
    expect(within(unavailable).getByText(/Bookings produced by an AI answer/i)).toBeVisible();
  });

  it('shows citation counts as fractions with the denominator visible', () => {
    render(<AiAnswersTab />);

    expect(screen.getByText('Cited in 3 of 6')).toBeVisible();
    // Two prompts sit at 0 of 1, so this asserts presence rather than uniqueness.
    expect(screen.getAllByText('Cited in 0 of 1').length).toBe(2);
    // No percentage anywhere in the prompt list.
    const prompts = screen.getByRole('region', { name: 'Tracked prompts' });
    expect(within(prompts).queryByText(/%/)).not.toBeInTheDocument();
  });

  it('marks prompts resting on too few checks', () => {
    render(<AiAnswersTab />);
    expect(screen.getAllByText('Too few checks to read anything into').length).toBeGreaterThan(0);
  });

  it('does not report every prompt as cited', () => {
    render(<AiAnswersTab />);
    const never = demoSearch.ai.totals.neverCitedPromptCount;
    expect(never).toBeGreaterThan(0);
    expect(screen.getByText(`${never} of ${demoSearch.ai.totals.promptCount}`)).toBeVisible();
  });

  it('filters to the prompt whose latest check differs', async () => {
    const user = userEvent.setup();
    render(<AiAnswersTab />);

    // Scoped to the filter group: the same words also appear as a badge on the matching prompt.
    const quickFilters = screen.getByRole('group', { name: 'Quick filters' });
    await user.click(
      within(quickFilters).getByRole('button', { name: /differs from last check/i }),
    );
    const prompts = screen.getByRole('region', { name: 'Tracked prompts' });
    expect(within(prompts).getAllByRole('listitem')).toHaveLength(1);
    expect(within(prompts).getByText(/How much does AC repair cost/i)).toBeVisible();
  });

  it('opens a prompt and separates being named from being linked', async () => {
    const user = userEvent.setup();
    render(<AiAnswersTab />);

    await user.click(screen.getByRole('button', { name: /Who should I call for emergency AC/i }));
    const drawer = await screen.findByRole('dialog');

    expect(within(drawer).getByText('Named, not linked')).toBeVisible();
    expect(within(drawer).getAllByText('Cited').length).toBeGreaterThan(0);
  });

  it('calls a citation order an assembly order rather than a rank', async () => {
    const user = userEvent.setup();
    render(<AiAnswersTab />);

    await user.click(screen.getByRole('button', { name: /How much does AC repair cost/i }));
    const drawer = await screen.findByRole('dialog');

    expect(within(drawer).getAllByText('assembly order, not a ranking').length).toBeGreaterThan(0);
  });

  it('treats a single flip as variance rather than a change in standing', async () => {
    const user = userEvent.setup();
    render(<AiAnswersTab />);

    await user.click(screen.getByRole('button', { name: /How much does AC repair cost/i }));
    const drawer = await screen.findByRole('dialog');

    expect(within(drawer).getByText(/within the ordinary variation/i)).toBeVisible();
    expect(
      within(drawer).getByText(/not evidence that anything about the site changed/i),
    ).toBeVisible();
  });

  it('states that the referral figure is a floor', () => {
    render(<AiAnswersTab />);

    const referrals = screen.getByRole('region', { name: 'Sessions arriving from assistants' });
    expect(within(referrals).getByText(/25 of 10,440 sessions/)).toBeVisible();
    expect(within(referrals).getByText(/floor, not a total/i)).toBeVisible();
  });

  it('lists assistants that referred nothing rather than omitting them', () => {
    render(<AiAnswersTab />);

    const referrals = screen.getByRole('region', { name: 'Sessions arriving from assistants' });
    const claude = within(referrals).getByRole('row', { name: /Claude/ });
    expect(within(claude).getAllByText('0').length).toBeGreaterThan(0);
  });

  it('says how each assistant was checked and what it cannot show', () => {
    render(<AiAnswersTab />);

    const assistants = screen.getByRole('region', { name: 'Assistants on the panel' });
    expect(within(assistants).getByText('No source links')).toBeVisible();
    expect(within(assistants).getByText(/cannot be separated out/i)).toBeVisible();
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(<AiAnswersTab />);
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toEqual([]);
  });
});
