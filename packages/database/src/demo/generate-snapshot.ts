import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { buildDemoSnapshot, buildSearchSnapshot } from './snapshot';
import { buildSocialSnapshot } from './social-snapshot';

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

  const snapshotPath = resolve(outputDir, 'snapshot.generated.json');
  const searchPath = resolve(outputDir, 'search.generated.json');
  const socialPath = resolve(outputDir, 'social.generated.json');
  write(snapshotPath, snapshot);
  write(searchPath, search);
  write(socialPath, social);

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
      `  evidence records ${search.evidence.length}\n`,
  );
}

main();
