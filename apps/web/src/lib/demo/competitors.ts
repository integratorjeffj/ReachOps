import { DemoCompetitorSnapshotSchema, type DemoCompetitorSnapshot } from '@reachops/contracts';
import competitorsJson from './competitors.generated.json';

/**
 * The competitor comparison.
 *
 * Imported only by the Competitors route. Nothing here carries evidence identifiers: an observation
 * about somebody else's website is not a metric this workspace measured, and giving it an evidence
 * chip would imply a provenance record that does not exist.
 */
export const demoCompetitorSnapshot: DemoCompetitorSnapshot =
  DemoCompetitorSnapshotSchema.parse(competitorsJson);

export const demoCompetitors = demoCompetitorSnapshot.competitors;
