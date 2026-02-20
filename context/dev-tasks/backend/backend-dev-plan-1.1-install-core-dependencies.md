# Task: 安装核心依赖包

## 元数据
- **Task ID**: backend-1.1
- **Layer**: 1
- **Dependencies**: [0.1]
- **Parallel Group**: [1.1, 1.2, 1.3, 1.4, 1.5]
- **Estimated Complexity**: Low

## 目标
安装后端开发所需的核心依赖包，包括 Express、WebSocket、数据库、任务队列、工具库等。

## 前置条件
- Layer 0 已完成：项目已初始化
- package.json 已存在

## 实现步骤

### 1. 安装 Express 及中间件
```bash
cd backend
npm install express cors body-parser
npm install -D @types/express @types/cors @types/body-parser
```

### 2. 安装 WebSocket
```bash
npm install ws
npm install -D @types/ws
```

### 3. 安装数据库相关
```bash
npm install sequelize pg pg-hstore sqlite3
npm install ioredis
npm install -D @types/pg
```

### 4. 安装任务队列
```bash
npm install bull
npm install -D @types/bull
```

### 5. 安装工具库
```bash
npm install winston dotenv uuid
npm install chokidar
npm install -D @types/uuid
```

### 6. 验证安装
```bash
npm list express sequelize ioredis bull ws winston
```

## 期望输出

### package.json dependencies
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2",
    "ws": "^8.14.2",
    "sequelize": "^6.33.0",
    "pg": "^8.11.3",
    "pg-hstore": "^2.3.4",
    "sqlite3": "^5.1.6",
    "ioredis": "^5.3.2",
    "bull": "^4.11.5",
    "winston": "^3.11.0",
    "dotenv": "^16.3.1",
    "uuid": "^9.0.1",
    "chokidar": "^3.5.3"
  },
  "devDependencies": {
    "@types/express": "^4.17.20",
    "@types/cors": "^2.8.15",
    "@types/body-parser": "^1.19.4",
    "@types/ws": "^8.5.8",
    "@types/pg": "^8.10.7",
    "@types/bull": "^4.10.0",
    "@types/uuid": "^9.0.6"
  }
}
```

## 验证标准

### 1. 依赖安装验证
```bash
npm list express sequelize ioredis bull ws winston
```
预期：显示所有包的版本号，无错误

### 2. TypeScript 类型检查
创建测试文件验证类型定义：
```typescript
import express from 'express';
import WebSocket from 'ws';
import { Sequelize } from 'sequelize';
import Redis from 'ioredis';
import Bull from 'bull';
import winston from 'winston';
```
运行 `npx tsc --noEmit`，预期无类型错误

### 3. node_modules 验证
```bash
ls node_modules | grep -E "(express|sequelize|ioredis|bull|ws|winston)"
```
预期：所有包都已安装

## Claude 执行 Prompt

请在 backend 目录下执行以下任务：

1. 安装 Express 和中间件：
   - express
   - cors
   - body-parser
   - 以及对应的 TypeScript 类型定义

2. 安装 WebSocket 库：
   - ws
   - @types/ws

3. 安装数据库相关包：
   - sequelize（ORM）
   - pg（PostgreSQL 客户端）
   - pg-hstore
   - sqlite3（开发环境数据库）
   - ioredis（Redis 客户端）
   - @types/pg

4. 安装任务队列：
   - bull
   - @types/bull

5. 安装工具库：
   - winston（日志）
   - dotenv（环境变量）
   - uuid（唯一ID生成）
   - chokidar（文件监控）
   - @types/uuid

6. 验证所有依赖安装成功：
   - 运行 `npm list express sequelize ioredis bull ws winston`
   - 确认所有包都正确安装并显示版本号

确保所有核心依赖都已成功安装，TypeScript 类型定义完整。
