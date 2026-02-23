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
 * Loop Test Mode Handler
 * Runs tests in an agentic loop, fixing failures until all tests pass
 */
export class LoopTestModeHandler extends BaseModeHandler {
  private readonly MAX_ITERATIONS = 10;
  private readonly TEST_TIMEOUT = 300000; // 5 minutes per test run

  getModeName(): string {
    return WorkMode.LOOP_TEST;
  }

  async validatePreconditions(
    context: ModeExecutionContext
  ): Promise<boolean> {
    const { workingDir } = context;

    // Check if source code exists
    const backendSrcDir = path.join(workingDir, 'backend', 'src');
    const frontendSrcDir = path.join(workingDir, 'frontend', 'src');

    const hasBackend = await this.directoryExists(backendSrcDir);
    const hasFrontend = await this.directoryExists(frontendSrcDir);

    if (!hasBackend && !hasFrontend) {
      logger.error(
        'LoopTest mode precondition failed: No source code found',
        {
          backendSrcDir,
          frontendSrcDir,
        }
      );
      return false;
    }

    // Check if test configuration exists (optional but recommended)
    const backendPackageJson = path.join(workingDir, 'backend', 'package.json');
    const frontendPackageJson = path.join(workingDir, 'frontend', 'package.json');

    const hasBackendPackage = await this.fileExists(backendPackageJson);
    const hasFrontendPackage = await this.fileExists(frontendPackageJson);

    if (!hasBackendPackage && !hasFrontendPackage) {
      logger.warn(
        'LoopTest mode warning: No package.json found, tests may not be configured'
      );
    }

    logger.info('LoopTest mode: Preconditions met');
    return true;
  }

  async execute(
    input: string,
    context: ModeExecutionContext
  ): Promise<ModeExecutionResult> {
    const startTime = Date.now();
    logger.info('LoopTest mode: Starting execution', { input });

    try {
      const { workingDir } = context;
      let iteration = 0;
      let allTestsPassed = false;
      const fixLog: string[] = [];
      const artifacts: string[] = [];

      while (iteration < this.MAX_ITERATIONS && !allTestsPassed) {
        iteration++;
        logger.info(`LoopTest iteration ${iteration}/${this.MAX_ITERATIONS}`);

        // Build prompt for this iteration
        const prompt = this.buildPrompt(
          input,
          workingDir,
          iteration,
          fixLog
        );

        // Execute using Claude Code Executor
        const executionOptions: ExecutionOptions = {
          taskId: `loop-test-${iteration}-${Date.now()}`,
          workingDir,
          timeout: this.TEST_TIMEOUT,
          maxRetries: 1,
          onProgress: (output: string) => {
            logger.debug(`LoopTest iteration ${iteration} progress:`, {
              length: output.length,
            });
          },
        };

        const executionResult = await claudeCodeExecutor.execute(
          prompt,
          executionOptions
        );

        // Log this iteration
        fixLog.push(
          `\n--- Iteration ${iteration} ---\nOutput: ${executionResult.output}\nSuccess: ${executionResult.success}`
        );

        // Check if tests passed
        if (executionResult.success) {
          const testsPassed = this.checkTestResults(executionResult.output);

          if (testsPassed) {
            allTestsPassed = true;
            logger.info(
              `All tests passed after ${iteration} iteration(s)`
            );
          } else {
            logger.info(
              `Iteration ${iteration}: Tests still failing, will retry`
            );
          }
        } else {
          logger.warn(`Iteration ${iteration}: Execution failed`, {
            error: executionResult.error,
          });
        }

        // Collect artifacts from modified files
        const iterationArtifacts = await this.extractModifiedFiles(workingDir);
        artifacts.push(...iterationArtifacts);

        // Small delay between iterations to avoid overwhelming the system
        if (!allTestsPassed && iteration < this.MAX_ITERATIONS) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      const duration = Date.now() - startTime;

      if (allTestsPassed) {
        logger.info('LoopTest mode completed successfully', {
          duration,
          iterations: iteration,
        });

        return {
          success: true,
          output: fixLog.join('\n'),
          artifacts: [...new Set(artifacts)],
          nextMode: WorkMode.DEPLOY,
          duration,
        };
      } else {
        logger.error(
          `LoopTest mode failed: Tests did not pass after ${iteration} iterations`
        );

        return {
          success: false,
          output: fixLog.join('\n'),
          artifacts: [...new Set(artifacts)],
          error: `Tests did not pass after ${iteration} iterations`,
          duration,
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('LoopTest mode execution error:', error);

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
    // Check if tests passed
    if (!result.success) {
      logger.error('LoopTest mode validation failed: Execution failed');
      return false;
    }

    // Check output for test success indicators
    const testsPassed = this.checkTestResults(result.output);

    if (!testsPassed) {
      logger.error('LoopTest mode validation failed: Tests did not pass');
      return false;
    }

    logger.info('LoopTest mode validation passed');
    return true;
  }

  private buildPrompt(
    input: string,
    workingDir: string,
    iteration: number,
    previousLog: string[]
  ): string {
    const previousContext =
      iteration > 1
        ? `\n\nPrevious attempts:\n${previousLog.slice(-2).join('\n')}`
        : '';

    return `You are a QA engineer running tests and fixing issues in an agentic loop.

Iteration: ${iteration}/${this.MAX_ITERATIONS}
Working Directory: ${workingDir}

Task: ${input || 'Run all tests and fix any failures'}

Instructions:
1. **Run Tests**: Execute the test suite (npm test or yarn test)
2. **Analyze Failures**: Carefully read any error messages or failed test outputs
3. **Fix Issues**: Modify the code to fix the failing tests
4. **Re-run Tests**: Run tests again to verify the fixes
5. **Report Results**: Provide a clear summary of what was fixed

Continue until all tests pass or you've exhausted reasonable fixes.

${previousContext}

Current iteration ${iteration}:
- Run the tests
- If there are failures, fix them
- Re-run to verify
- Provide a summary of changes made

Important:
- Focus on fixing actual bugs, not just making tests pass
- Maintain code quality and best practices
- Add proper error handling
- Ensure TypeScript types are correct
- Follow the existing code style

Run the tests now and report the results.`;
  }

  private checkTestResults(output: string): boolean {
    // Check for common test success patterns
    const successPatterns = [
      /all tests? passed/i,
      /\d+ passing/i,
      /test suite passed/i,
      /✓.*tests?.*passed/i,
      /0 failed/i,
    ];

    // Check for failure patterns
    const failurePatterns = [
      /\d+ failing/i,
      /test suite failed/i,
      /✗.*failed/i,
      /error:/i,
      /failed.*tests?/i,
    ];

    const hasSuccess = successPatterns.some((pattern) =>
      pattern.test(output)
    );
    const hasFailure = failurePatterns.some((pattern) =>
      pattern.test(output)
    );

    // Consider tests passed if we see success indicators and no failure indicators
    return hasSuccess && !hasFailure;
  }

  private async extractModifiedFiles(
    workingDir: string
  ): Promise<string[]> {
    const artifacts: string[] = [];

    try {
      // Get recently modified source files
      const backendSrc = path.join(workingDir, 'backend', 'src');
      const frontendSrc = path.join(workingDir, 'frontend', 'src');
      const backendTests = path.join(workingDir, 'backend', 'tests');
      const frontendTests = path.join(workingDir, 'frontend', 'tests');

      for (const dir of [backendSrc, frontendSrc, backendTests, frontendTests]) {
        if (await this.directoryExists(dir)) {
          const files = await this.getFilesInDirectory(dir);
          artifacts.push(...files.slice(0, 20)); // Limit per directory
        }
      }
    } catch (error) {
      logger.warn('Error extracting modified files:', error);
    }

    return artifacts;
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
