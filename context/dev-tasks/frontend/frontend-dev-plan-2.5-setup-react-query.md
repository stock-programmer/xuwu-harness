# Task: 配置 React Query

## 元数据
- **Task ID**: frontend-dev-plan-2.5
- **Layer**: 2
- **Dependencies**: [1.1]
- **Parallel Group**: [2.1, 2.2, 2.3, 2.4, 2.5, 2.6]
- **Estimated Complexity**: Low

## 目标
安装 @tanstack/react-query，配置 QueryClient，创建 QueryClientProvider，配置 DevTools。

## 前置条件
- 项目已初始化（Task 1.1 完成）

## 实现步骤

### 1. 安装 React Query
```bash
cd frontend
npm install @tanstack/react-query
npm install -D @tanstack/react-query-devtools
```

### 2. 创建 QueryClient 配置
创建 `src/services/query-client.ts`：
```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 分钟
      cacheTime: 10 * 60 * 1000, // 10 分钟
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### 3. 在 App.tsx 中添加 QueryClientProvider
更新 `src/App.tsx`：
```typescript
import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { router } from './routes';
import { theme } from './config/theme';
import { queryClient } from './services/query-client';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={theme}>
        <RouterProvider router={router} />
        {/* React Query DevTools - 仅开发环境 */}
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
```

### 4. 创建示例 Query Hook
创建 `src/hooks/useProjects.ts`（示例）：
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Project {
  id: string;
  name: string;
  type: string;
  status: string;
}

// 示例 API 函数（实际应该在 services/api 中）
const fetchProjects = async (): Promise<Project[]> => {
  const response = await fetch('/api/projects');
  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }
  return response.json();
};

const createProject = async (data: Partial<Project>): Promise<Project> => {
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create project');
  }
  return response.json();
};

// Query Hook
export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    staleTime: 30000, // 30 秒
  });
};

// Mutation Hook
export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      // 创建成功后刷新项目列表
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};
```

### 5. 测试 Query 使用
在 `src/pages/Dashboard/Dashboard.tsx` 中测试：
```typescript
import React from 'react';
import { Typography, Spin, Alert } from 'antd';
import { useProjects } from '@/hooks/useProjects';

const { Title } = Typography;

export const Dashboard: React.FC = () => {
  const { data: projects, isLoading, error } = useProjects();

  if (isLoading) {
    return <Spin size="large" />;
  }

  if (error) {
    return <Alert message="Error" description={error.message} type="error" />;
  }

  return (
    <div>
      <Title level={2}>Dashboard</Title>
      <p>Projects: {projects?.length || 0}</p>
    </div>
  );
};
```

## 期望输出
- ✅ `@tanstack/react-query` 安装成功
- ✅ `@tanstack/react-query-devtools` 安装成功
- ✅ `src/services/query-client.ts` 配置完成
- ✅ QueryClientProvider 添加到 App.tsx
- ✅ React Query DevTools 可以访问（开发环境）
- ✅ 示例 Query Hook 创建

## 验证标准
```bash
npm run dev
# 打开浏览器 http://localhost:5173
# 应该能看到右下角有 React Query DevTools 图标
# 点击图标应该能看到查询状态和缓存数据
```

## Claude 执行 Prompt

请为前端项目配置 React Query，具体要求如下：

1. **安装依赖**：
   - 安装 @tanstack/react-query
   - 安装 @tanstack/react-query-devtools（开发依赖）

2. **配置 QueryClient**（src/services/query-client.ts）：
   - 创建 QueryClient 实例
   - 配置默认选项：
     - queries.staleTime: 5 分钟
     - queries.cacheTime: 10 分钟
     - queries.retry: 3 次
     - queries.refetchOnWindowFocus: false
     - queries.refetchOnReconnect: true
     - mutations.retry: 1 次

3. **集成到应用**（src/App.tsx）：
   - 导入 QueryClientProvider 和 queryClient
   - 用 QueryClientProvider 包裹应用
   - 添加 ReactQueryDevtools（仅开发环境）
   - 确保正确嵌套：QueryClientProvider > ConfigProvider > RouterProvider

4. **创建示例 Hook**（src/hooks/useProjects.ts）：
   - 创建 useProjects query hook（获取项目列表）
   - 创建 useCreateProject mutation hook（创建项目）
   - 实现自动刷新（mutation 成功后 invalidate queries）

5. **测试使用**：
   - 在 Dashboard 页面中使用 useProjects
   - 显示 loading 状态（Spin 组件）
   - 显示 error 状态（Alert 组件）
   - 显示数据

6. **验证**：
   - 运行 `npm run dev`
   - 打开 React Query DevTools
   - 确认可以看到查询状态和缓存数据

确保 React Query 配置正确，DevTools 可用，查询和变更功能正常。
