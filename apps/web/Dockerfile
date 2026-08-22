# Imagem de PRODUÇÃO do app web — build multi-stage.
# Usada pelo Jenkins (Jenkinsfile) pra gerar a imagem final da aplicação.
# Diferente do Dockerfile.dev, aqui o código é COPIADO pra dentro da imagem
# (sem bind mount) — a imagem tem que ser autossuficiente pra rodar em
# qualquer lugar (servidor, Kubernetes no futuro, etc.).

# ---- deps: instala dependências de todo o monorepo (aproveita cache) ----
FROM node:20-bullseye AS deps
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages/core/package.json ./packages/core/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY apps/desktop/package.json ./apps/desktop/package.json
RUN pnpm install --frozen-lockfile

# ---- builder: builda só o pacote @tasksorg/web (e o que ele depende) ----
FROM node:20-bullseye AS builder
RUN corepack enable
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/core/node_modules ./packages/core/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .
RUN pnpm turbo run build --filter=@tasksorg/web

# ---- runner: imagem final, enxuta, só com o output "standalone" ----
FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "apps/web/server.js"]
