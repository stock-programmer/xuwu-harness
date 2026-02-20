# Task: 创建数据库迁移脚本

## 元数据
- **Task ID**: backend-2.2
- **Layer**: 2
- **Dependencies**: [2.1]
- **Parallel Group**: [2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7]
- **Estimated Complexity**: Medium

## 目标
创建数据库表结构迁移脚本，配置自动同步机制，确保数据库 schema 与模型定义保持一致。

## 前置条件
- 数据模型已定义（Task 2.1）
- Sequelize 已配置（Task 1.4）

## 实现步骤

### 1. 安装 Sequelize CLI（可选）
```bash
cd backend
npm install -D sequelize-cli
```

### 2. 创建数据库同步脚本
创建 `src/scripts/sync-db.ts`：
```typescript
import { sequelize } from '@/config/database';
import logger from '@/utils/logger';

// 导入所有模型以触发关联
import '@/models';

async function syncDatabase() {
  try {
    logger.info('Starting database synchronization...');

    // 在开发环境使用 alter，生产环境不使用
    const isDevelopment = process.env.NODE_ENV === 'development';

    await sequelize.sync({
      alter: isDevelopment, // 开发环境：自动修改表结构
      force: false,         // 永远不要强制删除表
    });

    logger.info('Database synchronized successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Database synchronization failed:', error);
    process.exit(1);
  }
}

syncDatabase();
```

### 3. 创建数据库重置脚本（仅开发环境）
创建 `src/scripts/reset-db.ts`：
```typescript
import { sequelize } from '@/config/database';
import logger from '@/utils/logger';
import '@/models';

async function resetDatabase() {
  if (process.env.NODE_ENV === 'production') {
    logger.error('Cannot reset database in production!');
    process.exit(1);
  }

  try {
    logger.warn('Resetting database (all data will be lost)...');

    await sequelize.sync({ force: true }); // 删除所有表并重建

    logger.info('Database reset completed');
    process.exit(0);
  } catch (error) {
    logger.error('Database reset failed:', error);
    process.exit(1);
  }
}

resetDatabase();
```

### 4. 创建数据库初始化脚本
创建 `src/scripts/init-db.ts`：
```typescript
import { sequelize } from '@/config/database';
import logger from '@/utils/logger';
import { Project } from '@/models/Project';
import '@/models';

async function initDatabase() {
  try {
    logger.info('Initializing database...');

    // 同步数据库
    await sequelize.sync({ alter: true });

    // 检查是否需要种子数据
    const projectCount = await Project.count();

    if (projectCount === 0) {
      logger.info('Creating seed data...');

      // 创建示例项目（如果需要）
      await Project.create({
        name: 'Example Project',
        type: 'fullstack',
        status: 'initializing',
        root_path: '/tmp/example',
      });

      logger.info('Seed data created');
    }

    logger.info('Database initialization completed');
    process.exit(0);
  } catch (error) {
    logger.error('Database initialization failed:', error);
    process.exit(1);
  }
}

initDatabase();
```

### 5. 添加 npm scripts
在 `package.json` 中添加：
```json
{
  "scripts": {
    "db:sync": "ts-node src/scripts/sync-db.ts",
    "db:reset": "ts-node src/scripts/reset-db.ts",
    "db:init": "ts-node src/scripts/init-db.ts"
  }
}
```

## 期望输出

### 新增文件
- `src/scripts/sync-db.ts`
- `src/scripts/reset-db.ts`
- `src/scripts/init-db.ts`

### 新增 npm scripts
- `db:sync`: 同步数据库结构
- `db:reset`: 重置数据库（仅开发）
- `db:init`: 初始化数据库和种子数据

## 验证标准

### 1. 数据库同步验证
```bash
npm run db:sync
```
预期：创建所有表，日志显示 "Database synchronized successfully"

### 2. 查看表结构
在 SQLite 中：
```bash
sqlite3 database.sqlite ".schema"
```
应该看到所有表的 CREATE 语句

### 3. 重置数据库验证（仅开发）
```bash
NODE_ENV=development npm run db:reset
```
预期：删除并重建所有表

### 4. 初始化验证
```bash
npm run db:init
```
预期：创建表并插入种子数据

## Claude 执行 Prompt

请在 backend 项目中执行以下任务：

1. 创建 src/scripts/ 目录

2. 创建 src/scripts/sync-db.ts：
   - 导入 sequelize 和所有模型
   - 实现 syncDatabase() 函数
   - 开发环境使用 alter: true
   - 永远不使用 force: true
   - 添加日志记录

3. 创建 src/scripts/reset-db.ts：
   - 检查不是生产环境
   - 使用 force: true 重建所有表
   - 警告会删除数据

4. 创建 src/scripts/init-db.ts：
   - 同步数据库
   - 检查表是否为空
   - 创建示例种子数据

5. 在 package.json 添加脚本：
   - db:sync, db:reset, db:init

6. 验证迁移脚本：
   - 运行 `npm run db:sync`
   - 检查数据库表是否创建
   - 运行 `npm run db:init`
   - 验证种子数据

确保数据库迁移脚本完整、安全、可重复执行。
