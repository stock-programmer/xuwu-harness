#!/bin/bash

# Claude Code Harness - Start Script
# Starts the application using Docker Compose

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Determine environment
if [ "$1" = "prod" ] || [ "$1" = "production" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
    ENV="production"
    echo -e "${GREEN}Starting in PRODUCTION mode${NC}"
else
    COMPOSE_FILE="docker-compose.yml"
    ENV="development"
    echo -e "${YELLOW}Starting in DEVELOPMENT mode${NC}"
fi

echo -e "${YELLOW}Starting Claude Code Harness Backend...${NC}"

# Start services
docker-compose -f $COMPOSE_FILE up -d

# Wait for services
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 5

# Show status
docker-compose -f $COMPOSE_FILE ps

echo ""
echo -e "${GREEN}Services started successfully!${NC}"
echo ""
echo "Available commands:"
echo "  View logs:    docker-compose -f $COMPOSE_FILE logs -f"
echo "  Stop:         ./scripts/deployment/stop.sh $ENV"
echo "  Status:       docker-compose -f $COMPOSE_FILE ps"
echo "  Shell:        docker-compose -f $COMPOSE_FILE exec backend sh"
