# 部署文档

Claude Harness Frontend 部署指南

## 目录

- [环境要求](#环境要求)
- [环境配置](#环境配置)
- [本地构建](#本地构建)
- [Docker 部署](#docker-部署)
- [CI/CD 流程](#cicd-流程)
- [监控和健康检查](#监控和健康检查)
- [回滚操作](#回滚操作)
- [常见问题](#常见问题)

---

## 环境要求

### 开发环境

- Node.js >= 20.x
- npm >= 10.x
- Git >= 2.x

### 生产环境

- Docker >= 24.x
- Docker Compose >= 2.x
- Nginx (如果不使用 Docker)

### 服务器要求

- CPU: 2 核心以上
- 内存: 4GB 以上
- 磁盘: 20GB 以上可用空间
- 操作系统: Ubuntu 22.04 LTS / CentOS 8+ / Debian 11+

---

## 环境配置

### 环境变量

项目使用不同的环境配置文件:

```bash
.env.development    # 开发环境 (本地)
.env.staging        # 预发布环境
.env.production     # 生产环境
```

#### 必需的环境变量

| 变量名 | 说明 | 示例 |
|-------|------|------|
| VITE_API_URL | 后端 API 地址 | https://api.example.com |
| VITE_WS_URL | WebSocket 地址 | wss://api.example.com |
| VITE_APP_VERSION | 应用版本号 | 1.0.0 |
| VITE_ENV | 环境标识 | production |

#### 配置示例

**Staging (.env.staging)**
```bash
VITE_API_URL=https://staging-api.example.com
VITE_WS_URL=wss://staging-api.example.com
VITE_APP_VERSION=1.0.0-staging
VITE_ENV=staging
```

**Production (.env.production)**
```bash
VITE_API_URL=https://api.example.com
VITE_WS_URL=wss://api.example.com
VITE_APP_VERSION=1.0.0
VITE_ENV=production
```

---

## 本地构建

### 安装依赖

```bash
npm ci
```

### 开发模式

```bash
npm run dev
```

访问: http://localhost:5173

### 构建生产版本

```bash
# Staging 环境
npm run build:staging

# Production 环境
npm run build:production
```

### 预览构建结果

```bash
# Staging
npm run preview:staging

# Production
npm run preview:production
```

### Bundle 分析

```bash
npm run build:analyze
```

构建完成后会自动打开 `dist/stats.html` 显示 bundle 分析报告。

---

## Docker 部署

### 1. 构建 Docker 镜像

```bash
# Staging
docker build \
  --build-arg BUILD_MODE=staging \
  --tag claude-harness-frontend:staging \
  .

# Production
docker build \
  --build-arg BUILD_MODE=production \
  --tag claude-harness-frontend:latest \
  .
```

### 2. 运行容器

#### 单独运行前端

```bash
docker run -d \
  --name claude-harness-frontend \
  -p 80:80 \
  claude-harness-frontend:latest
```

#### 使用 Docker Compose

```bash
# 启动所有服务
docker-compose up -d

# 仅启动前端
docker-compose up -d frontend

# 查看日志
docker-compose logs -f frontend

# 停止服务
docker-compose down
```

### 3. 健康检查

```bash
# 检查容器健康状态
docker ps

# 访问健康检查端点
curl http://localhost/health.json
```

---

## CI/CD 流程

### GitHub Actions 工作流

项目使用 GitHub Actions 实现自动化 CI/CD。

#### 触发条件

- **Push 到 main**: 部署到生产环境
- **Push 到 staging**: 部署到预发布环境
- **Pull Request**: 运行测试但不部署

#### 流程步骤

1. **Test (测试阶段)**
   - 代码检查 (ESLint)
   - 单元测试 (Vitest)
   - E2E 测试 (Playwright)
   - 上传测试报告和覆盖率

2. **Build (构建阶段)**
   - 并行构建 staging 和 production 版本
   - 上传构建产物

3. **Docker (镜像阶段)**
   - 构建 Docker 镜像
   - 推送到 GitHub Container Registry

4. **Deploy (部署阶段)**
   - 部署到对应环境
   - 运行健康检查
   - 创建 Release (仅生产环境)

#### 所需的 Secrets

在 GitHub 仓库设置中配置以下 secrets:

| Secret 名称 | 说明 |
|------------|------|
| VITE_API_URL_staging | Staging API URL |
| VITE_WS_URL_staging | Staging WebSocket URL |
| VITE_API_URL_production | Production API URL |
| VITE_WS_URL_production | Production WebSocket URL |
| STAGING_HOST | Staging 服务器地址 |
| STAGING_USER | Staging SSH 用户名 |
| STAGING_SSH_KEY | Staging SSH 私钥 |
| PRODUCTION_HOST | Production 服务器地址 |
| PRODUCTION_USER | Production SSH 用户名 |
| PRODUCTION_SSH_KEY | Production SSH 私钥 |

---

## 使用部署脚本

项目提供了 `scripts/deploy.sh` 脚本简化部署流程。

### 基本用法

```bash
# 构建
./scripts/deploy.sh build -e production

# 构建 Docker 镜像
./scripts/deploy.sh build-docker -e staging -t v1.0.0

# 部署到服务器
./scripts/deploy.sh deploy -e staging -s staging.example.com

# 健康检查
./scripts/deploy.sh health -s https://staging.example.com

# 回滚
./scripts/deploy.sh rollback -s staging.example.com -t v1.0.0
```

### 完整部署流程示例

```bash
# 1. 构建并部署到 Staging
./scripts/deploy.sh deploy \
  -e staging \
  -s staging.example.com \
  -m docker

# 2. 验证 Staging 环境
./scripts/deploy.sh health -s https://staging.example.com

# 3. 部署到 Production (经过测试后)
./scripts/deploy.sh deploy \
  -e production \
  -s example.com \
  -m docker

# 4. 验证 Production 环境
./scripts/deploy.sh health -s https://example.com
```

---

## 监控和健康检查

### 健康检查端点

**GET /health.json**

返回应用健康状态:

```json
{
  "status": "ok",
  "timestamp": "2026-02-22T00:00:00.000Z"
}
```

**GET /version.json**

返回应用版本信息:

```json
{
  "version": "1.0.0",
  "buildTime": "2026-02-22T00:00:00.000Z",
  "gitCommit": "abc123",
  "gitBranch": "main"
}
```

### Docker 健康检查

Docker 容器每 30 秒自动执行健康检查:

```bash
# 查看健康状态
docker inspect --format='{{.State.Health.Status}}' claude-harness-frontend
```

### 日志查看

```bash
# Docker 日志
docker logs -f claude-harness-frontend

# Nginx 日志
docker exec claude-harness-frontend tail -f /var/log/nginx/access.log
docker exec claude-harness-frontend tail -f /var/log/nginx/error.log
```

---

## 回滚操作

### Docker 回滚

```bash
# 1. 停止当前容器
docker-compose stop frontend

# 2. 使用之前的镜像标签
docker tag claude-harness-frontend:v1.0.0 claude-harness-frontend:latest

# 3. 重新启动
docker-compose up -d frontend

# 4. 验证
curl http://localhost/version.json
```

### 使用部署脚本回滚

```bash
./scripts/deploy.sh rollback \
  -s staging.example.com \
  -t v1.0.0
```

---

## 性能优化

### 构建优化

- ✅ 代码分割 (Code Splitting)
- ✅ 懒加载 (Lazy Loading)
- ✅ Tree Shaking
- ✅ Minification (Terser)
- ✅ Gzip / Brotli 压缩
- ✅ 生产模式移除 console.log

### Nginx 优化

- ✅ 静态资源缓存 (1 年)
- ✅ Gzip 压缩
- ✅ HTTP/2 支持
- ✅ 安全头部配置

### 监控指标

使用 `web-vitals` 库监控:

- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)

---

## 常见问题

### 1. 构建失败: "Missing environment variables"

**原因**: 缺少必需的环境变量

**解决**: 检查 `.env.{environment}` 文件是否包含所有必需变量

```bash
# 验证环境变量
cat .env.production
```

### 2. Docker 容器启动失败

**原因**: 端口被占用或镜像构建失败

**解决**:

```bash
# 检查端口占用
lsof -i :80

# 重新构建镜像
docker-compose build --no-cache frontend
```

### 3. WebSocket 连接失败

**原因**: Nginx 配置不正确或后端服务未启动

**解决**:

1. 检查 nginx.conf 中的 WebSocket 代理配置
2. 确认后端服务正在运行
3. 检查防火墙设置

### 4. 健康检查失败

**原因**: 应用未完全启动或配置错误

**解决**:

```bash
# 查看容器日志
docker logs claude-harness-frontend

# 手动测试健康检查
curl -v http://localhost/health.json
```

### 5. 部署后页面空白

**原因**: 路由配置或 base path 错误

**解决**:

1. 检查浏览器控制台错误
2. 验证 Nginx 配置中的 try_files 指令
3. 确认 vite.config.ts 中的 base 配置

---

## 安全最佳实践

### 1. 环境变量管理

- ❌ 不要提交 `.env` 文件到 Git
- ✅ 使用 CI/CD secrets 管理敏感信息
- ✅ 定期轮换密钥和 token

### 2. Docker 安全

- ✅ 使用官方基础镜像
- ✅ 定期更新镜像
- ✅ 以非 root 用户运行 (Nginx 默认)
- ✅ 使用 .dockerignore 排除敏感文件

### 3. Nginx 安全

- ✅ 配置安全头部 (X-Frame-Options, CSP)
- ✅ 禁用不必要的 HTTP 方法
- ✅ 限制请求大小
- ✅ 配置 HTTPS (生产环境必需)

---

## 维护清单

### 每日

- [ ] 检查应用健康状态
- [ ] 查看错误日志
- [ ] 监控资源使用

### 每周

- [ ] 审查性能指标
- [ ] 检查依赖更新
- [ ] 备份重要数据

### 每月

- [ ] 更新依赖包
- [ ] 安全审计
- [ ] 性能优化review

---

## 支持

如有问题，请联系:

- 技术支持: support@example.com
- 文档: https://docs.example.com
- Issue 跟踪: https://github.com/your-org/claude-harness/issues
