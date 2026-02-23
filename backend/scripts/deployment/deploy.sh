#!/bin/bash

# Claude Code Harness - Deployment Script
# This script handles deployment to production using Docker Compose

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
BACKUP_DIR="./backups"

echo -e "${GREEN}=== Claude Code Harness - Production Deployment ===${NC}"

# Check if .env.production exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Error: $ENV_FILE not found${NC}"
    echo "Please create $ENV_FILE with your production configuration"
    exit 1
fi

# Load environment variables
export $(cat $ENV_FILE | grep -v '^#' | xargs)

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}Step 1: Creating database backup...${NC}"
./scripts/deployment/backup-db.sh

echo -e "${YELLOW}Step 2: Pulling latest images...${NC}"
docker-compose -f $COMPOSE_FILE pull

echo -e "${YELLOW}Step 3: Building application...${NC}"
docker-compose -f $COMPOSE_FILE build --no-cache backend

echo -e "${YELLOW}Step 4: Stopping old containers...${NC}"
docker-compose -f $COMPOSE_FILE down

echo -e "${YELLOW}Step 5: Starting new containers...${NC}"
docker-compose -f $COMPOSE_FILE up -d

echo -e "${YELLOW}Step 6: Waiting for services to be healthy...${NC}"
sleep 10

# Check if backend is healthy
if docker-compose -f $COMPOSE_FILE ps backend | grep -q "Up"; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend failed to start${NC}"
    echo "Checking logs:"
    docker-compose -f $COMPOSE_FILE logs backend
    exit 1
fi

# Check if postgres is healthy
if docker-compose -f $COMPOSE_FILE ps postgres | grep -q "Up"; then
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"
else
    echo -e "${RED}✗ PostgreSQL failed to start${NC}"
    exit 1
fi

# Check if redis is healthy
if docker-compose -f $COMPOSE_FILE ps redis | grep -q "Up"; then
    echo -e "${GREEN}✓ Redis is running${NC}"
else
    echo -e "${RED}✗ Redis failed to start${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 7: Running database migrations...${NC}"
docker-compose -f $COMPOSE_FILE exec -T backend node dist/scripts/sync-db.js

echo -e "${YELLOW}Step 8: Cleaning up old images...${NC}"
docker image prune -f

echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo ""
echo "Services running:"
docker-compose -f $COMPOSE_FILE ps
echo ""
echo -e "${GREEN}Access your application at: http://localhost${NC}"
echo -e "${YELLOW}View logs: docker-compose -f $COMPOSE_FILE logs -f${NC}"
