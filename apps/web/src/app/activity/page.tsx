import { ActivityView } from '@/components/activity-view';
import { demoSnapshot } from '@/lib/demo/snapshot';

export default function ActivityPage() {
  return <ActivityView activity={demoSnapshot.activity} />;
}
