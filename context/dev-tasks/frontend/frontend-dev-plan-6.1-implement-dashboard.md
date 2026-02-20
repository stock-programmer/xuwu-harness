# Task: 实现 Dashboard 主页面

## 元数据
- **Task ID**: frontend-dev-plan-6.1
- **Layer**: 6
- **Dependencies**: [5.1, 5.2, 5.3, 5.4, 5.5]
- **Parallel Group**: [6.1, 6.2]
- **Estimated Complexity**: High

## 目标
实现项目列表的 Dashboard 主页面，包括项目卡片、创建项目、项目统计、搜索过滤等功能。

## 前置条件
- Layer 5 所有任务已完成

## 实现步骤

### 1. 创建项目 API
创建 `src/services/api/project.api.ts`（如果还未创建完整版）：
```typescript
import { httpClient } from './http-client';
import { Project, ProjectConfig, ProjectStats } from '@/types/project.types';
import { ApiResponse, PaginatedResponse } from '@/types/api.types';

export const projectApi = {
  // 获取项目列表
  getProjects: (params?: {
    page?: number;
    pageSize?: number;
    type?: string;
    status?: string;
    search?: string;
  }): Promise<PaginatedResponse<Project>> =>
    httpClient.get('/api/projects', { params }),

  // 获取单个项目
  getProject: (id: string): Promise<Project> =>
    httpClient.get(`/api/projects/${id}`),

  // 创建项目
  createProject: (config: ProjectConfig): Promise<Project> =>
    httpClient.post('/api/projects', config),

  // 更新项目
  updateProject: (id: string, data: Partial<Project>): Promise<Project> =>
    httpClient.put(`/api/projects/${id}`, data),

  // 删除项目
  deleteProject: (id: string): Promise<void> =>
    httpClient.delete(`/api/projects/${id}`),

  // 获取项目统计
  getProjectStats: (): Promise<ProjectStats> =>
    httpClient.get('/api/projects/stats'),

  // 启动项目执行
  startProject: (id: string): Promise<void> =>
    httpClient.post(`/api/projects/${id}/start`),

  // 暂停项目执行
  pauseProject: (id: string): Promise<void> =>
    httpClient.post(`/api/projects/${id}/pause`),

  // 重置项目
  resetProject: (id: string): Promise<void> =>
    httpClient.post(`/api/projects/${id}/reset`),
};
```

### 2. 创建项目卡片组件
创建 `src/pages/Dashboard/components/ProjectCard.tsx`：
```typescript
import React from 'react';
import { Card, Tag, Typography, Space, Progress, Button, Dropdown } from 'antd';
import {
  EllipsisOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Project } from '@/types/project.types';
import { formatDateTime } from '@/utils/format';

const { Title, Text, Paragraph } = Typography;

interface ProjectCardProps {
  project: Project;
  onStart?: (project: Project) => void;
  onPause?: (project: Project) => void;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

const STATUS_CONFIG = {
  initializing: { color: 'default', text: '初始化中' },
  ready: { color: 'blue', text: '就绪' },
  running: { color: 'processing', text: '执行中' },
  paused: { color: 'warning', text: '已暂停' },
  completed: { color: 'success', text: '已完成' },
  failed: { color: 'error', text: '失败' },
};

const TYPE_CONFIG = {
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

  const statusConfig = STATUS_CONFIG[project.status];
  const typeConfig = TYPE_CONFIG[project.type];

  const progress =
    project.totalTasks && project.totalTasks > 0
      ? ((project.completedTasks || 0) / project.totalTasks) * 100
      : 0;

  const menuItems = [
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
    { type: 'divider' as const },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除',
      danger: true,
      onClick: () => onDelete?.(project),
    },
  ];

  return (
    <Card
      hoverable
      actions={[
        project.status === 'running' ? (
          <Button
            type="link"
            icon={<PauseCircleOutlined />}
            onClick={() => onPause?.(project)}
          >
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
        <Button
          type="link"
          onClick={() => navigate(`/project/${project.id}`)}
        >
          查看详情
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
```

### 3. 创建项目创建对话框
创建 `src/pages/Dashboard/components/CreateProjectModal.tsx`：
```typescript
import React, { useState } from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import { ProjectConfig, ProjectType } from '@/types/project.types';

interface CreateProjectModalProps {
  open: boolean;
  onOk: (config: ProjectConfig) => Promise<void>;
  onCancel: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  open,
  onOk,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const config: ProjectConfig = {
        name: values.name,
        type: values.type,
        rootPath: values.rootPath,
        outputPath: values.outputPath || `${values.rootPath}/output`,
        claudeModel: values.claudeModel || 'claude-sonnet-4',
        maxRetries: values.maxRetries || 3,
      };

      await onOk(config);
      form.resetFields();
      onCancel();
    } catch (error: any) {
      console.error('Form validation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="创建新项目"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={600}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="项目名称"
          rules={[
            { required: true, message: '请输入项目名称' },
            { min: 3, max: 50, message: '长度必须在 3-50 字符之间' },
          ]}
        >
          <Input placeholder="例如: my-awesome-project" />
        </Form.Item>

        <Form.Item
          name="type"
          label="项目类型"
          rules={[{ required: true, message: '请选择项目类型' }]}
          initialValue="fullstack"
        >
          <Select>
            <Select.Option value="fullstack">全栈项目</Select.Option>
            <Select.Option value="frontend">前端项目</Select.Option>
            <Select.Option value="backend">后端项目</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="rootPath"
          label="项目根目录"
          rules={[{ required: true, message: '请输入项目根目录' }]}
        >
          <Input placeholder="/path/to/your/project" />
        </Form.Item>

        <Form.Item name="outputPath" label="输出目录">
          <Input placeholder="默认为 {rootPath}/output" />
        </Form.Item>

        <Form.Item name="claudeModel" label="Claude 模型">
          <Select defaultValue="claude-sonnet-4">
            <Select.Option value="claude-sonnet-4">Claude Sonnet 4</Select.Option>
            <Select.Option value="claude-opus-3">Claude Opus 3</Select.Option>
            <Select.Option value="claude-haiku-3">Claude Haiku 3</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="maxRetries" label="最大重试次数">
          <Input type="number" placeholder="3" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
```

### 4. 创建 Dashboard 主页面
创建 `src/pages/Dashboard/index.tsx`：
```typescript
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Row,
  Col,
  Card,
  Statistic,
  Button,
  Input,
  Select,
  Space,
  Empty,
  Spin,
  message,
  Modal,
} from 'antd';
import {
  PlusOutlined,
  ProjectOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { projectApi } from '@/services/api/project.api';
import { ProjectCard } from './components/ProjectCard';
import { CreateProjectModal } from './components/CreateProjectModal';
import { Project, ProjectConfig } from '@/types/project.types';

const { Search } = Input;

const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  // 获取项目列表
  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', { search: searchText, type: typeFilter, status: statusFilter }],
    queryFn: () =>
      projectApi.getProjects({
        search: searchText,
        type: typeFilter,
        status: statusFilter,
      }),
  });

  // 获取项目统计
  const { data: stats } = useQuery({
    queryKey: ['projectStats'],
    queryFn: () => projectApi.getProjectStats(),
  });

  // 创建项目
  const createMutation = useMutation({
    mutationFn: (config: ProjectConfig) => projectApi.createProject(config),
    onSuccess: () => {
      message.success('项目创建成功');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projectStats'] });
    },
    onError: (error: any) => {
      message.error(error.message || '项目创建失败');
    },
  });

  // 删除项目
  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectApi.deleteProject(id),
    onSuccess: () => {
      message.success('项目删除成功');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projectStats'] });
    },
    onError: (error: any) => {
      message.error(error.message || '项目删除失败');
    },
  });

  // 启动项目
  const startMutation = useMutation({
    mutationFn: (id: string) => projectApi.startProject(id),
    onSuccess: () => {
      message.success('项目已启动');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  // 暂停项目
  const pauseMutation = useMutation({
    mutationFn: (id: string) => projectApi.pauseProject(id),
    onSuccess: () => {
      message.success('项目已暂停');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const handleCreateProject = async (config: ProjectConfig) => {
    await createMutation.mutateAsync(config);
  };

  const handleDeleteProject = (project: Project) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除项目 "${project.name}" 吗？此操作无法撤销。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => deleteMutation.mutate(project.id),
    });
  };

  const projects = projectsData?.items || [];

  return (
    <div className="p-6">
      {/* 统计卡片 */}
      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总项目数"
              value={stats?.totalProjects || 0}
              prefix={<ProjectOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="运行中"
              value={stats?.runningProjects || 0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<SyncOutlined spin />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已完成"
              value={stats?.completedProjects || 0}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="失败"
              value={stats?.failedProjects || 0}
              valueStyle={{ color: '#cf1322' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 工具栏 */}
      <Card className="mb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Space wrap>
            <Search
              placeholder="搜索项目名称"
              allowClear
              style={{ width: 250 }}
              onSearch={setSearchText}
            />

            <Select
              placeholder="项目类型"
              allowClear
              style={{ width: 120 }}
              onChange={setTypeFilter}
            >
              <Select.Option value="fullstack">全栈</Select.Option>
              <Select.Option value="frontend">前端</Select.Option>
              <Select.Option value="backend">后端</Select.Option>
            </Select>

            <Select
              placeholder="项目状态"
              allowClear
              style={{ width: 120 }}
              onChange={setStatusFilter}
            >
              <Select.Option value="ready">就绪</Select.Option>
              <Select.Option value="running">执行中</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
              <Select.Option value="failed">失败</Select.Option>
            </Select>
          </Space>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            创建项目
          </Button>
        </div>
      </Card>

      {/* 项目列表 */}
      {projectsLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spin size="large" tip="加载项目..." />
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <Empty
            description="暂无项目"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalOpen(true)}
            >
              创建第一个项目
            </Button>
          </Empty>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {projects.map((project) => (
            <Col key={project.id} xs={24} sm={12} lg={8} xl={6}>
              <ProjectCard
                project={project}
                onStart={(p) => startMutation.mutate(p.id)}
                onPause={(p) => pauseMutation.mutate(p.id)}
                onDelete={handleDeleteProject}
              />
            </Col>
          ))}
        </Row>
      )}

      {/* 创建项目对话框 */}
      <CreateProjectModal
        open={createModalOpen}
        onOk={handleCreateProject}
        onCancel={() => setCreateModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
```

### 5. 创建导出文件
创建 `src/pages/Dashboard/components/index.ts`：
```typescript
export { ProjectCard } from './ProjectCard';
export { CreateProjectModal } from './CreateProjectModal';
```

## 期望输出
- ✅ `src/services/api/project.api.ts` 项目 API
- ✅ `src/pages/Dashboard/components/ProjectCard.tsx` 项目卡片
- ✅ `src/pages/Dashboard/components/CreateProjectModal.tsx` 创建项目对话框
- ✅ `src/pages/Dashboard/index.tsx` Dashboard 主页面
- ✅ 项目统计展示
- ✅ 项目列表网格布局
- ✅ 搜索和过滤功能
- ✅ 创建/启动/暂停/删除项目

## 验证标准
```bash
npm run dev
# 访问 http://localhost:5173/dashboard
# 应该看到：
# - 顶部统计卡片（总数/运行中/已完成/失败）
# - 搜索和过滤工具栏
# - 项目卡片网格
# - 创建项目按钮和对话框
# - 项目操作（启动/暂停/查看/删除）
```

## Claude 执行 Prompt

请实现 Dashboard 主页面，具体要求如下：

1. **创建项目 API**（src/services/api/project.api.ts）：
   - getProjects: 获取项目列表（支持分页和过滤）
   - getProject: 获取单个项目
   - createProject: 创建项目
   - updateProject: 更新项目
   - deleteProject: 删除项目
   - getProjectStats: 获取统计数据
   - startProject/pauseProject/resetProject: 项目控制

2. **创建项目卡片**（src/pages/Dashboard/components/ProjectCard.tsx）：
   - 显示项目名称、类型、状态
   - 进度条（已完成/总任务）
   - 项目元信息（路径、层级、创建时间）
   - 操作按钮：启动/暂停、查看详情、更多操作
   - 下拉菜单：打开、编辑、删除

3. **创建项目对话框**（src/pages/Dashboard/components/CreateProjectModal.tsx）：
   - 表单字段：
     - 项目名称（必填，3-50 字符）
     - 项目类型（全栈/前端/后端）
     - 项目根目录（必填）
     - 输出目录
     - Claude 模型
     - 最大重试次数

4. **创建 Dashboard 页面**（src/pages/Dashboard/index.tsx）：
   - 统计卡片（4 个）
   - 工具栏：
     - 搜索框
     - 类型过滤
     - 状态过滤
     - 创建项目按钮
   - 项目列表（响应式网格布局）
   - 使用 React Query 管理数据
   - 创建/删除/启动/暂停的 mutations

5. **创建导出文件**

6. **验证**：
   - 页面正确渲染
   - 统计数据正确显示
   - 搜索和过滤正常
   - CRUD 操作正常

确保 Dashboard 功能完整、交互流畅、数据管理正确。
