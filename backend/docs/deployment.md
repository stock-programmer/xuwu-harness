# Deployment Guide

This guide covers deploying the Claude Code Harness Backend to various environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Local Development](#local-development)
4. [Production Deployment](#production-deployment)
5. [Docker Deployment](#docker-deployment)
6. [Cloud Deployment](#cloud-deployment)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js**: 18.x or higher
- **PostgreSQL**: 14.x or higher (or SQLite for development)
- **Redis**: 6.x or higher
- **Git**: For version control
- **PM2**: For process management (production)

### Required Services

- Database server (PostgreSQL)
- Redis server
- Sufficient disk space for logs and database
- Network access for WebSocket connections

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/claude-code-harness.git
cd claude-code-harness/backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create environment files based on your environment:

#### Development (.env.development)
```bash
NODE_ENV=development
PORT=3000

# Database - SQLite for development
DB_DIALECT=sqlite
DB_STORAGE=./database.sqlite

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-development-secret-key
JWT_EXPIRES_IN=7d

# Logging
LOG_LEVEL=debug
LOG_FILE_PATH=./logs

# Claude Code
CLAUDE_CODE_TIMEOUT=600000
MAX_RETRIES=2
```

#### Production (.env.production)
```bash
NODE_ENV=production
PORT=3000

# Database - PostgreSQL for production
DB_DIALECT=postgres
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=claude_harness_prod
DB_USER=your-db-user
DB_PASSWORD=your-secure-db-password
DB_POOL_MAX=10
DB_POOL_MIN=2
DB_POOL_ACQUIRE=30000
DB_POOL_IDLE=10000

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# JWT
JWT_SECRET=your-very-secure-secret-key-change-this
JWT_EXPIRES_IN=7d

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=/var/log/claude-harness

# Claude Code
CLAUDE_CODE_TIMEOUT=900000
MAX_RETRIES=3

# CORS (comma-separated origins)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Database Setup

#### Development (SQLite)
```bash
npm run db:init
npm run db:sync
```

#### Production (PostgreSQL)

First, create the database:

```sql
CREATE DATABASE claude_harness_prod;
CREATE USER your_db_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE claude_harness_prod TO your_db_user;
```

Then run migrations:

```bash
npm run db:init
npm run db:sync
```

---

## Local Development

### Start Development Server

```bash
npm run dev
```

The server will start with:
- Hot reload enabled (nodemon)
- Debug logging
- SQLite database
- Local Redis

### Access Points

- **REST API**: http://localhost:3000/api
- **WebSocket**: ws://localhost:3000
- **Health Check**: http://localhost:3000/health

---

## Production Deployment

### 1. Build the Application

```bash
npm run build
```

This creates a `dist/` directory with compiled JavaScript.

### 2. Install PM2 Globally

```bash
npm install -g pm2
```

### 3. Create PM2 Ecosystem File

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'claude-harness-backend',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
    },
    env_production: {
      NODE_ENV: 'production',
    },
    error_file: '/var/log/claude-harness/error.log',
    out_file: '/var/log/claude-harness/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
  }],
};
```

### 4. Start with PM2

```bash
# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

### 5. Manage PM2 Process

```bash
# View status
pm2 status

# View logs
pm2 logs claude-harness-backend

# Restart
pm2 restart claude-harness-backend

# Stop
pm2 stop claude-harness-backend

# Delete
pm2 delete claude-harness-backend

# Monitor
pm2 monit
```

---

## Docker Deployment

### 1. Create Dockerfile

Create `Dockerfile` in backend directory:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Create logs directory
RUN mkdir -p /app/logs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/index.js"]
```

### 2. Create .dockerignore

```
node_modules
dist
logs
*.log
.env*
!.env.example
.git
.husky
coverage
*.sqlite
```

### 3. Build Docker Image

```bash
docker build -t claude-harness-backend:latest .
```

### 4. Run Docker Container

```bash
docker run -d \
  --name claude-harness-backend \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DB_HOST=your-db-host \
  -e DB_PASSWORD=your-password \
  -e REDIS_HOST=your-redis-host \
  -e JWT_SECRET=your-secret \
  -v /path/to/logs:/app/logs \
  claude-harness-backend:latest
```

### 5. Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_NAME=claude_harness
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - REDIS_HOST=redis
      - JWT_SECRET=your-secret-key
    depends_on:
      - postgres
      - redis
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped

  postgres:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=claude_harness
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

Run with:

```bash
docker-compose up -d
```

---

## Cloud Deployment

### AWS Deployment

#### Using EC2

1. **Launch EC2 Instance**
   - AMI: Ubuntu 22.04 LTS
   - Instance Type: t3.medium or larger
   - Security Group: Allow ports 22, 3000

2. **Install Dependencies**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Redis
sudo apt install -y redis-server

# Install PM2
sudo npm install -g pm2
```

3. **Configure PostgreSQL**
```bash
sudo -u postgres createdb claude_harness
sudo -u postgres createuser -P your_user
```

4. **Deploy Application**
```bash
# Clone and setup
git clone your-repo
cd backend
npm install
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

5. **Setup Nginx Reverse Proxy**
```bash
sudo apt install nginx

# Create config
sudo nano /etc/nginx/sites-available/claude-harness
```

Nginx config:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/claude-harness /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

6. **Setup SSL with Let's Encrypt**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

#### Using ECS (Docker)

1. **Build and Push to ECR**
```bash
# Authenticate to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account-id.dkr.ecr.us-east-1.amazonaws.com

# Build and tag
docker build -t claude-harness-backend .
docker tag claude-harness-backend:latest your-account-id.dkr.ecr.us-east-1.amazonaws.com/claude-harness:latest

# Push
docker push your-account-id.dkr.ecr.us-east-1.amazonaws.com/claude-harness:latest
```

2. **Create ECS Task Definition**
3. **Create ECS Service**
4. **Configure Load Balancer**

### Google Cloud Platform

#### Using Cloud Run

```bash
# Build and deploy
gcloud builds submit --tag gcr.io/your-project/claude-harness
gcloud run deploy claude-harness \
  --image gcr.io/your-project/claude-harness \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production
```

### Heroku

```bash
# Create app
heroku create your-app-name

# Add buildpack
heroku buildpacks:set heroku/nodejs

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Add Redis
heroku addons:create heroku-redis:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret

# Deploy
git push heroku main

# Scale
heroku ps:scale web=2
```

---

## Monitoring and Maintenance

### Health Checks

The application exposes a health endpoint:

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": 1234567890,
  "uptime": 3600,
  "database": "connected",
  "redis": "connected"
}
```

### Log Management

#### View Logs

```bash
# PM2 logs
pm2 logs claude-harness-backend

# Docker logs
docker logs -f claude-harness-backend

# File logs
tail -f /var/log/claude-harness/combined.log
```

#### Log Rotation

For PM2, logs auto-rotate. For file logs, use logrotate:

```bash
sudo nano /etc/logrotate.d/claude-harness
```

```
/var/log/claude-harness/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0644 app app
    sharedscripts
}
```

### Database Backups

#### PostgreSQL Backup

```bash
# Create backup
pg_dump -U your_user -d claude_harness > backup_$(date +%Y%m%d).sql

# Restore backup
psql -U your_user -d claude_harness < backup_20240101.sql
```

#### Automated Backups

```bash
# Create backup script
nano /usr/local/bin/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U postgres claude_harness > "$BACKUP_DIR/backup_$DATE.sql"
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

```bash
chmod +x /usr/local/bin/backup-db.sh

# Add to crontab
crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-db.sh
```

### Performance Monitoring

#### PM2 Monitoring

```bash
pm2 install pm2-server-monit
pm2 monit
```

#### Custom Metrics

Consider integrating:
- **Prometheus**: Metrics collection
- **Grafana**: Visualization
- **New Relic**: APM
- **DataDog**: Full-stack monitoring

---

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill process
kill -9 <PID>
```

#### Database Connection Failed

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -U your_user -h localhost -d claude_harness

# Check credentials in .env
cat .env.production | grep DB_
```

#### Redis Connection Failed

```bash
# Check Redis status
sudo systemctl status redis

# Test connection
redis-cli ping
```

#### WebSocket Connection Issues

- Check firewall allows WebSocket connections
- Verify Nginx WebSocket configuration
- Check proxy settings

#### High Memory Usage

```bash
# Monitor memory
pm2 monit

# Adjust max_memory_restart in ecosystem.config.js
# Increase server resources
```

### Debug Mode

Enable debug logging:

```bash
LOG_LEVEL=debug npm run dev
```

### Rolling Back Deployment

```bash
# PM2 rollback
pm2 stop claude-harness-backend
git checkout previous-commit
npm install
npm run build
pm2 restart claude-harness-backend

# Docker rollback
docker stop claude-harness-backend
docker run -d --name claude-harness-backend previous-image-tag
```

---

## Security Checklist

- [ ] Change default JWT secret
- [ ] Use strong database passwords
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable firewall
- [ ] Regular security updates
- [ ] Database backup strategy
- [ ] Monitor error logs
- [ ] Implement log aggregation

---

## Performance Optimization

### Database
- [ ] Add indexes on frequently queried columns
- [ ] Configure connection pooling
- [ ] Enable query logging in development
- [ ] Regular VACUUM for PostgreSQL

### Redis
- [ ] Configure maxmemory policy
- [ ] Enable persistence if needed
- [ ] Monitor memory usage
- [ ] Set appropriate TTLs

### Application
- [ ] Enable compression (gzip)
- [ ] Implement caching strategy
- [ ] Optimize expensive operations
- [ ] Profile and optimize hot paths

---

## Support and Updates

### Updating the Application

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Rebuild
npm run build

# Restart with PM2
pm2 restart claude-harness-backend
```

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update non-breaking
npm update

# Update all (carefully)
npm install -g npm-check-updates
ncu -u
npm install
```

---

## Maintenance Windows

Plan regular maintenance:
- **Weekly**: Check logs, monitor performance
- **Monthly**: Update dependencies, review backups
- **Quarterly**: Security audit, performance review
- **Yearly**: Major version upgrades

---

## Contact and Support

For deployment issues:
- Check logs first
- Review this documentation
- Create an issue on GitHub
- Contact DevOps team
