# Task: 配置 Winston 日志系统

## 元数据
- **Task ID**: backend-1.3
- **Layer**: 1
- **Dependencies**: [0.1, 1.1]
- **Parallel Group**: [1.1, 1.2, 1.3, 1.4, 1.5]
- **Estimated Complexity**: Medium

## 目标
配置 Winston 日志记录器，实现多级别日志、日志文件分离、日志轮转，支持开发和生产环境的不同日志策略。

## 前置条件
- 项目已初始化（Task 0.1）
- Winston 已安装（Task 1.1）

## 实现步骤

### 1. 创建日志工具模块
创建 `src/utils/logger.ts`：
```typescript
import winston from 'winston';
import path from 'path';
import { config } from '@/config/env';

const logDir = config.logging.dir;

// 创建 Winston logger
const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'claude-harness-backend' },
  transports: [
    // Error 日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined 日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// 开发环境添加控制台输出
if (config.env !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          ({ level, message, timestamp, ...meta }) => {
            const metaStr = Object.keys(meta).length
              ? JSON.stringify(meta, null, 2)
              : '';
            return `${timestamp} [${level}]: ${message} ${metaStr}`;
          }
        )
      ),
    })
  );
}

// 添加日志方法的类型定义
export interface Logger {
  error(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}

export default logger as Logger;
```

### 2. 创建日志目录
```bash
mkdir -p backend/logs
```

### 3. 创建日志辅助函数
在 `src/utils/logger.ts` 中添加：
```typescript
// 创建子 logger（用于特定模块）
export function createModuleLogger(moduleName: string) {
  return logger.child({ module: moduleName });
}

// 日志性能监控
export function logExecutionTime(label: string) {
  const start = Date.now();
  return () => {
    const duration = Date.now() - start;
    logger.info(`${label} execution time: ${duration}ms`);
  };
}
```

### 4. 更新 .gitignore
```
logs/
*.log
```

## 期望输出

### 文件结构
```
backend/
├── src/
│   └── utils/
│       └── logger.ts
├── logs/
│   ├── error.log
│   └── combined.log
└── ...
```

### 日志功能
- 多级别日志（error, warn, info, debug）
- 文件和控制台输出分离
- 日志文件自动轮转
- 结构化日志（JSON 格式）

## 验证标准

### 1. 日志记录验证
创建测试文件：
```typescript
import logger from '@/utils/logger';

logger.info('Test info log');
logger.error('Test error log', { errorCode: 500 });
logger.warn('Test warning', { user: 'test' });
logger.debug('Test debug log');
```

运行后检查：
- 控制台有彩色输出
- `logs/combined.log` 包含所有日志
- `logs/error.log` 只包含错误日志

### 2. 日志轮转验证
生成大量日志，验证文件大小超过 5MB 后会创建新文件

### 3. 模块日志验证
```typescript
import { createModuleLogger } from '@/utils/logger';

const dbLogger = createModuleLogger('database');
dbLogger.info('Database connected');
// 日志应包含 module: 'database'
```

## Claude 执行 Prompt

请在 backend 项目中执行以下任务：

1. 创建 src/utils/logger.ts，使用 Winston 配置日志系统：
   - 设置日志级别（从环境变量读取）
   - 配置日志格式（timestamp, errors, splat, json）
   - 添加文件传输器：
     * error.log（只记录 error 级别）
     * combined.log（记录所有级别）
   - 配置日志轮转（maxsize: 5MB, maxFiles: 5）
   - 开发环境添加控制台输出（彩色、格式化）

2. 创建辅助函数：
   - createModuleLogger()：创建带模块名的子 logger
   - logExecutionTime()：记录函数执行时间

3. 创建 logs 目录

4. 更新 .gitignore，忽略 logs/ 和 *.log

5. 验证日志系统：
   - 写入不同级别的日志
   - 检查 logs/error.log 和 logs/combined.log
   - 验证控制台输出有颜色
   - 验证日志包含时间戳和元数据

确保日志系统完整、支持轮转、格式化正确。
