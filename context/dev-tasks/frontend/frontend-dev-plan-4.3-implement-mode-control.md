# Task: 实现模式控制模块

## 元数据
- **Task ID**: frontend-dev-plan-4.3
- **Layer**: 4
- **Dependencies**: [3.3, 3.4]
- **Parallel Group**: [4.1, 4.2, 4.3, 4.4]
- **Estimated Complexity**: Medium

## 目标
实现工作模式切换和 Prompt 提交功能，包括 7 种工作模式的选择、Prompt 输入、提交等核心功能。

## 前置条件
- MainLayout 已实现（Task 3.3 完成）
- TypeScript 类型已定义（Task 3.4 完成）

## 实现步骤

### 1. 创建模式选择器组件
创建 `src/features/mode-control/components/ModeSelector.tsx`：
```typescript
import React from 'react';
import { Radio, Space, Typography, Tooltip } from 'antd';
import {
  FileTextOutlined,
  PartitionOutlined,
  OrderedListOutlined,
  ThunderboltOutlined,
  PlayCircleOutlined,
  SyncOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { WorkMode } from '@/types/mode.types';
import { WORK_MODES } from '@/constants/modes';

const { Text } = Typography;

interface ModeSelectorProps {
  value: WorkMode;
  onChange: (mode: WorkMode) => void;
  disabled?: boolean;
}

const MODE_ICONS: Record<WorkMode, React.ReactNode> = {
  prd: <FileTextOutlined />,
  architecture: <PartitionOutlined />,
  'dev-plan': <OrderedListOutlined />,
  'task-gen': <ThunderboltOutlined />,
  'task-exec': <PlayCircleOutlined />,
  'loop-test': <SyncOutlined />,
  deploy: <RocketOutlined />,
};

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Text strong>工作模式</Text>
        <Text type="secondary" className="text-xs">
          选择 Claude 的工作模式
        </Text>
      </div>

      <Radio.Group
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full"
      >
        <Space direction="vertical" className="w-full">
          {Object.entries(WORK_MODES).map(([mode, config]) => (
            <Tooltip
              key={mode}
              title={config.description}
              placement="right"
            >
              <Radio value={mode} className="w-full">
                <Space>
                  <span className="text-lg">{MODE_ICONS[mode as WorkMode]}</span>
                  <span>{config.description}</span>
                </Space>
              </Radio>
            </Tooltip>
          ))}
        </Space>
      </Radio.Group>
    </div>
  );
};
```

### 2. 创建 Prompt 输入组件
创建 `src/features/mode-control/components/PromptInput.tsx`：
```typescript
import React, { useState } from 'react';
import { Input, Button, Space, Typography, message } from 'antd';
import { SendOutlined, ClearOutlined } from '@ant-design/icons';
import { WorkMode } from '@/types/mode.types';

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

  const handleSubmit = () => {
    if (!prompt.trim()) {
      message.warning('请输入 Prompt');
      return;
    }

    onSubmit(prompt);
  };

  const handleClear = () => {
    setPrompt('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter 提交
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Text strong>Prompt 输入</Text>
        <Text type="secondary" className="text-xs">
          Ctrl/Cmd + Enter 提交
        </Text>
      </div>

      <TextArea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={MODE_PLACEHOLDERS[mode]}
        disabled={disabled || loading}
        autoSize={{ minRows: 6, maxRows: 12 }}
        className="font-mono"
      />

      <Space className="w-full justify-end">
        <Button
          icon={<ClearOutlined />}
          onClick={handleClear}
          disabled={disabled || loading || !prompt}
        >
          清空
        </Button>
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSubmit}
          loading={loading}
          disabled={disabled || !prompt.trim()}
        >
          提交
        </Button>
      </Space>
    </div>
  );
};
```

### 3. 创建模式控制主组件
创建 `src/features/mode-control/components/ModeControl.tsx`：
```typescript
import React from 'react';
import { Card, Divider, Alert, Space, Tag } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { ModeSelector } from './ModeSelector';
import { PromptInput } from './PromptInput';
import { useModeStore } from '@/store/mode.store';
import { useWebSocket } from '@/hooks/useWebSocket';

interface ModeControlProps {
  projectId?: string;
}

export const ModeControl: React.FC<ModeControlProps> = ({ projectId }) => {
  const { currentMode, setMode, history } = useModeStore();
  const { connected, emit } = useWebSocket(projectId);
  const [submitting, setSubmitting] = React.useState(false);

  const handleModeChange = (mode: typeof currentMode) => {
    setMode(mode);
  };

  const handlePromptSubmit = async (prompt: string) => {
    setSubmitting(true);
    try {
      // 通过 WebSocket 发送 Prompt
      emit('prompt:submit', {
        mode: currentMode,
        prompt,
        projectId,
      });

      // 记录到历史
      // 这里可以添加历史记录逻辑
    } catch (error: any) {
      console.error('Prompt 提交失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // 显示最近完成的模式
  const completedModes = history
    .filter((h) => h.result === 'success')
    .slice(-3);

  return (
    <Card
      className="h-full"
      bodyStyle={{ height: '100%', overflow: 'auto' }}
    >
      {/* WebSocket 连接状态 */}
      {!connected && (
        <Alert
          message="WebSocket 未连接"
          description="请检查网络连接或刷新页面"
          type="warning"
          showIcon
          closable
          className="mb-4"
        />
      )}

      {/* 已完成的模式 */}
      {completedModes.length > 0 && (
        <div className="mb-4">
          <Space size="small" wrap>
            <span className="text-xs text-gray-500">已完成:</span>
            {completedModes.map((h, i) => (
              <Tag
                key={i}
                icon={<CheckCircleOutlined />}
                color="success"
              >
                {h.mode}
              </Tag>
            ))}
          </Space>
        </div>
      )}

      {/* 模式选择器 */}
      <ModeSelector
        value={currentMode}
        onChange={handleModeChange}
        disabled={submitting}
      />

      <Divider />

      {/* Prompt 输入 */}
      <PromptInput
        mode={currentMode}
        onSubmit={handlePromptSubmit}
        loading={submitting}
        disabled={!connected}
      />
    </Card>
  );
};
```

### 4. 创建模式 Store
创建 `src/store/mode.store.ts`：
```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { WorkMode, ModeStatus } from '@/types/mode.types';

interface ModeState extends ModeStatus {
  // Actions
  setMode: (mode: WorkMode) => void;
  addHistory: (
    mode: WorkMode,
    result: 'success' | 'failed' | 'skipped'
  ) => void;
  clearHistory: () => void;
  getNextMode: () => WorkMode | null;
}

const MODE_ORDER: WorkMode[] = [
  'prd',
  'architecture',
  'dev-plan',
  'task-gen',
  'task-exec',
  'loop-test',
  'deploy',
];

export const useModeStore = create<ModeState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        currentMode: 'prd',
        availableModes: MODE_ORDER,
        history: [],

        // 设置模式
        setMode: (mode) => {
          set({ currentMode: mode });
        },

        // 添加历史记录
        addHistory: (mode, result) => {
          set((state) => ({
            history: [
              ...state.history,
              {
                mode,
                timestamp: new Date().toISOString(),
                result,
              },
            ],
          }));
        },

        // 清空历史
        clearHistory: () => {
          set({ history: [] });
        },

        // 获取下一个模式
        getNextMode: () => {
          const { currentMode } = get();
          const currentIndex = MODE_ORDER.indexOf(currentMode);
          if (currentIndex < MODE_ORDER.length - 1) {
            return MODE_ORDER[currentIndex + 1];
          }
          return null;
        },
      }),
      {
        name: 'mode-storage',
        partialize: (state) => ({
          currentMode: state.currentMode,
          history: state.history,
        }),
      }
    ),
    { name: 'ModeStore' }
  )
);
```

### 5. 在 MainLayout 中集成
更新 `src/components/layout/MainLayout/MainLayout.tsx`，在底部面板渲染模式控制：
```typescript
// ... 在 bottomPane 部分
<div className={styles.bottomPane}>
  <ModeControl projectId={projectId} />
</div>
```

### 6. 创建导出文件
创建 `src/features/mode-control/index.ts`：
```typescript
export { ModeControl } from './components/ModeControl';
export { ModeSelector } from './components/ModeSelector';
export { PromptInput } from './components/PromptInput';
```

## 期望输出
- ✅ `src/features/mode-control/components/ModeSelector.tsx` 模式选择器
- ✅ `src/features/mode-control/components/PromptInput.tsx` Prompt 输入组件
- ✅ `src/features/mode-control/components/ModeControl.tsx` 模式控制主组件
- ✅ `src/store/mode.store.ts` 模式状态管理
- ✅ 7 种工作模式选择
- ✅ Prompt 输入和提交
- ✅ WebSocket 集成
- ✅ 历史记录显示

## 验证标准
```bash
npm run dev
# 访问项目页面 /project/xxx
# 应该看到：
# - 底部面板显示模式控制
# - 可以切换 7 种工作模式
# - 每种模式有不同的 Prompt 占位符
# - Ctrl/Cmd + Enter 可以提交
# - 显示 WebSocket 连接状态
# - 显示已完成的模式标签
```

## Claude 执行 Prompt

请实现完整的模式控制模块，具体要求如下：

1. **创建模式选择器**（src/features/mode-control/components/ModeSelector.tsx）：
   - 7 种工作模式：PRD、Architecture、Dev Plan、Task Gen、Task Exec、Loop Test、Deploy
   - 每种模式有图标和描述
   - 使用 Radio.Group 单选
   - Tooltip 显示详细说明

2. **创建 Prompt 输入组件**（src/features/mode-control/components/PromptInput.tsx）：
   - TextArea 多行输入
   - 每种模式有不同的 placeholder 示例
   - 清空和提交按钮
   - Ctrl/Cmd + Enter 快捷键提交
   - Loading 状态显示

3. **创建模式控制主组件**（src/features/mode-control/components/ModeControl.tsx）：
   - 集成 ModeSelector 和 PromptInput
   - WebSocket 连接状态提示
   - 已完成模式的标签显示
   - 通过 WebSocket 发送 Prompt

4. **创建模式 Store**（src/store/mode.store.ts）：
   - 状态：currentMode, availableModes, history
   - Actions：setMode, addHistory, clearHistory, getNextMode
   - 持久化 currentMode 和 history

5. **集成到 MainLayout**：
   - 在 bottomPane 渲染 ModeControl
   - 传递 projectId

6. **创建导出文件**（src/features/mode-control/index.ts）

7. **验证**：
   - 模式切换正常
   - Prompt 输入和提交正常
   - WebSocket 发送成功
   - 历史记录显示正确

确保模式控制功能完整、交互流畅、状态管理正确。
