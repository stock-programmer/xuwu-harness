import { WebSocketServer } from './WebSocketServer';
import {
  ClientMessage,
  ExecuteModeMessage,
  SwitchModeMessage,
  RetryTaskMessage,
  CancelExecutionMessage,
  SubscribeProgressMessage,
  ServerMessage,
} from '../../types/websocket.types';
import { WorkMode, ModeExecutionResult } from '../../types/workflow.types';
import { WorkflowOrchestrator } from '../workflow/WorkflowOrchestrator';
import { ProgressTracker } from '../ProgressTracker';
import { Project } from '../../models/Project';
import logger from '../../utils/logger';
import path from 'path';

/**
 * WebSocket Event Handler
 * Handles all WebSocket events and integrates with business logic services
 */
export class WebSocketEventHandler {
  private activeExecutions: Map<string, AbortController> = new Map();

  constructor(
    private wsServer: WebSocketServer,
    private progressTracker?: ProgressTracker
  ) {
    logger.info('WebSocketEventHandler initialized');
  }

  /**
   * Handle execute mode message
   * Executes a workflow mode with the given input
   */
  async handleExecuteMode(
    clientId: string,
    message: ExecuteModeMessage
  ): Promise<void> {
    const { projectId, mode, input } = message.payload;

    logger.info(`Execute mode request from ${clientId}`, {
      projectId,
      mode,
      input: input.substring(0, 100),
    });

    try {
      // Validate project exists
      const project = await Project.findByPk(projectId);
      if (!project) {
        this.sendError(clientId, `Project not found: ${projectId}`);
        return;
      }

      // Get project's working directory
      const projectRootPath = project.root_path;
      const absoluteProjectPath = path.isAbsolute(projectRootPath)
        ? projectRootPath
        : path.join(process.cwd(), projectRootPath);

      logger.info(`Using project directory: ${absoluteProjectPath}`, {
        projectId,
        mode,
      });

      // Validate mode
      if (!Object.values(WorkMode).includes(mode as WorkMode)) {
        this.sendError(clientId, `Invalid work mode: ${mode}`);
        return;
      }

      // Send acknowledgment
      this.wsServer.sendToClient(clientId, {
        type: 'status',
        payload: {
          message: `Starting execution of mode: ${mode}`,
          mode,
          projectId,
          projectPath: absoluteProjectPath,
        },
        timestamp: Date.now(),
      });

      // Create project-specific orchestrator
      const projectOrchestrator = new WorkflowOrchestrator(absoluteProjectPath);

      // Execute the mode with real-time output streaming
      const result = await projectOrchestrator.executeMode(
        mode as WorkMode,
        input,
        {
          onProgress: (output: string) => {
            // Stream output to client in real-time
            this.streamOutput(clientId, output, true);
          },
          onError: (error: Error) => {
            // Send error to client
            this.sendError(clientId, `Execution error: ${error.message}`, error);
          },
        }
      );

      // Send result back to client
      this.sendModeExecutionResult(clientId, result, mode);

      // If successful and there's a next mode, suggest it
      if (result.success && result.nextMode) {
        this.wsServer.sendToClient(clientId, {
          type: 'status',
          payload: {
            message: `Mode ${mode} completed. Next suggested mode: ${result.nextMode}`,
            currentMode: mode,
            nextMode: result.nextMode,
          },
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      logger.error(`Execute mode error for ${mode}:`, error);
      this.sendError(
        clientId,
        `Failed to execute mode ${mode}`,
        error
      );
    }
  }

  /**
   * Handle switch mode message
   * Switches the current workflow mode
   * NOTE: Mode switching is now project-specific, this is deprecated
   */
  async handleSwitchMode(
    clientId: string,
    message: SwitchModeMessage
  ): Promise<void> {
    const { mode } = message.payload;

    logger.info(`Switch mode request from ${clientId}`, { mode });

    try {
      // Validate mode
      if (!Object.values(WorkMode).includes(mode as WorkMode)) {
        this.sendError(clientId, `Invalid work mode: ${mode}`);
        return;
      }

      // Send success confirmation (mode switching is now project-specific)
      this.wsServer.sendToClient(clientId, {
        type: 'status',
        payload: {
          message: `Mode noted: ${mode} (mode switching is now project-specific)`,
          mode,
        },
        timestamp: Date.now(),
      });

      logger.info(`Mode switch noted for client ${clientId}: ${mode}`);
    } catch (error) {
      logger.error(`Switch mode error:`, error);
      this.sendError(
        clientId,
        `Failed to switch to mode ${mode}`,
        error
      );
    }
  }

  /**
   * Handle retry task message
   * Retries a failed task execution
   * NOTE: This requires projectId to be added to RetryTaskMessage
   */
  async handleRetryTask(
    clientId: string,
    message: RetryTaskMessage
  ): Promise<void> {
    const { taskId } = message.payload;

    logger.warn(`Retry task is not yet fully implemented for task: ${taskId}`);

    try {
      // Send acknowledgment
      this.wsServer.sendToClient(clientId, {
        type: 'status',
        payload: {
          message: `Retry task feature is not yet fully implemented: ${taskId}`,
          taskId,
        },
        timestamp: Date.now(),
      });

      logger.info(`Retry task request received from ${clientId}: ${taskId}`);
    } catch (error) {
      logger.error(`Retry task error for ${taskId}:`, error);
      this.sendError(clientId, `Failed to retry task ${taskId}`, error);
    }
  }

  /**
   * Handle cancel execution message
   * Cancels the current execution
   */
  async handleCancelExecution(
    clientId: string,
    message: CancelExecutionMessage
  ): Promise<void> {
    logger.info(`Cancel execution request from ${clientId}`);

    try {
      // Check if there's an active execution for this client
      const abortController = this.activeExecutions.get(clientId);

      if (abortController) {
        // Abort the execution
        abortController.abort();
        this.activeExecutions.delete(clientId);

        this.wsServer.sendToClient(clientId, {
          type: 'status',
          payload: {
            message: 'Execution cancelled successfully',
            cancelled: true,
          },
          timestamp: Date.now(),
        });

        logger.info(`Execution cancelled for client ${clientId}`);
      } else {
        this.wsServer.sendToClient(clientId, {
          type: 'status',
          payload: {
            message: 'No active execution to cancel',
            cancelled: false,
          },
          timestamp: Date.now(),
        });

        logger.debug(`No active execution found for client ${clientId}`);
      }
    } catch (error) {
      logger.error(`Cancel execution error:`, error);
      this.sendError(clientId, 'Failed to cancel execution', error);
    }
  }

  /**
   * Handle subscribe progress message
   * Subscribes client to progress updates for a project
   */
  async handleSubscribeProgress(
    clientId: string,
    message: SubscribeProgressMessage
  ): Promise<void> {
    const { projectId } = message.payload;

    logger.info(`Subscribe progress request from ${clientId}`, { projectId });

    try {
      // Note: Room joining is handled by WebSocketManager
      // Here we just send the current progress

      if (this.progressTracker) {
        const progress = await this.progressTracker.getProgress(projectId);

        this.wsServer.sendToClient(clientId, {
          type: 'task_progress',
          payload: progress,
          timestamp: Date.now(),
        });
      }

      this.wsServer.sendToClient(clientId, {
        type: 'status',
        payload: {
          message: `Subscribed to progress for project: ${projectId}`,
          projectId,
          subscribed: true,
        },
        timestamp: Date.now(),
      });

      logger.info(
        `Client ${clientId} subscribed to progress for project ${projectId}`
      );
    } catch (error) {
      logger.error(`Subscribe progress error:`, error);
      this.sendError(
        clientId,
        `Failed to subscribe to progress for project ${projectId}`,
        error
      );
    }
  }

  /**
   * Send mode execution result to client
   */
  private sendModeExecutionResult(
    clientId: string,
    result: ModeExecutionResult,
    mode: string
  ): void {
    const message: ServerMessage = {
      type: 'status',
      payload: {
        message: result.success ? 'Execution completed' : 'Execution failed',
        success: result.success,
        mode,
        output: result.output,
        artifacts: result.artifacts,
        error: result.error,
        duration: result.duration,
        nextMode: result.nextMode,
      },
      timestamp: Date.now(),
    };

    this.wsServer.sendToClient(clientId, message);

    // Also send execution error if there was one
    if (!result.success && result.error) {
      this.wsServer.sendToClient(clientId, {
        type: 'execution_error',
        payload: {
          error: result.error,
          taskId: mode,
        },
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Send error message to client
   */
  private sendError(clientId: string, message: string, error?: any): void {
    const errorMessage: ServerMessage = {
      type: 'error',
      payload: {
        error: message,
        details: error instanceof Error ? error.message : String(error || ''),
      },
      timestamp: Date.now(),
    };

    this.wsServer.sendToClient(clientId, errorMessage);
  }

  /**
   * Stream output to client (for real-time Claude output)
   */
  streamOutput(clientId: string, text: string, stream: boolean = true): void {
    logger.debug(`Streaming output to client ${clientId}`, {
      textLength: text.length,
      stream,
      preview: text.substring(0, 100),
    });

    const message = {
      type: 'claude_output',
      payload: {
        text,
        stream,
      },
      timestamp: Date.now(),
    };

    const sent = this.wsServer.sendToClient(clientId, message);
    if (!sent) {
      logger.warn(`Failed to stream output to client ${clientId}`);
    } else {
      logger.debug(`Output streamed successfully to client ${clientId}`);
    }
  }

  /**
   * Register an active execution (for cancellation support)
   */
  registerExecution(clientId: string, abortController: AbortController): void {
    this.activeExecutions.set(clientId, abortController);
  }

  /**
   * Unregister an active execution
   */
  unregisterExecution(clientId: string): void {
    this.activeExecutions.delete(clientId);
  }

  /**
   * Cleanup resources for a client
   */
  cleanupClient(clientId: string): void {
    // Cancel any active executions
    const abortController = this.activeExecutions.get(clientId);
    if (abortController) {
      abortController.abort();
      this.activeExecutions.delete(clientId);
    }

    logger.debug(`Cleaned up resources for client ${clientId}`);
  }

  /**
   * Cleanup all resources
   */
  cleanup(): void {
    // Abort all active executions
    this.activeExecutions.forEach((controller) => controller.abort());
    this.activeExecutions.clear();

    logger.info('WebSocketEventHandler cleaned up');
  }
}
