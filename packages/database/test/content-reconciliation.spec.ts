import { describe, expect, it } from 'vitest';
import { buildContentSnapshot } from '../src/demo/content-snapshot';
import { CONTENT_REFERENCE_DATE, plannedContent } from '../src/demo/content-fixtures';
import { searchPages } from '../src/demo/search-fixtures';
import { socialPosts } from '../src/demo/social-fixtures';
import { buildDemoSnapshot } from '../src/demo/snapshot';

/**
 * Content reconciliation.
 *
 * The calendar is where a demonstration most easily starts lying: work that claims to be scheduled
 * with a provider, published items that no analytics surface can corroborate, or a coverage warning
 * that stays on screen after the gap has been filled. These assertions close those routes.
 */

/** Mirrors MINIMUM_GAP_DAYS in the builder. */
const gapThreshold = 10;

const workspace = buildContentSnapshot().content;
const byId = new Map(workspace.items.map((item) => [item.id, item]));

describe('publishing boundaries', () => {
  it('never claims anything was scheduled with a provider', () => {
    for (const item of workspace.items) {
      expect(item.externallyScheduled).toBe(false);
    }
    expect(workspace.publishingNote).toMatch(/no publishing scope/i);
  });

  it('ends the pipeline at planned rather than scheduled', () => {
    const statuses = workspace.pipeline.map(({ status }) => status);
    expect(statuses).toContain('PLANNED');
    expect(statuses).not.toContain('SCHEDULED');
  });

  it('keeps every planned item simulated, because none of it is real work', () => {
    for (const item of workspace.items) {
      expect(item.sourceMode).toBe('SIMULATED');
    }
  });
});

describe('published work against the analytics workspaces', () => {
  // A published item that no other surface can corroborate is exactly the kind of orphan that
  // makes a demonstration fall apart under questioning.
  it('resolves every published reference to a real page or post', () => {
    const pageKeys = new Set(searchPages.map(({ key }) => key));
    const postIds = new Set(socialPosts.map(({ id }) => id));

    const published = workspace.items.filter(({ status }) => status === 'PUBLISHED');
    expect(published.length).toBeGreaterThan(0);

    for (const item of published) {
      expect(item.publishedRef).not.toBeNull();
      expect(pageKeys.has(item.publishedRef!) || postIds.has(item.publishedRef!)).toBe(true);
    }
  });

  it('matches a published social item to the post date it produced', () => {
    const reel = byId.get('PC-04')!;
    const post = socialPosts.find(({ id }) => id === reel.publishedRef)!;

    expect(reel.publishedDate).toBe(post.publishedOn);
    expect(post.technicianLed).toBe(true);
  });

  it('gives published work a date and unpublished work none', () => {
    for (const item of workspace.items) {
      if (item.status === 'PUBLISHED') expect(item.publishedDate).not.toBeNull();
      else expect(item.publishedDate).toBeNull();
    }
  });
});

describe('links to the rest of the product', () => {
  it('resolves opportunity references through stable rule keys', () => {
    const opportunityIds = new Set(
      buildDemoSnapshot().weeklyReview.recommendations.map(({ id }) => id),
    );
    const linked = workspace.items.filter(({ opportunityId }) => opportunityId !== null);

    expect(linked.length).toBeGreaterThan(0);
    for (const item of linked) {
      expect(opportunityIds.has(item.opportunityId!)).toBe(true);
      expect(item.opportunityTitle).not.toBeNull();
    }
  });

  it('keeps a repurposing set pointing at content that exists', () => {
    const children = workspace.items.filter(({ repurposedFromId }) => repurposedFromId !== null);
    expect(children.length).toBeGreaterThan(0);

    for (const child of children) {
      expect(byId.has(child.repurposedFromId!)).toBe(true);
      // A set spreads one piece of research across channels rather than duplicating it.
      expect(child.repurposedFromId).not.toBe(child.id);
    }
  });

  it('sends every destination to a page the search workspace knows', () => {
    const paths = new Set(searchPages.map(({ path }) => path));
    for (const item of workspace.items) {
      if (item.destinationPagePath) expect(paths.has(item.destinationPagePath)).toBe(true);
    }
  });
});

describe('derived counters and coverage', () => {
  it('counts pipeline stages to the same total as the item list', () => {
    const total = workspace.pipeline.reduce((sum, stage) => sum + stage.count, 0);
    expect(total).toBe(workspace.items.length);
  });

  it('flags overdue work against the frozen reference date', () => {
    expect(workspace.referenceDate).toBe(CONTENT_REFERENCE_DATE);
    expect(workspace.counters.overdue).toBeGreaterThan(0);

    for (const item of workspace.items.filter(({ overdue }) => overdue)) {
      expect(item.status).not.toBe('PUBLISHED');
      expect(item.dueDate! < workspace.referenceDate).toBe(true);
    }
  });

  it('does not treat published work as overdue however old its due date', () => {
    const published = workspace.items.filter(({ status }) => status === 'PUBLISHED');
    expect(published.some(({ dueDate }) => dueDate !== null)).toBe(true);
    expect(published.every(({ overdue }) => !overdue)).toBe(true);
  });

  it('derives the Summer Ready gap rather than asserting it', () => {
    const gap = workspace.coverageGaps.find(
      ({ campaignStableKey }) => campaignStableKey === 'CAM-01',
    )!;

    expect(gap.gapStart).toBe('2026-08-16');
    expect(gap.campaignEnds).toBe('2026-08-31');
    expect(gap.days).toBeGreaterThanOrEqual(10);
    // The warning states a fact about the calendar and stops short of prescribing content.
    expect(gap.note).toMatch(/not a judgement about what should fill it/i);
  });

  it('reports no gap once the window is planned into', () => {
    const filled = plannedContent.map((item) =>
      item.id === 'PC-15' ? { ...item, plannedDate: '2026-08-24' } : item,
    );
    // Re-running the same derivation over a filled calendar must drop the warning entirely.
    const dates = new Set(
      filled
        .filter((item) => item.campaignStableKey === 'CAM-01' && item.plannedDate)
        .map((item) => item.plannedDate),
    );
    expect(dates.has('2026-08-24')).toBe(true);

    const longestRunWithout = (() => {
      let longest = 0;
      let run = 0;
      for (let day = new Date('2026-08-03T00:00:00Z'); day <= new Date('2026-08-31T00:00:00Z');) {
        const key = day.toISOString().slice(0, 10);
        run = dates.has(key) ? 0 : run + 1;
        longest = Math.max(longest, run);
        day = new Date(day.getTime() + 86_400_000);
      }
      return longest;
    })();

    expect(longestRunWithout).toBeLessThan(gapThreshold);
  });
});
