import React, { useEffect, useState } from 'react';
import { Spin, Empty, Typography, Space, Button } from 'antd';
import { ReloadOutlined, FolderAddOutlined, FileAddOutlined } from '@ant-design/icons';
import { useFileExplorerStore } from '../store/file-explorer.store';
import { FileTreeNode } from './FileTreeNode';
import { FileOperationModal } from './FileOperationModal';
import { useFileExplorer } from '../hooks/useFileExplorer';
import type { FileNode } from '@/types/file.types';

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

  const [modalOpen, setModalOpen] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<'create' | 'rename' | 'delete' | null>(
    null
  );
  const [currentNode, setCurrentNode] = useState<FileNode | null>(null);

  const { createFile, createDirectory, deleteFile, renameFile } = useFileExplorer(projectId);

  useEffect(() => {
    if (projectId) {
      loadFileTree(projectId);
    }
  }, [projectId, loadFileTree]);

  const handleOperation = (operation: string, node: FileNode) => {
    setCurrentNode(node);

    switch (operation) {
      case 'newFile':
      case 'newFolder':
        setCurrentOperation('create');
        setModalOpen(true);
        break;
      case 'rename':
        setCurrentOperation('rename');
        setModalOpen(true);
        break;
      case 'delete':
        setCurrentOperation('delete');
        setModalOpen(true);
        break;
      default:
        // message.info(`操作 ${operation} 暂未实现`);
        break;
    }
  };

  const handleModalOk = async (data: any) => {
    if (!currentNode) return;

    switch (currentOperation) {
      case 'create': {
        const newPath = `${currentNode.path}/${data.name}`;
        if (data.type === 'file') {
          await createFile(newPath);
        } else {
          await createDirectory(newPath);
        }
        break;
      }

      case 'rename': {
        const newName = data.newName;
        const parentPath = currentNode.path.substring(0, currentNode.path.lastIndexOf('/'));
        const newPath2 = parentPath ? `${parentPath}/${newName}` : newName;
        await renameFile(currentNode.path, newPath2);
        break;
      }

      case 'delete':
        await deleteFile(currentNode.path);
        break;
    }
  };

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
        <Empty description={error} image={Empty.PRESENTED_IMAGE_SIMPLE}>
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
          <Button type="text" icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading} />
        </div>

        <Space size="small">
          <Button type="text" size="small" icon={<FolderAddOutlined />} disabled>
            新建文件夹
          </Button>
          <Button type="text" size="small" icon={<FileAddOutlined />} disabled>
            新建文件
          </Button>
        </Space>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-auto p-2">
        {fileTree.length === 0 ? (
          <Empty description="暂无文件" image={Empty.PRESENTED_IMAGE_SIMPLE} />
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
              onOperation={handleOperation}
            />
          ))
        )}
      </div>

      <FileOperationModal
        open={modalOpen}
        operation={currentOperation}
        currentNode={currentNode || undefined}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
};
