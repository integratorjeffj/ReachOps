'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { DemoCompetitor, DemoPublicSignal } from '@reachops/contracts';
import { PageHeading } from './demo-primitives';
import { Drawer } from './drawer';
import { demoCompetitors } from '@/lib/demo/competitors';
import { formatCalendarDate, formatNumber } from '@/lib/format';

/**
 * Competitor comparison.
 *
 * Built around the distinction that the rest of this category blurs. What a competitor publishes is
 * observable and sits in the main table; what a model produced sits apart, as a range, with the
 * method attached. They are never placed in the same row, because a reader scanning a row assumes
 * everything in it was measured the same way.
 *
 * There is no overall placing. Three companies compared on seven signals do not produce a winner,
 * and a product that declares one is asserting something it cannot support.
 */

function SignalCell({ present }: { present: boolean }) {
  return (
    <td className={`signal-cell signal-cell--${present ? 'yes' : 'no'}`}>
      <span aria-hidden="true">{present ? '●' : '○'}</span>
      {/* The mark is decorative; the state is read from text so it never depends on shape or hue. */}
      <span className="visually-hidden">{present ? 'Yes' : 'No'}</span>
      <small>{present ? 'Yes' : 'No'}</small>
    </td>
  );
}

function CompetitorDrawer({
  competitor,
  onClose,
  signals,
}: {
  competitor: DemoCompetitor | null;
  onClose: () => void;
  signals: DemoPublicSignal[];
}) {
  if (!competitor) return null;

  return (
    <Drawer
      eyebrow="Invented company · simulated observation"
      onClose={onClose}
      open
      title={competitor.name}
    >
      <div className="action-detail">
        <section aria-labelledby="rival-why-title">
          <h3 id="rival-why-title">Why this company is tracked</h3>
          <p className="evidence-prose">{competitor.reasonTracked}</p>
          <p className="evidence-caveat">{competitor.positioning}</p>
        </section>

        <section aria-labelledby="rival-observed-title">
          <h3 id="rival-observed-title">What is publicly visible</h3>
          <dl className="drawer-metrics">
            <div>
              <dt>Public rating</dt>
              <dd>
                {competitor.publicRating.toFixed(2)} from{' '}
                {formatNumber(competitor.publicReviewCount)} reviews
              </dd>
            </div>
            <div>
              <dt>Last published</dt>
              <dd>
                {competitor.lastPublishedOn === null ? (
                  <span className="table-muted">No dated content found</span>
                ) : (
                  formatCalendarDate(competitor.lastPublishedOn)
                )}
              </dd>
            </div>
            <div>
              <dt>Observed on</dt>
              <dd>{formatCalendarDate(competitor.observedOn)}</dd>
            </div>
          </dl>
          <ul className="rival-signal-list">
            {signals.map((signal) => (
              <li key={signal.key}>
                <span className={signal.values[competitor.key] ? 'rival-yes' : 'rival-no'}>
                  {signal.values[competitor.key] ? 'Yes' : 'No'}
                </span>
                {signal.question}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="rival-ai-title">
          <h3 id="rival-ai-title">Named in AI answers</h3>
          <p className="evidence-prose">
            Named in {competitor.aiMentionLabel} recorded on the{' '}
            <Link href="/search">AI answers panel</Link>.
          </p>
          <p className="evidence-caveat">
            Counted from the same checks that panel publishes, so the two cannot drift apart. It
            inherits the same limits: a handful of runs by one operator, from a system that answers
            differently each time.
          </p>
        </section>

        {competitor.sharedQueries.length > 0 && (
          <section aria-labelledby="rival-queries-title">
            <h3 id="rival-queries-title">Seen alongside us on</h3>
            <ul className="rival-query-list">
              {competitor.sharedQueries.map((query) => (
                <li key={query}>{query}</li>
              ))}
            </ul>
          </section>
        )}

        {competitor.estimates.length > 0 && (
          <section aria-labelledby="rival-estimate-title">
            <h3 id="rival-estimate-title">Estimated, not observed</h3>
            {competitor.estimates.map((estimate) => (
              <div className="rival-estimate" key={estimate.metric}>
                <span className="rival-estimate__label">{estimate.metric}</span>
                <strong>{estimate.rangeLabel}</strong>
                <p className="evidence-caveat">{estimate.method}</p>
              </div>
            ))}
          </section>
        )}
      </div>
    </Drawer>
  );
}

export function CompetitorsView() {
  const rivals = demoCompetitors;
  const [openKey, setOpenKey] = useState<string | null>(null);
  const openCompetitor = rivals.competitors.find(({ key }) => key === openKey) ?? null;

  return (
    <div className="workspace">
      <PageHeading
        description="What three Denver rivals publish, compared against what we publish. Limited on purpose to things a person could confirm by looking."
        eyebrow="Competitors"
        title="Who else is answering these questions"
      />

      <section aria-labelledby="rivals-invented" className="rival-disclosure">
        <h2 id="rivals-invented">These companies do not exist</h2>
        <p>{rivals.inventedNote}</p>
        <p className="evidence-caveat">{rivals.methodNote}</p>
      </section>

      <section aria-labelledby="rivals-unavailable-title" className="ai-unavailable">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Read this first</span>
            <h2 id="rivals-unavailable-title">What no source can tell you about a competitor</h2>
          </div>
        </div>
        <dl>
          {rivals.unavailable.map((entry) => (
            <div key={entry.metric}>
              <dt>{entry.metric}</dt>
              <dd>{entry.reason}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="rivals-signals-title" className="posts-section">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Observed, not modelled</span>
            <h2 id="rivals-signals-title">What each business publishes</h2>
          </div>
        </div>

        <div className="table-scroll">
          <table className="signal-table">
            <caption className="visually-hidden">
              Publicly visible signals compared across Summit &amp; Sage and three tracked
              competitors
            </caption>
            <thead>
              <tr>
                <th scope="col">Signal</th>
                <th scope="col">{rivals.subject.name}</th>
                {rivals.competitors.map((competitor) => (
                  <th key={competitor.key} scope="col">
                    {competitor.name}
                  </th>
                ))}
                <th scope="col">Rivals doing it</th>
              </tr>
            </thead>
            <tbody>
              {rivals.signals.map((signal) => (
                <tr key={signal.key}>
                  <th scope="row">
                    <strong>{signal.question}</strong>
                    <small>{signal.whyItMatters}</small>
                  </th>
                  <SignalCell present={signal.values[rivals.subject.key] ?? false} />
                  {rivals.competitors.map((competitor) => (
                    <SignalCell
                      key={competitor.key}
                      present={signal.values[competitor.key] ?? false}
                    />
                  ))}
                  <td className="is-numeric">{signal.competitorRatioLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="causal-note">
          {rivals.totals.subjectGapCount} things at least one rival publishes that we do not, and{' '}
          {rivals.totals.subjectOnlyCount} we publish that none of them does. Seven signals across
          three companies do not add up to a placing, so ReachOps does not award one.
        </p>
      </section>

      <section aria-labelledby="rivals-list-title" className="posts-section">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">
              Observed {formatCalendarDate(rivals.subject.observedOn)}
            </span>
            <h2 id="rivals-list-title">The companies</h2>
          </div>
        </div>

        <ul className="rival-cards">
          {rivals.competitors.map((competitor) => (
            <li key={competitor.key}>
              <button
                className="rival-card"
                onClick={() => setOpenKey(competitor.key)}
                type="button"
              >
                <span className="rival-card__name">{competitor.name}</span>
                <span className="rival-card__positioning">{competitor.positioning}</span>
                <span className="rival-card__meta">
                  <span className="meta-chip">
                    {competitor.publicRating.toFixed(2)} ·{' '}
                    {formatNumber(competitor.publicReviewCount)} reviews
                  </span>
                  <span className="meta-chip">Named in {competitor.aiMentionLabel}</span>
                  <span className="rival-card__estimate">
                    {competitor.estimates[0]?.rangeLabel} · estimated
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <p className="evidence-caveat">
          Click-range figures are modelled, not measured, and are shown only inside each
          company&rsquo;s detail where the method sits beside them. Ratings and review counts are
          read from public profiles.
        </p>
      </section>

      <section aria-labelledby="rivals-overlap-title" className="posts-section">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">{rivals.sampledQueries.length} queries sampled once</span>
            <h2 id="rivals-overlap-title">Where we appeared together</h2>
          </div>
        </div>

        <ul className="rival-overlaps">
          {rivals.sampledQueries.map((query) => {
            const seen = rivals.competitors.filter(({ sharedQueries }) =>
              sharedQueries.includes(query),
            );
            return (
              <li key={query}>
                <code className="table-path">{query}</code>
                {seen.length === 0 ? (
                  <span className="table-muted">No tracked competitor in the sampled results</span>
                ) : (
                  <span>{seen.map(({ name }) => name).join(', ')}</span>
                )}
              </li>
            );
          })}
        </ul>
        <p className="evidence-caveat">{rivals.overlapNote}</p>
      </section>

      <section aria-labelledby="rivals-untracked-title" className="posts-section">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Reconciliation</span>
            <h2 id="rivals-untracked-title">Companies named but not tracked</h2>
          </div>
        </div>
        <ul className="rival-untracked">
          {rivals.untrackedMentions.map((mention) => (
            <li key={mention.name}>
              <strong>{mention.name}</strong>
              <span>
                {mention.count} of {rivals.totals.aiCheckCount} checks
              </span>
            </li>
          ))}
        </ul>
        <p className="evidence-caveat">
          Named in recorded AI answers but not tracked as a peer, because it competes on price in a
          different part of the market. Listed so the per-company counts above can be added up
          without appearing to be short.
        </p>
      </section>

      <CompetitorDrawer
        competitor={openCompetitor}
        onClose={() => setOpenKey(null)}
        signals={rivals.signals}
      />
    </div>
  );
}
