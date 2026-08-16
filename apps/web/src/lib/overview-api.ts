import { OverviewResponseSchema, type OverviewResponse } from '@reachops/contracts';
import { demoSnapshot, IS_STATIC_DEMO } from '@/lib/demo/snapshot';

type OverviewResult = { ok: true; data: OverviewResponse } | { ok: false };

function emptyOverview(overview: OverviewResponse): OverviewResponse {
  return OverviewResponseSchema.parse({
    ...overview,
    state: 'EMPTY',
    goals: [],
    kpis: overview.kpis.map((kpi) => ({
      ...kpi,
      status: 'UNAVAILABLE',
      current: null,
      prior: null,
      change: null,
      sourceModes: [],
      coverageNote: null,
    })),
    trends: [],
    annotations: [],
  });
}

/**
 * Resolves the executive overview.
 *
 * The published static demonstration reads the committed snapshot so the site needs neither the
 * API nor a database. A normally deployed ReachOps instance keeps calling the NestJS endpoint.
 */
export async function getOverview(requestedState?: string): Promise<OverviewResult> {
  if (requestedState === 'error') return { ok: false };

  if (IS_STATIC_DEMO) {
    const { overview } = demoSnapshot;
    return requestedState === 'empty'
      ? { ok: true, data: emptyOverview(overview) }
      : { ok: true, data: overview };
  }

  const apiBaseUrl = process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:3001';
  try {
    const response = await fetch(
      `${apiBaseUrl}/api/v1/workspaces/${process.env.DEMO_WORKSPACE_SLUG ?? 'summit-and-sage-demo'}/overview`,
      {
        headers: { 'x-reachops-demo-user-id': 'demo-user-maya-chen' },
        cache: 'no-store',
      },
    );
    if (!response.ok) return { ok: false };
    const overview = OverviewResponseSchema.parse(await response.json());
    return requestedState === 'empty'
      ? { ok: true, data: emptyOverview(overview) }
      : { ok: true, data: overview };
  } catch {
    return { ok: false };
  }
}
