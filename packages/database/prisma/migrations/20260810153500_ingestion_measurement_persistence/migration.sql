-- CreateEnum
CREATE TYPE "SyncRunStatus" AS ENUM ('REQUESTED', 'RUNNING', 'SUCCEEDED', 'PARTIAL', 'FAILED', 'DEAD_LETTER');

-- CreateEnum
CREATE TYPE "ImportBatchStatus" AS ENUM ('PENDING', 'VALIDATED', 'IMPORTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MetricFamily" AS ENUM ('EXPOSURE', 'ENGAGEMENT', 'SITE_VISIT', 'CONVERSION_EVENT', 'REVIEW', 'COST');

-- CreateEnum
CREATE TYPE "MetricUnit" AS ENUM ('COUNT', 'PERCENTAGE', 'PERCENTAGE_POINT', 'CURRENCY', 'DURATION_SECONDS', 'AVERAGE_POSITION');

-- CreateEnum
CREATE TYPE "AggregationBehavior" AS ENUM ('ADDITIVE', 'NON_ADDITIVE', 'RATE', 'AVERAGE', 'CUMULATIVE');

-- CreateEnum
CREATE TYPE "ObservationGrain" AS ENUM ('DAY', 'WEEK', 'MONTH');

-- CreateEnum
CREATE TYPE "QualityStatus" AS ENUM ('COMPLETE', 'PARTIAL', 'STALE', 'INVALID');

-- CreateEnum
CREATE TYPE "ContentItemType" AS ENUM ('PAGE', 'QUERY', 'POST', 'PROFILE', 'CAMPAIGN_ASSET', 'OTHER');

-- CreateEnum
CREATE TYPE "AnnotationType" AS ENUM ('CAMPAIGN', 'DEPLOYMENT', 'OUTAGE', 'WEATHER', 'BUSINESS_CONTEXT');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "SourceResource" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "nativeId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "mode" "SourceMode" NOT NULL,
    "metadata" JSONB NOT NULL,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncRun" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "mode" "SourceMode" NOT NULL,
    "status" "SyncRunStatus" NOT NULL DEFAULT 'REQUESTED',
    "idempotencyKey" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "insertedCount" INTEGER NOT NULL DEFAULT 0,
    "updatedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "errorCode" TEXT,
    "errorSummary" TEXT,
    "warnings" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncCursor" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "cursorKey" TEXT NOT NULL,
    "cursorValue" JSONB NOT NULL,
    "overlapDays" INTEGER NOT NULL DEFAULT 3,
    "lastAdvancedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncCursor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "uploaderUserId" TEXT,
    "mode" "SourceMode" NOT NULL DEFAULT 'IMPORTED',
    "status" "ImportBatchStatus" NOT NULL DEFAULT 'PENDING',
    "originalFileName" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "schemaVersion" TEXT NOT NULL,
    "totalRowCount" INTEGER NOT NULL DEFAULT 0,
    "acceptedRowCount" INTEGER NOT NULL DEFAULT 0,
    "rejectedRowCount" INTEGER NOT NULL DEFAULT 0,
    "validationSummary" JSONB NOT NULL,
    "errorCode" TEXT,
    "errorSummary" TEXT,
    "importedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricDefinition" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "stableKey" TEXT NOT NULL,
    "provider" "ConnectionProvider" NOT NULL,
    "nativeName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "family" "MetricFamily" NOT NULL,
    "unit" "MetricUnit" NOT NULL,
    "aggregationBehavior" "AggregationBehavior" NOT NULL,
    "description" TEXT NOT NULL,
    "comparabilityNotes" TEXT NOT NULL,
    "lowerIsBetter" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetricDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricObservation" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "metricDefinitionId" TEXT NOT NULL,
    "syncRunId" TEXT NOT NULL,
    "mode" "SourceMode" NOT NULL,
    "grain" "ObservationGrain" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL,
    "dimensions" JSONB NOT NULL,
    "dimensionHash" TEXT NOT NULL,
    "value" DECIMAL(20,6) NOT NULL,
    "retrievedAt" TIMESTAMP(3) NOT NULL,
    "qualityStatus" "QualityStatus" NOT NULL,
    "qualityFlags" TEXT[],
    "coverageNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetricObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "nativeId" TEXT NOT NULL,
    "mode" "SourceMode" NOT NULL,
    "type" "ContentItemType" NOT NULL,
    "title" TEXT NOT NULL,
    "canonicalUrl" TEXT,
    "attributes" JSONB NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "goalId" TEXT,
    "createdByUserId" TEXT,
    "stableKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" "CampaignStatus" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessAnnotation" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "campaignId" TEXT,
    "createdByUserId" TEXT,
    "stableKey" TEXT NOT NULL,
    "type" "AnnotationType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessAnnotation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SourceResource_workspaceId_mode_idx" ON "SourceResource"("workspaceId", "mode");

-- CreateIndex
CREATE INDEX "SourceResource_workspaceId_resourceType_idx" ON "SourceResource"("workspaceId", "resourceType");

-- CreateIndex
CREATE UNIQUE INDEX "SourceResource_workspaceId_connectionId_nativeId_key" ON "SourceResource"("workspaceId", "connectionId", "nativeId");

-- CreateIndex
CREATE UNIQUE INDEX "SourceResource_workspaceId_connectionId_id_key" ON "SourceResource"("workspaceId", "connectionId", "id");

-- CreateIndex
CREATE INDEX "SyncRun_workspaceId_status_requestedAt_idx" ON "SyncRun"("workspaceId", "status", "requestedAt");

-- CreateIndex
CREATE INDEX "SyncRun_workspaceId_connectionId_completedAt_idx" ON "SyncRun"("workspaceId", "connectionId", "completedAt");

-- CreateIndex
CREATE INDEX "SyncRun_correlationId_idx" ON "SyncRun"("correlationId");

-- CreateIndex
CREATE UNIQUE INDEX "SyncRun_connectionId_idempotencyKey_key" ON "SyncRun"("connectionId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "SyncRun_workspaceId_id_key" ON "SyncRun"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "SyncCursor_workspaceId_lastAdvancedAt_idx" ON "SyncCursor"("workspaceId", "lastAdvancedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SyncCursor_workspaceId_connectionId_resourceId_cursorKey_key" ON "SyncCursor"("workspaceId", "connectionId", "resourceId", "cursorKey");

-- CreateIndex
CREATE INDEX "ImportBatch_workspaceId_status_createdAt_idx" ON "ImportBatch"("workspaceId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ImportBatch_uploaderUserId_idx" ON "ImportBatch"("uploaderUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ImportBatch_workspaceId_connectionId_fileHash_key" ON "ImportBatch"("workspaceId", "connectionId", "fileHash");

-- CreateIndex
CREATE INDEX "MetricDefinition_workspaceId_family_idx" ON "MetricDefinition"("workspaceId", "family");

-- CreateIndex
CREATE UNIQUE INDEX "MetricDefinition_workspaceId_stableKey_key" ON "MetricDefinition"("workspaceId", "stableKey");

-- CreateIndex
CREATE UNIQUE INDEX "MetricDefinition_workspaceId_provider_nativeName_key" ON "MetricDefinition"("workspaceId", "provider", "nativeName");

-- CreateIndex
CREATE UNIQUE INDEX "MetricDefinition_workspaceId_id_key" ON "MetricDefinition"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "MetricObservation_workspaceId_metricDefinitionId_periodStar_idx" ON "MetricObservation"("workspaceId", "metricDefinitionId", "periodStart");

-- CreateIndex
CREATE INDEX "MetricObservation_workspaceId_resourceId_periodStart_idx" ON "MetricObservation"("workspaceId", "resourceId", "periodStart");

-- CreateIndex
CREATE INDEX "MetricObservation_workspaceId_syncRunId_idx" ON "MetricObservation"("workspaceId", "syncRunId");

-- CreateIndex
CREATE INDEX "MetricObservation_workspaceId_qualityStatus_idx" ON "MetricObservation"("workspaceId", "qualityStatus");

-- CreateIndex
CREATE UNIQUE INDEX "MetricObservation_workspaceId_evidenceId_key" ON "MetricObservation"("workspaceId", "evidenceId");

-- CreateIndex
CREATE UNIQUE INDEX "MetricObservation_workspaceId_connectionId_resourceId_metri_key" ON "MetricObservation"("workspaceId", "connectionId", "resourceId", "metricDefinitionId", "grain", "periodStart", "dimensionHash");

-- CreateIndex
CREATE INDEX "ContentItem_workspaceId_type_idx" ON "ContentItem"("workspaceId", "type");

-- CreateIndex
CREATE INDEX "ContentItem_workspaceId_canonicalUrl_idx" ON "ContentItem"("workspaceId", "canonicalUrl");

-- CreateIndex
CREATE UNIQUE INDEX "ContentItem_workspaceId_connectionId_resourceId_nativeId_key" ON "ContentItem"("workspaceId", "connectionId", "resourceId", "nativeId");

-- CreateIndex
CREATE INDEX "Campaign_workspaceId_status_startsAt_idx" ON "Campaign"("workspaceId", "status", "startsAt");

-- CreateIndex
CREATE INDEX "Campaign_goalId_idx" ON "Campaign"("goalId");

-- CreateIndex
CREATE INDEX "Campaign_createdByUserId_idx" ON "Campaign"("createdByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_workspaceId_stableKey_key" ON "Campaign"("workspaceId", "stableKey");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_workspaceId_id_key" ON "Campaign"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "BusinessAnnotation_workspaceId_type_startsAt_idx" ON "BusinessAnnotation"("workspaceId", "type", "startsAt");

-- CreateIndex
CREATE INDEX "BusinessAnnotation_campaignId_idx" ON "BusinessAnnotation"("campaignId");

-- CreateIndex
CREATE INDEX "BusinessAnnotation_createdByUserId_idx" ON "BusinessAnnotation"("createdByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessAnnotation_workspaceId_stableKey_key" ON "BusinessAnnotation"("workspaceId", "stableKey");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessGoal_workspaceId_id_key" ON "BusinessGoal"("workspaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "DataSourceConnection_workspaceId_id_key" ON "DataSourceConnection"("workspaceId", "id");

-- AddForeignKey
ALTER TABLE "SourceResource" ADD CONSTRAINT "SourceResource_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceResource" ADD CONSTRAINT "SourceResource_workspaceId_connectionId_fkey" FOREIGN KEY ("workspaceId", "connectionId") REFERENCES "DataSourceConnection"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncRun" ADD CONSTRAINT "SyncRun_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncRun" ADD CONSTRAINT "SyncRun_workspaceId_connectionId_fkey" FOREIGN KEY ("workspaceId", "connectionId") REFERENCES "DataSourceConnection"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncRun" ADD CONSTRAINT "SyncRun_workspaceId_connectionId_resourceId_fkey" FOREIGN KEY ("workspaceId", "connectionId", "resourceId") REFERENCES "SourceResource"("workspaceId", "connectionId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncCursor" ADD CONSTRAINT "SyncCursor_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncCursor" ADD CONSTRAINT "SyncCursor_workspaceId_connectionId_fkey" FOREIGN KEY ("workspaceId", "connectionId") REFERENCES "DataSourceConnection"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncCursor" ADD CONSTRAINT "SyncCursor_workspaceId_connectionId_resourceId_fkey" FOREIGN KEY ("workspaceId", "connectionId", "resourceId") REFERENCES "SourceResource"("workspaceId", "connectionId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_workspaceId_connectionId_fkey" FOREIGN KEY ("workspaceId", "connectionId") REFERENCES "DataSourceConnection"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_workspaceId_connectionId_resourceId_fkey" FOREIGN KEY ("workspaceId", "connectionId", "resourceId") REFERENCES "SourceResource"("workspaceId", "connectionId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_uploaderUserId_fkey" FOREIGN KEY ("uploaderUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricDefinition" ADD CONSTRAINT "MetricDefinition_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricObservation" ADD CONSTRAINT "MetricObservation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricObservation" ADD CONSTRAINT "MetricObservation_workspaceId_connectionId_fkey" FOREIGN KEY ("workspaceId", "connectionId") REFERENCES "DataSourceConnection"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricObservation" ADD CONSTRAINT "MetricObservation_workspaceId_connectionId_resourceId_fkey" FOREIGN KEY ("workspaceId", "connectionId", "resourceId") REFERENCES "SourceResource"("workspaceId", "connectionId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricObservation" ADD CONSTRAINT "MetricObservation_workspaceId_metricDefinitionId_fkey" FOREIGN KEY ("workspaceId", "metricDefinitionId") REFERENCES "MetricDefinition"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricObservation" ADD CONSTRAINT "MetricObservation_workspaceId_syncRunId_fkey" FOREIGN KEY ("workspaceId", "syncRunId") REFERENCES "SyncRun"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_workspaceId_connectionId_fkey" FOREIGN KEY ("workspaceId", "connectionId") REFERENCES "DataSourceConnection"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_workspaceId_connectionId_resourceId_fkey" FOREIGN KEY ("workspaceId", "connectionId", "resourceId") REFERENCES "SourceResource"("workspaceId", "connectionId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_workspaceId_goalId_fkey" FOREIGN KEY ("workspaceId", "goalId") REFERENCES "BusinessGoal"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessAnnotation" ADD CONSTRAINT "BusinessAnnotation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessAnnotation" ADD CONSTRAINT "BusinessAnnotation_workspaceId_campaignId_fkey" FOREIGN KEY ("workspaceId", "campaignId") REFERENCES "Campaign"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessAnnotation" ADD CONSTRAINT "BusinessAnnotation_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Domain checks that Prisma cannot express directly.
ALTER TABLE "SyncRun" ADD CONSTRAINT "SyncRun_valid_window_check" CHECK ("windowEnd" >= "windowStart");
ALTER TABLE "SyncRun" ADD CONSTRAINT "SyncRun_positive_attempt_check" CHECK ("attempt" >= 1);
ALTER TABLE "SyncRun" ADD CONSTRAINT "SyncRun_nonnegative_counts_check" CHECK ("insertedCount" >= 0 AND "updatedCount" >= 0 AND "skippedCount" >= 0);
ALTER TABLE "SyncRun" ADD CONSTRAINT "SyncRun_safe_error_code_check" CHECK ("errorCode" IS NULL OR char_length("errorCode") <= 100);
ALTER TABLE "SyncRun" ADD CONSTRAINT "SyncRun_safe_error_summary_check" CHECK ("errorSummary" IS NULL OR char_length("errorSummary") <= 500);
ALTER TABLE "SyncCursor" ADD CONSTRAINT "SyncCursor_overlap_window_check" CHECK ("overlapDays" >= 3);
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_nonnegative_counts_check" CHECK ("totalRowCount" >= 0 AND "acceptedRowCount" >= 0 AND "rejectedRowCount" >= 0);
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_consistent_counts_check" CHECK ("acceptedRowCount" + "rejectedRowCount" <= "totalRowCount");
ALTER TABLE "MetricObservation" ADD CONSTRAINT "MetricObservation_valid_period_check" CHECK ("periodEnd" >= "periodStart");
ALTER TABLE "MetricObservation" ADD CONSTRAINT "MetricObservation_evidence_id_check" CHECK ("evidenceId" ~ '^EV-[A-Z0-9][A-Z0-9-]*$');
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_valid_period_check" CHECK ("endsAt" IS NULL OR "endsAt" >= "startsAt");
ALTER TABLE "BusinessAnnotation" ADD CONSTRAINT "BusinessAnnotation_valid_period_check" CHECK ("endsAt" IS NULL OR "endsAt" >= "startsAt");
