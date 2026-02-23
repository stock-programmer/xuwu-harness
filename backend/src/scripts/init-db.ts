import { sequelize } from '../config/database';
import logger from '../utils/logger';
import { Project } from '../models/Project';
import '../models';

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
