# Task: 实现任务执行模块基础

## 元数据
- **Task ID**: frontend-dev-plan-4.4
- **Layer**: 4
- **Dependencies**: [3.3, 3.2, 3.4]
- **Parallel Group**: [4.1, 4.2, 4.3, 4.4]
- **Estimated Complexity**: High

## 目标
实现任务执行仪表板基础功能，包括任务列表、执行状态、进度显示、Layer 视图等核心功能。

## 前置条件
- MainLayout 已实现（Task 3.3 完成）
- Socket.IO 客户端已封装（Task 3.2 完成）
- TypeScript 类型已定义（Task 3.4 完成）

## 实现步骤

### 1. 创建任务执行 Store
创建 `src/features/task-execution/store/task-execution.store.ts`：
```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  TaskNode,
  TaskMetadata,
  TaskResult,
  TaskStatus,
  LayerInfo,
} from '@/types/task.types';
import { ExecutionProgress, ExecutionStatus } from '@/types/execution.types';

interface TaskExecutionState {
  // 状态
  tasks: TaskNode[];
  layers: Map<number, LayerInfo>;
  currentLayer: number;
  currentTaskId: string | null;
  executionStatus: ExecutionStatus;
  progress: ExecutionProgress | null;
  loading: boolean;
  error: string | null;

  // Actions
  loadTasks: (tasks: TaskMetadata[]) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus, result?: Partial<TaskResult>) => void;
  setCurrentTask: (taskId: string | null) => void;
  setExecutionStatus: (status: ExecutionStatus) => void;
  updateProgress: (progress: ExecutionProgress) => void;
  moveToNextLayer: () => void;
  reset: () => void;
  getTaskById: (taskId: string) => TaskNode | undefined;
  getTasksByLayer: (layer: number) => TaskNode[];
  getCompletedTasksCount: () => number;
}

export const useTaskExecutionStore = create<TaskExecutionState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      tasks: [],
      layers: new Map(),
      currentLayer: 1,
      currentTaskId: null,
      executionStatus: 'idle',
      progress: null,
      loading: false,
      error: null,

      // 加载任务
      loadTasks: (taskMetadataList) => {
        const tasks: TaskNode[] = taskMetadataList.map((metadata) => ({
          id: metadata.id,
          metadata,
          status: 'pending',
          dependencies: metadata.dependencies,
          dependents: [],
        }));

        // 计算 dependents
        tasks.forEach((task) => {
          task.dependencies.forEach((depId) => {
            const depTask = tasks.find((t) => t.id === depId);
            if (depTask) {
              depTask.dependents.push(task.id);
            }
          });
        });

        // 按 Layer 分组
        const layerMap = new Map<number, LayerInfo>();
        taskMetadataList.forEach((metadata) => {
          if (!layerMap.has(metadata.layer)) {
            layerMap.set(metadata.layer, {
              layerNum: metadata.layer,
              dependsOn: [],
              parallel: true,
              tasks: [],
              completedTasks: 0,
              totalTasks: 0,
            });
          }
          const layerInfo = layerMap.get(metadata.layer)!;
          layerInfo.tasks.push(metadata);
          layerInfo.totalTasks += 1;
        });

        set({ tasks, layers: layerMap, loading: false });
      },

      // 更新任务状态
      updateTaskStatus: (taskId, status, result) => {
        set((state) => {
          const tasks = state.tasks.map((task) => {
            if (task.id === taskId) {
              return {
                ...task,
                status,
                result: result
                  ? {
                      taskId,
                      status,
                      startTime: result.startTime || new Date().toISOString(),
                      endTime: result.endTime,
                      duration: result.duration,
                      output: result.output,
                      error: result.error,
                      retryCount: result.retryCount || 0,
                    }
                  : task.result,
              };
            }
            return task;
          });

          // 更新 Layer 完成计数
          const layers = new Map(state.layers);
          const task = tasks.find((t) => t.id === taskId);
          if (task && status === 'completed') {
            const layerInfo = layers.get(task.metadata.layer);
            if (layerInfo) {
              layerInfo.completedTasks += 1;
              layers.set(task.metadata.layer, layerInfo);
            }
          }

          return { tasks, layers };
        });
      },

      // 设置当前任务
      setCurrentTask: (taskId) => {
        set({ currentTaskId: taskId });
      },

      // 设置执行状态
      setExecutionStatus: (status) => {
        set({ executionStatus: status });
      },

      // 更新进度
      updateProgress: (progress) => {
        set({ progress });
      },

      // 移动到下一层
      moveToNextLayer: () => {
        set((state) => ({
          currentLayer: state.currentLayer + 1,
        }));
      },

      // 重置
      reset: () => {
        set({
          tasks: [],
          layers: new Map(),
          currentLayer: 1,
          currentTaskId: null,
          executionStatus: 'idle',
          progress: null,
          loading: false,
          error: null,
        });
      },

      // 根据 ID 获取任务
      getTaskById: (taskId) => {
        return get().tasks.find((t) => t.id === taskId);
      },

      // 获取指定 Layer 的任务
      getTasksByLayer: (layer) => {
        return get().tasks.filter((t) => t.metadata.layer === layer);
      },

      // 获取已完成任务数量
      getCompletedTasksCount: () => {
        return get().tasks.filter((t) => t.status === 'completed').length;
      },
    }),
    { name: 'TaskExecutionStore' }
  )
);
```

### 2. 创建任务卡片组件
创建 `src/features/task-execution/components/TaskCard.tsx`：
```typescript
import React from 'react';
import { Card, Tag, Typography, Space, Progress } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { TaskNode } from '@/types/task.types';
import { formatDuration } from '@/utils/format';
import { TASK_STATUS_COLORS } from '@/constants/config';

const { Text, Paragraph } = Typography;

interface TaskCardProps {
  task: TaskNode;
  onClick?: (task: TaskNode) => void;
}

const STATUS_ICONS = {
  pending: <ClockCircleOutlined />,
  running: <LoadingOutlined spin />,
  completed: <CheckCircleOutlined />,
  failed: <CloseCircleOutlined />,
  skipped: <CloseCircleOutlined />,
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const { metadata, status, result } = task;

  const getStatusColor = (status: TaskNode['status']) => {
    return TASK_STATUS_COLORS[status] || '#d9d9d9';
  };

  return (
    <Card
      size="small"
      hoverable
      onClick={() => onClick?.(task)}
      className="mb-2"
      style={{
        borderLeft: `4px solid ${getStatusColor(status)}`,
      }}
    >
      <div className="flex items-start justify-between">
        <Space direction="vertical" size={4} className="flex-1">
          {/* 任务 ID */}
          <div className="flex items-center gap-2">
            <Tag color={getStatusColor(status)} className="m-0">
              {metadata.id}
            </Tag>
            {STATUS_ICONS[status]}
          </div>

          {/* 任务名称 */}
          <Text strong className="text-sm">
            {metadata.name}
          </Text>

          {/* 任务描述 */}
          <Paragraph
            type="secondary"
            className="text-xs m-0"
            ellipsis={{ rows: 2 }}
          >
            {metadata.description}
          </Paragraph>

          {/* 元信息 */}
          <Space size="small" wrap>
            <Tag className="text-xs m-0">Layer {metadata.layer}</Tag>
            <Tag color="purple" className="text-xs m-0">
              {metadata.estimatedComplexity}
            </Tag>
            {metadata.dependencies.length > 0 && (
              <Text type="secondary" className="text-xs">
                依赖: {metadata.dependencies.length}
              </Text>
            )}
          </Space>
        </Space>

        {/* 执行信息 */}
        {result && (
          <div className="ml-4 text-right">
            {result.duration !== undefined && (
              <Text type="secondary" className="text-xs block">
                {formatDuration(result.duration)}
              </Text>
            )}
            {result.retryCount !== undefined && result.retryCount > 0 && (
              <Text type="warning" className="text-xs block">
                重试: {result.retryCount}
              </Text>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
```

### 3. 创建 Layer 面板组件
创建 `src/features/task-execution/components/LayerPanel.tsx`：
```typescript
import React from 'react';
import { Card, Typography, Space, Progress, Badge } from 'antd';
import { LayerInfo } from '@/types/task.types';
import { TaskCard } from './TaskCard';
import { useTaskExecutionStore } from '../store/task-execution.store';

const { Title, Text } = Typography;

interface LayerPanelProps {
  layer: LayerInfo;
  onTaskClick?: (taskId: string) => void;
}

export const LayerPanel: React.FC<LayerPanelProps> = ({
  layer,
  onTaskClick,
}) => {
  const { tasks, getTasksByLayer } = useTaskExecutionStore();
  const layerTasks = getTasksByLayer(layer.layerNum);

  const progress = (layer.completedTasks / layer.totalTasks) * 100;

  const statusCounts = {
    pending: layerTasks.filter((t) => t.status === 'pending').length,
    running: layerTasks.filter((t) => t.status === 'running').length,
    completed: layerTasks.filter((t) => t.status === 'completed').length,
    failed: layerTasks.filter((t) => t.status === 'failed').length,
  };

  return (
    <Card className="mb-4">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <Title level={5} className="m-0">
            Layer {layer.layerNum}
          </Title>
          <Space size="small">
            <Badge count={statusCounts.running} status="processing" />
            <Badge count={statusCounts.completed} status="success" />
            <Badge count={statusCounts.failed} status="error" />
          </Space>
        </div>

        <Progress
          percent={progress}
          status={statusCounts.failed > 0 ? 'exception' : 'active'}
          showInfo={true}
          format={() =>
            `${layer.completedTasks} / ${layer.totalTasks}`
          }
        />

        <Space size="small" className="mt-2">
          <Text type="secondary" className="text-xs">
            总任务: {layer.totalTasks}
          </Text>
          <Text type="secondary" className="text-xs">
            可并行: {layer.parallel ? '是' : '否'}
          </Text>
        </Space>
      </div>

      {/* Tasks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {layerTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={() => onTaskClick?.(task.id)}
          />
        ))}
      </div>
    </Card>
  );
};
```

### 4. 创建任务执行仪表板
创建 `src/features/task-execution/components/TaskDashboard.tsx`：
```typescript
import React, { useEffect } from 'react';
import { Card, Typography, Space, Button, Empty, Spin, Progress } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { LayerPanel } from './LayerPanel';
import { useTaskExecutionStore } from '../store/task-execution.store';
import { useWebSocket } from '@/hooks/useWebSocket';

const { Title, Text } = Typography;

interface TaskDashboardProps {
  projectId: string;
}

export const TaskDashboard: React.FC<TaskDashboardProps> = ({ projectId }) => {
  const {
    tasks,
    layers,
    currentLayer,
    executionStatus,
    progress,
    loading,
    getCompletedTasksCount,
  } = useTaskExecutionStore();

  const { connected, emit, subscribe } = useWebSocket(projectId);

  useEffect(() => {
    if (!connected) return;

    // 监听进度更新
    const unsubscribeProgress = subscribe('progress:update', (progressUpdate) => {
      useTaskExecutionStore.getState().updateProgress(progressUpdate);
    });

    // 监听任务状态更新
    const unsubscribeStatus = subscribe('task:status', (statusUpdate) => {
      useTaskExecutionStore.getState().updateTaskStatus(
        statusUpdate.taskId,
        statusUpdate.status,
        {
          error: statusUpdate.error,
          startTime: new Date().toISOString(),
        }
      );
    });

    // 监听 Layer 完成
    const unsubscribeLayer = subscribe('layer:completed', (layer) => {
      console.log(`Layer ${layer} completed`);
    });

    return () => {
      unsubscribeProgress();
      unsubscribeStatus();
      unsubscribeLayer();
    };
  }, [connected, subscribe]);

  const handleStart = () => {
    emit('task:start', { projectId });
  };

  const handlePause = () => {
    // TODO: 实现暂停逻辑
  };

  const handleReset = () => {
    useTaskExecutionStore.getState().reset();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spin size="large" tip="加载任务..." />
      </div>
    );
  }

  const layersArray = Array.from(layers.values()).sort(
    (a, b) => a.layerNum - b.layerNum
  );

  const completedTasks = getCompletedTasksCount();
  const totalTasks = tasks.length;
  const overallProgress =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <Card className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <Title level={4} className="m-0 mb-2">
              任务执行仪表板
            </Title>
            <Space size="small">
              <Text type="secondary">
                当前 Layer: {currentLayer}
              </Text>
              <Text type="secondary">
                总进度: {completedTasks} / {totalTasks}
              </Text>
              <Text type="secondary">
                状态: {executionStatus}
              </Text>
            </Space>
          </div>

          <Space>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleStart}
              disabled={executionStatus === 'running'}
            >
              开始执行
            </Button>
            <Button
              icon={<PauseCircleOutlined />}
              onClick={handlePause}
              disabled={executionStatus !== 'running'}
            >
              暂停
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          </Space>
        </div>

        {/* Overall Progress */}
        <Progress
          percent={overallProgress}
          status={executionStatus === 'failed' ? 'exception' : 'active'}
          className="mt-4"
        />
      </Card>

      {/* Layers */}
      <div className="flex-1 overflow-y-auto">
        {layersArray.length === 0 ? (
          <Empty description="暂无任务" />
        ) : (
          layersArray.map((layer) => (
            <LayerPanel key={layer.layerNum} layer={layer} />
          ))
        )}
      </div>
    </div>
  );
};
```

### 5. 创建导出文件
创建 `src/features/task-execution/index.ts`：
```typescript
export { TaskDashboard } from './components/TaskDashboard';
export { LayerPanel } from './components/LayerPanel';
export { TaskCard } from './components/TaskCard';
export { useTaskExecutionStore } from './store/task-execution.store';
```

## 期望输出
- ✅ `src/features/task-execution/store/task-execution.store.ts` Zustand store
- ✅ `src/features/task-execution/components/TaskCard.tsx` 任务卡片
- ✅ `src/features/task-execution/components/LayerPanel.tsx` Layer 面板
- ✅ `src/features/task-execution/components/TaskDashboard.tsx` 任务仪表板
- ✅ 任务状态显示（pending/running/completed/failed）
- ✅ Layer 分组显示
- ✅ 整体进度和 Layer 进度
- ✅ WebSocket 实时更新

## 验证标准
```bash
npm run dev
# 访问项目页面 /project/xxx
# 应该看到：
# - 任务仪表板显示
# - 按 Layer 分组的任务列表
# - 任务状态和进度显示
# - 开始/暂停/重置按钮
# - WebSocket 实时更新任务状态
```

## Claude 执行 Prompt

请实现任务执行模块基础功能，具体要求如下：

1. **创建 Zustand Store**（src/features/task-execution/store/task-execution.store.ts）：
   - 状态：tasks, layers, currentLayer, currentTaskId, executionStatus, progress
   - Actions：loadTasks, updateTaskStatus, setCurrentTask, updateProgress, moveToNextLayer
   - 辅助方法：getTaskById, getTasksByLayer, getCompletedTasksCount

2. **创建任务卡片组件**（src/features/task-execution/components/TaskCard.tsx）：
   - 显示任务 ID、名称、描述
   - 状态图标和颜色
   - 依赖数量、Layer、复杂度标签
   - 执行时间和重试次数
   - 左侧边框颜色表示状态

3. **创建 Layer 面板组件**（src/features/task-execution/components/LayerPanel.tsx）：
   - Layer 标题和序号
   - 进度条（已完成/总数）
   - 状态徽章（运行中/已完成/失败）
   - 任务卡片网格布局（响应式）

4. **创建任务仪表板**（src/features/task-execution/components/TaskDashboard.tsx）：
   - Header 工具栏：
     - 当前 Layer 显示
     - 总进度显示
     - 执行状态显示
     - 开始/暂停/重置按钮
   - 整体进度条
   - Layer 列表（可滚动）
   - WebSocket 集成：
     - 监听 'progress:update'
     - 监听 'task:status'
     - 监听 'layer:completed'

5. **创建导出文件**（src/features/task-execution/index.ts）

6. **验证**：
   - 任务正确加载和显示
   - 状态更新正确反映
   - 进度计算准确
   - WebSocket 实时更新正常

确保任务执行模块功能完整、状态管理正确、实时更新流畅。
