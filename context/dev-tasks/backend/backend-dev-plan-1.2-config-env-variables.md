# Task: 配置环境变量管理

## 元数据
- **Task ID**: backend-1.2
- **Layer**: 1
- **Dependencies**: [0.1]
- **Parallel Group**: [1.1, 1.2, 1.3, 1.4, 1.5]
- **Estimated Complexity**: Low

## 目标
创建环境变量配置系统，实现类型安全的配置管理，支持多环境配置（开发、测试、生产）。

## 前置条件
- 项目已初始化（Task 0.1）
- package.json 已存在

## 实现步骤

### 1. 创建 .env.example 模板
创建 `backend/.env.example`：
```env
# Server
NODE_ENV=development
PORT=3000
HOST=localhost

# Database
DB_TYPE=sqlite
DB_HOST=localhost
DB_PORT=5432
DB_NAME=claude_harness
DB_USER=postgres
DB_PASSWORD=password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Claude API
ANTHROPIC_API_KEY=sk-ant-xxx
CLAUDE_MAX_CONCURRENT=10
CLAUDE_TIMEOUT=600000

# WebSocket
WS_PORT=3001

# Logging
LOG_LEVEL=info
LOG_DIR=./logs
```

### 2. 创建环境配置文件
```bash
cd backend
cp .env.example .env.development
cp .env.example .env.production
```

### 3. 创建类型安全的配置模块
创建 `src/config/env.ts`：
```typescript
import dotenv from 'dotenv';
import path from 'path';

// 根据 NODE_ENV 加载对应的 .env 文件
dotenv.config({
  path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}`)
});

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || 'localhost',

  database: {
    type: (process.env.DB_TYPE as 'sqlite' | 'postgres') || 'sqlite',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'claude_harness',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  claude: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    maxConcurrent: parseInt(process.env.CLAUDE_MAX_CONCURRENT || '10', 10),
    timeout: parseInt(process.env.CLAUDE_TIMEOUT || '600000', 10),
  },

  websocket: {
    port: parseInt(process.env.WS_PORT || '3001', 10),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || './logs',
  },
};

// 验证必需的环境变量
export function validateConfig() {
  if (config.env === 'production' && !config.claude.apiKey) {
    throw new Error('ANTHROPIC_API_KEY is required in production');
  }
}
```

### 4. 更新 .gitignore
确保 `.env` 文件不被提交：
```
.env
.env.local
.env.*.local
```

## 期望输出

### 新增文件
- `.env.example`
- `.env.development`
- `.env.production`
- `src/config/env.ts`

### 配置对象
类型安全的 `config` 对象，包含所有环境变量

## 验证标准

### 1. 配置加载验证
```typescript
import { config } from '@/config/env';

console.log(config.port); // 应该有 TypeScript 类型提示
console.log(config.database.type); // 'sqlite' | 'postgres'
```

### 2. 环境切换验证
```bash
# 开发环境
NODE_ENV=development npm run dev

# 生产环境
NODE_ENV=production npm start
```

### 3. 必需变量验证
```typescript
import { validateConfig } from '@/config/env';
validateConfig(); // 在生产环境没有 API key 时应该抛出错误
```

## Claude 执行 Prompt

请在 backend 目录下执行以下任务：

1. 创建 .env.example 文件，包含所有环境变量模板：
   - Server 配置（NODE_ENV, PORT, HOST）
   - Database 配置（DB_TYPE, DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD）
   - Redis 配置（REDIS_HOST, REDIS_PORT, REDIS_PASSWORD）
   - Claude API 配置（ANTHROPIC_API_KEY, CLAUDE_MAX_CONCURRENT, CLAUDE_TIMEOUT）
   - WebSocket 配置（WS_PORT）
   - Logging 配置（LOG_LEVEL, LOG_DIR）

2. 复制 .env.example 创建：
   - .env.development
   - .env.production

3. 创建 src/config/env.ts，实现：
   - dotenv 配置加载（根据 NODE_ENV）
   - 类型安全的 config 对象
   - 所有配置项的类型定义和默认值
   - validateConfig() 函数验证必需配置

4. 更新 .gitignore，忽略 .env 文件

5. 验证配置：
   - 导入 config 对象
   - 确认有 TypeScript 类型提示
   - 测试不同环境的配置加载

确保环境变量管理系统完整、类型安全、支持多环境。
