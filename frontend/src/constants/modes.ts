import type { WorkMode, ModeConfig } from '@/types/mode.types';

// Legacy view modes - kept for backwards compatibility
export const MODES = {
  EDIT: 'edit',
  VIEW: 'view',
  EXECUTE: 'execute',
} as const;

export type Mode = (typeof MODES)[keyof typeof MODES];

// Work mode configurations for Claude Harness workflow
export const WORK_MODES: Record<WorkMode, ModeConfig> = {
  prd: {
    name: 'PRD',
    description: '产品需求文档',
    color: '#1890ff',
  },
  architecture: {
    name: 'Architecture',
    description: '架构设计',
    color: '#52c41a',
  },
  'dev-plan': {
    name: 'Dev Plan',
    description: '开发计划',
    color: '#722ed1',
  },
  'task-gen': {
    name: 'Task Gen',
    description: '任务生成',
    color: '#fa8c16',
  },
  'task-exec': {
    name: 'Task Exec',
    description: '任务执行',
    color: '#eb2f96',
  },
  'loop-test': {
    name: 'Loop Test',
    description: '循环测试',
    color: '#13c2c2',
  },
  deploy: {
    name: 'Deploy',
    description: '部署',
    color: '#f5222d',
  },
};
