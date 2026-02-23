# Deployment Scripts

Helper scripts for deploying and managing the Claude Code Harness Backend.

## Available Scripts

### deploy.sh
Main deployment script for production. Handles the complete deployment process including backups, building, and health checks.

**Usage:**
```bash
./scripts/deployment/deploy.sh
```

**What it does:**
1. Creates a database backup
2. Pulls latest Docker images
3. Builds the application
4. Stops old containers
5. Starts new containers
6. Runs database migrations
7. Verifies all services are healthy

### start.sh
Starts the application in development or production mode.

**Usage:**
```bash
# Development mode
./scripts/deployment/start.sh

# Production mode
./scripts/deployment/start.sh prod
```

### stop.sh
Gracefully stops the application.

**Usage:**
```bash
# Stop development environment
./scripts/deployment/stop.sh

# Stop production environment
./scripts/deployment/stop.sh prod

# Stop and remove containers
./scripts/deployment/stop.sh prod --remove
```

### backup-db.sh
Creates a compressed backup of the PostgreSQL database.

**Usage:**
```bash
./scripts/deployment/backup-db.sh
```

**Features:**
- Creates timestamped backups
- Compresses with gzip
- Automatically cleans up backups older than 7 days
- Provides restore instructions

## Prerequisites

- Docker and Docker Compose installed
- `.env.production` file configured
- Sufficient disk space for backups

## Quick Start

### First Time Deployment

1. Configure environment:
```bash
cp .env.example .env.production
# Edit .env.production with your settings
```

2. Deploy:
```bash
./scripts/deployment/deploy.sh
```

### Daily Operations

**Start services:**
```bash
./scripts/deployment/start.sh prod
```

**View logs:**
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

**Stop services:**
```bash
./scripts/deployment/stop.sh prod
```

**Create backup:**
```bash
./scripts/deployment/backup-db.sh
```

## Troubleshooting

### Services not starting
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Check specific service
docker-compose -f docker-compose.prod.yml logs backend
```

### Database connection issues
```bash
# Check PostgreSQL status
docker-compose -f docker-compose.prod.yml ps postgres

# Access PostgreSQL shell
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d claude_harness
```

### Restore from backup
```bash
# List backups
ls -lh ./backups/

# Restore (replace TIMESTAMP with actual timestamp)
gunzip ./backups/backup_TIMESTAMP.sql.gz
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d claude_harness < ./backups/backup_TIMESTAMP.sql
```

## Maintenance

### Regular Tasks

**Daily:**
- Monitor application logs
- Check disk space

**Weekly:**
- Review backup files
- Check for security updates

**Monthly:**
- Update dependencies
- Review and optimize database

### Automated Backups

Set up a cron job for automated backups:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/backend && ./scripts/deployment/backup-db.sh >> ./logs/backup.log 2>&1
```

## Emergency Procedures

### Rollback Deployment

1. Stop current containers:
```bash
docker-compose -f docker-compose.prod.yml down
```

2. Restore from backup:
```bash
# Restore database
gunzip ./backups/backup_TIMESTAMP.sql.gz
docker-compose -f docker-compose.prod.yml up -d postgres
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d claude_harness < ./backups/backup_TIMESTAMP.sql
```

3. Revert code:
```bash
git checkout <previous-commit>
```

4. Rebuild and start:
```bash
./scripts/deployment/deploy.sh
```

### Emergency Stop

```bash
# Stop all services immediately
docker-compose -f docker-compose.prod.yml down

# Or kill all containers
docker kill $(docker ps -q)
```
