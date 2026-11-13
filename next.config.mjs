import { createMDX } from 'fumadocs-mdx/next';
import { docsRedirects } from './src/lib/docs-redirects.mjs';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  poweredByHeader: false,
  redirects: docsRedirects,
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        // newapi.pro domains
        'docs.newapi.pro',
        'newapi.pro',
        'www.newapi.pro',
        // newapi.ai domains
        'docs.newapi.ai',
        'newapi.ai',
        'www.newapi.ai',
        // Vercel preview
        'new-api-docs-v1.vercel.app',
      ],
    },
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
