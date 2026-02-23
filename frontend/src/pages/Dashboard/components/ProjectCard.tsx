import React from 'react';
import { Card, Tag, Typography, Space, Progress, Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import {
  EllipsisOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { Project, ProjectStatus, ProjectType } from '@/types/project.types';
import { formatDateTime } from '@/utils/format';

const { Title, Text } = Typography;

interface ProjectCardProps {
  project: Project;
  onStart?: (project: Project) => void;
  onPause?: (project: Project) => void;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

const STATUS_CONFIG: Record<ProjectStatus, { color: string; text: string }> = {
  initializing: { color: 'default', text: '初始化中' },
  idle: { color: 'default', text: '空闲' },
  ready: { color: 'blue', text: '就绪' },
  running: { color: 'processing', text: '执行中' },
  paused: { color: 'warning', text: '已暂停' },
  completed: { color: 'success', text: '已完成' },
  failed: { color: 'error', text: '失败' },
};

const TYPE_CONFIG: Record<ProjectType, { color: string; text: string }> = {
  fullstack: { color: 'purple', text: '全栈' },
  frontend: { color: 'blue', text: '前端' },
  backend: { color: 'green', text: '后端' },
};

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onStart,
  onPause,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();

  const statusConfig = STATUS_CONFIG[project.status] || { color: 'default', text: project.status };
  const typeConfig = TYPE_CONFIG[project.type] || { color: 'default', text: project.type };

  const progress =
    project.totalTasks && project.totalTasks > 0
      ? ((project.completedTasks || 0) / project.totalTasks) * 100
      : 0;

  const menuItems: MenuProps['items'] = [
    {
      key: 'open',
      icon: <FolderOpenOutlined />,
      label: '打开项目',
      onClick: () => navigate(`/project/${project.id}`),
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: '编辑',
      onClick: () => onEdit?.(project),
    },
  ];

  return (
    <Card
      hoverable
      actions={[
        project.status === 'running' ? (
          <Button type="link" icon={<PauseCircleOutlined />} onClick={() => onPause?.(project)}>
            暂停
          </Button>
        ) : (
          <Button
            type="link"
            icon={<PlayCircleOutlined />}
            onClick={() => onStart?.(project)}
            disabled={project.status === 'completed'}
          >
            启动
          </Button>
        ),
        <Button type="link" onClick={() => navigate(`/project/${project.id}`)}>
          查看详情
        </Button>,
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => onDelete?.(project)}
        >
          删除
        </Button>,
        <Dropdown menu={{ items: menuItems }} placement="bottomRight">
          <Button type="link" icon={<EllipsisOutlined />} />
        </Dropdown>,
      ]}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <Title level={5} ellipsis className="m-0 mb-2">
            {project.name}
          </Title>
          <Space size="small" wrap>
            <Tag color={typeConfig.color}>{typeConfig.text}</Tag>
            <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
          </Space>
        </div>
      </div>

      {/* Progress */}
      {project.totalTasks && project.totalTasks > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <Text type="secondary" className="text-xs">
              进度
            </Text>
            <Text type="secondary" className="text-xs">
              {project.completedTasks || 0} / {project.totalTasks}
            </Text>
          </div>
          <Progress
            percent={progress}
            size="small"
            status={project.status === 'failed' ? 'exception' : 'active'}
            showInfo={false}
          />
        </div>
      )}

      {/* Meta Info */}
      <Space direction="vertical" size="small" className="w-full">
        {project.rootPath && (
          <div className="flex items-center justify-between">
            <Text type="secondary" className="text-xs">
              路径:
            </Text>
            <Text className="text-xs truncate max-w-xs" title={project.rootPath}>
              {project.rootPath}
            </Text>
          </div>
        )}

        {project.currentLayer !== undefined && project.totalLayers && (
          <div className="flex items-center justify-between">
            <Text type="secondary" className="text-xs">
              当前层级:
            </Text>
            <Text className="text-xs">
              Layer {project.currentLayer} / {project.totalLayers}
            </Text>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Text type="secondary" className="text-xs">
            创建时间:
          </Text>
          <Text className="text-xs">{formatDateTime(project.createdAt)}</Text>
        </div>
      </Space>
    </Card>
  );
};
