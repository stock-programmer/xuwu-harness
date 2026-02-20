# Task: 配置 Docker 和生产部署

## 元数据
- **Task ID**: backend-7.2
- **Layer**: 7
- **Dependencies**: [7.1]
- **Parallel Group**: [7.1, 7.2]
- **Estimated Complexity**: Medium

## 目标
创建 Dockerfile、docker-compose、PM2 配置，实现容器化部署。

## 实现步骤

### 1. 创建 Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### 2. 创建 docker-compose.yml
```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DB_TYPE: postgres
      REDIS_HOST: redis
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: claude_harness
      POSTGRES_PASSWORD: password

  redis:
    image: redis:7-alpine
```

### 3. 创建 PM2 配置
创建 `ecosystem.config.js`：
```javascript
module.exports = {
  apps: [{
    name: 'claude-harness-backend',
    script: './dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '1G',
  }]
};
```

## Claude 执行 Prompt

请创建 Dockerfile、docker-compose.yml、PM2配置文件，实现生产部署。
