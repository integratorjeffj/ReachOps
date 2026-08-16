import { ActionsView } from '@/components/actions-view';
import { demoSnapshot } from '@/lib/demo/snapshot';

export default function ActionsPage() {
  return <ActionsView actions={demoSnapshot.actions} />;
}
