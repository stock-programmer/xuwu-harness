import http from 'http';
import { createApp } from './app';
import { config, validateConfig } from './config/env';
import logger from './utils/logger';
import { WebSocketServer } from './services/websocket/WebSocketServer';
import { WebSocketManager } from './services/websocket/WebSocketManager';
import { ProgressTracker } from './services/ProgressTracker';
import { connectDatabase, closeDatabase, syncDatabase, sequelize } from './config/database';
import { fileSystemMonitor } from './services/FileSystemMonitor';
import './models'; // Import all models to configure associations

async function bootstrap() {
  try {
    // Validate configuration
    validateConfig();

    logger.info('='.repeat(60));
    logger.info('Starting Claude Code Harness Backend...');
    logger.info(`Environment: ${config.env}`);
    logger.info(`Node version: ${process.version}`);
    logger.info('='.repeat(60));

    // Step 1: Connect to database
    logger.info('Step 1/4: Connecting to database...');
    await connectDatabase();

    // Step 2: Sync database schema (in development mode)
    if (config.env === 'development') {
      logger.info('Step 2/4: Syncing database schema...');
      // Use safe sync - only creates tables that don't exist, doesn't alter existing ones
      await syncDatabase({});
    } else {
      logger.info('Step 2/4: Skipping database sync (production mode)');
    }

    // Step 3: Create Express app (orchestrator 现在由每个项目动态创建)
    logger.info('Step 3/4: Creating Express application...');
    const app = createApp();
    logger.info('✓ Express application created');

    // Step 4: Create HTTP server
    logger.info('Step 4/4: Creating HTTP server...');
    const server = http.createServer(app);

    // Initialize WebSocket server with Manager
    logger.info('Initializing WebSocket server...');

    // Create WebSocketServer
    const wsServer = new WebSocketServer(server);
    logger.info('✓ WebSocket server initialized');

    // Create WebSocketManager with ProgressTracker
    // Note: WebSocketManager creates EventHandler internally and can accept a ProgressTracker
    const wsManager = new WebSocketManager(wsServer);
    logger.info('✓ WebSocket manager initialized');

    // Create ProgressTracker with WebSocketManager
    const progressTracker = new ProgressTracker(wsManager);
    logger.info('✓ ProgressTracker initialized');

    // Now we need to inject the ProgressTracker into the EventHandler
    // The EventHandler was created without ProgressTracker, so we need to update it
    const eventHandler = wsManager.getEventHandler();
    (eventHandler as any).progressTracker = progressTracker;
    logger.info('✓ ProgressTracker integrated with EventHandler');

    // Link EventHandler to WebSocketServer so it can route messages
    wsServer.setEventHandler(eventHandler);
    logger.info('✓ EventHandler linked to WebSocketServer');

    // Start file system monitor (optional - only if context directory exists)
    const contextDir = './context';
    try {
      fileSystemMonitor.start([contextDir], (event) => {
        logger.debug(`File ${event.type}: ${event.path}`);
        // TODO: Broadcast file changes via WebSocket
      });
      logger.info(`✓ File system monitor started for: ${contextDir}`);
    } catch (error) {
      logger.warn(`File system monitor not started: ${error}`);
    }

    // Start HTTP server
    server.listen(config.port, config.host, () => {
      logger.info('='.repeat(60));
      logger.info('✓ Server started successfully!');
      logger.info('-'.repeat(60));
      logger.info(`HTTP Server:       http://${config.host}:${config.port}`);
      logger.info(`API Endpoint:      http://${config.host}:${config.port}/api`);
      logger.info(`Health Check:      http://${config.host}:${config.port}/health`);
      logger.info(`WebSocket:         ws://${config.host}:${config.port}/ws`);
      logger.info('-'.repeat(60));
      logger.info(`Database:          ${config.database.type}`);
      logger.info('='.repeat(60));
    });

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      logger.info('='.repeat(60));
      logger.info(`${signal} received - initiating graceful shutdown...`);
      logger.info('='.repeat(60));

      // Stop accepting new connections
      server.close(async () => {
        logger.info('✓ HTTP server closed');

        // Close all services in reverse order
        try {
          // Stop file system monitor
          if (fileSystemMonitor.isWatching()) {
            await fileSystemMonitor.stop();
            logger.info('✓ File system monitor stopped');
          }

          // Close WebSocket server
          if (wsManager) {
            wsManager.cleanup();
            logger.info('✓ WebSocket manager cleaned up');
          }
          wsServer.close();
          logger.info('✓ WebSocket server closed');

          // Close database connection
          await closeDatabase();
          logger.info('✓ Database connection closed');

          logger.info('='.repeat(60));
          logger.info('✓ Graceful shutdown completed');
          logger.info('='.repeat(60));
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // Handle termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection:', { promise, reason });
      gracefulShutdown('UNHANDLED_REJECTION');
    });
  } catch (error) {
    logger.error('='.repeat(60));
    logger.error('✗ Failed to start server');
    logger.error('='.repeat(60));
    logger.error('Error:', error);
    process.exit(1);
  }
}

// Start the application
bootstrap();
