#!/bin/bash

# Script to build and push Docker image to Docker Hub
# Usage: ./build_and_push.sh [tag]
# If no tag is provided, 'latest' will be used

set -e  # Exit on error

DOCKER_USERNAME="dhimarketer"
IMAGE_NAME="oceanfrenzy"
FULL_IMAGE_NAME="${DOCKER_USERNAME}/${IMAGE_NAME}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed!"
    echo "Please install Docker first:"
    echo "  Ubuntu/Debian: sudo apt-get update && sudo apt-get install docker.io"
    echo "  Or visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    print_error "Docker daemon is not running!"
    echo "Please start Docker daemon:"
    echo "  Linux: sudo systemctl start docker"
    echo "  Or start Docker Desktop if you're using it"
    exit 1
fi

# Check if Dockerfile exists
if [ ! -f "Dockerfile" ]; then
    print_error "Dockerfile not found in current directory!"
    exit 1
fi

# Get tag from argument or use 'latest'
TAG=${1:-latest}

print_info "Building Docker image: ${FULL_IMAGE_NAME}:${TAG}"

# Build the Docker image
if docker build -t "${FULL_IMAGE_NAME}:${TAG}" .; then
    print_info "Build completed successfully!"
else
    print_error "Build failed!"
    exit 1
fi

# Ask for confirmation before pushing (only if running interactively)
if [ -t 0 ]; then
    read -p "Do you want to push the image to Docker Hub? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]
    then
        PUSH_IMAGE=true
    else
        PUSH_IMAGE=false
    fi
else
    # Non-interactive mode - skip push by default
    print_warn "Non-interactive mode detected. Skipping push."
    print_warn "To push manually, run: docker push ${FULL_IMAGE_NAME}:${TAG}"
    PUSH_IMAGE=false
fi

if [ "$PUSH_IMAGE" = true ]; then
    print_info "Pushing ${FULL_IMAGE_NAME}:${TAG} to Docker Hub..."
    
    if docker push "${FULL_IMAGE_NAME}:${TAG}"; then
        print_info "Push completed successfully!"
        
        # Also tag as latest if a different tag was used
        if [ "$TAG" != "latest" ]; then
            print_info "Also tagging as latest..."
            docker tag "${FULL_IMAGE_NAME}:${TAG}" "${FULL_IMAGE_NAME}:latest"
            if docker push "${FULL_IMAGE_NAME}:latest"; then
                print_info "Latest tag pushed successfully!"
            else
                print_error "Failed to push latest tag"
                exit 1
            fi
        fi
    else
        print_error "Push failed!"
        print_warn "Make sure you're logged in to Docker Hub: docker login"
        exit 1
    fi
else
    print_info "Skipping push. Image is available locally as ${FULL_IMAGE_NAME}:${TAG}"
fi

