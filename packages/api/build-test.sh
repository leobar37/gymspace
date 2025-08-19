#!/bin/bash
set -e

echo "🔨 Building Docker image locally..."

# Navigate to root directory for build context
cd ../..

# Build the Docker image
docker build -t gymspace-api-test -f packages/api/Dockerfile .

echo "🧪 Testing Docker image with Doppler token..."

# Run the container with Doppler token to test
docker run -d \
  --name gymspace-api-test \
  -p 5200:5200 \
  -e DOPPLER_TOKEN="dp.st.stg.ND5UlLAuMM6dhTh8yl0sfOPZFduFAv7C83sn7qIQCMp" \
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