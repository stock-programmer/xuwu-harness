import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Space, Typography, message, Tooltip, Dropdown } from 'antd';
import { SendOutlined, ClearOutlined, HistoryOutlined, DownloadOutlined } from '@ant-design/icons';
import type { WorkMode } from '@/types/mode.types';
import { useInputHistoryStore } from '../store/input-history.store';

const { TextArea } = Input;
const { Text } = Typography;

interface PromptInputProps {
  mode: WorkMode;
  onSubmit: (prompt: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

const MODE_PLACEHOLDERS: Record<WorkMode, string> = {
  prd: '请描述项目需求...\n\n例如：我想做一个在线协作文档系统，支持多人实时编辑、版本控制...',
  architecture: '请输入架构设计要求...\n\n例如：基于 PRD 生成前后端架构设计文档',
  'dev-plan': '请输入开发计划要求...\n\n例如：生成前端开发任务 DAG',
  'task-gen': '请输入任务生成要求...\n\n例如：为每个 DAG 节点生成详细任务文件',
  'task-exec': '请输入任务执行指令...\n\n例如：执行 Layer 1 的所有任务',
  'loop-test': '请输入测试要求...\n\n例如：运行所有单元测试并修复失败的测试',
  deploy: '请输入部署要求...\n\n例如：构建生产版本并部署到服务器',
};

export const PromptInput: React.FC<PromptInputProps> = ({
  mode,
  onSubmit,
  loading = false,
  disabled = false,
}) => {
  const [prompt, setPrompt] = useState('');
  const textAreaRef = useRef<any>(null);

  const { addHistory, getHistory, clearHistory, navigatePrevious, navigateNext, resetNavigation } =
    useInputHistoryStore();

  const history = getHistory(mode);

  // 重置导航索引当 prompt 手动更改时
  useEffect(() => {
    resetNavigation();
  }, [prompt, resetNavigation]);

  const handleSubmit = () => {
    if (!prompt.trim()) {
      message.warning('请输入 Prompt');
      return;
    }

    // 添加到历史记录
    addHistory(mode, prompt);

    // 提交
    onSubmit(prompt);

    // 清空输入
    setPrompt('');
  };

  const handleClear = () => {
    setPrompt('');
    resetNavigation();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter 提交
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
      return;
    }

    // 上箭头：历史记录向前
    if (e.key === 'ArrowUp' && e.altKey) {
      e.preventDefault();
      const prevPrompt = navigatePrevious();
      if (prevPrompt !== null) {
        setPrompt(prevPrompt);
      }
      return;
    }

    // 下箭头：历史记录向后
    if (e.key === 'ArrowDown' && e.altKey) {
      e.preventDefault();
      const nextPrompt = navigateNext();
      setPrompt(nextPrompt || '');
      return;
    }

    // Ctrl/Cmd + D 导出到本地文件
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      handleExportToFile();
      return;
    }
  };

  const handleExportToFile = () => {
    if (!prompt.trim()) {
      message.warning('没有内容可导出');
      return;
    }

    const blob = new Blob([prompt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-${mode}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('Prompt 已导出到文件');
  };

  const handleHistorySelect = (historyPrompt: string) => {
    setPrompt(historyPrompt);
    textAreaRef.current?.focus();
  };

  const historyMenuItems = history
    .slice()
    .reverse()
    .slice(0, 10)
    .map((entry) => ({
      key: entry.id,
      label: (
        <div className="max-w-xs">
          <div className="text-xs text-gray-500 mb-1">
            {new Date(entry.timestamp).toLocaleString()}
          </div>
          <div className="text-sm truncate">{entry.prompt}</div>
        </div>
      ),
      onClick: () => handleHistorySelect(entry.prompt),
    }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Text strong>Prompt 输入</Text>
        <Space size="small">
          <Text type="secondary" className="text-xs">
            Ctrl/Cmd + Enter 提交
          </Text>
          <Text type="secondary" className="text-xs">
            Alt + ↑↓ 历史
          </Text>
          <Text type="secondary" className="text-xs">
            Ctrl/Cmd + D 导出
          </Text>
        </Space>
      </div>

      <TextArea
        ref={textAreaRef}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={MODE_PLACEHOLDERS[mode]}
        disabled={disabled || loading}
        autoSize={{ minRows: 6, maxRows: 12 }}
        className="font-mono"
      />

      <Space className="w-full justify-between">
        <Space size="small">
          <Dropdown
            menu={{ items: historyMenuItems }}
            disabled={history.length === 0}
            placement="topLeft"
          >
            <Button icon={<HistoryOutlined />} size="small" disabled={history.length === 0}>
              历史 ({history.length})
            </Button>
          </Dropdown>

          <Tooltip title="清空历史记录">
            <Button
              size="small"
              danger
              onClick={() => {
                clearHistory();
                message.success('历史记录已清空');
              }}
              disabled={history.length === 0}
            >
              清空历史
            </Button>
          </Tooltip>
        </Space>

        <Space size="small">
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExportToFile}
            disabled={disabled || loading || !prompt.trim()}
            size="small"
          >
            导出
          </Button>

          <Button
            icon={<ClearOutlined />}
            onClick={handleClear}
            disabled={disabled || loading || !prompt}
            size="small"
          >
            清空
          </Button>

          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSubmit}
            loading={loading}
            disabled={disabled || !prompt.trim()}
            size="small"
          >
            提交
          </Button>
        </Space>
      </Space>
    </div>
  );
};
