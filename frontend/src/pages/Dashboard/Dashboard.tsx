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
} from '@ant-design/icons';
import { projectApi } from '@/services/api/project.api';
import { ProjectCard } from './components/ProjectCard';
import { CreateProjectModal } from './components/CreateProjectModal';
import type { Project, CreateProjectInput } from '@/types/project.types';

const { Search } = Input;

export const Dashboard: React.FC = () => {
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
    mutationFn: (config: CreateProjectInput) => projectApi.createProject(config),
    onSuccess: () => {
      message.success('项目创建成功');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projectStats'] });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : '项目创建失败';
      message.error(errorMessage);
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
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : '项目删除失败';
      message.error(errorMessage);
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

  const handleCreateProject = async (config: CreateProjectInput) => {
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

          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
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
          <Empty description="暂无项目" image={Empty.PRESENTED_IMAGE_SIMPLE}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
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
