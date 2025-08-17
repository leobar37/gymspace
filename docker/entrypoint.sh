#!/bin/sh
set -e

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting GymSpace API..."

# Check if Doppler token is available
if [ -n "$DOPPLER_TOKEN" ]; then
    log "Doppler token found in environment, using Doppler for secrets management"
    # Configure Doppler with the provided token and run the application
    echo "$DOPPLER_TOKEN" | doppler configure set token --silent
    exec doppler run --mount=false -- node packages/api/dist/main.js
elif [ -n "$DOPPLER_SERVICE_TOKEN" ]; then
    log "Doppler service token found, using Doppler for secrets management"
    # Configure Doppler with service token
    export DOPPLER_TOKEN="$DOPPLER_SERVICE_TOKEN"
    exec doppler run --mount=false -- node packages/api/dist/main.js
elif [ -f "/run/secrets/doppler_token" ]; then
    log "Doppler token found in Docker secrets, using Doppler for secrets management"
    # Read token from Docker secrets
    export DOPPLER_TOKEN=$(cat /run/secrets/doppler_token)
    echo "$DOPPLER_TOKEN" | doppler configure set token --silent
    exec doppler run --mount=false -- node packages/api/dist/main.js
else
    log "No Doppler token found, falling back to environment variables"
    log "Make sure all required environment variables are set via .env file or direct injection"
    # Fall back to traditional environment variable approach
    exec node packages/api/dist/main.js
fi
