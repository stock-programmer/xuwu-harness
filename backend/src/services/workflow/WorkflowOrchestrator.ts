import { promises as fs } from 'fs';
import path from 'path';
import logger from '../../utils/logger';
import { claudeCodeExecutor } from '../ClaudeCodeExecutor';
import {
  WorkMode,
  ModeExecutionResult,
  ProjectProgress,
} from '../../types/workflow.types';
import { ExecutionOptions } from '../../types/executor.types';

/**
 * Mode Execution Context
 */
interface ModeExecutionContext {
  mode: WorkMode;
  input: string;
  workingDir: string;
  previousArtifacts: string[];
  projectContext: Record<string, any>;
}

/**
 * Mode Precondition Validation Result
 */
interface ValidationResult {
  valid: boolean;
  error?: string;
  missingFiles?: string[];
}

/**
 * Workflow Orchestrator
 * Manages 7 work modes and orchestrates their execution
 */
export class WorkflowOrchestrator {
  private currentMode: WorkMode = WorkMode.PRD;
  private modeHistory: WorkMode[] = [];
  private projectDir: string;
  private contextDir: string;

  constructor(projectDir: string = process.cwd()) {
    this.projectDir = projectDir;
    this.contextDir = path.join(projectDir, 'context');
  }

  /**
   * Get current work mode
   */
  getCurrentMode(): WorkMode {
    return this.currentMode;
  }

  /**
   * Get mode history
   */
  getModeHistory(): WorkMode[] {
    return [...this.modeHistory];
  }

  /**
   * Switch to a different work mode
   */
  async switchMode(mode: WorkMode): Promise<void> {
    logger.info(`Switching mode from ${this.currentMode} to ${mode}`);

    // Validate the transition
    const canSwitch = await this.validateModeTransition(this.currentMode, mode);
    if (!canSwitch.valid) {
      throw new Error(
        `Cannot switch to ${mode}: ${canSwitch.error || 'Invalid transition'}`
      );
    }

    this.modeHistory.push(this.currentMode);
    this.currentMode = mode;

    logger.info(`Mode switched to ${mode}`);
  }

  /**
   * Execute the current mode
   */
  async executeMode(
    mode: WorkMode,
    input: string,
    options?: {
      onProgress?: (output: string) => void;
      onError?: (error: Error) => void;
    }
  ): Promise<ModeExecutionResult> {
    const startTime = Date.now();

    logger.info(`Starting execution of mode: ${mode}`, { input, projectDir: this.projectDir });

    try {
      // 0. Ensure project directory exists
      try {
        await fs.mkdir(this.projectDir, { recursive: true });
        logger.info(`Project directory ensured: ${this.projectDir}`);
      } catch (error) {
        logger.error(`Failed to create project directory: ${this.projectDir}`, error);
        return {
          success: false,
          output: '',
          artifacts: [],
          error: `Failed to create project directory: ${error instanceof Error ? error.message : String(error)}`,
        };
      }

      // 1. Validate mode preconditions
      const validation = await this.validateModePreconditions(mode);
      if (!validation.valid) {
        logger.error(`Mode precondition validation failed for ${mode}`, {
          error: validation.error,
          missingFiles: validation.missingFiles,
        });
        return {
          success: false,
          output: '',
          artifacts: [],
          error: validation.error || 'Precondition validation failed',
        };
      }

      // 2. Prepare execution context
      const context = await this.prepareExecutionContext(mode, input);

      // 3. Build mode-specific prompt
      const prompt = await this.buildModePrompt(mode, context);

      // 4. Execute using Claude Code Executor
      const executionOptions: ExecutionOptions = {
        taskId: `${mode}-${Date.now()}`,
        workingDir: this.projectDir,
        timeout: 600000, // 10 minutes
        maxRetries: 2,
        onProgress: (output: string) => {
          logger.debug(`Mode ${mode} progress:`, { length: output.length });
          // Call external progress callback if provided
          if (options?.onProgress) {
            options.onProgress(output);
          }
        },
        onError: (error: Error) => {
          logger.error(`Mode ${mode} error:`, error);
          // Call external error callback if provided
          if (options?.onError) {
            options.onError(error);
          }
        },
      };

      const executionResult = await claudeCodeExecutor.execute(
        prompt,
        executionOptions
      );

      if (!executionResult.success) {
        logger.error(`Mode ${mode} execution failed`, {
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

      // 5. Extract artifacts
      const artifacts = await this.extractArtifacts(mode, executionResult.output);

      // 6. Validate mode output
      const outputValidation = await this.validateModeOutput(mode, artifacts);
      if (!outputValidation.valid) {
        logger.warn(`Mode ${mode} output validation failed`, {
          error: outputValidation.error,
        });
        return {
          success: false,
          output: executionResult.output,
          artifacts,
          error: `Output validation failed: ${outputValidation.error}`,
          duration: Date.now() - startTime,
        };
      }

      // 7. Determine next mode
      const nextMode = this.getNextMode(mode);

      const duration = Date.now() - startTime;

      logger.info(`Mode ${mode} completed successfully`, {
        duration,
        artifacts: artifacts.length,
        nextMode,
      });

      return {
        success: true,
        output: executionResult.output,
        artifacts,
        nextMode,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Mode ${mode} execution error:`, error);

      return {
        success: false,
        output: '',
        artifacts: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      };
    }
  }

  /**
   * Validate mode preconditions
   */
  private async validateModePreconditions(
    mode: WorkMode
  ): Promise<ValidationResult> {
    const missingFiles: string[] = [];

    switch (mode) {
      case WorkMode.PRD:
        // No preconditions for PRD mode
        return { valid: true };

      case WorkMode.ARCHITECTURE:
        // Requires PRD document
        const prdPath = path.join(this.contextDir, 'prd', 'prd.md');
        if (!(await this.fileExists(prdPath))) {
          missingFiles.push(prdPath);
          return {
            valid: false,
            error: 'PRD document not found. Please complete PRD mode first.',
            missingFiles,
          };
        }
        return { valid: true };

      case WorkMode.DEV_PLAN:
        // Requires architecture documents
        const archDir = path.join(this.contextDir, 'architecture');
        if (!(await this.directoryExists(archDir))) {
          missingFiles.push(archDir);
          return {
            valid: false,
            error: 'Architecture documents not found. Please complete ARCHITECTURE mode first.',
            missingFiles,
          };
        }
        return { valid: true };

      case WorkMode.TASK_GEN:
        // Requires dev plan
        const devPlanDir = path.join(this.contextDir, 'dev-tasks');
        if (!(await this.directoryExists(devPlanDir))) {
          missingFiles.push(devPlanDir);
          return {
            valid: false,
            error: 'Development plan not found. Please complete DEV_PLAN mode first.',
            missingFiles,
          };
        }
        return { valid: true };

      case WorkMode.TASK_EXEC:
        // Requires task index
        const taskIndexPath = path.join(
          this.contextDir,
          'dev-tasks',
          'backend',
          'tasks-index.json'
        );
        if (!(await this.fileExists(taskIndexPath))) {
          missingFiles.push(taskIndexPath);
          return {
            valid: false,
            error: 'Task index not found. Please complete TASK_GEN mode first.',
            missingFiles,
          };
        }
        return { valid: true };

      case WorkMode.LOOP_TEST:
        // Requires code to be implemented
        const srcDir = path.join(this.projectDir, 'src');
        if (!(await this.directoryExists(srcDir))) {
          missingFiles.push(srcDir);
          return {
            valid: false,
            error: 'Source code not found. Please complete TASK_EXEC mode first.',
            missingFiles,
          };
        }
        return { valid: true };

      case WorkMode.DEPLOY:
        // Requires tests to pass
        // This is a simplified check - in production, you'd check test results
        return { valid: true };

      default:
        return {
          valid: false,
          error: `Unknown mode: ${mode}`,
        };
    }
  }

  /**
   * Validate mode transition
   */
  private async validateModeTransition(
    from: WorkMode,
    to: WorkMode
  ): Promise<ValidationResult> {
    // Allow manual transitions to any mode
    // In a stricter implementation, you might enforce the state machine
    logger.debug(`Validating transition from ${from} to ${to}`);
    return { valid: true };
  }

  /**
   * Prepare execution context for a mode
   */
  private async prepareExecutionContext(
    mode: WorkMode,
    input: string
  ): Promise<ModeExecutionContext> {
    const previousArtifacts: string[] = [];

    // Collect artifacts from previous modes
    switch (mode) {
      case WorkMode.ARCHITECTURE:
        const prdPath = path.join(this.contextDir, 'prd', 'prd.md');
        if (await this.fileExists(prdPath)) {
          previousArtifacts.push(prdPath);
        }
        break;

      case WorkMode.DEV_PLAN:
        const archDir = path.join(this.contextDir, 'architecture');
        if (await this.directoryExists(archDir)) {
          const archFiles = await this.getFilesInDirectory(archDir);
          previousArtifacts.push(...archFiles);
        }
        break;

      case WorkMode.TASK_GEN:
        const devPlanDir = path.join(this.contextDir, 'dev-tasks');
        if (await this.directoryExists(devPlanDir)) {
          const devPlanFiles = await this.getFilesInDirectory(devPlanDir);
          previousArtifacts.push(...devPlanFiles);
        }
        break;

      // Add more cases as needed
    }

    return {
      mode,
      input,
      workingDir: this.projectDir,
      previousArtifacts,
      projectContext: {
        projectDir: this.projectDir,
        contextDir: this.contextDir,
      },
    };
  }

  /**
   * Build mode-specific Claude prompt
   */
  private async buildModePrompt(
    mode: WorkMode,
    context: ModeExecutionContext
  ): Promise<string> {
    const { input, previousArtifacts } = context;

    let prompt = '';

    switch (mode) {
      case WorkMode.PRD:
        prompt = `You are a product requirements expert. Create a comprehensive PRD (Product Requirements Document) for: ${input}

Please create the PRD document at: context/prd/prd.md

The PRD should include:
1. Product Overview
2. Goals and Objectives
3. User Stories
4. Functional Requirements
5. Non-Functional Requirements
6. Technical Constraints
7. Success Metrics

Make it detailed and clear.`;
        break;

      case WorkMode.ARCHITECTURE:
        prompt = `You are a software architect. Based on the PRD document, create a detailed system architecture.

PRD is located at: ${previousArtifacts[0] || 'context/prd/prd.md'}

Please create architecture documents in: context/architecture/

The architecture should include:
1. System Overview
2. Component Design
3. Data Models
4. API Design
5. Technology Stack
6. Deployment Architecture

Create separate documents for backend and frontend architecture.`;
        break;

      case WorkMode.DEV_PLAN:
        prompt = `You are a technical lead. Based on the architecture documents, create a detailed development plan with tasks.

Architecture documents are in: ${context.projectContext.contextDir}/architecture/

Please create development plan in: context/dev-tasks/

The plan should include:
1. Task breakdown (DAG structure)
2. Task dependencies
3. Estimated complexity
4. Implementation order

Create a tasks-index.json file with the DAG structure.`;
        break;

      case WorkMode.TASK_GEN:
        prompt = `You are a senior developer. Based on the development plan, generate detailed task implementation guides.

Development plan is in: ${context.projectContext.contextDir}/dev-tasks/

For each task in the tasks-index.json, create detailed markdown files with:
1. Task objectives
2. Implementation steps
3. Code examples
4. Testing criteria
5. Claude execution prompts

User input: ${input}`;
        break;

      case WorkMode.TASK_EXEC:
        prompt = `You are now executing development tasks.

Task: ${input}

Read the task file and implement it according to the specifications.
Follow the implementation steps carefully.
Ensure all code is production-ready and follows best practices.`;
        break;

      case WorkMode.LOOP_TEST:
        prompt = `You are a QA engineer running tests and fixing issues in an agentic loop.

Task: ${input}

1. Run all tests
2. Identify failures
3. Fix the issues
4. Re-run tests
5. Repeat until all tests pass

Continue the loop until the test suite is green.`;
        break;

      case WorkMode.DEPLOY:
        prompt = `You are a DevOps engineer. Prepare the application for deployment.

Task: ${input}

1. Create Dockerfile
2. Create docker-compose.yml
3. Setup CI/CD configuration
4. Create deployment scripts
5. Document deployment process

Ensure everything is production-ready.`;
        break;

      default:
        prompt = `Execute task for mode ${mode}: ${input}`;
    }

    return prompt;
  }

  /**
   * Extract artifacts (files) created by mode execution
   */
  private async extractArtifacts(
    mode: WorkMode,
    output: string
  ): Promise<string[]> {
    const artifacts: string[] = [];

    // Based on the mode, check expected output locations
    switch (mode) {
      case WorkMode.PRD:
        const prdPath = path.join(this.contextDir, 'prd', 'prd.md');
        if (await this.fileExists(prdPath)) {
          artifacts.push(prdPath);
        }
        break;

      case WorkMode.ARCHITECTURE:
        const archDir = path.join(this.contextDir, 'architecture');
        if (await this.directoryExists(archDir)) {
          const archFiles = await this.getFilesInDirectory(archDir);
          artifacts.push(...archFiles);
        }
        break;

      case WorkMode.DEV_PLAN:
      case WorkMode.TASK_GEN:
        const devTasksDir = path.join(this.contextDir, 'dev-tasks');
        if (await this.directoryExists(devTasksDir)) {
          const taskFiles = await this.getFilesInDirectory(devTasksDir);
          artifacts.push(...taskFiles);
        }
        break;

      case WorkMode.TASK_EXEC:
        // Extract file paths from output or check src directory
        const srcDir = path.join(this.projectDir, 'src');
        if (await this.directoryExists(srcDir)) {
          const srcFiles = await this.getFilesInDirectory(srcDir);
          artifacts.push(...srcFiles.slice(0, 100)); // Limit for performance
        }
        break;

      case WorkMode.LOOP_TEST:
        // Check for test reports
        const testReportPath = path.join(this.projectDir, 'test-results');
        if (await this.directoryExists(testReportPath)) {
          const testFiles = await this.getFilesInDirectory(testReportPath);
          artifacts.push(...testFiles);
        }
        break;

      case WorkMode.DEPLOY:
        // Check for deployment files
        const deploymentFiles = [
          'Dockerfile',
          'docker-compose.yml',
          '.dockerignore',
          'deploy.sh',
        ];
        for (const file of deploymentFiles) {
          const filePath = path.join(this.projectDir, file);
          if (await this.fileExists(filePath)) {
            artifacts.push(filePath);
          }
        }
        break;
    }

    logger.debug(`Extracted ${artifacts.length} artifacts for mode ${mode}`);
    return artifacts;
  }

  /**
   * Validate mode output
   */
  private async validateModeOutput(
    mode: WorkMode,
    artifacts: string[]
  ): Promise<ValidationResult> {
    if (artifacts.length === 0) {
      return {
        valid: false,
        error: `No artifacts generated for mode ${mode}`,
      };
    }

    // Mode-specific validation
    switch (mode) {
      case WorkMode.PRD:
        if (!artifacts.some((f) => f.endsWith('prd.md'))) {
          return {
            valid: false,
            error: 'PRD document (prd.md) not found in artifacts',
          };
        }
        break;

      case WorkMode.ARCHITECTURE:
        if (!artifacts.some((f) => f.includes('architecture'))) {
          return {
            valid: false,
            error: 'Architecture documents not found in artifacts',
          };
        }
        break;

      case WorkMode.DEV_PLAN:
      case WorkMode.TASK_GEN:
        if (!artifacts.some((f) => f.endsWith('tasks-index.json'))) {
          return {
            valid: false,
            error: 'tasks-index.json not found in artifacts',
          };
        }
        break;

      // Add more validations as needed
    }

    return { valid: true };
  }

  /**
   * Determine the next mode based on current mode
   */
  private getNextMode(currentMode: WorkMode): WorkMode | undefined {
    const modeSequence: WorkMode[] = [
      WorkMode.PRD,
      WorkMode.ARCHITECTURE,
      WorkMode.DEV_PLAN,
      WorkMode.TASK_GEN,
      WorkMode.TASK_EXEC,
      WorkMode.LOOP_TEST,
      WorkMode.DEPLOY,
    ];

    const currentIndex = modeSequence.indexOf(currentMode);
    if (currentIndex !== -1 && currentIndex < modeSequence.length - 1) {
      return modeSequence[currentIndex + 1];
    }

    return undefined;
  }

  /**
   * Get project progress
   */
  async getProjectProgress(): Promise<ProjectProgress> {
    // This is a simplified implementation
    // In a real system, you'd query the database for task progress
    return {
      currentMode: this.currentMode,
      totalTasks: 0,
      completedTasks: 0,
      currentLayer: 0,
      totalLayers: 0,
      percentage: 0,
    };
  }

  // Helper methods

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

// Export singleton instance
export const workflowOrchestrator = new WorkflowOrchestrator();
