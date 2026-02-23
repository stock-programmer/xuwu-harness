import { promises as fs } from 'fs';
import path from 'path';
import {
  BaseModeHandler,
  ModeExecutionContext,
} from './BaseModeHandler';
import { ModeExecutionResult, WorkMode } from '../../../types/workflow.types';
import { claudeCodeExecutor } from '../../ClaudeCodeExecutor';
import { ExecutionOptions } from '../../../types/executor.types';
import logger from '../../../utils/logger';

/**
 * Task Generation Mode Handler
 * Generates detailed task implementation guides from tasks-index.json
 */
export class TaskGenModeHandler extends BaseModeHandler {
  getModeName(): string {
    return WorkMode.TASK_GEN;
  }

  async validatePreconditions(
    context: ModeExecutionContext
  ): Promise<boolean> {
    const { workingDir, projectContext } = context;
    const contextDir = projectContext.contextDir || path.join(workingDir, 'context');
    const devTasksDir = path.join(contextDir, 'dev-tasks');

    if (!(await this.directoryExists(devTasksDir))) {
      logger.error('TaskGen mode precondition failed: dev-tasks not found', {
        devTasksDir,
      });
      return false;
    }

    // Check for tasks-index.json in backend or frontend
    const backendIndex = path.join(devTasksDir, 'backend', 'tasks-index.json');
    const frontendIndex = path.join(devTasksDir, 'frontend', 'tasks-index.json');

    const hasBackend = await this.fileExists(backendIndex);
    const hasFrontend = await this.fileExists(frontendIndex);

    if (!hasBackend && !hasFrontend) {
      logger.error(
        'TaskGen mode precondition failed: No tasks-index.json files found'
      );
      return false;
    }

    logger.info('TaskGen mode: Preconditions met');
    return true;
  }

  async execute(
    input: string,
    context: ModeExecutionContext
  ): Promise<ModeExecutionResult> {
    const startTime = Date.now();
    logger.info('TaskGen mode: Starting execution', { input });

    try {
      const { workingDir, projectContext } = context;
      const contextDir = projectContext.contextDir || path.join(workingDir, 'context');
      const devTasksDir = path.join(contextDir, 'dev-tasks');

      // Build prompt for Claude
      const prompt = this.buildPrompt(input, devTasksDir);

      // Execute using Claude Code Executor
      const executionOptions: ExecutionOptions = {
        taskId: `task-gen-${Date.now()}`,
        workingDir,
        timeout: 900000, // 15 minutes (this can take longer)
        maxRetries: 2,
        onProgress: (output: string) => {
          logger.debug('TaskGen mode progress:', { length: output.length });
        },
      };

      const executionResult = await claudeCodeExecutor.execute(
        prompt,
        executionOptions
      );

      if (!executionResult.success) {
        logger.error('TaskGen mode execution failed', {
          error: executionResult.error,
        });
        return {
          success: false,
          output: executionResult.output,
          artifacts: [],
          error: executionResult.error,
          duration: Date.now() - startTime,
        };
      }

      // Extract artifacts
      const artifacts = await this.getFilesInDirectory(devTasksDir);

      const duration = Date.now() - startTime;

      logger.info('TaskGen mode completed successfully', {
        duration,
        artifacts: artifacts.length,
      });

      return {
        success: true,
        output: executionResult.output,
        artifacts,
        nextMode: WorkMode.TASK_EXEC,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('TaskGen mode execution error:', error);

      return {
        success: false,
        output: '',
        artifacts: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      };
    }
  }

  async validateOutput(result: ModeExecutionResult): Promise<boolean> {
    // Check if task files were created
    if (result.artifacts.length === 0) {
      logger.error('TaskGen mode validation failed: No artifacts generated');
      return false;
    }

    // Check that we have markdown task files
    const taskFiles = result.artifacts.filter((f) => f.endsWith('.md'));

    if (taskFiles.length === 0) {
      logger.error('TaskGen mode validation failed: No task markdown files found');
      return false;
    }

    // Validate that we have the expected task file naming pattern
    const hasValidTaskFiles = taskFiles.some(
      (f) =>
        f.includes('backend-dev-plan-') || f.includes('frontend-dev-plan-')
    );

    if (!hasValidTaskFiles) {
      logger.warn(
        'TaskGen mode validation warning: No files matching expected naming pattern'
      );
    }

    logger.info('TaskGen mode validation passed', {
      taskFileCount: taskFiles.length,
    });
    return true;
  }

  private buildPrompt(input: string, devTasksDir: string): string {
    return `You are a senior developer. Based on the development plan (tasks-index.json), generate detailed task implementation guides.

Development plan is in: ${devTasksDir}/

For each task in the tasks-index.json files (both backend and frontend), create detailed markdown files with:

1. **Task Metadata**: ID, layer, dependencies, complexity
2. **Task Objectives**: Clear description of what needs to be done
3. **Prerequisites**: What must be completed before this task
4. **Implementation Steps**: Step-by-step guide with code examples
5. **Code Examples**: Specific code snippets and patterns to follow
6. **Testing Criteria**: How to verify the task is complete
7. **Claude Execution Prompt**: A prompt that Claude can use to execute this task

File naming convention:
- Backend: backend-dev-plan-{task_id}-{task-name}.md
- Frontend: frontend-dev-plan-{task_id}-{task-name}.md

Example: backend-dev-plan-1.1-install-core-dependencies.md

Each file should be comprehensive and provide everything needed to execute the task. Include:
- Import statements
- Type definitions
- Implementation code
- Configuration examples
- Testing instructions

${input ? `Additional requirements: ${input}` : ''}

Make each task guide detailed, actionable, and production-ready. Use proper markdown formatting.`;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  private async getFilesInDirectory(
    dirPath: string,
    recursive = true
  ): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory() && recursive) {
          const subFiles = await this.getFilesInDirectory(fullPath, recursive);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      logger.warn(`Error reading directory ${dirPath}:`, error);
    }

    return files;
  }
}
