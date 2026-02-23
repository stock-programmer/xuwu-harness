#!/bin/bash

# Claude Code Harness - Database Backup Script
# Creates a backup of the PostgreSQL database

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
COMPOSE_FILE="docker-compose.prod.yml"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}Creating database backup...${NC}"

# Check if containers are running
if ! docker-compose -f $COMPOSE_FILE ps postgres | grep -q "Up"; then
    echo -e "${RED}Error: PostgreSQL container is not running${NC}"
    exit 1
fi

# Create backup
BACKUP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.sql"

docker-compose -f $COMPOSE_FILE exec -T postgres pg_dump \
    -U ${DB_USER:-postgres} \
    -d ${DB_NAME:-claude_harness} \
    > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

echo -e "${GREEN}✓ Backup created: ${BACKUP_FILE}.gz${NC}"

# Calculate backup size
SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
echo -e "${GREEN}✓ Backup size: ${SIZE}${NC}"

# Clean up old backups (keep last 7 days)
echo -e "${YELLOW}Cleaning up old backups (keeping last 7 days)...${NC}"
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +7 -delete

# List recent backups
echo ""
echo "Recent backups:"
ls -lh "$BACKUP_DIR"/backup_*.sql.gz | tail -5

echo ""
echo -e "${GREEN}Backup complete!${NC}"
echo ""
echo "To restore this backup:"
echo "  gunzip ${BACKUP_FILE}.gz"
echo "  docker-compose -f $COMPOSE_FILE exec -T postgres psql -U \${DB_USER} -d \${DB_NAME} < $BACKUP_FILE"
