# Task: 实现任务实时进度监控

## 元数据
- **Task ID**: frontend-dev-plan-5.3
- **Layer**: 5
- **Dependencies**: [4.4, 3.2]
- **Parallel Group**: [5.1, 5.2, 5.3, 5.4, 5.5]
- **Estimated Complexity**: Medium

## 目标
实现任务执行的实时进度监控，包括整体进度、Layer 进度、任务时间线、预估剩余时间等功能。

## 前置条件
- 任务执行模块已实现（Task 4.4 完成）
- Socket.IO 客户端已封装（Task 3.2 完成）

## 实现步骤

### 1. 创建进度监控组件
创建 `src/features/task-execution/components/ProgressMonitor.tsx`：
```typescript
import React from 'react';
import { Card, Progress, Typography, Space, Statistic, Row, Col, Tag } from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useTaskExecutionStore } from '../store/task-execution.store';
import { formatDuration, formatDateTime } from '@/utils/format';

const { Title, Text } = Typography;

export const ProgressMonitor: React.FC = () => {
  const {
    tasks,
    currentLayer,
    executionStatus,
    progress,
    layers,
    getCompletedTasksCount,
  } = useTaskExecutionStore();

  const totalTasks = tasks.length;
  const completedTasks = getCompletedTasksCount();
  const runningTasks = tasks.filter((t) => t.status === 'running').length;
  const failedTasks = tasks.filter((t) => t.status === 'failed').length;

  const overallProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // 计算预估剩余时间
  const estimatedTimeRemaining = React.useMemo(() => {
    if (!progress) return null;

    const completedTaskResults = tasks
      .filter((t) => t.status === 'completed' && t.result?.duration)
      .map((t) => t.result!.duration!);

    if (completedTaskResults.length === 0) return null;

    const avgDuration =
      completedTaskResults.reduce((sum, d) => sum + d, 0) / completedTaskResults.length;

    const remainingTasks = totalTasks - completedTasks;
    return avgDuration * remainingTasks;
  }, [tasks, totalTasks, completedTasks, progress]);

  // 当前 Layer 进度
  const currentLayerInfo = layers.get(currentLayer);
  const currentLayerProgress = currentLayerInfo
    ? (currentLayerInfo.completedTasks / currentLayerInfo.totalTasks) * 100
    : 0;

  return (
    <Card>
      <Title level={4}>执行进度监控</Title>

      {/* 整体进度 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <Text strong>整体进度</Text>
          <Text type="secondary">
            {completedTasks} / {totalTasks} 任务
          </Text>
        </div>
        <Progress
          percent={overallProgress}
          status={
            failedTasks > 0
              ? 'exception'
              : executionStatus === 'completed'
              ? 'success'
              : 'active'
          }
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
        />
      </div>

      {/* 当前 Layer 进度 */}
      {currentLayerInfo && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <Text strong>当前 Layer {currentLayer}</Text>
            <Text type="secondary">
              {currentLayerInfo.completedTasks} / {currentLayerInfo.totalTasks} 任务
            </Text>
          </div>
          <Progress percent={currentLayerProgress} />
        </div>
      )}

      {/* 统计信息 */}
      <Row gutter={16} className="mb-4">
        <Col span={6}>
          <Statistic
            title="总任务数"
            value={totalTasks}
            prefix={<ClockCircleOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="已完成"
            value={completedTasks}
            valueStyle={{ color: '#3f8600' }}
            prefix={<CheckCircleOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="执行中"
            value={runningTasks}
            valueStyle={{ color: '#1890ff' }}
            prefix={<LoadingOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="失败"
            value={failedTasks}
            valueStyle={{ color: '#cf1322' }}
            prefix={<CloseCircleOutlined />}
          />
        </Col>
      </Row>

      {/* 执行状态和时间信息 */}
      <Space direction="vertical" className="w-full" size="small">
        <div className="flex items-center justify-between">
          <Text type="secondary">执行状态:</Text>
          <Tag
            color={
              executionStatus === 'running'
                ? 'blue'
                : executionStatus === 'completed'
                ? 'green'
                : executionStatus === 'failed'
                ? 'red'
                : 'default'
            }
          >
            {executionStatus}
          </Tag>
        </div>

        {progress && (
          <>
            <div className="flex items-center justify-between">
              <Text type="secondary">当前任务:</Text>
              <Text>{progress.currentTask || '-'}</Text>
            </div>

            {estimatedTimeRemaining && (
              <div className="flex items-center justify-between">
                <Text type="secondary">预计剩余时间:</Text>
                <Text strong>{formatDuration(estimatedTimeRemaining)}</Text>
              </div>
            )}
          </>
        )}
      </Space>
    </Card>
  );
};
```

### 2. 创建任务时间线组件
创建 `src/features/task-execution/components/TaskTimeline.tsx`：
```typescript
import React from 'react';
import { Card, Timeline, Typography, Tag, Empty } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useTaskExecutionStore } from '../store/task-execution.store';
import { formatDateTime, formatDuration } from '@/utils/format';

const { Title, Text } = Typography;

export const TaskTimeline: React.FC = () => {
  const { tasks } = useTaskExecutionStore();

  // 过滤出已完成或失败的任务，并按结束时间排序
  const completedTasks = tasks
    .filter((t) => t.result && (t.status === 'completed' || t.status === 'failed'))
    .sort((a, b) => {
      const aTime = new Date(a.result!.startTime).getTime();
      const bTime = new Date(b.result!.startTime).getTime();
      return bTime - aTime; // 最新的在前
    })
    .slice(0, 20); // 只显示最近 20 个

  if (completedTasks.length === 0) {
    return (
      <Card>
        <Title level={5}>任务时间线</Title>
        <Empty description="暂无已完成的任务" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    );
  }

  const getIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'failed':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'running':
        return <LoadingOutlined style={{ color: '#1890ff' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#d9d9d9' }} />;
    }
  };

  return (
    <Card>
      <Title level={5}>任务时间线</Title>
      <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
        <Timeline>
          {completedTasks.map((task) => (
            <Timeline.Item key={task.id} dot={getIcon(task.status)}>
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <Tag>{task.metadata.id}</Tag>
                  <Text strong>{task.metadata.name}</Text>
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  {task.result && (
                    <>
                      <div>
                        开始时间: {formatDateTime(task.result.startTime)}
                      </div>
                      {task.result.endTime && (
                        <div>
                          结束时间: {formatDateTime(task.result.endTime)}
                        </div>
                      )}
                      {task.result.duration !== undefined && (
                        <div>
                          耗时: {formatDuration(task.result.duration)}
                        </div>
                      )}
                      {task.result.error && (
                        <div className="text-red-500">
                          错误: {task.result.error}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
      </div>
    </Card>
  );
};
```

### 3. 创建 Layer 进度卡片组件
创建 `src/features/task-execution/components/LayerProgressCards.tsx`：
```typescript
import React from 'react';
import { Card, Progress, Space, Typography, Tag, Row, Col } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useTaskExecutionStore } from '../store/task-execution.store';

const { Text } = Typography;

export const LayerProgressCards: React.FC = () => {
  const { layers, currentLayer } = useTaskExecutionStore();

  const layersArray = Array.from(layers.values()).sort(
    (a, b) => a.layerNum - b.layerNum
  );

  return (
    <div>
      <Text strong className="block mb-3">
        Layer 进度概览
      </Text>
      <Row gutter={[16, 16]}>
        {layersArray.map((layer) => {
          const progress =
            layer.totalTasks > 0
              ? (layer.completedTasks / layer.totalTasks) * 100
              : 0;

          const isCompleted = layer.completedTasks === layer.totalTasks;
          const isCurrent = layer.layerNum === currentLayer;

          return (
            <Col key={layer.layerNum} xs={24} sm={12} md={8} lg={6}>
              <Card
                size="small"
                className={isCurrent ? 'border-blue-500' : ''}
              >
                <Space direction="vertical" size="small" className="w-full">
                  <div className="flex items-center justify-between">
                    <Text strong>Layer {layer.layerNum}</Text>
                    {isCurrent && (
                      <Tag color="blue" className="m-0">
                        当前
                      </Tag>
                    )}
                    {isCompleted && (
                      <CheckCircleOutlined
                        style={{ color: '#52c41a', fontSize: 16 }}
                      />
                    )}
                  </div>

                  <Progress
                    percent={progress}
                    size="small"
                    status={isCompleted ? 'success' : 'active'}
                    showInfo={false}
                  />

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {layer.completedTasks} / {layer.totalTasks}
                    </span>
                    <span>{layer.parallel ? '并行' : '串行'}</span>
                  </div>
                </Space>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};
```

### 4. 创建进度监控页面
创建 `src/pages/ProgressView/index.tsx`（可选的独立页面）：
```typescript
import React from 'react';
import { Row, Col } from 'antd';
import { ProgressMonitor } from '@/features/task-execution/components/ProgressMonitor';
import { TaskTimeline } from '@/features/task-execution/components/TaskTimeline';
import { LayerProgressCards } from '@/features/task-execution/components/LayerProgressCards';

const ProgressView: React.FC = () => {
  return (
    <div className="p-4">
      <Row gutter={[16, 16]}>
        {/* 左侧：进度监控和 Layer 进度 */}
        <Col xs={24} lg={12}>
          <Space direction="vertical" size="middle" className="w-full">
            <ProgressMonitor />
            <LayerProgressCards />
          </Space>
        </Col>

        {/* 右侧：任务时间线 */}
        <Col xs={24} lg={12}>
          <TaskTimeline />
        </Col>
      </Row>
    </div>
  );
};

export default ProgressView;
```

### 5. 在 TaskDashboard 中集成进度监控
更新 `src/features/task-execution/components/TaskDashboard.tsx`：
```typescript
import { ProgressMonitor } from './ProgressMonitor';

// 在顶部卡片下方添加进度监控
<div className="mb-4">
  <ProgressMonitor />
</div>
```

### 6. 创建导出文件
更新 `src/features/task-execution/index.ts`：
```typescript
export { ProgressMonitor } from './components/ProgressMonitor';
export { TaskTimeline } from './components/TaskTimeline';
export { LayerProgressCards } from './components/LayerProgressCards';
// ...其他导出
```

## 期望输出
- ✅ `src/features/task-execution/components/ProgressMonitor.tsx` 进度监控组件
- ✅ `src/features/task-execution/components/TaskTimeline.tsx` 任务时间线
- ✅ `src/features/task-execution/components/LayerProgressCards.tsx` Layer 进度卡片
- ✅ 整体进度和 Layer 进度显示
- ✅ 统计信息展示
- ✅ 预估剩余时间计算
- ✅ 任务时间线展示
- ✅ Layer 进度概览

## 验证标准
```bash
npm run dev
# 访问项目页面 /project/xxx
# 应该看到：
# - 整体进度条
# - 当前 Layer 进度
# - 统计数据（总数/已完成/执行中/失败）
# - 预计剩余时间
# - 任务时间线
# - Layer 进度卡片
# - WebSocket 实时更新进度
```

## Claude 执行 Prompt

请实现任务实时进度监控功能，具体要求如下：

1. **创建进度监控组件**（src/features/task-execution/components/ProgressMonitor.tsx）：
   - 整体进度条（已完成/总任务数）
   - 当前 Layer 进度条
   - 统计信息卡片（4 个）：
     - 总任务数
     - 已完成
     - 执行中
     - 失败
   - 执行状态标签
   - 当前任务显示
   - 预估剩余时间计算和显示

2. **创建任务时间线组件**（src/features/task-execution/components/TaskTimeline.tsx）：
   - 使用 Ant Design Timeline
   - 显示最近 20 个已完成/失败的任务
   - 显示任务 ID、名称、开始时间、结束时间、耗时
   - 不同状态的图标和颜色
   - 可滚动查看

3. **创建 Layer 进度卡片**（src/features/task-execution/components/LayerProgressCards.tsx）：
   - 每个 Layer 一张小卡片
   - 显示 Layer 序号、进度条、已完成/总数
   - 当前 Layer 高亮显示
   - 已完成 Layer 显示勾选图标
   - 响应式布局

4. **集成到 TaskDashboard**：
   - 在顶部添加 ProgressMonitor

5. **创建独立进度页面**（可选）：
   - src/pages/ProgressView/index.tsx
   - 左右分栏布局
   - 左侧：进度监控 + Layer 进度
   - 右侧：任务时间线

6. **创建导出文件**

7. **验证**：
   - 进度正确计算和显示
   - 实时更新正常
   - 预估时间准确
   - 时间线正确显示

确保进度监控功能完整、数据准确、实时更新流畅。
