# Docker Configuration for GymSpace API

This directory contains Docker configuration files for the GymSpace API with Doppler secrets management integration.

## Files Overview

- `docker-compose.yml` - Base infrastructure services (PostgreSQL, Redis, MinIO)
- `docker-compose.doppler.dev.yml` - Development override with Doppler integration
- `docker-compose.doppler.prod.yml` - Production override with Doppler integration  
- `entrypoint.sh` - Smart entrypoint script with fallback support

## Quick Start

### 1. Traditional Development (No Doppler)
```bash
# Start infrastructure services
pnpm dev:docker

# Run API locally (uses .env file)
pnpm dev:api
```

### 2. Docker + Doppler Development
```bash
# Get Doppler service token
DOPPLER_SERVICE_TOKEN=$(doppler configs tokens create dev-docker --plain)

# Start everything with Doppler
DOPPLER_SERVICE_TOKEN=$DOPPLER_SERVICE_TOKEN docker compose \
  -f docker/docker-compose.yml \
  -f docker/docker-compose.doppler.dev.yml up
```

### 3. Production Deployment
```bash
# Build production image
docker build \
  --build-arg DOPPLER_PROJECT=gymspace \
  --build-arg DOPPLER_ENV=prod \
  -t gymspace/api:latest \
  packages/api

# Run with production Doppler token
DOPPLER_TOKEN=your_production_token docker run \
  -p 5200:5200 \
  -e DOPPLER_TOKEN=$DOPPLER_TOKEN \
  gymspace/api:latest
```

## Entrypoint Behavior

The `entrypoint.sh` script provides intelligent fallback:

1. **DOPPLER_TOKEN env var** → Use Doppler with full token
2. **DOPPLER_SERVICE_TOKEN env var** → Use Doppler with service token
3. **Docker secrets at `/run/secrets/doppler_token`** → Use Doppler with secret file
4. **No Doppler token** → Fall back to traditional environment variables

## Environment Variables

Required for Doppler integration:
- `DOPPLER_TOKEN` (production) - Full Doppler token
- `DOPPLER_SERVICE_TOKEN` (development) - Read-only service token

All application secrets are managed through Doppler configs:
- **Project:** `gymspace`
- **Environments:** `dev`, `staging`, `prod`

## Testing Different Scenarios

```bash
# Test 1: No Doppler (fallback mode)
docker run --rm -p 5200:5200 gymspace/api:latest

# Test 2: With Doppler service token
DOPPLER_SERVICE_TOKEN=dp.st.dev.xxx docker run --rm -p 5200:5200 \
  -e DOPPLER_SERVICE_TOKEN=$DOPPLER_SERVICE_TOKEN \
  gymspace/api:latest

# Test 3: With full Doppler token  
DOPPLER_TOKEN=dp.st.prod.xxx docker run --rm -p 5200:5200 \
  -e DOPPLER_TOKEN=$DOPPLER_TOKEN \
  gymspace/api:latest
```

## Security Notes

- `--mount=false` prevents secrets from being written to disk
- Service tokens are read-only and scoped to specific environments
- Production tokens should never be logged or exposed in build artifacts
- Docker secrets provide additional security layer for orchestrated deployments

## Troubleshooting

- Check container logs for entrypoint messages about token detection
- Ensure Doppler project and config names match your setup
- Verify NestJS configuration validation passes for required secrets
- Test health endpoint: `curl http://localhost:5200/api/v1/health`
