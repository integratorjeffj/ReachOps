import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { currentWorkspaceWeek, OverviewQueryService } from '../src/overview/overview-query-service';

const describeDatabase = process.env.DATABASE_URL ? describe.sequential : describe.skip;

describeDatabase('RCH-010 overview empty state', () => {
  const prisma = new PrismaClient();
  const suffix = randomUUID();
  const workspaceId = `rch010-workspace-${suffix}`;
  const workspaceSlug = `rch010-empty-${suffix}`;
  const userId = `rch010-user-${suffix}`;

  beforeAll(async () => {
    await prisma.workspace.create({
      data: {
        id: workspaceId,
        slug: workspaceSlug,
        name: 'RCH-010 Empty Workspace',
        timezone: 'America/Denver',
        memberships: {
          create: {
            id: `rch010-membership-${suffix}`,
            role: 'MANAGER',
            user: {
              create: {
                id: userId,
                email: `rch010-${suffix}@reachops.example`,
                displayName: 'RCH-010 Test Manager',
              },
            },
          },
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.workspace.deleteMany({ where: { id: workspaceId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('returns a stable empty response with Denver-local week boundaries', async () => {
    const now = new Date('2026-11-04T17:00:00.000Z');
    const overview = await new OverviewQueryService(prisma, () => now).getOverview({
      workspaceSlug,
      actorUserId: userId,
    });

    expect(overview).toMatchObject({
      state: 'EMPTY',
      activeWeek: {
        start: '2026-11-02T07:00:00.000Z',
        end: '2026-11-09T06:59:59.999Z',
        timezone: 'America/Denver',
      },
      goals: [],
      sourceCoverage: [],
    });
    expect(overview.kpis).toHaveLength(4);
    expect(overview.kpis.every(({ status, current }) => status === 'UNAVAILABLE' && !current)).toBe(
      true,
    );
    expect(overview.priorities).toHaveLength(3);
  });

  it('calculates a DST-spanning week from local calendar boundaries', () => {
    expect(currentWorkspaceWeek(new Date('2026-03-04T17:00:00.000Z'), 'America/Denver')).toEqual({
      start: new Date('2026-03-02T07:00:00.000Z'),
      end: new Date('2026-03-09T05:59:59.999Z'),
    });
  });
});
