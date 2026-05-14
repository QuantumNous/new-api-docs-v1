# syntax=docker/dockerfile:1

FROM oven/bun:1 AS deps
WORKDIR /app

# postinstall runs fumadocs-mdx and needs source.config.ts + content/docs; skip here
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts

FROM oven/bun:1 AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN bun run postinstall && bun run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Runtime OpenAPI JSON (read by src/lib/openapi.ts). Standalone tracing needs `next build --webpack`;
# keep an explicit copy so Docker/Caddy deployments always have these files on disk.
COPY --from=builder --chown=nextjs:nodejs /app/openapi ./openapi

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
