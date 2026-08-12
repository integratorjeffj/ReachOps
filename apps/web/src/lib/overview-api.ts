import { OverviewResponseSchema, type OverviewResponse } from '@reachops/contracts';

type OverviewResult = { ok: true; data: OverviewResponse } | { ok: false };

export async function getOverview(requestedState?: string): Promise<OverviewResult> {
  if (requestedState === 'error') return { ok: false };

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
    if (requestedState !== 'empty') return { ok: true, data: overview };
    return {
      ok: true,
      data: OverviewResponseSchema.parse({
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
      }),
    };
  } catch {
    return { ok: false };
  }
}
