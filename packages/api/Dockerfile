# Use the official Node.js LTS Alpine image
FROM node:20-alpine AS base

# Build arguments for Doppler configuration
ARG DOPPLER_PROJECT=gymspace
ARG DOPPLER_ENV=prod

# Install required system dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat \
    openssl \
    ca-certificates \
    curl \
    && update-ca-certificates

# Install Doppler CLI
RUN curl -Ls https://packages.doppler.com/install.sh | sh

# Install pnpm globally
RUN npm install -g pnpm@8

# Set working directory
WORKDIR /app

# Copy package manager configuration
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./

# Copy all package.json files for dependency resolution
COPY packages/api/package.json ./packages/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/sdk/package.json ./packages/sdk/

# ==============================================================================
# Dependencies stage - Install all dependencies
# ==============================================================================
FROM base AS dependencies

# Install all dependencies (including devDependencies for building)
RUN pnpm install --frozen-lockfile

# ==============================================================================
# Build stage - Build the application
# ==============================================================================
FROM dependencies AS builder

# Copy source code for shared packages
COPY packages/shared/ ./packages/shared/

# Copy API source code
COPY packages/api/src/ ./packages/api/src/
COPY packages/api/prisma/ ./packages/api/prisma/
COPY packages/api/tsconfig*.json ./packages/api/
COPY packages/api/nest-cli.json ./packages/api/

# Generate Prisma client
RUN cd packages/api && pnpm prisma generate

# Build shared packages first (if they need building)
RUN if [ -f "packages/shared/tsconfig.json" ]; then \
        cd packages/shared && pnpm build; \
    fi

# Build the API application
RUN cd packages/api && pnpm build

# ==============================================================================
# Production dependencies stage - Install only production dependencies
# ==============================================================================
FROM base AS production-deps

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# ==============================================================================
# Runtime stage - Final production image
# ==============================================================================
FROM node:20-alpine AS runtime

# Install runtime dependencies
RUN apk add --no-cache \
    openssl \
    ca-certificates \
    dumb-init \
    curl \
    && update-ca-certificates

# Install Doppler CLI
RUN curl -Ls https://packages.doppler.com/install.sh | sh

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Copy production dependencies
COPY --from=production-deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=production-deps --chown=nestjs:nodejs /app/packages/api/node_modules ./packages/api/node_modules

# Copy package.json files
COPY --chown=nestjs:nodejs package.json ./
COPY --chown=nestjs:nodejs packages/api/package.json ./packages/api/

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/packages/api/dist ./packages/api/dist

# Copy Prisma files for runtime
COPY --from=builder --chown=nestjs:nodejs /app/packages/api/prisma ./packages/api/prisma

# Copy shared package if it exists
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared ./packages/shared

# Copy entrypoint script
COPY docker/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5200
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Switch to non-root user
USER nestjs

# Expose the port
EXPOSE 5200

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "const http = require('http'); \
    const prefix = process.env.API_PREFIX || 'api/v1'; \
    const options = { hostname: '127.0.0.1', port: process.env.PORT || 5200, path: '/' + prefix + '/health', timeout: 3000 }; \
    const req = http.request(options, (res) => { \
        if (res.statusCode === 200) { console.log('Health check passed'); process.exit(0); } \
        else { console.log('Health check failed'); process.exit(1); } \
    }); \
    req.on('error', (err) => { console.log('Health check error:', err.message); process.exit(1); }); \
    req.on('timeout', () => { console.log('Health check timeout'); req.destroy(); process.exit(1); }); \
    req.setTimeout(3000); \
    req.end();"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--", "entrypoint"]
