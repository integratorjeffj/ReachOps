import type { DemoTechnicalWorkspace, DemoVitalsRow } from '@reachops/contracts';
import { searchPages } from './search-fixtures';
import {
  coreWebVitals,
  FIELD_WINDOW,
  LAB_NOTE,
  SEO_AUDIT,
  seoIssues,
  type CoreWebVitalsFixture,
} from './technical-fixtures';

/**
 * Builds the technical audit workspace.
 *
 * Ratings come from the published Core Web Vitals boundaries rather than from anything invented
 * here, and each metric carries the thresholds it was judged against so a reader never has to take
 * a colour on trust.
 */

const ISSUE_TYPE_LABEL: Record<string, string> = {
  INDEXABILITY: 'Indexability',
  CANONICAL: 'Canonical',
  ROBOTS: 'Robots directives',
  SITEMAP: 'Sitemap',
  STATUS_4XX: 'Client error',
  STATUS_5XX: 'Server error',
  REDIRECT_CHAIN: 'Redirect chain',
  MISSING_TITLE: 'Missing title',
  DUPLICATE_TITLE: 'Duplicate title',
  MISSING_META_DESCRIPTION: 'Missing meta description',
  DUPLICATE_META_DESCRIPTION: 'Duplicate meta description',
  HEADING_HIERARCHY: 'Heading hierarchy',
  BROKEN_INTERNAL_LINK: 'Broken internal link',
  WEAK_INTERNAL_LINKING: 'Weak internal linking',
  STRUCTURED_DATA: 'Structured data',
  MOBILE_PERFORMANCE: 'Mobile performance',
  CORE_WEB_VITALS: 'Core Web Vitals',
};

/**
 * The published thresholds. Lower is better for all three, and every one is a real boundary rather
 * than a band chosen to make a chart look balanced.
 */
const THRESHOLDS = {
  LCP: { label: 'Largest Contentful Paint', unit: 's', good: 2.5, poor: 4 },
  INP: { label: 'Interaction to Next Paint', unit: 'ms', good: 200, poor: 500 },
  CLS: { label: 'Cumulative Layout Shift', unit: '', good: 0.1, poor: 0.25 },
} as const;

type VitalKey = keyof typeof THRESHOLDS;

function rate(metric: VitalKey, value: number): 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR' {
  const { good, poor } = THRESHOLDS[metric];
  if (value <= good) return 'GOOD';
  return value <= poor ? 'NEEDS_IMPROVEMENT' : 'POOR';
}

function vitalsRow(fixture: CoreWebVitalsFixture): DemoVitalsRow {
  const page = searchPages.find(({ key }) => key === fixture.pageKey)!;

  const build = (metric: VitalKey, value: number, priorValue: number | null) => {
    const { label, unit, good, poor } = THRESHOLDS[metric];
    return {
      metric,
      label,
      value,
      priorValue,
      unit,
      rating: rate(metric, value),
      goodAtOrBelow: good,
      poorAbove: poor,
      // Crossing a boundary is the part worth a person's attention; drifting inside one is not.
      crossedThreshold: priorValue !== null && rate(metric, priorValue) !== rate(metric, value),
    };
  };

  return {
    pageKey: fixture.pageKey,
    pagePath: page.path,
    pageLabel: page.key
      .split('-')
      .map((token, index) => {
        if (token.length <= 2) return token;
        const cased = token.charAt(0) + token.slice(1).toLowerCase();
        return index === 0 ? cased : cased.toLowerCase();
      })
      .join(' '),
    formFactor: fixture.formFactor,
    source: fixture.source,
    vitals: [
      build('LCP', fixture.lcp, fixture.priorLcp),
      build('INP', fixture.inp, fixture.priorInp),
      build('CLS', fixture.cls, fixture.priorCls),
    ],
  };
}

export function buildTechnicalWorkspace(
  opportunityByRuleKey: Map<string, { id: string; title: string }>,
): DemoTechnicalWorkspace {
  return {
    audit: {
      id: SEO_AUDIT.id,
      siteLabel: SEO_AUDIT.siteLabel,
      crawlMode: SEO_AUDIT.crawlMode,
      crawledAt: SEO_AUDIT.crawledAt,
      status: SEO_AUDIT.status,
      pagesCrawled: SEO_AUDIT.pagesCrawled,
      checksRun: SEO_AUDIT.checksRun,
      provenanceNote: SEO_AUDIT.provenanceNote,
    },
    issues: seoIssues.map((issue) => {
      const opportunity = issue.relatedRuleKey
        ? opportunityByRuleKey.get(issue.relatedRuleKey)
        : undefined;
      return {
        id: issue.id,
        type: issue.type,
        typeLabel: ISSUE_TYPE_LABEL[issue.type]!,
        severity: issue.severity,
        status: issue.status,
        title: issue.title,
        detail: issue.detail,
        affectedPaths: [...issue.affectedPaths],
        detectedOn: issue.detectedOn,
        fixGuidance: issue.fixGuidance,
        opportunityId: opportunity?.id ?? null,
        opportunityTitle: opportunity?.title ?? null,
      };
    }),
    vitals: coreWebVitals.map(vitalsRow),
    fieldWindow: { ...FIELD_WINDOW },
    labNote: LAB_NOTE,
  };
}
