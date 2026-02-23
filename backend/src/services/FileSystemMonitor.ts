import chokidar, { FSWatcher } from 'chokidar';
import path from 'path';
import logger from '@/utils/logger';

export type FileChangeType = 'create' | 'update' | 'delete';

export interface FileChangeEvent {
  type: FileChangeType;
  path: string;
  absolutePath: string;
  timestamp: Date;
}

export type FileChangeCallback = (event: FileChangeEvent) => void;

export class FileSystemMonitor {
  private watcher: FSWatcher | null = null;
  private callbacks: FileChangeCallback[] = [];
  private watchPaths: string[] = [];

  /**
   * 启动文件系统监控
   */
  start(paths: string | string[], callback?: FileChangeCallback): void {
    this.watchPaths = Array.isArray(paths) ? paths : [paths];

    if (callback) {
      this.callbacks.push(callback);
    }

    logger.info('Starting file system monitor...', {
      paths: this.watchPaths,
    });

    this.watcher = chokidar.watch(this.watchPaths, {
      ignored: [
        /(^|[\/\\])\../, // 忽略隐藏文件
        /node_modules/, // 忽略 node_modules
        /\.git/, // 忽略 .git
        /dist/, // 忽略 dist
        /build/, // 忽略 build
        /\.log$/, // 忽略日志文件
      ],
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 500, // 文件稳定后 500ms 再触发
        pollInterval: 100,
      },
      depth: 10, // 最大目录深度
    });

    // 监听文件添加
    this.watcher.on('add', (filePath: string) => {
      this.handleFileChange('create', filePath);
    });

    // 监听文件修改
    this.watcher.on('change', (filePath: string) => {
      this.handleFileChange('update', filePath);
    });

    // 监听文件删除
    this.watcher.on('unlink', (filePath: string) => {
      this.handleFileChange('delete', filePath);
    });

    // 监听目录添加
    this.watcher.on('addDir', (dirPath: string) => {
      logger.debug(`Directory created: ${dirPath}`);
    });

    // 监听目录删除
    this.watcher.on('unlinkDir', (dirPath: string) => {
      logger.debug(`Directory deleted: ${dirPath}`);
    });

    // 监听错误
    this.watcher.on('error', (error: unknown) => {
      logger.error('File system monitor error:', error);
    });

    // 监听就绪
    this.watcher.on('ready', () => {
      logger.info('File system monitor ready');
    });
  }

  /**
   * 处理文件变更
   */
  private handleFileChange(type: FileChangeType, filePath: string) {
    const event: FileChangeEvent = {
      type,
      path: filePath,
      absolutePath: path.resolve(filePath),
      timestamp: new Date(),
    };

    logger.debug(`File ${type}: ${filePath}`);

    // 触发所有回调
    this.callbacks.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        logger.error('File change callback error:', error);
      }
    });
  }

  /**
   * 添加回调函数
   */
  addCallback(callback: FileChangeCallback): void {
    this.callbacks.push(callback);
  }

  /**
   * 移除回调函数
   */
  removeCallback(callback: FileChangeCallback): void {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  /**
   * 添加监控路径
   */
  addPath(newPath: string): void {
    if (this.watcher) {
      this.watcher.add(newPath);
      this.watchPaths.push(newPath);
      logger.info(`Added path to file system monitor: ${newPath}`);
    }
  }

  /**
   * 移除监控路径
   */
  removePath(pathToRemove: string): void {
    if (this.watcher) {
      this.watcher.unwatch(pathToRemove);
      this.watchPaths = this.watchPaths.filter((p) => p !== pathToRemove);
      logger.info(`Removed path from file system monitor: ${pathToRemove}`);
    }
  }

  /**
   * 获取当前监控的路径
   */
  getWatchedPaths(): string[] {
    return [...this.watchPaths];
  }

  /**
   * 停止文件系统监控
   */
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
      this.callbacks = [];
      this.watchPaths = [];
      logger.info('File system monitor stopped');
    }
  }

  /**
   * 检查是否正在监控
   */
  isWatching(): boolean {
    return this.watcher !== null;
  }
}

// 导出单例
export const fileSystemMonitor = new FileSystemMonitor();
