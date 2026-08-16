import Link from 'next/link';
import { OverviewView } from '@/components/overview-view';
import { demoSnapshot } from '@/lib/demo/snapshot';
import { getOverview } from '@/lib/overview-api';

export default async function HomePage() {
  const result = await getOverview();

  if (!result.ok) {
    return (
      <section className="overview-status" aria-labelledby="overview-error-title">
        <span className="status-glyph" aria-hidden="true">
          !
        </span>
        <span className="eyebrow">Overview unavailable</span>
        <h1 id="overview-error-title">The latest evidence could not be loaded.</h1>
        <p>
          No values are shown because ReachOps could not verify their source. Check the API and try
          again; connection health remains available from the Connections page.
        </p>
        <Link className="button button--primary" href="/">
          Try the overview again
        </Link>
      </section>
    );
  }

  return (
    <OverviewView observations={demoSnapshot.weeklyReview.observations} overview={result.data} />
  );
}
