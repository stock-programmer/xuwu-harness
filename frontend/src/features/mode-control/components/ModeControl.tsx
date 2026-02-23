import React from 'react';
import { Card, Divider, Alert, Space, Tag, Spin } from 'antd';
import { CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { ModeSelector } from './ModeSelector';
import { PromptInput } from './PromptInput';
import { useModeStore } from '@/store/useModeStore';
import { useWebSocketContext } from '@/contexts/WebSocketContext';

interface ModeControlProps {
  projectId?: string;
}

export const ModeControl: React.FC<ModeControlProps> = ({ projectId }) => {
  const { currentMode, setMode, history } = useModeStore();
  const { connected, emit } = useWebSocketContext();
  const [submitting, setSubmitting] = React.useState(false);

  const handleModeChange = (mode: typeof currentMode) => {
    setMode(mode);
  };

  const handlePromptSubmit = async (prompt: string) => {
    setSubmitting(true);
    try {
      // 通过 WebSocket 发送 Prompt (修复：使用后端期望的事件名 'execute_mode')
      emit('execute_mode', {
        mode: currentMode,
        input: prompt,
        projectId,
      });

      // 记录到历史
      // 这里可以添加历史记录逻辑
    } catch (error: unknown) {
      console.error('Prompt 提交失败:', error);
      setSubmitting(false);
    }
  };

  // Monitor WebSocket events to stop submitting state
  React.useEffect(() => {
    if (!connected) return;

    const handleStatusChange = () => {
      // Keep submitting state until we get a completion message
      // This will be cleared by completion or error events
    };

    // Note: Actual event handling is done in useOutputWebSocket
    // This is just for UI state management
  }, [connected]);

  // 显示最近完成的模式
  const completedModes = history.filter((h) => h.result === 'success').slice(-3);

  return (
    <Card className="h-full" styles={{ body: { height: '100%', overflow: 'auto' } }}>
      {/* WebSocket 连接状态 */}
      {!connected && (
        <Alert
          title="WebSocket 未连接"
          description="请检查网络连接或刷新页面"
          type="warning"
          showIcon
          closable
          className="mb-4"
        />
      )}

      {/* 执行中的提示 */}
      {submitting && (
        <Alert
          title="正在执行任务"
          description={
            <Space orientation="vertical" size="small" className="w-full">
              <div className="flex items-center gap-2">
                <Spin indicator={<LoadingOutlined style={{ fontSize: 16 }} spin />} />
                <span>Claude Code 正在后台处理您的请求...</span>
              </div>
              <div className="text-xs text-gray-500">
                实时输出将显示在左侧的输出控制台中
              </div>
            </Space>
          }
          type="info"
          showIcon={false}
          className="mb-4"
          action={
            <a onClick={() => setSubmitting(false)} className="text-xs">
              隐藏
            </a>
          }
        />
      )}

      {/* 已完成的模式 */}
      {completedModes.length > 0 && (
        <div className="mb-4">
          <Space size="small" wrap>
            <span className="text-xs text-gray-500">已完成:</span>
            {completedModes.map((h, i) => (
              <Tag key={i} icon={<CheckCircleOutlined />} color="success">
                {h.mode}
              </Tag>
            ))}
          </Space>
        </div>
      )}

      {/* 模式选择器 */}
      <ModeSelector value={currentMode} onChange={handleModeChange} disabled={submitting} />

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
