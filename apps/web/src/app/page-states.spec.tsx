import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getOverview } from '@/lib/overview-api';
import OverviewLoading from './loading';
import HomePage from './page';

vi.mock('@/lib/overview-api', () => ({ getOverview: vi.fn() }));

describe('Overview route states', () => {
  beforeEach(() => vi.mocked(getOverview).mockReset());

  it('renders a stable API failure with a recovery action and no invented value', async () => {
    vi.mocked(getOverview).mockResolvedValue({ ok: false });
    render(await HomePage());

    expect(
      screen.getByRole('heading', { name: /latest evidence could not be loaded/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /try the overview again/i })).toHaveAttribute(
      'href',
      '/',
    );
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('renders an announced loading skeleton without layout-dependent copy', () => {
    render(<OverviewLoading />);
    expect(screen.getByLabelText('Loading executive overview')).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(screen.getByText('Preparing current week')).toBeInTheDocument();
  });
});
