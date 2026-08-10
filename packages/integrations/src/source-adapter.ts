import type {
  AdapterCapability,
  ConnectionHealth,
  NormalizedBatch,
  SourceMode,
  SourceProvider,
  SourceResource,
  SyncRequest,
} from '@reachops/contracts';

export interface SourceAdapter {
  readonly provider: SourceProvider;
  readonly mode: SourceMode;
  readonly capabilities: readonly AdapterCapability[];
  listResources(): Promise<SourceResource[]>;
  validateConnection(): Promise<ConnectionHealth>;
  sync(request: SyncRequest): Promise<NormalizedBatch>;
}
