import { createHash } from 'node:crypto';
import { NormalizedBatchSchema, type NormalizedBatch } from '@reachops/contracts';
import type { Prisma, PrismaClient } from '@prisma/client';

export interface BatchPersistenceContext {
  workspaceId: string;
  connectionId: string;
  resourceId: string;
  syncRunId: string;
}

export interface BatchPersistenceResult {
  observationCount: number;
  contentItemCount: number;
  importBatchId: string | null;
}

function stableId(prefix: string, value: string): string {
  const digest = createHash('sha256').update(value).digest('hex').slice(0, 24);
  return `${prefix}-${digest}`;
}

function canonicalDimensionHash(dimensions: Record<string, string>): string {
  const canonical = Object.fromEntries(
    Object.entries(dimensions).sort(([left], [right]) => left.localeCompare(right)),
  );
  return `sha256:${createHash('sha256').update(JSON.stringify(canonical)).digest('hex')}`;
}

async function assertPersistenceContext(
  prisma: Prisma.TransactionClient,
  context: BatchPersistenceContext,
  batch: NormalizedBatch,
): Promise<void> {
  const [connection, resource, syncRun] = await Promise.all([
    prisma.dataSourceConnection.findUniqueOrThrow({ where: { id: context.connectionId } }),
    prisma.sourceResource.findUniqueOrThrow({ where: { id: context.resourceId } }),
    prisma.syncRun.findUniqueOrThrow({ where: { id: context.syncRunId } }),
  ]);

  if (
    connection.workspaceId !== context.workspaceId ||
    resource.workspaceId !== context.workspaceId ||
    syncRun.workspaceId !== context.workspaceId ||
    resource.connectionId !== connection.id ||
    syncRun.connectionId !== connection.id ||
    syncRun.resourceId !== resource.id ||
    connection.provider !== batch.provider ||
    connection.mode !== batch.mode ||
    resource.mode !== batch.mode ||
    syncRun.mode !== batch.mode ||
    resource.nativeId !== batch.resourceNativeId
  ) {
    throw new Error('Normalized batch does not match its authorized persistence context.');
  }
}

export async function persistNormalizedBatch(
  prisma: PrismaClient,
  context: BatchPersistenceContext,
  input: unknown,
): Promise<BatchPersistenceResult> {
  const batch = NormalizedBatchSchema.parse(input);

  return prisma.$transaction(
    async (tx) => {
      await assertPersistenceContext(tx, context, batch);

      const definitionIds = new Map<string, string>();
      for (const definition of batch.metricDefinitions) {
        const persisted = await tx.metricDefinition.upsert({
          where: {
            workspaceId_stableKey: {
              workspaceId: context.workspaceId,
              stableKey: definition.stableKey,
            },
          },
          create: {
            id: stableId('metric', `${context.workspaceId}:${definition.stableKey}`),
            workspaceId: context.workspaceId,
            ...definition,
          },
          update: {
            provider: definition.provider,
            nativeName: definition.nativeName,
            displayName: definition.displayName,
            family: definition.family,
            unit: definition.unit,
            aggregationBehavior: definition.aggregationBehavior,
            description: definition.description,
            comparabilityNotes: definition.comparabilityNotes,
            lowerIsBetter: definition.lowerIsBetter,
          },
        });
        definitionIds.set(definition.stableKey, persisted.id);
      }

      for (const observation of batch.observations) {
        const metricDefinitionId = definitionIds.get(observation.metricStableKey);
        if (!metricDefinitionId) {
          throw new Error(`Missing persisted definition ${observation.metricStableKey}.`);
        }
        const dimensionHash = canonicalDimensionHash(observation.dimensions);
        const identity = {
          workspaceId: context.workspaceId,
          connectionId: context.connectionId,
          resourceId: context.resourceId,
          metricDefinitionId,
          grain: observation.period.grain,
          periodStart: new Date(observation.period.start),
          dimensionHash,
        };
        await tx.metricObservation.upsert({
          where: { observationIdentity: identity },
          create: {
            id: stableId('observation', `${context.workspaceId}:${observation.evidenceId}`),
            evidenceId: observation.evidenceId,
            ...identity,
            syncRunId: context.syncRunId,
            mode: batch.mode,
            periodEnd: new Date(observation.period.end),
            timezone: observation.period.timezone,
            dimensions: observation.dimensions,
            value: observation.value,
            retrievedAt: new Date(observation.retrievedAt),
            qualityStatus: observation.quality.status,
            qualityFlags: observation.quality.flags,
            coverageNote: observation.quality.coverageNote,
          },
          update: {
            evidenceId: observation.evidenceId,
            syncRunId: context.syncRunId,
            mode: batch.mode,
            periodEnd: new Date(observation.period.end),
            timezone: observation.period.timezone,
            dimensions: observation.dimensions,
            value: observation.value,
            retrievedAt: new Date(observation.retrievedAt),
            qualityStatus: observation.quality.status,
            qualityFlags: observation.quality.flags,
            coverageNote: observation.quality.coverageNote,
          },
        });
      }

      for (const content of batch.contentItems) {
        await tx.contentItem.upsert({
          where: {
            workspaceId_connectionId_resourceId_nativeId: {
              workspaceId: context.workspaceId,
              connectionId: context.connectionId,
              resourceId: context.resourceId,
              nativeId: content.nativeId,
            },
          },
          create: {
            id: stableId(
              'content',
              `${context.workspaceId}:${context.resourceId}:${content.nativeId}`,
            ),
            workspaceId: context.workspaceId,
            connectionId: context.connectionId,
            resourceId: context.resourceId,
            nativeId: content.nativeId,
            mode: batch.mode,
            type: content.type,
            title: content.title,
            canonicalUrl: content.canonicalUrl,
            attributes: {
              ...content.attributes,
              text: content.text,
              trust: content.trust,
            },
            firstSeenAt: new Date(content.firstSeenAt),
            lastSeenAt: new Date(content.lastSeenAt),
          },
          update: {
            mode: batch.mode,
            type: content.type,
            title: content.title,
            canonicalUrl: content.canonicalUrl,
            attributes: {
              ...content.attributes,
              text: content.text,
              trust: content.trust,
            },
            firstSeenAt: new Date(content.firstSeenAt),
            lastSeenAt: new Date(content.lastSeenAt),
          },
        });
      }

      let importBatchId: string | null = null;
      if (batch.importProvenance) {
        const provenance = batch.importProvenance;
        const imported = await tx.importBatch.upsert({
          where: {
            workspaceId_connectionId_fileHash: {
              workspaceId: context.workspaceId,
              connectionId: context.connectionId,
              fileHash: provenance.fileHash,
            },
          },
          create: {
            id: stableId('import', `${context.workspaceId}:${provenance.fileHash}`),
            workspaceId: context.workspaceId,
            connectionId: context.connectionId,
            resourceId: context.resourceId,
            mode: 'IMPORTED',
            status: 'IMPORTED',
            originalFileName: provenance.originalFileName,
            fileHash: provenance.fileHash,
            schemaVersion: provenance.schemaVersion,
            totalRowCount: provenance.totalRowCount,
            acceptedRowCount: provenance.acceptedRowCount,
            rejectedRowCount: provenance.rejectedRowCount,
            validationSummary: provenance.validationSummary,
            importedAt: new Date(batch.retrievedAt),
          },
          update: {
            status: 'IMPORTED',
            originalFileName: provenance.originalFileName,
            schemaVersion: provenance.schemaVersion,
            totalRowCount: provenance.totalRowCount,
            acceptedRowCount: provenance.acceptedRowCount,
            rejectedRowCount: provenance.rejectedRowCount,
            validationSummary: provenance.validationSummary,
            errorCode: null,
            errorSummary: null,
            importedAt: new Date(batch.retrievedAt),
          },
        });
        importBatchId = imported.id;
      }

      await tx.syncRun.update({
        where: { id: context.syncRunId },
        data: {
          status: 'SUCCEEDED',
          completedAt: new Date(batch.retrievedAt),
          insertedCount: batch.observations.length + batch.contentItems.length,
          updatedCount: 0,
          skippedCount: 0,
          errorCode: null,
          errorSummary: null,
          warnings: batch.warnings,
        },
      });

      return {
        observationCount: batch.observations.length,
        contentItemCount: batch.contentItems.length,
        importBatchId,
      };
    },
    { maxWait: 10_000, timeout: 30_000 },
  );
}
