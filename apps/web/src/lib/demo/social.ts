import { DemoSocialSnapshotSchema, type DemoSocialSnapshot } from '@reachops/contracts';
import socialJson from './social.generated.json';

/**
 * Post-level social data.
 *
 * Imported only by the Social workspace. No evidence needs registering here: the account-level
 * numbers this workspace reports are already published in the core snapshot as EV-116 to EV-128,
 * so its chips resolve through the same drawer without a second copy of anything.
 */
export const demoSocialSnapshot: DemoSocialSnapshot = DemoSocialSnapshotSchema.parse(socialJson);

export const demoSocial = demoSocialSnapshot.social;
