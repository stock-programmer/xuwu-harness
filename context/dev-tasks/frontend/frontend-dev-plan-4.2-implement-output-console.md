# Task: 实现输出控制台模块

## 元数据
- **Task ID**: frontend-dev-plan-4.2
- **Layer**: 4
- **Dependencies**: [3.3, 3.2, 3.4]
- **Parallel Group**: [4.1, 4.2, 4.3, 4.4]
- **Estimated Complexity**: High

## 目标
实现实时输出控制台，支持 WebSocket 流式输出、自动滚动、输出过滤、清空等功能。

## 前置条件
- MainLayout 已实现（Task 3.3 完成）
- Socket.IO 客户端已封装（Task 3.2 完成）
- TypeScript 类型已定义（Task 3.4 完成）

## 实现步骤

### 1. 创建输出控制台 Store
创建 `src/features/output-console/store/output-console.store.ts`：
```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { OutputLog } from '@/types/execution.types';
import { generateId } from '@/utils/string';

interface OutputConsoleState {
  // 状态
  logs: OutputLog[];
  autoScroll: boolean;
  filter: 'all' | 'info' | 'warn' | 'error' | 'debug';
  maxLogs: number;

  // Actions
  addLog: (log: Omit<OutputLog, 'id' | 'timestamp'>) => void;
  addLogs: (logs: Omit<OutputLog, 'id' | 'timestamp'>[]) => void;
  clearLogs: () => void;
  setAutoScroll: (enabled: boolean) => void;
  setFilter: (filter: OutputConsoleState['filter']) => void;
  getFilteredLogs: () => OutputLog[];
}

export const useOutputConsoleStore = create<OutputConsoleState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      logs: [],
      autoScroll: true,
      filter: 'all',
      maxLogs: 1000,

      // 添加单条日志
      addLog: (log) => {
        set((state) => {
          const newLog: OutputLog = {
            id: generateId('log'),
            timestamp: new Date().toISOString(),
            ...log,
          };

          const newLogs = [...state.logs, newLog];

          // 限制日志数量
          if (newLogs.length > state.maxLogs) {
            return { logs: newLogs.slice(-state.maxLogs) };
          }

          return { logs: newLogs };
        });
      },

      // 批量添加日志
      addLogs: (logs) => {
        set((state) => {
          const newLogs = logs.map((log) => ({
            id: generateId('log'),
            timestamp: new Date().toISOString(),
            ...log,
          }));

          const allLogs = [...state.logs, ...newLogs];

          // 限制日志数量
          if (allLogs.length > state.maxLogs) {
            return { logs: allLogs.slice(-state.maxLogs) };
          }

          return { logs: allLogs };
        });
      },

      // 清空日志
      clearLogs: () => set({ logs: [] }),

      // 设置自动滚动
      setAutoScroll: (enabled) => set({ autoScroll: enabled }),

      // 设置过滤器
      setFilter: (filter) => set({ filter }),

      // 获取过滤后的日志
      getFilteredLogs: () => {
        const { logs, filter } = get();
        if (filter === 'all') return logs;
        return logs.filter((log) => log.level === filter);
      },
    }),
    { name: 'OutputConsoleStore' }
  )
);
```

### 2. 创建日志条目组件
创建 `src/features/output-console/components/LogEntry.tsx`：
```typescript
import React from 'react';
import { Tag } from 'antd';
import {
  InfoCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  BugOutlined,
} from '@ant-design/icons';
import { OutputLog } from '@/types/execution.types';
import { formatDateTime } from '@/utils/format';

interface LogEntryProps {
  log: OutputLog;
}

const LOG_LEVEL_CONFIG = {
  info: {
    color: 'blue',
    icon: <InfoCircleOutlined />,
    bg: 'bg-blue-50',
    text: 'text-blue-700',
  },
  warn: {
    color: 'orange',
    icon: <WarningOutlined />,
    bg: 'bg-orange-50',
    text: 'text-orange-700',
  },
  error: {
    color: 'red',
    icon: <CloseCircleOutlined />,
    bg: 'bg-red-50',
    text: 'text-red-700',
  },
  debug: {
    color: 'gray',
    icon: <BugOutlined />,
    bg: 'bg-gray-50',
    text: 'text-gray-700',
  },
};

export const LogEntry: React.FC<LogEntryProps> = ({ log }) => {
  const config = LOG_LEVEL_CONFIG[log.level];

  return (
    <div
      className={`
        px-3 py-2 border-b border-gray-100
        hover:bg-gray-50 transition-colors
        ${config.bg}
      `}
    >
      <div className="flex items-start gap-2">
        {/* Level Icon */}
        <div className={`mt-0.5 ${config.text}`}>{config.icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Tag color={config.color} className="m-0">
              {log.level.toUpperCase()}
            </Tag>
            <span className="text-xs text-gray-500">
              {formatDateTime(log.timestamp)}
            </span>
            {log.source && (
              <span className="text-xs text-gray-400">[{log.source}]</span>
            )}
          </div>

          <div className="text-sm font-mono whitespace-pre-wrap break-words">
            {log.message}
          </div>

          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono overflow-x-auto">
              <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

### 3. 创建输出控制台组件
创建 `src/features/output-console/components/OutputConsole.tsx`：
```typescript
import React, { useEffect, useRef } from 'react';
import {
  Space,
  Button,
  Select,
  Badge,
  Typography,
  Empty,
  Tooltip,
} from 'antd';
import {
  ClearOutlined,
  DownloadOutlined,
  VerticalAlignBottomOutlined,
  PauseOutlined,
  CaretRightOutlined,
} from '@ant-design/icons';
import { useOutputConsoleStore } from '../store/output-console.store';
import { LogEntry } from './LogEntry';

const { Title } = Typography;

export const OutputConsole: React.FC = () => {
  const {
    logs,
    autoScroll,
    filter,
    clearLogs,
    setAutoScroll,
    setFilter,
    getFilteredLogs,
  } = useOutputConsoleStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const filteredLogs = getFilteredLogs();

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);

  const handleScrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleDownload = () => {
    const logText = filteredLogs
      .map((log) => `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`)
      .join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `output-${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const logCounts = {
    all: logs.length,
    info: logs.filter((l) => l.level === 'info').length,
    warn: logs.filter((l) => l.level === 'warn').length,
    error: logs.filter((l) => l.level === 'error').length,
    debug: logs.filter((l) => l.level === 'debug').length,
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Title level={5} className="m-0">
              输出控制台
            </Title>
            <Badge count={filteredLogs.length} showZero />
          </div>

          <Space size="small">
            {/* 过滤器 */}
            <Select
              value={filter}
              onChange={setFilter}
              size="small"
              style={{ width: 120 }}
            >
              <Select.Option value="all">
                全部 ({logCounts.all})
              </Select.Option>
              <Select.Option value="info">
                信息 ({logCounts.info})
              </Select.Option>
              <Select.Option value="warn">
                警告 ({logCounts.warn})
              </Select.Option>
              <Select.Option value="error">
                错误 ({logCounts.error})
              </Select.Option>
              <Select.Option value="debug">
                调试 ({logCounts.debug})
              </Select.Option>
            </Select>

            {/* 自动滚动 */}
            <Tooltip title={autoScroll ? '暂停滚动' : '自动滚动'}>
              <Button
                type={autoScroll ? 'primary' : 'default'}
                size="small"
                icon={
                  autoScroll ? <PauseOutlined /> : <CaretRightOutlined />
                }
                onClick={() => setAutoScroll(!autoScroll)}
              />
            </Tooltip>

            {/* 滚动到底部 */}
            <Tooltip title="滚动到底部">
              <Button
                type="text"
                size="small"
                icon={<VerticalAlignBottomOutlined />}
                onClick={handleScrollToBottom}
              />
            </Tooltip>

            {/* 下载日志 */}
            <Tooltip title="下载日志">
              <Button
                type="text"
                size="small"
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                disabled={filteredLogs.length === 0}
              />
            </Tooltip>

            {/* 清空 */}
            <Tooltip title="清空日志">
              <Button
                type="text"
                size="small"
                danger
                icon={<ClearOutlined />}
                onClick={clearLogs}
                disabled={logs.length === 0}
              />
            </Tooltip>
          </Space>
        </div>
      </div>

      {/* Logs */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        style={{ maxHeight: 'calc(100% - 64px)' }}
      >
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Empty
              description="暂无输出"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          filteredLogs.map((log) => <LogEntry key={log.id} log={log} />)
        )}
      </div>
    </div>
  );
};
```

### 4. 创建 Hook 集成 WebSocket
创建 `src/features/output-console/hooks/useOutputWebSocket.ts`：
```typescript
import { useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useOutputConsoleStore } from '../store/output-console.store';
import { OutputMessage } from '@/types/websocket.types';

export const useOutputWebSocket = (projectId?: string) => {
  const { connected, subscribe } = useWebSocket(projectId);
  const { addLog } = useOutputConsoleStore();

  useEffect(() => {
    if (!connected) return;

    // 监听流式输出
    const unsubscribeOutput = subscribe('output:stream', (message: OutputMessage) => {
      addLog({
        level: message.type === 'stderr' ? 'error' : 'info',
        message: message.text,
        source: message.type,
      });
    });

    // 监听错误
    const unsubscribeError = subscribe('error', (error: { message: string; code?: string }) => {
      addLog({
        level: 'error',
        message: error.message,
        source: 'system',
        metadata: { code: error.code },
      });
    });

    // 监听任务状态
    const unsubscribeStatus = subscribe('task:status', (update: any) => {
      addLog({
        level: update.status === 'failed' ? 'error' : 'info',
        message: `任务 ${update.taskId} 状态更新: ${update.status}`,
        source: 'task',
        metadata: update,
      });
    });

    return () => {
      unsubscribeOutput();
      unsubscribeError();
      unsubscribeStatus();
    };
  }, [connected, subscribe, addLog]);

  return { connected };
};
```

### 5. 在 ProjectView 中使用
更新 `src/pages/ProjectView/index.tsx`：
```typescript
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { OutputConsole } from '@/features/output-console/components/OutputConsole';
import { useOutputWebSocket } from '@/features/output-console/hooks/useOutputWebSocket';

const ProjectView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { connected } = useOutputWebSocket(projectId);

  return (
    <div className="h-full">
      <OutputConsole />
    </div>
  );
};

export default ProjectView;
```

### 6. 创建导出文件
创建 `src/features/output-console/index.ts`：
```typescript
export { OutputConsole } from './components/OutputConsole';
export { LogEntry } from './components/LogEntry';
export { useOutputConsoleStore } from './store/output-console.store';
export { useOutputWebSocket } from './hooks/useOutputWebSocket';
```

### 7. 添加测试日志功能（开发用）
创建 `src/features/output-console/utils/test-logs.ts`：
```typescript
import { useOutputConsoleStore } from '../store/output-console.store';

export const addTestLogs = () => {
  const { addLog } = useOutputConsoleStore.getState();

  addLog({
    level: 'info',
    message: '项目初始化成功',
    source: 'system',
  });

  addLog({
    level: 'info',
    message: '开始执行任务 DAG...',
    source: 'orchestrator',
  });

  addLog({
    level: 'warn',
    message: '检测到潜在的循环依赖',
    source: 'dag',
  });

  addLog({
    level: 'error',
    message: '任务 task-3.2 执行失败',
    source: 'executor',
    metadata: {
      taskId: 'task-3.2',
      error: 'Connection timeout',
    },
  });

  addLog({
    level: 'debug',
    message: 'WebSocket 连接已建立',
    source: 'websocket',
  });
};
```

## 期望输出
- ✅ `src/features/output-console/store/output-console.store.ts` Zustand store
- ✅ `src/features/output-console/components/LogEntry.tsx` 日志条目组件
- ✅ `src/features/output-console/components/OutputConsole.tsx` 控制台主组件
- ✅ `src/features/output-console/hooks/useOutputWebSocket.ts` WebSocket Hook
- ✅ 实时接收 WebSocket 输出
- ✅ 日志过滤功能
- ✅ 自动滚动和手动暂停
- ✅ 清空和下载日志

## 验证标准
```bash
npm run dev
# 访问项目页面 /project/xxx
# 应该看到：
# - 输出控制台显示
# - 可以添加测试日志
# - 过滤器正常工作
# - 自动滚动功能正常
# - 可以清空和下载日志
```

## Claude 执行 Prompt

请实现完整的输出控制台模块，具体要求如下：

1. **创建 Zustand Store**（src/features/output-console/store/output-console.store.ts）：
   - 状态：logs, autoScroll, filter, maxLogs
   - Actions：addLog, addLogs, clearLogs, setAutoScroll, setFilter, getFilteredLogs
   - 限制日志数量（maxLogs: 1000）

2. **创建日志条目组件**（src/features/output-console/components/LogEntry.tsx）：
   - 不同日志级别的图标和颜色
   - 显示时间戳、来源、消息
   - 支持 metadata 展示（JSON 格式）
   - 使用 monospace 字体

3. **创建输出控制台组件**（src/features/output-console/components/OutputConsole.tsx）：
   - Header 工具栏：
     - 日志计数徽章
     - 级别过滤器（全部/信息/警告/错误/调试）
     - 自动滚动切换按钮
     - 滚动到底部按钮
     - 下载日志按钮
     - 清空日志按钮
   - 日志列表区域（虚拟滚动优化）
   - 自动滚动到底部
   - 空状态显示

4. **创建 WebSocket Hook**（src/features/output-console/hooks/useOutputWebSocket.ts）：
   - 监听 'output:stream' 事件
   - 监听 'error' 事件
   - 监听 'task:status' 事件
   - 自动添加日志到 store

5. **集成到 ProjectView**（src/pages/ProjectView/index.tsx）：
   - 使用 useOutputWebSocket Hook
   - 渲染 OutputConsole 组件

6. **创建导出文件**（src/features/output-console/index.ts）

7. **创建测试工具**（src/features/output-console/utils/test-logs.ts）：
   - addTestLogs 函数用于开发测试

8. **验证**：
   - 日志正确显示和分类
   - 过滤器正常工作
   - 自动滚动功能正常
   - 清空和下载功能正常
   - WebSocket 实时输出正常

确保输出控制台功能完整、性能良好、用户体验流畅。
