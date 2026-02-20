# Task: 实现文件浏览器模块

## 元数据
- **Task ID**: frontend-dev-plan-4.1
- **Layer**: 4
- **Dependencies**: [3.3, 3.1, 3.4]
- **Parallel Group**: [4.1, 4.2, 4.3, 4.4]
- **Estimated Complexity**: High

## 目标
实现完整的文件浏览器功能，包括文件树渲染、文件加载、目录展开/折叠、文件选择等核心功能。

## 前置条件
- MainLayout 已实现（Task 3.3 完成）
- Axios 客户端已封装（Task 3.1 完成）
- TypeScript 类型已定义（Task 3.4 完成）

## 实现步骤

### 1. 创建文件浏览器 API
创建 `src/services/api/file.api.ts`：
```typescript
import { httpClient } from './http-client';
import { FileNode, FileContent } from '@/types/file.types';

export const fileApi = {
  // 获取文件树
  getFileTree: (projectId: string, path = '/'): Promise<FileNode[]> =>
    httpClient.get(`/api/projects/${projectId}/files/tree`, {
      params: { path },
    }),

  // 获取文件内容
  getFileContent: (projectId: string, filePath: string): Promise<FileContent> =>
    httpClient.get(`/api/projects/${projectId}/files/content`, {
      params: { path: filePath },
    }),

  // 创建文件
  createFile: (
    projectId: string,
    path: string,
    content: string
  ): Promise<FileNode> =>
    httpClient.post(`/api/projects/${projectId}/files`, {
      path,
      content,
      type: 'file',
    }),

  // 创建目录
  createDirectory: (projectId: string, path: string): Promise<FileNode> =>
    httpClient.post(`/api/projects/${projectId}/files`, {
      path,
      type: 'directory',
    }),

  // 删除文件/目录
  deleteFile: (projectId: string, path: string): Promise<void> =>
    httpClient.delete(`/api/projects/${projectId}/files`, {
      params: { path },
    }),

  // 重命名文件/目录
  renameFile: (
    projectId: string,
    oldPath: string,
    newPath: string
  ): Promise<FileNode> =>
    httpClient.put(`/api/projects/${projectId}/files/rename`, {
      oldPath,
      newPath,
    }),
};
```

### 2. 创建文件浏览器 Store
创建 `src/features/file-explorer/store/file-explorer.store.ts`：
```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { FileNode } from '@/types/file.types';
import { fileApi } from '@/services/api/file.api';

interface FileExplorerState {
  // 状态
  fileTree: FileNode[];
  selectedFile: FileNode | null;
  expandedKeys: string[];
  loading: boolean;
  error: string | null;

  // Actions
  loadFileTree: (projectId: string, path?: string) => Promise<void>;
  selectFile: (file: FileNode) => void;
  toggleExpand: (nodeId: string) => void;
  expandNode: (nodeId: string) => void;
  collapseNode: (nodeId: string) => void;
  refreshTree: (projectId: string) => Promise<void>;
  reset: () => void;
}

export const useFileExplorerStore = create<FileExplorerState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      fileTree: [],
      selectedFile: null,
      expandedKeys: [],
      loading: false,
      error: null,

      // 加载文件树
      loadFileTree: async (projectId, path = '/') => {
        set({ loading: true, error: null });
        try {
          const tree = await fileApi.getFileTree(projectId, path);
          set({ fileTree: tree, loading: false });
        } catch (error: any) {
          set({
            error: error.message || '加载文件树失败',
            loading: false,
          });
        }
      },

      // 选择文件
      selectFile: (file) => {
        set({ selectedFile: file });
      },

      // 切换展开/折叠
      toggleExpand: (nodeId) => {
        const { expandedKeys } = get();
        const newExpandedKeys = expandedKeys.includes(nodeId)
          ? expandedKeys.filter((key) => key !== nodeId)
          : [...expandedKeys, nodeId];
        set({ expandedKeys: newExpandedKeys });
      },

      // 展开节点
      expandNode: (nodeId) => {
        const { expandedKeys } = get();
        if (!expandedKeys.includes(nodeId)) {
          set({ expandedKeys: [...expandedKeys, nodeId] });
        }
      },

      // 折叠节点
      collapseNode: (nodeId) => {
        const { expandedKeys } = get();
        set({ expandedKeys: expandedKeys.filter((key) => key !== nodeId) });
      },

      // 刷新文件树
      refreshTree: async (projectId) => {
        await get().loadFileTree(projectId);
      },

      // 重置状态
      reset: () => {
        set({
          fileTree: [],
          selectedFile: null,
          expandedKeys: [],
          loading: false,
          error: null,
        });
      },
    }),
    { name: 'FileExplorerStore' }
  )
);
```

### 3. 创建文件树节点组件
创建 `src/features/file-explorer/components/FileTreeNode.tsx`：
```typescript
import React from 'react';
import {
  FileOutlined,
  FolderOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
import { FileNode } from '@/types/file.types';

interface FileTreeNodeProps {
  node: FileNode;
  level: number;
  isExpanded: boolean;
  isSelected: boolean;
  onSelect: (node: FileNode) => void;
  onToggle: (node: FileNode) => void;
}

export const FileTreeNode: React.FC<FileTreeNodeProps> = ({
  node,
  level,
  isExpanded,
  isSelected,
  onSelect,
  onToggle,
}) => {
  const handleClick = () => {
    if (node.type === 'directory') {
      onToggle(node);
    }
    onSelect(node);
  };

  const getIcon = () => {
    if (node.type === 'file') {
      return <FileOutlined className="text-gray-500" />;
    }
    return isExpanded ? (
      <FolderOpenOutlined className="text-blue-500" />
    ) : (
      <FolderOutlined className="text-blue-500" />
    );
  };

  return (
    <div>
      <div
        className={`
          flex items-center gap-2 px-2 py-1 cursor-pointer
          hover:bg-gray-100 rounded
          ${isSelected ? 'bg-blue-50 text-blue-600' : ''}
        `}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        {getIcon()}
        <span className="text-sm truncate">{node.name}</span>
      </div>

      {node.type === 'directory' && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNodeConnected
              key={child.id}
              node={child}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// 连接到 store 的组件
import { useFileExplorerStore } from '../store/file-explorer.store';

const FileTreeNodeConnected: React.FC<{
  node: FileNode;
  level: number;
}> = ({ node, level }) => {
  const { selectedFile, expandedKeys, selectFile, toggleExpand } =
    useFileExplorerStore();

  const isExpanded = expandedKeys.includes(node.id);
  const isSelected = selectedFile?.id === node.id;

  return (
    <FileTreeNode
      node={node}
      level={level}
      isExpanded={isExpanded}
      isSelected={isSelected}
      onSelect={selectFile}
      onToggle={(n) => toggleExpand(n.id)}
    />
  );
};
```

### 4. 创建文件浏览器主组件
创建 `src/features/file-explorer/components/FileExplorer.tsx`：
```typescript
import React, { useEffect } from 'react';
import { Spin, Empty, Typography, Space, Button } from 'antd';
import { ReloadOutlined, FolderAddOutlined, FileAddOutlined } from '@ant-design/icons';
import { useFileExplorerStore } from '../store/file-explorer.store';
import { FileTreeNode } from './FileTreeNode';

const { Title } = Typography;

interface FileExplorerProps {
  projectId: string;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ projectId }) => {
  const {
    fileTree,
    loading,
    error,
    expandedKeys,
    selectedFile,
    loadFileTree,
    refreshTree,
    selectFile,
    toggleExpand,
  } = useFileExplorerStore();

  useEffect(() => {
    if (projectId) {
      loadFileTree(projectId);
    }
  }, [projectId, loadFileTree]);

  const handleRefresh = () => {
    refreshTree(projectId);
  };

  if (loading && fileTree.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spin size="large" tip="加载文件树..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Empty
          description={error}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" onClick={handleRefresh}>
            重试
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <Title level={5} className="m-0">
            文件浏览器
          </Title>
          <Button
            type="text"
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
          />
        </div>

        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<FolderAddOutlined />}
            disabled
          >
            新建文件夹
          </Button>
          <Button
            type="text"
            size="small"
            icon={<FileAddOutlined />}
            disabled
          >
            新建文件
          </Button>
        </Space>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-auto p-2">
        {fileTree.length === 0 ? (
          <Empty
            description="暂无文件"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          fileTree.map((node) => (
            <FileTreeNode
              key={node.id}
              node={node}
              level={0}
              isExpanded={expandedKeys.includes(node.id)}
              isSelected={selectedFile?.id === node.id}
              onSelect={selectFile}
              onToggle={(n) => toggleExpand(n.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};
```

### 5. 创建 Hook
创建 `src/features/file-explorer/hooks/useFileExplorer.ts`：
```typescript
import { useCallback } from 'react';
import { message } from 'antd';
import { useFileExplorerStore } from '../store/file-explorer.store';
import { fileApi } from '@/services/api/file.api';

export const useFileExplorer = (projectId: string) => {
  const { refreshTree } = useFileExplorerStore();

  const createFile = useCallback(
    async (path: string, content = '') => {
      try {
        await fileApi.createFile(projectId, path, content);
        message.success('文件创建成功');
        await refreshTree(projectId);
      } catch (error: any) {
        message.error(error.message || '文件创建失败');
      }
    },
    [projectId, refreshTree]
  );

  const createDirectory = useCallback(
    async (path: string) => {
      try {
        await fileApi.createDirectory(projectId, path);
        message.success('目录创建成功');
        await refreshTree(projectId);
      } catch (error: any) {
        message.error(error.message || '目录创建失败');
      }
    },
    [projectId, refreshTree]
  );

  const deleteFile = useCallback(
    async (path: string) => {
      try {
        await fileApi.deleteFile(projectId, path);
        message.success('删除成功');
        await refreshTree(projectId);
      } catch (error: any) {
        message.error(error.message || '删除失败');
      }
    },
    [projectId, refreshTree]
  );

  const renameFile = useCallback(
    async (oldPath: string, newPath: string) => {
      try {
        await fileApi.renameFile(projectId, oldPath, newPath);
        message.success('重命名成功');
        await refreshTree(projectId);
      } catch (error: any) {
        message.error(error.message || '重命名失败');
      }
    },
    [projectId, refreshTree]
  );

  return {
    createFile,
    createDirectory,
    deleteFile,
    renameFile,
  };
};
```

### 6. 更新 Sidebar 使用文件浏览器
更新 `src/components/layout/Sidebar/Sidebar.tsx`：
```typescript
import React from 'react';
import { useParams } from 'react-router-dom';
import { FileExplorer } from '@/features/file-explorer/components/FileExplorer';

export const Sidebar: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();

  if (!projectId) {
    return (
      <div className="p-4 text-gray-500">
        <p>请选择一个项目</p>
      </div>
    );
  }

  return <FileExplorer projectId={projectId} />;
};
```

### 7. 创建导出文件
创建 `src/features/file-explorer/index.ts`：
```typescript
export { FileExplorer } from './components/FileExplorer';
export { FileTreeNode } from './components/FileTreeNode';
export { useFileExplorerStore } from './store/file-explorer.store';
export { useFileExplorer } from './hooks/useFileExplorer';
```

## 期望输出
- ✅ `src/services/api/file.api.ts` 文件 API
- ✅ `src/features/file-explorer/store/file-explorer.store.ts` Zustand store
- ✅ `src/features/file-explorer/components/FileTreeNode.tsx` 文件树节点
- ✅ `src/features/file-explorer/components/FileExplorer.tsx` 文件浏览器主组件
- ✅ `src/features/file-explorer/hooks/useFileExplorer.ts` 文件操作 Hook
- ✅ `src/components/layout/Sidebar/Sidebar.tsx` 更新使用文件浏览器
- ✅ 文件树可以展开/折叠
- ✅ 文件选择高亮显示
- ✅ 文件树刷新功能

## 验证标准
```bash
npm run dev
# 访问项目页面 /project/xxx
# 应该看到：
# - 左侧显示文件树
# - 可以展开/折叠目录
# - 点击文件高亮显示
# - 刷新按钮可用
```

## Claude 执行 Prompt

请实现完整的文件浏览器模块，具体要求如下：

1. **创建文件 API**（src/services/api/file.api.ts）：
   - getFileTree: 获取文件树
   - getFileContent: 获取文件内容
   - createFile: 创建文件
   - createDirectory: 创建目录
   - deleteFile: 删除文件/目录
   - renameFile: 重命名

2. **创建 Zustand Store**（src/features/file-explorer/store/file-explorer.store.ts）：
   - 状态：fileTree, selectedFile, expandedKeys, loading, error
   - Actions：loadFileTree, selectFile, toggleExpand, refreshTree

3. **创建文件树节点组件**（src/features/file-explorer/components/FileTreeNode.tsx）：
   - 递归渲染文件树
   - 显示文件/目录图标
   - 支持展开/折叠
   - 选中状态高亮
   - 缩进显示层级

4. **创建文件浏览器组件**（src/features/file-explorer/components/FileExplorer.tsx）：
   - Header 工具栏（刷新、新建文件/目录按钮）
   - 文件树渲染区域
   - 加载状态显示
   - 错误处理和重试

5. **创建 Hook**（src/features/file-explorer/hooks/useFileExplorer.ts）：
   - createFile: 创建文件并刷新
   - createDirectory: 创建目录并刷新
   - deleteFile: 删除文件并刷新
   - renameFile: 重命名并刷新

6. **更新 Sidebar**（src/components/layout/Sidebar/Sidebar.tsx）：
   - 从 URL 获取 projectId
   - 渲染 FileExplorer 组件
   - 无 projectId 时显示提示

7. **创建导出文件**（src/features/file-explorer/index.ts）

8. **验证**：
   - 文件树正确加载和显示
   - 展开/折叠功能正常
   - 文件选择高亮
   - 刷新功能工作

确保文件浏览器功能完整、交互流畅、错误处理完善。
