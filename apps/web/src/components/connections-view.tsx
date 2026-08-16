import type { DemoConnection } from '@reachops/contracts';
import { ModePill, PageHeading, ProvenanceNote } from './demo-primitives';
import { formatNumber, formatRange, formatTimestamp } from '@/lib/format';

const CAPABILITY_LABEL: Record<string, string> = {
  METRICS: 'Metrics',
  CONTENT: 'Content',
  IMPORT: 'Import',
};

function ConnectionCard({ connection }: { connection: DemoConnection }) {
  return (
    <article className={`connection-card connection-card--${connection.mode.toLowerCase()}`}>
      <div className="connection-card__top">
        <div>
          <h3>{connection.displayName}</h3>
          <small>{connection.provider}</small>
        </div>
        <ModePill mode={connection.mode} />
      </div>

      <p
        className={`connection-data-state connection-data-state--${connection.dataState.toLowerCase()}`}
      >
        <strong>
          {connection.dataState === 'ACTIVE'
            ? 'Connected · Reporting history available'
            : 'Connected · No imported performance history'}
        </strong>
        <span>{connection.dataStateNote}</span>
      </p>

      <dl className="connection-facts">
        <div>
          <dt>Resource</dt>
          <dd>
            {connection.nativeId}
            <small>{connection.resourceType}</small>
          </dd>
        </div>
        <div>
          <dt>Last synchronized</dt>
          <dd>
            {connection.lastSyncedAt ? formatTimestamp(connection.lastSyncedAt) : 'Never'}
            <small>{formatRange(connection.syncWindow.start, connection.syncWindow.end)}</small>
          </dd>
        </div>
        <div>
          <dt>Observations</dt>
          <dd>
            {formatNumber(connection.observationCount)}
            <small>{connection.metricKeys.length} metric definitions</small>
          </dd>
        </div>
      </dl>

      <div className="connection-tags">
        <div>
          <span className="tag-label">Capabilities</span>
          <ul>
            {connection.capabilities.map((capability) => (
              <li key={capability}>{CAPABILITY_LABEL[capability] ?? capability}</li>
            ))}
          </ul>
        </div>
        <div>
          <span className="tag-label">Authorized scopes</span>
          {connection.scopes.length > 0 ? (
            <ul>
              {connection.scopes.map((scope) => (
                <li key={scope}>{scope}</li>
              ))}
            </ul>
          ) : (
            <p className="no-scopes">None requested</p>
          )}
        </div>
      </div>

      <details className="connection-details">
        <summary>Metric definitions and authorization</summary>
        <ul className="metric-key-list">
          {connection.metricKeys.map((key) => (
            <li key={key}>{key}</li>
          ))}
        </ul>
        <p className="authorization-note">{connection.authorizationNote}</p>
      </details>

      <p className="live-capability">
        {connection.liveCapable
          ? 'Live-capable adapter: designed for a read-only production connection, currently serving fixture data.'
          : 'Not live-capable in the approved portfolio scope.'}
      </p>
    </article>
  );
}

export function ConnectionsView({ connections }: { connections: DemoConnection[] }) {
  const liveCapable = connections.filter(({ liveCapable: capable }) => capable).length;
  const totalObservations = connections.reduce(
    (total, connection) => total + connection.observationCount,
    0,
  );

  return (
    <div className="connections-workspace">
      <PageHeading
        description="Source mode travels with every value ReachOps derives. Simulated and imported data can never be mistaken for a live, authorized connection."
        eyebrow="Visible integration trust"
        title="Connections"
        aside={
          <aside className="week-panel" aria-label="Connection summary">
            <span>Connected sources</span>
            <strong>{connections.length}</strong>
            <small>
              {liveCapable} live-capable · {formatNumber(totalObservations)} observations
            </small>
          </aside>
        }
      />

      <ProvenanceNote>
        No live Google, Meta, or LinkedIn authorization is claimed. Every connection below is
        simulated or imported, and each card states its own limits.
      </ProvenanceNote>

      <section aria-labelledby="connections-title">
        <div className="section-heading compact-heading">
          <div>
            <span className="eyebrow">Authorized scope and freshness</span>
            <h2 id="connections-title">Connected sources</h2>
          </div>
        </div>
        <div className="connection-grid">
          {connections.map((connection) => (
            <ConnectionCard connection={connection} key={connection.connectionId} />
          ))}
        </div>
      </section>
    </div>
  );
}
