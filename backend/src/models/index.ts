// Export all models
export { Project } from './Project';
export { TaskExecution } from './TaskExecution';
export { LayerExecution } from './LayerExecution';
export { ExecutionLog } from './ExecutionLog';
export { TestRun } from './TestRun';
export { Deployment } from './Deployment';

// Import models for association configuration
import { Project } from './Project';
import { TaskExecution } from './TaskExecution';
import { LayerExecution } from './LayerExecution';
import { ExecutionLog } from './ExecutionLog';
import { TestRun } from './TestRun';
import { Deployment } from './Deployment';

// Configure model associations

// Project has many relationships
Project.hasMany(TaskExecution, {
  foreignKey: 'project_id',
  as: 'taskExecutions',
});

Project.hasMany(LayerExecution, {
  foreignKey: 'project_id',
  as: 'layerExecutions',
});

Project.hasMany(ExecutionLog, {
  foreignKey: 'project_id',
  as: 'executionLogs',
});

Project.hasMany(TestRun, {
  foreignKey: 'project_id',
  as: 'testRuns',
});

Project.hasMany(Deployment, {
  foreignKey: 'project_id',
  as: 'deployments',
});

// TaskExecution belongs to Project
TaskExecution.belongsTo(Project, {
  foreignKey: 'project_id',
  as: 'project',
});

// TaskExecution has many ExecutionLogs
TaskExecution.hasMany(ExecutionLog, {
  foreignKey: 'task_execution_id',
  as: 'logs',
});

// LayerExecution belongs to Project
LayerExecution.belongsTo(Project, {
  foreignKey: 'project_id',
  as: 'project',
});

// ExecutionLog belongs to Project and TaskExecution
ExecutionLog.belongsTo(Project, {
  foreignKey: 'project_id',
  as: 'project',
});

ExecutionLog.belongsTo(TaskExecution, {
  foreignKey: 'task_execution_id',
  as: 'taskExecution',
});

// TestRun belongs to Project
TestRun.belongsTo(Project, {
  foreignKey: 'project_id',
  as: 'project',
});

// Deployment belongs to Project
Deployment.belongsTo(Project, {
  foreignKey: 'project_id',
  as: 'project',
});
