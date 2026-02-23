/**
 * Work mode types for Claude Harness
 */

export type WorkMode =
  | 'prd'
  | 'architecture'
  | 'dev-plan'
  | 'task-gen'
  | 'task-exec'
  | 'loop-test'
  | 'deploy';

export interface ModeConfig {
  name: string;
  description: string;
  color: string;
}

export interface ModeHistory {
  mode: WorkMode;
  timestamp: string;
  result: 'success' | 'failed' | 'skipped';
}

export interface ModeStatus {
  currentMode: WorkMode;
  availableModes: WorkMode[];
  history: ModeHistory[];
}

export interface PromptSubmission {
  mode: WorkMode;
  prompt: string;
  projectId?: string;
}
