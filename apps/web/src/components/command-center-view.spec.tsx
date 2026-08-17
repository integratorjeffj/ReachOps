import axe from 'axe-core';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test-harness';
import type { OverviewResponse } from '@reachops/contracts';
import { describe, expect, it } from 'vitest';
import { demoSnapshot } from '@/lib/demo/snapshot';
import { CommandCenterView } from './command-center-view';

const definition = (
  stableKey: string,
  displayName: string,
  unit: 'COUNT' | 'PERCENTAGE' | 'RATING',
) => ({
  stableKey,
  provider: stableKey.startsWith('gbp') ? ('GBP_SIMULATED' as const) : ('GA4' as const),
  nativeName: stableKey.split('.').at(-1)!,
  displayName,
  family: unit === 'RATING' ? ('REVIEW' as const) : ('SITE_VISIT' as const),
  unit,
  aggregationBehavior: unit === 'COUNT' ? ('ADDITIVE' as const) : ('AVERAGE' as const),
  description: `${displayName} from its source-native definition.`,
  comparabilityNotes: 'Compare only within the same source and grain.',
  lowerIsBetter: false,
});

const kpi = (
  key: string,
  label: string,
  metric: string,
  current: number,
  prior: number,
  unit: 'COUNT' | 'PERCENTAGE' | 'RATING',
  evidence: string,
) => ({
  key,
  label,
  status: 'AVAILABLE' as const,
  definition: definition(metric, label, unit),
  current: {
    evidenceId: evidence,
    value: current,
    retrievedAt: '2026-08-03T12:00:00.000Z',
    qualityStatus: 'COMPLETE' as const,
    qualityFlags: [],
  },
  prior: {
    evidenceId: `${evidence}-PRIOR`,
    value: prior,
    retrievedAt: '2026-08-03T12:00:00.000Z',
    qualityStatus: 'COMPLETE' as const,
    qualityFlags: [],
  },
  change: {
    absolute: current - prior,
    percentage: ((current - prior) / prior) * 100,
    percentagePoints: unit === 'PERCENTAGE' ? current - prior : null,
    direction: current > prior ? ('UP' as const) : ('DOWN' as const),
  },
  sourceModes: ['SIMULATED' as const],
  coverageNote: null,
});

const overview: OverviewResponse = {
  state: 'AVAILABLE',
  workspace: {
    id: 'demo-workspace-summit-and-sage',
    slug: 'summit-and-sage-demo',
    name: 'Summit & Sage Home Services',
    timezone: 'America/Denver',
    synthetic: true,
    datasetVersion: 'summit-and-sage-v1',
  },
  activeWeek: {
    start: '2026-07-27T06:00:00.000Z',
    end: '2026-08-03T05:59:59.999Z',
    timezone: 'America/Denver',
  },
  goals: [],
  kpis: [
    kpi('sessions', 'Website sessions', 'ga4.sessions', 10440, 9480, 'COUNT', 'EV-101'),
    kpi('bookings', 'Confirmed bookings', 'ga4.confirmed_bookings', 246, 241, 'COUNT', 'EV-103'),
    kpi(
      'rate',
      'AC repair booking rate',
      'ga4.page_booking_rate',
      3.92,
      6.1,
      'PERCENTAGE',
      'EV-106',
    ),
    kpi(
      'rating',
      'New-review average rating',
      'gbp.new_review_average_rating',
      4.42,
      4.65,
      'RATING',
      'EV-115',
    ),
  ],
  sourceCoverage: [
    {
      connectionId: 'demo-ga4',
      provider: 'GA4',
      displayName: 'Summit & Sage Web — GA4',
      mode: 'SIMULATED',
      status: 'CONNECTED',
      resourceName: 'Summit & Sage Web — GA4',
      lastSuccessAt: '2026-08-03T12:00:00.000Z',
      lastSyncedAt: '2026-08-03T12:00:00.000Z',
    },
    {
      connectionId: 'demo-linkedin',
      provider: 'LINKEDIN_IMPORT',
      displayName: 'Summit & Sage Home Services',
      mode: 'IMPORTED',
      status: 'CONNECTED',
      resourceName: 'LinkedIn Company Page',
      lastSuccessAt: '2026-08-03T12:00:00.000Z',
      lastSyncedAt: '2026-08-03T12:00:00.000Z',
    },
  ],
  priorities: [1, 2, 3].map((position) => ({ position, status: 'PENDING_ANALYSIS' as const })),
  trends: [
    {
      metricStableKey: 'ga4.sessions',
      definition: definition('ga4.sessions', 'Website sessions', 'COUNT'),
      points: [31800, 33400, 42300].map((value, index) => ({
        periodStart: `2026-0${index + 1}-01T07:00:00.000Z`,
        periodEnd: `2026-0${index + 1}-28T06:59:59.999Z`,
        value,
        evidenceId: `EV-TREND-S${index + 1}`,
        retrievedAt: '2026-08-03T12:00:00.000Z',
        qualityStatus: 'COMPLETE',
        sourceMode: 'SIMULATED',
      })),
    },
    {
      metricStableKey: 'ga4.confirmed_bookings',
      definition: definition('ga4.confirmed_bookings', 'Confirmed bookings', 'COUNT'),
      points: [735, 826, 1021].map((value, index) => ({
        periodStart: `2026-0${index + 1}-01T07:00:00.000Z`,
        periodEnd: `2026-0${index + 1}-28T06:59:59.999Z`,
        value,
        evidenceId: `EV-TREND-B${index + 1}`,
        retrievedAt: '2026-08-03T12:00:00.000Z',
        qualityStatus: 'COMPLETE',
        sourceMode: 'SIMULATED',
      })),
    },
  ],
  annotations: [],
};

describe('CommandCenterView', () => {
  it('renders the management story, four KPIs, source modes, and three honest placeholders', () => {
    render(<CommandCenterView overview={overview} />);

    expect(screen.getByRole('heading', { name: /demand is up/i })).toBeInTheDocument();
    expect(screen.getByText('10,440')).toBeInTheDocument();
    expect(screen.getByText('-2.18 pp')).toBeInTheDocument();
    expect(screen.getAllByText('Deterministic priority reserved')).toHaveLength(3);
    expect(screen.getAllByText('Simulated').length).toBeGreaterThan(0);
    expect(screen.getByText('Imported')).toBeInTheDocument();
    expect(screen.getByText(/view accessible trend table/i)).toBeInTheDocument();
  });

  it('renders a targeted empty state without zeros or invented trends', () => {
    render(<CommandCenterView overview={{ ...overview, state: 'EMPTY', trends: [] }} />);
    expect(
      screen.getByRole('heading', { name: /connect or import a source/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText('10,440')).not.toBeInTheDocument();
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(<CommandCenterView overview={overview} />);
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toEqual([]);
  });
});

describe('CommandCenterView against the committed snapshot', () => {
  const snapshotOverview = demoSnapshot.overview;
  const observations = demoSnapshot.weeklyReview.observations;

  it('answers what changed for every current-week signal', () => {
    render(<CommandCenterView observations={observations} overview={snapshotOverview} />);

    const section = screen.getByRole('region', { name: 'What changed' });
    for (const kpi of snapshotOverview.kpis) {
      expect(within(section).getByText(new RegExp(kpi.label, 'i'))).toBeInTheDocument();
    }
  });

  it('shows goal attainment only where a verified metric is mapped', () => {
    render(<CommandCenterView observations={observations} overview={snapshotOverview} />);

    const goals = screen.getByRole('region', { name: 'Active goals' });
    const unmeasured = snapshotOverview.goals.filter(({ status }) => status === 'UNAVAILABLE');

    expect(within(goals).getAllByText('Not yet measured')).toHaveLength(unmeasured.length);
    // Qualified demand sits at 1,021 against a 1,000 target.
    expect(within(goals).getByText('102%')).toBeInTheDocument();
  });

  it('reports completed work with its subsequent-performance caveat', () => {
    render(<CommandCenterView observations={observations} overview={snapshotOverview} />);

    const outcomes = screen.getByRole('region', { name: 'Recent outcomes' });
    expect(within(outcomes).getByText(/refresh water-heater comparison page/i)).toBeInTheDocument();
    expect(within(outcomes).getByText(/does not attribute a later change/i)).toBeInTheDocument();
  });

  it('ranks real opportunities with their impact and effort', () => {
    render(<CommandCenterView observations={observations} overview={snapshotOverview} />);

    const priorities = screen.getByRole('region', { name: 'What needs a look first' });
    expect(within(priorities).getByText(observations[0]!.title)).toBeInTheDocument();
    // More than one high-impact opportunity can rank into the top three.
    expect(within(priorities).getAllByText(/impact high/i).length).toBeGreaterThan(0);
    expect(screen.queryByText('Deterministic priority reserved')).not.toBeInTheDocument();
  });

  it('re-plots the trend when a different metric is selected', async () => {
    const user = userEvent.setup();
    render(<CommandCenterView observations={observations} overview={snapshotOverview} />);

    expect(screen.getByRole('heading', { name: /total website sessions/i })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Metric'), 'gbp.cumulative_rating');

    expect(screen.getByRole('heading', { name: /cumulative gbp rating/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /total website sessions/i }),
    ).not.toBeInTheDocument();
  });

  it('has no automated accessibility violations with the full workspace', async () => {
    const { container } = render(
      <CommandCenterView observations={observations} overview={snapshotOverview} />,
    );
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toEqual([]);
  });
});
