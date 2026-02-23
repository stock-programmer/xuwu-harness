import { fileSystemMonitor } from '@/services/FileSystemMonitor';
import logger from '@/utils/logger';

/**
 * File System Monitor Test Example
 *
 * This example demonstrates how to use the FileSystemMonitor service.
 * Run this file to test file system monitoring functionality.
 */

async function runTest() {
  logger.info('Starting File System Monitor Test...');

  // Start monitoring context and src directories
  fileSystemMonitor.start(['./context', './src'], (event) => {
    logger.info('File change detected:', {
      type: event.type,
      path: event.path,
      absolutePath: event.absolutePath,
      timestamp: event.timestamp,
    });
  });

  logger.info('File system monitor is now watching:');
  logger.info(`Watched paths: ${fileSystemMonitor.getWatchedPaths().join(', ')}`);
  logger.info('Try creating, modifying, or deleting files in ./context or ./src');
  logger.info('Monitor will automatically stop after 30 seconds...');

  // Stop after 30 seconds
  setTimeout(async () => {
    logger.info('Stopping file system monitor...');
    await fileSystemMonitor.stop();
    logger.info('File system monitor stopped');
    process.exit(0);
  }, 30000);
}

// Run the test
runTest().catch((error) => {
  logger.error('Test failed:', error);
  process.exit(1);
});
