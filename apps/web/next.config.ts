import type { NextConfig } from 'next';

/**
 * ReachOps builds in two shapes.
 *
 * The default build is the deployable application that talks to the NestJS API. Setting
 * `REACHOPS_DEMO_MODE=static` produces the published portfolio demonstration: a fully static
 * export driven by the committed deterministic snapshot, with no API or database at runtime.
 */
const isStaticDemo = process.env.REACHOPS_DEMO_MODE === 'static';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  ...(isStaticDemo
    ? {
        output: 'export',
        trailingSlash: true,
        basePath,
        assetPrefix: basePath || undefined,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
