import Link from 'next/link';

interface PreviewStateProps {
  eyebrow: string;
  title: string;
  description: string;
  nextMilestone: string;
}

export function PreviewState({ eyebrow, title, description, nextMilestone }: PreviewStateProps) {
  return (
    <section className="preview-page">
      <div className="page-heading">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="intentional-empty">
        <span aria-hidden="true" className="empty-orbit">
          <i />
        </span>
        <div>
          <span className="mode-badge">Planned capability</span>
          <h2>This workspace is ready for {nextMilestone}.</h2>
          <p>
            The route is part of the final information architecture. Data and controls will appear
            only when their deterministic and authorization boundaries are implemented.
          </p>
          <Link href="/">Return to the portfolio overview</Link>
        </div>
      </div>
    </section>
  );
}
