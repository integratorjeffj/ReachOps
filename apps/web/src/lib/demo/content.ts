import { DemoContentSnapshotSchema, type DemoContentSnapshot } from '@reachops/contracts';
import contentJson from './content.generated.json';

/**
 * The editorial pipeline and calendar.
 *
 * Imported only by the Content workspace. Planned work carries no evidence records of its own
 * because it has not happened yet; the numbers it will eventually be judged against live with the
 * page or post it becomes.
 */
export const demoContentSnapshot: DemoContentSnapshot =
  DemoContentSnapshotSchema.parse(contentJson);

export const demoContent = demoContentSnapshot.content;
