import React, { useEffect, useState } from 'react';
import { Card, Typography, Space, Button, message, Spin, Tag } from 'antd';
import { SaveOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';
import { CodeEditor } from '@/components/business/CodeEditor/CodeEditor';
import { useFileExplorerStore } from '../store/file-explorer.store';
import { fileApi } from '@/services/api/file.api';
import { formatFileSize, formatDateTime } from '@/utils/format';

const { Title, Text } = Typography;

interface FileEditorProps {
  projectId: string;
}

export const FileEditor: React.FC<FileEditorProps> = ({ projectId }) => {
  const { selectedFile } = useFileExplorerStore();
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // 加载文件内容
  useEffect(() => {
    console.log('[FileEditor] useEffect triggered:', { selectedFile, projectId });

    if (!selectedFile || selectedFile.type !== 'file') {
      console.log('[FileEditor] No file selected or not a file type');
      setContent('');
      setOriginalContent('');
      setIsDirty(false);
      return;
    }

    const loadContent = async () => {
      console.log('[FileEditor] Loading file content:', selectedFile.path);
      setLoading(true);
      try {
        const fileContent = await fileApi.getFileContent(projectId, selectedFile.path);
        console.log('[FileEditor] File content loaded:', fileContent);
        setContent(fileContent.content);
        setOriginalContent(fileContent.content);
        setIsDirty(false);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '加载文件失败';
        console.error('[FileEditor] Error loading file:', error);
        message.error(errorMessage);
        setContent('');
        setOriginalContent('');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [selectedFile, projectId]);

  // 监听内容变化
  const handleContentChange = (value: string | undefined) => {
    const newContent = value || '';
    setContent(newContent);
    setIsDirty(newContent !== originalContent);
  };

  // 保存文件
  const handleSave = async () => {
    if (!selectedFile) return;

    setSaving(true);
    try {
      await fileApi.updateFileContent(projectId, selectedFile.path, content);
      setOriginalContent(content);
      setIsDirty(false);
      message.success('保存成功');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '保存失败';
      message.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // 重新加载
  const handleReload = () => {
    setContent(originalContent);
    setIsDirty(false);
  };

  // 关闭文件
  const handleClose = () => {
    if (isDirty) {
      const confirmed = window.confirm('文件有未保存的更改，确定要关闭吗？');
      if (!confirmed) return;
    }
    useFileExplorerStore.getState().selectFile(null);
  };

  if (!selectedFile) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="text-lg">请从左侧选择一个文件</p>
        </div>
      </div>
    );
  }

  if (selectedFile.type !== 'file') {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="text-lg">无法编辑目录</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spin size="large" tip="加载文件中..." />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <Card size="small" className="mb-2">
        <div className="flex items-center justify-between">
          <Space direction="vertical" size={0}>
            <div className="flex items-center gap-2">
              <Title level={5} className="m-0">
                {selectedFile.name}
              </Title>
              {isDirty && (
                <Tag color="orange" className="m-0">
                  未保存
                </Tag>
              )}
            </div>
            <Space size="small" className="text-xs text-gray-500">
              <Text type="secondary">{selectedFile.path}</Text>
              {selectedFile.size !== undefined && (
                <Text type="secondary">{formatFileSize(selectedFile.size)}</Text>
              )}
              {selectedFile.lastModified && (
                <Text type="secondary">{formatDateTime(selectedFile.lastModified)}</Text>
              )}
            </Space>
          </Space>

          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleReload}
              disabled={!isDirty || saving}
              size="small"
            >
              撤销更改
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
              disabled={!isDirty}
              size="small"
            >
              保存
            </Button>
            <Button icon={<CloseOutlined />} onClick={handleClose} size="small">
              关闭
            </Button>
          </Space>
        </div>
      </Card>

      {/* Editor */}
      <div className="flex-1 border border-gray-200 rounded overflow-hidden">
        <CodeEditor
          value={content}
          path={selectedFile.path}
          onChange={handleContentChange}
          onSave={handleSave}
          theme="vs-dark"
        />
      </div>
    </div>
  );
};
