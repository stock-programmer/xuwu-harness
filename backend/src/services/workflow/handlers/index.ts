/**
 * Mode Handlers Index
 * Exports all mode handlers for use in the workflow orchestrator
 */

export { BaseModeHandler, ModeExecutionContext } from './BaseModeHandler';
export { PRDModeHandler } from './PRDModeHandler';
export { ArchitectureModeHandler } from './ArchitectureModeHandler';
export { DevPlanModeHandler } from './DevPlanModeHandler';
export { TaskGenModeHandler } from './TaskGenModeHandler';
export { TaskExecModeHandler } from './TaskExecModeHandler';
export { LoopTestModeHandler } from './LoopTestModeHandler';
export { DeployModeHandler } from './DeployModeHandler';

import { WorkMode } from '../../../types/workflow.types';
import { BaseModeHandler } from './BaseModeHandler';
import { PRDModeHandler } from './PRDModeHandler';
import { ArchitectureModeHandler } from './ArchitectureModeHandler';
import { DevPlanModeHandler } from './DevPlanModeHandler';
import { TaskGenModeHandler } from './TaskGenModeHandler';
import { TaskExecModeHandler } from './TaskExecModeHandler';
import { LoopTestModeHandler } from './LoopTestModeHandler';
import { DeployModeHandler } from './DeployModeHandler';

/**
 * Mode Handler Factory
 * Creates and returns the appropriate mode handler based on the work mode
 */
export class ModeHandlerFactory {
  private static handlers: Map<WorkMode, BaseModeHandler> = new Map();

  /**
   * Get handler for a specific work mode
   * @param mode - The work mode
   * @returns The corresponding mode handler
   */
  static getHandler(mode: WorkMode): BaseModeHandler {
    // Use cached handler if available
    if (this.handlers.has(mode)) {
      return this.handlers.get(mode)!;
    }

    // Create new handler instance
    let handler: BaseModeHandler;

    switch (mode) {
      case WorkMode.PRD:
        handler = new PRDModeHandler();
        break;
      case WorkMode.ARCHITECTURE:
        handler = new ArchitectureModeHandler();
        break;
      case WorkMode.DEV_PLAN:
        handler = new DevPlanModeHandler();
        break;
      case WorkMode.TASK_GEN:
        handler = new TaskGenModeHandler();
        break;
      case WorkMode.TASK_EXEC:
        handler = new TaskExecModeHandler();
        break;
      case WorkMode.LOOP_TEST:
        handler = new LoopTestModeHandler();
        break;
      case WorkMode.DEPLOY:
        handler = new DeployModeHandler();
        break;
      default:
        throw new Error(`Unknown work mode: ${mode}`);
    }

    // Cache the handler
    this.handlers.set(mode, handler);

    return handler;
  }

  /**
   * Get all available handlers
   * @returns Map of all mode handlers
   */
  static getAllHandlers(): Map<WorkMode, BaseModeHandler> {
    // Ensure all handlers are initialized
    Object.values(WorkMode).forEach((mode) => {
      this.getHandler(mode as WorkMode);
    });

    return new Map(this.handlers);
  }

  /**
   * Clear cached handlers
   */
  static clearCache(): void {
    this.handlers.clear();
  }
}
