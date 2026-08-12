import { createHash } from 'node:crypto';
import {
  ConnectionHealthSchema,
  NormalizedBatchSchema,
  SourceResourceSchema,
  SyncRequestSchema,
  type NormalizedBatch,
  type SourceResource,
  type SyncRequest,
} from '@reachops/contracts';
import type { SourceAdapter } from './source-adapter';

const resource = SourceResourceSchema.parse({
  nativeId: 'DEMO-LI-SSHS',
  displayName: 'Summit & Sage Home Services',
  resourceType: 'LINKEDIN_COMPANY_PAGE',
});

interface ParsedRow {
  date: string;
  impressions: number;
  engagements: number;
}

function parseCsv(csv: string): ParsedRow[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines[0] !== 'date,impressions,engagements') {
    throw new Error('LinkedIn import requires date,impressions,engagements headers.');
  }

  return lines.slice(1).map((line, index) => {
    const [date, impressionsText, engagementsText, ...extra] = line.split(',');
    const impressions = Number(impressionsText);
    const engagements = Number(engagementsText);
    if (
      extra.length > 0 ||
      !date ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isInteger(impressions) ||
      impressions < 0 ||
      !Number.isInteger(engagements) ||
      engagements < 0 ||
      engagements > impressions
    ) {
      throw new Error(`LinkedIn import row ${index + 2} is invalid.`);
    }
    return { date, impressions, engagements };
  });
}

function evidenceId(metric: 'impressions' | 'engagements', date: string): string {
  const fixtureIds: Record<string, string> = {
    'impressions:2026-07-20': 'EV-116-PRIOR',
    'impressions:2026-07-27': 'EV-116',
    'engagements:2026-07-20': 'EV-117-PRIOR',
    'engagements:2026-07-27': 'EV-117',
  };
  return fixtureIds[`${metric}:${date}`] ?? `EV-LINKEDIN-${date}-${metric.toUpperCase()}`;
}

function weeklyPeriod(date: string, timezone: string) {
  const start = new Date(`${date}T00:00:00-06:00`);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1_000 - 1);
  return { start: start.toISOString(), end: end.toISOString(), timezone, grain: 'WEEK' as const };
}

export class LinkedInImportAdapter implements SourceAdapter {
  readonly provider = 'LINKEDIN_IMPORT' as const;
  readonly mode = 'IMPORTED' as const;
  readonly capabilities = ['METRICS', 'IMPORT'] as const;

  constructor(
    private readonly originalFileName: string,
    private readonly csv: string,
  ) {}

  listResources(): Promise<SourceResource[]> {
    return Promise.resolve([resource]);
  }

  validateConnection() {
    return Promise.resolve(
      ConnectionHealthSchema.parse({
        status: 'CONNECTED',
        checkedAt: '2026-08-03T12:00:00.000Z',
        safeMessage: 'LinkedIn CSV import is ready for local validation.',
      }),
    );
  }

  sync(input: SyncRequest): Promise<NormalizedBatch> {
    return Promise.resolve().then(() => {
      const request = SyncRequestSchema.parse(input);
      if (request.resourceNativeId !== resource.nativeId) {
        throw new Error('Unknown imported LinkedIn resource.');
      }
      const rows = parseCsv(this.csv);

      return NormalizedBatchSchema.parse({
        provider: this.provider,
        mode: this.mode,
        resourceNativeId: resource.nativeId,
        retrievedAt: request.retrievedAt,
        capabilities: [...this.capabilities],
        metricDefinitions: [
          {
            stableKey: 'linkedin.impressions',
            provider: this.provider,
            nativeName: 'impressions',
            displayName: 'LinkedIn impressions',
            family: 'EXPOSURE',
            unit: 'COUNT',
            aggregationBehavior: 'ADDITIVE',
            description: 'Impressions from the validated LinkedIn aggregate CSV.',
            comparabilityNotes: 'Imported aggregate metric; not a live LinkedIn API result.',
            lowerIsBetter: false,
          },
          {
            stableKey: 'linkedin.engagements',
            provider: this.provider,
            nativeName: 'engagements',
            displayName: 'LinkedIn engagements',
            family: 'ENGAGEMENT',
            unit: 'COUNT',
            aggregationBehavior: 'ADDITIVE',
            description: 'Engagements from the validated LinkedIn aggregate CSV.',
            comparabilityNotes: 'Imported aggregate metric; not a live LinkedIn API result.',
            lowerIsBetter: false,
          },
        ],
        observations: rows.flatMap((row) =>
          (['impressions', 'engagements'] as const).map((metric) => ({
            evidenceId: evidenceId(metric, row.date),
            metricStableKey: `linkedin.${metric}`,
            period: weeklyPeriod(row.date, request.timezone),
            value: row[metric],
            dimensions: { scope: 'company_page' },
            retrievedAt: request.retrievedAt,
            quality: { status: 'COMPLETE', flags: [], coverageNote: null },
          })),
        ),
        contentItems: [],
        importProvenance: {
          originalFileName: this.originalFileName,
          fileHash: `sha256:${createHash('sha256').update(this.csv).digest('hex')}`,
          schemaVersion: 'linkedin-aggregate-v1',
          totalRowCount: rows.length,
          acceptedRowCount: rows.length,
          rejectedRowCount: 0,
          validationSummary: { valid: true, columnCount: 3 },
        },
        warnings: ['LinkedIn data is imported and does not represent live API access.'],
      });
    });
  }
}
