import React from 'react';
import { Card, Typography, Space, Progress, Badge } from 'antd';
import type { LayerInfo } from '@/types/task.types';
import { TaskCard } from './TaskCard';
import { useTaskExecutionStore } from '../store/task-execution.store';

const { Title, Text } = Typography;

interface LayerPanelProps {
  layer: LayerInfo;
  onTaskClick?: (taskId: string) => void;
}

export const LayerPanel: React.FC<LayerPanelProps> = ({ layer, onTaskClick }) => {
  const { getTasksByLayer } = useTaskExecutionStore();
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
          format={() => `${layer.completedTasks} / ${layer.totalTasks}`}
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
          <TaskCard key={task.id} task={task} onClick={() => onTaskClick?.(task.id)} />
        ))}
      </div>
    </Card>
  );
};
