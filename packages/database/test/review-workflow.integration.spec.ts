import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedSummitAndSage } from '../src/demo/seed-service';
import { DEMO_WORKSPACE_ID } from '../src/demo/fixtures';
import {
  ReviewWorkflowService,
  WorkflowInvariantError,
} from '../src/reviews/review-workflow-service';

const databaseUrl = process.env.DATABASE_URL;
const describeDatabase = databaseUrl ? describe.sequential : describe.skip;

describeDatabase('RCH-014 weekly review workflow persistence', () => {
  const prisma = new PrismaClient();
  const service = new ReviewWorkflowService(prisma);
  const factVersion = 'rch-014-integration-v1';
  let reviewId: string;
  let recommendationId: string;

  async function cleanup() {
    const reviewWhere = { workspaceId: DEMO_WORKSPACE_ID, factVersion };
    await prisma.actionEvent.deleteMany({
      where: { actionItem: { recommendation: { weeklyReview: reviewWhere } } },
    });
    await prisma.actionItem.deleteMany({
      where: { recommendation: { weeklyReview: reviewWhere } },
    });
    await prisma.recommendationEvidence.deleteMany({
      where: { recommendation: { weeklyReview: reviewWhere } },
    });
    await prisma.recommendation.deleteMany({ where: { weeklyReview: reviewWhere } });
    await prisma.evidenceLink.deleteMany({ where: { weeklyReview: reviewWhere } });
    await prisma.observationCandidate.deleteMany({ where: { weeklyReview: reviewWhere } });
    await prisma.weeklyReview.deleteMany({ where: reviewWhere });
  }

  beforeAll(async () => {
    await seedSummitAndSage(prisma);
    await cleanup();
    const review = await service.createReview({
      workspaceId: DEMO_WORKSPACE_ID,
      windowStart: new Date('2026-07-27T06:00:00.000Z'),
      windowEnd: new Date('2026-08-03T05:59:59.999Z'),
      timezone: 'America/Denver',
      factVersion,
      candidates: [
        {
          id: 'OC-RCH014TEST',
          idempotencyKey: 'rch014:test',
          ruleKey: 'ac-repair-demand-conversion-divergence',
          ruleVersion: '1.0.0',
          window: {
            start: '2026-07-27T06:00:00.000Z',
            end: '2026-08-03T05:59:59.999Z',
            timezone: 'America/Denver',
          },
          priority: 'HIGH',
          title: 'AC repair demand rose while booking efficiency fell',
          summary: 'Sessions increased while bookings and booking rate declined.',
          evidenceIds: ['EV-104', 'EV-105', 'EV-106'],
          sourceModes: ['SIMULATED'],
          inputs: [
            {
              evidenceId: 'EV-104',
              metricStableKey: 'ga4.sessions',
              currentValue: 1505,
              priorValue: 1148,
              absoluteChange: 357,
              percentageChange: 31.0975609756,
              percentagePointChange: null,
              displayChange: '+31.1%',
            },
          ],
          severityFactors: [
            {
              key: 'current-sessions',
              observed: 1505,
              operator: 'GTE',
              threshold: 500,
              passed: true,
            },
          ],
          quality: { status: 'COMPLETE', flags: [] },
          causalClaim: false,
        },
      ],
    });
    reviewId = review.id;
    recommendationId = (
      await prisma.recommendation.findFirstOrThrow({ where: { weeklyReviewId: review.id } })
    ).id;
  });

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  it('persists a proposal transactionally with immutable evidence snapshots', async () => {
    const recommendation = await prisma.recommendation.findUniqueOrThrow({
      where: { workspaceId_id: { workspaceId: DEMO_WORKSPACE_ID, id: recommendationId } },
      include: { evidence: { include: { evidenceLink: true } } },
    });
    expect(
      recommendation.evidence.map(({ evidenceLink }) => evidenceLink.evidenceId).sort(),
    ).toEqual(['EV-104', 'EV-105', 'EV-106']);
    await expect(
      prisma.weeklyReview.update({ where: { id: reviewId }, data: { factVersion: 'mutated' } }),
    ).rejects.toThrow(/immutable/);
    await expect(
      prisma.evidenceLink.update({
        where: { id: recommendation.evidence[0]!.evidenceLinkId },
        data: { evidenceId: 'EV-999' },
      }),
    ).rejects.toThrow(/immutable/);
  });

  it('rejects invalid decisions and snapshots evidence onto approved actions', async () => {
    const actorUserId = 'demo-user-maya-chen';
    await service.transitionRecommendation({
      workspaceId: DEMO_WORKSPACE_ID,
      recommendationId,
      to: 'APPROVED',
      actorUserId,
      rationale: 'Proceed with investigation.',
    });
    await expect(
      service.transitionRecommendation({
        workspaceId: DEMO_WORKSPACE_ID,
        recommendationId,
        to: 'DISMISSED',
        actorUserId,
        rationale: 'Invalid reversal.',
      }),
    ).rejects.toBeInstanceOf(WorkflowInvariantError);
    const action = await service.createAction({
      workspaceId: DEMO_WORKSPACE_ID,
      recommendationId,
      title: 'Investigate mobile booking flow',
      ownerUserId: 'demo-user-jonah-brooks',
    });
    expect(action.evidenceIds.sort()).toEqual(['EV-104', 'EV-105', 'EV-106']);
    const event = await prisma.actionEvent.findFirstOrThrow({ where: { actionItemId: action.id } });
    await expect(
      prisma.actionEvent.update({ where: { id: event.id }, data: { note: 'rewritten history' } }),
    ).rejects.toThrow(/append-only/);
  });
});
