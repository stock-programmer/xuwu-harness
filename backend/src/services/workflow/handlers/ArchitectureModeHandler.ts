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
 * Architecture Mode Handler
 * Generates system architecture documents based on PRD
 */
export class ArchitectureModeHandler extends BaseModeHandler {
  getModeName(): string {
    return WorkMode.ARCHITECTURE;
  }

  async validatePreconditions(
    context: ModeExecutionContext
  ): Promise<boolean> {
    const { workingDir, projectContext } = context;
    const contextDir = projectContext.contextDir || path.join(workingDir, 'context');
    const prdPath = path.join(contextDir, 'prd', 'prd.md');

    if (!(await this.fileExists(prdPath))) {
      logger.error('Architecture mode precondition failed: PRD not found', {
        prdPath,
      });
      return false;
    }

    logger.info('Architecture mode: Preconditions met');
    return true;
  }

  async execute(
    input: string,
    context: ModeExecutionContext
  ): Promise<ModeExecutionResult> {
    const startTime = Date.now();
    logger.info('Architecture mode: Starting execution', { input });

    try {
      const { workingDir, projectContext, previousArtifacts } = context;
      const contextDir = projectContext.contextDir || path.join(workingDir, 'context');
      const archDir = path.join(contextDir, 'architecture');
      const prdPath = path.join(contextDir, 'prd', 'prd.md');

      // Ensure architecture directory exists
      await fs.mkdir(archDir, { recursive: true });

      // Build prompt for Claude
      const prompt = this.buildPrompt(input, prdPath, archDir);

      // Execute using Claude Code Executor
      const executionOptions: ExecutionOptions = {
        taskId: `architecture-${Date.now()}`,
        workingDir,
        timeout: 600000, // 10 minutes
        maxRetries: 2,
        onProgress: (output: string) => {
          logger.debug('Architecture mode progress:', { length: output.length });
        },
      };

      const executionResult = await claudeCodeExecutor.execute(
        prompt,
        executionOptions
      );

      if (!executionResult.success) {
        logger.error('Architecture mode execution failed', {
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
      const artifacts = await this.getFilesInDirectory(archDir);

      const duration = Date.now() - startTime;

      logger.info('Architecture mode completed successfully', {
        duration,
        artifacts: artifacts.length,
      });

      return {
        success: true,
        output: executionResult.output,
        artifacts,
        nextMode: WorkMode.DEV_PLAN,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Architecture mode execution error:', error);

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
    // Check if architecture documents were created
    if (result.artifacts.length === 0) {
      logger.error('Architecture mode validation failed: No artifacts generated');
      return false;
    }

    if (!result.artifacts.some((f) => f.includes('architecture'))) {
      logger.error(
        'Architecture mode validation failed: No architecture files found'
      );
      return false;
    }

    // Check for expected architecture documents
    const hasBackendArch = result.artifacts.some(
      (f) => f.includes('backend') && f.endsWith('.md')
    );
    const hasFrontendArch = result.artifacts.some(
      (f) => f.includes('frontend') && f.endsWith('.md')
    );

    if (!hasBackendArch && !hasFrontendArch) {
      logger.warn(
        'Architecture mode validation warning: No backend or frontend architecture docs found'
      );
    }

    logger.info('Architecture mode validation passed');
    return true;
  }

  private buildPrompt(
    input: string,
    prdPath: string,
    archDir: string
  ): string {
    return `You are a software architect. Based on the PRD document, create a detailed system architecture.

PRD is located at: ${prdPath}

Please create architecture documents in: ${archDir}/

The architecture should include:
1. **System Overview**: High-level system design and component interaction
2. **Component Design**: Detailed design of major components
3. **Data Models**: Database schema and data structures
4. **API Design**: RESTful API endpoints and WebSocket events
5. **Technology Stack**: Languages, frameworks, libraries, and tools
6. **Deployment Architecture**: Infrastructure and deployment strategy

Create separate documents for:
- Backend Architecture (${archDir}/backend-architecture.md)
- Frontend Architecture (${archDir}/frontend-architecture.md)
- Data Model (${archDir}/data-model.md)
- API Specification (${archDir}/api-spec.md)

${input ? `Additional requirements: ${input}` : ''}

Make the architecture comprehensive and production-ready. Use proper markdown formatting and include diagrams where appropriate (using Mermaid syntax).`;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
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
