'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { DemoBriefingExclusion, DemoBriefingFact, DemoFactPacket } from '@reachops/contracts';
import { PageHeading } from './demo-primitives';
import { EvidenceChipList } from './evidence-drawer';
import { demoBriefing } from '@/lib/demo/briefing';
import { formatRange } from '@/lib/format';

/**
 * The written briefing.
 *
 * Composed from the fact packet and from nothing else. Every paragraph is a statement that passed
 * the admission rules, carrying the evidence it was built on; every candidate that failed one is
 * printed underneath the section it would have belonged to.
 *
 * The exclusions are deliberately not hidden behind a control. A briefing that tucks its omissions
 * into a collapsed panel reads, at a glance, exactly like a briefing with nothing to omit — which
 * is the impression this surface exists to avoid giving.
 */

const DIRECTION_LABEL: Record<DemoBriefingFact['direction'], string> = {
  BETTER: 'Moving the way the business wants',
  WORSE: 'Moving against the business',
  FLAT: 'No change',
  NOT_COMPARABLE: '',
};

const REASON_LABEL: Record<DemoBriefingExclusion['reason'], string> = {
  NO_PRIOR_PERIOD: 'No prior period',
  QUALITY_INVALID: 'Marked invalid',
  QUALITY_STALE: 'Stale',
  BELOW_VOLUME_FLOOR: 'Too few events',
  RULE_CONDITIONS_NOT_MET: 'Rule found nothing',
  RULE_BLOCKED_BY_QUALITY: 'Rule blocked by quality gate',
  NOT_YET_MEASURED: 'Not yet measured',
  NO_METRIC_PERSISTED: 'No metric was ever recorded',
  NO_OUTCOME_RECORDED: 'Never measured',
  NO_SUPPORTED_EXPLANATION: 'No supported explanation',
  NO_MEASUREMENT_ATTACHED: 'Nothing measures this',
  SOURCE_HAS_NO_HISTORY: 'Source has no history',
};

const LINK_HREF: Record<string, string> = {
  KPI: '/',
  GOAL: '/',
  OBSERVATION: '/opportunities',
  OPPORTUNITY: '/opportunities',
  ACTION: '/actions',
  OUTCOME: '/reports',
  CONNECTION: '/connections',
};

function Fact({ fact }: { fact: DemoBriefingFact }) {
  const direction = DIRECTION_LABEL[fact.direction];

  return (
    <article className="briefing-fact">
      <p className="briefing-fact__statement">{fact.statement}</p>

      {direction !== '' && (
        <p className={`briefing-direction briefing-direction--${fact.direction.toLowerCase()}`}>
          {/* Stated in words. The colour repeats this; it never carries it alone. */}
          {direction}
        </p>
      )}

      {fact.hypothesis && (
        <p className="briefing-hypothesis">
          <span className="briefing-hypothesis__tag">
            Hypothesis · {fact.hypothesis.confidence.toLowerCase()} confidence
          </span>{' '}
          {fact.hypothesis.text}
        </p>
      )}

      {fact.caveat && <p className="evidence-caveat">{fact.caveat}</p>}

      <div className="briefing-fact__foot">
        <EvidenceChipList ids={fact.evidenceIds} label={`Evidence for ${fact.id}`} />
        {fact.link && (
          <Link className="briefing-fact__link" href={LINK_HREF[fact.link.entityType] ?? '/'}>
            {fact.link.entityId}
          </Link>
        )}
      </div>
    </article>
  );
}

function Exclusions({
  exclusions,
  sectionKey,
  title,
}: {
  exclusions: DemoBriefingExclusion[];
  sectionKey: string;
  title: string;
}) {
  if (exclusions.length === 0) return null;

  return (
    <section aria-labelledby={`withheld-${sectionKey}`} className="briefing-withheld">
      <h3 id={`withheld-${sectionKey}`}>
        Not said here
        {/* Named per section so several of these stay distinguishable as landmarks. */}
        <span className="visually-hidden"> in {title}</span>
        <span className="briefing-withheld__count">{exclusions.length}</span>
      </h3>
      <ul>
        {exclusions.map((exclusion) => (
          <li key={exclusion.id}>
            <div className="briefing-withheld__head">
              <strong>{exclusion.subject}</strong>
              <span className="briefing-reason">{REASON_LABEL[exclusion.reason]}</span>
            </div>
            <p>{exclusion.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Renders the packet as plain text, so what leaves the product is what the product stands behind. */
function toPlainText(packet: DemoFactPacket): string {
  const lines: string[] = ['ReachOps briefing', ''];

  for (const section of packet.sections) {
    lines.push(section.title.toUpperCase(), '');
    if (section.facts.length === 0) lines.push(section.emptyStatement, '');

    for (const fact of section.facts) {
      lines.push(fact.statement);
      if (fact.hypothesis) {
        lines.push(
          `  Hypothesis (${fact.hypothesis.confidence.toLowerCase()}): ${fact.hypothesis.text}`,
        );
      }
      if (fact.caveat) lines.push(`  ${fact.caveat}`);
      if (fact.evidenceIds.length > 0) lines.push(`  Evidence: ${fact.evidenceIds.join(', ')}`);
      lines.push('');
    }

    if (section.exclusions.length > 0) {
      lines.push(`Not said here (${section.exclusions.length}):`);
      for (const exclusion of section.exclusions) {
        lines.push(
          `  ${exclusion.subject} — ${REASON_LABEL[exclusion.reason]}. ${exclusion.detail}`,
        );
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

export function BriefingView() {
  const packet = demoBriefing;
  const [copied, setCopied] = useState(false);
  const plainText = useMemo(() => toPlainText(packet), [packet]);

  async function copy() {
    await navigator.clipboard.writeText(plainText);
    setCopied(true);
  }

  return (
    <div className="workspace">
      <PageHeading
        description="Composed from the evidence this workspace already holds, with everything it could not stand behind listed alongside."
        eyebrow="Briefing"
        title="This week, in writing"
      />

      <section aria-labelledby="how-written" className="coverage-callout">
        <h2 id="how-written">How this was written</h2>
        <p>
          ReachOps assembles a fact packet first — every citable number that passed its admission
          rules — and composes this page from that packet alone. In a deployed installation the
          packet is what would be handed to a language model, with the instruction to write only
          from it. This public demonstration renders the same packet through fixed templates, so
          what you read below is exactly what the packet supports and nothing beyond it.
        </p>
        <dl className="coverage-figures">
          <div>
            <dt>Window</dt>
            <dd>{formatRange(packet.window.start, packet.window.end)}</dd>
          </div>
          <div>
            <dt>Statements</dt>
            <dd>{packet.totals.factCount}</dd>
          </div>
          <div>
            <dt>Withheld</dt>
            <dd>{packet.totals.exclusionCount}</dd>
          </div>
          <div>
            <dt>Evidence cited</dt>
            <dd>{packet.totals.evidenceCitedCount}</dd>
          </div>
        </dl>
        <div className="briefing-actions">
          <button className="button button--quiet" onClick={copy} type="button">
            Copy briefing as text
          </button>
          <span aria-live="polite" className="briefing-copied">
            {copied ? 'Copied, including everything withheld.' : ''}
          </span>
        </div>
      </section>

      {packet.sections.map((section) => (
        <section
          aria-labelledby={`briefing-${section.key}`}
          className="briefing-section"
          key={section.key}
        >
          <div className="panel-heading">
            <div>
              <span className="eyebrow">{section.purpose}</span>
              <h2 id={`briefing-${section.key}`}>{section.title}</h2>
            </div>
          </div>

          {section.facts.length === 0 ? (
            <p className="briefing-empty">{section.emptyStatement}</p>
          ) : (
            <div className="briefing-facts">
              {section.facts.map((fact) => (
                <Fact fact={fact} key={fact.id} />
              ))}
            </div>
          )}

          <Exclusions
            exclusions={section.exclusions}
            sectionKey={section.key}
            title={section.title}
          />
        </section>
      ))}

      <section aria-labelledby="assembly-rules" className="briefing-section">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Published, not just applied</span>
            <h2 id="assembly-rules">The rules this briefing was held to</h2>
          </div>
        </div>

        <h3>What may be said</h3>
        <dl className="briefing-rules">
          {packet.admissionRules.map((rule) => (
            <div key={rule.key}>
              <dt>{rule.title}</dt>
              <dd>{rule.description}</dd>
            </div>
          ))}
        </dl>

        <h3>What may never be said</h3>
        <ul className="briefing-boundaries">
          {packet.boundaries.map((boundary) => (
            <li key={boundary}>{boundary}</li>
          ))}
        </ul>

        <p className="causal-note">
          Rule set {packet.packetRuleVersion} · dataset {packet.datasetVersion}. Changing a rule
          changes what this page is allowed to claim, which is why the version travels with it.
        </p>
      </section>
    </div>
  );
}
