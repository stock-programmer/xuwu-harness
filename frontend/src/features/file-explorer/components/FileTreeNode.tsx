import React from 'react';
import { FileOutlined, FolderOutlined, FolderOpenOutlined } from '@ant-design/icons';
import type { FileNode } from '@/types/file.types';
import { useFileExplorerStore } from '../store/file-explorer.store';
import { FileContextMenu } from './FileContextMenu';

interface FileTreeNodeProps {
  node: FileNode;
  level: number;
  isExpanded: boolean;
  isSelected: boolean;
  onSelect: (node: FileNode) => void;
  onToggle: (node: FileNode) => void;
  onOperation: (operation: string, node: FileNode) => void;
}

export const FileTreeNode: React.FC<FileTreeNodeProps> = ({
  node,
  level,
  isExpanded,
  isSelected,
  onSelect,
  onToggle,
  onOperation,
}) => {
  const handleClick = () => {
    console.log('[FileTreeNode] handleClick:', { node, type: node.type });
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
    <FileContextMenu node={node} onOperation={onOperation}>
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
                onOperation={onOperation}
              />
            ))}
          </div>
        )}
      </div>
    </FileContextMenu>
  );
};

// 连接到 store 的组件
const FileTreeNodeConnected: React.FC<{
  node: FileNode;
  level: number;
  onOperation: (operation: string, node: FileNode) => void;
}> = ({ node, level, onOperation }) => {
  const { selectedFile, expandedKeys, selectFile, toggleExpand } = useFileExplorerStore();

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
      onOperation={onOperation}
    />
  );
};

export default FileTreeNodeConnected;
