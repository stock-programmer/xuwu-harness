# Claude Code Harness

Claude Code Harness 是一个全栈项目，用于管理和执行 Claude 代码任务，支持前端界面和后端 API 服务。

## 项目结构

```
xuwu-harness/
├── backend/          # 后端服务 (Node.js + Express + TypeScript)
├── frontend/         # 前端应用 (React + Vite + TypeScript)
└── context/          # 上下文和开发文档
```

## 技术栈

### 后端
- Node.js + Express
- TypeScript
- SQLite (开发环境) / PostgreSQL (生产环境)
- Redis (可选，用于队列系统)
- WebSocket (实时通信)
- Bull (任务队列)

### 前端
- React 19
- TypeScript
- Vite
- Ant Design
- TanStack Query
- Zustand (状态管理)
- Monaco Editor

## 快速开始

### 前置要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- Redis (可选，用于任务队列功能)

### 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 环境配置

#### 后端配置

后端使用 `.env.development` 文件（开发环境）：

```bash
# 后端目录已包含配置文件
# backend/.env.development - 开发环境配置
# backend/.env.production - 生产环境配置
```

主要配置项：
- `PORT`: 后端服务端口 (默认: 3000)
- `DB_TYPE`: 数据库类型 (开发环境使用 sqlite)
- `REDIS_HOST`: Redis 主机地址 (可选)
- `ANTHROPIC_API_KEY`: Claude API 密钥 (如需使用 AI 功能)

#### 前端配置

前端使用 `.env.development` 文件（开发环境）：

```bash
# 前端目录已包含配置文件
# frontend/.env.development - 开发环境配置
# frontend/.env.production - 生产环境配置
```

主要配置项：
- `VITE_API_URL`: 后端 API 地址 (默认: http://localhost:3000)
- `VITE_WS_URL`: WebSocket 地址 (默认: ws://localhost:3000)

### 启动项目

#### 开发模式

需要同时启动后端和前端服务：

**1. 启动后端服务**

```bash
cd backend
npm run dev
```

后端服务将在以下地址运行：
- HTTP API: http://localhost:3000
- API 端点: http://localhost:3000/api
- 健康检查: http://localhost:3000/health
- WebSocket: ws://localhost:3000/ws

**2. 启动前端服务**

在新的终端窗口中：

```bash
cd frontend
npm run dev
```

前端应用将在以下地址运行：
- 本地访问: http://localhost:5173

### 访问应用

开发环境启动成功后：

1. 打开浏览器访问 http://localhost:5173
2. 前端会自动连接到后端 API (http://localhost:3000)
3. WebSocket 实时通信会自动建立

### 验证服务状态

检查后端服务状态：

```bash
curl http://localhost:3000/health
```

正常响应示例：
```json
{
  "status": "ok",
  "environment": "development",
  "services": {
    "database": "healthy",
    "redis": "unhealthy",
    "fileMonitor": "active"
  }
}
```

**注意**: Redis 状态为 "unhealthy" 是正常的（如果未安装 Redis），不影响基本功能使用。

## 使用说明

### 创建项目

在前端界面 (http://localhost:5173/dashboard) 创建新项目时，请注意：

**⚠️ 重要：项目根目录必须事先手动创建**

系统不会自动创建项目根目录，你需要在填写表单前先创建好目录：

```bash
# 1. 先创建项目目录
mkdir -p /home/xuwu127/my-new-project

# 2. 然后在前端表单中填写
# 项目名称: my-new-project
# 项目类型: fullstack/frontend/backend
# 项目根目录: /home/xuwu127/my-new-project (填写绝对路径)
# 输出目录: (可选，留空则默认为 {项目根目录}/output)
```

**说明**：
- **项目名称**：保存到数据库中，用于标识和显示
- **项目根目录**：必须是绝对路径（如 `/home/user/project`），不是相对路径
- **输出目录**：可选，默认为 `{项目根目录}/output`
- **自动创建的目录**：执行工作流时，系统会自动创建 `context/` 子目录及其内部结构

如果填写了不存在的根目录，虽然项目会在数据库中创建成功，但后续打开项目或执行操作时会报错。

## 开发说明

### 后端开发

```bash
cd backend

# 开发模式（热重载）
npm run dev

# 构建生产版本
npm run build

# 启动生产版本
npm run start

# 运行测试
npm test

# 数据库初始化
npm run db:init

# 数据库同步
npm run db:sync
```

### 前端开发

```bash
cd frontend

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 运行测试
npm test

# 代码检查
npm run lint
```

## 数据库

### 开发环境

开发环境使用 SQLite，数据库文件位于 `backend/database.sqlite`。

数据库会在首次启动时自动创建和同步表结构。

### 生产环境

生产环境推荐使用 PostgreSQL，需要在 `backend/.env.production` 中配置数据库连接信息。

## Redis（可选）

Redis 用于任务队列系统。如果不需要任务队列功能，可以跳过 Redis 安装。

### 安装 Redis

Ubuntu/Debian:
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

macOS:
```bash
brew install redis
brew services start redis
```

### 验证 Redis

```bash
redis-cli ping
# 应返回: PONG
```

## 常见问题

### 1. 后端启动失败 - 模块找不到

确保已经正确安装依赖：
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### 2. 前端无法连接后端

检查：
- 后端服务是否正常运行 (http://localhost:3000/health)
- 前端 `.env.development` 中的 `VITE_API_URL` 配置是否正确

### 3. Redis 连接失败

Redis 是可选的，不影响基本功能。如需使用任务队列功能：
- 确保 Redis 服务已启动
- 检查 `backend/.env.development` 中的 Redis 配置

### 4. 端口冲突

如果默认端口被占用，可以修改配置：
- 后端: 修改 `backend/.env.development` 中的 `PORT`
- 前端: Vite 会自动选择可用端口，或在 `frontend/vite.config.ts` 中指定

## 项目文档

- [后端 README](./backend/README.md) - 后端详细文档
- [前端 README](./frontend/README.md) - 前端详细文档
- [集成文档](./backend/INTEGRATION.md) - 系统集成说明
- [队列系统](./backend/QUEUE-README.md) - 任务队列使用指南
- [测试文档](./backend/TESTING.md) - 测试指南

## 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

本项目采用 MIT 许可证。

## 联系方式

如有问题或建议，请提交 Issue。
