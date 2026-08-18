import Link from 'next/link';
import { demoSnapshot } from '@/lib/demo/snapshot';
import { formatRange, formatYear } from '@/lib/format';

/**
 * The demonstration's front door.
 *
 * Carries a guided route through the product as well as the disclosures. The workspaces hold more
 * than a first-time reader will find on their own, and one connected story runs through most of
 * them, so pointing at it directly is worth more than another summary of what each screen contains.
 */

const WALKTHROUGH = [
  {
    href: '/',
    label: 'Command Center',
    detail:
      'Sessions rose 10.1%, and the AC repair booking rate fell from 6.10% to 3.92%. Open an evidence chip to see the provider, definition, period and data quality behind any number.',
  },
  {
    href: '/opportunities',
    label: 'Opportunities',
    detail:
      'The rule engine flagged that divergence. REC-001 is the only one carrying a suggested explanation, held at medium confidence and labelled a hypothesis. The rest say no explanation is supported.',
  },
  {
    href: '/search',
    label: 'Search & Website · Technical',
    detail:
      'On the same page, mobile interaction delay crossed 200ms while desktop held steady. The deployment landed four days before the field window closed, so the measured change is damped.',
  },
  {
    href: '/search',
    label: 'Search & Website · AI answers',
    detail:
      'Read what this cannot tell you first. Then the cost prompt: cited in three consecutive checks, absent on the fourth. On a panel this small, that is variance rather than a change in standing.',
  },
  {
    href: '/competitors',
    label: 'Competitors',
    detail:
      'Two of three rivals publish price ranges and we do not — the same gap the cost prompt exposed, seen from a different direction.',
  },
  {
    href: '/actions',
    label: 'Work',
    detail:
      'The investigation is assigned, owned and carries a review date. Nothing became work without a person approving it.',
  },
  {
    href: '/reports',
    label: 'Reports',
    detail:
      'What happened after earlier work. One outcome rose 23%. One rose during a seasonal peak, and the confounder is named beside it. One is not measurable at all.',
  },
  {
    href: '/briefing',
    label: 'Briefing',
    detail:
      'The week in writing, composed only from facts that passed published admission rules, with the ten things it could not stand behind listed alongside.',
  },
];

export default function AboutPage() {
  const { activeWeek, workspace } = demoSnapshot.overview;

  return (
    <article className="about-page">
      <span className="eyebrow">Portfolio demonstration</span>
      <h1>Trust is part of the product.</h1>
      <p className="lede">
        ReachOps turns verified digital-presence signals into evidence-linked priorities, owned
        work, and a measured answer about whether that work helped. This environment uses a
        completely fictional customer and frozen fixture data. No live source is connected.
      </p>

      <section aria-labelledby="walkthrough-title" className="walkthrough">
        <h2 id="walkthrough-title">Start here</h2>
        <p>
          One connected story runs through most of the product. Following it in order takes a few
          minutes and covers nearly everything the application does.
        </p>
        <ol>
          {WALKTHROUGH.map((step, index) => (
            <li key={`${step.href}-${step.label}`}>
              <Link href={step.href}>
                <span aria-hidden="true" className="walkthrough__index">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="walkthrough__body">
                  <strong>{step.label}</strong>
                  <span>{step.detail}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="disclosures-title">
        <h2 id="disclosures-title">What this demonstration promises</h2>
        <div className="disclosure-grid">
          <section>
            <span>01</span>
            <h3>Synthetic by default</h3>
            <p>
              Summit &amp; Sage, its people, metrics, reviews, actions and competitors are
              fictional.
            </p>
          </section>
          <section>
            <span>02</span>
            <h3>Facts before AI</h3>
            <p>
              Deterministic code owns every number. The briefing is composed from a published fact
              packet and cannot reach past it.
            </p>
          </section>
          <section>
            <span>03</span>
            <h3>People own action</h3>
            <p>No recommendation becomes assigned work without an explicit human decision.</p>
          </section>
        </div>
      </section>

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
