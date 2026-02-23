import React, { useState } from 'react';
import { Modal, Form, Input, Select } from 'antd';
import type { CreateProjectInput } from '@/types/project.types';

interface CreateProjectModalProps {
  open: boolean;
  onOk: (config: CreateProjectInput) => Promise<void>;
  onCancel: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ open, onOk, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const config: CreateProjectInput = {
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
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Form validation failed:', error);
      }
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
