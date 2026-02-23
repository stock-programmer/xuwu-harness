import React from 'react';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import {
  FileAddOutlined,
  FolderAddOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  ScissorOutlined,
} from '@ant-design/icons';
import type { FileNode } from '@/types/file.types';

interface FileContextMenuProps {
  node: FileNode;
  children: React.ReactElement;
  onOperation: (operation: string, node: FileNode) => void;
}

export const FileContextMenu: React.FC<FileContextMenuProps> = ({
  node,
  children,
  onOperation,
}) => {
  const menuItems: MenuProps['items'] = [
    {
      key: 'newFile',
      icon: <FileAddOutlined />,
      label: '新建文件',
      disabled: node.type !== 'directory',
    },
    {
      key: 'newFolder',
      icon: <FolderAddOutlined />,
      label: '新建目录',
      disabled: node.type !== 'directory',
    },
    { type: 'divider' },
    {
      key: 'rename',
      icon: <EditOutlined />,
      label: '重命名',
    },
    {
      key: 'copy',
      icon: <CopyOutlined />,
      label: '复制',
    },
    {
      key: 'cut',
      icon: <ScissorOutlined />,
      label: '剪切',
    },
    { type: 'divider' },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除',
      danger: true,
    },
  ];

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    onOperation(key, node);
  };

  return (
    <Dropdown menu={{ items: menuItems, onClick: handleMenuClick }} trigger={['contextMenu']}>
      {children}
    </Dropdown>
  );
};
