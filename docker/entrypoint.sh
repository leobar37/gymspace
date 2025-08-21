#!/bin/sh
set -e

echo "🚀 Starting Gymspace API..."

# Set default values
export NODE_ENV=${NODE_ENV:-production}
# Don't set PORT here - Cloud Run will provide it

# Change to API directory
cd packages/api

# Check if Doppler token is valid (not empty or placeholder)
if [ ! -z "$DOPPLER_TOKEN" ] && [ "$DOPPLER_TOKEN" != "placeholder" ] && [ "$DOPPLER_TOKEN" != "dp.pt.placeholder" ]; then
    echo "🔑 Using Doppler for secret management..."
    echo "🔍 Testing Doppler connection..."
    if doppler secrets --token="$DOPPLER_TOKEN" --only-names > /dev/null 2>&1; then
        echo "✅ Doppler connection successful"
        echo "🚀 Starting application with Doppler..."
        exec doppler run --token="$DOPPLER_TOKEN" -- node dist/main.js
    else
        echo "❌ Doppler connection failed, falling back to environment variables"
        echo "Port configuration: PORT=${PORT}"
        exec node dist/main.js
    fi
else
    echo "📝 Using environment variables..."
    # Make sure we're using the PORT from Cloud Run
    echo "Port configuration: PORT=${PORT}"
    exec node dist/main.js
fi
