'use client';

import { useMemo, useState } from 'react';
import type { DemoAiCheck, DemoAiPrompt } from '@reachops/contracts';
import { Drawer } from './drawer';
import { FilterChips } from './data-table';
import { demoSearch } from '@/lib/demo/search';
import { formatCalendarDate, formatNumber } from '@/lib/format';

/**
 * AI answer visibility.
 *
 * The design problem here is the opposite of every other workspace: there is very little to show
 * and enormous temptation to show more than exists. So the panel leads with what it cannot tell
 * you, keeps every count attached to its denominator, and never renders a bar, a trend or a score.
 *
 * A prompt is a row of individual checks rather than a metric with a history, because that is what
 * the data actually is — a handful of samples from a non-deterministic system.
 */

const ASSISTANT_LABEL: Record<string, string> = {
  CHATGPT: 'ChatGPT',
  PERPLEXITY: 'Perplexity',
  GOOGLE_AI_OVERVIEW: 'Google AI Overview',
  CLAUDE: 'Claude',
};

const INTENT_LABEL: Record<string, string> = {
  INFORMATIONAL: 'Informational',
  COMMERCIAL: 'Commercial',
  TRANSACTIONAL: 'Transactional',
  NAVIGATIONAL: 'Navigational',
};

const PROMPT_FILTERS = [
  {
    key: 'cited',
    label: 'Cited at least once',
    match: (prompt: DemoAiPrompt) => prompt.citedCount > 0,
  },
  {
    key: 'never',
    label: 'Never cited',
    match: (prompt: DemoAiPrompt) => prompt.citedCount === 0,
  },
  {
    key: 'changed',
    label: 'Differs from last check',
    match: (prompt: DemoAiPrompt) => prompt.changedAssistants.length > 0,
  },
  {
    key: 'thin',
    label: 'Too few checks',
    match: (prompt: DemoAiPrompt) => prompt.thinEvidence,
  },
];

/** One recorded run. Never styled as a measurement; it is a note about what an answer said once. */
function Check({ check }: { check: DemoAiCheck }) {
  const outcome = check.brandCited
    ? 'Cited'
    : check.brandMentioned
      ? 'Named, not linked'
      : 'Absent';

  return (
    <li className="ai-check">
      <div className="ai-check__head">
        <span className="ai-check__assistant">{ASSISTANT_LABEL[check.assistant]}</span>
        <span className="ai-check__date">{formatCalendarDate(check.checkedOn)}</span>
        <span
          className={`ai-outcome ai-outcome--${outcome.toLowerCase().replace(/[^a-z]+/g, '-')}`}
        >
          {outcome}
        </span>
      </div>
      <p className="ai-check__summary">{check.answerSummary}</p>
      <div className="ai-check__meta">
        {check.citedPath && <code className="table-path">{check.citedPath}</code>}
        {check.citationOrder !== null && (
          <span className="ai-check__order">
            Source {check.citationOrder} in the list
            {/* Recorded because it was visible. It is an assembly order, not a rank. */}
            <small>assembly order, not a ranking</small>
          </span>
        )}
        {check.competitorsNamed.length > 0 && (
          <span className="ai-check__competitors">
            Also named: {check.competitorsNamed.join(', ')}
          </span>
        )}
      </div>
    </li>
  );
}

function PromptDrawer({ prompt, onClose }: { prompt: DemoAiPrompt | null; onClose: () => void }) {
  if (!prompt) return null;

  return (
    <Drawer
      eyebrow={`${INTENT_LABEL[prompt.intent]}${prompt.branded ? ' · branded' : ''}`}
      onClose={onClose}
      open
      title={prompt.prompt}
    >
      <div className="action-detail">
        <section aria-labelledby="ai-why-title">
          <h3 id="ai-why-title">Why this prompt is tracked</h3>
          <p className="evidence-prose">{prompt.reasonTracked}</p>
        </section>

        <section aria-labelledby="ai-record-title">
          <h3 id="ai-record-title">What each check found</h3>
          <p className="evidence-caveat">
            Cited in {prompt.citationRatioLabel} checks. Every one is a single run by one operator;
            the same prompt run again may answer differently for reasons that have nothing to do
            with this business.
          </p>
          <ul className="ai-checks">
            {prompt.checks.map((check) => (
              <Check check={check} key={check.id} />
            ))}
          </ul>
        </section>

        {prompt.changedAssistants.length > 0 && (
          <section aria-labelledby="ai-changed-title">
            <h3 id="ai-changed-title">Differs from the previous check</h3>
            <p className="evidence-prose">
              {prompt.changedAssistants.map((key) => ASSISTANT_LABEL[key]).join(', ')} returned a
              different result than last time.
            </p>
            <p className="evidence-caveat">
              On a panel this small, one difference is within the ordinary variation of a
              non-deterministic system. It is a reason to keep checking, not evidence that anything
              about the site changed.
            </p>
          </section>
        )}
      </div>
    </Drawer>
  );
}

export function AiAnswersTab() {
  const { ai } = demoSearch;
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);

  const prompts = useMemo(() => {
    const filter = PROMPT_FILTERS.find(({ key }) => key === activeFilter);
    return filter ? ai.prompts.filter(filter.match) : ai.prompts;
  }, [ai.prompts, activeFilter]);

  const filters = PROMPT_FILTERS.map(({ key, label, match }) => ({
    key,
    label,
    count: ai.prompts.filter(match).length,
  }));

  const openPrompt = ai.prompts.find(({ key }) => key === openKey) ?? null;

  return (
    <div className="tab-panel-body">
      <section aria-labelledby="ai-panel-title" className="coverage-callout">
        <h2 id="ai-panel-title">About this panel</h2>
        <p>{ai.panelNote}</p>
        <dl className="coverage-figures">
          <div>
            <dt>Mode</dt>
            <dd>Simulated</dd>
          </div>
          <div>
            <dt>Prompts tracked</dt>
            <dd>{ai.totals.promptCount}</dd>
          </div>
          <div>
            <dt>Checks recorded</dt>
            <dd>{ai.totals.checkCount}</dd>
          </div>
          <div>
            <dt>Never cited</dt>
            <dd>
              {ai.totals.neverCitedPromptCount} of {ai.totals.promptCount}
            </dd>
          </div>
        </dl>
      </section>

      {/*
       * Placed above the findings rather than below them. In this workspace the absent metrics are
       * more important than the present ones, because they are what a reader has been trained to
       * expect and what a competing product would invent.
       */}
      <section aria-labelledby="ai-unavailable-title" className="ai-unavailable">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Read this first</span>
            <h2 id="ai-unavailable-title">What this cannot tell you</h2>
          </div>
        </div>
        <dl>
          {ai.unavailable.map((entry) => (
            <div key={entry.metric}>
              <dt>{entry.metric}</dt>
              <dd>{entry.reason}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="ai-prompts-title" className="posts-section">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">{ai.totals.checkCount} recorded checks</span>
            <h2 id="ai-prompts-title">Tracked prompts</h2>
          </div>
        </div>
        <FilterChips active={activeFilter} filters={filters} onToggle={setActiveFilter} />

        <ul className="ai-prompts">
          {prompts.map((prompt) => (
            <li key={prompt.key}>
              <button className="ai-prompt" onClick={() => setOpenKey(prompt.key)} type="button">
                <span className="ai-prompt__text">{prompt.prompt}</span>
                <span className="ai-prompt__meta">
                  <span className="meta-chip">{INTENT_LABEL[prompt.intent]}</span>
                  <span className="ai-prompt__ratio">Cited in {prompt.citationRatioLabel}</span>
                  {prompt.thinEvidence && (
                    <span className="ai-prompt__thin">Too few checks to read anything into</span>
                  )}
                  {prompt.changedAssistants.length > 0 && (
                    <span className="ai-prompt__changed">Differs from last check</span>
                  )}
                </span>
                <span className="ai-prompt__assistants">
                  {prompt.assistantsChecked.map((key) => ASSISTANT_LABEL[key]).join(' · ')}
                  {prompt.lastCheckedOn && ` · last ${formatCalendarDate(prompt.lastCheckedOn)}`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="ai-assistants-title" className="posts-section">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">How each check was made</span>
            <h2 id="ai-assistants-title">Assistants on the panel</h2>
          </div>
        </div>
        <dl className="ai-assistants">
          {ai.assistants.map((assistant) => (
            <div key={assistant.key}>
              <dt>
                {assistant.displayName}
                <span className="meta-chip">
                  {assistant.showsSources ? 'Shows sources' : 'No source links'}
                </span>
              </dt>
              <dd>
                <p>{assistant.method}</p>
                <p className="evidence-caveat">{assistant.limitation}</p>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="ai-referrals-title" className="posts-section">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">The one measured quantity here</span>
            <h2 id="ai-referrals-title">Sessions arriving from assistants</h2>
          </div>
        </div>
        <table className="vitals-table">
          <caption className="visually-hidden">Sessions referred by AI assistants</caption>
          <thead>
            <tr>
              <th scope="col">Assistant</th>
              <th scope="col">Sessions</th>
              <th scope="col">Prior week</th>
              <th scope="col">Change</th>
            </tr>
          </thead>
          <tbody>
            {ai.referrals.map((referral) => (
              <tr key={referral.assistant}>
                <th scope="row">{ASSISTANT_LABEL[referral.assistant]}</th>
                <td className="is-numeric">{formatNumber(referral.sessions)}</td>
                <td className="is-numeric">{formatNumber(referral.priorSessions)}</td>
                <td className="is-numeric">
                  {referral.change === 0
                    ? '—'
                    : `${referral.change > 0 ? '+' : '−'}${Math.abs(referral.change)}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="evidence-caveat">
          <strong>{ai.referralShareLabel}</strong> for this window. {ai.referralNote}
        </p>
      </section>

      <PromptDrawer onClose={() => setOpenKey(null)} prompt={openPrompt} />
    </div>
  );
}
