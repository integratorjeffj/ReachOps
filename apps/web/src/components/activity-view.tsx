import type { DemoActivityEvent } from '@reachops/contracts';
import { PageHeading, ProvenanceNote } from './demo-primitives';
import { EvidenceChipList } from './evidence-drawer';
import { formatTimestamp } from '@/lib/format';

const ACTOR_LABEL: Record<string, string> = {
  SYSTEM: 'System',
  HUMAN: 'Human',
  AI: 'AI',
};

const ACTOR_GLYPH: Record<string, string> = {
  SYSTEM: '⚙',
  HUMAN: '◆',
  AI: '✳',
};

function eventTypeLabel(eventType: string): string {
  return eventType
    .toLowerCase()
    .split('_')
    .map((word, index) => (index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ');
}

export function ActivityView({ activity }: { activity: DemoActivityEvent[] }) {
  const systemCount = activity.filter(({ actorType }) => actorType === 'SYSTEM').length;
  const humanCount = activity.filter(({ actorType }) => actorType === 'HUMAN').length;

  return (
    <div className="activity-workspace">
      <PageHeading
        description="An append-oriented record of what the system did and what people decided. System synchronization and human judgment are never blended into one anonymous action."
        eyebrow="Append-oriented history"
        title="Activity"
        aside={
          <aside className="week-panel" aria-label="Activity summary">
            <span>Recorded events</span>
            <strong>{activity.length}</strong>
            <small>
              {systemCount} system · {humanCount} human
            </small>
          </aside>
        }
      />

      <ProvenanceNote>
        Rendered from the committed deterministic snapshot. No AI-authored events appear because the
        bounded AI layer is a later milestone.
      </ProvenanceNote>

      <ol className="activity-timeline">
        {activity.map((event) => (
          <li
            className={`activity-item activity-item--${event.actorType.toLowerCase()}`}
            key={event.id}
          >
            <span aria-hidden="true" className="activity-glyph">
              {ACTOR_GLYPH[event.actorType]}
            </span>
            <div className="activity-body">
              <div className="activity-body__top">
                <span className="actor-chip">
                  {ACTOR_LABEL[event.actorType]} · {event.actorName}
                </span>
                <time dateTime={event.occurredAt}>{formatTimestamp(event.occurredAt)}</time>
              </div>
              <strong>{eventTypeLabel(event.eventType)}</strong>
              <p>{event.summary}</p>
              <div className="activity-body__foot">
                <span className="entity-chip">
                  {event.entityType} · {event.entityId}
                </span>
                <EvidenceChipList ids={event.evidenceIds} label={`Evidence for ${event.id}`} />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
