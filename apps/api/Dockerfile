# =============================================================================
# Code2Cloud API (NestJS) - Multi-stage Build
# =============================================================================
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN npm install -g turbo
WORKDIR /app

# Build stage
FROM base AS builder
WORKDIR /app

# Build args for Prisma
ARG DATABASE_URL
ARG DATABASE_DIRECT_URL
ENV DATABASE_URL=$DATABASE_URL
ENV DATABASE_DIRECT_URL=$DATABASE_DIRECT_URL

# Copy entire monorepo
COPY . .

# Install all dependencies
RUN npm install --legacy-peer-deps

# Generate Prisma client
WORKDIR /app/apps/api
RUN npx prisma generate

# Build using turbo from root
WORKDIR /app
RUN turbo run build --filter=api

# Production
FROM node:22-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs

# Copy built application and dependencies
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package*.json ./
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/generated ./dist/generated
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nestjs
EXPOSE 3000

CMD ["node", "dist/src/main.js"]