import React, { useState } from 'react';
import { Modal, Form, Input, Radio } from 'antd';
import type { FileNode } from '@/types/file.types';

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
          <Form.Item name="type" label="类型" initialValue="file" rules={[{ required: true }]}>
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
            <p className="text-red-500">警告：删除目录将同时删除其中的所有内容！</p>
          )}
        </div>
      )}
    </Modal>
  );
};
