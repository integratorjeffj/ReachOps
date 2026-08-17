import { DemoSearchSnapshotSchema, type DemoSearchSnapshot } from '@reachops/contracts';
import searchJson from './search.generated.json';
import { registerEvidence } from './evidence-registry';

/**
 * Page- and query-level search data.
 *
 * This module is imported only by the Search workspace. Loading it registers its evidence records
 * with the shared registry, so a chip rendered on a page or query row opens the same drawer every
 * other surface uses — without the Command Center paying to download rows it never cites.
 */
export const demoSearchSnapshot: DemoSearchSnapshot = DemoSearchSnapshotSchema.parse(searchJson);

registerEvidence(demoSearchSnapshot.evidence);

export const demoSearch = demoSearchSnapshot.search;
