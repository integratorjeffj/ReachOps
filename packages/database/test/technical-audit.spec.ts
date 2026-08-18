import { describe, expect, it } from 'vitest';
import { searchPages } from '../src/demo/search-fixtures';
import { coreWebVitals } from '../src/demo/technical-fixtures';
import { buildSearchSnapshot } from '../src/demo/snapshot';

/**
 * Technical audit.
 *
 * Two things make this workspace dangerous if built carelessly: claiming a crawl that never
 * happened, and flattening incommensurable measurements into one reassuring number. These
 * assertions close both, and hold the published Core Web Vitals thresholds to their real values.
 */

const technical = buildSearchSnapshot().search.technical;

describe('what the crawl claims', () => {
  it('never presents itself as having fetched a real site', () => {
    expect(technical.audit.crawlMode).toBe('SIMULATED');
    expect(technical.audit.provenanceNote).toMatch(/never fetched|holds no crawler/i);
  });

  it('runs a readable number of checks rather than an exhaustive-looking list', () => {
    // A list long enough to feel thorough is a list nobody actions.
    expect(technical.issues.length).toBeGreaterThanOrEqual(15);
    expect(technical.issues.length).toBeLessThanOrEqual(25);
  });

  it('reports findings across the whole lifecycle, not only open complaints', () => {
    const statuses = new Set(technical.issues.map(({ status }) => status));
    expect(statuses.has('OPEN')).toBe(true);
    expect(statuses.has('VALIDATED')).toBe(true);
    expect(statuses.has('WONT_FIX')).toBe(true);
    expect(statuses.has('FIXED_PENDING_VALIDATION')).toBe(true);
  });

  it('records a reviewed non-issue so it is not re-raised every crawl', () => {
    const reviewed = technical.issues.find(({ status }) => status === 'WONT_FIX')!;
    expect(reviewed.fixGuidance).toMatch(/no change required/i);
  });

  it('points every affected path at a page the crawl covered or a site file', () => {
    const paths = new Set(searchPages.map(({ path }) => path));
    for (const issue of technical.issues) {
      for (const path of issue.affectedPaths) {
        // Retired URLs and robots.txt are legitimately absent from the live page set; that is what
        // several of these findings are about.
        const known =
          paths.has(path) ||
          path.startsWith('/robots') ||
          path.startsWith('/promotions') ||
          path === '/ac-repair';
        expect(known).toBe(true);
      }
    }
  });
});

describe('Core Web Vitals', () => {
  it('judges each metric against its published threshold', () => {
    const thresholds = { LCP: 2.5, INP: 200, CLS: 0.1 };

    for (const row of technical.vitals) {
      for (const vital of row.vitals) {
        expect(vital.goodAtOrBelow).toBe(thresholds[vital.metric]);
        if (vital.value <= vital.goodAtOrBelow) expect(vital.rating).toBe('GOOD');
        else if (vital.value <= vital.poorAbove) expect(vital.rating).toBe('NEEDS_IMPROVEMENT');
        else expect(vital.rating).toBe('POOR');
      }
    }
  });

  it('keeps field and lab apart rather than averaging them', () => {
    const sources = new Set(technical.vitals.map(({ source }) => source));
    expect(sources).toEqual(new Set(['FIELD', 'LAB']));

    // Every page and form factor carries both, and each row names which it is.
    for (const row of technical.vitals) {
      expect(['FIELD', 'LAB']).toContain(row.source);
    }
    expect(technical.labNote).toMatch(/single simulated run|one synthetic visit/i);
  });

  it('publishes no composite score anywhere', () => {
    const serialised = JSON.stringify(technical);
    expect(serialised).not.toMatch(/"score"|seoScore|overallScore|healthScore/i);
  });

  it('flags only a genuine threshold crossing, not drift inside a band', () => {
    const crossings = technical.vitals
      .flatMap((row) => row.vitals.map((vital) => ({ row, vital })))
      .filter(({ vital }) => vital.crossedThreshold);

    expect(crossings.length).toBeGreaterThan(0);
    for (const { vital } of crossings) {
      const priorRating =
        vital.priorValue! <= vital.goodAtOrBelow
          ? 'GOOD'
          : vital.priorValue! <= vital.poorAbove
            ? 'NEEDS_IMPROVEMENT'
            : 'POOR';
      expect(priorRating).not.toBe(vital.rating);
    }
  });

  it('shows mobile interaction delay crossing on the page carrying the booking story', () => {
    const row = technical.vitals.find(
      ({ pageKey, formFactor, source }) =>
        pageKey === 'AC-REPAIR' && formFactor === 'MOBILE' && source === 'FIELD',
    )!;
    const inp = row.vitals.find(({ metric }) => metric === 'INP')!;

    expect(inp.crossedThreshold).toBe(true);
    expect(inp.priorValue).toBeLessThanOrEqual(200);
    expect(inp.value).toBeGreaterThan(200);

    // Desktop did not move, which is what makes the mobile change worth a look rather than noise.
    const desktop = technical.vitals.find(
      ({ pageKey, formFactor, source }) =>
        pageKey === 'AC-REPAIR' && formFactor === 'DESKTOP' && source === 'FIELD',
    )!;
    expect(desktop.vitals.every(({ crossedThreshold }) => !crossedThreshold)).toBe(true);
  });

  it('states that the field window barely covers the change it is being read against', () => {
    expect(technical.fieldWindow.days).toBe(28);
    expect(technical.fieldWindow.note).toMatch(/damped|last four days/i);
  });

  it('does not report every page as healthy', () => {
    const ratings = technical.vitals.flatMap((row) => row.vitals.map(({ rating }) => rating));
    expect(ratings.filter((rating) => rating !== 'GOOD').length).toBeGreaterThan(0);
    expect(ratings.filter((rating) => rating === 'GOOD').length).toBeGreaterThan(0);
  });

  it('keeps mobile no better than desktop, as real devices behave', () => {
    for (const pageKey of new Set(coreWebVitals.map((row) => row.pageKey))) {
      const mobile = coreWebVitals.find(
        (row) => row.pageKey === pageKey && row.formFactor === 'MOBILE' && row.source === 'FIELD',
      )!;
      const desktop = coreWebVitals.find(
        (row) => row.pageKey === pageKey && row.formFactor === 'DESKTOP' && row.source === 'FIELD',
      )!;
      expect(mobile.lcp).toBeGreaterThanOrEqual(desktop.lcp);
      expect(mobile.inp).toBeGreaterThanOrEqual(desktop.inp);
    }
  });
});

describe('links to the rest of the product', () => {
  it('connects the interaction finding to the opportunity it overlaps', () => {
    const linked = technical.issues.filter(({ opportunityId }) => opportunityId !== null);
    expect(linked.length).toBeGreaterThan(0);

    const inp = linked.find(({ type }) => type === 'CORE_WEB_VITALS')!;
    expect(inp.opportunityTitle).toMatch(/AC repair/i);
  });
});
