import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppNav } from './app-nav';

const { usePathname } = vi.hoisted(() => ({
  usePathname: vi.fn(() => '/opportunities'),
}));

vi.mock('next/navigation', () => ({ usePathname }));

describe('AppNav', () => {
  beforeEach(() => {
    usePathname.mockReturnValue('/opportunities');
  });

  it('presents a business information architecture and the current route', () => {
    render(<AppNav role="MANAGER" />);

    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /command center/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /opportunities/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: /owned follow-through/i })).toBeInTheDocument();
  });

  it('keeps operational surfaces in a separate workspace-settings group', () => {
    render(<AppNav role="MANAGER" />);

    const utility = screen.getByRole('navigation', { name: 'Workspace settings' });
    expect(utility).toHaveTextContent(/connections/i);
    expect(utility).toHaveTextContent(/audit & activity/i);
  });

  it('does not expose the audit trail to contributors', () => {
    render(<AppNav role="CONTRIBUTOR" />);

    expect(screen.queryByRole('link', { name: /audit & activity/i })).not.toBeInTheDocument();
  });
});
