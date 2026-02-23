#!/bin/bash

################################################################################
# Claude Harness Frontend Deployment Script
# Description: Automate deployment to staging/production environments
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOY_DIR="/opt/claude-harness"

################################################################################
# Helper Functions
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

confirm() {
    read -p "$1 (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warning "Operation cancelled"
        exit 1
    fi
}

check_dependencies() {
    local deps=("node" "npm" "docker" "docker-compose")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            log_error "$dep is not installed"
            exit 1
        fi
    done
    log_success "All dependencies are installed"
}

################################################################################
# Build Functions
################################################################################

build_local() {
    local mode=$1
    log_info "Building for $mode environment..."

    cd "$PROJECT_ROOT"
    npm ci
    npm run build:$mode

    log_success "Build completed successfully"
}

build_docker() {
    local mode=$1
    local tag=${2:-"latest"}

    log_info "Building Docker image for $mode..."

    cd "$PROJECT_ROOT"
    docker build \
        --build-arg BUILD_MODE=$mode \
        --tag claude-harness-frontend:$tag \
        --tag claude-harness-frontend:$mode \
        .

    log_success "Docker image built successfully"
}

################################################################################
# Deploy Functions
################################################################################

deploy_local() {
    local mode=$1
    local server=$2

    log_info "Deploying to $server ($mode)..."

    # Build
    build_local $mode

    # Copy files to server
    log_info "Copying files to server..."
    rsync -avz --delete \
        "$PROJECT_ROOT/dist/" \
        "$server:$DEPLOY_DIR/frontend/"

    # Restart nginx
    log_info "Restarting nginx..."
    ssh "$server" "sudo systemctl restart nginx"

    log_success "Deployment completed successfully"
}

deploy_docker() {
    local mode=$1
    local server=$2

    log_info "Deploying Docker container to $server ($mode)..."

    # Build Docker image
    build_docker $mode

    # Save image and copy to server
    log_info "Transferring Docker image..."
    docker save claude-harness-frontend:$mode | \
        ssh "$server" "docker load"

    # Deploy with docker-compose
    log_info "Starting container..."
    ssh "$server" "cd $DEPLOY_DIR && docker-compose up -d frontend"

    # Clean up old images
    ssh "$server" "docker image prune -f"

    log_success "Docker deployment completed successfully"
}

################################################################################
# Health Check
################################################################################

health_check() {
    local url=$1
    local max_retries=30
    local retry_interval=2

    log_info "Running health check on $url..."

    for i in $(seq 1 $max_retries); do
        if curl -sf "$url/health.json" > /dev/null; then
            log_success "Health check passed"
            return 0
        fi
        log_info "Waiting for application to be ready... ($i/$max_retries)"
        sleep $retry_interval
    done

    log_error "Health check failed after $max_retries attempts"
    return 1
}

################################################################################
# Rollback
################################################################################

rollback() {
    local server=$1
    local backup_tag=$2

    log_warning "Rolling back to $backup_tag..."

    ssh "$server" "cd $DEPLOY_DIR && \
        docker-compose stop frontend && \
        docker tag claude-harness-frontend:$backup_tag claude-harness-frontend:latest && \
        docker-compose up -d frontend"

    log_success "Rollback completed"
}

################################################################################
# Main Menu
################################################################################

show_usage() {
    cat << EOF
Usage: $0 [COMMAND] [OPTIONS]

Commands:
    build           Build the application locally
    build-docker    Build Docker image
    deploy          Deploy to server
    health          Run health check
    rollback        Rollback to previous version

Options:
    -e, --env       Environment (staging|production) [default: staging]
    -s, --server    Server hostname or IP
    -t, --tag       Docker image tag [default: latest]
    -m, --method    Deployment method (local|docker) [default: docker]

Examples:
    $0 build -e production
    $0 build-docker -e staging -t v1.0.0
    $0 deploy -e staging -s staging.example.com
    $0 health -s https://staging.example.com
    $0 rollback -s staging.example.com -t v1.0.0

EOF
}

################################################################################
# Main
################################################################################

main() {
    # Parse arguments
    local command=$1
    shift || true

    local env="staging"
    local server=""
    local tag="latest"
    local method="docker"

    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--env)
                env="$2"
                shift 2
                ;;
            -s|--server)
                server="$2"
                shift 2
                ;;
            -t|--tag)
                tag="$2"
                shift 2
                ;;
            -m|--method)
                method="$2"
                shift 2
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done

    # Validate environment
    if [[ ! "$env" =~ ^(staging|production)$ ]]; then
        log_error "Invalid environment: $env"
        exit 1
    fi

    # Execute command
    case $command in
        build)
            check_dependencies
            build_local "$env"
            ;;
        build-docker)
            check_dependencies
            build_docker "$env" "$tag"
            ;;
        deploy)
            if [[ -z "$server" ]]; then
                log_error "Server hostname is required for deployment"
                exit 1
            fi

            confirm "Deploy to $server ($env environment)?"
            check_dependencies

            if [[ "$method" == "docker" ]]; then
                deploy_docker "$env" "$server"
            else
                deploy_local "$env" "$server"
            fi

            # Health check
            local url="https://$server"
            [[ "$env" == "staging" ]] && url="https://staging.$server"
            health_check "$url"
            ;;
        health)
            if [[ -z "$server" ]]; then
                log_error "Server URL is required"
                exit 1
            fi
            health_check "$server"
            ;;
        rollback)
            if [[ -z "$server" ]]; then
                log_error "Server hostname is required"
                exit 1
            fi
            confirm "Rollback to $tag on $server?"
            rollback "$server" "$tag"
            ;;
        *)
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
