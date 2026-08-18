import axe from 'axe-core';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { render } from '@/test-harness';
import { BriefingView } from './briefing-view';
import { demoBriefing } from '@/lib/demo/briefing';

describe('BriefingView', () => {
  it('says how the prose was produced before showing any of it', () => {
    render(<BriefingView />);

    const how = screen.getByRole('region', { name: 'How this was written' });
    expect(within(how).getByText(/fixed templates/i)).toBeVisible();
    expect(within(how).getByText(/nothing beyond it/i)).toBeVisible();
  });

  it('does not claim a language model wrote this page', () => {
    render(<BriefingView />);
    const how = screen.getByRole('region', { name: 'How this was written' });
    // The packet is what a model would be handed; the demo renders it deterministically. Saying so
    // is the point — an unqualified "AI-generated" claim here would be false.
    expect(within(how).getByText(/would be handed to a language model/i)).toBeVisible();
  });

  it('renders every statement the packet admitted', () => {
    render(<BriefingView />);
    for (const section of demoBriefing.sections) {
      for (const fact of section.facts) {
        expect(screen.getByText(fact.statement)).toBeVisible();
      }
    }
  });

  it('shows what it withheld next to what it said, not hidden behind a control', () => {
    render(<BriefingView />);

    // Every exclusion is in the document on first paint, with no disclosure to open. Several
    // share wording, so this asserts each one is present rather than uniquely present.
    for (const section of demoBriefing.sections) {
      for (const exclusion of section.exclusions) {
        expect(screen.getAllByText(exclusion.detail).length).toBeGreaterThan(0);
        expect(screen.getAllByText(exclusion.subject).length).toBeGreaterThan(0);
      }
    }
    expect(screen.queryByRole('button', { name: /show|reveal|expand/i })).not.toBeInTheDocument();
  });

  it('names the reason each withheld item was withheld', () => {
    render(<BriefingView />);
    expect(screen.getAllByText('Nothing measures this')).toHaveLength(2);
    expect(screen.getByText('Never measured')).toBeVisible();
    expect(screen.getAllByText('No supported explanation').length).toBeGreaterThan(0);
  });

  it('states direction in words rather than by colour alone', () => {
    render(<BriefingView />);
    expect(screen.getAllByText('Moving the way the business wants').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Moving against the business').length).toBeGreaterThan(0);
  });

  it('marks an explanation as a hypothesis and carries its confidence', () => {
    render(<BriefingView />);
    const tag = screen.getByText(/Hypothesis · medium confidence/i);
    expect(tag).toBeVisible();
  });

  it('opens the evidence behind a statement', async () => {
    const user = userEvent.setup();
    render(<BriefingView />);

    const evidence = screen.getAllByRole('list', { name: /^Evidence for FACT-/ })[0]!;
    await user.click(within(evidence).getAllByRole('button')[0]!);

    const drawer = await screen.findByRole('dialog');
    // The same provenance the tables open: where the number came from and how it is defined.
    expect(within(drawer).getByText('Source mode')).toBeVisible();
    expect(within(drawer).getByText('Reporting period')).toBeVisible();
    expect(within(drawer).getByText('Data quality')).toBeVisible();
  });

  it('publishes the rules it was held to, including what it may never say', () => {
    render(<BriefingView />);

    expect(screen.getByText('No overall verdict')).toBeVisible();
    expect(screen.getByText('Every measured value cites evidence')).toBeVisible();
    expect(screen.getByText(/No sentence asserts that a recommendation caused/i)).toBeVisible();
    expect(screen.getByText(/Rule set 1\.0\.0/)).toBeVisible();
  });

  it('copies the withheld items along with the statements', async () => {
    // userEvent.setup() installs its own clipboard stub, so read back through that rather than
    // replacing navigator.clipboard and racing it.
    const user = userEvent.setup();
    render(<BriefingView />);
    await user.click(screen.getByRole('button', { name: /copy briefing as text/i }));

    const copied = await navigator.clipboard.readText();
    expect(copied).toContain('Not said here');
    expect(copied).toContain('Evidence: EV-101');
    expect(await screen.findByText(/including everything withheld/i)).toBeVisible();
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(<BriefingView />);
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toEqual([]);
  });
});
