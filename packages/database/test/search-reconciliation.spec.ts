import { describe, expect, it } from 'vitest';
import { flagshipComparisons } from '../src/demo/fixtures';
import { pageMonthlyClicks, searchPages, searchQueries } from '../src/demo/search-fixtures';
import { buildDemoSnapshot, buildSearchSnapshot } from '../src/demo/snapshot';

/**
 * Cross-surface reconciliation.
 *
 * A demonstration loses its credibility the moment two screens disagree about the same number.
 * These assertions fix the relationships that must hold between workspace totals, page rows, query
 * rows and the evidence they cite, so a fixture edit that breaks the story fails here rather than
 * in front of a viewer.
 */

const flagship = new Map(
  flagshipComparisons.map(([evidenceId, , prior, current]) => [
    String(evidenceId),
    { prior: Number(prior), current: Number(current) },
  ]),
);

const workspace = {
  sessions: flagship.get('EV-101')!,
  bookings: flagship.get('EV-103')!,
  impressions: flagship.get('EV-107')!,
  clicks: flagship.get('EV-108')!,
};

const sum = (values: number[]): number => values.reduce((total, value) => total + value, 0);

describe('page fixtures against workspace analytics', () => {
  it('reconciles sessions exactly, because both come from the same analytics property', () => {
    expect(sum(searchPages.map(({ currentSessions }) => currentSessions))).toBe(
      workspace.sessions.current,
    );
    expect(sum(searchPages.map(({ priorSessions }) => priorSessions))).toBe(
      workspace.sessions.prior,
    );
  });

  it('reconciles confirmed bookings exactly', () => {
    expect(sum(searchPages.map(({ currentBookings }) => currentBookings))).toBe(
      workspace.bookings.current,
    );
    expect(sum(searchPages.map(({ priorBookings }) => priorBookings))).toBe(
      workspace.bookings.prior,
    );
  });

  it('never reports more bookings than sessions on any page or period', () => {
    for (const page of searchPages) {
      expect(page.currentBookings).toBeLessThanOrEqual(page.currentSessions);
      expect(page.priorBookings).toBeLessThanOrEqual(page.priorSessions);
    }
  });
});

describe('search-console rows against the property total', () => {
  // Google withholds anonymised queries and thresholds low-volume rows. Rows summing to the exact
  // property total would be the suspicious outcome, not the reassuring one.
  it('keeps page clicks and impressions below the property total', () => {
    expect(sum(searchPages.map(({ currentClicks }) => currentClicks))).toBeLessThan(
      workspace.clicks.current,
    );
    expect(sum(searchPages.map(({ currentImpressions }) => currentImpressions))).toBeLessThan(
      workspace.impressions.current,
    );
  });

  it('keeps query clicks and impressions below the property total', () => {
    expect(sum(searchQueries.map(({ currentClicks }) => currentClicks))).toBeLessThan(
      workspace.clicks.current,
    );
    expect(sum(searchQueries.map(({ currentImpressions }) => currentImpressions))).toBeLessThan(
      workspace.impressions.current,
    );
  });

  it('keeps row coverage within a plausible band rather than near zero or complete', () => {
    const { coverage } = buildSearchSnapshot().search;
    expect(coverage.pageClickCoveragePercent).toBeGreaterThan(70);
    expect(coverage.pageClickCoveragePercent).toBeLessThan(100);
    expect(coverage.queryClickCoveragePercent).toBeGreaterThan(70);
    expect(coverage.queryClickCoveragePercent).toBeLessThan(100);
  });

  it('publishes the shortfall so a reader is never invited to add rows up', () => {
    const { coverage } = buildSearchSnapshot().search;
    expect(coverage.pageClicks).toBeLessThan(coverage.propertyClicks);
    expect(coverage.note).toMatch(/anonymised|threshold/i);
  });
});

describe('shared evidence across surfaces', () => {
  it('derives the AC repair page from the same observations the Command Center cites', () => {
    const page = buildSearchSnapshot().search.pages.find(({ key }) => key === 'AC-REPAIR')!;
    const byMetric = new Map(page.metrics.map((metric) => [metric.metricStableKey, metric]));

    // EV-104 to EV-106 are published by the weekly comparisons. The page must reuse them rather
    // than mint parallel identifiers that could drift apart.
    expect(byMetric.get('ga4.sessions')!.evidenceId).toBe('EV-104');
    expect(byMetric.get('ga4.confirmed_bookings')!.evidenceId).toBe('EV-105');
    expect(byMetric.get('ga4.page_booking_rate')!.evidenceId).toBe('EV-106');
  });

  it('reports the same AC booking-rate values as the weekly observation', () => {
    const page = buildSearchSnapshot().search.pages.find(({ key }) => key === 'AC-REPAIR')!;
    const bookingRate = page.metrics.find(
      ({ metricStableKey }) => metricStableKey === 'ga4.page_booking_rate',
    )!;

    expect(bookingRate.prior).toBe(flagship.get('EV-106')!.prior);
    expect(bookingRate.current).toBe(flagship.get('EV-106')!.current);
  });

  it('does not emit a second evidence record for a reused observation', () => {
    const core = buildDemoSnapshot().evidence.map(({ evidenceId }) => evidenceId);
    const search = buildSearchSnapshot().evidence.map(({ evidenceId }) => evidenceId);
    const overlap = search.filter((evidenceId) => core.includes(evidenceId));

    expect(overlap).toEqual([]);
  });

  it('gives every page and query metric an evidence record that can be opened', () => {
    const snapshot = buildSearchSnapshot();
    const known = new Set([
      ...snapshot.evidence.map(({ evidenceId }) => evidenceId),
      ...buildDemoSnapshot().evidence.map(({ evidenceId }) => evidenceId),
    ]);

    for (const row of [...snapshot.search.pages, ...snapshot.search.queries]) {
      for (const metric of row.metrics) {
        expect(known.has(metric.evidenceId)).toBe(true);
        expect(known.has(metric.priorEvidenceId)).toBe(true);
      }
    }
  });

  it('retains simulated provenance on every derived search row', () => {
    for (const record of buildSearchSnapshot().evidence) {
      expect(record.sourceMode).toBe('SIMULATED');
    }
  });
});

describe('narrative pages', () => {
  it('lands every query on a page that exists', () => {
    const paths = new Set(searchPages.map(({ key }) => key));
    for (const query of searchQueries) {
      expect(paths.has(query.landingPageKey)).toBe(true);
    }
  });

  it('shows the water-heater guide declining before its refresh and recovering after', () => {
    const series = new Map(pageMonthlyClicks['WATER-HEATER-GUIDE']);
    const january = series.get('2026-01')!;
    const march = series.get('2026-03')!;
    const april = series.get('2026-04')!;

    // ACT-032 refreshed the guide on 2026-03-09.
    const decline = ((march - january) / january) * 100;
    const recovery = ((april - march) / march) * 100;

    expect(decline).toBeLessThan(-20);
    expect(recovery).toBeGreaterThan(20);
  });

  it('peaks AC repair demand in the Denver cooling season', () => {
    const series = pageMonthlyClicks['AC-REPAIR'] ?? [];
    const peak = series.reduce((best, point) => (point[1] > best[1] ? point : best));
    const trough = series.reduce((worst, point) => (point[1] < worst[1] ? point : worst));

    expect(peak[0]).toBe('2026-07');
    expect(trough[0]).toBe('2026-01');
  });

  it('surfaces high-exposure low-capture queries for the opportunity rules to find', () => {
    const weak = buildSearchSnapshot().search.queries.filter((query) => {
      const value = (key: string) =>
        query.metrics.find(({ metricStableKey }) => metricStableKey === key)!.current;
      return value('gsc.impressions') > 4_000 && value('gsc.ctr') < 2.5;
    });

    expect(weak.length).toBeGreaterThanOrEqual(5);
    expect(weak.map(({ query }) => query)).toContain('ac repair vs replace');
  });
});
