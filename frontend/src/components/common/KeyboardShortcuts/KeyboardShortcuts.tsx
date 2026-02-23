import React, { useEffect } from 'react';
import { Modal, Table } from 'antd';

interface Shortcut {
  key: string;
  description: string;
  context: string;
}

const SHORTCUTS: Shortcut[] = [
  {
    key: 'Ctrl/Cmd + Enter',
    description: '提交 Prompt',
    context: 'Prompt 输入',
  },
  {
    key: 'Alt + ↑',
    description: '查看上一条历史记录',
    context: 'Prompt 输入',
  },
  {
    key: 'Alt + ↓',
    description: '查看下一条历史记录',
    context: 'Prompt 输入',
  },
  {
    key: 'Ctrl/Cmd + S',
    description: '保存 Prompt 到文件',
    context: 'Prompt 输入',
  },
  {
    key: 'Ctrl/Cmd + S',
    description: '保存文件',
    context: '代码编辑器',
  },
  {
    key: '?',
    description: '显示快捷键帮助',
    context: '全局',
  },
];

interface KeyboardShortcutsProps {
  open: boolean;
  onClose: () => void;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ open, onClose }) => {
  const columns = [
    {
      title: '快捷键',
      dataIndex: 'key',
      key: 'key',
      width: '30%',
      render: (text: string) => <code className="bg-gray-100 px-2 py-1 rounded">{text}</code>,
    },
    {
      title: '功能',
      dataIndex: 'description',
      key: 'description',
      width: '40%',
    },
    {
      title: '上下文',
      dataIndex: 'context',
      key: 'context',
      width: '30%',
    },
  ];

  return (
    <Modal title="键盘快捷键" open={open} onCancel={onClose} footer={null} width={700}>
      <Table
        dataSource={SHORTCUTS}
        columns={columns}
        pagination={false}
        size="small"
        rowKey={(record, index) => `${record.key}-${record.context}-${index}`}
      />
    </Modal>
  );
};

// 全局快捷键 Hook
export const useGlobalShortcuts = (onShowHelp: () => void) => {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // ? 键显示帮助
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        // 确保不在输入框中
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          onShowHelp();
        }
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [onShowHelp]);
};
