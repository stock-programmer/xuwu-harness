import React from 'react';
import { Card, Progress, Typography, Space, Statistic, Row, Col, Tag } from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useTaskExecutionStore } from '../store/task-execution.store';
import { formatDuration } from '@/utils/format';

const { Title, Text } = Typography;

export const ProgressMonitor: React.FC = () => {
  const { tasks, currentLayer, executionStatus, progress, layers, getCompletedTasksCount } =
    useTaskExecutionStore();

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
            failedTasks > 0 ? 'exception' : executionStatus === 'completed' ? 'success' : 'active'
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
          <Statistic title="总任务数" value={totalTasks} prefix={<ClockCircleOutlined />} />
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
              <Text>{progress.currentTaskId || '-'}</Text>
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
