#!/bin/sh
set -e

echo "🚀 Starting Gymspace API..."

# Set default values
export NODE_ENV=${NODE_ENV:-production}
# Don't set PORT here - Cloud Run will provide it

# Change to API directory
cd packages/api

# If Doppler token is provided, use it to inject secrets
if [ -n "$DOPPLER_TOKEN" ]; then
    echo "🔑 Using Doppler for secret management..."
    exec doppler run --token="$DOPPLER_TOKEN" -- node dist/main.js
else
    echo "📝 Using environment variables..."
    exec node dist/main.js
fi
