# Task: 初始化 Node.js + TypeScript 项目

## 元数据
- **Task ID**: backend-0.1
- **Layer**: 0
- **Dependencies**: []
- **Parallel Group**: [0.1, 0.2, 0.3]
- **Estimated Complexity**: Low

## 目标
初始化后端项目的基础结构，配置 TypeScript 编译环境，创建项目目录结构，确保项目可以正常编译和运行。

## 前置条件
- 已安装 Node.js 20+ (LTS)
- 已安装 npm
- 工作目录为项目根目录

## 实现步骤

### 1. 创建后端目录并初始化项目
```bash
mkdir -p backend
cd backend
npm init -y
```

### 2. 安装 TypeScript 和基础依赖
```bash
npm install -D typescript @types/node ts-node nodemon
```

### 3. 创建 tsconfig.json 配置文件
创建 `tsconfig.json` 文件，配置如下：
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 4. 创建目录结构
```bash
mkdir -p src/{config,controllers,services,models,routes,middleware,utils,types}
```

### 5. 创建入口文件
创建 `src/index.ts`：
```typescript
console.log('Claude Code Harness Backend - Starting...');

async function bootstrap() {
  try {
    console.log('Server initialized successfully');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
```

### 6. 配置 package.json scripts
在 `package.json` 中添加以下脚本：
```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

### 7. 创建 .gitignore
```
node_modules/
dist/
.env
.env.*
!.env.example
*.log
.DS_Store
```

## 期望输出

### 文件结构
```
backend/
├── package.json
├── tsconfig.json
├── .gitignore
├── src/
│   ├── index.ts
│   ├── config/
│   ├── controllers/
│   ├── services/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   └── types/
└── node_modules/
```

### 依赖包
- typescript
- @types/node
- ts-node
- nodemon

## 验证标准

### 1. 编译验证
```bash
cd backend
npm run build
```
预期：成功编译到 `dist/` 目录，无错误

### 2. 运行验证
```bash
npm run dev
```
预期：输出 "Claude Code Harness Backend - Starting..." 和 "Server initialized successfully"

### 3. 类型检查
```bash
npx tsc --noEmit
```
预期：无类型错误

## Claude 执行 Prompt

请执行以下任务：

1. 在项目根目录创建 `backend` 目录
2. 在 backend 目录中初始化 Node.js 项目（npm init -y）
3. 安装 TypeScript 和相关依赖：typescript、@types/node、ts-node、nodemon
4. 创建 tsconfig.json 配置文件，配置内容如下：
   - target: ES2020
   - module: commonjs
   - outDir: ./dist
   - rootDir: ./src
   - strict: true
   - 配置路径别名 "@/*"
5. 创建以下目录结构：
   ```
   src/
   ├── config/
   ├── controllers/
   ├── services/
   ├── models/
   ├── routes/
   ├── middleware/
   ├── utils/
   └── types/
   ```
6. 创建 src/index.ts 入口文件，包含基础的 bootstrap 函数
7. 在 package.json 中添加以下 scripts：
   - dev: nodemon --exec ts-node src/index.ts
   - build: tsc
   - start: node dist/index.js
8. 创建 .gitignore 文件，忽略 node_modules、dist、.env 等
9. 运行 `npm run build` 验证编译成功
10. 运行 `npm run dev` 验证项目可以启动

确保所有步骤成功完成，并验证 TypeScript 编译和运行都正常。
