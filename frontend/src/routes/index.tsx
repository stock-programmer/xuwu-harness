import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { ROUTES } from '@/constants/routes';

// 懒加载页面组件
const Dashboard = lazy(() =>
  import('@/pages/Dashboard/Dashboard').then((m) => ({ default: m.Dashboard }))
);
const ProjectView = lazy(() =>
  import('@/pages/ProjectView/ProjectView').then((m) => ({
    default: m.ProjectView,
  }))
);
const Settings = lazy(() =>
  import('@/pages/Settings/Settings').then((m) => ({ default: m.Settings }))
);
const NotFound = lazy(() =>
  import('@/pages/NotFound/NotFound').then((m) => ({ default: m.NotFound }))
);

// Loading 组件
const PageLoading: React.FC = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
    }}
  >
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
