# Task: 配置 React Router v6

## 元数据
- **Task ID**: frontend-dev-plan-2.3
- **Layer**: 2
- **Dependencies**: [1.1]
- **Parallel Group**: [2.1, 2.2, 2.3, 2.4, 2.5, 2.6]
- **Estimated Complexity**: Medium

## 目标
安装 React Router v6，创建路由配置文件，配置基础路由结构，实现路由懒加载。

## 前置条件
- 项目已初始化（Task 1.1 完成）
- React 18+ 已安装

## 实现步骤

### 1. 安装 React Router
```bash
cd frontend
npm install react-router-dom
```

### 2. 创建路由常量
创建 `src/constants/routes.ts`：
```typescript
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  PROJECT: '/project/:projectId',
  PROJECT_FILES: '/project/:projectId/files',
  PROJECT_TASKS: '/project/:projectId/tasks',
  SETTINGS: '/settings',
  NOT_FOUND: '*',
} as const;
```

### 3. 创建页面组件（占位符）
创建基础页面组件：

`src/pages/Dashboard/Dashboard.tsx`：
```typescript
import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

export const Dashboard: React.FC = () => {
  return (
    <div>
      <Title level={2}>Dashboard</Title>
      <p>项目列表将显示在这里</p>
    </div>
  );
};
```

`src/pages/ProjectView/ProjectView.tsx`：
```typescript
import React from 'react';
import { useParams } from 'react-router-dom';
import { Typography } from 'antd';

const { Title } = Typography;

export const ProjectView: React.FC = () => {
  const { projectId } = useParams();

  return (
    <div>
      <Title level={2}>Project: {projectId}</Title>
      <p>项目详情将显示在这里</p>
    </div>
  );
};
```

`src/pages/Settings/Settings.tsx`：
```typescript
import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

export const Settings: React.FC = () => {
  return (
    <div>
      <Title level={2}>Settings</Title>
      <p>设置页面</p>
    </div>
  );
};
```

`src/pages/NotFound/NotFound.tsx`：
```typescript
import React from 'react';
import { Link } from 'react-router-dom';
import { Result, Button } from 'antd';

export const NotFound: React.FC = () => {
  return (
    <Result
      status="404"
      title="404"
      subTitle="抱歉，您访问的页面不存在。"
      extra={
        <Button type="primary">
          <Link to="/">返回首页</Link>
        </Button>
      }
    />
  );
};
```

### 4. 创建路由配置
创建 `src/routes/index.tsx`：
```typescript
import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { ROUTES } from '@/constants/routes';

// 懒加载页面组件
const Dashboard = lazy(() => import('@/pages/Dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const ProjectView = lazy(() => import('@/pages/ProjectView/ProjectView').then(m => ({ default: m.ProjectView })));
const Settings = lazy(() => import('@/pages/Settings/Settings').then(m => ({ default: m.Settings })));
const NotFound = lazy(() => import('@/pages/NotFound/NotFound').then(m => ({ default: m.NotFound })));

// Loading 组件
const PageLoading: React.FC = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin size="large" />
  </div>
);

// 懒加载包装器
const LazyLoad: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<PageLoading />}>{children}</Suspense>
);

export const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <Navigate to={ROUTES.DASHBOARD} replace />,
  },
  {
    path: ROUTES.DASHBOARD,
    element: (
      <LazyLoad>
        <Dashboard />
      </LazyLoad>
    ),
  },
  {
    path: ROUTES.PROJECT,
    element: (
      <LazyLoad>
        <ProjectView />
      </LazyLoad>
    ),
  },
  {
    path: ROUTES.SETTINGS,
    element: (
      <LazyLoad>
        <Settings />
      </LazyLoad>
    ),
  },
  {
    path: ROUTES.NOT_FOUND,
    element: (
      <LazyLoad>
        <NotFound />
      </LazyLoad>
    ),
  },
]);
```

### 5. 在 App.tsx 中使用 RouterProvider
更新 `src/App.tsx`：
```typescript
import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { router } from './routes';
import { theme } from './config/theme';

function App() {
  return (
    <ConfigProvider theme={theme}>
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}

export default App;
```

## 期望输出
- ✅ `react-router-dom` 安装成功
- ✅ `src/routes/index.tsx` 路由配置完成
- ✅ `src/constants/routes.ts` 路由常量创建
- ✅ 基础页面组件创建（Dashboard、ProjectView、Settings、NotFound）
- ✅ 路由可以正常导航
- ✅ 懒加载配置完成

## 验证标准
```bash
npm run dev
# 访问 http://localhost:5173/ - 应该重定向到 /dashboard
# 访问 http://localhost:5173/dashboard - 应该显示 Dashboard 页面
# 访问 http://localhost:5173/project/123 - 应该显示 ProjectView 页面
# 访问 http://localhost:5173/nonexistent - 应该显示 404 页面
```

## Claude 执行 Prompt

请为前端项目配置 React Router v6，具体要求如下：

1. **安装 React Router**：
   - 安装 react-router-dom

2. **创建路由常量**（src/constants/routes.ts）：
   - 定义所有路由路径常量：
     - HOME: '/'
     - DASHBOARD: '/dashboard'
     - PROJECT: '/project/:projectId'
     - SETTINGS: '/settings'
     - NOT_FOUND: '*'

3. **创建页面组件**：
   - Dashboard 页面（src/pages/Dashboard/Dashboard.tsx）
   - ProjectView 页面（src/pages/ProjectView/ProjectView.tsx）
   - Settings 页面（src/pages/Settings/Settings.tsx）
   - NotFound 页面（src/pages/NotFound/NotFound.tsx）
   - 暂时使用简单的占位符内容

4. **配置路由**（src/routes/index.tsx）：
   - 使用 createBrowserRouter 创建路由配置
   - 实现路由懒加载（使用 React.lazy 和 Suspense）
   - 配置 Loading 组件（使用 Ant Design 的 Spin）
   - 设置根路径重定向到 /dashboard
   - 配置 404 页面

5. **集成到应用**：
   - 在 App.tsx 中使用 RouterProvider
   - 确保与 ConfigProvider 正确嵌套

6. **验证**：
   - 测试所有路由可以访问
   - 测试路由跳转功能
   - 测试懒加载是否工作
   - 测试 404 页面

确保路由配置正确，所有页面可以正常访问和跳转。
