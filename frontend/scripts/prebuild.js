#!/usr/bin/env node

/**
 * Pre-build script
 * 在构建前执行的准备工作
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

/**
 * 生成版本信息
 */
function generateVersion() {
  const packageJsonPath = join(rootDir, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

  const version = {
    version: packageJson.version,
    buildTime: new Date().toISOString(),
    gitCommit: process.env.GITHUB_SHA || process.env.CI_COMMIT_SHA || 'unknown',
    gitBranch: process.env.GITHUB_REF_NAME || process.env.CI_COMMIT_BRANCH || 'unknown',
  };

  const versionPath = join(rootDir, 'public', 'version.json');
  writeFileSync(versionPath, JSON.stringify(version, null, 2));

  console.log('✓ Generated version.json');
  console.log(`  Version: ${version.version}`);
  console.log(`  Build Time: ${version.buildTime}`);
  console.log(`  Git Commit: ${version.gitCommit}`);
  console.log(`  Git Branch: ${version.gitBranch}`);
}

/**
 * 生成健康检查文件
 */
function generateHealthCheck() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };

  const healthPath = join(rootDir, 'public', 'health.json');
  writeFileSync(healthPath, JSON.stringify(health, null, 2));

  console.log('✓ Generated health.json');
}

/**
 * 检查环境变量
 */
function checkEnvironment() {
  const mode = process.env.MODE || process.env.NODE_ENV || 'production';
  console.log(`\n📦 Building for: ${mode}`);

  // 读取对应环境的 .env 文件
  const envFile = mode === 'production' ? '.env.production' : `.env.${mode}`;
  const envPath = join(rootDir, envFile);

  try {
    const envContent = readFileSync(envPath, 'utf-8');
    console.log(`✓ Using environment file: ${envFile}`);

    // 验证必需的环境变量
    const required = ['VITE_API_URL', 'VITE_WS_URL', 'VITE_APP_VERSION', 'VITE_ENV'];
    const lines = envContent.split('\n');
    const envVars = {};

    lines.forEach((line) => {
      const match = line.match(/^VITE_(\w+)=(.+)$/);
      if (match) {
        envVars[`VITE_${match[1]}`] = match[2];
      }
    });

    const missing = required.filter((key) => !envVars[key]);
    if (missing.length > 0) {
      console.error(`\n❌ Missing required environment variables: ${missing.join(', ')}`);
      process.exit(1);
    }

    console.log('✓ All required environment variables present');
  } catch (err) {
    console.warn(`⚠ Warning: Environment file ${envFile} not found`);
  }
}

/**
 * 清理旧构建产物
 */
function cleanBuildArtifacts() {
  console.log('✓ Ready to build (dist folder will be cleaned by Vite)');
}

/**
 * 主函数
 */
function main() {
  console.log('\n🔧 Running pre-build checks...\n');

  try {
    checkEnvironment();
    generateVersion();
    generateHealthCheck();
    cleanBuildArtifacts();

    console.log('\n✅ Pre-build completed successfully\n');
  } catch (error) {
    console.error('\n❌ Pre-build failed:', error.message);
    process.exit(1);
  }
}

main();
