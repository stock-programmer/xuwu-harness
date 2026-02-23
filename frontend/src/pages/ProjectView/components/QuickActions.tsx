import React from 'react';
import { Card, Button, Space, Statistic, Tooltip } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
import type { Project } from '@/types/project.types';

interface QuickActionsProps {
  project: Project;
  onStart?: () => void;
  onPause?: () => void;
  onReset?: () => void;
  onSettings?: () => void;
  onOpenFolder?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  project,
  onStart,
  onPause,
  onReset,
  onSettings,
  onOpenFolder,
}) => {
  return (
    <Card size="small">
      <div className="flex items-center justify-between">
        <Space size="middle">
          <Statistic
            title="当前 Layer"
            value={project.currentLayer || 0}
            suffix={`/ ${project.totalLayers || 0}`}
          />
          <Statistic
            title="已完成任务"
            value={project.completedTasks || 0}
            suffix={`/ ${project.totalTasks || 0}`}
          />
        </Space>

        <Space>
          {project.status === 'running' ? (
            <Tooltip title="暂停执行">
              <Button icon={<PauseCircleOutlined />} onClick={onPause}>
                暂停
              </Button>
            </Tooltip>
          ) : (
            <Tooltip title="开始执行">
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={onStart}
                disabled={project.status === 'completed'}
              >
                启动
              </Button>
            </Tooltip>
          )}

          <Tooltip title="重置项目">
            <Button icon={<ReloadOutlined />} onClick={onReset}>
              重置
            </Button>
          </Tooltip>

          <Tooltip title="打开项目文件夹">
            <Button icon={<FolderOpenOutlined />} onClick={onOpenFolder} />
          </Tooltip>

          <Tooltip title="项目设置">
            <Button icon={<SettingOutlined />} onClick={onSettings} />
          </Tooltip>
        </Space>
      </div>
    </Card>
  );
};
