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
 * Task Execution Mode Handler
 * Executes individual development tasks from the task files
 */
export class TaskExecModeHandler extends BaseModeHandler {
  getModeName(): string {
    return WorkMode.TASK_EXEC;
  }

  async validatePreconditions(
    context: ModeExecutionContext
  ): Promise<boolean> {
    const { workingDir, projectContext, input } = context;
    const contextDir = projectContext.contextDir || path.join(workingDir, 'context');
    const devTasksDir = path.join(contextDir, 'dev-tasks');

    if (!(await this.directoryExists(devTasksDir))) {
      logger.error('TaskExec mode precondition failed: dev-tasks not found', {
        devTasksDir,
      });
      return false;
    }

    // If a specific task is requested, check if the task file exists
    if (input) {
      const taskFile = await this.findTaskFile(devTasksDir, input);
      if (!taskFile) {
        logger.error('TaskExec mode precondition failed: Task file not found', {
          input,
        });
        return false;
      }
    }

    logger.info('TaskExec mode: Preconditions met');
    return true;
  }

  async execute(
    input: string,
    context: ModeExecutionContext
  ): Promise<ModeExecutionResult> {
    const startTime = Date.now();
    logger.info('TaskExec mode: Starting execution', { input });

    try {
      const { workingDir, projectContext } = context;
      const contextDir = projectContext.contextDir || path.join(workingDir, 'context');
      const devTasksDir = path.join(contextDir, 'dev-tasks');

      // Find the task file
      const taskFile = await this.findTaskFile(devTasksDir, input);
      if (!taskFile) {
        return {
          success: false,
          output: '',
          artifacts: [],
          error: `Task file not found for: ${input}`,
          duration: Date.now() - startTime,
        };
      }

      // Read the task file
      const taskContent = await fs.readFile(taskFile, 'utf-8');

      // Build prompt for Claude
      const prompt = this.buildPrompt(input, taskFile, taskContent);

      // Execute using Claude Code Executor
      const executionOptions: ExecutionOptions = {
        taskId: `task-exec-${input}-${Date.now()}`,
        workingDir,
        timeout: 900000, // 15 minutes
        maxRetries: 2,
        onProgress: (output: string) => {
          logger.debug('TaskExec mode progress:', { length: output.length });
        },
      };

      const executionResult = await claudeCodeExecutor.execute(
        prompt,
        executionOptions
      );

      if (!executionResult.success) {
        logger.error('TaskExec mode execution failed', {
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

      // Extract artifacts - check for newly created/modified files
      const artifacts = await this.extractArtifacts(
        workingDir,
        executionResult.output
      );

      const duration = Date.now() - startTime;

      logger.info('TaskExec mode completed successfully', {
        duration,
        artifacts: artifacts.length,
        task: input,
      });

      return {
        success: true,
        output: executionResult.output,
        artifacts,
        nextMode: WorkMode.TASK_EXEC, // Stay in TASK_EXEC for next task
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('TaskExec mode execution error:', error);

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
    // Check if execution was successful
    if (!result.success) {
      logger.error('TaskExec mode validation failed: Execution failed');
      return false;
    }

    // For task execution, we expect some output
    if (!result.output || result.output.trim().length === 0) {
      logger.warn('TaskExec mode validation warning: No output generated');
    }

    // Basic validation - task execution should produce some artifacts or meaningful output
    if (result.artifacts.length === 0 && result.output.trim().length < 100) {
      logger.error(
        'TaskExec mode validation failed: No artifacts or meaningful output'
      );
      return false;
    }

    logger.info('TaskExec mode validation passed', {
      artifactCount: result.artifacts.length,
    });
    return true;
  }

  private buildPrompt(
    taskInput: string,
    taskFile: string,
    taskContent: string
  ): string {
    return `You are now executing a development task.

Task File: ${taskFile}
Task ID/Name: ${taskInput}

Task Content:
${taskContent}

---

Please execute this task according to the specifications in the task file.

Follow the implementation steps carefully:
1. Read and understand all requirements
2. Implement the code following best practices
3. Ensure all code is production-ready
4. Add proper error handling
5. Follow TypeScript/JavaScript conventions
6. Add appropriate logging
7. Test your implementation

Make sure to:
- Create all necessary files and directories
- Follow the project structure
- Use proper imports and exports
- Add type definitions where needed
- Ensure code quality and readability

Execute the task now and provide a summary when complete.`;
  }

  private async findTaskFile(
    devTasksDir: string,
    taskInput: string
  ): Promise<string | null> {
    try {
      // Check if input is a direct file path
      if (taskInput.endsWith('.md') && (await this.fileExists(taskInput))) {
        return taskInput;
      }

      // Search for task file by ID or name
      const allFiles = await this.getFilesInDirectory(devTasksDir);
      const taskFiles = allFiles.filter((f) => f.endsWith('.md'));

      // Try exact match first
      for (const file of taskFiles) {
        const fileName = path.basename(file);
        if (
          fileName.includes(taskInput) ||
          fileName.includes(taskInput.replace('.', '-'))
        ) {
          return file;
        }
      }

      // Try partial match
      for (const file of taskFiles) {
        const fileName = path.basename(file).toLowerCase();
        const searchTerm = taskInput.toLowerCase().replace(/\./g, '-');
        if (fileName.includes(searchTerm)) {
          return file;
        }
      }

      return null;
    } catch (error) {
      logger.error('Error finding task file:', error);
      return null;
    }
  }

  private async extractArtifacts(
    workingDir: string,
    output: string
  ): Promise<string[]> {
    const artifacts: string[] = [];

    try {
      // Extract file paths from common patterns in output
      const filePatternRegex = /(?:Created|Modified|Updated|Wrote)\s+(?:file\s+)?[`'""]?([^\s`'"":]+\.(ts|js|json|md|yml|yaml))[`'""]?/gi;
      const matches = output.matchAll(filePatternRegex);

      for (const match of matches) {
        const filePath = match[1];
        const fullPath = path.isAbsolute(filePath)
          ? filePath
          : path.join(workingDir, filePath);

        if (await this.fileExists(fullPath)) {
          artifacts.push(fullPath);
        }
      }

      // Also check common directories for new files
      const srcDir = path.join(workingDir, 'backend', 'src');
      if (await this.directoryExists(srcDir)) {
        // Limit to prevent huge artifact lists
        const srcFiles = await this.getFilesInDirectory(srcDir);
        artifacts.push(...srcFiles.slice(0, 50));
      }
    } catch (error) {
      logger.warn('Error extracting artifacts:', error);
    }

    // Remove duplicates
    return [...new Set(artifacts)];
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
