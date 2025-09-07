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

WORKDIR /app

# Copy package files
COPY packages/api/package.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

# Install pnpm
RUN npm install -g pnpm@10.7.0

# Install all dependencies
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY packages/api/src/ ./src/
COPY packages/api/prisma/ ./prisma/
COPY packages/api/tsconfig*.json packages/api/nest-cli.json ./

# Create a temporary tsconfig for build without problematic options
RUN echo '{\
  "compilerOptions": {\
    "module": "commonjs",\
    "target": "ES2021",\
    "moduleResolution": "node",\
    "skipLibCheck": true,\
    "declaration": true,\
    "removeComments": true,\
    "emitDecoratorMetadata": true,\
    "experimentalDecorators": true,\
    "allowSyntheticDefaultImports": true,\
    "esModuleInterop": true,\
    "sourceMap": true,\
    "outDir": "./dist",\
    "incremental": true,\
    "strictNullChecks": false,\
    "noImplicitAny": false,\
    "strictBindCallApply": false,\
    "noFallthroughCasesInSwitch": false,\
    "resolveJsonModule": true,\
    "downlevelIteration": true,\
    "paths": {\
      "~/*": ["./src/*"],\
      "src/*": ["./src/*"]\
    }\
  },\
  "include": ["./src/**/*.ts"],\
  "exclude": ["node_modules", "dist", "test", "**/*spec.ts"]\
}' > tsconfig.docker.json

# Generate Prisma client and build
RUN pnpm prisma generate && \
    pnpm exec nest build -p tsconfig.docker.json

# ==============================================================================
# Production stage - Minimal runtime image
# ==============================================================================
FROM node:20-alpine AS production

# Install runtime dependencies including Doppler CLI
RUN apk add --no-cache \
    openssl \
    ca-certificates \
    dumb-init \
    curl \
    gnupg && \
    update-ca-certificates && \
    # Install Doppler CLI for Alpine
    wget -qO- https://github.com/DopplerHQ/cli/releases/download/3.69.0/doppler_3.69.0_linux_amd64.tar.gz | \
    tar -xz -C /usr/local/bin && \
    chmod +x /usr/local/bin/doppler && \
    # Verify Doppler installation
    doppler --version

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.7.0

# Copy package files
COPY --chown=nestjs:nodejs packages/api/package.json ./
COPY --chown=nestjs:nodejs pnpm-lock.yaml ./
COPY --chown=nestjs:nodejs pnpm-workspace.yaml ./

# Install production dependencies only
RUN pnpm install --prod --no-frozen-lockfile --ignore-scripts

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

# Generate Prisma client in production
RUN npx prisma@5.19.1 generate --schema=./prisma/schema.prisma

# Create entrypoint script
RUN echo '#!/bin/sh' > /usr/local/bin/entrypoint && \
    echo 'set -e' >> /usr/local/bin/entrypoint && \
    echo '' >> /usr/local/bin/entrypoint && \
    echo '# Run with Doppler if token is provided' >> /usr/local/bin/entrypoint && \
    echo 'if [ -n "$DOPPLER_TOKEN" ]; then' >> /usr/local/bin/entrypoint && \
    echo '  echo "Running with Doppler..."' >> /usr/local/bin/entrypoint && \
    echo '  exec doppler run -- node dist/main.js' >> /usr/local/bin/entrypoint && \
    echo 'else' >> /usr/local/bin/entrypoint && \
    echo '  echo "Running without Doppler (using environment variables)..."' >> /usr/local/bin/entrypoint && \
    echo '  exec node dist/main.js' >> /usr/local/bin/entrypoint && \
    echo 'fi' >> /usr/local/bin/entrypoint && \
    chmod +x /usr/local/bin/entrypoint

# Environment variables
ENV NODE_ENV=production \
    PORT=5200

USER nestjs

EXPOSE 5200

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://127.0.0.1:5200/api/v1/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--", "/usr/local/bin/entrypoint"]