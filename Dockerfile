# ─────────────────────────────────────────────────────────────
# Stage 1 — deps
#   Instala APENAS as dependências de produção + devDeps
#   necessárias para o build (prisma generate, next build).
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

COPY package.json package-lock.json* ./
# Instala tudo (inclui devDeps para build)
RUN npm install


# ─────────────────────────────────────────────────────────────
# Stage 2 — builder
#   Gera o Prisma Client e faz o build do Next.js.
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Gera o Prisma Client a partir do schema
RUN npx prisma generate

# Build do Next.js (output: 'standalone' definido em next.config.js)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build


# ─────────────────────────────────────────────────────────────
# Stage 3 — runner
#   Imagem final enxuta com apenas o necessário para produção.
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache libc6-compat openssl netcat-openbsd

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Usuário não-root por segurança
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copia o output standalone do Next.js
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static     ./.next/static
COPY --from=builder /app/public           ./public

# Prisma: schema + client gerado (necessário para migrate e seed em runtime)
COPY --from=builder /app/prisma                    ./prisma
COPY --from=builder /app/node_modules/.prisma      ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma      ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma       ./node_modules/prisma

# Todas as dependências (necessárias para seed, migrations e runtime)
COPY --from=builder /app/node_modules ./node_modules

# Script de inicialização
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# A pasta de uploads precisa de permissão de escrita
RUN mkdir -p ./public/uploads \
 && chown -R nextjs:nodejs ./public/uploads

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]
