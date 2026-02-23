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
 * PRD Mode Handler
 * Generates Product Requirements Document (PRD) based on user input
 */
export class PRDModeHandler extends BaseModeHandler {
  getModeName(): string {
    return WorkMode.PRD;
  }

  async validatePreconditions(
    context: ModeExecutionContext
  ): Promise<boolean> {
    // PRD mode has no preconditions - it's the first step
    logger.info('PRD mode: No preconditions required');
    return true;
  }

  async execute(
    input: string,
    context: ModeExecutionContext
  ): Promise<ModeExecutionResult> {
    const startTime = Date.now();
    logger.info('PRD mode: Starting execution', { input });

    try {
      const { workingDir, projectContext } = context;
      const contextDir = projectContext.contextDir || path.join(workingDir, 'context');
      const prdDir = path.join(contextDir, 'prd');

      // Ensure PRD directory exists
      await fs.mkdir(prdDir, { recursive: true });

      // Build prompt for Claude
      const prompt = this.buildPrompt(input, prdDir);

      // Execute using Claude Code Executor
      const executionOptions: ExecutionOptions = {
        taskId: `prd-${Date.now()}`,
        workingDir,
        timeout: 600000, // 10 minutes
        maxRetries: 2,
        onProgress: (output: string) => {
          logger.debug('PRD mode progress:', { length: output.length });
        },
      };

      const executionResult = await claudeCodeExecutor.execute(
        prompt,
        executionOptions
      );

      if (!executionResult.success) {
        logger.error('PRD mode execution failed', {
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
      const prdPath = path.join(prdDir, 'prd.md');
      const artifacts: string[] = [];

      if (await this.fileExists(prdPath)) {
        artifacts.push(prdPath);
      }

      const duration = Date.now() - startTime;

      logger.info('PRD mode completed successfully', {
        duration,
        artifacts: artifacts.length,
      });

      return {
        success: true,
        output: executionResult.output,
        artifacts,
        nextMode: WorkMode.ARCHITECTURE,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('PRD mode execution error:', error);

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
    // Check if PRD document was created
    if (result.artifacts.length === 0) {
      logger.error('PRD mode validation failed: No artifacts generated');
      return false;
    }

    if (!result.artifacts.some((f) => f.endsWith('prd.md'))) {
      logger.error('PRD mode validation failed: prd.md not found');
      return false;
    }

    // Check if the PRD file has content
    const prdPath = result.artifacts.find((f) => f.endsWith('prd.md'));
    if (prdPath) {
      try {
        const content = await fs.readFile(prdPath, 'utf-8');
        if (content.trim().length < 100) {
          logger.error('PRD mode validation failed: PRD file is too short');
          return false;
        }
      } catch (error) {
        logger.error('PRD mode validation failed: Cannot read PRD file', error);
        return false;
      }
    }

    logger.info('PRD mode validation passed');
    return true;
  }

  private buildPrompt(input: string, prdDir: string): string {
    return `You are a product requirements expert. Create a comprehensive PRD (Product Requirements Document) for: ${input}

Please create the PRD document at: ${prdDir}/prd.md

The PRD should include:
1. **Product Overview**: High-level description of the product
2. **Goals and Objectives**: What the product aims to achieve
3. **User Stories**: Key user scenarios and use cases
4. **Functional Requirements**: Detailed feature requirements
5. **Non-Functional Requirements**: Performance, security, scalability requirements
6. **Technical Constraints**: Technology limitations and dependencies
7. **Success Metrics**: How to measure success

Make the PRD detailed, clear, and comprehensive. Use proper markdown formatting.`;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
