# Task: 实现 MainLayout 布局组件

## 元数据
- **Task ID**: frontend-dev-plan-3.3
- **Layer**: 3
- **Dependencies**: [2.2, 2.1, 2.3]
- **Parallel Group**: [3.1, 3.2, 3.3, 3.4, 3.5, 3.6]
- **Estimated Complexity**: Medium

## 目标
实现三栏布局（左侧文件树、右上输出、右下控制），使用 Ant Design Layout 组件，实现响应式布局，支持侧边栏折叠。

## 前置条件
- Ant Design 已安装（Task 2.2 完成）
- TailwindCSS 已配置（Task 2.1 完成）
- React Router 已配置（Task 2.3 完成）

## 实现步骤

### 1. 创建 MainLayout 组件
创建 `src/components/layout/MainLayout/MainLayout.tsx`：
```typescript
import React from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import { Header } from '../Header';
import { Sidebar } from '../Sidebar';
import { useAppStore } from '@/store';
import styles from './MainLayout.module.css';

const { Content, Sider } = Layout;

export const MainLayout: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <Layout className="min-h-screen">
      {/* 顶部 Header */}
      <Header />

      <Layout>
        {/* 左侧 Sidebar - 文件浏览器区域 */}
        <Sider
          collapsible
          collapsed={sidebarCollapsed}
          onCollapse={toggleSidebar}
          width={300}
          className="bg-white border-r border-gray-200"
          theme="light"
        >
          <Sidebar />
        </Sider>

        {/* 右侧主内容区 */}
        <Layout>
          <Content className="p-4">
            {/* 使用 Split Pane 分割上下两部分 */}
            <div className={styles.splitContainer}>
              {/* 上半部分：输出回显区 */}
              <div className={styles.topPane}>
                <Outlet />
              </div>

              {/* 下半部分：控制面板 */}
              <div className={styles.bottomPane}>
                {/* 控制面板内容将由子路由渲染 */}
              </div>
            </div>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};
```

### 2. 创建 Header 组件
创建 `src/components/layout/Header/Header.tsx`：
```typescript
import React from 'react';
import { Layout, Typography, Space, Button } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/store';
import { useNavigate } from 'react-router-dom';

const { Header: AntHeader } = Layout;
const { Title } = Typography;

export const Header: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar, user } = useAppStore();
  const navigate = useNavigate();

  return (
    <AntHeader className="bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      <Space>
        <Button
          type="text"
          icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={toggleSidebar}
        />
        <Title level={4} className="m-0">
          Claude Code Harness
        </Title>
      </Space>

      <Space>
        <Button
          type="text"
          icon={<SettingOutlined />}
          onClick={() => navigate('/settings')}
        >
          设置
        </Button>
        <Button type="text" icon={<UserOutlined />}>
          {user?.name || '未登录'}
        </Button>
      </Space>
    </AntHeader>
  );
};
```

### 3. 创建 Sidebar 占位组件
创建 `src/components/layout/Sidebar/Sidebar.tsx`：
```typescript
import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

export const Sidebar: React.FC = () => {
  return (
    <div className="p-4">
      <Title level={5}>文件浏览器</Title>
      <p className="text-gray-500">文件树将在这里显示</p>
    </div>
  );
};
```

### 4. 创建 CSS Module
创建 `src/components/layout/MainLayout/MainLayout.module.css`：
```css
.splitContainer {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px); /* 减去 Header 高度 */
  gap: 8px;
}

.topPane {
  flex: 1;
  min-height: 300px;
  background: white;
  border-radius: 8px;
  padding: 16px;
  overflow: auto;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.bottomPane {
  height: 400px;
  min-height: 200px;
  background: white;
  border-radius: 8px;
  padding: 16px;
  overflow: auto;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .splitContainer {
    gap: 4px;
  }

  .topPane {
    min-height: 200px;
  }

  .bottomPane {
    height: 300px;
    min-height: 150px;
  }
}
```

### 5. 创建索引文件
创建 `src/components/layout/index.ts`：
```typescript
export { MainLayout } from './MainLayout/MainLayout';
export { Header } from './Header/Header';
export { Sidebar } from './Sidebar/Sidebar';
```

### 6. 更新路由使用 MainLayout
更新 `src/routes/index.tsx`，将 Dashboard 和 ProjectView 包裹在 MainLayout 中：
```typescript
import { MainLayout } from '@/components/layout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <LazyLoad><Dashboard /></LazyLoad>,
      },
      {
        path: 'project/:projectId',
        element: <LazyLoad><ProjectView /></LazyLoad>,
      },
    ],
  },
  {
    path: '/settings',
    element: <LazyLoad><Settings /></LazyLoad>,
  },
  {
    path: '*',
    element: <LazyLoad><NotFound /></LazyLoad>,
  },
]);
```

## 期望输出
- ✅ `src/components/layout/MainLayout/` 目录创建
- ✅ MainLayout 三栏布局实现
- ✅ Header 组件创建
- ✅ Sidebar 组件创建
- ✅ 响应式适配
- ✅ 侧边栏可折叠
- ✅ CSS Module 样式创建

## 验证标准
```bash
npm run dev
# 访问 http://localhost:5173/dashboard
# 应该看到三栏布局：
# - 顶部：Header（包含标题和用户信息）
# - 左侧：可折叠的 Sidebar
# - 右侧：分为上下两部分的主内容区
```

## Claude 执行 Prompt

请实现前端应用的主布局组件，具体要求如下：

1. **创建 MainLayout**（src/components/layout/MainLayout/MainLayout.tsx）：
   - 使用 Ant Design 的 Layout 组件
   - 实现三栏布局：
     - Header: 顶部导航栏
     - Sider: 左侧侧边栏（文件浏览器区域，宽度300px）
     - Content: 右侧主内容区，分为上下两部分
   - 侧边栏支持折叠（使用 Zustand store 管理状态）
   - 右侧内容区使用 Outlet 渲染子路由

2. **创建 Header**（src/components/layout/Header/Header.tsx）：
   - 左侧：折叠按钮 + 标题"Claude Code Harness"
   - 右侧：设置按钮 + 用户信息
   - 使用 Ant Design Button 和 Icon
   - 集成 Zustand store（toggleSidebar, user）

3. **创建 Sidebar**（src/components/layout/Sidebar/Sidebar.tsx）：
   - 暂时使用占位符内容
   - 显示"文件浏览器"标题

4. **创建样式**（src/components/layout/MainLayout/MainLayout.module.css）：
   - splitContainer: flex 布局，分割上下两部分
   - topPane: 占据剩余空间，最小高度300px
   - bottomPane: 固定高度400px，最小高度200px
   - 添加响应式适配（max-width: 768px）

5. **更新路由配置**：
   - 将 Dashboard 和 ProjectView 作为 MainLayout 的子路由
   - Settings 和 NotFound 独立于 MainLayout

6. **验证**：
   - 运行开发服务器
   - 确认三栏布局正确显示
   - 测试侧边栏折叠功能
   - 确认路由切换正常

确保布局组件可以正常渲染，侧边栏折叠功能正常，响应式布局工作正常。
