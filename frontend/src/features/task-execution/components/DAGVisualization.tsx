import React, { useMemo } from 'react';
import { Card, Typography, Space, Button, Select, Switch } from 'antd';
import { ExpandOutlined, DownloadOutlined } from '@ant-design/icons';
import { MermaidDiagram } from '@/components/business/MermaidDiagram/MermaidDiagram';
import { useTaskExecutionStore } from '../store/task-execution.store';
import { generateMermaidDAG } from '../utils/dag-generator';

const { Title } = Typography;

interface DAGVisualizationProps {
  onNodeClick?: (taskId: string) => void;
}

export const DAGVisualization: React.FC<DAGVisualizationProps> = ({ onNodeClick }) => {
  const { tasks } = useTaskExecutionStore();
  const [showStatus, setShowStatus] = React.useState(true);
  const [theme, setTheme] = React.useState<'default' | 'dark' | 'forest' | 'neutral'>('default');

  const mermaidCode = useMemo(() => {
    return generateMermaidDAG(tasks, { showStatus });
  }, [tasks, showStatus]);

  const handleDownloadSVG = () => {
    const svg = document.querySelector('.mermaid-container svg');
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `dag-${Date.now()}.svg`;
    a.click();

    URL.revokeObjectURL(url);
  };

  const handleFullscreen = () => {
    const container = document.querySelector('.mermaid-container');
    if (container) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        container.requestFullscreen();
      }
    }
  };

  return (
    <Card className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <Title level={4} className="m-0 mb-2">
            任务依赖关系（DAG）
          </Title>
          <Space size="small">
            <span className="text-sm text-gray-500">节点数: {tasks.length}</span>
            <Switch
              checkedChildren="显示状态"
              unCheckedChildren="隐藏状态"
              checked={showStatus}
              onChange={setShowStatus}
              size="small"
            />
          </Space>
        </div>

        <Space>
          <Select value={theme} onChange={setTheme} size="small" style={{ width: 100 }}>
            <Select.Option value="default">默认</Select.Option>
            <Select.Option value="dark">深色</Select.Option>
            <Select.Option value="forest">森林</Select.Option>
            <Select.Option value="neutral">中性</Select.Option>
          </Select>

          <Button icon={<DownloadOutlined />} onClick={handleDownloadSVG} size="small">
            下载 SVG
          </Button>

          <Button icon={<ExpandOutlined />} onClick={handleFullscreen} size="small">
            全屏
          </Button>
        </Space>
      </div>

      {/* DAG */}
      <div
        className="border border-gray-200 rounded overflow-hidden"
        style={{ height: 'calc(100% - 80px)' }}
      >
        <MermaidDiagram chart={mermaidCode} onNodeClick={onNodeClick} theme={theme} />
      </div>
    </Card>
  );
};
