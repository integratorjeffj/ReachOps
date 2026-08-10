import axe from 'axe-core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HomePage from './page';

describe('HomePage', () => {
  it('communicates the ReachOps promise and synthetic preview state', () => {
    render(<HomePage />);

    expect(
      screen.getByRole('heading', {
        name: /turn scattered signals into a weekly operating decision/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /preview the weekly review/i })).toHaveAttribute(
      'href',
      '/weekly-review',
    );
    expect(screen.getAllByText('Preview')).toHaveLength(4);
    expect(screen.getByText(/not yet connected to the database/i)).toBeInTheDocument();
  });

  it('has no automated accessibility violations in the landing content', async () => {
    const { container } = render(
      <main>
        <HomePage />
      </main>,
    );
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });

    expect(results.violations).toEqual([]);
  });

  it('matches the reviewed foundation structure', () => {
    const { container } = render(<HomePage />);

    expect(container).toMatchSnapshot();
  });
});
