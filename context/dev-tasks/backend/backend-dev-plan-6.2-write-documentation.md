# Task: 编写项目文档

## 元数据
- **Task ID**: backend-6.2
- **Layer**: 6
- **Dependencies**: [6.1]
- **Parallel Group**: [6.1, 6.2]
- **Estimated Complexity**: Medium

## 目标
编写项目文档，包括 README、API 文档、架构文档、部署文档。

## 实现步骤

### 1. 创建 README.md
```markdown
# Claude Code Harness - Backend

## 概述
后端服务，提供 DAG 任务执行引擎、WebSocket 实时通信、REST API。

## 快速开始
\`\`\`bash
npm install
npm run dev
\`\`\`

## 环境变量
参见 .env.example

## API 文档
参见 docs/api.md

## 架构
参见 docs/architecture.md
```

### 2. 创建 API 文档
创建 `docs/api.md`，文档化所有 REST API 端点

### 3. 创建架构文档
创建 `docs/architecture.md`，说明系统架构和模块设计

### 4. 创建部署文档
创建 `docs/deployment.md`，说明部署步骤和配置

## Claude 执行 Prompt

请编写完整的项目文档：README、API文档、架构文档、部署文档。
