#!/bin/bash

# Deployment script for Ocean Frenzy game
# Usage: ./deploy.sh [command]
# Commands: start, stop, restart, status, logs, pull, remove

set -e

DOCKER_USERNAME="dhimarketer"
IMAGE_NAME="oceanfrenzy"
FULL_IMAGE_NAME="${DOCKER_USERNAME}/${IMAGE_NAME}"
CONTAINER_NAME="oceanfrenzy"
HOST_PORT=8080
CONTAINER_PORT=80

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_check() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

# Function to check if Docker is installed
check_docker_installed() {
    print_check "Checking if Docker is installed..."
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version 2>/dev/null || echo "unknown")
        print_info "Docker is installed: ${DOCKER_VERSION}"
        return 0
    else
        print_error "Docker is not installed!"
        echo ""
        echo "Please install Docker first:"
        echo "  Ubuntu/Debian: sudo apt-get update && sudo apt-get install docker.io"
        echo "  Or visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
}

# Function to check if Docker daemon is running
check_docker_daemon() {
    print_check "Checking if Docker daemon is running..."
    if docker info &> /dev/null; then
        print_info "Docker daemon is running"
        return 0
    else
        print_error "Docker daemon is not running!"
        echo ""
        echo "Please start Docker daemon:"
        echo "  Linux: sudo systemctl start docker"
        echo "  Or start Docker Desktop if you're using it"
        exit 1
    fi
}

# Function to check Docker permissions
check_docker_permissions() {
    print_check "Checking Docker permissions..."
    if docker ps &> /dev/null; then
        print_info "Docker permissions OK"
        return 0
    else
        print_error "Permission denied. You may need to:"
        echo "  1. Add your user to docker group: sudo usermod -aG docker $USER"
        echo "  2. Log out and log back in"
        echo "  3. Or use sudo (not recommended)"
        exit 1
    fi
}

# Function to check network connectivity (for pulling images)
check_network() {
    print_check "Checking network connectivity..."
    if ping -c 1 -W 2 registry-1.docker.io &> /dev/null || \
       ping -c 1 -W 2 hub.docker.com &> /dev/null || \
       curl -s --max-time 2 https://hub.docker.com &> /dev/null; then
        print_info "Network connectivity OK"
        return 0
    else
        print_warn "Network connectivity check failed (may still work)"
        return 0
    fi
}

# Function to check if port is available
check_port_available() {
    local port=$1
    print_check "Checking if port ${port} is available..."
    
    # Temporarily disable exit on error for this check
    set +e
    
    if command -v netstat &> /dev/null; then
        if netstat -tuln 2>/dev/null | grep -q ":${port} "; then
            print_warn "Port ${port} is already in use"
            echo "  You may need to stop the service using this port or change HOST_PORT in the script"
            echo "  Proceeding anyway - Docker will fail if port is truly unavailable..."
            set -e
            return 0
        fi
    elif command -v ss &> /dev/null; then
        if ss -tuln 2>/dev/null | grep -q ":${port} "; then
            print_warn "Port ${port} is already in use"
            echo "  You may need to stop the service using this port or change HOST_PORT in the script"
            echo "  Proceeding anyway - Docker will fail if port is truly unavailable..."
            set -e
            return 0
        fi
    elif command -v lsof &> /dev/null; then
        if lsof -i :${port} &> /dev/null; then
            print_warn "Port ${port} is already in use"
            echo "  You may need to stop the service using this port or change HOST_PORT in the script"
            echo "  Proceeding anyway - Docker will fail if port is truly unavailable..."
            set -e
            return 0
        fi
    else
        print_warn "Cannot check port availability (netstat/ss/lsof not found)"
        print_warn "Proceeding anyway..."
        set -e
        return 0
    fi
    
    set -e
    print_info "Port ${port} is available"
    return 0
}

# Function to perform all system checks
perform_system_checks() {
    local skip_port_check=${1:-false}
    local skip_network_check=${2:-false}
    
    echo ""
    print_info "Performing system requirement checks..."
    echo ""
    
    check_docker_installed
    check_docker_daemon
    check_docker_permissions
    
    # Only check network if not skipped
    if [ "$skip_network_check" != "true" ] && [ "$skip_network_check" != "skip_network" ]; then
        check_network
    fi
    
    # Only check port if not skipped
    if [ "$skip_port_check" != "true" ] && [ "$skip_port_check" != "skip_port" ]; then
        check_port_available ${HOST_PORT}
    fi
    
    echo ""
    print_info "All system checks passed!"
    echo ""
}

# Function to check if container exists
container_exists() {
    docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"
}

# Function to check if container is running
container_running() {
    docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"
}

# Function to start the container
start_container() {
    perform_system_checks false
    
    if container_running; then
        print_warn "Container ${CONTAINER_NAME} is already running"
        return 0
    fi

    print_info "Starting container ${CONTAINER_NAME}..."
    
    if container_exists; then
        docker start ${CONTAINER_NAME}
    else
        # Check if image exists locally
        if ! docker images --format '{{.Repository}}:{{.Tag}}' | grep -q "^${FULL_IMAGE_NAME}:latest$"; then
            print_warn "Image ${FULL_IMAGE_NAME}:latest not found locally"
            print_info "Pulling image from Docker Hub..."
            docker pull ${FULL_IMAGE_NAME}:latest
        fi
        
        docker run -d \
            --name ${CONTAINER_NAME} \
            -p ${HOST_PORT}:${CONTAINER_PORT} \
            --restart unless-stopped \
            ${FULL_IMAGE_NAME}:latest
    fi
    
    if container_running; then
        print_info "Container started successfully!"
        print_info "Game is available at: http://localhost:${HOST_PORT}"
    else
        print_error "Failed to start container"
        exit 1
    fi
}

# Function to stop the container
stop_container() {
    perform_system_checks skip_port skip_network
    
    if ! container_exists; then
        print_warn "Container ${CONTAINER_NAME} does not exist"
        return 0
    fi

    if ! container_running; then
        print_warn "Container ${CONTAINER_NAME} is not running"
        return 0
    fi

    print_info "Stopping container ${CONTAINER_NAME}..."
    docker stop ${CONTAINER_NAME}
    print_info "Container stopped successfully!"
}

# Function to restart the container
restart_container() {
    perform_system_checks false
    
    print_info "Restarting container ${CONTAINER_NAME}..."
    
    if container_exists; then
        if container_running; then
            docker restart ${CONTAINER_NAME}
        else
            docker start ${CONTAINER_NAME}
        fi
        print_info "Container restarted successfully!"
        print_info "Game is available at: http://localhost:${HOST_PORT}"
    else
        print_warn "Container does not exist. Starting new container..."
        start_container
    fi
}

# Function to show container status
show_status() {
    # Only check Docker, skip other checks for status
    check_docker_installed
    check_docker_daemon
    check_docker_permissions
    echo ""
    
    print_info "Container Status:"
    echo ""
    
    if ! container_exists; then
        print_warn "Container ${CONTAINER_NAME} does not exist"
        return 0
    fi

    if container_running; then
        print_info "Status: ${GREEN}RUNNING${NC}"
        echo ""
        docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo ""
        print_info "Game URL: http://localhost:${HOST_PORT}"
    else
        print_warn "Status: ${YELLOW}STOPPED${NC}"
        echo ""
        docker ps -a --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    fi
}

# Function to show container logs
show_logs() {
    # Only check Docker, skip other checks for logs
    check_docker_installed
    check_docker_daemon
    check_docker_permissions
    echo ""
    
    if ! container_exists; then
        print_error "Container ${CONTAINER_NAME} does not exist"
        exit 1
    fi

    print_info "Showing logs for ${CONTAINER_NAME} (Press Ctrl+C to exit)..."
    echo ""
    docker logs -f ${CONTAINER_NAME}
}

# Function to pull latest image
pull_image() {
    perform_system_checks skip_port
    
    print_info "Pulling latest image ${FULL_IMAGE_NAME}:latest..."
    docker pull ${FULL_IMAGE_NAME}:latest
    print_info "Image pulled successfully!"
}

# Function to remove container
remove_container() {
    perform_system_checks skip_port skip_network
    
    if ! container_exists; then
        print_warn "Container ${CONTAINER_NAME} does not exist"
        return 0
    fi

    if container_running; then
        print_warn "Container is running. Stopping it first..."
        docker stop ${CONTAINER_NAME}
    fi

    print_info "Removing container ${CONTAINER_NAME}..."
    docker rm ${CONTAINER_NAME}
    print_info "Container removed successfully!"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start     - Start the game container"
    echo "  stop      - Stop the game container"
    echo "  restart   - Restart the game container"
    echo "  status    - Show container status"
    echo "  logs      - Show container logs (follow mode)"
    echo "  pull      - Pull latest image from Docker Hub"
    echo "  remove    - Remove the container"
    echo ""
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 restart"
    echo "  $0 status"
}

# Main script logic
case "${1:-}" in
    start)
        start_container
        ;;
    stop)
        stop_container
        ;;
    restart)
        restart_container
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    pull)
        pull_image
        ;;
    remove)
        remove_container
        ;;
    *)
        show_usage
        exit 1
        ;;
esac

