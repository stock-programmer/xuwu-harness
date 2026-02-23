import React from 'react';
import { Tag } from 'antd';
import {
  InfoCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  BugOutlined,
} from '@ant-design/icons';
import type { OutputLog } from '@/types/execution.types';
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
} as const;

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
            <span className="text-xs text-gray-500">{formatDateTime(log.timestamp)}</span>
            {log.source && <span className="text-xs text-gray-400">[{log.source}]</span>}
          </div>

          <div className="text-sm font-mono whitespace-pre-wrap break-words">{log.message}</div>

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
