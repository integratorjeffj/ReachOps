import { demoSnapshot } from '@/lib/demo/snapshot';
import { formatRange, formatYear } from '@/lib/format';

export default function AboutPage() {
  const { activeWeek, workspace } = demoSnapshot.overview;

  return (
    <article className="about-page">
      <span className="eyebrow">Portfolio demonstration</span>
      <h1>Trust is part of the product.</h1>
      <p className="lede">
        ReachOps turns verified digital-presence signals into evidence-linked weekly priorities and
        human-owned work. This environment uses a completely fictional customer and frozen fixture
        data while live integrations are not yet enabled.
      </p>
      <div className="disclosure-grid">
        <section>
          <span>01</span>
          <h2>Synthetic by default</h2>
          <p>Summit &amp; Sage, its people, metrics, reviews, and actions are fictional.</p>
        </section>
        <section>
          <span>02</span>
          <h2>Facts before AI</h2>
          <p>Deterministic calculations own numbers. AI may explain bounded facts later.</p>
        </section>
        <section>
          <span>03</span>
          <h2>People own action</h2>
          <p>No recommendation becomes assigned work without an explicit human decision.</p>
        </section>
      </div>
      <dl className="demo-metadata">
        <div>
          <dt>Dataset version</dt>
          <dd>{workspace.datasetVersion}</dd>
        </div>
        <div>
          <dt>Frozen reporting week</dt>
          <dd>
            {formatRange(activeWeek.start, activeWeek.end)}, {formatYear(activeWeek.end)}
          </dd>
        </div>
        <div>
          <dt>Source mode</dt>
          <dd>Fixture / simulated until explicitly connected</dd>
        </div>
      </dl>
    </article>
  );
}
