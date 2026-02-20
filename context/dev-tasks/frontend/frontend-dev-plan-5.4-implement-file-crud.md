# Task: 实现文件操作功能

## 元数据
- **Task ID**: frontend-dev-plan-5.4
- **Layer**: 5
- **Dependencies**: [4.1, 3.1]
- **Parallel Group**: [5.1, 5.2, 5.3, 5.4, 5.5]
- **Estimated Complexity**: Medium

## 目标
实现完整的文件 CRUD（创建、读取、更新、删除）操作，包括文件/目录创建、重命名、删除等功能。

## 前置条件
- 文件浏览器已实现（Task 4.1 完成）
- Axios 客户端已封装（Task 3.1 完成）

## 实现步骤

### 1. 完善文件 API
更新 `src/services/api/file.api.ts`，添加更新文件内容的方法：
```typescript
export const fileApi = {
  // ...之前的方法

  // 更新文件内容
  updateFileContent: (
    projectId: string,
    path: string,
    content: string
  ): Promise<void> =>
    httpClient.put(`/api/projects/${projectId}/files/content`, {
      path,
      content,
    }),

  // 移动文件/目录
  moveFile: (
    projectId: string,
    oldPath: string,
    newPath: string
  ): Promise<FileNode> =>
    httpClient.put(`/api/projects/${projectId}/files/move`, {
      oldPath,
      newPath,
    }),

  // 复制文件/目录
  copyFile: (
    projectId: string,
    sourcePath: string,
    targetPath: string
  ): Promise<FileNode> =>
    httpClient.post(`/api/projects/${projectId}/files/copy`, {
      sourcePath,
      targetPath,
    }),
};
```

### 2. 创建文件操作对话框组件
创建 `src/features/file-explorer/components/FileOperationModal.tsx`：
```typescript
import React, { useState } from 'react';
import { Modal, Form, Input, Radio, message } from 'antd';
import { FileNode } from '@/types/file.types';

interface FileOperationModalProps {
  open: boolean;
  operation: 'create' | 'rename' | 'delete' | null;
  currentNode?: FileNode;
  onOk: (data: any) => Promise<void>;
  onCancel: () => void;
}

export const FileOperationModal: React.FC<FileOperationModalProps> = ({
  open,
  operation,
  currentNode,
  onOk,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await onOk(values);
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

  const getTitle = () => {
    switch (operation) {
      case 'create':
        return '新建文件/目录';
      case 'rename':
        return '重命名';
      case 'delete':
        return '确认删除';
      default:
        return '';
    }
  };

  return (
    <Modal
      title={getTitle()}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okButtonProps={{
        danger: operation === 'delete',
      }}
    >
      {operation === 'create' && (
        <Form form={form} layout="vertical">
          <Form.Item
            name="type"
            label="类型"
            initialValue="file"
            rules={[{ required: true }]}
          >
            <Radio.Group>
              <Radio value="file">文件</Radio>
              <Radio value="directory">目录</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="name"
            label="名称"
            rules={[
              { required: true, message: '请输入名称' },
              {
                pattern: /^[^/\\:*?"<>|]+$/,
                message: '名称不能包含特殊字符',
              },
            ]}
          >
            <Input placeholder="例如: index.ts" autoFocus />
          </Form.Item>

          {currentNode && (
            <Form.Item label="位置">
              <Input value={currentNode.path} disabled />
            </Form.Item>
          )}
        </Form>
      )}

      {operation === 'rename' && (
        <Form form={form} layout="vertical">
          <Form.Item
            name="newName"
            label="新名称"
            initialValue={currentNode?.name}
            rules={[
              { required: true, message: '请输入新名称' },
              {
                pattern: /^[^/\\:*?"<>|]+$/,
                message: '名称不能包含特殊字符',
              },
            ]}
          >
            <Input placeholder="新名称" autoFocus />
          </Form.Item>
        </Form>
      )}

      {operation === 'delete' && (
        <div>
          <p>
            确定要删除 <strong>{currentNode?.name}</strong> 吗？
          </p>
          {currentNode?.type === 'directory' && (
            <p className="text-red-500">
              警告：删除目录将同时删除其中的所有内容！
            </p>
          )}
        </div>
      )}
    </Modal>
  );
};
```

### 3. 创建文件上下文菜单
创建 `src/features/file-explorer/components/FileContextMenu.tsx`：
```typescript
import React from 'react';
import { Dropdown, Menu } from 'antd';
import {
  FileAddOutlined,
  FolderAddOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  ScissorOutlined,
} from '@ant-design/icons';
import { FileNode } from '@/types/file.types';

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
  const menuItems = [
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

  const handleMenuClick = ({ key }: { key: string }) => {
    onOperation(key, node);
  };

  return (
    <Dropdown
      menu={{ items: menuItems, onClick: handleMenuClick }}
      trigger={['contextMenu']}
    >
      {children}
    </Dropdown>
  );
};
```

### 4. 更新 FileTreeNode 添加上下文菜单
更新 `src/features/file-explorer/components/FileTreeNode.tsx`：
```typescript
import { FileContextMenu } from './FileContextMenu';

// 在 FileTreeNode 组件中包裹 FileContextMenu
return (
  <FileContextMenu node={node} onOperation={onOperation}>
    <div>
      <div
        className={/* ... */}
        onClick={handleClick}
      >
        {/* ... 现有内容 */}
      </div>
      {/* ... children */}
    </div>
  </FileContextMenu>
);
```

### 5. 更新 FileExplorer 集成文件操作
更新 `src/features/file-explorer/components/FileExplorer.tsx`：
```typescript
import { FileOperationModal } from './FileOperationModal';
import { useFileExplorer } from '../hooks/useFileExplorer';

export const FileExplorer: React.FC<FileExplorerProps> = ({ projectId }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<'create' | 'rename' | 'delete' | null>(null);
  const [currentNode, setCurrentNode] = useState<FileNode | null>(null);

  const {
    createFile,
    createDirectory,
    deleteFile,
    renameFile,
  } = useFileExplorer(projectId);

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
        message.info(`操作 ${operation} 暂未实现`);
    }
  };

  const handleModalOk = async (data: any) => {
    if (!currentNode) return;

    try {
      switch (currentOperation) {
        case 'create':
          const newPath = `${currentNode.path}/${data.name}`;
          if (data.type === 'file') {
            await createFile(newPath);
          } else {
            await createDirectory(newPath);
          }
          break;

        case 'rename':
          const newName = data.newName;
          const parentPath = currentNode.path.substring(
            0,
            currentNode.path.lastIndexOf('/')
          );
          const newPath2 = `${parentPath}/${newName}`;
          await renameFile(currentNode.path, newPath2);
          break;

        case 'delete':
          await deleteFile(currentNode.path);
          break;
      }
    } catch (error) {
      // 错误已在 hook 中处理
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* ... 现有内容 */}

      <FileOperationModal
        open={modalOpen}
        operation={currentOperation}
        currentNode={currentNode}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
};
```

### 6. 更新 FileEditor 支持保存
更新 `src/features/file-explorer/components/FileEditor.tsx`，实际调用 API：
```typescript
import { fileApi } from '@/services/api/file.api';

const handleSave = async () => {
  if (!selectedFile) return;

  setSaving(true);
  try {
    await fileApi.updateFileContent(projectId, selectedFile.path, content);

    setOriginalContent(content);
    setIsDirty(false);
    message.success('保存成功');
  } catch (error: any) {
    message.error(error.message || '保存失败');
  } finally {
    setSaving(false);
  }
};
```

### 7. 创建导出文件
更新 `src/features/file-explorer/index.ts`：
```typescript
export { FileOperationModal } from './components/FileOperationModal';
export { FileContextMenu } from './components/FileContextMenu';
// ...其他导出
```

## 期望输出
- ✅ `src/services/api/file.api.ts` 完善文件 API
- ✅ `src/features/file-explorer/components/FileOperationModal.tsx` 操作对话框
- ✅ `src/features/file-explorer/components/FileContextMenu.tsx` 上下文菜单
- ✅ 文件/目录创建功能
- ✅ 文件/目录重命名功能
- ✅ 文件/目录删除功能
- ✅ 文件内容保存功能
- ✅ 右键上下文菜单

## 验证标准
```bash
npm run dev
# 访问项目页面 /project/xxx
# 应该看到：
# - 右键文件/目录显示上下文菜单
# - 可以新建文件和目录
# - 可以重命名文件和目录
# - 可以删除文件和目录
# - 编辑文件后可以保存
# - 所有操作后文件树自动刷新
```

## Claude 执行 Prompt

请实现完整的文件 CRUD 操作功能，具体要求如下：

1. **完善文件 API**（src/services/api/file.api.ts）：
   - updateFileContent: 更新文件内容
   - moveFile: 移动文件/目录
   - copyFile: 复制文件/目录

2. **创建文件操作对话框**（src/features/file-explorer/components/FileOperationModal.tsx）：
   - 支持 3 种操作：create, rename, delete
   - 创建模式：
     - 类型选择（文件/目录）
     - 名称输入（验证特殊字符）
     - 位置显示
   - 重命名模式：
     - 新名称输入
     - 初始值为当前名称
   - 删除模式：
     - 确认提示
     - 目录删除警告

3. **创建上下文菜单**（src/features/file-explorer/components/FileContextMenu.tsx）：
   - 使用 Ant Design Dropdown
   - 菜单项：
     - 新建文件（仅目录）
     - 新建目录（仅目录）
     - 重命名
     - 复制
     - 剪切
     - 删除（危险操作）
   - 右键触发

4. **更新 FileTreeNode**：
   - 包裹 FileContextMenu
   - 传递 onOperation 回调

5. **更新 FileExplorer**：
   - 集成 FileOperationModal
   - 实现操作处理逻辑
   - 调用 useFileExplorer Hook
   - 操作成功后刷新文件树

6. **更新 FileEditor**：
   - 保存时调用 fileApi.updateFileContent
   - 实际保存文件内容到服务器

7. **创建导出文件**

8. **验证**：
   - 所有 CRUD 操作正常
   - 上下文菜单正常显示
   - 表单验证正确
   - 操作后自动刷新

确保文件操作功能完整、交互流畅、错误处理完善。
