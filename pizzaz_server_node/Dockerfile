# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY . .
# Install all deps (incl. dev) and build everything (assets + TS)
RUN pnpm install --frozen-lockfile
RUN pnpm -w run build            # builds /assets
RUN pnpm --filter pizzaz_server_node... run build  # produces pizzaz_server_node/dist

# ---- Runtime stage ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8000
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only what’s needed
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY assets ./assets
COPY pizzaz_server_node/package.json ./pizzaz_server_node/package.json
# Install prod deps for the server only
RUN pnpm --filter pizzaz_server_node... install --prod --frozen-lockfile

# Copy compiled JS
COPY --from=build /app/pizzaz_server_node/dist ./pizzaz_server_node/dist

EXPOSE 8000
WORKDIR /app/pizzaz_server_node
# Run compiled JS (no tsx needed)
CMD ["node", "dist/server.js"]

