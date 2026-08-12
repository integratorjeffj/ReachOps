import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@reachops/database';
import { AppModule } from './app.module';

const describeDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describeDatabase('OverviewController integration', () => {
  const prisma = new PrismaClient();
  const suffix = randomUUID();
  const workspaceId = `rch010-api-workspace-${suffix}`;
  const forbiddenWorkspaceId = `rch010-api-forbidden-${suffix}`;
  const workspaceSlug = `rch010-api-empty-${suffix}`;
  const forbiddenWorkspaceSlug = `rch010-api-forbidden-${suffix}`;
  const userId = `rch010-api-user-${suffix}`;
  let app: INestApplication;
  let baseUrl: string;
  const originalDemoAuth = process.env.DEMO_AUTH_ENABLED;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeAll(async () => {
    process.env.DEMO_AUTH_ENABLED = 'true';
    process.env.NODE_ENV = 'test';
    await prisma.user.create({
      data: {
        id: userId,
        email: `rch010-api-${suffix}@reachops.example`,
        displayName: 'RCH-010 API Manager',
      },
    });
    await prisma.workspace.create({
      data: {
        id: workspaceId,
        slug: workspaceSlug,
        name: 'RCH-010 API Empty Workspace',
        timezone: 'America/Denver',
        memberships: {
          create: { id: `rch010-api-membership-${suffix}`, userId, role: 'MANAGER' },
        },
      },
    });
    await prisma.workspace.create({
      data: {
        id: forbiddenWorkspaceId,
        slug: forbiddenWorkspaceSlug,
        name: 'RCH-010 API Forbidden Workspace',
        timezone: 'UTC',
      },
    });

    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.listen(0, '127.0.0.1');
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    if (app) await app.close();
    await prisma.workspace.deleteMany({
      where: { id: { in: [workspaceId, forbiddenWorkspaceId] } },
    });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
    process.env.DEMO_AUTH_ENABLED = originalDemoAuth;
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('requires an explicitly enabled demo identity', async () => {
    const response = await fetch(`${baseUrl}/api/v1/workspaces/${workspaceSlug}/overview`);
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ code: 'DEMO_IDENTITY_REQUIRED' });
  });

  it('returns the tenant-scoped empty overview through the HTTP route', async () => {
    const response = await fetch(`${baseUrl}/api/v1/workspaces/${workspaceSlug}/overview`, {
      headers: { 'x-reachops-demo-user-id': userId },
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      state: 'EMPTY',
      workspace: { id: workspaceId, slug: workspaceSlug },
    });
  });

  it('returns the same 404 for an unauthorized tenant as for an unknown workspace', async () => {
    const headers = { 'x-reachops-demo-user-id': userId };
    const [forbidden, missing] = await Promise.all([
      fetch(`${baseUrl}/api/v1/workspaces/${forbiddenWorkspaceSlug}/overview`, { headers }),
      fetch(`${baseUrl}/api/v1/workspaces/not-a-workspace/overview`, { headers }),
    ]);
    expect(forbidden.status).toBe(404);
    expect(missing.status).toBe(404);
    await expect(forbidden.json()).resolves.toEqual(await missing.json());
  });
});
