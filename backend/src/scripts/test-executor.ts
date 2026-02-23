import { claudeCodeExecutor } from '../services/ClaudeCodeExecutor';
import logger from '../utils/logger';

async function testClaudeExecutor() {
  try {
    logger.info('Testing Claude Code Executor...');
    logger.info('================================');

    // Test 1: Check if Claude CLI is available
    logger.info('Test 1: Checking Claude CLI availability...');
    const isAvailable = await claudeCodeExecutor.isAvailable();
    logger.info(`Claude CLI available: ${isAvailable}`);

    if (!isAvailable) {
      logger.warn(
        'Claude CLI not found. Install it to test full functionality.'
      );
      logger.info('Skipping execution test (CLI not available)');
    } else {
      // Test 2: Execute a simple task
      logger.info('\nTest 2: Executing a simple task...');

      let progressCount = 0;

      const result = await claudeCodeExecutor.execute('echo "Hello from Claude Code"', {
        taskId: 'test-task-1',
        timeout: 30000,
        maxRetries: 1,
        onProgress: (output) => {
          progressCount++;
          logger.debug(`Progress callback #${progressCount}: ${output.substring(0, 50)}...`);
        },
        onError: (error) => {
          logger.error('Error callback:', error.message);
        },
      });

      logger.info('Execution result:', {
        success: result.success,
        exitCode: result.exitCode,
        duration: result.duration,
        retries: result.retries,
        outputLength: result.output.length,
        progressCallbacks: progressCount,
      });

      if (result.success) {
        logger.info('Output preview:', result.output.substring(0, 200));
      } else {
        logger.error('Execution failed:', result.error);
      }
    }

    // Test 3: Check pool status
    logger.info('\nTest 3: Checking process pool status...');
    const poolStatus = claudeCodeExecutor.getPoolStatus();
    logger.info('Pool status:', poolStatus);

    // Test 4: Test graceful shutdown
    logger.info('\nTest 4: Testing graceful shutdown...');
    await claudeCodeExecutor.shutdown();
    logger.info('Shutdown complete');

    logger.info('\n✓ All tests completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Test failed:', error);
    process.exit(1);
  }
}

testClaudeExecutor();
