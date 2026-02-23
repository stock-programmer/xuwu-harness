import { spawn, ChildProcess } from 'child_process';
import logger from '../utils/logger';
import { config } from '../config/env';
import {
  ExecutionOptions,
  ExecutionResult,
  ProcessInfo,
} from '../types/executor.types';

export class ClaudeCodeExecutor {
  private processPool: Map<string, ChildProcess> = new Map();
  private processInfo: Map<string, ProcessInfo> = new Map();
  private maxConcurrent: number = 10;
  private activeProcesses: number = 0;

  /**
   * Execute a Claude Code command with the given prompt
   */
  async execute(
    prompt: string,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const taskId = options.taskId || `task-${Date.now()}`;
    const maxRetries = options.maxRetries ?? 3;
    const timeout = options.timeout ?? config.claude.timeout;

    let retries = 0;
    let lastError: Error | null = null;

    logger.info(`Starting Claude Code execution for task: ${taskId}`, {
      prompt: prompt.substring(0, 100),
      maxRetries,
      timeout,
    });

    while (retries <= maxRetries) {
      try {
        // Check concurrent limit
        await this.waitForSlot();

        // Execute the command
        const result = await this.executeOnce(prompt, options, timeout);

        const duration = Date.now() - startTime;

        logger.info(`Task ${taskId} completed successfully`, {
          duration,
          retries,
        });

        return {
          success: true,
          output: result.output,
          exitCode: 0,
          duration,
          retries,
        };
      } catch (error) {
        lastError = error as Error;
        retries++;

        logger.warn(`Task ${taskId} failed (attempt ${retries}/${maxRetries})`, {
          error: lastError.message,
        });

        if (retries <= maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, retries - 1), 10000);
          logger.debug(`Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    // All retries exhausted
    const duration = Date.now() - startTime;

    logger.error(`Task ${taskId} failed after ${retries} attempts`, {
      error: lastError?.message,
      duration,
    });

    return {
      success: false,
      output: '',
      error: lastError?.message || 'Unknown error',
      exitCode: 1,
      duration,
      retries,
    };
  }

  /**
   * Execute the Claude Code command once
   */
  private async executeOnce(
    prompt: string,
    options: ExecutionOptions,
    timeout: number
  ): Promise<{ output: string }> {
    return new Promise((resolve, reject) => {
      const taskId = options.taskId || `task-${Date.now()}`;
      let output = '';
      let errorOutput = '';
      let lastOutputTime = Date.now();

      this.activeProcesses++;

      // Spawn Claude Code process with streaming output
      const childProcess = spawn('claude', [
        '--print',
        prompt,
        '--output-format',
        'text', // 使用简单的文本格式
        '--dangerously-skip-permissions',
        '--verbose', // 添加详细输出
      ], {
        cwd: options.workingDir || process.cwd(),
        env: {
          ...process.env,
          ...options.env,
          // Ensure Claude auth env vars are available
          ANTHROPIC_AUTH_TOKEN: process.env.ANTHROPIC_AUTH_TOKEN,
          ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL,
        },
        stdio: ['ignore', 'pipe', 'pipe'], // 关键修复：关闭 stdin
      });

      const processId = `${taskId}-${Date.now()}`;
      this.processPool.set(processId, childProcess);
      this.processInfo.set(processId, {
        id: processId,
        taskId,
        startTime: new Date(),
        status: 'running',
      });

      logger.debug(`Spawned process ${processId} for task ${taskId}`);

      // Immediately notify that the process has started
      if (options.onProgress) {
        try {
          options.onProgress(`[Claude Code] Process started (PID: ${processId})\nWaiting for Claude's response...\n`);
        } catch (err) {
          logger.error('Error in onProgress callback:', err);
        }
      }

      // 心跳检测：每10秒发送一次"Still running"消息
      const heartbeatInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - lastOutputTime) / 1000);
        if (options.onProgress && elapsed > 5) {
          try {
            options.onProgress(`[HEARTBEAT] Process still running... (${elapsed}s since last output)\n`);
          } catch (err) {
            logger.error('Error in heartbeat callback:', err);
          }
        }
      }, 10000); // 每10秒一次

      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        logger.error(`Task ${taskId} timed out after ${timeout}ms`);
        childProcess.kill('SIGTERM');

        // Force kill if still running after 5 seconds
        setTimeout(() => {
          if (!childProcess.killed) {
            logger.warn(`Force killing process ${processId}`);
            childProcess.kill('SIGKILL');
          }
        }, 5000);

        reject(new Error(`Execution timed out after ${timeout}ms`));
      }, timeout);

      // Capture stdout (text format)
      childProcess.stdout?.on('data', (data: Buffer) => {
        const text = data.toString();
        lastOutputTime = Date.now(); // 更新最后输出时间

        output += text;

        logger.debug(`Process ${processId} output:`, {
          length: text.length,
          preview: text.substring(0, 200),
        });

        // 直接发送文本到前端
        if (options.onProgress) {
          try {
            options.onProgress(text);
          } catch (err) {
            logger.error('Error in onProgress callback:', err);
          }
        }
      });

      // Capture stderr (也发送到前端，让用户看到Claude Code的调试信息)
      childProcess.stderr?.on('data', (data: Buffer) => {
        const text = data.toString();
        errorOutput += text;
        logger.warn(`Process ${processId} stderr:`, {
          text: text.substring(0, 200),
        });

        // 将stderr也发送到前端，但标记为调试信息
        if (options.onProgress) {
          try {
            options.onProgress(`[DEBUG] ${text}`);
          } catch (err) {
            logger.error('Error in onProgress callback for stderr:', err);
          }
        }
      });

      // Handle process exit
      childProcess.on('exit', (code, signal) => {
        clearTimeout(timeoutHandle);
        clearInterval(heartbeatInterval); // 清除心跳定时器
        this.activeProcesses--;
        this.processPool.delete(processId);

        const info = this.processInfo.get(processId);
        if (info) {
          info.status = code === 0 ? 'completed' : 'failed';
        }

        logger.debug(`Process ${processId} exited`, {
          code,
          signal,
          taskId,
        });

        if (code === 0) {
          resolve({ output });
        } else {
          const error = new Error(
            `Claude Code exited with code ${code}: ${errorOutput || 'No error output'}`
          );
          if (options.onError) {
            try {
              options.onError(error);
            } catch (err) {
              logger.error('Error in onError callback:', err);
            }
          }
          reject(error);
        }
      });

      // Handle process errors
      childProcess.on('error', (error) => {
        clearTimeout(timeoutHandle);
        clearInterval(heartbeatInterval); // 清除心跳定时器
        this.activeProcesses--;
        this.processPool.delete(processId);

        const info = this.processInfo.get(processId);
        if (info) {
          info.status = 'failed';
        }

        logger.error(`Process ${processId} error:`, error);

        if (options.onError) {
          try {
            options.onError(error);
          } catch (err) {
            logger.error('Error in onError callback:', err);
          }
        }

        reject(error);
      });
    });
  }

  /**
   * Wait for an available slot in the process pool
   */
  private async waitForSlot(): Promise<void> {
    while (this.activeProcesses >= this.maxConcurrent) {
      logger.debug(
        `Process pool full (${this.activeProcesses}/${this.maxConcurrent}), waiting...`
      );
      await this.sleep(1000);
    }
  }

  /**
   * Sleep for the given duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current process pool status
   */
  getPoolStatus(): {
    active: number;
    max: number;
    processes: ProcessInfo[];
  } {
    return {
      active: this.activeProcesses,
      max: this.maxConcurrent,
      processes: Array.from(this.processInfo.values()),
    };
  }

  /**
   * Check if Claude Code CLI is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const result = await this.executeOnce('--version', {}, 5000);
      return result.output.includes('claude');
    } catch (error) {
      logger.warn('Claude Code CLI not available:', error);
      return false;
    }
  }

  /**
   * Gracefully shutdown all running processes
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down Claude Code Executor...');

    const processes = Array.from(this.processPool.entries());

    if (processes.length === 0) {
      logger.info('No active processes to shutdown');
      return;
    }

    logger.info(`Terminating ${processes.length} active processes...`);

    // Send SIGTERM to all processes
    for (const [id, process] of processes) {
      logger.debug(`Sending SIGTERM to process ${id}`);
      process.kill('SIGTERM');
    }

    // Wait up to 10 seconds for graceful shutdown
    const shutdownTimeout = 10000;
    const startTime = Date.now();

    while (
      this.processPool.size > 0 &&
      Date.now() - startTime < shutdownTimeout
    ) {
      await this.sleep(500);
    }

    // Force kill any remaining processes
    if (this.processPool.size > 0) {
      logger.warn(
        `Force killing ${this.processPool.size} remaining processes`
      );

      for (const [id, process] of this.processPool.entries()) {
        logger.debug(`Sending SIGKILL to process ${id}`);
        process.kill('SIGKILL');
      }
    }

    this.processPool.clear();
    this.processInfo.clear();
    this.activeProcesses = 0;

    logger.info('Claude Code Executor shutdown complete');
  }
}

export const claudeCodeExecutor = new ClaudeCodeExecutor();
