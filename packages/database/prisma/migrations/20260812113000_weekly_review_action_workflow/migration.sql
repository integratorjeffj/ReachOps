-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('PROPOSED', 'APPROVED', 'DISMISSED', 'MONITORING');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "WeeklyReview" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL,
    "factVersion" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObservationCandidate" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "weeklyReviewId" TEXT NOT NULL,
    "ruleKey" TEXT NOT NULL,
    "ruleVersion" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "inputs" JSONB NOT NULL,
    "severityFactors" JSONB NOT NULL,
    "qualityStatus" "QualityStatus" NOT NULL,
    "qualityFlags" TEXT[],
    "sourceModes" "SourceMode"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ObservationCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceLink" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "weeklyReviewId" TEXT NOT NULL,
    "observationCandidateId" TEXT NOT NULL,
    "metricObservationId" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "weeklyReviewId" TEXT NOT NULL,
    "observationCandidateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'PROPOSED',
    "decidedByUserId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionRationale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationEvidence" (
    "recommendationId" TEXT NOT NULL,
    "evidenceLinkId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,

    CONSTRAINT "RecommendationEvidence_pkey" PRIMARY KEY ("recommendationId","evidenceLinkId")
);

-- CreateTable
CREATE TABLE "ActionItem" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "ActionStatus" NOT NULL DEFAULT 'OPEN',
    "ownerUserId" TEXT,
    "dueAt" TIMESTAMP(3),
    "reviewAt" TIMESTAMP(3),
    "evidenceIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionEvent" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "actionItemId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "eventType" TEXT NOT NULL,
    "fromStatus" "ActionStatus",
    "toStatus" "ActionStatus",
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeeklyReview_workspaceId_windowEnd_idx" ON "WeeklyReview"("workspaceId", "windowEnd");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyReview_workspaceId_windowStart_windowEnd_factVersion_key" ON "WeeklyReview"("workspaceId", "windowStart", "windowEnd", "factVersion");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyReview_workspaceId_id_key" ON "WeeklyReview"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "ObservationCandidate_workspaceId_priority_idx" ON "ObservationCandidate"("workspaceId", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "ObservationCandidate_workspaceId_weeklyReviewId_ruleKey_rul_key" ON "ObservationCandidate"("workspaceId", "weeklyReviewId", "ruleKey", "ruleVersion");

-- CreateIndex
CREATE UNIQUE INDEX "ObservationCandidate_workspaceId_id_key" ON "ObservationCandidate"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "EvidenceLink_workspaceId_evidenceId_idx" ON "EvidenceLink"("workspaceId", "evidenceId");

-- CreateIndex
CREATE UNIQUE INDEX "EvidenceLink_workspaceId_observationCandidateId_metricObser_key" ON "EvidenceLink"("workspaceId", "observationCandidateId", "metricObservationId");

-- CreateIndex
CREATE UNIQUE INDEX "EvidenceLink_workspaceId_id_key" ON "EvidenceLink"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "Recommendation_workspaceId_status_idx" ON "Recommendation"("workspaceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Recommendation_workspaceId_id_key" ON "Recommendation"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "RecommendationEvidence_workspaceId_idx" ON "RecommendationEvidence"("workspaceId");

-- CreateIndex
CREATE INDEX "ActionItem_workspaceId_status_dueAt_idx" ON "ActionItem"("workspaceId", "status", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "ActionItem_workspaceId_id_key" ON "ActionItem"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "ActionEvent_workspaceId_actionItemId_createdAt_idx" ON "ActionEvent"("workspaceId", "actionItemId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MetricObservation_workspaceId_id_key" ON "MetricObservation"("workspaceId", "id");

-- AddForeignKey
ALTER TABLE "WeeklyReview" ADD CONSTRAINT "WeeklyReview_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObservationCandidate" ADD CONSTRAINT "ObservationCandidate_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObservationCandidate" ADD CONSTRAINT "ObservationCandidate_workspaceId_weeklyReviewId_fkey" FOREIGN KEY ("workspaceId", "weeklyReviewId") REFERENCES "WeeklyReview"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceLink" ADD CONSTRAINT "EvidenceLink_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceLink" ADD CONSTRAINT "EvidenceLink_workspaceId_weeklyReviewId_fkey" FOREIGN KEY ("workspaceId", "weeklyReviewId") REFERENCES "WeeklyReview"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceLink" ADD CONSTRAINT "EvidenceLink_workspaceId_observationCandidateId_fkey" FOREIGN KEY ("workspaceId", "observationCandidateId") REFERENCES "ObservationCandidate"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceLink" ADD CONSTRAINT "EvidenceLink_workspaceId_metricObservationId_fkey" FOREIGN KEY ("workspaceId", "metricObservationId") REFERENCES "MetricObservation"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_workspaceId_weeklyReviewId_fkey" FOREIGN KEY ("workspaceId", "weeklyReviewId") REFERENCES "WeeklyReview"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_workspaceId_observationCandidateId_fkey" FOREIGN KEY ("workspaceId", "observationCandidateId") REFERENCES "ObservationCandidate"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationEvidence" ADD CONSTRAINT "RecommendationEvidence_workspaceId_recommendationId_fkey" FOREIGN KEY ("workspaceId", "recommendationId") REFERENCES "Recommendation"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationEvidence" ADD CONSTRAINT "RecommendationEvidence_workspaceId_evidenceLinkId_fkey" FOREIGN KEY ("workspaceId", "evidenceLinkId") REFERENCES "EvidenceLink"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_workspaceId_recommendationId_fkey" FOREIGN KEY ("workspaceId", "recommendationId") REFERENCES "Recommendation"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionEvent" ADD CONSTRAINT "ActionEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionEvent" ADD CONSTRAINT "ActionEvent_workspaceId_actionItemId_fkey" FOREIGN KEY ("workspaceId", "actionItemId") REFERENCES "ActionItem"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionEvent" ADD CONSTRAINT "ActionEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Generated review identity and evidence snapshots are immutable source-of-record data.
CREATE FUNCTION "reachops_reject_weekly_review_identity_update"() RETURNS trigger AS $$
BEGIN
  IF NEW."workspaceId" IS DISTINCT FROM OLD."workspaceId"
     OR NEW."windowStart" IS DISTINCT FROM OLD."windowStart"
     OR NEW."windowEnd" IS DISTINCT FROM OLD."windowEnd"
     OR NEW."timezone" IS DISTINCT FROM OLD."timezone"
     OR NEW."factVersion" IS DISTINCT FROM OLD."factVersion"
     OR NEW."generatedAt" IS DISTINCT FROM OLD."generatedAt" THEN
    RAISE EXCEPTION 'weekly review identity is immutable after generation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "WeeklyReview_identity_immutable"
BEFORE UPDATE ON "WeeklyReview"
FOR EACH ROW EXECUTE FUNCTION "reachops_reject_weekly_review_identity_update"();

CREATE FUNCTION "reachops_reject_evidence_link_mutation"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'evidence links are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "EvidenceLink_immutable_update"
BEFORE UPDATE ON "EvidenceLink"
FOR EACH ROW EXECUTE FUNCTION "reachops_reject_evidence_link_mutation"();
