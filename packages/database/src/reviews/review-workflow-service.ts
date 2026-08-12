import type { ObservationCandidate } from '@reachops/contracts';
import type { PrismaClient, RecommendationStatus } from '@prisma/client';

export class WorkflowInvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkflowInvariantError';
  }
}

const allowedRecommendationTransitions: Record<RecommendationStatus, RecommendationStatus[]> = {
  PROPOSED: ['APPROVED', 'DISMISSED', 'MONITORING'],
  APPROVED: [],
  DISMISSED: [],
  MONITORING: ['APPROVED', 'DISMISSED'],
};

export class ReviewWorkflowService {
  constructor(private readonly prisma: PrismaClient) {}

  createReview(input: {
    workspaceId: string;
    windowStart: Date;
    windowEnd: Date;
    timezone: string;
    factVersion: string;
    candidates: ObservationCandidate[];
  }) {
    return this.prisma.$transaction(async (tx) => {
      const review = await tx.weeklyReview.create({
        data: {
          workspaceId: input.workspaceId,
          windowStart: input.windowStart,
          windowEnd: input.windowEnd,
          timezone: input.timezone,
          factVersion: input.factVersion,
        },
      });

      for (const candidate of input.candidates) {
        const observations = await tx.metricObservation.findMany({
          where: { workspaceId: input.workspaceId, evidenceId: { in: candidate.evidenceIds } },
          include: { metricDefinition: true },
        });
        if (observations.length !== candidate.evidenceIds.length) {
          throw new WorkflowInvariantError(
            'Every candidate evidence ID must exist in the workspace.',
          );
        }
        await tx.observationCandidate.create({
          data: {
            id: candidate.id,
            workspaceId: input.workspaceId,
            weeklyReviewId: review.id,
            ruleKey: candidate.ruleKey,
            ruleVersion: candidate.ruleVersion,
            priority: candidate.priority,
            title: candidate.title,
            summary: candidate.summary,
            inputs: candidate.inputs,
            severityFactors: candidate.severityFactors,
            qualityStatus: candidate.quality.status,
            qualityFlags: candidate.quality.flags,
            sourceModes: candidate.sourceModes,
          },
        });
        const links = [];
        for (const observation of observations) {
          links.push(
            await tx.evidenceLink.create({
              data: {
                workspaceId: input.workspaceId,
                weeklyReviewId: review.id,
                observationCandidateId: candidate.id,
                metricObservationId: observation.id,
                evidenceId: observation.evidenceId,
                snapshot: {
                  value: observation.value.toString(),
                  metricStableKey: observation.metricDefinition.stableKey,
                  periodStart: observation.periodStart.toISOString(),
                  periodEnd: observation.periodEnd.toISOString(),
                  retrievedAt: observation.retrievedAt.toISOString(),
                  sourceMode: observation.mode,
                  qualityStatus: observation.qualityStatus,
                  qualityFlags: observation.qualityFlags,
                },
              },
            }),
          );
        }
        await tx.recommendation.create({
          data: {
            workspaceId: input.workspaceId,
            weeklyReviewId: review.id,
            observationCandidateId: candidate.id,
            title: candidate.title,
            rationale: candidate.summary,
            evidence: {
              create: links.map(({ id }) => ({ evidenceLink: { connect: { id } } })),
            },
          },
        });
      }
      return review;
    });
  }

  async transitionRecommendation(input: {
    workspaceId: string;
    recommendationId: string;
    to: RecommendationStatus;
    actorUserId: string;
    rationale: string;
  }) {
    const recommendation = await this.prisma.recommendation.findUniqueOrThrow({
      where: { workspaceId_id: { workspaceId: input.workspaceId, id: input.recommendationId } },
    });
    if (!allowedRecommendationTransitions[recommendation.status].includes(input.to)) {
      throw new WorkflowInvariantError(
        `Recommendation cannot transition from ${recommendation.status} to ${input.to}.`,
      );
    }
    return this.prisma.recommendation.update({
      where: { workspaceId_id: { workspaceId: input.workspaceId, id: input.recommendationId } },
      data: {
        status: input.to,
        decidedByUserId: input.actorUserId,
        decidedAt: new Date(),
        decisionRationale: input.rationale,
      },
    });
  }

  createAction(input: {
    workspaceId: string;
    recommendationId: string;
    title: string;
    ownerUserId?: string;
    dueAt?: Date;
    reviewAt?: Date;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const recommendation = await tx.recommendation.findUniqueOrThrow({
        where: { workspaceId_id: { workspaceId: input.workspaceId, id: input.recommendationId } },
        include: { evidence: { include: { evidenceLink: true } } },
      });
      if (recommendation.status !== 'APPROVED') {
        throw new WorkflowInvariantError('Actions require an approved recommendation.');
      }
      const evidenceIds = recommendation.evidence.map(
        ({ evidenceLink }) => evidenceLink.evidenceId,
      );
      if (evidenceIds.length === 0) {
        throw new WorkflowInvariantError('Actions require originating evidence.');
      }
      const action = await tx.actionItem.create({
        data: { ...input, evidenceIds },
      });
      await tx.actionEvent.create({
        data: {
          workspaceId: input.workspaceId,
          actionItemId: action.id,
          actorUserId: input.ownerUserId,
          eventType: 'CREATED_FROM_APPROVED_RECOMMENDATION',
          toStatus: action.status,
        },
      });
      return action;
    });
  }
}
