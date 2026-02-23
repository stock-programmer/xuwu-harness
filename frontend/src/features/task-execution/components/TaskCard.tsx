import React from 'react';
import { Card, Tag, Typography, Space } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { TaskNode } from '@/types/task.types';
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
          <Paragraph type="secondary" className="text-xs m-0" ellipsis={{ rows: 2 }}>
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
