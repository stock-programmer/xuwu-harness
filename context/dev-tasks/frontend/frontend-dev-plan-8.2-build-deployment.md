# Task: 生产构建配置和部署

## 元数据
- **Task ID**: frontend-dev-plan-8.2
- **Layer**: 8
- **Dependencies**: [8.1]
- **Parallel Group**: []
- **Estimated Complexity**: Medium

## 目标
配置生产环境构建、环境变量管理、部署流程、CI/CD 集成、Docker 容器化等。

## 前置条件
- 性能优化已完成（Task 8.1 完成）

## 实现步骤

### 1. 环境变量配置

#### 创建多环境配置文件
已有的环境变量文件：
- `.env.development` - 开发环境
- `.env.production` - 生产环境

创建 `.env.staging`（预发布环境）：
```env
VITE_API_URL=https://staging-api.example.com
VITE_WS_URL=wss://staging-api.example.com
VITE_APP_VERSION=1.0.0-staging
VITE_ENV=staging
```

#### 创建环境变量类型定义
更新 `src/types/global.d.ts`：
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WS_URL: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_ENV: 'development' | 'staging' | 'production';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

#### 创建环境配置工具
创建 `src/config/env.ts`：
```typescript
export const ENV = {
  API_URL: import.meta.env.VITE_API_URL,
  WS_URL: import.meta.env.VITE_WS_URL,
  APP_VERSION: import.meta.env.VITE_APP_VERSION,
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
  ENV_NAME: import.meta.env.VITE_ENV || 'development',
} as const;

// 环境验证
export const validateEnv = () => {
  const required = ['VITE_API_URL', 'VITE_WS_URL'];
  const missing = required.filter((key) => !import.meta.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// 在应用启动时验证
validateEnv();
```

### 2. 生产构建脚本优化

#### 更新 package.json
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "build:staging": "tsc && vite build --mode staging",
    "build:prod": "tsc && vite build --mode production",
    "build:analyze": "tsc && vite build --mode production && npm run analyze",
    "analyze": "npx vite-bundle-visualizer",
    "preview": "vite preview",
    "preview:prod": "vite build --mode production && vite preview",
    "type-check": "tsc --noEmit",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "e2e": "playwright test",
    "clean": "rm -rf dist node_modules/.vite"
  }
}
```

#### 创建构建前检查脚本
创建 `scripts/prebuild.js`：
```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Running pre-build checks...\n');

// 检查 Node 版本
const nodeVersion = process.versions.node;
const requiredVersion = '20.0.0';
if (nodeVersion < requiredVersion) {
  console.error(`❌ Node version ${requiredVersion} or higher required. Current: ${nodeVersion}`);
  process.exit(1);
}
console.log(`✅ Node version: ${nodeVersion}`);

// 检查必需的环境变量文件
const requiredEnvFiles = ['.env.development', '.env.production'];
const missingEnvFiles = requiredEnvFiles.filter(
  (file) => !fs.existsSync(path.join(__dirname, '..', file))
);

if (missingEnvFiles.length > 0) {
  console.error(`❌ Missing environment files: ${missingEnvFiles.join(', ')}`);
  process.exit(1);
}
console.log('✅ Environment files exist');

// 检查 TypeScript 编译
console.log('\n📝 Checking TypeScript...');
const { execSync } = require('child_process');
try {
  execSync('tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ TypeScript check passed');
} catch (error) {
  console.error('❌ TypeScript check failed');
  process.exit(1);
}

// 检查 ESLint
console.log('\n📝 Running ESLint...');
try {
  execSync('eslint . --ext ts,tsx --max-warnings 0', { stdio: 'inherit' });
  console.log('✅ ESLint check passed');
} catch (error) {
  console.error('❌ ESLint check failed');
  process.exit(1);
}

console.log('\n✅ All pre-build checks passed!\n');
```

添加到 package.json：
```json
{
  "scripts": {
    "prebuild": "node scripts/prebuild.js"
  }
}
```

### 3. Docker 容器化

#### 创建 Dockerfile
创建 `Dockerfile`：
```dockerfile
# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
```

#### 创建 Nginx 配置
创建 `nginx.conf`：
```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # SPA 路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理（可选）
    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket 代理（可选）
    location /socket.io {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 创建 docker-compose.yml
创建 `docker-compose.yml`：
```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    networks:
      - app-network
    restart: unless-stopped

  # 如果需要本地开发
  frontend-dev:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "5173:5173"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    networks:
      - app-network
    profiles:
      - dev

networks:
  app-network:
    driver: bridge
```

#### 创建 .dockerignore
创建 `.dockerignore`：
```
node_modules
dist
.git
.gitignore
.env.local
.env.*.local
coverage
*.log
.DS_Store
.vscode
.idea
playwright-report
test-results
```

### 4. CI/CD 配置

#### GitHub Actions
创建 `.github/workflows/deploy.yml`：
```yaml
name: Build and Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Unit tests
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build:prod
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          VITE_WS_URL: ${{ secrets.VITE_WS_URL }}

      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Download artifact
        uses: actions/download-artifact@v3
        with:
          name: dist
          path: dist/

      - name: Deploy to production
        # 这里添加具体的部署步骤
        run: echo "Deploy to production"
        # 例如：使用 SCP、rsync、或云服务 CLI

  docker:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            your-username/claude-harness-frontend:latest
            your-username/claude-harness-frontend:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### 5. 部署脚本

#### 创建部署脚本
创建 `scripts/deploy.sh`：
```bash
#!/bin/bash

set -e

echo "🚀 Starting deployment..."

# 环境变量
ENV=${1:-production}
echo "📦 Environment: $ENV"

# 构建
echo "🔨 Building application..."
npm run build:$ENV

# 检查构建产物
if [ ! -d "dist" ]; then
  echo "❌ Build failed: dist directory not found"
  exit 1
fi

echo "✅ Build successful"

# 部署到服务器（示例）
if [ "$ENV" == "production" ]; then
  echo "🚢 Deploying to production server..."

  # 使用 rsync 同步文件
  rsync -avz --delete dist/ user@server:/var/www/html/

  # 或使用 SCP
  # scp -r dist/* user@server:/var/www/html/

  echo "✅ Deployment successful"
fi

echo "🎉 Done!"
```

添加执行权限：
```bash
chmod +x scripts/deploy.sh
```

### 6. 健康检查和监控

#### 创建健康检查端点
创建 `public/health.json`：
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### 创建版本信息
创建 `scripts/version.js`：
```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const packageJson = require('../package.json');

const versionInfo = {
  version: packageJson.version,
  buildTime: new Date().toISOString(),
  gitCommit: process.env.GITHUB_SHA || 'local',
  environment: process.env.VITE_ENV || 'development',
};

fs.writeFileSync(
  path.join(__dirname, '../public/version.json'),
  JSON.stringify(versionInfo, null, 2)
);

console.log('✅ Version info generated:', versionInfo);
```

添加到构建流程：
```json
{
  "scripts": {
    "prebuild": "node scripts/prebuild.js && node scripts/version.js"
  }
}
```

### 7. 部署文档

创建 `docs/deployment.md`：
```markdown
# 部署指南

## 环境要求

- Node.js 20+
- npm 9+
- Docker (可选)

## 本地构建

```bash
# 安装依赖
npm install

# 开发环境构建
npm run build

# 生产环境构建
npm run build:prod

# 预览构建结果
npm run preview
```

## Docker 部署

```bash
# 构建镜像
docker build -t claude-harness-frontend .

# 运行容器
docker run -p 80:80 claude-harness-frontend

# 使用 docker-compose
docker-compose up -d
```

## 环境变量配置

### 开发环境 (.env.development)
```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

### 生产环境 (.env.production)
```env
VITE_API_URL=https://api.example.com
VITE_WS_URL=wss://api.example.com
```

## 服务器部署

### Nginx 配置

参考 `nginx.conf` 文件

### 使用 PM2（Node.js）

```bash
npm install -g pm2
pm2 serve dist 80 --spa
pm2 save
pm2 startup
```

### 使用静态服务器

```bash
npx serve -s dist -l 80
```

## CI/CD

项目使用 GitHub Actions 进行 CI/CD：

1. Push 到 main 分支触发部署
2. 自动运行测试
3. 构建 Docker 镜像
4. 部署到生产环境

## 健康检查

- 健康检查端点: `/health.json`
- 版本信息端点: `/version.json`

## 回滚

```bash
# Docker 回滚到上一个版本
docker pull your-username/claude-harness-frontend:previous-sha
docker-compose up -d
```

## 故障排查

### 构建失败
- 检查 Node.js 版本
- 清除缓存: `npm run clean && npm install`
- 检查环境变量

### 部署失败
- 检查服务器连接
- 验证 Nginx 配置
- 检查文件权限

### 性能问题
- 运行 Bundle 分析: `npm run build:analyze`
- 检查 Lighthouse 得分
- 查看 Web Vitals 指标
```

### 8. 发布检查清单

创建 `docs/release-checklist.md`：
```markdown
# 发布检查清单

## 发布前

- [ ] 所有测试通过 (Unit + E2E)
- [ ] 代码已 Review
- [ ] 更新 CHANGELOG.md
- [ ] 更新版本号 (package.json)
- [ ] 检查环境变量配置
- [ ] 运行 Lighthouse 审计 (Score > 90)
- [ ] 检查 Bundle 大小 (< 500KB gzipped)
- [ ] 验证所有功能在生产构建中正常工作

## 发布

- [ ] 创建 Git Tag
- [ ] 合并到 main 分支
- [ ] 触发 CI/CD 流程
- [ ] 验证构建成功
- [ ] 验证部署成功

## 发布后

- [ ] 健康检查通过
- [ ] 验证关键功能
- [ ] 监控错误日志
- [ ] 监控性能指标
- [ ] 通知团队发布完成

## 回滚计划

- [ ] 保留上一个版本的 Docker 镜像
- [ ] 准备回滚脚本
- [ ] 测试回滚流程
```

## 期望输出
- ✅ 多环境配置（development/staging/production）
- ✅ 环境变量验证和类型定义
- ✅ 优化的构建脚本
- ✅ 构建前检查脚本
- ✅ Docker 容器化配置
- ✅ Nginx 生产配置
- ✅ CI/CD 流程（GitHub Actions）
- ✅ 部署脚本
- ✅ 健康检查和版本信息
- ✅ 完整的部署文档
- ✅ 发布检查清单

## 验证标准
```bash
# 构建检查
npm run prebuild
npm run build:prod

# Docker 构建
docker build -t claude-harness-frontend .
docker run -p 80:80 claude-harness-frontend

# 访问应用
curl http://localhost/health.json
curl http://localhost/version.json

# 检查：
# - 应用正常运行
# - 健康检查返回 200
# - 版本信息正确
# - 所有资源加载成功
# - 性能指标达标
```

## Claude 执行 Prompt

请配置生产环境构建和部署流程，具体要求如下：

1. **环境变量配置**：
   - 创建 .env.staging
   - 更新 global.d.ts 类型定义
   - 创建 src/config/env.ts 环境配置工具
   - 实现环境变量验证

2. **构建脚本优化**：
   - 更新 package.json 添加多环境构建脚本
   - 创建 scripts/prebuild.js 构建前检查
   - 检查 Node 版本、TypeScript、ESLint

3. **Docker 容器化**：
   - 创建 Dockerfile（多阶段构建）
   - 创建 nginx.conf（SPA 路由、压缩、缓存）
   - 创建 docker-compose.yml
   - 创建 .dockerignore

4. **CI/CD 配置**：
   - 创建 .github/workflows/deploy.yml
   - 测试、构建、部署、Docker 镜像推送
   - 集成 codecov

5. **部署脚本**：
   - 创建 scripts/deploy.sh
   - 支持多环境部署
   - 使用 rsync/scp 同步文件

6. **健康检查和监控**：
   - 创建 public/health.json
   - 创建 scripts/version.js 生成版本信息
   - 添加到构建流程

7. **部署文档**：
   - 创建 docs/deployment.md
   - 包含：环境要求、构建步骤、Docker 部署、Nginx 配置、故障排查

8. **发布检查清单**：
   - 创建 docs/release-checklist.md
   - 发布前/发布/发布后检查项
   - 回滚计划

9. **验证**：
   - 构建成功
   - Docker 镜像运行正常
   - 健康检查通过
   - 部署文档完整

确保部署流程完整、自动化、可靠。
