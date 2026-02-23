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
 * Deploy Mode Handler
 * Prepares the application for deployment (Docker, CI/CD, deployment scripts)
 */
export class DeployModeHandler extends BaseModeHandler {
  getModeName(): string {
    return WorkMode.DEPLOY;
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
      logger.error('Deploy mode precondition failed: No source code found', {
        backendSrcDir,
        frontendSrcDir,
      });
      return false;
    }

    // Optionally check if tests exist and passed (this is a simplified check)
    // In production, you'd want to verify test results more thoroughly
    logger.info('Deploy mode: Preconditions met');
    return true;
  }

  async execute(
    input: string,
    context: ModeExecutionContext
  ): Promise<ModeExecutionResult> {
    const startTime = Date.now();
    logger.info('Deploy mode: Starting execution', { input });

    try {
      const { workingDir } = context;

      // Build prompt for Claude
      const prompt = this.buildPrompt(input, workingDir);

      // Execute using Claude Code Executor
      const executionOptions: ExecutionOptions = {
        taskId: `deploy-${Date.now()}`,
        workingDir,
        timeout: 600000, // 10 minutes
        maxRetries: 2,
        onProgress: (output: string) => {
          logger.debug('Deploy mode progress:', { length: output.length });
        },
      };

      const executionResult = await claudeCodeExecutor.execute(
        prompt,
        executionOptions
      );

      if (!executionResult.success) {
        logger.error('Deploy mode execution failed', {
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

      // Extract deployment artifacts
      const artifacts = await this.extractDeploymentArtifacts(workingDir);

      const duration = Date.now() - startTime;

      logger.info('Deploy mode completed successfully', {
        duration,
        artifacts: artifacts.length,
      });

      return {
        success: true,
        output: executionResult.output,
        artifacts,
        nextMode: undefined, // Deploy is the final mode
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Deploy mode execution error:', error);

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
    // Check if deployment files were created
    if (result.artifacts.length === 0) {
      logger.error('Deploy mode validation failed: No artifacts generated');
      return false;
    }

    // Check for essential deployment files
    const hasDockerfile = result.artifacts.some((f) =>
      f.endsWith('Dockerfile')
    );
    const hasDockerCompose = result.artifacts.some((f) =>
      f.endsWith('docker-compose.yml')
    );

    if (!hasDockerfile && !hasDockerCompose) {
      logger.warn(
        'Deploy mode validation warning: No Docker files found'
      );
    }

    // At least some deployment configuration should exist
    const hasDeploymentConfig = result.artifacts.some(
      (f) =>
        f.includes('Dockerfile') ||
        f.includes('docker-compose') ||
        f.includes('.yml') ||
        f.includes('.yaml') ||
        f.includes('deploy')
    );

    if (!hasDeploymentConfig) {
      logger.error(
        'Deploy mode validation failed: No deployment configuration found'
      );
      return false;
    }

    logger.info('Deploy mode validation passed', {
      hasDockerfile,
      hasDockerCompose,
    });
    return true;
  }

  private buildPrompt(input: string, workingDir: string): string {
    return `You are a DevOps engineer. Prepare the application for production deployment.

Working Directory: ${workingDir}

Task: ${input || 'Prepare deployment configuration'}

Please create the following deployment artifacts:

1. **Docker Configuration**:
   - Dockerfile for backend (${workingDir}/backend/Dockerfile)
   - Dockerfile for frontend (${workingDir}/frontend/Dockerfile)
   - docker-compose.yml for local development (${workingDir}/docker-compose.yml)
   - docker-compose.prod.yml for production (${workingDir}/docker-compose.prod.yml)
   - .dockerignore files

2. **CI/CD Configuration** (choose one or more):
   - GitHub Actions (.github/workflows/ci.yml, .github/workflows/deploy.yml)
   - GitLab CI (.gitlab-ci.yml)
   - Other CI/CD as needed

3. **Deployment Scripts**:
   - deploy.sh (deployment script)
   - start.sh (startup script)
   - stop.sh (shutdown script)

4. **Production Configuration**:
   - Environment variable templates (.env.example)
   - Production environment config
   - Security configuration
   - Monitoring setup (optional)

5. **Documentation**:
   - DEPLOYMENT.md (deployment guide)
   - Update README.md with deployment instructions

Requirements:
- Use multi-stage Docker builds for optimization
- Include health checks in Docker containers
- Set up proper environment variable management
- Configure NGINX or reverse proxy if needed
- Include database migration scripts
- Set up logging and monitoring
- Follow security best practices
- Include backup and rollback strategies

Make everything production-ready and well-documented. Use best practices for:
- Container security
- Resource limits
- Network configuration
- Volume management
- Secrets management
- SSL/TLS configuration (if applicable)

Create all necessary files and provide a comprehensive deployment guide.`;
  }

  private async extractDeploymentArtifacts(
    workingDir: string
  ): Promise<string[]> {
    const artifacts: string[] = [];

    // Common deployment file names
    const deploymentFiles = [
      'Dockerfile',
      'docker-compose.yml',
      'docker-compose.prod.yml',
      '.dockerignore',
      'deploy.sh',
      'start.sh',
      'stop.sh',
      '.env.example',
      'DEPLOYMENT.md',
      'nginx.conf',
    ];

    // Check root directory
    for (const fileName of deploymentFiles) {
      const filePath = path.join(workingDir, fileName);
      if (await this.fileExists(filePath)) {
        artifacts.push(filePath);
      }
    }

    // Check backend and frontend directories
    for (const subDir of ['backend', 'frontend']) {
      const subDirPath = path.join(workingDir, subDir);
      if (await this.directoryExists(subDirPath)) {
        for (const fileName of deploymentFiles) {
          const filePath = path.join(subDirPath, fileName);
          if (await this.fileExists(filePath)) {
            artifacts.push(filePath);
          }
        }
      }
    }

    // Check CI/CD directories
    const cicdDirs = [
      '.github/workflows',
      '.gitlab',
      '.circleci',
      '.jenkins',
    ];

    for (const cicdDir of cicdDirs) {
      const cicdPath = path.join(workingDir, cicdDir);
      if (await this.directoryExists(cicdPath)) {
        const cicdFiles = await this.getFilesInDirectory(cicdPath);
        artifacts.push(...cicdFiles);
      }
    }

    // Check for deployment documentation
    const docsFiles = ['DEPLOYMENT.md', 'docs/deployment.md'];
    for (const docFile of docsFiles) {
      const docPath = path.join(workingDir, docFile);
      if (await this.fileExists(docPath)) {
        artifacts.push(docPath);
      }
    }

    logger.debug(`Found ${artifacts.length} deployment artifacts`);
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
