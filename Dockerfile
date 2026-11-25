# =============================================================================
# FRONT-PWA em produção (Next.js 16) — imagem usada pelo docker-compose.front.yml
#
# Build multi-stage: instala dependências, compila (`next build`) e roda
# (`next start`) no mesmo Node 24 exigido pelo projeto.
#
# As variáveis NEXT_PUBLIC_* são embutidas no bundle em tempo de BUILD; por isso
# o `.env` do repositório entra no contexto (ele já é gitignored). A URL do
# gateway usada pelo servidor (BFF) é definida em runtime pelo compose
# (RAIJI_GATEWAY_URL), apontando para o Kong na rede do monolito.
# =============================================================================
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:24-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-alpine AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.ts ./next.config.ts
COPY --from=build /app/public ./public
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3000
CMD ["npm", "run", "start"]
