import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { buildDemoSnapshot, buildSearchSnapshot } from './snapshot';
import { buildContentSnapshot } from './content-snapshot';
import { buildSocialSnapshot } from './social-snapshot';
import { buildFactPacket } from './briefing-facts';
import { buildCompetitorSnapshot } from './competitor-snapshot';

/**
 * Writes the published demonstration snapshots.
 *
 * The output is committed so the static demonstration build needs neither a database nor the API.
 * Continuous integration regenerates it and fails when the committed copy has drifted from the
 * fixtures or the deterministic services.
 *
 * Search data is written separately. Page and query rows outnumber everything else combined, and
 * only the Search workspace cites them, so keeping them in their own module stops every other
 * route from loading evidence it never opens.
 */

const DEMO_DIR = resolve(__dirname, '../../../../apps/web/src/lib/demo');

function write(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function main(): void {
  const outputDir = process.argv[2] ? resolve(process.argv[2]) : DEMO_DIR;
  const snapshot = buildDemoSnapshot();
  const search = buildSearchSnapshot();
  const social = buildSocialSnapshot();
  const content = buildContentSnapshot();
  const briefing = buildFactPacket(snapshot);
  const rivals = buildCompetitorSnapshot();

  const snapshotPath = resolve(outputDir, 'snapshot.generated.json');
  const searchPath = resolve(outputDir, 'search.generated.json');
  const socialPath = resolve(outputDir, 'social.generated.json');
  const contentPath = resolve(outputDir, 'content.generated.json');
  const briefingPath = resolve(outputDir, 'briefing.generated.json');
  const competitorsPath = resolve(outputDir, 'competitors.generated.json');
  write(snapshotPath, snapshot);
  write(searchPath, search);
  write(socialPath, social);
  write(contentPath, content);
  write(briefingPath, briefing);
  write(competitorsPath, rivals);

  process.stdout.write(
    `Demo snapshot written to ${snapshotPath}\n` +
      `  dataset ${snapshot.datasetVersion}\n` +
      `  observations ${snapshot.weeklyReview.observations.length}\n` +
      `  recommendations ${snapshot.weeklyReview.recommendations.length}\n` +
      `  actions ${snapshot.actions.length}\n` +
      `  connections ${snapshot.connections.length}\n` +
      `  activity events ${snapshot.activity.length}\n` +
      `  reviews ${snapshot.reviews.length}\n` +
      `  evidence records ${snapshot.evidence.length}\n` +
      `Search snapshot written to ${searchPath}\n` +
      `  pages ${search.search.pages.length}\n` +
      `  queries ${search.search.queries.length}\n` +
      `  evidence records ${search.evidence.length}\n` +
      `Briefing packet written to ${briefingPath}\n` +
      `  facts ${briefing.totals.factCount}\n` +
      `  withheld ${briefing.totals.exclusionCount}\n` +
      `  evidence cited ${briefing.totals.evidenceCitedCount}\n` +
      `Competitor snapshot written to ${competitorsPath}\n` +
      `  competitors ${rivals.competitors.totals.competitorCount}\n` +
      `  public signals ${rivals.competitors.totals.signalCount}\n`,
  );
}

main();
