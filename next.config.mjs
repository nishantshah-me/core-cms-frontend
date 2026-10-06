/**
 * Static Exports in Next.js
 *
 * 1. Set `isStaticExport = true` in `next.config.{mjs|ts}`.
 * 2. This allows `generateStaticParams()` to pre-render dynamic routes at build time.
 *
 * For more details, see:
 * https://nextjs.org/docs/app/building-your-application/deploying/static-exports
 *
 * NOTE: Remove all "generateStaticParams()" functions if not using static exports.
 */
const isStaticExport = false;

// ----------------------------------------------------------------------

// Server-only (no NEXT_PUBLIC_ prefix): never bundled into client code. The browser calls the same-origin
// PROXY_PATH and Next.js forwards it to the backend. Rewrites are resolved at build time, so API_URL must be
// set when running `next build` / `next dev`.
const API_URL = (process.env.API_URL ?? 'https://api-dev.hexafoldtech.com').replace(/\/+$/, '');
const PROXY_PATH = '/api-proxy';

const nextConfig = {
  trailingSlash: true,
  // Without this, API calls to PROXY_PATH (no trailing slash) are 308-redirected to a slash-suffixed URL the backend doesn't serve.
  skipTrailingSlashRedirect: true,
  output: isStaticExport ? 'export' : undefined,
  env: {
    BUILD_STATIC_EXPORT: JSON.stringify(isStaticExport),
  },
  async rewrites() {
    return [{ source: `${PROXY_PATH}/:path*`, destination: `${API_URL}/:path*` }];
  },
  // Without --turbopack (next dev)
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
  // With --turbopack (next dev --turbopack)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
};

export default nextConfig;
