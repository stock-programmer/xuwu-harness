# Task: 配置 PostgreSQL 数据库连接（Sequelize）

## 元数据
- **Task ID**: backend-1.4
- **Layer**: 1
- **Dependencies**: [0.1, 1.1, 1.2]
- **Parallel Group**: [1.1, 1.2, 1.3, 1.4, 1.5]
- **Estimated Complexity**: Medium

## 目标
配置 Sequelize ORM，支持 SQLite（开发环境）和 PostgreSQL（生产环境）的自动切换，配置连接池，实现数据库连接测试。

## 前置条件
- 项目已初始化（Task 0.1）
- Sequelize 和数据库驱动已安装（Task 1.1）
- 环境变量已配置（Task 1.2）

## 实现步骤

### 1. 创建数据库配置模块
创建 `src/config/database.ts`：
```typescript
import { Sequelize } from 'sequelize';
import { config } from './env';
import logger from '@/utils/logger';

let sequelize: Sequelize;

// 根据环境选择数据库
if (config.database.type === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: (msg) => logger.debug(msg),
  });
} else if (config.database.type === 'postgres') {
  sequelize = new Sequelize({
    dialect: 'postgres',
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    username: config.database.user,
    password: config.database.password,
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 20,        // 最大连接数
      min: 5,         // 最小连接数
      acquire: 30000, // 获取连接超时时间（毫秒）
      idle: 10000,    // 连接空闲超时时间（毫秒）
    },
  });
} else {
  throw new Error(`Unsupported database type: ${config.database.type}`);
}

// 测试数据库连接
export async function connectDatabase(): Promise<Sequelize> {
  try {
    await sequelize.authenticate();
    logger.info(`Database connection established successfully (${config.database.type})`);
    return sequelize;
  } catch (error) {
    logger.error('Unable to connect to database:', error);
    throw error;
  }
}

// 关闭数据库连接
export async function closeDatabase(): Promise<void> {
  try {
    await sequelize.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
    throw error;
  }
}

export { sequelize };
```

### 2. 创建数据库初始化函数
在 `src/config/database.ts` 中添加：
```typescript
// 同步数据库（开发环境）
export async function syncDatabase(options: { force?: boolean; alter?: boolean } = {}) {
  try {
    await sequelize.sync(options);
    logger.info('Database synchronized successfully');
  } catch (error) {
    logger.error('Database sync failed:', error);
    throw error;
  }
}
```

### 3. 添加 .gitignore
```
database.sqlite
database.sqlite-journal
```

## 期望输出

### 新增文件
- `src/config/database.ts`

### 导出功能
- `sequelize`: Sequelize 实例
- `connectDatabase()`: 连接数据库函数
- `closeDatabase()`: 关闭连接函数
- `syncDatabase()`: 同步数据库函数

## 验证标准

### 1. 连接测试
```typescript
import { connectDatabase } from '@/config/database';

async function test() {
  await connectDatabase();
  // 应该成功连接并打印日志
}

test();
```

### 2. 环境切换验证
```bash
# 开发环境（SQLite）
DB_TYPE=sqlite npm run dev

# 生产环境（PostgreSQL）
DB_TYPE=postgres npm start
```

### 3. 查询测试
```typescript
import { sequelize } from '@/config/database';

const result = await sequelize.query('SELECT 1+1 AS result');
console.log(result); // 应该返回查询结果
```

## Claude 执行 Prompt

请在 backend 项目中执行以下任务：

1. 创建 src/config/database.ts，配置 Sequelize：
   - 从环境变量读取数据库配置
   - 支持两种数据库：
     * SQLite（开发环境）：dialect: 'sqlite', storage: './database.sqlite'
     * PostgreSQL（生产环境）：配置 host, port, database, username, password
   - 配置连接池（PostgreSQL）：
     * max: 20, min: 5, acquire: 30000, idle: 10000
   - 配置日志：使用 Winston logger.debug

2. 实现连接函数：
   - connectDatabase()：测试连接并打印成功消息
   - closeDatabase()：关闭连接
   - syncDatabase()：同步数据库模型

3. 导出 sequelize 实例

4. 更新 .gitignore，忽略 database.sqlite 文件

5. 验证数据库连接：
   - 在开发环境连接 SQLite
   - 运行简单查询测试
   - 确认日志输出正常

确保数据库配置完整、支持多环境、连接池配置正确。
