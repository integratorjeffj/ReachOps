import Link from 'next/link';
import type {
  DemoRecommendation,
  DemoWeeklyReview,
  ObservationCandidate,
} from '@reachops/contracts';
import { EvidenceChips, PageHeading, PriorityPill, ProvenanceNote } from './demo-primitives';
import { formatNumber, formatRange, sourceModeLabel } from '@/lib/format';

const OPERATOR_LABEL: Record<string, string> = {
  GTE: '≥',
  GT: '>',
  LTE: '≤',
  LT: '<',
  EQ: '=',
};

const BLOCKED_REASON_LABEL: Record<string, string> = {
  MISSING_INPUT: 'A required metric was unavailable',
  MINIMUM_VOLUME: 'Below the minimum volume threshold',
  PARTIAL_SOURCE: 'A source was incomplete',
  STALE_SOURCE: 'A source was stale',
  INVALID_SOURCE: 'A source was invalid',
  CONDITIONS_NOT_MET: 'Rule conditions were not met',
};

function InputsTable({ observation }: { observation: ObservationCandidate }) {
  return (
    <table className="inputs-table">
      <caption>Metric inputs behind this observation</caption>
      <thead>
        <tr>
          <th scope="col">Evidence</th>
          <th scope="col">Metric</th>
          <th scope="col">Prior</th>
          <th scope="col">Current</th>
          <th scope="col">Change</th>
        </tr>
      </thead>
      <tbody>
        {observation.inputs.map((input) => (
          <tr key={input.evidenceId}>
            <th scope="row">{input.evidenceId}</th>
            <td>{input.metricStableKey}</td>
            <td>{formatNumber(input.priorValue)}</td>
            <td>{formatNumber(input.currentValue)}</td>
            <td>{input.displayChange}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ObservationCard({
  observation,
  recommendation,
}: {
  observation: ObservationCandidate;
  recommendation: DemoRecommendation | undefined;
}) {
  return (
    <article className={`observation-card observation-card--${observation.priority.toLowerCase()}`}>
      <div className="observation-card__top">
        <PriorityPill priority={observation.priority} />
        <span className="rule-chip">
          {observation.ruleKey} · v{observation.ruleVersion}
        </span>
      </div>

      <h3>{observation.title}</h3>
      <p className="observation-summary">{observation.summary}</p>

      <div className="observation-meta">
        <EvidenceChips ids={observation.evidenceIds} />
        <span className="source-chip">
          {[...new Set(observation.sourceModes)].map(sourceModeLabel).join(' + ')}
        </span>
      </div>

      <InputsTable observation={observation} />

      <details className="rule-details">
        <summary>Why this rule fired</summary>
        <ul className="factor-list">
          {observation.severityFactors.map((factor) => (
            <li className={factor.passed ? 'is-passed' : 'is-failed'} key={factor.key}>
              <span aria-hidden="true">{factor.passed ? '✓' : '✕'}</span>
              <span>
                <strong>{factor.key}</strong>
                <small>
                  observed {formatNumber(factor.observed)} {OPERATOR_LABEL[factor.operator]}{' '}
                  {formatNumber(factor.threshold)}
                </small>
              </span>
            </li>
          ))}
        </ul>
        <p className="causal-note">
          Observations describe what changed together. They never assert a cause.
        </p>
      </details>

      {recommendation && (
        <div
          className={`recommendation-block recommendation-block--${recommendation.decision.toLowerCase()}`}
        >
          <div className="recommendation-block__top">
            <span className="eyebrow">Recommendation</span>
            <span className="decision-chip">
              {recommendation.decision === 'APPROVED' ? 'Approved by a human' : 'Awaiting decision'}
            </span>
          </div>
          <strong>{recommendation.title}</strong>
          <p>{recommendation.rationale}</p>
          <div className="recommendation-block__foot">
            {recommendation.decision === 'APPROVED' ? (
              <span>
                Approved by {recommendation.decidedBy} · assigned as{' '}
                <Link href="/actions">{recommendation.linkedActionId}</Link>
              </span>
            ) : (
              <span>No action is assigned until a human approves this recommendation.</span>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

export function WeeklyReviewView({ review }: { review: DemoWeeklyReview }) {
  const recommendationByObservation = new Map(
    review.recommendations.map((recommendation) => [recommendation.observationId, recommendation]),
  );
  const approvedCount = review.recommendations.filter(
    ({ decision }) => decision === 'APPROVED',
  ).length;

  return (
    <div className="weekly-review">
      <PageHeading
        description="Deterministic rules read verified metric comparisons and emit observations. Each observation carries its evidence, its thresholds, and the human decision that followed."
        eyebrow="Evidence before interpretation"
        title="Weekly Review"
        aside={
          <aside className="week-panel" aria-label="Review window">
            <span>Reviewed window</span>
            <strong>{formatRange(review.window.start, review.window.end)}</strong>
            <small>
              {review.window.timezone} · rule engine v{review.ruleVersion}
            </small>
          </aside>
        }
      />

      <ProvenanceNote>
        Rendered from the committed deterministic snapshot. The same rule engine produces these
        observations in the running application; only their REST delivery is a later milestone.
      </ProvenanceNote>

      <dl className="review-stats">
        <div>
          <dt>Observations emitted</dt>
          <dd>{review.observations.length}</dd>
        </div>
        <div>
          <dt>Rules evaluated</dt>
          <dd>{review.evaluations.length}</dd>
        </div>
        <div>
          <dt>Recommendations approved</dt>
          <dd>
            {approvedCount} of {review.recommendations.length}
          </dd>
        </div>
      </dl>

      <section aria-labelledby="observations-title" className="observation-stack">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Ordered by rule priority</span>
            <h2 id="observations-title">What the evidence shows</h2>
          </div>
        </div>
        {review.observations.map((observation) => (
          <ObservationCard
            key={observation.id}
            observation={observation}
            recommendation={recommendationByObservation.get(observation.id)}
          />
        ))}
      </section>

      <div className="review-columns">
        <section aria-labelledby="themes-title" className="theme-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Permitted review excerpts</span>
              <h2 id="themes-title">Themes</h2>
            </div>
          </div>
          <ul className="theme-list">
            {review.reviewThemes.map((theme) => (
              <li key={theme.theme}>
                <div>
                  <strong>{theme.theme}</strong>
                  <small>
                    {theme.count} of a required {theme.minimumCount} excerpts in window
                  </small>
                </div>
                <span className={theme.meetsThreshold ? 'threshold-met' : 'threshold-unmet'}>
                  {theme.meetsThreshold ? 'Threshold met' : 'Below threshold'}
                </span>
              </li>
            ))}
          </ul>
          <p className="causal-note">
            ReachOps never drafts or sends a review response. Themes exist to route a human
            conversation.
          </p>
        </section>

        <section aria-labelledby="gates-title" className="gate-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Quality gates</span>
              <h2 id="gates-title">Rule evaluations</h2>
            </div>
          </div>
          <ul className="gate-list">
            {review.evaluations.map((evaluation) => (
              <li key={evaluation.ruleKey}>
                <div>
                  <strong>{evaluation.ruleKey}</strong>
                  <small>v{evaluation.ruleVersion}</small>
                </div>
                {evaluation.emitted ? (
                  <span className="threshold-met">Emitted</span>
                ) : (
                  <span className="threshold-unmet">
                    {evaluation.blockedReasons
                      .map((reason) => BLOCKED_REASON_LABEL[reason] ?? reason)
                      .join(' · ')}
                  </span>
                )}
              </li>
            ))}
          </ul>
          <p className="causal-note">
            A blocked rule shows why it stayed silent. Silence is a result, not a gap.
          </p>
        </section>
      </div>
    </div>
  );
}
