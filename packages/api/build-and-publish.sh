#!/bin/bash

# Build and publish Docker image to Google Container Registry for Cloud Run

set -e

# Get script directory and move to monorepo root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/../.."

# Configuration
PROJECT_ID="meta-episode-466920-h4"
IMAGE_NAME="gymspace-api"
GCR_HOSTNAME="gcr.io"
ENVIRONMENT=${1:-"production"}
VERSION_TAG=${2:-"latest"}
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Image URLs
GCR_IMAGE_BASE="${GCR_HOSTNAME}/${PROJECT_ID}/${IMAGE_NAME}"
GCR_IMAGE_LATEST="${GCR_IMAGE_BASE}:${ENVIRONMENT}"
GCR_IMAGE_VERSION="${GCR_IMAGE_BASE}:${ENVIRONMENT}-${TIMESTAMP}"
GCR_IMAGE_CUSTOM="${GCR_IMAGE_BASE}:${VERSION_TAG}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Building Docker image for Google Cloud Run${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Project ID:  ${PROJECT_ID}"
echo "Image:       ${IMAGE_NAME}"
echo "Environment: ${ENVIRONMENT}"
echo "Version:     ${VERSION_TAG}"
echo "Platform:    linux/amd64"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed${NC}"
    exit 1
fi

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

# Authenticate with Google Container Registry
echo -e "\n${YELLOW}🔐 Authenticating with Google Container Registry...${NC}"
gcloud auth configure-docker ${GCR_HOSTNAME} --quiet

# Create builder if it doesn't exist
if ! docker buildx ls | grep -q "gcr-builder"; then
    echo -e "\n${YELLOW}🔧 Creating Docker buildx builder...${NC}"
    docker buildx create --name gcr-builder --use
else
    docker buildx use gcr-builder
fi

# Build and push the image
echo -e "\n${YELLOW}🔨 Building Docker image...${NC}"
echo "Building from directory: $(pwd)"
docker buildx build \
    --platform linux/amd64 \
    -f packages/api/Dockerfile \
    -t ${GCR_IMAGE_LATEST} \
    -t ${GCR_IMAGE_VERSION} \
    --cache-from type=registry,ref=${GCR_IMAGE_LATEST} \
    --cache-to type=inline \
    --push \
    .

# Tag with custom version if provided
if [ "${VERSION_TAG}" != "latest" ]; then
    echo -e "\n${YELLOW}🏷️  Tagging custom version...${NC}"
    docker buildx build \
        --platform linux/amd64 \
        -f packages/api/Dockerfile \
        -t ${GCR_IMAGE_CUSTOM} \
        --cache-from type=registry,ref=${GCR_IMAGE_LATEST} \
        --push \
        .
fi

echo -e "\n${GREEN}✅ Successfully built and pushed Docker image!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Available tags:"
echo "  • ${GCR_IMAGE_LATEST}"
echo "  • ${GCR_IMAGE_VERSION}"
if [ "${VERSION_TAG}" != "latest" ]; then
    echo "  • ${GCR_IMAGE_CUSTOM}"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 To update Pulumi infrastructure:"
echo "   Update imageName in packages/api-infra/index.ts to:"
echo "   ${GCR_IMAGE_VERSION}"
echo ""
echo "🚀 To deploy:"
echo "   cd packages/api-infra && pulumi up"
