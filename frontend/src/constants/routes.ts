export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  PROJECT: '/project/:projectId',
  PROJECT_FILES: '/project/:projectId/files',
  PROJECT_TASKS: '/project/:projectId/tasks',
  SETTINGS: '/settings',
  NOT_FOUND: '*',
} as const;
