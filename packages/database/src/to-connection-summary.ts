import type {
  ConnectionProvider,
  ConnectionStatus,
  DataSourceConnection,
  SourceMode,
} from '@prisma/client';

type SummarySource = Pick<
  DataSourceConnection,
  | 'id'
  | 'workspaceId'
  | 'provider'
  | 'mode'
  | 'status'
  | 'displayName'
  | 'selectedResourceId'
  | 'scopes'
  | 'lastSuccessAt'
>;

export interface ConnectionSummary {
  id: string;
  workspaceId: string;
  provider: ConnectionProvider;
  mode: SourceMode;
  status: ConnectionStatus;
  displayName: string;
  selectedResourceId: string | null;
  scopes: string[];
  lastSuccessAt: string | null;
}

export function toConnectionSummary(connection: SummarySource): ConnectionSummary {
  return {
    id: connection.id,
    workspaceId: connection.workspaceId,
    provider: connection.provider,
    mode: connection.mode,
    status: connection.status,
    displayName: connection.displayName,
    selectedResourceId: connection.selectedResourceId,
    scopes: [...connection.scopes],
    lastSuccessAt: connection.lastSuccessAt?.toISOString() ?? null,
  };
}
