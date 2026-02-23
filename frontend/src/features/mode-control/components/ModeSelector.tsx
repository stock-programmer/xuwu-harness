import React from 'react';
import { Radio, Space, Typography, Tooltip } from 'antd';
import {
  FileTextOutlined,
  PartitionOutlined,
  OrderedListOutlined,
  ThunderboltOutlined,
  PlayCircleOutlined,
  SyncOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import type { WorkMode } from '@/types/mode.types';
import { WORK_MODES } from '@/constants/modes';

const { Text } = Typography;

interface ModeSelectorProps {
  value: WorkMode;
  onChange: (mode: WorkMode) => void;
  disabled?: boolean;
}

const MODE_ICONS: Record<WorkMode, React.ReactNode> = {
  prd: <FileTextOutlined />,
  architecture: <PartitionOutlined />,
  'dev-plan': <OrderedListOutlined />,
  'task-gen': <ThunderboltOutlined />,
  'task-exec': <PlayCircleOutlined />,
  'loop-test': <SyncOutlined />,
  deploy: <RocketOutlined />,
};

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Text strong>工作模式</Text>
        <Text type="secondary" className="text-xs">
          选择 Claude 的工作模式
        </Text>
      </div>

      <Radio.Group
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full"
      >
        <Space orientation="vertical" className="w-full">
          {Object.entries(WORK_MODES).map(([mode, config]) => (
            <Tooltip key={mode} title={config.description} placement="right">
              <Radio value={mode} className="w-full">
                <Space>
                  <span className="text-lg">{MODE_ICONS[mode as WorkMode]}</span>
                  <span>{config.name}</span>
                </Space>
              </Radio>
            </Tooltip>
          ))}
        </Space>
      </Radio.Group>
    </div>
  );
};
