import React, { useEffect, useRef } from 'react';
import { Space, Button, Select, Badge, Typography, Empty, Tooltip } from 'antd';
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
  const { logs, autoScroll, filter, clearLogs, setAutoScroll, setFilter, getFilteredLogs } =
    useOutputConsoleStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const filteredLogs = getFilteredLogs();

  // Auto scroll to bottom
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
            {/* Filter */}
            <Select value={filter} onChange={setFilter} size="small" style={{ width: 120 }}>
              <Select.Option value="all">全部 ({logCounts.all})</Select.Option>
              <Select.Option value="info">信息 ({logCounts.info})</Select.Option>
              <Select.Option value="warn">警告 ({logCounts.warn})</Select.Option>
              <Select.Option value="error">错误 ({logCounts.error})</Select.Option>
              <Select.Option value="debug">调试 ({logCounts.debug})</Select.Option>
            </Select>

            {/* Auto scroll */}
            <Tooltip title={autoScroll ? '暂停滚动' : '自动滚动'}>
              <Button
                type={autoScroll ? 'primary' : 'default'}
                size="small"
                icon={autoScroll ? <PauseOutlined /> : <CaretRightOutlined />}
                onClick={() => setAutoScroll(!autoScroll)}
              />
            </Tooltip>

            {/* Scroll to bottom */}
            <Tooltip title="滚动到底部">
              <Button
                type="text"
                size="small"
                icon={<VerticalAlignBottomOutlined />}
                onClick={handleScrollToBottom}
              />
            </Tooltip>

            {/* Download logs */}
            <Tooltip title="下载日志">
              <Button
                type="text"
                size="small"
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                disabled={filteredLogs.length === 0}
              />
            </Tooltip>

            {/* Clear */}
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
            <Empty description="暂无输出" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        ) : (
          filteredLogs.map((log) => <LogEntry key={log.id} log={log} />)
        )}
      </div>
    </div>
  );
};
