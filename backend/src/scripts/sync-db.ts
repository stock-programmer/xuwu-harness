import { sequelize } from '../config/database';
import logger from '../utils/logger';

// 导入所有模型以触发关联
import '../models';

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
