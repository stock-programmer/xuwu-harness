import express, { Request, Response, NextFunction } from 'express';
import { AppError, errorHandler } from '../middleware/errorHandler';
import logger from '../utils/logger';

async function testErrorHandler() {
  logger.info('Testing Error Handler Middleware...');

  const app = express();
  app.use(express.json());

  // Test route 1: Throws AppError (operational error)
  app.get('/test-app-error', (req: Request, res: Response, next: NextFunction) => {
    next(new AppError(404, 'Resource not found'));
  });

  // Test route 2: Throws generic error (non-operational)
  app.get('/test-generic-error', (req: Request, res: Response, next: NextFunction) => {
    next(new Error('Something went wrong'));
  });

  // Test route 3: Success case
  app.get('/test-success', (req: Request, res: Response) => {
    res.json({ success: true, message: 'Success!' });
  });

  // Apply error handler middleware
  app.use(errorHandler);

  // Start test server
  const server = app.listen(0, () => {
    const address = server.address();
    const port = typeof address === 'object' && address !== null ? address.port : 0;
    logger.info(`Test server started on port ${port}`);

    // Run tests
    runTests(port)
      .then(() => {
        logger.info('All error handler tests passed!');
        server.close();
        process.exit(0);
      })
      .catch((error) => {
        logger.error('Error handler tests failed', error);
        server.close();
        process.exit(1);
      });
  });
}

async function runTests(port: number) {
  const baseUrl = `http://localhost:${port}`;

  // Test 1: AppError (404)
  logger.info('Test 1: Testing AppError (404)...');
  const response1 = await fetch(`${baseUrl}/test-app-error`);
  const data1 = (await response1.json()) as any;

  if (response1.status !== 404) {
    throw new Error(`Expected status 404, got ${response1.status}`);
  }
  if (data1.success !== false || data1.error !== 'Resource not found') {
    throw new Error(`Unexpected response: ${JSON.stringify(data1)}`);
  }
  logger.info('Test 1 passed: AppError handled correctly');

  // Test 2: Generic Error (500)
  logger.info('Test 2: Testing generic error (500)...');
  const response2 = await fetch(`${baseUrl}/test-generic-error`);
  const data2 = (await response2.json()) as any;

  if (response2.status !== 500) {
    throw new Error(`Expected status 500, got ${response2.status}`);
  }
  if (data2.success !== false) {
    throw new Error(`Unexpected response: ${JSON.stringify(data2)}`);
  }
  logger.info('Test 2 passed: Generic error handled correctly');

  // Test 3: Success case
  logger.info('Test 3: Testing success case...');
  const response3 = await fetch(`${baseUrl}/test-success`);
  const data3 = (await response3.json()) as any;

  if (response3.status !== 200) {
    throw new Error(`Expected status 200, got ${response3.status}`);
  }
  if (data3.success !== true) {
    throw new Error(`Unexpected response: ${JSON.stringify(data3)}`);
  }
  logger.info('Test 3 passed: Success case works correctly');
}

testErrorHandler();
