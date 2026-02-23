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
                      <div>开始时间: {formatDateTime(task.result.startTime)}</div>
                      {task.result.endTime && (
                        <div>结束时间: {formatDateTime(task.result.endTime)}</div>
                      )}
                      {task.result.duration !== undefined && (
                        <div>耗时: {formatDuration(task.result.duration)}</div>
                      )}
                      {task.result.error && (
                        <div className="text-red-500">错误: {task.result.error}</div>
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
