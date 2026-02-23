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
 * Development Plan Mode Handler
 * Generates detailed development plan with DAG task structure based on architecture
 */
export class DevPlanModeHandler extends BaseModeHandler {
  getModeName(): string {
    return WorkMode.DEV_PLAN;
  }

  async validatePreconditions(
    context: ModeExecutionContext
  ): Promise<boolean> {
    const { workingDir, projectContext } = context;
    const contextDir = projectContext.contextDir || path.join(workingDir, 'context');
    const archDir = path.join(contextDir, 'architecture');

    if (!(await this.directoryExists(archDir))) {
      logger.error('DevPlan mode precondition failed: Architecture not found', {
        archDir,
      });
      return false;
    }

    // Check if there are any architecture files
    const archFiles = await this.getFilesInDirectory(archDir);
    if (archFiles.length === 0) {
      logger.error(
        'DevPlan mode precondition failed: No architecture files found'
      );
      return false;
    }

    logger.info('DevPlan mode: Preconditions met');
    return true;
  }

  async execute(
    input: string,
    context: ModeExecutionContext
  ): Promise<ModeExecutionResult> {
    const startTime = Date.now();
    logger.info('DevPlan mode: Starting execution', { input });

    try {
      const { workingDir, projectContext } = context;
      const contextDir = projectContext.contextDir || path.join(workingDir, 'context');
      const devTasksDir = path.join(contextDir, 'dev-tasks');
      const archDir = path.join(contextDir, 'architecture');

      // Ensure dev-tasks directory exists
      await fs.mkdir(devTasksDir, { recursive: true });
      await fs.mkdir(path.join(devTasksDir, 'backend'), { recursive: true });
      await fs.mkdir(path.join(devTasksDir, 'frontend'), { recursive: true });

      // Build prompt for Claude
      const prompt = this.buildPrompt(input, archDir, devTasksDir);

      // Execute using Claude Code Executor
      const executionOptions: ExecutionOptions = {
        taskId: `dev-plan-${Date.now()}`,
        workingDir,
        timeout: 600000, // 10 minutes
        maxRetries: 2,
        onProgress: (output: string) => {
          logger.debug('DevPlan mode progress:', { length: output.length });
        },
      };

      const executionResult = await claudeCodeExecutor.execute(
        prompt,
        executionOptions
      );

      if (!executionResult.success) {
        logger.error('DevPlan mode execution failed', {
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

      logger.info('DevPlan mode completed successfully', {
        duration,
        artifacts: artifacts.length,
      });

      return {
        success: true,
        output: executionResult.output,
        artifacts,
        nextMode: WorkMode.TASK_GEN,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('DevPlan mode execution error:', error);

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
    // Check if development plan was created
    if (result.artifacts.length === 0) {
      logger.error('DevPlan mode validation failed: No artifacts generated');
      return false;
    }

    // Check for tasks-index.json files
    const hasBackendIndex = result.artifacts.some(
      (f) => f.includes('backend') && f.endsWith('tasks-index.json')
    );
    const hasFrontendIndex = result.artifacts.some(
      (f) => f.includes('frontend') && f.endsWith('tasks-index.json')
    );

    if (!hasBackendIndex && !hasFrontendIndex) {
      logger.error(
        'DevPlan mode validation failed: No tasks-index.json files found'
      );
      return false;
    }

    // Validate tasks-index.json structure
    for (const artifact of result.artifacts) {
      if (artifact.endsWith('tasks-index.json')) {
        try {
          const content = await fs.readFile(artifact, 'utf-8');
          const tasksData = JSON.parse(content);

          if (!tasksData.layers || typeof tasksData.layers !== 'object') {
            logger.error(
              'DevPlan mode validation failed: Invalid tasks-index.json structure',
              { artifact }
            );
            return false;
          }
        } catch (error) {
          logger.error(
            'DevPlan mode validation failed: Cannot parse tasks-index.json',
            { artifact, error }
          );
          return false;
        }
      }
    }

    logger.info('DevPlan mode validation passed');
    return true;
  }

  private buildPrompt(
    input: string,
    archDir: string,
    devTasksDir: string
  ): string {
    return `You are a technical lead. Based on the architecture documents, create a detailed development plan with tasks organized in a DAG (Directed Acyclic Graph) structure.

Architecture documents are in: ${archDir}/

Please create development plan in: ${devTasksDir}/

The plan should include:
1. **Task Breakdown**: Break down the implementation into granular tasks
2. **DAG Structure**: Organize tasks in layers with dependencies
3. **Task Dependencies**: Define which tasks depend on others
4. **Estimated Complexity**: Rate each task (Low, Medium, High)
5. **Implementation Order**: Layer-by-layer execution order
6. **Development Plan Document**: High-level overview of the plan

Create the following files:
- ${devTasksDir}/backend/tasks-index.json (DAG structure for backend tasks)
- ${devTasksDir}/frontend/tasks-index.json (DAG structure for frontend tasks)
- ${devTasksDir}/backend/backend-development-plan.md (Backend plan overview)
- ${devTasksDir}/frontend/frontend-development-plan.md (Frontend plan overview)

The tasks-index.json files should follow this structure:
\`\`\`json
{
  "project_type": "backend|frontend",
  "version": "1.0",
  "total_tasks": 0,
  "total_layers": 0,
  "layers": {
    "0": {
      "layer_num": 0,
      "depends_on": [],
      "tasks": [
        {
          "id": "0.1",
          "name": "Task name",
          "description": "Task description",
          "dependencies": [],
          "status": "pending"
        }
      ],
      "parallel": true,
      "status": "pending"
    }
  }
}
\`\`\`

${input ? `Additional requirements: ${input}` : ''}

Make the plan comprehensive, realistic, and executable. Each task should be clear and actionable.`;
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
