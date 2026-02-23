import { fileService } from '../services/FileService';
import path from 'path';
import logger from '../utils/logger';

async function testFileService() {
  logger.info('Testing FileService...');

  try {
    // Test 1: Build file tree
    logger.info('Test 1: Building file tree...');
    const projectRoot = path.join(__dirname, '../..');
    const fileTree = await fileService.buildFileTree(projectRoot, 2);
    logger.info('File tree built successfully', {
      rootName: fileTree.name,
      childrenCount: fileTree.children?.length || 0,
    });

    // Test 2: Write file
    logger.info('Test 2: Writing test file...');
    const testFilePath = path.join(projectRoot, 'temp_test_file.txt');
    await fileService.writeFile(testFilePath, 'Hello from FileService!');
    logger.info('File written successfully');

    // Test 3: Read file
    logger.info('Test 3: Reading test file...');
    const content = await fileService.readFile(testFilePath);
    logger.info('File read successfully', { content });

    // Test 4: Delete file
    logger.info('Test 4: Deleting test file...');
    await fileService.deleteFile(testFilePath);
    logger.info('File deleted successfully');

    logger.info('All FileService tests passed!');
  } catch (error) {
    logger.error('FileService test failed', error);
    throw error;
  }
}

testFileService()
  .then(() => {
    logger.info('FileService test completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('FileService test failed with error', error);
    process.exit(1);
  });
