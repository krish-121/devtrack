# syntax=docker/dockerfile:1
FROM node:24.18.0-bookworm-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/* \
    && npm install --global npm@11.16.0

FROM base AS manifests
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json

FROM manifests AS dependencies
# Generation happens after source/schema copy, not during manifest-only install.
RUN npm ci --ignore-scripts

FROM dependencies AS build
COPY . .
RUN npm run db:generate && npm run build

FROM manifests AS production-dependencies
# Only API/shared workspaces belong in the server runtime. Keep the lockfile;
# npm ci still verifies every installed package's locked version/integrity.
RUN node --input-type=module -e "import fs from 'node:fs'; const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')); pkg.workspaces = ['apps/api', 'packages/shared']; fs.writeFileSync('package.json', JSON.stringify(pkg));"
# Optional Prisma CLI peers are for development, not the generated client.
RUN npm ci --omit=dev --omit=optional --omit=peer --ignore-scripts --workspace @devtrack/api \
    --workspace @devtrack/shared --include-workspace-root=false \
    && npm rebuild argon2

FROM base AS runtime
ENV NODE_ENV=production PORT=3000
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=production-dependencies --chown=node:node /app/apps/api/package.json ./apps/api/package.json
COPY --from=production-dependencies --chown=node:node /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build --chown=node:node /app/packages/shared/dist ./packages/shared/dist
COPY --from=build --chown=node:node /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=node:node /app/apps/web/dist ./apps/web/dist
COPY --from=production-dependencies --chown=node:node /app/package.json ./package.json
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/v1/health').then(r => { if (!r.ok) process.exit(1); }).catch(() => process.exit(1));"
CMD ["node", "apps/api/dist/server.js"]
