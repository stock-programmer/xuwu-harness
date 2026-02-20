# Task: 实现文件系统监控服务

## 元数据
- **Task ID**: backend-2.6
- **Layer**: 2
- **Dependencies**: [1.1]
- **Parallel Group**: [2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7]
- **Estimated Complexity**: Medium

## 目标
使用 chokidar 实现文件系统监控，监听项目文件的创建、修改、删除事件，为实时文件更新通知打好基础。

## 前置条件
- chokidar 已安装（Task 1.1）

## 实现步骤

### 1. 创建文件系统监控服务
创建 `src/services/FileSystemMonitor.ts`：
```typescript
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
        /(^|[\/\\])\../,         // 忽略隐藏文件
        /node_modules/,          // 忽略 node_modules
        /\.git/,                 // 忽略 .git
        /dist/,                  // 忽略 dist
        /build/,                 // 忽略 build
        /\.log$/,                // 忽略日志文件
      ],
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 500,  // 文件稳定后 500ms 再触发
        pollInterval: 100,
      },
      depth: 10,                   // 最大目录深度
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
    this.watcher.on('error', (error: Error) => {
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
```

### 2. 创建测试示例
创建 `src/examples/fs-monitor-test.ts`（可选）：
```typescript
import { fileSystemMonitor } from '@/services/FileSystemMonitor';
import logger from '@/utils/logger';

// 启动监控
fileSystemMonitor.start(['./context', './src'], (event) => {
  logger.info('File change detected:', {
    type: event.type,
    path: event.path,
    timestamp: event.timestamp,
  });
});

// 10 秒后停止
setTimeout(async () => {
  await fileSystemMonitor.stop();
  process.exit(0);
}, 10000);
```

## 期望输出

### 新增文件
- `src/services/FileSystemMonitor.ts`

### 文件监控功能
- 监听文件创建、修改、删除
- 忽略规则（隐藏文件、node_modules 等）
- 写入稳定性检测
- 回调机制
- 路径动态添加/移除

## 验证标准

### 1. 基本监控验证
```typescript
import { fileSystemMonitor } from '@/services/FileSystemMonitor';

fileSystemMonitor.start('./context', (event) => {
  console.log(`File ${event.type}: ${event.path}`);
});

// 创建、修改、删除文件，应该收到事件
```

### 2. 忽略规则验证
```bash
# 创建隐藏文件，不应触发事件
echo "test" > ./context/.hidden

# 修改正常文件，应该触发事件
echo "test" > ./context/test.txt
```

### 3. 写入稳定性验证
快速多次写入同一文件，应该只触发一次事件（500ms 稳定后）

### 4. 停止监控验证
```typescript
await fileSystemMonitor.stop();
// 修改文件，不应触发事件
```

## Claude 执行 Prompt

请在 backend 项目中执行以下任务：

1. 创建 src/services/FileSystemMonitor.ts：
   - 定义类型：FileChangeType, FileChangeEvent, FileChangeCallback
   - 实现 FileSystemMonitor 类：
     * start()：启动监控，配置 chokidar
     * handleFileChange()：处理文件变更，触发回调
     * addCallback()、removeCallback()：管理回调函数
     * addPath()、removePath()：动态管理监控路径
     * getWatchedPaths()：获取监控路径列表
     * stop()：停止监控
     * isWatching()：检查监控状态

2. 配置 chokidar 选项：
   - ignored: 隐藏文件、node_modules、.git、dist、build、.log
   - awaitWriteFinish: stabilityThreshold 500ms
   - depth: 10

3. 监听事件：
   - add, change, unlink（文件）
   - addDir, unlinkDir（目录）
   - error, ready

4. 导出单例 fileSystemMonitor

5. 验证文件监控：
   - 启动监控 ./context
   - 创建、修改、删除文件
   - 验证事件触发
   - 验证忽略规则

确保文件系统监控完整、稳定、性能良好。
