#!/bin/bash
set -e

echo "🔨 Building Docker image locally..."

# Navigate to root directory for build context
cd ../..

# Build the Docker image
docker build -t gymspace-api-test -f packages/api/Dockerfile .

echo "🧪 Testing Docker image with Doppler token..."

# Check if DOPPLER_TOKEN is set
if [ -z "$DOPPLER_TOKEN" ]; then
    echo "❌ DOPPLER_TOKEN environment variable is not set"
    echo "   Please set it before running this script:"
    echo "   export DOPPLER_TOKEN=your_token_here"
    exit 1
fi

# Run the container with Doppler token to test
docker run -d \
  --name gymspace-api-test \
  -p 5200:5200 \
  -e DOPPLER_TOKEN="$DOPPLER_TOKEN" \
  gymspace-api-test

# Wait a bit for startup
echo "⏳ Waiting for application to start..."
sleep 10

# Check if container is running
if docker ps | grep -q gymspace-api-test; then
    echo "✅ Container is running"
    
    # Show logs
    echo "📝 Container logs:"
    docker logs gymspace-api-test
    
    # Test health endpoint
    echo "🏥 Testing health endpoint..."
    if curl -f http://localhost:5200/api/v1/health 2>/dev/null; then
        echo "✅ Health check passed"
    else
        echo "❌ Health check failed"
    fi
else
    echo "❌ Container failed to start"
    echo "📝 Container logs:"
    docker logs gymspace-api-test
fi

# Cleanup
echo "🧹 Cleaning up..."
docker stop gymspace-api-test 2>/dev/null || true
docker rm gymspace-api-test 2>/dev/null || true

echo "🏁 Test complete"