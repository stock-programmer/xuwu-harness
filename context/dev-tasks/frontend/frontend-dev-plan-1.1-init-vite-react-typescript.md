# Task: 初始化 Vite + React + TypeScript 项目

## 元数据
- **Task ID**: frontend-dev-plan-1.1
- **Layer**: 1
- **Dependencies**: 无
- **Parallel Group**: [1.1, 1.2, 1.3]
- **Estimated Complexity**: Low

## 目标
使用 Vite 创建 React + TypeScript 项目，配置基础的 tsconfig.json 和 vite.config.ts，验证项目可以成功启动。

## 前置条件
- Node.js 18+ 已安装
- npm 或 yarn 已安装
- 工作目录：项目根目录

## 实现步骤

### 1. 创建 Vite + React + TypeScript 项目
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

### 2. 配置 tsconfig.json
创建/更新 `tsconfig.json`，添加路径别名和严格模式：
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path Aliases */
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 3. 配置 vite.config.ts
更新 `vite.config.ts` 添加路径别名、代理和端口配置：
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

### 4. 验证项目启动
```bash
npm run dev
```

访问 http://localhost:5173 确认可以看到 Vite + React 欢迎页面。

## 期望输出
- ✅ `frontend/` 目录创建成功
- ✅ `package.json` 包含 React 18+ 和 TypeScript 5+
- ✅ `tsconfig.json` 配置了路径别名和严格模式
- ✅ `vite.config.ts` 配置了别名、端口和代理
- ✅ `npm run dev` 可以启动开发服务器
- ✅ 可以通过浏览器访问 http://localhost:5173

## 验证标准
```bash
cd frontend
npm run dev
# 应该能访问 http://localhost:5173 并看到 Vite + React 欢迎页面
```

## Claude 执行 Prompt

请初始化一个前端项目，具体要求如下：

1. **创建项目**：
   - 使用 `npm create vite@latest frontend -- --template react-ts` 创建 React + TypeScript 项目
   - 进入 frontend 目录并安装依赖

2. **配置 TypeScript**：
   - 更新 `tsconfig.json`，启用严格模式
   - 配置路径别名 `@/*` 指向 `src/*`
   - 确保包含以下编译选项：strict、noUnusedLocals、noUnusedParameters

3. **配置 Vite**：
   - 更新 `vite.config.ts`
   - 配置路径别名解析（使用 path.resolve）
   - 配置开发服务器端口为 5173
   - 配置 API 代理：`/api` -> `http://localhost:3000`

4. **验证**：
   - 运行 `npm run dev` 启动开发服务器
   - 确认可以访问 http://localhost:5173
   - 确认看到 Vite + React 默认页面

请确保所有配置文件格式正确，项目可以成功编译和运行。
