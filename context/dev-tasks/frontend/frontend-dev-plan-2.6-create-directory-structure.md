# Task: 创建项目目录结构

## 元数据
- **Task ID**: frontend-dev-plan-2.6
- **Layer**: 2
- **Dependencies**: [1.1]
- **Parallel Group**: [2.1, 2.2, 2.3, 2.4, 2.5, 2.6]
- **Estimated Complexity**: Low

## 目标
创建标准化的目录结构，添加 README 和索引文件，配置路径别名，创建类型定义文件。

## 前置条件
- 项目已初始化（Task 1.1 完成）

## 实现步骤

### 1. 创建完整的目录结构
```bash
cd frontend/src

# 创建所有目录
mkdir -p assets/{images,icons,fonts}
mkdir -p components/{common,layout,business}
mkdir -p pages
mkdir -p features/{file-explorer,output-console,mode-control,task-execution}/{components,hooks,services}
mkdir -p store
mkdir -p services/{api,websocket,storage}
mkdir -p hooks
mkdir -p utils
mkdir -p types
mkdir -p constants
mkdir -p styles
mkdir -p tests/{unit,integration,e2e}
```

### 2. 创建索引文件
创建 `src/components/index.ts`：
```typescript
// 通用组件
export * from './common';

// 布局组件
export * from './layout';

// 业务组件
export * from './business';
```

创建 `src/utils/index.ts`：
```typescript
// 工具函数统一导出
export * from './format';
export * from './validation';
export * from './file';
export * from './dag';
```

创建 `src/constants/index.ts`：
```typescript
export * from './routes';
export * from './modes';
export * from './config';
```

### 3. 创建全局类型定义
创建 `src/types/global.d.ts`：
```typescript
/// <reference types="vite/client" />

// 环境变量类型
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WS_URL: string;
  readonly VITE_APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// 全局类型扩展
declare global {
  interface Window {
    __CLAUDE_HARNESS__: {
      version: string;
      env: string;
    };
  }
}

export {};
```

创建 `src/vite-env.d.ts`：
```typescript
/// <reference types="vite/client" />
```

### 4. 验证路径别名配置
确保 `tsconfig.json` 包含路径别名配置：
```json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["components/*"],
      "@/pages/*": ["pages/*"],
      "@/features/*": ["features/*"],
      "@/store/*": ["store/*"],
      "@/services/*": ["services/*"],
      "@/hooks/*": ["hooks/*"],
      "@/utils/*": ["utils/*"],
      "@/types/*": ["types/*"],
      "@/constants/*": ["constants/*"],
      "@/styles/*": ["styles/*"]
    }
  }
}
```

确保 `vite.config.ts` 包含别名配置：
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/store': path.resolve(__dirname, './src/store'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/constants': path.resolve(__dirname, './src/constants'),
      '@/styles': path.resolve(__dirname, './src/styles'),
    },
  },
})
```

### 5. 创建 README 文件
创建 `src/README.md`：
```markdown
# Frontend 源代码目录结构

## 目录说明

- **assets/**: 静态资源（图片、图标、字体）
- **components/**: 通用组件
  - common/: 基础组件（Button、Input 等）
  - layout/: 布局组件（Header、Sidebar 等）
  - business/: 业务组件（FileTree、CodeEditor 等）
- **pages/**: 页面组件
- **features/**: 功能模块（按功能划分）
  - file-explorer/: 文件浏览器
  - output-console/: 输出控制台
  - mode-control/: 模式控制
  - task-execution/: 任务执行
- **store/**: 状态管理（Zustand stores）
- **services/**: 服务层
  - api/: HTTP API
  - websocket/: WebSocket 客户端
  - storage/: 本地存储
- **hooks/**: 自定义 React Hooks
- **utils/**: 工具函数
- **types/**: TypeScript 类型定义
- **constants/**: 常量定义
- **styles/**: 全局样式
- **tests/**: 测试文件

## 路径别名

使用 `@/` 前缀导入模块：

\`\`\`typescript
import { Something } from '@/components/common';
import { useAppStore } from '@/store';
import { formatDate } from '@/utils/format';
\`\`\`
```

### 6. 测试路径别名
创建测试文件 `src/utils/format.ts`：
```typescript
export const formatDate = (date: Date): string => {
  return date.toISOString();
};
```

在 `src/App.tsx` 中测试导入：
```typescript
import { formatDate } from '@/utils/format';

console.log(formatDate(new Date()));
```

## 期望输出
- ✅ 完整的目录结构创建
- ✅ 各目录下有索引文件（index.ts）
- ✅ 类型定义文件创建（global.d.ts, vite-env.d.ts）
- ✅ 路径别名配置完成
- ✅ README 文档创建
- ✅ 路径别名可以正常使用

## 验证标准
```typescript
// 测试路径别名是否工作
import { Something } from '@/components/common';
import { useAppStore } from '@/store';
import { formatDate } from '@/utils';
// TypeScript 不应该报错
```

## Claude 执行 Prompt

请为前端项目创建标准化的目录结构，具体要求如下：

1. **创建目录结构**：
   在 `src/` 下创建以下目录：
   - assets/{images,icons,fonts}
   - components/{common,layout,business}
   - pages
   - features/{file-explorer,output-console,mode-control,task-execution}/{components,hooks,services}
   - store
   - services/{api,websocket,storage}
   - hooks
   - utils
   - types
   - constants
   - styles
   - tests/{unit,integration,e2e}

2. **创建索引文件**：
   - src/components/index.ts（导出所有组件）
   - src/utils/index.ts（导出所有工具函数）
   - src/constants/index.ts（导出所有常量）

3. **创建类型定义**：
   - src/types/global.d.ts（全局类型定义）
   - src/vite-env.d.ts（Vite 类型声明）

4. **配置路径别名**：
   - 在 tsconfig.json 中添加所有路径别名
   - 在 vite.config.ts 中添加对应的 resolve.alias 配置
   - 确保 @ 前缀指向 src 目录

5. **创建 README**：
   - 在 src/README.md 中说明目录结构
   - 说明路径别名的使用方法

6. **验证**：
   - 创建测试文件 src/utils/format.ts
   - 在 App.tsx 中使用路径别名导入
   - 确认 TypeScript 不报错

确保目录结构清晰，路径别名配置正确，TypeScript 类型定义完整。
