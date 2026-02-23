import React, { useEffect } from 'react';
import { Card, Typography, Space, Button, Empty, Spin, Progress, Tabs } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { LayerPanel } from './LayerPanel';
import { ProgressMonitor } from './ProgressMonitor';
import { DAGVisualization } from './DAGVisualization';
import { useTaskExecutionStore } from '../store/task-execution.store';
import { useWebSocket } from '@/hooks/useWebSocket';

const { Title, Text } = Typography;

interface TaskDashboardProps {
  projectId: string;
}

export const TaskDashboard: React.FC<TaskDashboardProps> = ({ projectId }) => {
  const { tasks, layers, currentLayer, executionStatus, loading, getCompletedTasksCount } =
    useTaskExecutionStore();

  const { connected, emit, on, off } = useWebSocket(projectId);

  useEffect(() => {
    if (!connected) return;

    // 创建订阅函数
    const subscribe = (event: string, handler: (...args: any[]) => void) => {
      on(event, handler);
      return () => off(event, handler);
    };

    // 监听进度更新
    const unsubscribeProgress = subscribe('progress:update', (progressUpdate) => {
      useTaskExecutionStore.getState().updateProgress(progressUpdate);
    });

    // 监听任务状态更新
    const unsubscribeStatus = subscribe('task:status', (statusUpdate) => {
      useTaskExecutionStore.getState().updateTaskStatus(statusUpdate.taskId, statusUpdate.status, {
        error: statusUpdate.error,
        startTime: new Date().toISOString(),
      });
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
  }, [connected, on, off]);

  const handleStart = () => {
    emit('task:start', { projectId });
  };

  const handlePause = () => {
    // TODO: 实现暂停逻辑
    console.log('Pause functionality not yet implemented');
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

  const layersArray = Array.from(layers.values()).sort((a, b) => a.layerNum - b.layerNum);

  const completedTasks = getCompletedTasksCount();
  const totalTasks = tasks.length;
  const overallProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

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
              <Text type="secondary">当前 Layer: {currentLayer}</Text>
              <Text type="secondary">
                总进度: {completedTasks} / {totalTasks}
              </Text>
              <Text type="secondary">状态: {executionStatus}</Text>
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

      {/* Progress Monitor */}
      <div className="mb-4">
        <ProgressMonitor />
      </div>

      {/* Content Tabs */}
      <div className="flex-1 overflow-hidden">
        {layersArray.length === 0 ? (
          <Empty description="暂无任务" />
        ) : (
          <Tabs
            defaultActiveKey="layers"
            items={[
              {
                key: 'layers',
                label: 'Layer 视图',
                children: (
                  <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                    {layersArray.map((layer) => (
                      <LayerPanel key={layer.layerNum} layer={layer} />
                    ))}
                  </div>
                ),
              },
              {
                key: 'dag',
                label: 'DAG 视图',
                children: (
                  <div style={{ height: 'calc(100vh - 400px)' }}>
                    <DAGVisualization
                      onNodeClick={(taskId) => {
                        console.log('Clicked task:', taskId);
                        // TODO: Navigate to task details or highlight
                      }}
                    />
                  </div>
                ),
              },
            ]}
          />
        )}
      </div>
    </div>
  );
};
