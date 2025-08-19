# ==============================================================================
# Build stage - Dependencies and compilation
# ==============================================================================
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat \
    openssl \
    ca-certificates

# Install pnpm
RUN npm install -g pnpm@10.7.0

WORKDIR /app

# Copy package files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/api/package.json ./packages/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/sdk/package.json ./packages/sdk/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY tsconfig.json* ./
COPY packages/shared/ ./packages/shared/
COPY packages/api/src/ ./packages/api/src/
COPY packages/api/prisma/ ./packages/api/prisma/
COPY packages/api/tsconfig*.json ./packages/api/
COPY packages/api/nest-cli.json ./packages/api/

# Generate Prisma client and build
RUN cd packages/api && \
    pnpm prisma generate && \
    pnpm build

# ==============================================================================
# Production stage - Minimal runtime image
# ==============================================================================
FROM node:20-alpine AS production

# Install runtime dependencies including Doppler CLI
RUN apk add --no-cache \
    openssl \
    ca-certificates \
    dumb-init \
    curl && \
    update-ca-certificates && \
    # Install Doppler CLI
    wget -qO- https://github.com/DopplerHQ/cli/releases/download/3.69.0/doppler_3.69.0_linux_amd64.tar.gz | \
    tar -xz -C /usr/local/bin && \
    chmod +x /usr/local/bin/doppler

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Install pnpm and production dependencies
RUN npm install -g pnpm@10.7.0

# Copy package files
COPY --chown=nestjs:nodejs pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY --chown=nestjs:nodejs packages/api/package.json ./packages/api/
COPY --chown=nestjs:nodejs packages/shared/package.json ./packages/shared/
COPY --chown=nestjs:nodejs packages/sdk/package.json ./packages/sdk/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/packages/api/build ./packages/api/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/api/prisma ./packages/api/prisma
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared ./packages/shared

# Copy and setup entrypoint
COPY --chown=nestjs:nodejs docker/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

# Generate Prisma client in production - match build stage version
RUN cd packages/api && npx prisma@5.19.1 generate --schema=./prisma/schema.prisma

# Environment variables
ENV NODE_ENV=production \
    GOOGLE_CLOUD_PROJECT=meta-episode-466920-h4

USER nestjs

EXPOSE 5200

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://127.0.0.1:5200/api/v1/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--", "entrypoint"]
