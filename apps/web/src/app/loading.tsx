export default function OverviewLoading() {
  return (
    <section aria-label="Loading executive overview" aria-busy="true" className="overview-loading">
      <span className="eyebrow">Preparing current week</span>
      <div className="skeleton skeleton--title" />
      <div className="skeleton-grid">
        {[1, 2, 3, 4].map((item) => (
          <div className="skeleton skeleton--card" key={item} />
        ))}
      </div>
    </section>
  );
}
