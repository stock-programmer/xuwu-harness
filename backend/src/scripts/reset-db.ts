import { sequelize } from '../config/database';
import logger from '../utils/logger';
import '../models';

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
