import { Sequelize } from 'sequelize';
import { config } from './env';
import logger from '../utils/logger';

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
      max: 20, // 最大连接数
      min: 5, // 最小连接数
      acquire: 30000, // 获取连接超时时间（毫秒）
      idle: 10000, // 连接空闲超时时间（毫秒）
    },
  });
} else {
  throw new Error(`Unsupported database type: ${config.database.type}`);
}

// 测试数据库连接
export async function connectDatabase(): Promise<Sequelize> {
  try {
    await sequelize.authenticate();
    logger.info(
      `Database connection established successfully (${config.database.type})`
    );
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

// 同步数据库（开发环境）
export async function syncDatabase(
  options: { force?: boolean; alter?: boolean } = {}
) {
  try {
    await sequelize.sync(options);
    logger.info('Database synchronized successfully');
  } catch (error) {
    logger.error('Database sync failed:', error);
    throw error;
  }
}

export { sequelize };
