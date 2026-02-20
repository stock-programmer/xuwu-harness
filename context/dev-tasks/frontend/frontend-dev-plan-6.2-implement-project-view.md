# Task: 实现 ProjectView 项目视图

## 元数据
- **Task ID**: frontend-dev-plan-6.2
- **Layer**: 6
- **Dependencies**: [5.1, 5.2, 5.3, 5.4, 5.5]
- **Parallel Group**: [6.1, 6.2]
- **Estimated Complexity**: High

## 目标
完善 ProjectView 项目详情页面，集成文件编辑器、输出控制台、模式控制、任务仪表板等所有功能模块。

## 前置条件
- Layer 5 所有任务已完成

## 实现步骤

### 1. 更新 ProjectView 主布局
更新 `src/pages/ProjectView/index.tsx`：
```typescript
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, Spin, Alert } from 'antd';
import {
  FileTextOutlined,
  CodeOutlined,
  DashboardOutlined,
  ControlOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { projectApi } from '@/services/api/project.api';
import { FileEditor } from '@/features/file-explorer/components/FileEditor';
import { OutputConsole } from '@/features/output-console/components/OutputConsole';
import { ModeControl } from '@/features/mode-control/components/ModeControl';
import { TaskDashboard } from '@/features/task-execution/components/TaskDashboard';
import { ProgressMonitor } from '@/features/task-execution/components/ProgressMonitor';
import { useOutputWebSocket } from '@/features/output-console/hooks/useOutputWebSocket';
import { useTaskExecutionStore } from '@/features/task-execution/store/task-execution.store';
import { useFileExplorerStore } from '@/features/file-explorer/store/file-explorer.store';

const ProjectView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { connected } = useOutputWebSocket(projectId);
  const { loadFileTree } = useFileExplorerStore();
  const { loadTasks } = useTaskExecutionStore();

  // 获取项目详情
  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectApi.getProject(projectId!),
    enabled: !!projectId,
  });

  // 初始化文件树和任务
  useEffect(() => {
    if (projectId) {
      loadFileTree(projectId);

      // TODO: 从 API 加载任务列表
      // const tasks = await fetchTasks(projectId);
      // loadTasks(tasks);
    }
  }, [projectId, loadFileTree, loadTasks]);

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-full">
        <Alert message="项目 ID 无效" type="error" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spin size="large" tip="加载项目..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Alert
          message="加载项目失败"
          description={(error as Error).message}
          type="error"
          showIcon
        />
      </div>
    );
  }

  const tabItems = [
    {
      key: 'editor',
      label: (
        <span>
          <CodeOutlined />
          文件编辑器
        </span>
      ),
      children: <FileEditor projectId={projectId} />,
    },
    {
      key: 'tasks',
      label: (
        <span>
          <DashboardOutlined />
          任务仪表板
        </span>
      ),
      children: <TaskDashboard projectId={projectId} />,
    },
    {
      key: 'progress',
      label: (
        <span>
          <LineChartOutlined />
          进度监控
        </span>
      ),
      children: (
        <div className="p-4">
          <ProgressMonitor />
        </div>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* 顶部项目信息栏 */}
      {project && (
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold m-0">{project.name}</h2>
              <div className="text-sm text-gray-500 mt-1">
                {project.rootPath}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-gray-500">WebSocket: </span>
                <span className={connected ? 'text-green-600' : 'text-red-600'}>
                  {connected ? '已连接' : '未连接'}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">状态: </span>
                <span className="font-medium">{project.status}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 主要内容区 - 使用之前在 MainLayout 中定义的分割布局 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 上半部分：多标签页视图 */}
        <div className="flex-1 overflow-auto">
          <Tabs
            items={tabItems}
            defaultActiveKey="editor"
            className="h-full"
            tabBarStyle={{ paddingLeft: 16, paddingRight: 16, marginBottom: 0 }}
          />
        </div>
      </div>

      {/* 下半部分：输出控制台和模式控制 */}
      <div className="h-96 border-t border-gray-200 flex">
        {/* 左侧：输出控制台 */}
        <div className="flex-1 overflow-hidden p-2">
          <OutputConsole />
        </div>

        {/* 右侧：模式控制 */}
        <div className="w-96 border-l border-gray-200 overflow-auto p-2">
          <ModeControl projectId={projectId} />
        </div>
      </div>
    </div>
  );
};

export default ProjectView;
```

### 2. 创建项目上下文 Provider（可选）
创建 `src/contexts/ProjectContext.tsx`：
```typescript
import React, { createContext, useContext, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectApi } from '@/services/api/project.api';
import { Project } from '@/types/project.types';

interface ProjectContextValue {
  project: Project | undefined;
  projectId: string | undefined;
  isLoading: boolean;
  error: Error | null;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { projectId } = useParams<{ projectId: string }>();

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectApi.getProject(projectId!),
    enabled: !!projectId,
  });

  return (
    <ProjectContext.Provider
      value={{
        project,
        projectId,
        isLoading,
        error: error as Error | null,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return context;
};
```

### 3. 创建快速操作面板组件
创建 `src/pages/ProjectView/components/QuickActions.tsx`：
```typescript
import React from 'react';
import { Card, Button, Space, Statistic, Tooltip } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
import { Project } from '@/types/project.types';

interface QuickActionsProps {
  project: Project;
  onStart?: () => void;
  onPause?: () => void;
  onReset?: () => void;
  onSettings?: () => void;
  onOpenFolder?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  project,
  onStart,
  onPause,
  onReset,
  onSettings,
  onOpenFolder,
}) => {
  return (
    <Card size="small">
      <div className="flex items-center justify-between">
        <Space size="middle">
          <Statistic
            title="当前 Layer"
            value={project.currentLayer || 0}
            suffix={`/ ${project.totalLayers || 0}`}
          />
          <Statistic
            title="已完成任务"
            value={project.completedTasks || 0}
            suffix={`/ ${project.totalTasks || 0}`}
          />
        </Space>

        <Space>
          {project.status === 'running' ? (
            <Tooltip title="暂停执行">
              <Button
                icon={<PauseCircleOutlined />}
                onClick={onPause}
              >
                暂停
              </Button>
            </Tooltip>
          ) : (
            <Tooltip title="开始执行">
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={onStart}
                disabled={project.status === 'completed'}
              >
                启动
              </Button>
            </Tooltip>
          )}

          <Tooltip title="重置项目">
            <Button icon={<ReloadOutlined />} onClick={onReset}>
              重置
            </Button>
          </Tooltip>

          <Tooltip title="打开项目文件夹">
            <Button icon={<FolderOpenOutlined />} onClick={onOpenFolder} />
          </Tooltip>

          <Tooltip title="项目设置">
            <Button icon={<SettingOutlined />} onClick={onSettings} />
          </Tooltip>
        </Space>
      </div>
    </Card>
  );
};
```

### 4. 创建分屏布局组件（可选）
创建 `src/pages/ProjectView/components/SplitLayout.tsx`：
```typescript
import React, { useState } from 'react';
import { Layout } from 'antd';
import Split from 'react-split';
import 'react-split/dist/react-split.css';

interface SplitLayoutProps {
  top: React.ReactNode;
  bottom: React.ReactNode;
  defaultSizes?: [number, number];
}

export const SplitLayout: React.FC<SplitLayoutProps> = ({
  top,
  bottom,
  defaultSizes = [60, 40],
}) => {
  return (
    <Split
      className="split-vertical h-full"
      direction="vertical"
      sizes={defaultSizes}
      minSize={200}
      gutterSize={8}
      snapOffset={30}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <div className="overflow-auto">{top}</div>
      <div className="overflow-auto">{bottom}</div>
    </Split>
  );
};
```

如果使用 Split 组件，需要安装：
```bash
npm install react-split
npm install --save-dev @types/react-split
```

并添加样式到 `src/styles/split.css`：
```css
.split-vertical > .gutter {
  background-color: #e5e7eb;
  cursor: row-resize;
}

.split-vertical > .gutter:hover {
  background-color: #d1d5db;
}
```

### 5. 更新路由配置
确保 `src/routes/index.tsx` 中的 ProjectView 路由正确：
```typescript
{
  path: 'project/:projectId',
  element: (
    <LazyLoad>
      <ProjectView />
    </LazyLoad>
  ),
}
```

### 6. 创建导出文件
创建 `src/pages/ProjectView/components/index.ts`：
```typescript
export { QuickActions } from './QuickActions';
export { SplitLayout } from './SplitLayout';
```

## 期望输出
- ✅ `src/pages/ProjectView/index.tsx` 完整的项目视图页面
- ✅ `src/contexts/ProjectContext.tsx` 项目上下文 Provider
- ✅ `src/pages/ProjectView/components/QuickActions.tsx` 快速操作面板
- ✅ `src/pages/ProjectView/components/SplitLayout.tsx` 分屏布局组件
- ✅ 集成所有功能模块：
  - 文件编辑器
  - 任务仪表板
  - 进度监控
  - 输出控制台
  - 模式控制
- ✅ 多标签页切换
- ✅ WebSocket 连接状态显示
- ✅ 项目操作（启动/暂停/重置）

## 验证标准
```bash
npm run dev
# 访问 http://localhost:5173/project/xxx
# 应该看到：
# - 顶部项目信息栏（名称、路径、WebSocket 状态）
# - 左侧文件浏览器
# - 中间多标签页（文件编辑器/任务仪表板/进度监控）
# - 下方分为两部分：
#   - 左侧：输出控制台
#   - 右侧：模式控制
# - 所有模块正常工作
# - WebSocket 实时更新
```

## Claude 执行 Prompt

请完善 ProjectView 项目视图页面，具体要求如下：

1. **更新 ProjectView 主页面**（src/pages/ProjectView/index.tsx）：
   - 顶部项目信息栏：
     - 项目名称和路径
     - WebSocket 连接状态
     - 项目状态
   - 主要内容区：
     - Tabs 多标签页（文件编辑器/任务仪表板/进度监控）
   - 底部分屏：
     - 左侧：输出控制台
     - 右侧：模式控制
   - 使用 React Query 获取项目详情
   - 初始化文件树和任务数据
   - 集成 WebSocket

2. **创建项目上下文**（src/contexts/ProjectContext.tsx）：
   - ProjectProvider 组件
   - useProject Hook
   - 提供 project, projectId, isLoading, error

3. **创建快速操作面板**（src/pages/ProjectView/components/QuickActions.tsx）：
   - 统计信息（当前 Layer、已完成任务）
   - 操作按钮：
     - 启动/暂停
     - 重置
     - 打开文件夹
     - 设置

4. **创建分屏布局组件**（可选，src/pages/ProjectView/components/SplitLayout.tsx）：
   - 使用 react-split
   - 垂直分屏
   - 可调整大小

5. **更新路由配置**：
   - 确保 project/:projectId 路由正确

6. **创建导出文件**

7. **验证**：
   - 所有模块正确集成
   - 布局合理响应式
   - WebSocket 实时更新正常
   - 标签页切换流畅

确保 ProjectView 功能完整、布局合理、用户体验良好。
