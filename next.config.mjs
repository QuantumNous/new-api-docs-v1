import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  output: 'standalone',
  /**
   * Per-endpoint OpenAPI JSON is read at runtime from disk (see src/lib/openapi.ts).
   * Webpack builds run collect-build-traces and merge these into the server bundle trace.
   * Turbopack production builds skip that step, so package.json uses `next build --webpack`.
   */
  outputFileTracingIncludes: {
    '/app/[lang]/docs/[[...slug]]': ['./openapi/generated/**/*'],
  },
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        // tokenfactory.pro domains
        'docs.tokenfactory.pro',
        'tokenfactory.pro',
        'www.tokenfactory.pro',
        // tokenfactoryopen.com domains
        'docs.tokenfactoryopen.com',
        'tokenfactoryopen.com',
        'www.tokenfactoryopen.com',
        // Vercel preview
        'token-factory-docs.vercel.app',
      ],
    },
  },
  async headers() {
    return [
      {
        // Apply charset to HTML pages
        source: '/:lang(en|zh|ja)/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/html; charset=utf-8',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/:lang/docs/:path*.mdx',
        destination: '/:lang/llms.mdx/:path*',
      },
    ];
  },
};

export default withMDX(config);
