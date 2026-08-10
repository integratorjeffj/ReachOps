import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppNav } from './app-nav';

const { usePathname } = vi.hoisted(() => ({
  usePathname: vi.fn(() => '/weekly-review'),
}));

vi.mock('next/navigation', () => ({ usePathname }));

describe('AppNav', () => {
  beforeEach(() => {
    usePathname.mockReturnValue('/weekly-review');
  });

  it('shows the final information architecture and current route for managers', () => {
    render(<AppNav role="MANAGER" />);

    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /weekly review/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: /actions/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /connections/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /activity/i })).toBeInTheDocument();
  });

  it('does not expose Activity navigation to contributors', () => {
    render(<AppNav role="CONTRIBUTOR" />);

    expect(screen.queryByRole('link', { name: /activity/i })).not.toBeInTheDocument();
  });
});
