import { fileSystemMonitor } from '@/services/FileSystemMonitor';
import logger from '@/utils/logger';
import fs from 'fs';
import path from 'path';

/**
 * Quick verification test for File System Monitor
 * This test starts the monitor, creates/modifies/deletes a file, and verifies events
 */

async function runQuickTest() {
  logger.info('=== File System Monitor Quick Test ===');

  let createEventReceived = false;
  let updateEventReceived = false;
  let deleteEventReceived = false;

  // Start monitoring the test directory
  const testDir = './context/test-monitor';
  const testFile = path.join(testDir, 'test-file.txt');

  logger.info(`Starting monitor on: ${testDir}`);

  fileSystemMonitor.start(testDir, (event) => {
    logger.info(`✓ Event detected: ${event.type} - ${event.path}`);

    if (event.type === 'create') createEventReceived = true;
    if (event.type === 'update') updateEventReceived = true;
    if (event.type === 'delete') deleteEventReceived = true;
  });

  // Wait for monitor to be ready
  await new Promise((resolve) => setTimeout(resolve, 1000));

  logger.info('Testing file creation...');
  fs.writeFileSync(testFile, 'Hello World');

  // Wait for event processing
  await new Promise((resolve) => setTimeout(resolve, 1000));

  logger.info('Testing file modification...');
  fs.writeFileSync(testFile, 'Hello World Updated');

  // Wait for event processing
  await new Promise((resolve) => setTimeout(resolve, 1000));

  logger.info('Testing file deletion...');
  fs.unlinkSync(testFile);

  // Wait for event processing
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Stop monitor
  await fileSystemMonitor.stop();

  // Verify results
  logger.info('\n=== Test Results ===');
  logger.info(`Create event: ${createEventReceived ? '✓ PASS' : '✗ FAIL'}`);
  logger.info(`Update event: ${updateEventReceived ? '✓ PASS' : '✗ FAIL'}`);
  logger.info(`Delete event: ${deleteEventReceived ? '✓ PASS' : '✗ FAIL'}`);

  const allPassed =
    createEventReceived && updateEventReceived && deleteEventReceived;

  if (allPassed) {
    logger.info('\n✓ All tests passed!');
    process.exit(0);
  } else {
    logger.error('\n✗ Some tests failed!');
    process.exit(1);
  }
}

// Run the test
runQuickTest().catch((error) => {
  logger.error('Test failed with error:', error);
  process.exit(1);
});
