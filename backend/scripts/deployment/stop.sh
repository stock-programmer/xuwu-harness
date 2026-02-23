#!/bin/bash

# Claude Code Harness - Stop Script
# Stops the application gracefully

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Determine environment
if [ "$1" = "prod" ] || [ "$1" = "production" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
    ENV="production"
    echo -e "${RED}Stopping PRODUCTION environment${NC}"
else
    COMPOSE_FILE="docker-compose.yml"
    ENV="development"
    echo -e "${YELLOW}Stopping DEVELOPMENT environment${NC}"
fi

# Confirm if production
if [ "$ENV" = "production" ]; then
    echo -e "${RED}WARNING: You are about to stop the PRODUCTION environment${NC}"
    read -p "Are you sure? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "Cancelled"
        exit 0
    fi
fi

echo -e "${YELLOW}Stopping Claude Code Harness Backend...${NC}"

# Stop services gracefully
docker-compose -f $COMPOSE_FILE stop

# Optional: Remove containers
if [ "$2" = "--remove" ]; then
    echo -e "${YELLOW}Removing containers...${NC}"
    docker-compose -f $COMPOSE_FILE down
fi

echo -e "${GREEN}Services stopped successfully!${NC}"

# Show remaining containers
RUNNING=$(docker-compose -f $COMPOSE_FILE ps -q | wc -l)
if [ "$RUNNING" -gt 0 ]; then
    echo ""
    echo "Stopped containers:"
    docker-compose -f $COMPOSE_FILE ps
fi
