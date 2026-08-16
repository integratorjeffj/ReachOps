import { DemoSnapshotSchema, type DemoSnapshot } from '@reachops/contracts';
import snapshotJson from './snapshot.generated.json';

/**
 * The committed demonstration snapshot.
 *
 * `snapshot.generated.json` is produced by `pnpm demo:snapshot`, which runs the same deterministic
 * comparison and observation services the API uses. Parsing it through the shared contract here
 * means a drifted or hand-edited snapshot fails the build rather than rendering silently.
 */
export const demoSnapshot: DemoSnapshot = DemoSnapshotSchema.parse(snapshotJson);

export const IS_STATIC_DEMO = process.env.REACHOPS_DEMO_MODE === 'static';
