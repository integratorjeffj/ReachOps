import Link from 'next/link';

const previewMetrics = [
  {
    label: 'Website sessions',
    value: '10,440',
    change: '+10.1%',
    note: 'Fixture preview · prior week 9,480',
  },
  {
    label: 'Confirmed bookings',
    value: '246',
    change: '+2.1%',
    note: 'Fixture preview · GA4 key event',
  },
  {
    label: 'Organic clicks',
    value: '8,160',
    change: '+10.6%',
    note: 'Fixture preview · Search Console',
  },
  {
    label: 'Required source coverage',
    value: '4 / 4',
    change: 'Ready',
    note: 'All current fixtures available',
  },
];

export default function HomePage() {
  return (
    <div className="overview-page">
      <section className="hero" aria-labelledby="overview-title">
        <div className="hero-copy">
          <span className="eyebrow">ReachOps portfolio preview · M0</span>
          <h1 id="overview-title">Turn scattered signals into a weekly operating decision.</h1>
          <p>
            ReachOps helps a marketing manager see what changed, inspect the evidence, and turn an
            approved priority into accountable work—without pretending every metric is comparable or
            letting AI act on its own.
          </p>
          <div className="hero-actions">
            <Link className="button button--primary" href="/weekly-review">
              Preview the weekly review
              <span aria-hidden="true">↗</span>
            </Link>
            <Link className="button button--quiet" href="/about">
              See trust boundaries
            </Link>
          </div>
        </div>

        <aside className="brief-card" aria-label="Current demonstration context">
          <div className="brief-card__topline">
            <span>Weekly operating brief</span>
            <span className="mode-badge">Fixture preview</span>
          </div>
          <p className="brief-card__headline">
            Demand is up; AC repair conversion needs attention.
          </p>
          <div className="brief-card__signal">
            <span className="signal-number">01</span>
            <div>
              <strong>Priority signal reserved</strong>
              <span>Deterministic evidence arrives in M2</span>
            </div>
          </div>
          <dl>
            <div>
              <dt>Workspace</dt>
              <dd>Summit &amp; Sage</dd>
            </div>
            <div>
              <dt>Window</dt>
              <dd>Week ending Aug 2</dd>
            </div>
            <div>
              <dt>Decision owner</dt>
              <dd>Maya Chen</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section aria-labelledby="preview-metrics-title" className="metric-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Foundation preview</span>
            <h2 id="preview-metrics-title">A believable customer story, clearly labeled.</h2>
          </div>
          <p>
            These values preview the frozen synthetic specification. They are not yet connected to
            the database or presented as implemented analytics.
          </p>
        </div>
        <div className="metric-grid">
          {previewMetrics.map((metric) => (
            <article className="metric-card" key={metric.label}>
              <div className="metric-card__header">
                <span>{metric.label}</span>
                <span className="preview-chip">Preview</span>
              </div>
              <div className="metric-card__value-row">
                <strong>{metric.value}</strong>
                <span>{metric.change}</span>
              </div>
              <p>{metric.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="trust-strip" aria-label="ReachOps operating boundaries">
        <div>
          <span aria-hidden="true">01</span>
          <p>
            <strong>Source truth stays visible.</strong>
            Live, simulated, and imported evidence never blur together.
          </p>
        </div>
        <div>
          <span aria-hidden="true">02</span>
          <p>
            <strong>Facts are deterministic.</strong>
            Code owns arithmetic, quality, permissions, and state.
          </p>
        </div>
        <div>
          <span aria-hidden="true">03</span>
          <p>
            <strong>Action is human-owned.</strong>
            Recommendations require evidence and explicit approval.
          </p>
        </div>
      </section>
    </div>
  );
}
