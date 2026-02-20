# Task: 配置 Redis 连接

## 元数据
- **Task ID**: backend-1.5
- **Layer**: 1
- **Dependencies**: [0.1, 1.1, 1.2]
- **Parallel Group**: [1.1, 1.2, 1.3, 1.4, 1.5]
- **Estimated Complexity**: Medium

## 目标
配置 Redis 客户端（ioredis），实现连接管理、错误处理和重连机制，创建缓存服务工具类。

## 前置条件
- 项目已初始化（Task 0.1）
- ioredis 已安装（Task 1.1）
- 环境变量已配置（Task 1.2）

## 实现步骤

### 1. 创建 Redis 配置模块
创建 `src/config/redis.ts`：
```typescript
import Redis from 'ioredis';
import { config } from './env';
import logger from '@/utils/logger';

// 创建 Redis 客户端
const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

// 连接事件监听
redisClient.on('connect', () => {
  logger.info('Redis connecting...');
});

redisClient.on('ready', () => {
  logger.info('Redis connection ready');
});

redisClient.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

redisClient.on('close', () => {
  logger.warn('Redis connection closed');
});

redisClient.on('reconnecting', () => {
  logger.info('Redis reconnecting...');
});

// 测试连接
export async function connectRedis(): Promise<Redis> {
  try {
    await redisClient.ping();
    logger.info('Redis ping successful');
    return redisClient;
  } catch (error) {
    logger.error('Redis connection failed:', error);
    throw error;
  }
}

// 关闭连接
export async function closeRedis(): Promise<void> {
  try {
    await redisClient.quit();
    logger.info('Redis connection closed gracefully');
  } catch (error) {
    logger.error('Error closing Redis connection:', error);
    throw error;
  }
}

export { redisClient };
```

### 2. 创建缓存服务
创建 `src/services/cache.service.ts`：
```typescript
import { redisClient } from '@/config/redis';
import logger from '@/utils/logger';

export class CacheService {
  /**
   * 获取缓存值
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redisClient.get(key);
      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * 设置缓存值
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);

      if (ttl) {
        await redisClient.setex(key, ttl, serialized);
      } else {
        await redisClient.set(key, serialized);
      }
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * 删除缓存
   */
  async del(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      logger.error(`Cache del error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * 检查键是否存在
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * 设置过期时间
   */
  async expire(key: string, seconds: number): Promise<void> {
    try {
      await redisClient.expire(key, seconds);
    } catch (error) {
      logger.error(`Cache expire error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * 批量删除（通过模式匹配）
   */
  async delPattern(pattern: string): Promise<number> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length === 0) return 0;

      return await redisClient.del(...keys);
    } catch (error) {
      logger.error(`Cache delPattern error for pattern ${pattern}:`, error);
      throw error;
    }
  }
}

export const cacheService = new CacheService();
```

## 期望输出

### 新增文件
- `src/config/redis.ts`
- `src/services/cache.service.ts`

### 导出功能
- `redisClient`: ioredis 客户端实例
- `connectRedis()`: 连接测试函数
- `closeRedis()`: 关闭连接函数
- `cacheService`: 缓存服务单例

## 验证标准

### 1. 连接测试
```typescript
import { connectRedis } from '@/config/redis';

async function test() {
  await connectRedis();
  // 应该成功连接并打印 "Redis ping successful"
}

test();
```

### 2. 缓存操作验证
```typescript
import { cacheService } from '@/services/cache.service';

async function testCache() {
  // 设置缓存
  await cacheService.set('test:key', { value: 'hello' }, 60);

  // 获取缓存
  const result = await cacheService.get<{ value: string }>('test:key');
  console.log(result); // { value: 'hello' }

  // 检查存在
  const exists = await cacheService.exists('test:key');
  console.log(exists); // true

  // 删除缓存
  await cacheService.del('test:key');
}

testCache();
```

### 3. 重连机制验证
停止 Redis 服务，观察日志应该显示重连尝试

## Claude 执行 Prompt

请在 backend 项目中执行以下任务：

1. 创建 src/config/redis.ts，配置 ioredis：
   - 从环境变量读取 Redis 配置（host, port, password）
   - 配置重试策略：retryStrategy，最小延迟 50ms，最大 2000ms
   - 配置 maxRetriesPerRequest: 3
   - 添加事件监听：connect, ready, error, close, reconnecting
   - 实现 connectRedis() 和 closeRedis() 函数

2. 创建 src/services/cache.service.ts，实现缓存服务类：
   - get<T>(key): 获取并反序列化值
   - set(key, value, ttl?): 设置值，可选 TTL
   - del(key): 删除键
   - exists(key): 检查键是否存在
   - expire(key, seconds): 设置过期时间
   - delPattern(pattern): 批量删除（通过模式）

3. 导出：
   - redisClient 客户端实例
   - cacheService 服务单例

4. 验证 Redis 连接：
   - 运行 connectRedis()
   - 测试基本缓存操作（set, get, del）
   - 确认日志输出正常

确保 Redis 配置完整、重连机制正常、缓存服务可用。
