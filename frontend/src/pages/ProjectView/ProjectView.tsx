import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, Spin, Alert } from 'antd';
import { CodeOutlined, DashboardOutlined, LineChartOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { projectApi } from '@/services/api/project.api';
import { FileExplorer } from '@/features/file-explorer/components/FileExplorer';
import { FileEditor } from '@/features/file-explorer/components/FileEditor';
import { OutputConsole } from '@/features/output-console/components/OutputConsole';
import { ModeControl } from '@/features/mode-control/components/ModeControl';
import { TaskDashboard } from '@/features/task-execution/components/TaskDashboard';
import { ProgressMonitor } from '@/features/task-execution/components/ProgressMonitor';
import { WebSocketProvider, useWebSocketContext } from '@/contexts/WebSocketContext';
import { useOutputWebSocket } from '@/features/output-console/hooks/useOutputWebSocket';
import { useTaskExecutionStore } from '@/features/task-execution/store/task-execution.store';
import { useFileExplorerStore } from '@/features/file-explorer/store/file-explorer.store';

const ProjectViewContent: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { connected } = useWebSocketContext();
  const { loadFileTree } = useFileExplorerStore();
  const { loadTasks } = useTaskExecutionStore();

  // Setup WebSocket event handlers
  useOutputWebSocket();

  // Get project details
  const {
    data: project,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectApi.getProject(projectId!),
    enabled: !!projectId,
    refetchInterval: 5000, // Refetch every 5 seconds for status updates
  });

  // Initialize file tree and tasks
  useEffect(() => {
    if (projectId) {
      loadFileTree(projectId);

      // TODO: Load tasks from API when available
      // const tasks = await fetchTasks(projectId);
      // loadTasks(tasks);
    }
  }, [projectId, loadFileTree, loadTasks]);

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-full">
        <Alert message="项目 ID 无效" type="error" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spin size="large" tip="加载项目..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Alert
          message="加载项目失败"
          description={(error as Error).message}
          type="error"
          showIcon
        />
      </div>
    );
  }

  const tabItems = [
    {
      key: 'editor',
      label: (
        <span>
          <CodeOutlined />
          文件编辑器
        </span>
      ),
      children: (
        <div className="flex h-full">
          {/* Left: File Tree */}
          <div className="w-64 border-r border-gray-200 overflow-hidden">
            <FileExplorer projectId={projectId} />
          </div>
          {/* Right: File Editor */}
          <div className="flex-1 overflow-hidden p-4">
            <FileEditor projectId={projectId} />
          </div>
        </div>
      ),
    },
    {
      key: 'tasks',
      label: (
        <span>
          <DashboardOutlined />
          任务仪表板
        </span>
      ),
      children: <TaskDashboard projectId={projectId} />,
    },
    {
      key: 'progress',
      label: (
        <span>
          <LineChartOutlined />
          进度监控
        </span>
      ),
      children: (
        <div className="p-4">
          <ProgressMonitor />
        </div>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Top project info bar */}
      {project && (
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold m-0">{project.name}</h2>
              <div className="text-sm text-gray-500 mt-1">{project.rootPath}</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-gray-500">WebSocket: </span>
                <span className={connected ? 'text-green-600' : 'text-red-600'}>
                  {connected ? '已连接' : '未连接'}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">状态: </span>
                <span className="font-medium">{project.status}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Top section: Multi-tab view */}
        <div className="flex-1 overflow-auto">
          <Tabs
            items={tabItems}
            defaultActiveKey="editor"
            className="h-full"
            tabBarStyle={{ paddingLeft: 16, paddingRight: 16, marginBottom: 0 }}
          />
        </div>
      </div>

      {/* Bottom section: Output console and mode control */}
      <div className="h-96 border-t border-gray-200 flex">
        {/* Left: Output console */}
        <div className="flex-1 overflow-hidden p-2">
          <OutputConsole />
        </div>

        {/* Right: Mode control */}
        <div className="w-96 border-l border-gray-200 overflow-auto p-2">
          <ModeControl projectId={projectId} />
        </div>
      </div>
    </div>
  );
};

export const ProjectView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-full">
        <Alert message="项目 ID 无效" type="error" />
      </div>
    );
  }

  return (
    <WebSocketProvider projectId={projectId}>
      <ProjectViewContent projectId={projectId} />
    </WebSocketProvider>
  );
};

export default ProjectView;
