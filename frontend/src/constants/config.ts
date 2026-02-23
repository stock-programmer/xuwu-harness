export const APP_CONFIG = {
  APP_NAME: 'Claude Harness',
  VERSION: '1.0.0',
  API_TIMEOUT: 30000,
  WS_RECONNECT_INTERVAL: 5000,
} as const;

export const TASK_STATUS_COLORS = {
  pending: '#d9d9d9',
  running: '#1890ff',
  completed: '#52c41a',
  failed: '#ff4d4f',
  skipped: '#faad14',
} as const;
