/**
 * 环境配置模块
 * 提供统一的环境变量访问和验证
 */

export type Environment = 'development' | 'staging' | 'production';

export interface EnvConfig {
  apiUrl: string;
  wsUrl: string;
  appVersion: string;
  env: Environment;
  isDevelopment: boolean;
  isStaging: boolean;
  isProduction: boolean;
}

/**
 * 验证必需的环境变量
 */
const validateEnv = (): void => {
  const required = ['VITE_API_URL', 'VITE_WS_URL', 'VITE_APP_VERSION', 'VITE_ENV'];
  const missing = required.filter((key) => !import.meta.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env file configuration.'
    );
  }

  // 验证环境类型
  const validEnvs: Environment[] = ['development', 'staging', 'production'];
  if (!validEnvs.includes(import.meta.env.VITE_ENV)) {
    throw new Error(
      `Invalid VITE_ENV value: ${import.meta.env.VITE_ENV}\n` +
        `Must be one of: ${validEnvs.join(', ')}`
    );
  }
};

/**
 * 创建环境配置对象
 */
const createEnvConfig = (): EnvConfig => {
  validateEnv();

  const env = import.meta.env.VITE_ENV as Environment;

  return {
    apiUrl: import.meta.env.VITE_API_URL,
    wsUrl: import.meta.env.VITE_WS_URL,
    appVersion: import.meta.env.VITE_APP_VERSION,
    env,
    isDevelopment: env === 'development',
    isStaging: env === 'staging',
    isProduction: env === 'production',
  };
};

/**
 * 导出环境配置
 */
export const env = createEnvConfig();

/**
 * 输出环境信息（仅在非生产环境）
 */
if (!env.isProduction) {
  console.log('[ENV] Current environment configuration:', {
    env: env.env,
    apiUrl: env.apiUrl,
    wsUrl: env.wsUrl,
    version: env.appVersion,
  });
}

/**
 * 将环境信息挂载到 window 对象（用于调试）
 */
if (typeof window !== 'undefined') {
  window.__CLAUDE_HARNESS__ = {
    version: env.appVersion,
    env: env.env,
  };
}
