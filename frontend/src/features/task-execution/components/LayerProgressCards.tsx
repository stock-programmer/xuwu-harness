import React from 'react';
import { Card, Progress, Space, Typography, Tag, Row, Col } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useTaskExecutionStore } from '../store/task-execution.store';

const { Text } = Typography;

export const LayerProgressCards: React.FC = () => {
  const { layers, currentLayer } = useTaskExecutionStore();

  const layersArray = Array.from(layers.values()).sort((a, b) => a.layerNum - b.layerNum);

  if (layersArray.length === 0) {
    return null;
  }

  return (
    <div>
      <Text strong className="block mb-3">
        Layer 进度概览
      </Text>
      <Row gutter={[16, 16]}>
        {layersArray.map((layer) => {
          const progress =
            layer.totalTasks > 0 ? (layer.completedTasks / layer.totalTasks) * 100 : 0;

          const isCompleted = layer.completedTasks === layer.totalTasks;
          const isCurrent = layer.layerNum === currentLayer;

          return (
            <Col key={layer.layerNum} xs={24} sm={12} md={8} lg={6}>
              <Card size="small" className={isCurrent ? 'border-blue-500' : ''}>
                <Space direction="vertical" size="small" className="w-full">
                  <div className="flex items-center justify-between">
                    <Text strong>Layer {layer.layerNum}</Text>
                    {isCurrent && (
                      <Tag color="blue" className="m-0">
                        当前
                      </Tag>
                    )}
                    {isCompleted && (
                      <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />
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
