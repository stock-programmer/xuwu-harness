# Task: 实现输入历史和快捷键

## 元数据
- **Task ID**: frontend-dev-plan-5.5
- **Layer**: 5
- **Dependencies**: [4.2]
- **Parallel Group**: [5.1, 5.2, 5.3, 5.4, 5.5]
- **Estimated Complexity**: Low

## 目标
实现 Prompt 输入的历史记录、快捷键支持、自动保存等增强功能，提升用户输入体验。

## 前置条件
- 输出控制台已实现（Task 4.2 完成）

## 实现步骤

### 1. 创建输入历史 Store
创建 `src/features/mode-control/store/input-history.store.ts`：
```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { WorkMode } from '@/types/mode.types';

interface HistoryEntry {
  id: string;
  mode: WorkMode;
  prompt: string;
  timestamp: string;
}

interface InputHistoryState {
  // 状态
  history: HistoryEntry[];
  currentIndex: number;
  maxHistory: number;

  // Actions
  addHistory: (mode: WorkMode, prompt: string) => void;
  getHistory: (mode?: WorkMode) => HistoryEntry[];
  clearHistory: () => void;
  navigatePrevious: () => string | null;
  navigateNext: () => string | null;
  resetNavigation: () => void;
}

export const useInputHistoryStore = create<InputHistoryState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        history: [],
        currentIndex: -1,
        maxHistory: 50,

        // 添加历史记录
        addHistory: (mode, prompt) => {
          if (!prompt.trim()) return;

          set((state) => {
            const newEntry: HistoryEntry = {
              id: `${Date.now()}_${Math.random().toString(36).substring(7)}`,
              mode,
              prompt,
              timestamp: new Date().toISOString(),
            };

            const newHistory = [...state.history, newEntry];

            // 限制历史记录数量
            if (newHistory.length > state.maxHistory) {
              newHistory.shift();
            }

            return {
              history: newHistory,
              currentIndex: -1, // 重置导航索引
            };
          });
        },

        // 获取历史记录（可按模式过滤）
        getHistory: (mode) => {
          const { history } = get();
          if (!mode) return history;
          return history.filter((entry) => entry.mode === mode);
        },

        // 清空历史记录
        clearHistory: () => {
          set({ history: [], currentIndex: -1 });
        },

        // 导航到上一条（按上箭头）
        navigatePrevious: () => {
          const { history, currentIndex } = get();
          if (history.length === 0) return null;

          const newIndex =
            currentIndex < history.length - 1 ? currentIndex + 1 : currentIndex;

          set({ currentIndex: newIndex });

          return history[history.length - 1 - newIndex]?.prompt || null;
        },

        // 导航到下一条（按下箭头）
        navigateNext: () => {
          const { history, currentIndex } = get();
          if (currentIndex <= 0) {
            set({ currentIndex: -1 });
            return '';
          }

          const newIndex = currentIndex - 1;
          set({ currentIndex: newIndex });

          return history[history.length - 1 - newIndex]?.prompt || '';
        },

        // 重置导航索引
        resetNavigation: () => {
          set({ currentIndex: -1 });
        },
      }),
      {
        name: 'input-history-storage',
        partialize: (state) => ({
          history: state.history,
        }),
      }
    ),
    { name: 'InputHistoryStore' }
  )
);
```

### 2. 更新 PromptInput 组件添加历史记录功能
更新 `src/features/mode-control/components/PromptInput.tsx`：
```typescript
import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Space, Typography, message, Tooltip, Dropdown } from 'antd';
import {
  SendOutlined,
  ClearOutlined,
  HistoryOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { WorkMode } from '@/types/mode.types';
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
  // ... 之前的定义
};

export const PromptInput: React.FC<PromptInputProps> = ({
  mode,
  onSubmit,
  loading = false,
  disabled = false,
}) => {
  const [prompt, setPrompt] = useState('');
  const textAreaRef = useRef<any>(null);

  const {
    addHistory,
    getHistory,
    clearHistory,
    navigatePrevious,
    navigateNext,
    resetNavigation,
  } = useInputHistoryStore();

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
      setPrompt(nextPrompt);
      return;
    }

    // Ctrl/Cmd + S 保存到本地
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSaveToFile();
      return;
    }
  };

  const handleSaveToFile = () => {
    if (!prompt.trim()) {
      message.warning('没有内容可保存');
      return;
    }

    const blob = new Blob([prompt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-${mode}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('Prompt 已保存到文件');
  };

  const handleHistorySelect = (historyPrompt: string) => {
    setPrompt(historyPrompt);
    textAreaRef.current?.focus();
  };

  const historyMenuItems = history
    .slice()
    .reverse()
    .slice(0, 10)
    .map((entry, index) => ({
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
            Ctrl/Cmd + S 保存
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
            <Button
              icon={<HistoryOutlined />}
              size="small"
              disabled={history.length === 0}
            >
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
            icon={<SaveOutlined />}
            onClick={handleSaveToFile}
            disabled={disabled || loading || !prompt.trim()}
            size="small"
          >
            保存
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
```

### 3. 创建快捷键配置组件
创建 `src/components/common/KeyboardShortcuts/KeyboardShortcuts.tsx`：
```typescript
import React, { useEffect } from 'react';
import { Modal, Table, Typography } from 'antd';

const { Title } = Typography;

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

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  open,
  onClose,
}) => {
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
    <Modal
      title="键盘快捷键"
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      <Table
        dataSource={SHORTCUTS}
        columns={columns}
        pagination={false}
        size="small"
        rowKey="key"
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
```

### 4. 在 App 中集成全局快捷键
更新 `src/App.tsx`：
```typescript
import React, { useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { router } from './routes';
import { queryClient } from './services/api/query-client';
import { KeyboardShortcuts, useGlobalShortcuts } from '@/components/common/KeyboardShortcuts/KeyboardShortcuts';

function App() {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useGlobalShortcuts(() => setShortcutsOpen(true));

  return (
    <ConfigProvider locale={zhCN}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <ReactQueryDevtools initialIsOpen={false} />
        <KeyboardShortcuts
          open={shortcutsOpen}
          onClose={() => setShortcutsOpen(false)}
        />
      </QueryClientProvider>
    </ConfigProvider>
  );
}

export default App;
```

### 5. 创建导出文件
更新 `src/features/mode-control/index.ts`：
```typescript
export { useInputHistoryStore } from './store/input-history.store';
// ...其他导出
```

更新 `src/components/common/index.ts`：
```typescript
export { KeyboardShortcuts, useGlobalShortcuts } from './KeyboardShortcuts/KeyboardShortcuts';
// ...其他导出
```

## 期望输出
- ✅ `src/features/mode-control/store/input-history.store.ts` 历史记录 Store
- ✅ PromptInput 组件更新支持历史记录
- ✅ `src/components/common/KeyboardShortcuts/KeyboardShortcuts.tsx` 快捷键帮助
- ✅ 全局快捷键支持
- ✅ Alt + ↑↓ 浏览历史
- ✅ Ctrl/Cmd + S 保存到文件
- ✅ ? 键显示快捷键帮助
- ✅ 历史记录持久化存储

## 验证标准
```bash
npm run dev
# 访问项目页面
# 应该看到：
# - 在 Prompt 输入框中，Alt + ↑↓ 可以浏览历史
# - Ctrl/Cmd + Enter 提交 Prompt
# - Ctrl/Cmd + S 保存 Prompt 到文件
# - 点击历史按钮查看历史记录列表
# - 按 ? 键显示快捷键帮助弹窗
# - 历史记录在刷新页面后仍然存在
```

## Claude 执行 Prompt

请实现输入历史和快捷键增强功能，具体要求如下：

1. **创建输入历史 Store**（src/features/mode-control/store/input-history.store.ts）：
   - 状态：history, currentIndex, maxHistory
   - Actions：addHistory, getHistory, clearHistory, navigatePrevious, navigateNext
   - 持久化存储历史记录
   - 限制最大历史数量（50 条）

2. **更新 PromptInput 组件**：
   - 集成 useInputHistoryStore
   - 快捷键支持：
     - Ctrl/Cmd + Enter: 提交
     - Alt + ↑: 上一条历史
     - Alt + ↓: 下一条历史
     - Ctrl/Cmd + S: 保存到文件
   - 历史记录下拉菜单（显示最近 10 条）
   - 清空历史按钮
   - 保存按钮

3. **创建快捷键帮助组件**（src/components/common/KeyboardShortcuts/KeyboardShortcuts.tsx）：
   - Modal 显示快捷键列表
   - Table 展示：快捷键、功能、上下文
   - useGlobalShortcuts Hook
   - ? 键全局触发

4. **集成到 App**：
   - 使用 useGlobalShortcuts
   - 渲染 KeyboardShortcuts Modal

5. **创建导出文件**

6. **验证**：
   - 所有快捷键正常工作
   - 历史记录正确保存和加载
   - 历史导航正常
   - 保存到文件功能正常

确保输入体验流畅、快捷键易用、历史记录可靠。
