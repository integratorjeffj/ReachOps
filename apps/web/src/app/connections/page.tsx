import { ConnectionsView } from '@/components/connections-view';
import { demoSnapshot } from '@/lib/demo/snapshot';

export default function ConnectionsPage() {
  return <ConnectionsView connections={demoSnapshot.connections} />;
}
