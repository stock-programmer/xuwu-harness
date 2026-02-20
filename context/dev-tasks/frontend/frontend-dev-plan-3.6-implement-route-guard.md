# Task: 实现路由配置和守卫

## 元数据
- **Task ID**: frontend-dev-plan-3.6
- **Layer**: 3
- **Dependencies**: [2.3, 2.4]
- **Parallel Group**: [3.1, 3.2, 3.3, 3.4, 3.5, 3.6]
- **Estimated Complexity**: Medium

## 目标
配置完整的路由系统，实现路由守卫、路由懒加载、路由过渡动画、404 页面等功能。

## 前置条件
- React Router 已配置（Task 2.3 完成）
- Zustand 已配置（Task 2.4 完成）

## 实现步骤

### 1. 定义路由常量
创建 `src/constants/routes.ts`：
```typescript
export const ROUTE_PATHS = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  PROJECT: '/project/:projectId',
  SETTINGS: '/settings',
  LOGIN: '/login',
  NOT_FOUND: '/404',
} as const;

export const PUBLIC_ROUTES = [ROUTE_PATHS.LOGIN, ROUTE_PATHS.NOT_FOUND];

export const PRIVATE_ROUTES = [
  ROUTE_PATHS.DASHBOARD,
  ROUTE_PATHS.PROJECT,
  ROUTE_PATHS.SETTINGS,
];
```

### 2. 创建路由守卫组件
创建 `src/components/common/RouteGuard/RouteGuard.tsx`：
```typescript
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useAppStore } from '@/store';
import { ROUTE_PATHS, PUBLIC_ROUTES } from '@/constants/routes';

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requireAuth = true,
}) => {
  const location = useLocation();
  const { user, isLoading, checkAuth } = useAppStore();

  useEffect(() => {
    // 检查认证状态
    if (requireAuth) {
      checkAuth();
    }
  }, [requireAuth, checkAuth]);

  // 加载中
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  // 需要认证但未登录
  if (requireAuth && !user) {
    return <Navigate to={ROUTE_PATHS.LOGIN} state={{ from: location }} replace />;
  }

  // 已登录但访问登录页
  if (!requireAuth && user && location.pathname === ROUTE_PATHS.LOGIN) {
    return <Navigate to={ROUTE_PATHS.DASHBOARD} replace />;
  }

  return <>{children}</>;
};
```

### 3. 创建路由过渡动画组件
创建 `src/components/common/PageTransition/PageTransition.tsx`：
```typescript
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
}

const pageVariants = {
  initial: {
    opacity: 0,
    x: -20,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
```

### 4. 更新 Zustand Store 添加认证逻辑
更新 `src/store/app.store.ts`：
```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email?: string;
  role: 'admin' | 'user';
}

interface AppState {
  // 用户状态
  user: User | null;
  isLoading: boolean;

  // 侧边栏状态
  sidebarCollapsed: boolean;

  // Actions
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<void>;
  logout: () => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        // 初始状态
        user: null,
        isLoading: false,
        sidebarCollapsed: false,

        // 设置用户
        setUser: (user) => set({ user }),

        // 检查认证状态
        checkAuth: async () => {
          set({ isLoading: true });
          try {
            const token = localStorage.getItem('access_token');
            if (!token) {
              set({ user: null, isLoading: false });
              return;
            }

            // 这里应该调用 API 验证 token
            // 临时使用模拟数据
            const mockUser: User = {
              id: '1',
              name: 'Claude User',
              email: 'user@example.com',
              role: 'admin',
            };

            set({ user: mockUser, isLoading: false });
          } catch (error) {
            console.error('Auth check failed:', error);
            set({ user: null, isLoading: false });
          }
        },

        // 登出
        logout: () => {
          localStorage.removeItem('access_token');
          set({ user: null });
        },

        // 切换侧边栏
        toggleSidebar: () =>
          set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      }),
      {
        name: 'app-storage',
        partialize: (state) => ({
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      }
    ),
    { name: 'AppStore' }
  )
);
```

### 5. 创建完整的路由配置
更新 `src/routes/index.tsx`：
```typescript
import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { Spin } from 'antd';
import { RouteGuard } from '@/components/common/RouteGuard/RouteGuard';
import { PageTransition } from '@/components/common/PageTransition/PageTransition';
import { MainLayout } from '@/components/layout';
import { ROUTE_PATHS } from '@/constants/routes';

// 懒加载页面组件
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const ProjectView = lazy(() => import('@/pages/ProjectView'));
const Settings = lazy(() => import('@/pages/Settings'));
const Login = lazy(() => import('@/pages/Login'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// 加载中组件
const SuspenseFallback = () => (
  <div className="flex items-center justify-center h-full">
    <Spin size="large" tip="加载中..." />
  </div>
);

// 懒加载包装组件
const LazyLoad: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<SuspenseFallback />}>
    <PageTransition>{children}</PageTransition>
  </Suspense>
);

// 受保护的路由布局
const ProtectedLayout = () => (
  <RouteGuard requireAuth={true}>
    <MainLayout />
  </RouteGuard>
);

// 公开路由布局
const PublicLayout = () => (
  <RouteGuard requireAuth={false}>
    <Outlet />
  </RouteGuard>
);

export const router = createBrowserRouter([
  {
    path: ROUTE_PATHS.HOME,
    element: <ProtectedLayout />,
    children: [
      {
        index: true,
        element: <Navigate to={ROUTE_PATHS.DASHBOARD} replace />,
      },
      {
        path: 'dashboard',
        element: (
          <LazyLoad>
            <Dashboard />
          </LazyLoad>
        ),
      },
      {
        path: 'project/:projectId',
        element: (
          <LazyLoad>
            <ProjectView />
          </LazyLoad>
        ),
      },
    ],
  },
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        path: 'login',
        element: (
          <LazyLoad>
            <Login />
          </LazyLoad>
        ),
      },
    ],
  },
  {
    path: 'settings',
    element: (
      <RouteGuard requireAuth={true}>
        <LazyLoad>
          <Settings />
        </LazyLoad>
      </RouteGuard>
    ),
  },
  {
    path: '404',
    element: (
      <LazyLoad>
        <NotFound />
      </LazyLoad>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/404" replace />,
  },
]);
```

### 6. 安装动画依赖
```bash
cd frontend
npm install framer-motion
```

### 7. 创建简单的 Login 页面
创建 `src/pages/Login/index.tsx`：
```typescript
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAppStore } from '@/store';

const { Title } = Typography;

interface LoginForm {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAppStore();
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const onFinish = async (values: LoginForm) => {
    setLoading(true);
    try {
      // 模拟登录 API 调用
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 模拟成功登录
      const mockToken = 'mock_access_token_12345';
      localStorage.setItem('access_token', mockToken);

      setUser({
        id: '1',
        name: values.username,
        email: `${values.username}@example.com`,
        role: 'admin',
      });

      message.success('登录成功！');
      navigate(from, { replace: true });
    } catch (error) {
      message.error('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <Title level={2}>Claude Code Harness</Title>
          <p className="text-gray-500">请登录以继续</p>
        </div>

        <Form onFinish={onFinish} autoComplete="off">
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
```

### 8. 创建 NotFound 页面
创建 `src/pages/NotFound/index.tsx`：
```typescript
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Result, Button } from 'antd';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Result
        status="404"
        title="404"
        subTitle="抱歉，您访问的页面不存在"
        extra={
          <Button type="primary" onClick={() => navigate('/dashboard')}>
            返回首页
          </Button>
        }
      />
    </div>
  );
};

export default NotFound;
```

## 期望输出
- ✅ `src/constants/routes.ts` 路由常量定义
- ✅ `src/components/common/RouteGuard` 路由守卫组件
- ✅ `src/components/common/PageTransition` 页面过渡组件
- ✅ `src/store/app.store.ts` 添加认证逻辑
- ✅ `src/routes/index.tsx` 完整路由配置
- ✅ `src/pages/Login` 登录页面
- ✅ `src/pages/NotFound` 404 页面
- ✅ framer-motion 安装完成
- ✅ 路由守卫生效，未登录跳转到登录页

## 验证标准
```bash
npm run dev
# 访问 http://localhost:5173

# 测试场景：
# 1. 未登录访问 /dashboard -> 应跳转到 /login
# 2. 登录成功 -> 应跳转到 /dashboard
# 3. 已登录访问 /login -> 应跳转到 /dashboard
# 4. 访问不存在的路由 -> 应显示 404 页面
# 5. 页面切换应有过渡动画
```

## Claude 执行 Prompt

请为前端项目实现完整的路由配置和守卫系统，具体要求如下：

1. **定义路由常量**（src/constants/routes.ts）：
   - ROUTE_PATHS: 所有路由路径常量
   - PUBLIC_ROUTES: 公开路由列表
   - PRIVATE_ROUTES: 受保护路由列表

2. **创建路由守卫**（src/components/common/RouteGuard/RouteGuard.tsx）：
   - 检查认证状态
   - 未登录重定向到 /login
   - 已登录访问 /login 重定向到 /dashboard
   - 加载状态显示

3. **创建页面过渡动画**（src/components/common/PageTransition/PageTransition.tsx）：
   - 使用 framer-motion
   - 页面切换时淡入淡出动画
   - 平滑的过渡效果

4. **更新 Zustand Store**（src/store/app.store.ts）：
   - 添加 user 状态
   - 添加 isLoading 状态
   - 实现 checkAuth 方法（检查认证）
   - 实现 logout 方法
   - 临时使用模拟数据

5. **完整路由配置**（src/routes/index.tsx）：
   - 使用 createBrowserRouter
   - 嵌套路由（MainLayout 包裹受保护路由）
   - 懒加载所有页面组件
   - 公开路由和受保护路由分组
   - 404 处理

6. **创建 Login 页面**（src/pages/Login/index.tsx）：
   - Ant Design Form 表单
   - 用户名和密码输入
   - 登录成功后保存 token
   - 更新 Zustand user 状态
   - 重定向到之前访问的页面或 dashboard

7. **创建 NotFound 页面**（src/pages/NotFound/index.tsx）：
   - Ant Design Result 组件
   - 返回首页按钮

8. **安装依赖**：
   - npm install framer-motion

9. **验证**：
   - 未登录访问受保护路由应跳转到登录页
   - 登录成功应跳转到正确页面
   - 页面切换有过渡动画
   - 404 页面正常显示

确保路由守卫正常工作，认证流程完整，用户体验流畅。
