import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env file with fallback logic
// 1. Try .env first (created by claude)
// 2. Fall back to .env.${NODE_ENV}
const envPath = path.resolve(process.cwd(), '.env');
const envNodeEnvPath = path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}`);

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('Loaded .env file');
} else if (fs.existsSync(envNodeEnvPath)) {
  dotenv.config({ path: envNodeEnvPath });
  console.log(`Loaded ${envNodeEnvPath} file`);
} else {
  dotenv.config(); // Load default .env from current directory
  console.log('Loaded default .env');
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || 'localhost',

  database: {
    type: (process.env.DB_TYPE as 'sqlite' | 'postgres') || 'sqlite',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'claude_harness',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  },

  claude: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    maxConcurrent: parseInt(process.env.CLAUDE_MAX_CONCURRENT || '10', 10),
    timeout: parseInt(process.env.CLAUDE_TIMEOUT || '600000', 10),
  },

  websocket: {
    port: parseInt(process.env.WS_PORT || '3001', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || './logs',
  },
};

// 验证必需的环境变量
export function validateConfig() {
  if (config.env === 'production') {
    if (!config.claude.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required in production');
    }
    if (config.jwt.secret === 'your-secret-key-change-in-production') {
      throw new Error('JWT_SECRET must be set in production');
    }
  }
}
