import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { buildDemoSnapshot } from './snapshot';

/**
 * Writes the published demonstration snapshot.
 *
 * The output is committed so the static demonstration build needs neither a database nor the API.
 * Continuous integration regenerates it and fails when the committed copy has drifted from the
 * fixtures or the deterministic services.
 */

const DEFAULT_OUTPUT = resolve(
  __dirname,
  '../../../../apps/web/src/lib/demo/snapshot.generated.json',
);

function main(): void {
  const output = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_OUTPUT;
  const snapshot = buildDemoSnapshot();

  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  process.stdout.write(
    `Demo snapshot written to ${output}\n` +
      `  dataset ${snapshot.datasetVersion}\n` +
      `  observations ${snapshot.weeklyReview.observations.length}\n` +
      `  recommendations ${snapshot.weeklyReview.recommendations.length}\n` +
      `  actions ${snapshot.actions.length}\n` +
      `  connections ${snapshot.connections.length}\n` +
      `  activity events ${snapshot.activity.length}\n` +
      `  reviews ${snapshot.reviews.length}\n`,
  );
}

main();
